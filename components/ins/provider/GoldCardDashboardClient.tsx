"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, Clock, FileCheck2, Landmark, Sparkles, TrendingUp } from "lucide-react";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { InterestingCaseBadge } from "@/components/ins/provider/InterestingCaseBadge";
import { SchedulingIntentBanner } from "@/components/ins/provider/SchedulingIntentBanner";
import { PriorImagingControlSheetGate } from "@/components/shared/PriorImagingControlSheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import type { GoldCardPortfolioRow } from "@/lib/aiie/gold-card";
import { routes } from "@/lib/constants";
import {
  buildAiieScoreHistogram,
  rankNearMilestones,
} from "@/lib/ins/gold-card-dashboard-helpers";
import { buildGoldCardPriorImagingSnapshot } from "@/lib/ins/gold-card-prior-imaging-demo";
import { REVIEWER_DEMO_PROVIDER_ID } from "@/lib/ins/reviewer-queue";
import type { RarityAssessment } from "@/lib/aiie/interesting-case";
import type { AIIEOrder } from "@/lib/types/aiie";
import type { ValidationMetricsApiResponse } from "@/lib/validation/metrics";

type PortfolioResponse = {
  portfolio: GoldCardPortfolioRow[];
  unevaluatedPairs: Array<{ cptCode: string; payerId: string }>;
};

type DrilldownPaRow = {
  id: string;
  event_type: string;
  minutes_saved?: number | null;
  occurred_at: string;
};

function payerLabel(id: string): string {
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export interface GoldCardDashboardClientProps {
  /** When true, rendered inside the provider hub tabs (no full-page chrome). */
  embedded?: boolean;
}

/**
 * Provider-facing gold card portfolio dashboard (SMART-launched or standalone demo).
 */
export function GoldCardDashboardClient({ embedded = false }: GoldCardDashboardClientProps) {
  const searchParams = useSearchParams();
  const providerFromQuery = searchParams.get("providerId")?.trim();

  const effectiveProviderId =
    providerFromQuery && providerFromQuery.length > 0 ? providerFromQuery : REVIEWER_DEMO_PROVIDER_ID;

  const [portfolioData, setPortfolioData] = React.useState<PortfolioResponse | null>(null);
  const [metrics, setMetrics] = React.useState<ValidationMetricsApiResponse | null>(null);
  const [goldPaCount, setGoldPaCount] = React.useState<number>(0);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [chartReady, setChartReady] = React.useState(false);
  const [detailCpt, setDetailCpt] = React.useState<string | null>(null);
  const [detailRarity, setDetailRarity] = React.useState<RarityAssessment | null>(null);
  const [detailTotalOrders, setDetailTotalOrders] = React.useState<number | undefined>(undefined);
  const [rarityLoading, setRarityLoading] = React.useState(false);
  const [teachingMarking, setTeachingMarking] = React.useState(false);
  const [teachingDone, setTeachingDone] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setChartReady(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const portUrl = new URL("/api/ins/gold-card/eligibility", base);
        portUrl.searchParams.set("providerId", effectiveProviderId);

        const metUrl = new URL("/api/ins/validation/metrics", base);
        metUrl.searchParams.set("timeRange", "30d");
        metUrl.searchParams.set("providerId", effectiveProviderId);

        const drillUrl = new URL("/api/ins/validation/drilldown", base);
        drillUrl.searchParams.set("kpi", "pa_auto");
        drillUrl.searchParams.set("timeRange", "30d");
        drillUrl.searchParams.set("providerId", effectiveProviderId);

        const [portRes, metRes, drillRes] = await Promise.all([
          fetch(portUrl.toString()),
          fetch(metUrl.toString()),
          fetch(drillUrl.toString()),
        ]);

        if (!portRes.ok) {
          const j = (await portRes.json()) as { error?: string };
          throw new Error(j.error ?? "Failed to load gold card portfolio");
        }
        const portJson = (await portRes.json()) as PortfolioResponse;
        if (cancelled) {
          return;
        }
        setPortfolioData(portJson);

        if (metRes.ok) {
          const metJson = (await metRes.json()) as ValidationMetricsApiResponse;
          if (!cancelled) {
            setMetrics(metJson);
          }
        } else if (!cancelled) {
          setMetrics(null);
        }

        if (drillRes.ok) {
          const drillJson = (await drillRes.json()) as { rows?: DrilldownPaRow[] };
          const rows = drillJson.rows ?? [];
          const gold = rows.filter((r) => r.event_type === "pa_avoided_by_gold_card").length;
          if (!cancelled) {
            setGoldPaCount(gold);
          }
        } else if (!cancelled) {
          setGoldPaCount(0);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load dashboard");
          setPortfolioData(null);
          setMetrics(null);
          setGoldPaCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [effectiveProviderId]);

  const portfolio = portfolioData?.portfolio ?? [];
  const unevaluated = portfolioData?.unevaluatedPairs ?? [];
  const goldCardedCptCount = new Set(portfolio.filter((r) => r.status.eligible).map((r) => r.cptCode)).size;
  const chartData = React.useMemo(() => buildAiieScoreHistogram(portfolio), [portfolio]);
  const nearRows = React.useMemo(() => rankNearMilestones(portfolio).slice(0, 5), [portfolio]);

  const minutesThisMonth = metrics?.administrativeBurdenReduction.totalMinutesSaved ?? 0;
  const fteEq = metrics?.administrativeBurdenReduction.fteEquivalent ?? 0;
  const adminLaborUsd = metrics?.costAvoidanceStackUsd.adminLaborAvoidedUsd ?? 0;

  const detailSnapshot = React.useMemo(
    () => (detailCpt ? buildGoldCardPriorImagingSnapshot(detailCpt) : null),
    [detailCpt],
  );
  const detailProposed: AIIEOrder = React.useMemo(
    () => ({
      cpt: detailCpt ?? undefined,
      modality: "CT",
      bodyPart: "Chest",
      procedure: detailCpt ? `CT Chest (${detailCpt})` : "CT Chest",
    }),
    [detailCpt],
  );

  React.useEffect(() => {
    if (!detailCpt || !detailSnapshot) {
      const t = window.setTimeout(() => {
        setDetailRarity(null);
        setDetailTotalOrders(undefined);
        setTeachingDone(false);
      }, 0);
      return () => window.clearTimeout(t);
    }

    let cancelled = false;
    async function assessRarity() {
      setRarityLoading(true);
      setDetailRarity(null);
      try {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch(`${base}/api/ins/interesting-case/assess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot: detailSnapshot,
            order: detailProposed,
            demographics: { ageYears: 52, sex: "female" as const, regionBucket: "rural-midwest" },
            redFlags: {
              cancerHistory: true,
              neurologicalDeficit: true,
              fever: false,
              weightLoss: false,
              trauma: false,
              immunocompromised: false,
              ivDrugUse: false,
              osteoporosis: false,
              ageOver50: true,
              ageUnder18: false,
              progressiveSymptoms: true,
              bladderBowelDysfunction: false,
              suddenOnset: false,
            },
          }),
        });
        if (!res.ok) {
          return;
        }
        const json = (await res.json()) as {
          rarity?: RarityAssessment;
          totalOrders?: number;
        };
        if (!cancelled) {
          setDetailRarity(json.rarity ?? null);
          setDetailTotalOrders(json.rarity?.corpusTotal ?? json.totalOrders);
        }
      } finally {
        if (!cancelled) {
          setRarityLoading(false);
        }
      }
    }
    void assessRarity();
    return () => {
      cancelled = true;
    };
  }, [detailCpt, detailSnapshot, detailProposed]);

  const handleMarkInteresting = React.useCallback(async () => {
    if (!detailSnapshot || !detailRarity?.interesting) {
      return;
    }
    setTeachingMarking(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/ins/teaching-queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-provider-id": effectiveProviderId,
        },
        body: JSON.stringify({
          patientHash: detailSnapshot.patientHash,
          rarity: detailRarity,
          snapshot: detailSnapshot,
          addedBy: effectiveProviderId,
        }),
      });
      if (res.ok) {
        setTeachingDone(true);
      }
    } finally {
      setTeachingMarking(false);
    }
  }, [detailSnapshot, detailRarity, effectiveProviderId]);

  return (
    <div className={embedded ? "flex flex-col bg-slate-100" : "flex min-h-screen flex-col bg-slate-100"}>
      <DemoModeWatermark />
      <header
        className={
          embedded
            ? "border-b border-slate-200 bg-white"
            : "sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"
        }
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <Link href={routes.ins} className="text-arka-teal hover:underline">
                ARKA-INS
              </Link>
              <span className="text-slate-400">
                {embedded ? " / Provider dashboard / Gold Card" : " / Provider / Gold Card"}
              </span>
            </p>
            <h1 className="text-xl font-semibold text-slate-900">Gold card portfolio</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Track CPT × payer eligibility, Wilson confidence scores, and time returned to patient care. In production
              this view opens from your EHR after SMART launch; use{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800">providerId</code> in the URL for
              demos.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-mono text-[11px] text-slate-700">Provider {effectiveProviderId.slice(0, 8)}…</div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {loadError && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading gold card portfolio…
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <SchedulingIntentBanner />
            <section aria-labelledby="summary-heading">
              <h2 id="summary-heading" className="sr-only">
                Summary metrics
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Award className="h-4 w-4 shrink-0 text-arka-teal" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wide">Gold-carded CPTs</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{goldCardedCptCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Distinct CPT codes with at least one active gold card payer pair.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FileCheck2 className="h-4 w-4 shrink-0 text-arka-teal" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wide">PAs bypassed (30 days)</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{goldPaCount}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Prior authorization workflows avoided via gold card automation (tracked events).
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4 shrink-0 text-arka-teal" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wide">Minutes saved (30 days)</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{Math.round(minutesThisMonth)}</p>
                  <p className="mt-1 text-xs text-slate-500">Administrative time logged against validation events for this provider.</p>
                </div>
              </div>
            </section>

            <section aria-labelledby="portfolio-heading" className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 id="portfolio-heading" className="text-lg font-semibold text-slate-900">
                  Portfolio
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Every CPT × payer combination with Wilson lower bound (shown as score), observed approval rate, sample
                  size, and cache validity.
                </p>
              </div>
              <TableScrollWrapper className="max-h-[480px]" aria-label="Gold card portfolio by CPT and payer">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">
                        CPT
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Payer
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Eligibility
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Score (Wilson CI)
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Approval rate
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Sample
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Valid through
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portfolio.length === 0 && unevaluated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No portfolio rows yet. Ordering history will populate CPT × payer pairs; scores refresh on a
                          rolling window.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {portfolio.map((row) => (
                          <tr
                            key={`${row.cptCode}-${row.payerId}`}
                            className="cursor-pointer hover:bg-slate-50/80"
                            onClick={() => setDetailCpt(row.cptCode)}
                          >
                            <td className="px-4 py-3 font-mono text-slate-900">{row.cptCode}</td>
                            <td className="px-4 py-3 text-slate-800">{payerLabel(row.payerId)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  row.status.eligible ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {row.status.eligible ? "Gold card" : "Not yet"}
                              </span>
                            </td>
                            <td className="px-4 py-3 tabular-nums text-slate-900">{row.status.score}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-800">{formatPct(row.status.approvalRate)}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-800">{row.status.sampleSize}</td>
                            <td className="px-4 py-3 text-slate-700">{formatDate(row.validUntil)}</td>
                          </tr>
                        ))}
                        {unevaluated.map((row) => (
                          <tr key={`${row.cptCode}-${row.payerId}-uneval`} className="bg-slate-50/50 hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-mono text-slate-900">{row.cptCode}</td>
                            <td className="px-4 py-3 text-slate-800">{payerLabel(row.payerId)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800">
                                Pending cache
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">—</td>
                            <td className="px-4 py-3 text-slate-500">—</td>
                            <td className="px-4 py-3 text-slate-500">—</td>
                            <td className="px-4 py-3 text-slate-500">—</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </TableScrollWrapper>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section
                aria-labelledby="milestone-heading"
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
                  <div>
                    <h2 id="milestone-heading" className="text-lg font-semibold text-slate-900">
                      Next milestone
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Closest CPT × payer pairs to gold card thresholds (more history or higher approval trajectory).
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3">
                  {nearRows.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No near-eligible rows with milestone copy. Add ordering volume or wait for cache refresh.
                    </li>
                  ) : (
                    nearRows.map((row) => (
                      <li
                        key={`${row.cptCode}-${row.payerId}-ms`}
                        className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-800"
                      >
                        <span className="font-mono font-semibold text-slate-900">{row.cptCode}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-medium">{payerLabel(row.payerId)}</span>
                        <p className="mt-1 text-slate-600">{row.status.nextMilestone}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section
                aria-labelledby="burden-heading"
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal" aria-hidden />
                  <div>
                    <h2 id="burden-heading" className="text-lg font-semibold text-slate-900">
                      Admin burden saved (this month)
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Modeled labor value from administrative minutes logged for this provider in the last 30 days (
                      {metrics?.range.days ?? 30} day window).
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Labor avoided</dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(adminLaborUsd)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">FTE equivalent</dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{fteEq.toFixed(3)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  FTE uses annual productive minutes (2,080 hours). Figures align with the ROI validation dashboard
                  methodology for administrative time logging.
                </p>
              </section>
            </div>

            <section aria-labelledby="trend-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden />
                  <div>
                    <h2 id="trend-heading" className="text-lg font-semibold text-slate-900">
                      AIIE clinical score distribution
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-600">
                      Illustrative distribution of AIIE scores (1–9) for your portfolio trajectory versus a diagnostic
                      radiology peer benchmark curve. Shape updates from your cached Wilson performance when full PA
                      score feeds are not yet wired.
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-72 min-h-[288px] w-full min-w-0">
                {chartReady ?
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="scoreLabel" tick={{ fontSize: 12 }} label={{ value: "Score", position: "insideBottom", offset: -2 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: "Share of cases", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const n = typeof value === "number" ? value : Number(value);
                        const safe = Number.isFinite(n) ? n : 0;
                        const label =
                          name === "Your estimated distribution" || name === "providerPct" ?
                            "Your estimated distribution"
                          : "Specialty peer benchmark";
                        return [`${safe}%`, label];
                      }}
                      labelFormatter={(label) => `Clinical score ${label}`}
                    />
                    <Legend />
                      <Bar dataKey="peerPct" name="Specialty peer benchmark" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="providerPct" name="Your estimated distribution" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                : <div className="flex h-full items-center justify-center text-sm text-slate-500">Preparing chart…</div>}
              </div>
            </section>
          </div>
        )}
      </div>

      <Dialog open={detailCpt !== null} onOpenChange={(open) => !open && setDetailCpt(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              CPT {detailCpt} — prior imaging
            </DialogTitle>
          </DialogHeader>
          {rarityLoading ?
            <p className="text-xs text-slate-500">Checking case rarity…</p>
          : null}
          {detailRarity?.interesting && !teachingDone ?
            <InterestingCaseBadge
              rarity={detailRarity}
              totalOrders={detailTotalOrders}
              onMarkInteresting={() => void handleMarkInteresting()}
              marking={teachingMarking}
            />
          : null}
          {teachingDone ?
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Added to the teaching queue (de-identified). Education committee can review when connected to Supabase.
            </p>
          : null}
          {detailSnapshot ?
            <PriorImagingControlSheetGate
              snapshot={detailSnapshot}
              proposed={detailProposed}
              variant="mini"
              product="INS"
              onOverride={() => {}}
            />
          : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
