"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AIIEFactor } from "@/lib/types/aiie";
import { factorEvidenceSlug } from "./ed-cockpit-utils";

export interface EdFactorBreakdownProps {
  factors: AIIEFactor[];
  className?: string;
}

/**
 * Compact SHAP-style factor rows for ED — each links to /evidence/[slug].
 */
export function EdFactorBreakdown({ factors, className }: EdFactorBreakdownProps) {
  const maxContribution = Math.max(...factors.map((f) => Math.abs(f.contribution)), 1);

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-arka-slate-600">
        Factor breakdown
      </h3>
      <ul className="space-y-2">
        {factors.map((factor, index) => {
          const isSupport = factor.contribution > 0;
          const widthPct = (Math.abs(factor.contribution) / maxContribution) * 50;
          const slug = factorEvidenceSlug(factor.name);

          return (
            <li key={`${factor.id}-${index}`}>
              <Link
                href={`/evidence/${slug}`}
                className="group block rounded-lg border border-arka-slate-200 bg-white p-3 transition-colors hover:border-arka-teal-400 hover:bg-arka-teal-50/40 min-h-[52px]"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-arka-slate-900 group-hover:text-arka-teal-800">
                    {factor.name}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span
                      className={cn(
                        "font-mono text-xs font-bold tabular-nums",
                        isSupport ? "text-arka-teal-700" : "text-warning",
                      )}
                    >
                      {factor.contribution > 0 ? "+" : ""}
                      {factor.contribution.toFixed(1)}
                    </span>
                    <ExternalLink
                      className="h-3.5 w-3.5 text-arka-slate-400 group-hover:text-arka-teal-600"
                      aria-hidden
                    />
                  </span>
                </div>
                <div className="relative h-4 rounded bg-arka-slate-100 overflow-hidden">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-arka-slate-300" aria-hidden />
                  <div
                    className={cn(
                      "absolute inset-y-0 h-full",
                      isSupport ? "left-1/2 bg-arka-teal-500/70" : "right-1/2 bg-warning/70",
                    )}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
