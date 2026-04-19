"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, FileText, Loader2, X } from "lucide-react";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { useEvidenceModal } from "@/components/shared/compliance/evidence-modal-context";
import { MethodologyModal } from "@/components/ins/roi/MethodologyModal";
import {
  buildMetricsQueryString,
  useMetricsStore,
  type MetricsFilters,
} from "@/lib/stores/metrics-store";
import {
  AMA_PHYSICIAN_PA_MINUTES_PER_WEEK,
  type PayerRoiRow,
} from "@/lib/validation/metrics";

type DrilldownKpi =
  | "pa_auto"
  | "minutes"
  | "oop"
  | "cms_sla"
  | "cost_appeal"
  | "cost_imaging"
  | "cost_labor"
  | "denial_specificity"
  | "oop_reroute";

const CPT_MODALITIES = ["MRI", "CT", "Ultrasound", "X-ray", "PET-CT", "Nuclear Medicine"] as const;

const SPECIALTIES = [
  "Diagnostic Radiology",
  "Interventional Radiology",
  "Cardiology",
  "Orthopedic Surgery",
  "Emergency Medicine",
  "Internal Medicine",
] as const;

function buildDrilldownUrl(kpi: DrilldownKpi, f: MetricsFilters, payerOverride?: string): string {
  const p = new URLSearchParams(buildMetricsQueryString(f));
  p.set("kpi", kpi);
  if (payerOverride) {
    p.set("payerId", payerOverride);
  }
  return `/api/ins/validation/drilldown?${p.toString()}`;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function payerLabel(id: string): string {
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type SortKey = keyof Pick<
  PayerRoiRow,
  "payerId" | "pasProcessed" | "autoApprovalRate" | "avgDecisionTimeHours" | "appealOverturnRate" | "estAnnualSavingsUsd"
>;

export function RoiDashboardClient() {
  const data = useMetricsStore((s) => s.data);
  const loading = useMetricsStore((s) => s.loading);
  const error = useMetricsStore((s) => s.error);
  const filters = useMetricsStore((s) => s.filters);
  const setFilters = useMetricsStore((s) => s.setFilters);
  const fetchMetrics = useMetricsStore((s) => s.fetchMetrics);

  const { setOpen: setEvidenceOpen } = useEvidenceModal();
  const [methodOpen, setMethodOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [traceTitle, setTraceTitle] = useState("");
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceRows, setTraceRows] = useState<Record<string, unknown>[]>([]);
  const [traceSource, setTraceSource] = useState<"ins_validation_events" | "ins_pa_history">("ins_validation_events");
  const [traceNote, setTraceNote] = useState<string | null>(null);

  const [tableSort, setTableSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "estAnnualSavingsUsd",
    dir: "desc",
  });
  const [tableQuery, setTableQuery] = useState("");

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics, filters]);

  const openTrace = useCallback(
    async (kpi: DrilldownKpi, title: string, payerOverride?: string) => {
      setTraceTitle(title);
      setTraceOpen(true);
      setTraceLoading(true);
      setTraceNote(null);
      try {
        const res = await fetch(buildDrilldownUrl(kpi, filters, payerOverride));
        const json: unknown = await res.json();
        if (!res.ok) {
          setTraceRows([]);
          setTraceNote(json && typeof json === "object" && "error" in json ? String((json as { error: string }).error) : "Request failed");
          return;
        }
        if (json && typeof json === "object") {
          const o = json as {
            source?: string;
            rows?: Record<string, unknown>[];
            note?: string;
          };
          setTraceSource(
            o.source === "ins_pa_history" ? "ins_pa_history" : "ins_validation_events",
          );
          setTraceRows(Array.isArray(o.rows) ? o.rows : []);
          setTraceNote(typeof o.note === "string" ? o.note : null);
        }
      } catch {
        setTraceRows([]);
        setTraceNote("Network error.");
      } finally {
        setTraceLoading(false);
      }
    },
    [filters],
  );

  const burden = data?.administrativeBurdenReduction;
  const payerRoi = data?.payerROI;
  const cost = data?.costAvoidance;
  const stack = data?.costAvoidanceStackUsd;
  const weekly = data?.timeSeries.weeklyMinutesLast12 ?? [];
  const payerRows = data?.payerBreakdown ?? [];
  const oopT = data?.oopTransparency;
  const kpis = data?.kpis;

  const weeklyChartData = useMemo(
    () =>
      weekly.map((w) => ({
        ...w,
        label: format(parseISO(w.weekStart), "MMM d"),
        benchmark: AMA_PHYSICIAN_PA_MINUTES_PER_WEEK,
      })),
    [weekly],
  );

  const reductionPct = burden?.benchmarkComparisonPercent ?? 0;

  const stackData = useMemo(
    () =>
      stack ?
        [
          {
            label: "Period",
            appeal: stack.appealCostsAvoided,
            imaging: stack.inappropriateImagingAvoidedUsd,
            labor: stack.adminLaborAvoidedUsd,
          },
        ]
      : [],
    [stack],
  );

  const specificity = payerRoi?.denialSpecificityScore ?? 100;
  const donutData = [
    { name: "Factor-specific (AIIE-aligned)", value: specificity },
    { name: "Boilerplate proxy", value: Math.max(0, 100 - specificity) },
  ];

  const histogramData = useMemo(
    () => (oopT?.histogram ?? []).map((b) => ({ name: b.label, count: b.count })),
    [oopT],
  );

  const filteredSortedPayers = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    let rows = payerRows.filter((r) => (q === "" ? true : r.payerId.toLowerCase().includes(q)));
    const { key, dir } = tableSort;
    rows = [...rows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av === null || bv === null) {
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        return -1;
      }
      if (typeof av === "string" && typeof bv === "string") {
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return dir === "asc" ? an - bn : bn - an;
    });
    return rows;
  }, [payerRows, tableQuery, tableSort]);

  function toggleSort(key: SortKey) {
    setTableSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    tableSort.key === k ?
      tableSort.dir === "asc" ?
        <ArrowUp className="inline h-3 w-3" />
      : <ArrowDown className="inline h-3 w-3" />
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DemoModeWatermark />
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-arka-teal">ARKA-INS / Validation</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">ROI & validation command center</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Aggregate metrics from <code className="rounded bg-slate-900 px-1 text-xs text-slate-300">ins_validation_events</code>{" "}
              and <code className="rounded bg-slate-900 px-1 text-xs text-slate-300">ins_pa_history</code>. Click any KPI to
              audit underlying rows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMethodOpen(true)}
              className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-200 hover:bg-slate-800"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Methodology
            </button>
            <button
              type="button"
              onClick={() => setEvidenceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded border border-arka-teal/40 bg-arka-teal/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-arka-teal hover:bg-arka-teal/20"
            >
              AIIE evidence
            </button>
          </div>
        </header>

        <MethodologyModal open={methodOpen} onOpenChange={setMethodOpen} />

        {/* Filters */}
        <section
          aria-label="Dashboard filters"
          className="mb-6 grid gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Date range
            <select
              className="rounded border border-slate-700 bg-slate-950 px-2 py-2 font-mono text-sm text-slate-100"
              value={filters.timeRange}
              onChange={(e) =>
                setFilters({ timeRange: e.target.value as MetricsFilters["timeRange"] })
              }
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last 365 days</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Payer
            <select
              className="rounded border border-slate-700 bg-slate-950 px-2 py-2 font-mono text-sm text-slate-100"
              value={filters.payerId}
              onChange={(e) => setFilters({ payerId: e.target.value })}
            >
              <option value="">All payers</option>
              {[...new Set(payerRows.map((r) => r.payerId))].sort().map((id) => (
                <option key={id} value={id}>
                  {payerLabel(id)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Specialty
            <select
              className="rounded border border-slate-700 bg-slate-950 px-2 py-2 font-mono text-sm text-slate-100"
              value={filters.specialty}
              onChange={(e) => setFilters({ specialty: e.target.value })}
            >
              <option value="">All specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            CPT modality
            <select
              className="rounded border border-slate-700 bg-slate-950 px-2 py-2 font-mono text-sm text-slate-100"
              value={filters.cptModality}
              onChange={(e) => setFilters({ cptModality: e.target.value })}
            >
              <option value="">All modalities</option>
              {CPT_MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col justify-end gap-1 text-[10px] text-slate-500">
            {data?.range ?
              <span className="font-mono">
                {format(parseISO(data.range.startIso), "yyyy-MM-dd")} →{" "}
                {format(parseISO(data.range.endIso), "yyyy-MM-dd")}
              </span>
            : null}
            {loading ?
              <span className="flex items-center gap-1 text-arka-teal">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                Refreshing
              </span>
            : null}
          </div>
        </section>

        {error ?
          <div className="mb-4 rounded border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        : null}

        {/* Row 1 — KPIs */}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key performance indicators">
          <button
            type="button"
            onClick={() => void openTrace("pa_auto", "Total PAs auto-approved (gold card + CRD)")}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left transition hover:border-arka-teal/50 hover:bg-slate-900"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Total PAs auto-approved</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-white tabular-nums">
              {kpis?.totalPaAutoApproved ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">Gold card + CRD avoidance events</p>
          </button>
          <button
            type="button"
            onClick={() => void openTrace("minutes", "Minutes saved (provider time)")}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left transition hover:border-arka-teal/50 hover:bg-slate-900"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Minutes saved</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-emerald-400 tabular-nums">
              {(kpis?.totalMinutesSaved ?? 0).toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              FTE equiv.{" "}
              <span className="font-mono text-slate-300">
                {(burden?.fteEquivalent ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </span>
            </p>
          </button>
          <button
            type="button"
            onClick={() => void openTrace("oop", "OOP savings realized (patients)")}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left transition hover:border-arka-teal/50 hover:bg-slate-900"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">OOP savings realized</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-amber-300 tabular-nums">
              {formatUsd(kpis?.oopSavingsRealizedUsd ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Patient-facing transparency & shoppable routing</p>
          </button>
          <button
            type="button"
            onClick={() => void openTrace("cms_sla", "CMS-0057-F SLA compliance (ins_pa_history)")}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left transition hover:border-arka-teal/50 hover:bg-slate-900"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">CMS-0057-F compliance</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-cyan-300 tabular-nums">
              {formatPct(kpis?.cms0057fComplianceRate ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Decisions within 72h / 24h expedited SLA</p>
          </button>
        </section>

        {/* Row 2 — Burden */}
        <section className="mb-6 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Administrative burden</h2>
              <p className="font-mono text-xs text-slate-500">Weekly minutes saved · last 12 weeks · AMA 13 h/wk reference</p>
            </div>
            <p className="font-mono text-xs text-arka-teal">
              Reduction vs national PA baseline:{" "}
              <span className="text-white">{reductionPct.toFixed(1)}%</span>
            </p>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#475569" />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#475569" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <ReferenceLine
                  y={AMA_PHYSICIAN_PA_MINUTES_PER_WEEK}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                  label={{
                    value: "AMA 13h/wk",
                    position: "insideTopRight",
                    fill: "#fbbf24",
                    fontSize: 10,
                  }}
                />
                <Line type="monotone" dataKey="minutesSaved" name="Minutes saved" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Row 3 — Stack + Donut */}
        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-300">Cost avoidance (USD)</h2>
            <p className="mb-3 font-mono text-xs text-slate-500">Stacked: appeals + inappropriate imaging + admin labor</p>
            <div className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#475569" />
                  <YAxis type="category" dataKey="label" width={80} tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#475569" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
                    formatter={(v) => formatUsd(typeof v === "number" ? v : Number(v))}
                  />
                  <Bar
                    dataKey="appeal"
                    name="Appeal costs avoided"
                    stackId="a"
                    fill="#34d399"
                    onClick={() => void openTrace("cost_appeal", "Appeal costs avoided (DTR denial risk reduced)")}
                    className="cursor-pointer"
                  />
                  <Bar
                    dataKey="imaging"
                    name="Inappropriate imaging avoided"
                    stackId="a"
                    fill="#fbbf24"
                    onClick={() => void openTrace("cost_imaging", "Inappropriate imaging avoided (alternative path)")}
                    className="cursor-pointer"
                  />
                  <Bar
                    dataKey="labor"
                    name="Admin labor avoided"
                    stackId="a"
                    fill="#38bdf8"
                    onClick={() => void openTrace("cost_labor", "Admin labor avoided (minutes saved)")}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Click stack segments to trace events. Labor uses $0.85/min fully loaded proxy (see Methodology).
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Denial specificity</h2>
                <p className="font-mono text-xs text-slate-500">Specific reason codes vs boilerplate (model)</p>
              </div>
              <button
                type="button"
                onClick={() => void openTrace("denial_specificity", "Denial rationale trace")}
                className="text-xs font-medium text-arka-teal hover:underline"
              >
                View rows
              </button>
            </div>
            <div className="flex h-56 min-h-56 min-w-0 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#22c55e" : "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
                    formatter={(v) => `${(typeof v === "number" ? v : Number(v)).toFixed(1)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center font-mono text-xs text-slate-400">
              AIIE-aligned specificity score: <span className="text-white">{specificity}%</span>
            </p>
          </div>
        </section>

        {/* Row 4 — Table */}
        <section className="mb-6 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Payer ROI</h2>
            <input
              type="search"
              placeholder="Filter payers…"
              value={tableQuery}
              onChange={(e) => setTableQuery(e.target.value)}
              className="w-full max-w-xs rounded border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm text-slate-100 placeholder:text-slate-600 sm:w-auto"
              aria-label="Filter payer table"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="cursor-pointer py-2 pr-2" onClick={() => toggleSort("payerId")}>
                    Payer <SortIcon k="payerId" />
                  </th>
                  <th className="cursor-pointer py-2 pr-2 text-right" onClick={() => toggleSort("pasProcessed")}>
                    PAs <SortIcon k="pasProcessed" />
                  </th>
                  <th className="cursor-pointer py-2 pr-2 text-right" onClick={() => toggleSort("autoApprovalRate")}>
                    Auto-appr. <SortIcon k="autoApprovalRate" />
                  </th>
                  <th className="cursor-pointer py-2 pr-2 text-right" onClick={() => toggleSort("avgDecisionTimeHours")}>
                    Avg decision (h) <SortIcon k="avgDecisionTimeHours" />
                  </th>
                  <th className="cursor-pointer py-2 pr-2 text-right" onClick={() => toggleSort("appealOverturnRate")}>
                    Appeal overturn <SortIcon k="appealOverturnRate" />
                  </th>
                  <th className="cursor-pointer py-2 text-right" onClick={() => toggleSort("estAnnualSavingsUsd")}>
                    Est. annual $ <SortIcon k="estAnnualSavingsUsd" />
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs text-slate-200">
                {filteredSortedPayers.map((row) => (
                  <tr
                    key={row.payerId}
                    className="border-b border-slate-800/80 hover:bg-slate-800/40"
                  >
                    <td className="py-2 pr-2">
                      <button
                        type="button"
                        onClick={() => void openTrace("pa_auto", `Auto-approvals — ${payerLabel(row.payerId)}`, row.payerId)}
                        className="text-left text-arka-teal hover:underline"
                      >
                        {payerLabel(row.payerId)}
                      </button>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{row.pasProcessed}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{formatPct(row.autoApprovalRate)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {row.avgDecisionTimeHours === null ? "—" : row.avgDecisionTimeHours.toFixed(1)}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {row.appealOverturnRate === null ? "—" : formatPct(row.appealOverturnRate)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-emerald-300">{formatUsd(row.estAnnualSavingsUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSortedPayers.length === 0 ?
              <p className="py-6 text-center text-sm text-slate-500">No payer rows in this range.</p>
            : null}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Annual savings annualized from period appeal, imaging, OOP, and labor components. Date range follows global
            filter above.
          </p>
        </section>

        {/* Row 5 — OOP */}
        <section className="mb-10 rounded-lg border border-amber-900/30 bg-gradient-to-br from-slate-900/80 to-amber-950/20 p-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/90">OOP transparency impact</h2>
              <p className="max-w-3xl text-xs text-slate-400">
                Patient-facing savings and site routing — a differentiator versus traditional RBM: dollars returned to
                members, not only administrative efficiency.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 font-mono text-xs">
              <div>
                <p className="text-slate-500">Cheaper-site reroutes</p>
                <p className="text-2xl font-semibold text-amber-300">{oopT?.cheaperSiteRerouteCount ?? 0}</p>
                <button
                  type="button"
                  onClick={() => void openTrace("oop_reroute", "Cheaper-site reroute events")}
                  className="mt-1 text-arka-teal hover:underline"
                >
                  Trace rows
                </button>
              </div>
              <div>
                <p className="text-slate-500">Total patient OOP savings</p>
                <p className="text-2xl font-semibold text-white">{formatUsd(oopT?.totalOopSavingsUsd ?? 0)}</p>
                <button
                  type="button"
                  onClick={() => void openTrace("oop", "OOP savings events")}
                  className="mt-1 text-arka-teal hover:underline"
                >
                  Trace rows
                </button>
              </div>
            </div>
          </div>
          <div className="h-52 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#475569" />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#475569" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
                />
                <Bar dataKey="count" name="Cases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Histogram uses estimated OOP buckets from <code className="rounded bg-slate-900 px-1">oop_estimate_presented</code>{" "}
            and realized savings rows.
          </p>
        </section>
      </div>

      {/* Trace drawer */}
      <Dialog.Root open={traceOpen} onOpenChange={setTraceOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <Dialog.Title className="pr-8 text-sm font-semibold text-white">{traceTitle}</Dialog.Title>
              <Dialog.Close className="rounded p-2 text-slate-400 hover:bg-slate-900 hover:text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <p className="border-b border-slate-800 px-4 py-2 font-mono text-[10px] text-slate-500">
              Source: {traceSource}
            </p>
            <div className="flex-1 overflow-auto p-4">
              {traceLoading ?
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading rows…
                </div>
              : null}
              {traceNote ?
                <p className="mb-2 text-sm text-amber-200/90">{traceNote}</p>
              : null}
              {!traceLoading && traceRows.length === 0 && !traceNote ?
                <p className="text-sm text-slate-500">No rows in this slice.</p>
              : null}
              {!traceLoading && traceRows.length > 0 ?
                <pre className="overflow-x-auto rounded border border-slate-800 bg-slate-900/80 p-3 font-mono text-[10px] leading-relaxed text-slate-300">
                  {JSON.stringify(traceRows, null, 2)}
                </pre>
              : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
