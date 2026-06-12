"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronUp, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ClinicalScenario, EvaluationResult } from "@/lib/demos/clin/types";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultsRail } from "./ResultsRail";
import { getRecommendationState } from "./clin-cockpit-utils";

export interface MobileResultsSheetProps {
  result: EvaluationResult | null;
  scenario: ClinicalScenario | null;
  isLoading: boolean;
  onNewEvaluation: () => void;
  onSwitchOrder: (scenario: ClinicalScenario) => void;
}

/**
 * Sticky bottom summary bar on mobile — expands to full results sheet.
 */
export function MobileResultsSheet({
  result,
  scenario,
  isLoading,
  onNewEvaluation,
  onSwitchOrder,
}: MobileResultsSheetProps) {
  const [open, setOpen] = React.useState(false);

  if (!result && !isLoading) return null;

  const state = result ? getRecommendationState(result) : null;
  const stateLabel =
    state === "appropriate"
      ? "Appropriate"
      : state === "low-value"
        ? "Low value"
        : state === "conditional"
          ? "Conditional"
          : "Evaluating…";

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface shadow-elevation-4 lg:hidden",
          "safe-area-insets",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3 min-h-[56px] text-left"
          aria-expanded={open}
          aria-label="Expand results summary"
        >
          {result ? (
            <>
              <ScoreRing score={result.appropriatenessScore.value} size={48} label="" animate={false} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-arka-slate-900">{stateLabel}</p>
                <p className="truncate text-caption text-arka-slate-500">
                  Score {result.appropriatenessScore.value}/9 · Tap to expand
                </p>
              </div>
              <ChevronUp className="h-5 w-5 shrink-0 text-arka-slate-400" aria-hidden />
            </>
          ) : (
            <>
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <span className="text-sm text-arka-slate-600">Running evaluation…</span>
            </>
          )}
        </button>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm data-[state=open]:animate-fade-in lg:hidden" />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-radius-xl",
              "border border-border-subtle bg-surface p-4 shadow-elevation-4 outline-none lg:hidden",
              "data-[state=open]:animate-fade-in-up",
            )}
            aria-label="Evaluation results"
          >
            <div className="mb-4 flex items-center justify-between">
              <DialogPrimitive.Title className="text-h3 font-semibold text-arka-slate-900">
                AIIE Results
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-radius-md text-arka-slate-500 hover:bg-arka-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
            <ResultsRail
              result={result}
              scenario={scenario}
              isLoading={isLoading}
              onNewEvaluation={() => {
                setOpen(false);
                onNewEvaluation();
              }}
              onSwitchOrder={(s) => {
                setOpen(false);
                onSwitchOrder(s);
              }}
              compact
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
