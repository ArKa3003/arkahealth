'use client';

/**
 * @file ShapFactorsBlock.tsx
 * @description Top SHAP factors with contribution bars, rationale, and citation links (demo sidebar).
 */

import type { ShapRowWithRationale } from './demo-response';
import { CitationLink } from '@/components/cds-platform/sidebar/CitationLink';

export interface ShapFactorsBlockProps {
  rows: ShapRowWithRationale[];
  /** Collapse long rationales behind expanders (sidebar). */
  compact?: boolean;
}

/**
 * Renders top 3–5 SHAP factors for patient-specific refinement.
 */
export function ShapFactorsBlock({ rows, compact = false }: ShapFactorsBlockProps) {
  const display = rows.slice(0, compact ? 3 : 5);
  if (display.length === 0) return null;

  const maxAbs = Math.max(0.01, ...display.map((r) => Math.abs(r.contribution)));

  return (
    <ul className={`${compact ? 'mt-2 space-y-1.5' : 'mt-3 space-y-3'}`} aria-label="SHAP contributing factors">
      {display.map((row) => {
        const isPositive = row.contribution > 0;
        const barPct = Math.min(100, (Math.abs(row.contribution) / maxAbs) * 100);
        const valueStr = `${row.contribution > 0 ? '+' : ''}${row.contribution.toFixed(1)}`;

        const barRow = (
          <div className="flex items-center justify-between gap-2">
            <span className={`font-medium text-arka-text-dark ${compact ? 'text-xs' : 'text-sm'}`}>
              {row.label}
            </span>
            <span
              className={`shrink-0 tabular-nums font-semibold ${
                compact ? 'text-xs' : 'text-sm'
              } ${isPositive ? 'text-amber-600' : 'text-emerald-600'}`}
            >
              {valueStr}
            </span>
          </div>
        );

        const bar = (
          <div
            className={`${compact ? 'mt-1' : 'mt-1.5'} h-1 w-full overflow-hidden rounded-full bg-arka-primary/10`}
            aria-hidden
          >
            <div
              className={`h-full rounded-full ${isPositive ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        );

        if (compact) {
          return (
            <li key={`${row.label}-${row.citationId}`}>
              <details className="group rounded-md border border-arka-primary/10 bg-arka-bg-light/80 dark:bg-arka-bg-dark/20">
                <summary className="cursor-pointer list-none px-2 py-1.5 [&::-webkit-details-marker]:hidden">
                  {barRow}
                  {bar}
                  <span className="mt-1 block text-[10px] text-arka-cyan group-open:hidden">
                    Why this factor
                  </span>
                </summary>
                <div className="border-t border-arka-primary/10 px-2 pb-2 pt-1">
                  <p className="text-[11px] leading-snug text-arka-text-dark-muted">{row.rationale}</p>
                  <CitationLink
                    href={row.citationUrl}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-arka-cyan hover:underline"
                  >
                    {row.citationLabel}
                  </CitationLink>
                </div>
              </details>
            </li>
          );
        }

        return (
          <li
            key={`${row.label}-${row.citationId}`}
            className="rounded-md border border-arka-primary/10 bg-arka-bg-light/80 p-2.5 dark:bg-arka-bg-dark/20"
          >
            {barRow}
            {bar}
            <p className="mt-2 text-xs leading-relaxed text-arka-text-dark-muted">{row.rationale}</p>
            <CitationLink
              href={row.citationUrl}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-arka-cyan hover:underline"
            >
              {row.citationLabel}
            </CitationLink>
          </li>
        );
      })}
    </ul>
  );
}
