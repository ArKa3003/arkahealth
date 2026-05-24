'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { FeatureCatalogRow } from '@/lib/cds-platform/regulatory/api-types';
import type { Citation } from '@/lib/cds-platform/citations';
import type { DecisionLogEntry } from '@/lib/cds-platform/audit/decision-log';
import { FDA_NON_DEVICE_CRITERIA } from '@/lib/constants';

const RATIONALE_TRUNCATE = 100;
const STALE_REVIEW_DAYS = 365;
const FAIRNESS_AUC_DELTA = 0.05;

interface FairnessRow {
  dimension: string;
  subgroup: string;
  n: number;
  aucRoc: number;
  deviates: boolean;
}

interface SubgroupReportItem {
  name: string;
  key: string;
  metrics: { n: number; aucRoc: number };
}

interface RegulatoryTabProps {
  subgroupAnalysis: SubgroupReportItem[];
  overallAuc: number | null;
  onLoadFairness: () => Promise<void>;
  fairnessLoading: boolean;
}

function daysSinceIso(iso: string): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 0;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

function formatWeightDirection(direction: string): string {
  return direction.replace(/_/g, ' ');
}

function truncateRationale(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/**
 * Regulatory compliance tab: FDA criteria, feature catalogue, citations, fairness, decision log.
 */
export function RegulatoryTab({
  subgroupAnalysis,
  overallAuc,
  onLoadFairness,
  fairnessLoading,
}: RegulatoryTabProps) {
  const [features, setFeatures] = useState<FeatureCatalogRow[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [decisionLogError, setDecisionLogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const [fcRes, citRes, logRes] = await Promise.all([
          fetch('/api/regulatory/feature-catalog'),
          fetch('/api/regulatory/citation-library'),
          fetch('/api/regulatory/decision-log'),
        ]);
        if (!fcRes.ok || !citRes.ok) {
          throw new Error('Failed to load regulatory catalogue data');
        }
        const fcData = (await fcRes.json()) as { features: FeatureCatalogRow[] };
        const citData = (await citRes.json()) as { citations: Citation[] };
        if (!cancelled) {
          setFeatures(fcData.features);
          setCitations(citData.citations);
        }
        if (logRes.ok) {
          const logData = (await logRes.json()) as { entries: DecisionLogEntry[] };
          if (!cancelled) setDecisionLog(logData.entries);
        } else if (logRes.status === 403) {
          if (!cancelled) {
            setDecisionLogError('Decision log preview is not available in this environment.');
          }
        } else if (!cancelled) {
          setDecisionLogError('Failed to load decision log preview.');
        }
      } catch (e) {
        if (!cancelled) {
          setCatalogError(e instanceof Error ? e.message : 'Catalog load failed');
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const fairnessRows: FairnessRow[] = React.useMemo(() => {
    const overall = overallAuc ?? 0;
    return subgroupAnalysis
      .filter((sg) => sg.key.startsWith('fairness-'))
      .map((sg) => {
        let dimension = 'Other';
        let subgroup = sg.name;
        if (sg.key.startsWith('fairness-age-')) {
          dimension = 'Age band';
          subgroup = sg.name.replace(/^Age band:\s*/i, '');
        } else if (sg.key.startsWith('fairness-sex-')) {
          dimension = 'Sex';
          subgroup = sg.name.replace(/^Sex:\s*/i, '');
        } else if (sg.key.startsWith('fairness-modality-')) {
          dimension = 'Modality';
          subgroup = sg.name.replace(/^Modality:\s*/i, '');
        }
        const aucRoc = sg.metrics.aucRoc;
        const deviates =
          overallAuc !== null && Math.abs(aucRoc - overall) > FAIRNESS_AUC_DELTA;
        return {
          dimension,
          subgroup,
          n: sg.metrics.n,
          aucRoc,
          deviates,
        };
      });
  }, [subgroupAnalysis, overallAuc]);

  const refreshFairness = useCallback(() => {
    void onLoadFairness();
  }, [onLoadFairness]);

  return (
    <div className="space-y-10">
      {/* FDA criteria summary */}
      <section>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-800">
            ARKA-CLIN is designed to meet the four criteria for Non-Device CDS under FD&amp;C Act
            §520(o)(1)(E).
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FDA_NON_DEVICE_CRITERIA.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-slate-900">{c.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{c.implementation}</p>
              <Link
                href={c.href}
                className="mt-3 inline-block text-xs font-medium text-teal-700 hover:underline"
              >
                Regulatory rationale →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Feature catalogue */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800">Feature Catalogue</h2>
        {catalogLoading && (
          <p className="mt-2 text-sm text-slate-500">Loading feature catalogue…</p>
        )}
        {catalogError && (
          <p className="mt-2 text-sm text-red-700">{catalogError}</p>
        )}
        {!catalogLoading && !catalogError && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Feature</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Weight</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Rationale</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Citation</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Last review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {features.map((row) => {
                  const stale = daysSinceIso(row.lastClinicalReviewISO) > STALE_REVIEW_DAYS;
                  return (
                    <tr
                      key={row.name}
                      className={stale ? 'bg-amber-50' : undefined}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-slate-800">{row.name}</td>
                      <td className="px-4 py-2 text-slate-700">
                        {formatWeightDirection(row.weightDirection)}
                      </td>
                      <td
                        className="max-w-xs px-4 py-2 text-slate-700"
                        title={row.rationale}
                      >
                        {truncateRationale(row.rationale, RATIONALE_TRUNCATE)}
                      </td>
                      <td className="px-4 py-2">
                        <a
                          href={row.citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 hover:underline"
                        >
                          {row.citation.label}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{row.lastClinicalReviewISO}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Citation library */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800">Citation Library</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2 text-left font-medium text-slate-700">ID</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Label</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Authority</th>
                <th className="px-4 py-2 text-right font-medium text-slate-700">Year</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Last verified</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {citations.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-700">{c.id}</td>
                  <td className="px-4 py-2 text-slate-800">{c.label}</td>
                  <td className="px-4 py-2 text-slate-600">{c.authorityClass}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{c.year}</td>
                  <td className="px-4 py-2 text-slate-600">{c.lastVerifiedISO}</td>
                  <td className="px-4 py-2">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subgroup fairness */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Subgroup fairness (AUC)</h2>
          <button
            type="button"
            onClick={refreshFairness}
            disabled={fairnessLoading}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {fairnessLoading ? 'Loading…' : 'Refresh fairness metrics'}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Rows highlighted when subgroup AUC deviates by more than {FAIRNESS_AUC_DELTA} from overall
          {overallAuc !== null ? ` (${overallAuc.toFixed(3)})` : ''}.
        </p>
        {fairnessRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Run validation with subgroups enabled, then refresh fairness metrics.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Dimension</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Subgroup</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-700">n</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-700">AUC-ROC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fairnessRows.map((row) => (
                  <tr
                    key={`${row.dimension}-${row.subgroup}`}
                    className={row.deviates ? 'bg-amber-50' : undefined}
                  >
                    <td className="px-4 py-2 text-slate-800">{row.dimension}</td>
                    <td className="px-4 py-2 text-slate-800">{row.subgroup}</td>
                    <td className="px-4 py-2 text-right">{row.n}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {row.aucRoc.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Decision log preview */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800">Decision-log preview</h2>
        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          All entries PHI-redacted at write time per{' '}
          <Link href="/docs/PHI_REDACTION.md" className="font-medium underline">
            docs/PHI_REDACTION.md
          </Link>
          .
        </div>
        {decisionLogError && (
          <p className="mt-2 text-sm text-amber-800">{decisionLogError}</p>
        )}
        {decisionLog.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Hook</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Timestamp</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Scenario hash</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-700">ML</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-700">Cards</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-700">ms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {decisionLog.map((entry, i) => (
                  <tr key={`${entry.hookInstance}-${entry.hookTimestampISO}-${i}`}>
                    <td className="px-3 py-2 text-slate-800">{entry.hook}</td>
                    <td className="px-3 py-2 text-slate-600">{entry.hookTimestampISO}</td>
                    <td className="max-w-[12rem] truncate px-3 py-2 text-slate-600" title={entry.scenario.scenarioHash}>
                      {entry.scenario.scenarioHash.slice(0, 16)}…
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {entry.mlInvoked ? 'yes' : 'no'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{entry.cardsShipped}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{entry.durationMs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!decisionLogError && decisionLog.length === 0 && !catalogLoading && (
          <p className="mt-2 text-sm text-slate-500">No decision log entries recorded yet.</p>
        )}
      </section>
    </div>
  );
}
