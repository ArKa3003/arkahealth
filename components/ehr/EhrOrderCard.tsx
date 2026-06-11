"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Copy, ExternalLink, Loader2, Zap } from "lucide-react";

import { ScoreRing } from "@/components/ui/score-ring";
import { generateMedicalNecessityNarrative } from "@/lib/aiie/requisition-autofill";
import { postRailEvent } from "@/lib/ehr/rail-telemetry";
import {
  buildWritebackServiceRequest,
  executeWriteback,
  type WritebackSession,
} from "@/lib/ehr/writeback";
import { evidenceUrl } from "@/lib/evidence/url";
import type { AIIEScore } from "@/lib/types/aiie";
import type { EhrImagingOrder } from "@/lib/ehr/order-mapper";
import { cn } from "@/lib/utils";

/** Order + its computed AIIE score, ready for rail rendering. */
export interface ScoredEhrOrder extends EhrImagingOrder {
  /** Result of the shared AIIE scoring engine for this order. */
  score: AIIEScore;
}

/** Props for one rail order card. */
export interface EhrOrderCardProps {
  /** Scored order to render. */
  order: ScoredEhrOrder;
  /** True when the rail runs from sandbox fixtures (no FHIR writes). */
  demoMode: boolean;
  /** SHA-256 hex of the patient id for audit events; null while hashing. */
  patientHash: string | null;
  /** Live SMART session for write-back; null in demo mode. */
  session: WritebackSession | null;
}

type ActionState =
  | { phase: "idle" }
  | { phase: "working" }
  | { phase: "accepted"; writtenBack: boolean }
  | { phase: "overridden" }
  | { phase: "error"; message: string };

/**
 * One-line recommendation derived from the appropriateness band.
 */
function recommendationLine(score: AIIEScore): string {
  if (score.clinicalScore >= 7) return "Appropriate — supports proceeding as ordered.";
  if (score.clinicalScore >= 4) return "Conditionally appropriate — review contributing factors.";
  return "Low appropriateness — consider alternatives before signing.";
}

function postFeedback(orderId: string, outcome: "accepted" | "overridden"): void {
  void fetch("/api/cds-services/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feedback: [{ card: orderId, outcome, outcomeTimestamp: new Date().toISOString() }],
      serviceId: "ehr-rail",
    }),
    keepalive: true,
  }).catch(() => {
    // Feedback is best-effort; the accept/override flow never blocks on it.
  });
}

/**
 * Compact order row for the embedded rail: mini score ring + one-line
 * recommendation, expanding to SHAP-style factor bars, the auto-generated
 * PA / medical-necessity narrative (copyable), evidence links, and explicit
 * accept / dismiss actions. Write-back to the EHR happens ONLY from the
 * accept click — every view, accept, and override is audited (no PHI).
 */
export function EhrOrderCard({ order, demoMode, patientHash, session }: EhrOrderCardProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<ActionState>({ phase: "idle" });
  const [copied, setCopied] = useState(false);
  const detailId = useId();
  const viewLogged = useRef(false);
  const { score } = order;

  const factors = [...score.factors]
    .filter((f) => f.contribution !== 0)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 5);
  const maxAbs = Math.max(0.01, ...factors.map((f) => Math.abs(f.contribution)));
  const slug = score.matrixMatch?.evidenceSlug;
  const matrixVersion = score.matrixMatch?.matrixVersion ?? "unknown";

  const narrative = useMemo(
    () =>
      generateMedicalNecessityNarrative({
        order: order.aiieInput.order,
        score,
        indication: order.reason,
        patient: { age: order.aiieInput.age, sex: order.aiieInput.sex },
      }),
    [order, score],
  );

  const logEvent = (
    eventType: "card_view" | "card_accept" | "card_override" | "narrative_generated" | "writeback_posted",
  ) => {
    if (!patientHash) return;
    postRailEvent(patientHash, {
      eventType,
      orderId: order.id,
      evidenceSlug: slug,
      matrixVersion,
      demoMode,
    });
  };

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next && !viewLogged.current) {
        viewLogged.current = true;
        logEvent("card_view");
        // The PA narrative is generated silently and becomes available here.
        logEvent("narrative_generated");
      }
      return next;
    });
  };

  const handleCopyNarrative = async () => {
    try {
      await navigator.clipboard.writeText(narrative.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable in the EHR frame; the text stays selectable.
    }
  };

  const handleAccept = async () => {
    if (action.phase === "working") return;
    setAction({ phase: "working" });

    const built = buildWritebackServiceRequest({
      serviceRequest: order.serviceRequest,
      aiieInput: order.aiieInput,
      score,
      acceptedAtISO: new Date().toISOString(),
    });
    if (built.error) {
      setAction({ phase: "error", message: built.error.message });
      return;
    }

    let writtenBack = false;
    if (session) {
      const result = await executeWriteback(session, built.data.resource);
      if (result.error) {
        setAction({ phase: "error", message: result.error.message });
        return;
      }
      writtenBack = true;
    }

    postFeedback(order.id, "accepted");
    logEvent("card_accept");
    if (writtenBack) logEvent("writeback_posted");
    setAction({ phase: "accepted", writtenBack });
  };

  const handleOverride = () => {
    if (action.phase === "working") return;
    postFeedback(order.id, "overridden");
    logEvent("card_override");
    setAction({ phase: "overridden" });
  };

  return (
    <li className="rounded-lg border border-arka-slate-200 bg-white">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={detailId}
        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-arka-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
      >
        <ScoreRing score={score.clinicalScore} size={36} animate className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-arka-slate-900">
              {order.procedure}
            </span>
            {order.expedite ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-100 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                <Zap className="h-2.5 w-2.5" aria-hidden />
                Expedite
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[12px] leading-snug text-arka-slate-600">
            {recommendationLine(score)}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 shrink-0 text-arka-slate-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={detailId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-arka-slate-100 px-3 py-2.5">
              <p className="text-[11px] leading-snug text-arka-slate-600">{order.reason}</p>

              <ul className="space-y-1.5" aria-label="Contributing factors">
                {factors.map((factor) => {
                  const positive = factor.contribution > 0;
                  const width = Math.max(8, Math.round((Math.abs(factor.contribution) / maxAbs) * 100));
                  return (
                    <li key={factor.id} className="text-[11px]">
                      <span className="flex items-center justify-between gap-2 text-arka-slate-700">
                        <span className="truncate">{factor.name}</span>
                        <span
                          className={cn(
                            "shrink-0 tabular-nums font-medium",
                            positive ? "text-emerald-700" : "text-red-700",
                          )}
                        >
                          {positive ? "+" : "−"}
                          {Math.abs(factor.contribution).toFixed(2)}
                        </span>
                      </span>
                      <span className="mt-0.5 block h-1 w-full overflow-hidden rounded-full bg-arka-slate-100">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            positive ? "bg-emerald-500" : "bg-red-500",
                          )}
                          style={{ width: `${width}%` }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Silent documentation assist: auto-generated PA narrative. */}
              <section
                aria-label="Prior authorization narrative"
                className="rounded-md border border-arka-slate-100 bg-arka-slate-50"
              >
                <div className="flex items-center justify-between gap-2 px-2.5 pt-2">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-arka-slate-500">
                    PA narrative — auto-generated
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyNarrative}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-arka-teal-700 transition-colors hover:bg-arka-teal-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" aria-hidden />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" aria-hidden />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap px-2.5 pb-2 pt-1 font-sans text-[10px] leading-snug text-arka-slate-600">
                  {narrative.text}
                </pre>
              </section>

              {slug ? (
                <a
                  href={evidenceUrl(slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-arka-teal-700 hover:text-arka-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
                >
                  View evidence basis
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}

              {/* Explicit clinician actions — write-back only happens here. */}
              {action.phase === "accepted" ? (
                <p className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-2 text-[11px] font-medium text-emerald-800">
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {action.writtenBack
                    ? "Accepted — optimized order written back to the EHR."
                    : "Accepted — demo mode, no write to the EHR."}
                </p>
              ) : action.phase === "overridden" ? (
                <p className="rounded-md bg-arka-slate-100 px-2.5 py-2 text-[11px] font-medium text-arka-slate-600">
                  Dismissed — recorded as overridden.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {action.phase === "error" ? (
                    <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
                      Write-back failed: {action.message}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAccept()}
                      disabled={action.phase === "working"}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-arka-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-arka-teal-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-1"
                    >
                      {action.phase === "working" ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      ) : (
                        <Check className="h-3 w-3" aria-hidden />
                      )}
                      Accept &amp; write back
                    </button>
                    <button
                      type="button"
                      onClick={handleOverride}
                      disabled={action.phase === "working"}
                      className="rounded-md border border-arka-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-arka-slate-600 transition-colors hover:bg-arka-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
