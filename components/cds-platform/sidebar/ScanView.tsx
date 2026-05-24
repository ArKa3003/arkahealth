/**
 * @file ScanView.tsx
 * @description Layer 2 — SCAN: visible with minimal scrolling. Top 3 factors, alternative comparison, patient safety flags.
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { SHAPFeatureContribution } from '@/lib/cds-platform/ml/types';
import type { AlternativeOption } from './AlternativesPanel';

export interface ScanViewProps {
  prediction: MLPrediction;
  scenario: ClinicalScenario;
  /** When score < 7, show best alternative if provided */
  alternatives?: AlternativeOption[];
  /** Optional ARIA label */
  'aria-label'?: string;
}

function getTopShap(prediction: MLPrediction, n: number): SHAPFeatureContribution[] {
  const contribs = prediction.shapValues?.featureContributions ?? [];
  return [...contribs].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue)).slice(0, n);
}

function getSafetyFlags(scenario: ClinicalScenario): string[] {
  const flags: string[] = [];
  if (scenario.pregnancyStatus === 'pregnant') flags.push('Pregnant');
  const eGFR = scenario.renalFunction?.value;
  if (eGFR != null && eGFR < 60) flags.push(`eGFR ${eGFR}`);
  if (scenario.contrastAllergy) flags.push('Contrast allergy');
  return flags;
}

export function ScanView({
  prediction,
  scenario,
  alternatives = [],
  'aria-label': ariaLabel,
}: ScanViewProps) {
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const top3 = getTopShap(prediction, 3);
  const maxAbs = Math.max(1, ...top3.map((c) => Math.abs(c.shapValue)));
  const bestAlternative =
    score < 7 && alternatives.length > 0
      ? [...alternatives].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
      : null;
  const safetyFlags = getSafetyFlags(scenario);

  return (
    <section
      className="flex shrink-0 flex-col gap-3 rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-elevated,#fff)] p-3 dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-elevated)]"
      style={{ minHeight: 0, maxHeight: 150 }}
      aria-label={ariaLabel ?? 'Quick scan: factors and alternatives'}
    >
      {top3.length > 0 && (
        <div className="flex flex-col gap-1.5" role="list" aria-label="Top 3 contributing factors">
          {top3.map((c) => {
            const pct = (Math.abs(c.shapValue) / maxAbs) * 100;
            const isPositive = c.shapValue > 0;
            const valueStr = `${c.shapValue >= 0 ? '+' : ''}${c.shapValue.toFixed(2)}`;
            return (
              <div
                key={c.feature}
                className="flex items-center gap-2 text-xs"
                role="listitem"
                aria-label={`${c.feature}: ${valueStr} contribution`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                </span>
                <span className="w-24 shrink-0 truncate text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
                  {c.feature}
                </span>
                <div className="h-2 flex-1 min-w-0 max-w-24 rounded bg-[var(--arka-border,#e5e7eb)] dark:bg-[var(--arka-border)]">
                  <div
                    className={`h-full rounded ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                    aria-hidden
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
                  {valueStr}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {bestAlternative && (
        <p className="text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
          <span className="font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
            {[bestAlternative.modality, bestAlternative.bodyPart].filter(Boolean).join(' ')}
          </span>
          {' '}
          scores {bestAlternative.score ?? '—'}/9
          {bestAlternative.radiationComparison ? ` with ${bestAlternative.radiationComparison.toLowerCase()}` : ''}
          {bestAlternative.costComparison ? `, ${bestAlternative.costComparison.toLowerCase()}` : ''}.
        </p>
      )}

      {safetyFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Patient safety flags">
          {safetyFlags.map((flag) => (
            <span
              key={flag}
              className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
              role="listitem"
            >
              ⚠️ {flag}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
