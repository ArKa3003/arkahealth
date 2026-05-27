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
            className="rounded-md border border-slate-200 bg-slate-50 p-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-900">{row.label}</span>
              <span
                className={`shrink-0 tabular-nums text-xs font-bold ${
                  isPositive ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {valueStr}
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
              aria-hidden
            >
              <div
                className={`h-full rounded-full ${isPositive ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              {row.rationale}
            </p>
            <CitationLink
              href={row.citationUrl}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              Why this factor
            </CitationLink>
          </li>
        );
      })}
    </ul>
  );
}
