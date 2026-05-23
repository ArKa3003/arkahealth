"use client";

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { BookOpen, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  formatRarityDriverPlainEnglish,
  type RarityAssessment,
  type RarityDriver,
} from "@/lib/aiie/interesting-case";

export interface InterestingCaseBadgeProps {
  rarity: RarityAssessment;
  /** Total orders in the 365-day rarity corpus (for tooltip copy). */
  totalOrders?: number;
  onMarkInteresting: () => void;
  marking?: boolean;
}

function driverComboLabel(driver: RarityDriver): string {
  if (driver.examples && driver.examples.length > 0) {
    return driver.examples.join(" + ");
  }
  return "—";
}

function driverCountEstimate(driver: RarityDriver, totalOrders: number): number {
  const contribution = driver.contribution;
  if (contribution <= 0 || totalOrders <= 0) {
    return 1;
  }
  const approx = Math.max(1, Math.round(totalOrders * Math.pow(2, -contribution / 2)));
  return Math.min(approx, totalOrders);
}

/**
 * Post-read badge when a case sits in the top decile of rarity; opt-in teaching-queue action.
 */
export function InterestingCaseBadge({
  rarity,
  totalOrders = 42_110,
  onMarkInteresting,
  marking = false,
}: InterestingCaseBadgeProps) {
  if (!rarity.interesting) {
    return null;
  }

  const tooltipLines = rarity.drivers.slice(0, 3).map((d) =>
    formatRarityDriverPlainEnglish(d, totalOrders, driverComboLabel(d), driverCountEstimate(d, totalOrders)),
  );

  return (
    <Tooltip.Provider delayDuration={200}>
      <div
        className="flex flex-wrap items-center gap-3 rounded-lg border border-violet-200 bg-violet-50/90 px-4 py-3"
        role="status"
        aria-label="Interesting case candidate"
      >
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="inline-flex cursor-help items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              This case may be publishable / educational
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="bottom"
              className="z-50 max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 shadow-lg"
              sideOffset={6}
            >
              <p className="font-medium text-slate-900">{rarity.reasoning}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {tooltipLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Tooltip.Arrow className="fill-white" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <p className="min-w-0 flex-1 text-xs text-violet-900/90">
          Rare combination flagged for resident teaching or quality review. No patient identifiers are stored unless you
          opt in below.
        </p>

        <Button
          type="button"
          variant="secondary"
          className="shrink-0 gap-1.5 border-violet-200 text-violet-900 hover:bg-violet-100"
          onClick={onMarkInteresting}
          disabled={marking}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          {marking ? "Adding…" : "Add to teaching queue"}
        </Button>
      </div>
    </Tooltip.Provider>
  );
}
