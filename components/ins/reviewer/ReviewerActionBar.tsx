"use client";

import * as React from "react";
import { Check, Clock, FileQuestion, X } from "lucide-react";

import type { ReviewerAction, ReviewerQueueCase } from "@/lib/ins/reviewer-types";
import { cn } from "@/lib/utils";

const OVERRIDE_REASONS = [
  { value: "align_aiie", label: "Align with AIIE recommendation" },
  { value: "policy_exception", label: "Plan policy exception" },
  { value: "peer_to_peer", label: "Peer-to-peer scheduled / needed" },
  { value: "documentation_gap", label: "Documentation gap" },
  { value: "financial_toxicity", label: "Patient financial toxicity" },
  { value: "other", label: "Other (explain in note)" },
] as const;

export interface ReviewerActionBarProps {
  caseRow: ReviewerQueueCase | null;
  onSubmitted: () => void;
}

/**
 * Fixed bottom action bar — approve, deny, pend with required note.
 */
export function ReviewerActionBar({ caseRow, onSubmitted }: ReviewerActionBarProps) {
  const [note, setNote] = React.useState("");
  const [overrideReason, setOverrideReason] = React.useState<string>(OVERRIDE_REASONS[0].value);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setNote("");
      setOverrideReason(OVERRIDE_REASONS[0].value);
      setError(null);
      setExpanded(false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [caseRow?.id]);

  const submit = async (action: ReviewerAction) => {
    if (!caseRow) return;
    const trimmed = note.trim();
    if (!trimmed) {
      setError("A note is required before submitting.");
      setExpanded(true);
      return;
    }

    if (action === "deny") {
      const ok = window.confirm("Confirm deny disposition for this case (demo).");
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
          minutesOnCase: 1,
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

  return (
    <div className="sticky bottom-0 z-20 border-t border-border-subtle bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
        {expanded ? (
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="reviewer-note-bar" className="text-xs font-semibold text-arka-slate-700">
                Reviewer note (required)
              </label>
              <textarea
                id="reviewer-note-bar"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-radius-md border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
                placeholder="Document rationale; avoid patient identifiers."
              />
            </div>
            <div>
              <label htmlFor="override-reason-bar" className="text-xs font-semibold text-arka-slate-700">
                Override reason
              </label>
              <select
                id="override-reason-bar"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="mt-1 w-full rounded-radius-md border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              >
                {OVERRIDE_REASONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!caseRow || submitting}
            onClick={() => {
              setExpanded(true);
              void submit("approve");
            }}
            className={cn(
              "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-radius-md px-4 text-sm font-semibold sm:flex-none sm:min-w-[140px]",
              "bg-success text-white hover:opacity-95 disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2",
            )}
          >
            <Check className="h-4 w-4" aria-hidden />
            Approve
          </button>
          <button
            type="button"
            disabled={!caseRow || submitting}
            onClick={() => {
              setExpanded(true);
              void submit("deny");
            }}
            className={cn(
              "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-radius-md px-4 text-sm font-semibold sm:flex-none sm:min-w-[120px]",
              "bg-danger text-white hover:opacity-95 disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2",
            )}
          >
            <X className="h-4 w-4" aria-hidden />
            Deny
          </button>
          <button
            type="button"
            disabled={!caseRow || submitting}
            onClick={() => {
              setExpanded(true);
              void submit("pend");
            }}
            className={cn(
              "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-radius-md border border-border-strong bg-surface px-4 text-sm font-semibold sm:flex-none sm:min-w-[120px]",
              "hover:bg-surface-sunken disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
            )}
          >
            <Clock className="h-4 w-4" aria-hidden />
            Pend
          </button>
          <button
            type="button"
            disabled={!caseRow || submitting}
            onClick={() => setExpanded((e) => !e)}
            className={cn(
              "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-radius-md border border-border-subtle px-3 text-sm font-medium",
              "text-arka-slate-600 hover:bg-surface-sunken disabled:opacity-40",
            )}
            aria-expanded={expanded}
          >
            <FileQuestion className="h-4 w-4" aria-hidden />
            Note
          </button>
          {caseRow ? (
            <p className="ml-auto hidden text-caption text-arka-slate-500 sm:block">
              AIIE: {caseRow.aiieRecommendationLabel} ({caseRow.aiieRecommendationConfidencePct}%)
            </p>
          ) : (
            <p className="text-caption text-arka-slate-400">Select a case from the queue</p>
          )}
        </div>
      </div>
    </div>
  );
}
