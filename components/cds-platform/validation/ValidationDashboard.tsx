'use client';

import React, { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';

const METHODOLOGY_TEXT =
  'ARKA AIIE predictions are validated against expert panel consensus labels. Expert labels are derived from the ARKA AIIE Clinical Evidence Base, a proprietary synthesis of peer-reviewed clinical literature, CMS guidelines, FDA safety guidance, and ARKA clinical advisory board protocols. ARKA does not use or license third-party proprietary appropriateness criteria.';

interface ValidationReportSummary {
  overallPerformance: 'excellent' | 'good' | 'acceptable' | 'needs_improvement';
  aucRoc: number;
  accuracy3Class: number;
  keyFindings: string[];
  limitations: string[];
  recommendations: string[];
}

interface SubgroupReportItem {
  name: string;
  key: string;
  metrics: {
    n: number;
    rmse: number;
    mae: number;
    accuracy3Class: number;
    aucRoc: number;
    sensitivity: number;
    specificity: number;
    precision: number;
    recall: number;
    f1: number;
  };
  n: number;
}

interface ValidationReportState {
  summary: ValidationReportSummary;
  detailedMetrics: {
    auc_roc: number;
    accuracy_3class: number;
    sensitivity: number;
    specificity: number;
    ppv: number;
    npv: number;
    rmse: number;
    mae: number;
    r_squared: number;
    spearman_rho: number;
    calibration_slope: number;
    calibration_intercept: number;
    brier_score: number;
    n_total: number;
    statistical_power: number;
  };
  calibrationPlotData: { predicted: number[]; actual: number[] };
  rocCurveData: { fpr: number[]; tpr: number[]; thresholds: number[] };
  confusionMatrixData: { matrix: number[][]; labels: string[] };
  subgroupAnalysis: SubgroupReportItem[];
  generatedAt: string;
  modelVersion: string;
  datasetVersion: string;
}

const AUC_TARGET = 0.85;

function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        pass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {label}
    </span>
  );
}

export default function ValidationDashboard() {
  const [report, setReport] = useState<ValidationReportState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nSamples, setNSamples] = useState(1000);
  const [includeSubgroups, setIncludeSubgroups] = useState(true);

  const runValidation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        n_samples: String(nSamples),
        include_subgroups: String(includeSubgroups),
      });
      const res = await fetch(`/api/validation/run?${params}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReport(data as ValidationReportState);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  }, [nSamples, includeSubgroups]);

  const rocChartData =
    report?.rocCurveData?.fpr?.map((fpr, i) => ({
      fpr,
      tpr: report.rocCurveData.tpr[i] ?? 0,
    })) ?? [];

  const calibrationChartData =
    report?.calibrationPlotData?.predicted?.map((pred, i) => ({
      predicted: pred,
      actual: report.calibrationPlotData.actual[i] ?? 0,
    })) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Retrospective Validation
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Evaluate ARKA imaging appropriateness predictions against historical expert labels.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm">Samples</span>
            <input
              type="number"
              min={100}
              max={5000}
              value={nSamples}
              onChange={(e) => setNSamples(parseInt(e.target.value, 10) || 1000)}
              className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeSubgroups}
              onChange={(e) => setIncludeSubgroups(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm">Include subgroups</span>
          </label>
          <button
            type="button"
            onClick={runValidation}
            disabled={loading}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Run validation'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {report && (
          <>
            {/* Summary card */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-slate-800">Summary</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm text-slate-500">AUC-ROC</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xl font-semibold">
                      {report.summary.aucRoc.toFixed(3)}
                    </span>
                    <Badge pass={report.summary.aucRoc >= AUC_TARGET} label={report.summary.aucRoc >= AUC_TARGET ? 'Pass' : 'Below target'} />
                  </div>
                  <div className="text-xs text-slate-400">Target &gt; 0.85</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm text-slate-500">3-class accuracy</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xl font-semibold">
                      {(report.summary.accuracy3Class * 100).toFixed(1)}%
                    </span>
                    <Badge pass={report.summary.accuracy3Class >= 0.7} label={report.summary.accuracy3Class >= 0.7 ? 'Pass' : 'Below target'} />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm text-slate-500">Sensitivity</div>
                  <div className="mt-1 text-xl font-semibold">
                    {(report.detailedMetrics.sensitivity * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm text-slate-500">Specificity</div>
                  <div className="mt-1 text-xl font-semibold">
                    {(report.detailedMetrics.specificity * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-slate-600">Overall:</span>
                <Badge
                  pass={report.summary.overallPerformance === 'excellent' || report.summary.overallPerformance === 'good'}
                  label={report.summary.overallPerformance}
                />
              </div>
              {report.summary.keyFindings?.length > 0 && (
                <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
                  {report.summary.keyFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </section>

            {/* ROC curve */}
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-800">ROC curve</h2>
              <div className="mt-3 h-80 w-full rounded-lg border border-slate-200 bg-white p-4">
                {rocChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rocChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="fpr" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(2)} />
                      <YAxis type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(2)} />
                      <Tooltip
                        formatter={(value) =>
                          typeof value === 'number' ? value.toFixed(3) : String(value ?? '')
                        }
                      />
                      <Legend />
                      <Line type="monotone" dataKey="tpr" stroke="#0f766e" strokeWidth={2} name="TPR" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">No ROC data</div>
                )}
              </div>
            </section>

            {/* Calibration plot */}
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-800">Calibration</h2>
              <div className="mt-3 h-80 w-full rounded-lg border border-slate-200 bg-white p-4">
                {calibrationChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={calibrationChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="predicted" type="number" domain={[1, 9]} />
                      <YAxis type="number" domain={[0, 9]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#0f766e" strokeWidth={2} name="Actual" dot={true} />
                      <Line type="monotone" dataKey="predicted" stroke="#94a3b8" strokeDasharray="4 4" name="Predicted" dot={true} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">No calibration data</div>
                )}
              </div>
            </section>

            {/* Confusion matrix */}
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-800">Confusion matrix (3-class)</h2>
              <div className="mt-3 overflow-x-auto">
                <ConfusionMatrixHeatmap
                  matrix={report.confusionMatrixData.matrix}
                  labels={report.confusionMatrixData.labels}
                />
              </div>
            </section>

            {/* Subgroup table */}
            {report.subgroupAnalysis?.length > 0 && (
              <section className="mt-10">
                <h2 className="text-lg font-semibold text-slate-800">Subgroup performance</h2>
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Subgroup</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-700">n</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-700">AUC-ROC</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-700">Accuracy</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-700">Sensitivity</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-700">Specificity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.subgroupAnalysis.map((sg) => (
                        <tr key={sg.key}>
                          <td className="px-4 py-2 text-slate-800">{sg.name}</td>
                          <td className="px-4 py-2 text-right">{sg.metrics.n}</td>
                          <td className="px-4 py-2 text-right">{sg.metrics.aucRoc.toFixed(3)}</td>
                          <td className="px-4 py-2 text-right">{(sg.metrics.accuracy3Class * 100).toFixed(1)}%</td>
                          <td className="px-4 py-2 text-right">{(sg.metrics.sensitivity * 100).toFixed(1)}%</td>
                          <td className="px-4 py-2 text-right">{(sg.metrics.specificity * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Methodology */}
            <section className="mt-10 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <h2 className="text-lg font-semibold text-slate-800">Methodology</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{METHODOLOGY_TEXT}</p>
            </section>

            <div className="mt-6 text-xs text-slate-500">
              Report generated at {report.generatedAt} · Model: {report.modelVersion} · Dataset: {report.datasetVersion}
            </div>
          </>
        )}

        {!report && !loading && (
          <p className="mt-8 text-slate-500">Run a validation to see results.</p>
        )}
      </div>
    </div>
  );
}

function ConfusionMatrixHeatmap({
  matrix,
  labels,
}: {
  matrix: number[][];
  labels: string[];
}) {
  const flat = matrix.flat();
  const max = Math.max(1, ...flat);
  return (
    <div className="inline-block">
      <div className="grid gap-px rounded-lg border border-slate-200 bg-slate-200 p-px" style={{ gridTemplateColumns: `auto repeat(${labels.length}, 1fr)` }}>
        <div className="rounded-tl-lg bg-slate-100 p-2" />
        {labels.map((l) => (
          <div key={l} className="bg-slate-100 p-2 text-center text-xs font-medium text-slate-700">
            Pred: {l}
          </div>
        ))}
        {matrix.map((row, i) => (
          <React.Fragment key={i}>
            <div className="bg-slate-100 p-2 text-xs font-medium text-slate-700">
              True: {labels[i]}
            </div>
            {row.map((cell, j) => (
              <div
                key={j}
                className="flex items-center justify-center rounded p-2 text-sm font-medium text-slate-800"
                style={{
                  backgroundColor: `rgb(15 118 110 / ${0.2 + (0.8 * (cell / max))})`,
                }}
              >
                {cell}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
