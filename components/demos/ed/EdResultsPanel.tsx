"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ExternalLink, Scan } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { EdCockpitCase } from "./ed-cockpit-cases";
import type { EdCaseEvaluationBundle } from "./ed-cockpit-utils";
import { getImagingOptionById } from "./ed-cockpit-utils";
import { EdFactorBreakdown } from "./EdFactorBreakdown";

export interface EdResultsPanelProps {
  cockpitCase: EdCockpitCase | null;
  evaluation: EdCaseEvaluationBundle | null;
  isTransitioning: boolean;
  className?: string;
}

const DISPOSITION_STYLES = {
  proceed: "border-l-success bg-success-bg text-emerald-800",
  caution: "border-l-warning bg-warning-bg text-amber-900",
  defer: "border-l-danger bg-danger-bg text-red-800",
} as const;

/** Fixed-height results shell — skeleton crossfade prevents layout shift. */
const PANEL_MIN_H = "min-h-[640px]";

/**
 * Right rail — proposed order, instant AIIE score ring, red flags, disposition.
 */
export function EdResultsPanel({
  cockpitCase,
  evaluation,
  isTransitioning,
  className,
}: EdResultsPanelProps) {
  if (!cockpitCase) {
    return (
      <aside
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-arka-slate-300 bg-arka-slate-50",
          PANEL_MIN_H,
          className,
        )}
        aria-label="AIIE results"
      >
        <Scan className="h-10 w-10 text-arka-slate-400 mb-3" aria-hidden />
        <p className="text-base font-semibold text-arka-slate-600">
          Select a case to score
        </p>
        <p className="mt-1 text-sm text-arka-slate-500">
          AIIE resolves instantly — no queue delay
        </p>
      </aside>
    );
  }

  const option = getImagingOptionById(cockpitCase.proposedImagingId);
  const showSkeleton = isTransitioning || !evaluation;

  return (
    <aside
      className={cn(
        "relative rounded-xl border border-arka-slate-200 bg-white shadow-sm overflow-hidden",
        PANEL_MIN_H,
        evaluation?.expedite && "ed-stat-border",
        className,
      )}
      aria-label="AIIE results"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={cn("absolute inset-0 p-5 space-y-5", PANEL_MIN_H)}
            aria-busy="true"
          >
            <Skeleton className="h-6 w-2/3" />
            <div className="flex justify-center">
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
          </motion.div>
        ) : (
          <motion.div
            key={cockpitCase.caseId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-5 space-y-5 overflow-y-auto max-h-[640px]"
          >
            {/* Proposed order */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-arka-slate-500 mb-1">
                Proposed imaging order
              </p>
              <p className="text-lg font-bold text-arka-slate-900 leading-tight">
                {option?.short_name ?? cockpitCase.proposedImagingId}
              </p>
              <p className="text-sm font-medium text-arka-slate-600 mt-0.5">
                {option?.name}
              </p>
            </div>

            {/* Score ring — instant, animated stroke only */}
            <div className="flex flex-col items-center py-2">
              <ScoreRing
                score={evaluation.score.clinicalScore}
                size={140}
                label="AIIE"
                animate
              />
              <p className="mt-3 text-center text-sm font-medium text-arka-slate-600 max-w-xs">
                {evaluation.score.narrativeRationale}
              </p>
            </div>

            {/* Red flags */}
            {evaluation.redFlags.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-danger">
                    Red flags
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {evaluation.redFlags.map((flag) => (
                    <Link
                      key={flag.slug}
                      href={`/evidence/${flag.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-red-700 bg-danger-bg px-3 py-1.5 text-sm font-bold text-red-800 transition-colors hover:bg-red-700 hover:text-white"
                    >
                      {flag.label}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Disposition */}
            <div
              className={cn(
                "rounded-lg border-l-[6px] p-4",
                DISPOSITION_STYLES[evaluation.disposition.tone],
              )}
            >
              <p className="text-lg font-bold leading-snug">
                {evaluation.disposition.headline}
              </p>
              <p className="mt-1.5 text-sm font-medium opacity-90">
                {evaluation.disposition.detail}
              </p>
              {evaluation.expedite ? (
                <Badge variant="danger" className="mt-2 text-xs font-bold uppercase">
                  STAT pathway
                </Badge>
              ) : null}
            </div>

            {/* Factors */}
            <EdFactorBreakdown factors={evaluation.score.factors} />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
