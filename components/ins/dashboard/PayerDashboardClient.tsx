"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { MetricCard } from "@/components/ins/MetricCard";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { useMetricsStore } from "@/lib/stores/metrics-store";
import { cn } from "@/lib/utils";

import { DecisionDrawer } from "./DecisionDrawer";
import {
  buildApprovalFunnelData,
  buildDenialParetoData,
  buildDemoRecentDecisions,
  mapPaHistoryToDecisions,
  type RecentDecisionRow,
} from "./recent-decisions";

const PayerDashboardCharts = dynamic(
  () =>
    import("./PayerDashboardCharts").then((m) => ({
      default: m.PayerDashboardCharts,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-[340px] animate-pulse rounded-radius-lg border border-border-subtle bg-surface-raised" />
        <div className="h-[340px] animate-pulse rounded-radius-lg border border-border-subtle bg-surface-raised" />
      </div>
    ),
  },
);

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function statusVariant(status: RecentDecisionRow["status"]) {
  switch (status) {
    case "approved":
    case "auto_approved":
      return "success" as const;
    case "denied":
      return "danger" as const;
    case "pended":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function sparkFromDaily(values: number[]): number[] {
  if (values.length === 0) return [3, 4, 5, 4, 6, 5, 7];
  return values.slice(-7);
}

/** Aggregated EHR-rail automation stats from GET /api/ehr/events. */
interface AutomationStatsView {
  narrativesGenerated: number;
  accepts: number;
  writebacks: number;
  clicksSavedEstimate: number;
}

const DEMO_AUTOMATION_STATS: AutomationStatsView = {
  narrativesGenerated: 312,
  accepts: 187,
  writebacks: 164,
  clicksSavedEstimate: 312 * 14 + 164 * 9,
};

/**
 * Payer-grade utilization dashboard — metric grid, funnel, Pareto, recent decisions.
 */
export function PayerDashboardClient() {
  const data = useMetricsStore((s) => s.data);
  const loading = useMetricsStore((s) => s.loading);
  const fetchMetrics = useMetricsStore((s) => s.fetchMetrics);

  const [decisions, setDecisions] = React.useState<RecentDecisionRow[]>([]);
  const [decisionsLoading, setDecisionsLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<RecentDecisionRow | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [goldCardCount, setGoldCardCount] = React.useState<number | null>(null);
  const [automation, setAutomation] = React.useState<AutomationStatsView | null>(null);

  React.useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadDecisions() {
      setDecisionsLoading(true);
      try {
        const u = new URL("/api/ins/validation/drilldown", window.location.origin);
        u.searchParams.set("kpi", "cms_sla");
        u.searchParams.set("timeRange", "30d");
        const res = await fetch(u.toString());
        if (!res.ok) throw new Error("drilldown failed");
        const json = (await res.json()) as { rows?: unknown[] };
        const rows = (json.rows ?? []) as Parameters<typeof mapPaHistoryToDecisions>[0];
        if (!cancelled) {
          setDecisions(rows.length > 0 ? mapPaHistoryToDecisions(rows) : buildDemoRecentDecisions());
        }
      } catch {
        if (!cancelled) setDecisions(buildDemoRecentDecisions());
      } finally {
        if (!cancelled) setDecisionsLoading(false);
      }
    }
    void loadDecisions();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function loadGold() {
      try {
        const u = new URL("/api/ins/gold-card/eligibility", window.location.origin);
        const res = await fetch(u.toString());
        if (!res.ok) return;
        const json = (await res.json()) as { portfolio?: Array<{ status: { eligible: boolean } }> };
        const count = (json.portfolio ?? []).filter((r) => r.status.eligible).length;
        if (!cancelled) setGoldCardCount(count);
      } catch {
        if (!cancelled) setGoldCardCount(24);
      }
    }
    void loadGold();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function loadAutomation() {
      try {
        const res = await fetch("/api/ehr/events");
        if (!res.ok) throw new Error("automation stats failed");
        const json = (await res.json()) as { data?: Partial<AutomationStatsView> | null };
        const data = json.data;
        // Sparse local logs (fresh deploys) fall back to representative demo numbers.
        if (!cancelled) {
          setAutomation(
            data && (data.narrativesGenerated ?? 0) > 0
              ? {
                  narrativesGenerated: data.narrativesGenerated ?? 0,
                  accepts: data.accepts ?? 0,
                  writebacks: data.writebacks ?? 0,
                  clicksSavedEstimate: data.clicksSavedEstimate ?? 0,
                }
              : DEMO_AUTOMATION_STATS,
          );
        }
      } catch {
        if (!cancelled) setAutomation(DEMO_AUTOMATION_STATS);
      }
    }
    void loadAutomation();
    return () => {
      cancelled = true;
    };
  }, []);

  const payerRoi = data?.payerROI;
  const daily = data?.timeSeries.daily ?? [];
  const totalAuth =
    data?.payerBreakdown.reduce((sum, p) => sum + p.pasProcessed, 0) ?? 502;
  const dailyPas = daily.map((d) => d.pasAvoided + d.eventsCount * 0.4);
  const dailyAuto = daily.map((d) => d.pasAvoided);
  const dailyDecision = daily.map((d) => 18 + d.eventsCount * 0.2);

  const funnelData = buildApprovalFunnelData(totalAuth);
  const paretoData = buildDenialParetoData();

  const openDecision = (row: RecentDecisionRow) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  return (
    <div className="bg-surface-sunken pb-12">
      <DemoModeWatermark />

      <div className="border-b border-border-subtle bg-surface px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="text-h2 font-semibold text-arka-slate-900">Utilization dashboard</h1>
        <p className="mt-1 max-w-2xl text-caption text-arka-slate-500">
          Payer-grade view of auth volume, auto-approval performance, and AIIE-aligned decisions — CMS-0057-F ready.
        </p>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Auth requests (30d)"
            value={loading ? "—" : String(totalAuth)}
            delta={{ value: "4.2%", direction: "up", positiveIsGood: true }}
            sparkline={sparkFromDaily(dailyPas)}
            loading={loading}
          />
          <MetricCard
            label="Auto-approval rate"
            value={loading ? "—" : formatPct(payerRoi?.autoApprovalRate ?? 0.78)}
            delta={{ value: "1.1%", direction: "up", positiveIsGood: true }}
            sparkline={sparkFromDaily(dailyAuto)}
            loading={loading}
          />
          <MetricCard
            label="Median decision time"
            value={loading ? "—" : formatHours(payerRoi?.avgTimeToDecisionHours ?? 18.5)}
            delta={{ value: "2.4h", direction: "down", positiveIsGood: true }}
            sparkline={sparkFromDaily(dailyDecision)}
            loading={loading}
          />
          <MetricCard
            label="Gold-card providers"
            value={goldCardCount == null ? "—" : String(goldCardCount)}
            delta={{ value: "3", direction: "up", positiveIsGood: true }}
            sparkline={[18, 19, 20, 21, 22, 23, goldCardCount ?? 24]}
            loading={goldCardCount == null && loading}
          />
        </div>

        <section aria-labelledby="automation-stats-heading">
          <div className="mb-3">
            <h2 id="automation-stats-heading" className="text-sm font-semibold text-arka-slate-900">
              Silent automation (EHR rail)
            </h2>
            <p className="text-caption text-arka-slate-500">
              PA narratives and order write-backs generated by AIIE without clinician paperwork — every event audited, no PHI.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="PA narratives generated"
              value={automation == null ? "—" : String(automation.narrativesGenerated)}
              delta={{ value: "12.6%", direction: "up", positiveIsGood: true }}
              loading={automation == null}
            />
            <MetricCard
              label="Suggestions accepted"
              value={automation == null ? "—" : String(automation.accepts)}
              delta={{ value: "5.4%", direction: "up", positiveIsGood: true }}
              loading={automation == null}
            />
            <MetricCard
              label="Orders written back"
              value={automation == null ? "—" : String(automation.writebacks)}
              delta={{ value: "7.1%", direction: "up", positiveIsGood: true }}
              loading={automation == null}
            />
            <MetricCard
              label="Clicks saved (est.)"
              value={
                automation == null ? "—" : automation.clicksSavedEstimate.toLocaleString()
              }
              delta={{ value: "11.8%", direction: "up", positiveIsGood: true }}
              loading={automation == null}
            />
          </div>
        </section>

        <PayerDashboardCharts funnelData={funnelData} paretoData={paretoData} />

        <section className="rounded-radius-lg border border-border-subtle bg-surface-raised shadow-elevation-1">
          <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-arka-slate-900">Recent decisions</h2>
            <p className="text-caption text-arka-slate-500">Click a row for factor breakdown and evidence</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-caption font-medium text-arka-slate-500">
                  <th className="px-4 py-3 sm:px-5">CPT</th>
                  <th className="px-4 py-3">Payer</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">AIIE</th>
                </tr>
              </thead>
              <tbody>
                {decisionsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-arka-slate-500">
                      Loading decisions…
                    </td>
                  </tr>
                ) : (
                  decisions.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "cursor-pointer border-b border-border-subtle transition-colors last:border-0",
                        "hover:bg-surface-sunken focus-within:bg-surface-sunken",
                      )}
                      onClick={() => openDecision(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDecision(row);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View decision for CPT ${row.cptCode}`}
                    >
                      <td className="px-4 py-3 font-mono text-arka-slate-800 sm:px-5">{row.cptCode}</td>
                      <td className="px-4 py-3 text-arka-slate-700">{row.payerLabel}</td>
                      <td className="px-4 py-3 tabular-nums text-arka-slate-600">
                        {new Date(row.submittedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(row.status)} className="capitalize">
                          {row.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <ScoreRing score={row.aiieScore} size={28} label="" animate={false} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <DecisionDrawer
        decision={selected}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
