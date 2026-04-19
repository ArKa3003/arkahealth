"use client";

import * as React from "react";
import { Timer } from "lucide-react";

import type { ReviewerAction, ReviewerQueueCase } from "@/lib/ins/reviewer-types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/demos/ins/ui/Button";
import { Badge } from "@/components/demos/ins/ui/Badge";

const OVERRIDE_REASONS = [
  { value: "align_aiie", label: "Align with AIIE recommendation" },
  { value: "policy_exception", label: "Plan policy exception" },
  { value: "peer_to_peer", label: "Peer-to-peer scheduled / needed" },
  { value: "documentation_gap", label: "Documentation gap" },
  { value: "financial_toxicity", label: "Patient financial toxicity" },
  { value: "other", label: "Other (explain in note)" },
] as const;

export interface ActionPanelProps {
  caseRow: ReviewerQueueCase | null;
  onSubmitted: () => void;
  className?: string;
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Right column: five equal actions, required note, override reason, AIIE nudge, social proof, timers.
 */
export function ActionPanel({ caseRow, onSubmitted, className }: ActionPanelProps) {
  const [note, setNote] = React.useState("");
  const [overrideReason, setOverrideReason] = React.useState<string>(OVERRIDE_REASONS[0].value);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [caseSeconds, setCaseSeconds] = React.useState(0);
  const caseStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setNote("");
    setOverrideReason(OVERRIDE_REASONS[0].value);
    setError(null);
    caseStartRef.current = Date.now();
    setCaseSeconds(0);
    const id = window.setInterval(() => {
      if (caseStartRef.current) {
        setCaseSeconds(Math.floor((Date.now() - caseStartRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [caseRow?.id]);

  const minutesOnCase = caseSeconds / 60;

  const submit = async (action: ReviewerAction) => {
    if (!caseRow) return;
    const trimmed = note.trim();
    if (!trimmed) {
      setError("A note is required before you can submit a disposition.");
      return;
    }
    if (!overrideReason) {
      setError("Select an override reason.");
      return;
    }

    if (action === "deny") {
      const ok = window.confirm(
        "Deny will record a denial disposition for this case (demo). Confirm you intend to deny.",
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ins/reviewer/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseRow.id,
          cptCode: caseRow.cptCode,
          payerId: caseRow.payerId,
          action,
          note: trimmed,
          overrideReason,
          minutesOnCase,
          providerId: caseRow.providerId,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Action failed");
      }
      onSubmitted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const actionClass =
    "w-full justify-center border-2 border-slate-300 bg-white text-slate-900 shadow-none hover:bg-slate-50 hover:border-slate-400";

  return (
    <aside
      className={cn(
        "flex w-full max-w-[360px] shrink-0 flex-col border-l border-slate-200 bg-slate-50/80",
        className,
      )}
    >
      <div className="border-b border-slate-200 px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</h2>
        <p className="mt-1 text-[11px] text-slate-500">No default — choose explicitly. All options carry equal weight.</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {!caseRow && <p className="text-sm text-slate-500">Select a case to enable actions.</p>}

        {caseRow && (
          <>
            <div className="space-y-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={actionClass}
                disabled={submitting}
                onClick={() => void submit("approve")}
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={actionClass}
                disabled={submitting}
                onClick={() => void submit("approve_with_note")}
              >
                Approve with note
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={actionClass}
                disabled={submitting}
                onClick={() => void submit("request_dtr")}
              >
                Request DTR
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={actionClass}
                disabled={submitting}
                onClick={() => void submit("pend")}
              >
                Pend
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={actionClass}
                disabled={submitting}
                onClick={() => void submit("deny")}
              >
                Deny
              </Button>
            </div>

            <div>
              <label htmlFor="reviewer-note" className="text-xs font-semibold text-slate-700">
                Reviewer note (required)
              </label>
              <textarea
                id="reviewer-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-arka-teal/40"
                placeholder="Document rationale; avoid patient identifiers."
              />
            </div>

            <div>
              <label htmlFor="override-reason" className="text-xs font-semibold text-slate-700">
                Override reason
              </label>
              <select
                id="override-reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-arka-teal/40"
              >
                {OVERRIDE_REASONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-rose-700">{error}</p>}

            <div className="space-y-2 border-t border-slate-200 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Nudge (non-submitting)</p>
              <Badge status="info" variant="subtle" size="md" className="w-full justify-center py-2 font-normal">
                AIIE recommendation: {caseRow.aiieRecommendationLabel} ({caseRow.aiieRecommendationConfidencePct}%
                confidence)
              </Badge>
              <p className="text-xs leading-relaxed text-slate-600">
                Similar cases this week (this CPT + payer):{" "}
                <span className="font-medium text-slate-900">
                  {caseRow.socialProof.approved} approved, {caseRow.socialProof.denied} denied
                </span>
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Timer className="h-4 w-4 text-arka-teal" aria-hidden />
                <span>
                  Time on case: <span className="font-mono font-medium text-slate-900">{formatElapsed(caseSeconds)}</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
