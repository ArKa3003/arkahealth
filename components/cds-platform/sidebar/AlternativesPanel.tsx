/**
 * @file AlternativesPanel.tsx
 * @description Expandable panel showing alternative imaging options with score, radiation/cost, Order Instead.
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BarChart2, DollarSign } from 'lucide-react';
import type { FHIRServiceRequest } from '@/lib/cds-platform/fhir/resources';

export interface AlternativeOption {
  modality: string;
  bodyPart?: string;
  /** Appropriateness score 1–9 for badge */
  score?: number;
  /** e.g. "Lower radiation" | "No radiation" */
  radiationComparison?: string;
  /** e.g. "Lower cost" | "Similar cost" */
  costComparison?: string;
  /** For Order Instead → create this, delete original */
  resource?: FHIRServiceRequest;
}

export interface AlternativesPanelProps {
  alternatives: AlternativeOption[];
  onOrderInstead?: (alternative: AlternativeOption) => void;
  /** Default expanded */
  defaultExpanded?: boolean;
  'aria-label'?: string;
}

function scoreCategory(score: number): { label: string; bg: string } {
  if (score >= 7) return { label: 'Appropriate', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
  if (score >= 4) return { label: 'Uncertain', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' };
  return { label: 'Not appropriate', bg: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' };
}

export function AlternativesPanel({
  alternatives,
  onOrderInstead,
  defaultExpanded = false,
  'aria-label': ariaLabel,
}: AlternativesPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sorted = [...alternatives].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (sorted.length === 0) return null;

  return (
    <section
      className="rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-elevated,#fff)] dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-elevated)]"
      aria-label={ariaLabel ?? 'Alternative imaging options'}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-[var(--arka-fg,#111827)] hover:bg-[var(--arka-bg-muted,#f3f4f6)] dark:text-[var(--arka-fg)] dark:hover:bg-[var(--arka-bg-muted)]"
        aria-expanded={expanded}
        aria-controls="alternatives-list"
      >
        <span>Alternative imaging options</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>
      <div id="alternatives-list" hidden={!expanded} className="border-t border-[var(--arka-border,#e5e7eb)] dark:border-[var(--arka-border)]">
        {expanded &&
          sorted.map((alt, i) => {
            const score = alt.score ?? 0;
            const cat = score > 0 ? scoreCategory(score) : null;
            const displayName = [alt.modality, alt.bodyPart].filter(Boolean).join(' — ');
            return (
              <div
                key={i}
                className="flex flex-col gap-2 border-b border-[var(--arka-border,#e5e7eb)] p-3 last:border-b-0 dark:border-[var(--arka-border)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
                    {displayName || 'Imaging option'}
                  </span>
                  {cat && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${cat.bg}`}
                      aria-label={`Score: ${score}, ${cat.label}`}
                    >
                      {score} — {cat.label}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
                  {alt.radiationComparison && (
                    <span className="flex items-center gap-1" title="Radiation comparison">
                      <BarChart2 className="h-3.5 w-3.5" aria-hidden />
                      {alt.radiationComparison}
                    </span>
                  )}
                  {alt.costComparison && (
                    <span className="flex items-center gap-1" title="Cost comparison">
                      <DollarSign className="h-3.5 w-3.5" aria-hidden />
                      {alt.costComparison}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onOrderInstead?.(alt)}
                  className="w-full rounded-md border border-blue-500 bg-white py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-950/30 dark:focus:ring-offset-[var(--arka-bg)]"
                  aria-label={`Order ${displayName} instead`}
                >
                  Order Instead
                </button>
              </div>
            );
          })}
      </div>
    </section>
  );
}
