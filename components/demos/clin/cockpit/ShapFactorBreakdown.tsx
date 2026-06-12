"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";

import { evidencePath } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EvaluationResult } from "@/lib/demos/clin/types";
import { factorEvidenceSlug } from "./clin-cockpit-utils";

export interface ShapFactorBreakdownProps {
  shap: NonNullable<EvaluationResult["shap"]>;
  className?: string;
}

/**
 * SHAP-style diverging horizontal bars — teal supports right, amber opposes left.
 */
export function ShapFactorBreakdown({ shap, className }: ShapFactorBreakdownProps) {
  const [expanded, setExpanded] = React.useState<Set<number>>(() => new Set());
  const maxContribution = Math.max(...shap.factors.map((f) => Math.abs(f.contribution)), 1);

  const toggle = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-arka-slate-900">Factor breakdown</h3>
        <div className="flex items-center gap-3 text-[10px] text-arka-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-warning" aria-hidden />
            Against
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-arka-teal-500" aria-hidden />
            Supports
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {shap.factors.map((factor, index) => {
          const isExpanded = expanded.has(index);
          const isSupport = factor.contribution > 0;
          const widthPct = (Math.abs(factor.contribution) / maxContribution) * 50;
          const slug = factorEvidenceSlug(factor.name);

          return (
            <li
              key={`${factor.name}-${index}`}
              className="rounded-radius-md border border-border-subtle bg-surface-raised overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="flex w-full items-start gap-2 p-3 text-left min-h-[44px] hover:bg-surface-sunken/50 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-arka-slate-800 truncate">
                      {factor.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs font-semibold tabular-nums",
                        isSupport ? "text-arka-teal-700" : "text-warning",
                      )}
                    >
                      {factor.contribution > 0 ? "+" : ""}
                      {factor.contribution.toFixed(1)}
                    </span>
                  </div>
                  <div className="relative h-5 rounded-sm bg-arka-slate-100 overflow-hidden">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-arka-slate-300" aria-hidden />
                    <div
                      className={cn(
                        "absolute inset-y-0 h-full transition-all duration-300",
                        isSupport
                          ? "left-1/2 bg-arka-teal-400/70"
                          : "right-1/2 bg-warning/60",
                      )}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-arka-slate-400 transition-transform duration-200 mt-0.5",
                    isExpanded && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              {isExpanded ? (
                <div className="border-t border-border-subtle px-3 pb-3 pt-2 space-y-2 animate-fade-in-up">
                  <p className="text-caption text-arka-slate-600">{factor.explanation}</p>
                  <Link
                    href={evidencePath(slug)}
                    className="inline-flex items-center gap-1 text-caption font-medium text-arka-teal-700 hover:text-arka-teal-600 hover:underline"
                  >
                    View evidence
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
