"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { MetricCard } from "@/components/ins/MetricCard";
import { OrderLifecycleTable } from "@/components/ins/provider/OrderLifecycleTable";
import { SchedulingIntentBanner } from "@/components/ins/provider/SchedulingIntentBanner";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GoldCardPortfolioRow } from "@/lib/aiie/gold-card";
import { REVIEWER_DEMO_PROVIDER_ID } from "@/lib/ins/reviewer-queue";
import { buildAiieScoreHistogram } from "@/lib/ins/gold-card-dashboard-helpers";
import type { ValidationMetricsApiResponse } from "@/lib/validation/metrics";
import {
  INS_CHART_COLORS,
  INS_CHART_MARGIN,
  InsChartTooltip,
} from "@/components/ins/dashboard/ins-chart-theme";

type PortfolioResponse = {
  portfolio: GoldCardPortfolioRow[];
  unevaluatedPairs: Array<{ cptCode: string; payerId: string }>;
};

type ProviderTab = "overview" | "lifecycle";

function payerLabel(id: string): string {
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * Provider persona — gold-card hero, PA history, denial-risk trends.
 */
export function ProviderDashboardClient() {
  const searchParams = useSearchParams();
  const providerFromQuery = searchParams.get("providerId")?.trim();
  const initialTab: ProviderTab = searchParams.get("tab") === "lifecycle" ? "lifecycle" : "overview";

  const effectiveProviderId =
    providerFromQuery && providerFromQuery.length > 0 ? providerFromQuery : REVIEWER_DEMO_PROVIDER_ID;

  const [tab, setTab] = React.useState<ProviderTab>(initialTab);
  const [portfolioData, setPortfolioData] = React.useState<PortfolioResponse | null>(null);
  const [metrics, setMetrics] = React.useState<ValidationMetricsApiResponse | null>(null);
  const [paHistory, setPaHistory] = React.useState<
    Array<{ submittedAt: string; decision: string }>
  >([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const base = window.location.origin;
        const portUrl = new URL("/api/ins/gold-card/eligibility", base);
        portUrl.searchParams.set("providerId", effectiveProviderId);

        const metUrl = new URL("/api/ins/validation/metrics", base);
        metUrl.searchParams.set("timeRange", "30d");
        metUrl.searchParams.set("providerId", effectiveProviderId);

        const histUrl = new URL("/api/ins/reviewer/history", base);
        histUrl.searchParams.set("providerId", effectiveProviderId);
        histUrl.searchParams.set("cptCode", "72148");
        histUrl.searchParams.set("payerId", "uhc");

        const [portRes, metRes, histRes] = await Promise.all([
          fetch(portUrl.toString()),
          fetch(metUrl.toString()),
          fetch(histUrl.toString()),
        ]);

        if (!portRes.ok) {
          const j = (await portRes.json()) as { error?: string };
          throw new Error(j.error ?? "Failed to load portfolio");
        }
        const portJson = (await portRes.json()) as PortfolioResponse;
        if (!cancelled) setPortfolioData(portJson);

        if (metRes.ok) {
          setMetrics((await metRes.json()) as ValidationMetricsApiResponse);
        }

        if (histRes.ok) {
          const h = (await histRes.json()) as { rows?: typeof paHistory };
          if (!cancelled) setPaHistory(h.rows ?? []);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load");
          setPortfolioData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [effectiveProviderId]);

  const portfolio = portfolioData?.portfolio ?? [];
  const goldRows = portfolio.filter((r) => r.status.eligible);
  const heroScore =
    goldRows.length > 0
      ? goldRows.reduce((sum, r) => sum + r.status.score, 0) / goldRows.length
      : portfolio[0]?.status.score ?? 72;
  const aiieToNine = Math.min(9, Math.max(1, Math.round(heroScore / 11)));
  const histogram = React.useMemo(() => buildAiieScoreHistogram(portfolio), [portfolio]);

  const denialTrend = React.useMemo(() => {
    const daily = metrics?.timeSeries.daily ?? [];
    if (daily.length === 0) {
      return [
        { week: "W1", risk: 42 },
        { week: "W2", risk: 38 },
        { week: "W3", risk: 35 },
        { week: "W4", risk: 31 },
      ];
    }
    return daily.slice(-8).map((d) => ({
      week: d.date.slice(5),
      risk: Math.round(28 + d.eventsCount * 1.2),
    }));
  }, [metrics]);

  const autoRate = metrics?.payerROI.autoApprovalRate ?? 0.74;

  return (
    <div className="bg-surface-sunken pb-12">
      <DemoModeWatermark />

      <div className="border-b border-border-subtle bg-surface px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="text-h2 font-semibold text-arka-slate-900">Provider hub</h1>
        <p className="mt-1 text-caption text-arka-slate-500">
          Gold card portfolio, PA history, and denial-risk trends for your imaging orders.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ProviderTab)}
        className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
      >
        <TabsList className="mb-6 grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lifecycle">Order lifecycle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          {loadError ? (
            <div className="rounded-radius-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
              {loadError}
            </div>
          ) : null}

          <SchedulingIntentBanner />

          <section className="rounded-radius-lg border border-border-subtle bg-surface-raised p-6 shadow-elevation-1">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <ScoreRing score={aiieToNine} size={140} label="Gold card" />
              <div className="flex-1 text-center sm:text-left">
                <Badge variant={goldRows.length > 0 ? "success" : "warning"} className="mb-2">
                  {goldRows.length > 0 ? "Gold card active" : "Building toward gold card"}
                </Badge>
                <h2 className="text-h3 font-semibold text-arka-slate-900">
                  Portfolio score {heroScore.toFixed(0)}%
                </h2>
                <p className="mt-2 max-w-xl text-body text-arka-slate-600">
                  {goldRows.length} CPT × payer pairs gold-carded · Provider{" "}
                  <span className="font-mono text-sm">{effectiveProviderId.slice(0, 8)}…</span>
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Gold-carded CPTs"
              value={loading ? "—" : String(new Set(goldRows.map((r) => r.cptCode)).size)}
              loading={loading}
              sparkline={[2, 3, 4, 5, 6, goldRows.length, goldRows.length]}
            />
            <MetricCard
              label="Auto-approval rate (30d)"
              value={loading ? "—" : formatPct(autoRate)}
              delta={{ value: "2.1%", direction: "up", positiveIsGood: true }}
              loading={loading}
            />
            <MetricCard
              label="Admin minutes saved"
              value={loading ? "—" : String(metrics?.administrativeBurdenReduction.totalMinutesSaved ?? 0)}
              loading={loading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1">
              <h3 className="text-sm font-semibold text-arka-slate-900">Denial-risk trend</h3>
              <p className="text-caption text-arka-slate-500">Rolling proxy from recent order volume</p>
              <div className="mt-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={denialTrend} margin={INS_CHART_MARGIN}>
                    <CartesianGrid stroke={INS_CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: INS_CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                    <Tooltip content={<InsChartTooltip valueFormatter={(v) => `${v}%`} />} />
                    <Line type="monotone" dataKey="risk" stroke={INS_CHART_COLORS.primary} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1">
              <h3 className="text-sm font-semibold text-arka-slate-900">AIIE score distribution</h3>
              <div className="mt-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram} margin={INS_CHART_MARGIN}>
                    <CartesianGrid stroke={INS_CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="scoreLabel" tick={{ fontSize: 10, fill: INS_CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<InsChartTooltip valueFormatter={(v) => `${v}%`} />} />
                    <Bar dataKey="providerPct" fill={INS_CHART_COLORS.primaryDark} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="rounded-radius-lg border border-border-subtle bg-surface-raised shadow-elevation-1">
            <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
              <h3 className="text-sm font-semibold text-arka-slate-900">PA history</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-caption text-arka-slate-500">
                    <th className="px-4 py-3 text-left sm:px-5">Submitted</th>
                    <th className="px-4 py-3 text-left">CPT</th>
                    <th className="px-4 py-3 text-left">Payer</th>
                    <th className="px-4 py-3 text-left">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-arka-slate-500">
                        Loading…
                      </td>
                    </tr>
                  ) : paHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-arka-slate-500">
                        No PA history rows for demo CPT/payer pair yet.
                      </td>
                    </tr>
                  ) : (
                    paHistory.map((row, i) => (
                      <tr
                        key={`${row.submittedAt}-${i}`}
                        className="border-b border-border-subtle last:border-0 hover:bg-surface-sunken"
                      >
                        <td className="px-4 py-3 tabular-nums text-arka-slate-600 sm:px-5">
                          {new Date(row.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono">72148</td>
                        <td className="px-4 py-3">{payerLabel("uhc")}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={row.decision === "denied" ? "danger" : "success"}
                            className="capitalize"
                          >
                            {row.decision.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {portfolio.length > 0 ? (
              <div className="border-t border-border-subtle px-4 py-3 sm:px-5">
                <p className="text-caption text-arka-slate-500">
                  {portfolio.length} CPT × payer pairs tracked in gold card portfolio
                </p>
              </div>
            ) : null}
          </section>
        </TabsContent>

        <TabsContent value="lifecycle" className="focus-visible:outline-none">
          <OrderLifecycleTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
