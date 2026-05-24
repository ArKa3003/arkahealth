/**
 * @file ScoreIndicator.tsx
 * @description Compact appropriateness score display: circular badge, category label, mini SHAP bars.
 */

'use client';

import React from 'react';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { SHAPFeatureContribution } from '@/lib/cds-platform/ml/types';

export interface ScoreIndicatorProps {
  prediction: MLPrediction;
  /** Optional ARIA label */
  'aria-label'?: string;
}

function scoreToCategory(score: number): { label: string; ring: string } {
  if (score >= 7) return { label: 'Appropriate', ring: 'stroke-emerald-500' };
  if (score >= 4) return { label: 'Uncertain', ring: 'stroke-amber-500' };
  return { label: 'Not Appropriate', ring: 'stroke-red-500' };
}

function getTopShap(prediction: MLPrediction, n: number): SHAPFeatureContribution[] {
  const contribs = prediction.shapValues?.featureContributions ?? [];
  return [...contribs].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue)).slice(0, n);
}

export function ScoreIndicator({ prediction, 'aria-label': ariaLabel }: ScoreIndicatorProps) {
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const { label, ring } = scoreToCategory(score);
  const top3 = getTopShap(prediction, 3);
  const maxAbs = Math.max(1, ...top3.map((c) => Math.abs(c.shapValue)));

  return (
    <section
      className="flex flex-col gap-2"
      aria-label={ariaLabel ?? 'Appropriateness score and top factors'}
      style={{ maxHeight: 120 }}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center" role="img" aria-label={`Score ${score}`}>
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="var(--arka-bg-elevated,#fff)"
              stroke="var(--arka-border,#e5e7eb)"
              strokeWidth="3"
              className="dark:fill-[var(--arka-bg-elevated)] dark:stroke-[var(--arka-border)]"
            />
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={ring}
              strokeDasharray={`${(score / 9) * 106} 106`}
              aria-hidden
            />
          </svg>
          <span className="absolute text-sm font-bold text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
            {score}
          </span>
        </div>
        <span className="text-xs font-medium text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
          {label}
        </span>
      </div>
      {top3.length > 0 && (
        <div className="flex flex-col gap-1" role="list" aria-label="Top contributing factors">
          {top3.map((c) => {
            const pct = (Math.abs(c.shapValue) / maxAbs) * 100;
            const isPositive = c.shapValue > 0;
            return (
              <div
                key={c.feature}
                className="flex items-center gap-2"
                role="listitem"
                title={`${c.feature}: ${c.shapValue >= 0 ? '+' : ''}${c.shapValue.toFixed(2)}`}
              >
                <span className="w-20 truncate text-xs text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
                  {c.feature}
                </span>
                <div className="h-1.5 flex-1 min-w-0 rounded bg-[var(--arka-border,#e5e7eb)] dark:bg-[var(--arka-border)]">
                  <div
                    className={`h-full rounded ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                    aria-hidden
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
