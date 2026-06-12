"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  ExternalLink,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { ACRRatingBadge } from "@/components/demos/ed/ACRRatingBadge";
import { EdFactorBreakdown } from "@/components/demos/ed/EdFactorBreakdown";
import { RadiationBadge } from "@/components/demos/ed/RadiationBadge";
import type { EdCaseEvaluationBundle } from "@/components/demos/ed/ed-cockpit-utils";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/score-ring";
import {
  CATEGORY_EVIDENCE_SLUG,
  type PracticeCaseResult,
} from "@/lib/demos/ed/practice-utils";
import type { Case, CaseImagingRating, ImagingOption } from "@/lib/demos/ed/types";
import { cn } from "@/lib/utils";

export interface PracticeFeedbackPanelProps {
  caseData: Case;
  selectedImagingIds: string[];
  imagingOptions: ImagingOption[];
  ratings: CaseImagingRating[];
  evaluation: EdCaseEvaluationBundle;
  isCorrect: boolean;
  acrRating: number;
  onNextScenario: () => void;
  onTryAgain: () => void;
  hasNextScenario: boolean;
  className?: string;
}

const fadeTransition = { duration: 0.35, ease: "easeOut" as const };

/**
 * Post-answer reveal — AIIE score rings per option, factor breakdown, and evidence links.
 */
export function PracticeFeedbackPanel({
  caseData,
  selectedImagingIds,
  imagingOptions,
  ratings,
  evaluation,
  isCorrect,
  acrRating,
  onNextScenario,
  onTryAgain,
  hasNextScenario,
  className,
}: PracticeFeedbackPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const feedbackHeadingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    feedbackHeadingRef.current?.focus();
  }, []);

  const evidenceSlug = CATEGORY_EVIDENCE_SLUG[caseData.category];
  const optimalIds = new Set(caseData.optimal_imaging);
  const selectedId = selectedImagingIds[0] ?? null;

  const ratedOptions = React.useMemo(() => {
    const rows: Array<{
      id: string;
      label: string;
      acrRating: number;
      radiation: number;
      cost: number;
      isUserChoice: boolean;
      isOptimal: boolean;
    }> = [];

    for (const rating of ratings) {
      if (rating.imaging_option_id === "no-imaging") {
        rows.push({
          id: "no-imaging",
          label: "No imaging — clinical observation",
          acrRating: rating.acr_rating,
          radiation: 0,
          cost: 0,
          isUserChoice: selectedId === "no-imaging",
          isOptimal: optimalIds.size === 0 || optimalIds.has("no-imaging"),
        });
        continue;
      }

      const option = imagingOptions.find(
        (entry) => entry.id === rating.imaging_option_id,
      );
      if (!option) continue;

      rows.push({
        id: option.id,
        label: option.short_name,
        acrRating: rating.acr_rating,
        radiation: option.radiation_msv,
        cost: option.typical_cost_usd,
        isUserChoice: selectedId === option.id,
        isOptimal: optimalIds.has(option.id),
      });
    }

    return rows.sort((a, b) => b.acrRating - a.acrRating);
  }, [ratings, imagingOptions, selectedId, optimalIds]);

  const ResultIcon = isCorrect ? CheckCircle : XCircle;

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeTransition}
      className={cn("space-y-6", className)}
      aria-labelledby="practice-feedback-heading"
    >
      <div
        className={cn(
          "rounded-radius-lg border p-6 text-center",
          isCorrect
            ? "border-arka-teal-300 bg-arka-teal-50"
            : "border-warning bg-warning-bg",
        )}
      >
        <ResultIcon
          className={cn(
            "mx-auto mb-3 h-12 w-12",
            isCorrect ? "text-success" : "text-warning",
          )}
          aria-hidden
        />
        <h2
          id="practice-feedback-heading"
          ref={feedbackHeadingRef}
          tabIndex={-1}
          className="text-h3 font-semibold text-arka-slate-900 outline-none"
        >
          {isCorrect ? "Correct — well chosen" : "Review the optimal approach"}
        </h2>
        <p className="mt-2 text-arka-slate-600">
          Your choice scored{" "}
          <ACRRatingBadge rating={acrRating} size="sm" className="inline-flex" />{" "}
          on the ACR 1–9 scale.
        </p>
      </div>

      <div className="rounded-radius-lg border border-border-subtle bg-surface p-5 shadow-elevation-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-arka-slate-600">
          AIIE scores by option
        </h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {ratedOptions.map((option, index) => (
            <motion.li
              key={option.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...fadeTransition, delay: prefersReducedMotion ? 0 : index * 0.06 }}
              className={cn(
                "rounded-radius-md border p-4",
                option.isUserChoice && "border-arka-teal-500 ring-2 ring-arka-teal-500/30",
                option.isOptimal && !option.isUserChoice && "border-success bg-success-bg/40",
                !option.isUserChoice && !option.isOptimal && "border-border-subtle bg-surface-sunken",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-arka-slate-900">{option.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {option.isUserChoice ? (
                      <span className="rounded-full bg-arka-teal-100 px-2 py-0.5 text-xs font-semibold text-arka-teal-800">
                        Your choice
                      </span>
                    ) : null}
                    {option.isOptimal ? (
                      <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
                        Optimal
                      </span>
                    ) : null}
                  </div>
                </div>
                <ScoreRing score={option.acrRating} size={72} label="AIIE" animate />
              </div>
              {option.id !== "no-imaging" ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-arka-slate-600">
                  <ACRRatingBadge rating={option.acrRating} size="sm" />
                  <span>${option.cost.toLocaleString()}</span>
                  <RadiationBadge doseMsv={option.radiation} />
                </div>
              ) : (
                <div className="mt-3">
                  <ACRRatingBadge rating={option.acrRating} size="sm" />
                </div>
              )}
            </motion.li>
          ))}
        </ul>
      </div>

      <EdFactorBreakdown factors={evaluation.score.factors} />

      <div className="rounded-radius-lg border border-border-subtle bg-surface p-5 shadow-elevation-1">
        <h3 className="flex items-center gap-2 text-base font-semibold text-arka-slate-900">
          <BookOpen className="h-4 w-4 text-arka-teal-600" aria-hidden />
          Why this matters
        </h3>
        <p className="mt-3 whitespace-pre-wrap text-arka-slate-700 leading-relaxed">
          {caseData.explanation}
        </p>
        <Link
          href={`/evidence/${evidenceSlug}`}
          className="mt-4 inline-flex min-h-[44px] touch-manipulation items-center gap-2 rounded-radius-md border border-arka-teal-300 bg-arka-teal-50 px-4 py-2 text-sm font-semibold text-arka-teal-800 transition-colors hover:bg-arka-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          Review evidence topic
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={onTryAgain}
          className="min-h-[44px] touch-manipulation gap-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        {hasNextScenario ? (
          <Button
            variant="premium"
            onClick={onNextScenario}
            className="min-h-[44px] touch-manipulation gap-2"
          >
            Next scenario
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button
            variant="premium"
            onClick={onNextScenario}
            className="min-h-[44px] touch-manipulation gap-2"
          >
            View session summary
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {isCorrect ? "Answer marked correct." : "Answer marked incorrect."} AIIE
        feedback is now visible.
      </p>
    </motion.section>
  );
}

export interface PracticeSummaryProps {
  results: PracticeCaseResult[];
  cases: Array<{ caseId: string; case: Case }>;
  onRestart: () => void;
  onBackToPicker: () => void;
  showCompletionPulse: boolean;
  className?: string;
}

/**
 * End-of-set recap with per-case results and evidence links.
 */
export function PracticeSummary({
  results,
  cases,
  onRestart,
  onBackToPicker,
  showCompletionPulse,
  className,
}: PracticeSummaryProps) {
  const prefersReducedMotion = useReducedMotion();
  const correctCount = results.filter((result) => result.isCorrect).length;

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeTransition}
      className={cn("mx-auto max-w-3xl space-y-6", className)}
      aria-labelledby="practice-summary-heading"
    >
      <div className="relative overflow-hidden rounded-radius-lg border border-border-subtle bg-surface-dark p-8 text-center shadow-elevation-2">
        {showCompletionPulse && !prefersReducedMotion ? (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-radius-lg border-2 border-arka-teal-400"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            aria-hidden
          />
        ) : null}
        <h2
          id="practice-summary-heading"
          className="text-h2 font-semibold text-white"
        >
          Session complete
        </h2>
        <p className="mt-2 text-arka-slate-300">
          You answered {results.length} scenario{results.length === 1 ? "" : "s"} with{" "}
          {correctCount} correct.
        </p>
      </div>

      <ul className="space-y-3">
        {results.map((result) => {
          const cockpitCase = cases.find((entry) => entry.caseId === result.caseId);
          if (!cockpitCase) return null;
          const evidenceSlug = CATEGORY_EVIDENCE_SLUG[cockpitCase.case.category];

          return (
            <li
              key={result.caseId}
              className="flex flex-col gap-3 rounded-radius-md border border-border-subtle bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-arka-slate-900">
                  {cockpitCase.case.title}
                </p>
                <p className="mt-0.5 text-sm text-arka-slate-600">
                  {result.isCorrect ? "Correct" : "Review recommended"} · ACR{" "}
                  {result.acrRating}/9
                </p>
              </div>
              <Link
                href={`/evidence/${evidenceSlug}`}
                className="inline-flex min-h-[44px] touch-manipulation items-center gap-2 text-sm font-semibold text-arka-teal-700 hover:text-arka-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              >
                Review evidence
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={onBackToPicker}
          className="min-h-[44px] touch-manipulation"
        >
          Choose another scenario
        </Button>
        <Button
          variant="premium"
          onClick={onRestart}
          className="min-h-[44px] touch-manipulation"
        >
          Start fresh session
        </Button>
      </div>
    </motion.section>
  );
}
