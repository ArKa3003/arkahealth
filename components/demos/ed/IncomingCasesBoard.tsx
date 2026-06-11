"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { EdCockpitCase } from "./ed-cockpit-cases";
import {
  ESI_EDGE_CLASS,
  ESI_LABEL,
  formatTimeSinceArrival,
  vitalsChips,
} from "./ed-cockpit-utils";

export interface IncomingCasesBoardProps {
  cases: EdCockpitCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  className?: string;
}

/**
 * Left rail — incoming triage cards with ESI edge, vitals, live arrival timer.
 */
export function IncomingCasesBoard({
  cases,
  selectedCaseId,
  onSelectCase,
  className,
}: IncomingCasesBoardProps) {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      className={cn("flex flex-col", className)}
      aria-label="Incoming cases"
    >
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-arka-slate-600">
        Incoming ({cases.length})
      </h2>

      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory",
          "lg:flex-col lg:overflow-visible lg:pb-0 lg:snap-none",
        )}
      >
        {cases.map((item) => {
          const isSelected = item.caseId === selectedCaseId;
          const chips = vitalsChips(item.case);
          const elapsed = formatTimeSinceArrival(item.arrivalMinutesAgo, tick);

          return (
            <button
              key={item.caseId}
              type="button"
              onClick={() => onSelectCase(item.caseId)}
              className={cn(
                "snap-start shrink-0 w-[min(100%,280px)] lg:w-full text-left",
                "rounded-lg border bg-white shadow-sm transition-all",
                "min-h-[148px] p-4 touch-manipulation",
                ESI_EDGE_CLASS[item.esiLevel],
                isSelected
                  ? "border-arka-teal-500 ring-2 ring-arka-teal-400/50 shadow-md"
                  : "border-arka-slate-200 hover:border-arka-teal-300 hover:shadow",
              )}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-arka-slate-500">
                  {ESI_LABEL[item.esiLevel]}
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-arka-slate-700">
                  {elapsed}
                </span>
              </div>

              <p className="text-base font-bold leading-snug text-arka-slate-900 line-clamp-2">
                {item.case.chief_complaint}
              </p>

              <p className="mt-1 text-sm font-medium text-arka-slate-600 line-clamp-1">
                {item.case.patient_age}y {item.case.patient_sex === "male" ? "M" : "F"}
              </p>

              {chips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {chips.slice(0, 4).map((chip) => (
                    <span
                      key={chip}
                      className="rounded bg-arka-slate-100 px-2 py-0.5 text-xs font-semibold text-arka-slate-700"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
