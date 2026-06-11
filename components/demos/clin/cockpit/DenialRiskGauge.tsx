"use client";

import { cn } from "@/lib/utils";
import { computeDenialRisk } from "./clin-cockpit-utils";

export interface DenialRiskGaugeProps {
  /** AIIE appropriateness score 1–9; denial risk is computed inversely. */
  aiieScore: number;
  className?: string;
}

/**
 * Inverse denial-risk horizontal gauge — lower appropriateness yields higher denial risk.
 */
export function DenialRiskGauge({ aiieScore, className }: DenialRiskGaugeProps) {
  const denialRisk = computeDenialRisk(aiieScore);
  const band =
    denialRisk <= 25 ? "success" : denialRisk <= 55 ? "warning" : "danger";
  const fillClass =
    band === "success"
      ? "bg-success"
      : band === "warning"
        ? "bg-warning"
        : "bg-danger";
  const textClass =
    band === "success"
      ? "text-success"
      : band === "warning"
        ? "text-warning"
        : "text-danger";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-caption font-medium text-arka-slate-600">
          Denial risk (inverse)
        </span>
        <span className={cn("text-h3 font-semibold tabular-nums", textClass)}>
          {denialRisk}%
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-arka-slate-100"
        role="meter"
        aria-valuenow={denialRisk}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Denial risk ${denialRisk} percent`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", fillClass)}
          style={{ width: `${denialRisk}%` }}
        />
      </div>
      <p className="text-[11px] text-arka-slate-500">
        Estimated prior-auth denial probability based on AIIE appropriateness score.
      </p>
    </div>
  );
}
