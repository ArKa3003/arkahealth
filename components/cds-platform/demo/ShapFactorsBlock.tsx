'use client';

/**
 * @file ShapFactorsBlock.tsx
 * @description Top SHAP factors with contribution bars, rationale, and citation links (demo sidebar).
 */

import type { ShapRowWithRationale } from './demo-response';
import { CitationLink } from '@/components/cds-platform/sidebar/CitationLink';

export interface ShapFactorsBlockProps {
  rows: ShapRowWithRationale[];
}

/**
 * Renders top 5 SHAP factors for patient-specific refinement.
 */
export function ShapFactorsBlock({ rows }: ShapFactorsBlockProps) {
  const display = rows.slice(0, 5);
  if (display.length === 0) return null;

  const maxAbs = Math.max(0.01, ...display.map((r) => Math.abs(r.contribution)));

  return (
    <ul className="mt-2 space-y-2" aria-label="SHAP contributing factors">
      {display.map((row) => {
        const isPositive = row.contribution > 0;
        const barPct = Math.min(100, (Math.abs(row.contribution) / maxAbs) * 100);
        const valueStr = `${row.contribution > 0 ? '+' : ''}${row.contribution.toFixed(1)}`;

        return (
          <li
            key={`${row.label}-${row.citationId}`}
            className="rounded-md border border-arka-primary/10 bg-arka-bg-light/80 p-2 dark:bg-arka-bg-dark/20"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-arka-text-dark">{row.label}</span>
              <span
                className={`shrink-0 tabular-nums text-xs font-semibold ${
                  isPositive ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {valueStr}
              </span>
            </div>
            <div
              className="mt-1 h-1 w-full overflow-hidden rounded-full bg-arka-primary/10"
              aria-hidden
            >
              <div
                className={`h-full rounded-full ${isPositive ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-arka-text-dark-muted">
              {row.rationale}
            </p>
            <CitationLink
              href={row.citationUrl}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-arka-cyan hover:underline"
            >
              Why this factor
            </CitationLink>
          </li>
        );
      })}
    </ul>
  );
}
