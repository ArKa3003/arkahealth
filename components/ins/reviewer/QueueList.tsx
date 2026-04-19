"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import type { ReviewerQueueCase } from "@/lib/ins/reviewer-types";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/demos/ins/ui/Badge";

export interface QueueListProps {
  cases: ReviewerQueueCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

function slaLabel(deadlineAt: string): { text: string; urgent: boolean } {
  const end = new Date(deadlineAt).getTime();
  const hours = (end - Date.now()) / 3600000;
  if (hours <= 0) return { text: "SLA overdue", urgent: true };
  if (hours < 24) return { text: `${Math.ceil(hours)}h left`, urgent: true };
  return { text: `${Math.ceil(hours / 24)}d left`, urgent: false };
}

function riskTone(risk: number): "error" | "warning" | "info" | "success" {
  if (risk >= 65) return "error";
  if (risk >= 45) return "warning";
  if (risk >= 30) return "info";
  return "success";
}

/**
 * Left column: sortable queue with progressive disclosure (expand for AIIE narrative).
 */
export function QueueList({ cases, selectedId, onSelect, className }: QueueListProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <aside
      className={cn(
        "flex w-full max-w-[300px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/80",
        className,
      )}
    >
      <div className="border-b border-slate-200 px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review queue</h2>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          Sorted: SLA urgency, denial risk, then submission time.
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1" role="list">
        {cases.map((c) => {
          const selected = c.id === selectedId;
          const expanded = c.id === expandedId;
          const sla = slaLabel(c.slaDeadlineAt);
          const risk = riskTone(c.denialRisk);
          return (
            <li key={c.id}>
              <div
                className={cn(
                  "rounded-lg border transition-colors",
                  selected ? "border-arka-teal bg-white shadow-sm" : "border-transparent bg-white/60 hover:border-slate-200",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex w-full items-start gap-2 px-2 py-2 text-left"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-arka-teal/15 text-sm font-bold text-arka-teal"
                    aria-hidden
                  >
                    {c.payerDisplay.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Miller: at most 7 visible data points in collapsed summary */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-900">{c.patientInitials}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                        {c.cptCode}
                      </span>
                      <span className="truncate text-xs font-medium text-slate-600" title={c.payerDisplay}>
                        {c.payerDisplay}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        status={sla.urgent ? "error" : "neutral"}
                        variant="subtle"
                        size="sm"
                        dot
                        className="font-normal"
                      >
                        {sla.text}
                      </Badge>
                      <Badge status={risk} variant="subtle" size="sm" className="font-normal">
                        Risk {c.denialRisk}%
                      </Badge>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                        <Clock className="h-3 w-3" aria-hidden />
                        {formatDistanceToNowStrict(new Date(c.submittedAt), { addSuffix: true })}
                      </span>
                      {c.expedited && (
                        <Badge status="warning" variant="outline" size="sm">
                          EXP
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-1 border-t border-slate-100 px-2 py-1.5 text-left text-[11px] text-arka-teal hover:bg-slate-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId((id) => (id === c.id ? null : c.id));
                  }}
                  aria-expanded={expanded}
                >
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {expanded ? "Hide AIIE detail" : "Full AIIE explanation"}
                </button>
                {expanded && (
                  <div className="border-t border-slate-100 px-2 pb-2 pt-1 text-xs leading-relaxed text-slate-600">
                    {c.aiieNarrative}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
