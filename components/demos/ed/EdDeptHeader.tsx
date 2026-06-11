"use client";

import { Activity, Clock, ShieldCheck } from "lucide-react";

import { CountUpStat } from "@/components/landing/CountUpStat";
import { ED_DEPT_STATS } from "./ed-cockpit-utils";

/**
 * Persistent ED department stats strip — high-contrast, glanceable metrics.
 */
export function EdDeptHeader() {
  return (
    <header
      className="sticky top-0 z-20 border-b border-arka-slate-200 bg-arka-slate-900 text-white shadow-md"
      aria-label="Emergency department metrics"
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-danger px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
            ED Live
          </span>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">Incoming Imaging Queue</h1>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-10" role="list">
          <div className="flex items-center gap-2" role="listitem">
            <Activity className="h-5 w-5 text-arka-teal-300" aria-hidden />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-arka-slate-300">
                Cases scored today
              </p>
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                <CountUpStat value={ED_DEPT_STATS.casesScoredToday} duration={1200} />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" role="listitem">
            <Clock className="h-5 w-5 text-arka-teal-300" aria-hidden />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-arka-slate-300">
                Median time-to-decision
              </p>
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                <CountUpStat
                  value={ED_DEPT_STATS.medianTimeToDecisionSec}
                  decimals={1}
                  suffix="s"
                  duration={900}
                />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" role="listitem">
            <ShieldCheck className="h-5 w-5 text-arka-teal-300" aria-hidden />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-arka-slate-300">
                Low-value orders avoided
              </p>
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                <CountUpStat value={ED_DEPT_STATS.lowValueOrdersAvoided} duration={1100} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
