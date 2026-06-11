"use client";

import * as React from "react";
import { formatDistanceToNowStrict } from "date-fns";

import type { ReviewerQueueCase } from "@/lib/ins/reviewer-types";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { cn } from "@/lib/utils";

import { SlaCountdownChip } from "./SlaCountdownChip";

export interface QueueListProps {
  cases: ReviewerQueueCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

function riskVariant(risk: number): "danger" | "warning" | "info" | "success" {
  if (risk >= 65) return "danger";
  if (risk >= 45) return "warning";
  if (risk >= 30) return "info";
  return "success";
}

/**
 * Work queue list — SLA chips, denial risk, and AIIE mini gauge per row.
 */
export function QueueList({ cases, selectedId, onSelect, className }: QueueListProps) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col overflow-hidden rounded-radius-lg border border-border-subtle bg-surface-raised shadow-elevation-1",
        className,
      )}
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold text-arka-slate-900">Review queue</h2>
        <p className="mt-0.5 text-caption text-arka-slate-500">
          Sorted by SLA urgency, denial risk, submission time
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2" role="listbox" aria-label="Cases awaiting review">
        {cases.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-arka-slate-500">Queue empty</li>
        ) : (
          cases.map((c) => {
            const selected = c.id === selectedId;
            return (
              <li key={c.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "mb-1 w-full rounded-radius-md border px-3 py-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
                    selected
                      ? "border-arka-teal-300 bg-arka-teal-50"
                      : "border-transparent hover:border-border-subtle hover:bg-surface-sunken",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <ScoreRing score={c.clinical.score} size={36} label="" animate={false} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-arka-slate-900">{c.patientInitials}</span>
                        <span className="rounded-radius-sm bg-arka-slate-100 px-1.5 py-0.5 font-mono text-xs text-arka-slate-700">
                          {c.cptCode}
                        </span>
                        <span className="truncate text-xs text-arka-slate-600">{c.payerDisplay}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <SlaCountdownChip deadlineAt={c.slaDeadlineAt} expedited={c.expedited} />
                        <Badge variant={riskVariant(c.denialRisk)} className="font-normal">
                          Risk {c.denialRisk}%
                        </Badge>
                        {c.expedited ? (
                          <Badge variant="warning" className="font-normal">
                            EXP
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-arka-slate-500">
                        Submitted {formatDistanceToNowStrict(new Date(c.submittedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
