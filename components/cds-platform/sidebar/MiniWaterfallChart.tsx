/**
 * @file MiniWaterfallChart.tsx
 * @description Compact SHAP waterfall chart for sidebar (340×200px). Pure CSS, no chart library.
 */

'use client';

import React, { useState } from 'react';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { SHAPFeatureContribution } from '@/lib/cds-platform/ml/types';

export interface MiniWaterfallChartProps {
  prediction: MLPrediction;
  /** Max factors to show when collapsed. Default 5. */
  defaultShowCount?: number;
  /** Optional ARIA label */
  'aria-label'?: string;
}

const CHART_WIDTH = 340;
const CHART_HEIGHT = 200;

function getSortedContributions(prediction: MLPrediction): SHAPFeatureContribution[] {
  const contribs = prediction.shapValues?.featureContributions ?? [];
  return [...contribs].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
}

export function MiniWaterfallChart({
  prediction,
  defaultShowCount = 5,
  'aria-label': ariaLabel,
}: MiniWaterfallChartProps) {
  const [showAll, setShowAll] = useState(false);
  const allContribs = getSortedContributions(prediction);
  const displayContribs = showAll ? allContribs : allContribs.slice(0, defaultShowCount);
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const baseValue = prediction.shapValues?.baseValue ?? 5;
  const maxAbs = Math.max(
    0.01,
    ...allContribs.map((c) => Math.abs(c.shapValue))
  );
  const barScale = 70 / maxAbs;
  const barAreaWidth = 140;

  return (
    <figure
      className="flex flex-col gap-2"
      style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT }}
      aria-label={ariaLabel ?? 'SHAP factor contributions to appropriateness score'}
    >
      <div
        className="relative flex flex-col gap-1 overflow-hidden"
        style={{ height: displayContribs.length * 24 + 32 }}
        role="img"
        aria-hidden
      >
        {displayContribs.map((c) => {
          const isPositive = c.shapValue > 0;
          const barWidth = Math.min(70, Math.abs(c.shapValue) * barScale);
          const valueStr = `${c.shapValue >= 0 ? '+' : ''}${c.shapValue.toFixed(2)}`;
          return (
            <div
              key={c.feature}
              className="flex items-center gap-2"
              style={{ height: 22, minHeight: 22 }}
            >
              <span
                className="w-24 shrink-0 truncate text-[11px] text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]"
                title={c.feature}
              >
                {c.feature}
              </span>
              <div
                className="relative flex items-center"
                style={{ width: barAreaWidth, height: 14 }}
                aria-label={`${c.feature} contribution ${valueStr}`}
              >
                <div
                  className="absolute h-2 rounded bg-[var(--arka-border,#e5e7eb)] dark:bg-[var(--arka-border)]"
                  style={{ left: '50%', width: 1, marginLeft: -1, top: 0, bottom: 0 }}
                  aria-hidden
                />
                <div
                  className="absolute h-2 rounded"
                  style={{
                    width: barWidth,
                    left: isPositive ? '50%' : `${50 - (barWidth / barAreaWidth) * 50}%`,
                    backgroundColor: isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)',
                  }}
                  aria-hidden
                />
              </div>
              <span
                className="w-11 shrink-0 text-right text-[11px] text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]"
                aria-hidden
              >
                {valueStr}
              </span>
            </div>
          );
        })}
        <div className="mt-1 flex items-center gap-2 border-t border-[var(--arka-border,#e5e7eb)] pt-1 dark:border-[var(--arka-border)]">
          <span className="w-24 shrink-0 text-[11px] font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
            Score
          </span>
          <span className="flex-1 text-[11px] text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
            baseline {baseValue.toFixed(1)} → {score}
          </span>
        </div>
      </div>

      <ul className="sr-only" aria-label="Factor contributions">
        {displayContribs.map((c) => (
          <li key={c.feature}>
            {c.feature}: {c.shapValue >= 0 ? '+' : ''}{c.shapValue.toFixed(2)}
          </li>
        ))}
      </ul>

      {allContribs.length > defaultShowCount && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="self-start text-[11px] font-medium text-[var(--arka-primary,#0ea5e9)] hover:underline dark:text-[var(--arka-primary)]"
          aria-expanded={showAll}
        >
          {showAll
            ? `Show top ${defaultShowCount} only`
            : `Show all ${allContribs.length} factors`}
        </button>
      )}
    </figure>
  );
}
