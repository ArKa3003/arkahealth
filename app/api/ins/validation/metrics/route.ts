/**
 * ARKA-INS validation / ROI metrics for the dashboard (admin/service role).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { buildOfflineDemoMetricsResponse } from "@/lib/demo/offline-demo-metrics";
import { isDemoMode } from "@/lib/demo/demo-mode";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregateMonthlyRoiFromEvents,
  buildDailyTimeSeries,
  buildMnaiGreenRateTimeSeries,
  buildWeeklyMinutesLastNWeeks,
  cptMatchesImagingModality,
  computeBurdenReduction,
  computeClinicalQuality,
  computeCostAvoidance,
  computeCostAvoidanceStackUsd,
  computeOopTransparency,
  computePayerBreakdown,
  computePayerROI,
  mapRoiSummaryRows,
  sumMinutesSaved,
  type DateRangeBounds,
  type PaHistoryInput,
  type ValidationEventInput,
  type ValidationMetricsApiResponse,
  type RoiSummaryRow,
} from "@/lib/validation/metrics";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

const querySchema = z.object({
  timeRange: z.enum(["7d", "30d", "90d", "365d"]).default("30d"),
  payerId: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
  providerId: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
  specialty: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
  cptModality: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
});

function daysForRange(tr: z.infer<typeof querySchema>["timeRange"]): number {
  switch (tr) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "365d":
      return 365;
    default:
      return 30;
  }
}

function rangeBounds(days: number): DateRangeBounds {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    days,
  };
}

type ValidationEventRow = ValidationEventInput & {
  occurred_at: string;
  provider_id: string | null;
  payer_id: string | null;
  metadata?: unknown;
};

type PaHistoryRow = PaHistoryInput & {
  payer_id: string;
  provider_id: string;
  cpt_code: string;
};

type AiieAuditRow = {
  created_at: string;
  mnai_tier: string | null;
  cpt: string | null;
};

function toPaInputs(rows: PaHistoryRow[]): PaHistoryInput[] {
  return rows.map((r) => ({
    submitted_at: r.submitted_at,
    decision_at: r.decision_at,
    appeal_filed: r.appeal_filed,
    appeal_overturned: r.appeal_overturned,
    pas_response: r.pas_response,
  }));
}

function toEventInputs(rows: ValidationEventRow[]): ValidationEventInput[] {
  return rows.map((r) => ({
    event_type: r.event_type,
    minutes_saved: r.minutes_saved,
    amount_usd: r.amount_usd,
    metadata:
      r.metadata && typeof r.metadata === "object" ?
        (r.metadata as Record<string, unknown>)
      : null,
  }));
}

/**
 * GET — aggregated ROI metrics, payer timing, and time series for charting.
 * Uses `mv_ins_roi_summary` for monthly rollups; raw `ins_validation_events` for detail.
 */
async function getValidationMetrics(request: Request): Promise<NextResponse<ValidationMetricsApiResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const raw = {
    timeRange: searchParams.get("timeRange") ?? "30d",
    payerId: searchParams.get("payerId") ?? undefined,
    providerId: searchParams.get("providerId") ?? undefined,
    specialty: searchParams.get("specialty") ?? undefined,
    cptModality: searchParams.get("cptModality") ?? undefined,
  };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: msg || "Invalid query parameters" }, { status: 400 });
  }

  const { timeRange, payerId, providerId, specialty, cptModality } = parsed.data;
  if (providerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(providerId)) {
    return NextResponse.json({ error: "providerId must be a UUID when provided." }, { status: 400 });
  }

  const days = daysForRange(timeRange);
  const range = rangeBounds(days);
  const { startIso, endIso } = range;

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
    if (isDemoMode()) {
      const filters = {
        ...(payerId ? { payerId } : {}),
        ...(providerId ? { providerId } : {}),
        ...(specialty ? { specialty } : {}),
        ...(cptModality ? { cptModality } : {}),
      };
      return NextResponse.json(
        buildOfflineDemoMetricsResponse(
          { startIso: range.startIso, endIso: range.endIso, days: range.days },
          filters,
        ),
        { headers: { "Cache-Control": CACHE_CONTROL } },
      );
    }
    return NextResponse.json(
      { error: adminErr?.message ?? "Database unavailable." },
      { status: 503 },
    );
  }

  let specialtyProviderIds: string[] | null = null;
  if (specialty) {
    const pr = await supabase.from("ins_providers").select("id").eq("specialty", specialty);
    if (pr.error) {
      return NextResponse.json({ error: pr.error.message }, { status: 500 });
    }
    specialtyProviderIds = (pr.data ?? []).map((r: { id: string }) => r.id);
    if (specialtyProviderIds.length === 0) {
      const empty: ValidationMetricsApiResponse = {
        range: { startIso: range.startIso, endIso: range.endIso, days: range.days },
        filters: {
          ...(payerId ? { payerId } : {}),
          ...(providerId ? { providerId } : {}),
          ...(specialty ? { specialty } : {}),
          ...(cptModality ? { cptModality } : {}),
        },
        administrativeBurdenReduction: {
          totalMinutesSaved: 0,
          fteEquivalent: 0,
          benchmarkComparisonPercent: 0,
        },
        costAvoidance: {
          paDenialsPrevented: 0,
          appealCostsAvoided: 0,
          oopSavingsRealized: 0,
          inappropriateImagingAvoided: 0,
        },
        costAvoidanceStackUsd: {
          appealCostsAvoided: 0,
          inappropriateImagingAvoidedUsd: 0,
          adminLaborAvoidedUsd: 0,
        },
        payerROI: {
          autoApprovalRate: 0,
          avgTimeToDecisionHours: null,
          cms0057fComplianceRate: 0,
          denialSpecificityScore: 100,
        },
        clinicalQuality: {
          appealOverturnRate: null,
          providerSatisfactionProxy: {},
          patientFinancialToxicityProxy: null,
        },
        payerBreakdown: [],
        oopTransparency: computeOopTransparency([]),
        kpis: {
          totalPaAutoApproved: 0,
          totalMinutesSaved: 0,
          oopSavingsRealizedUsd: 0,
          cms0057fComplianceRate: 0,
        },
        timeSeries: {
          daily: buildDailyTimeSeries([], range),
          monthlyRoi: [],
          weeklyMinutesLast12: buildWeeklyMinutesLastNWeeks([], range.endIso, 12),
          mnaiGreenRate: buildMnaiGreenRateTimeSeries([], range),
        },
      };
      return NextResponse.json(empty, {
        headers: { "Cache-Control": CACHE_CONTROL },
      });
    }
  }

  let eventsQuery = supabase
    .from("ins_validation_events")
    .select(
      "event_type, minutes_saved, amount_usd, occurred_at, metadata, provider_id, payer_id",
    )
    .gte("occurred_at", startIso)
    .lt("occurred_at", endIso);

  if (providerId) {
    eventsQuery = eventsQuery.eq("provider_id", providerId);
  }
  if (payerId) {
    eventsQuery = eventsQuery.eq("payer_id", payerId);
  }
  if (specialtyProviderIds) {
    eventsQuery = eventsQuery.in("provider_id", specialtyProviderIds);
  }

  let paQuery = supabase
    .from("ins_pa_history")
    .select(
      "submitted_at, decision_at, appeal_filed, appeal_overturned, pas_response, payer_id, provider_id, cpt_code",
    )
    .gte("submitted_at", startIso)
    .lt("submitted_at", endIso);

  if (providerId) {
    paQuery = paQuery.eq("provider_id", providerId);
  }
  if (payerId) {
    paQuery = paQuery.eq("payer_id", payerId);
  }
  if (specialtyProviderIds) {
    paQuery = paQuery.in("provider_id", specialtyProviderIds);
  }

  const scoped = Boolean(payerId || providerId || specialty || cptModality);

  const mvStart = new Date(startIso);
  mvStart.setUTCDate(1);
  mvStart.setUTCHours(0, 0, 0, 0);

  const mvQuery = supabase
    .from("mv_ins_roi_summary")
    .select("month_start, total_savings_usd, total_minutes_saved, pas_avoided_count")
    .gte("month_start", mvStart.toISOString())
    .lte("month_start", endIso);

  const auditQuery = supabase
    .from("ins_aiie_audit")
    .select("created_at, mnai_tier, cpt")
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  const [evRes, paRes, mvRes, auditRes] = await Promise.all([
    eventsQuery,
    paQuery,
    scoped ? Promise.resolve({ data: [] as RoiSummaryRow[], error: null as null }) : mvQuery,
    auditQuery,
  ]);

  if (evRes.error) {
    return NextResponse.json({ error: evRes.error.message }, { status: 500 });
  }
  if (paRes.error) {
    return NextResponse.json({ error: paRes.error.message }, { status: 500 });
  }
  if (mvRes.error) {
    return NextResponse.json({ error: mvRes.error.message }, { status: 500 });
  }
  if (auditRes.error) {
    return NextResponse.json({ error: auditRes.error.message }, { status: 500 });
  }

  let eventRows = (evRes.data ?? []) as ValidationEventRow[];
  let paRows = (paRes.data ?? []) as PaHistoryRow[];
  let auditRows = (auditRes.data ?? []) as AiieAuditRow[];
  const mvRows = (mvRes.data ?? []) as RoiSummaryRow[];

  const modalityActive = Boolean(cptModality);
  if (modalityActive && cptModality) {
    paRows = paRows.filter((r) => cptMatchesImagingModality(r.cpt_code, cptModality));
    auditRows = auditRows.filter(
      (r) => r.cpt && cptMatchesImagingModality(r.cpt, cptModality),
    );
    const allow = new Set(paRows.map((p) => p.provider_id));
    if (allow.size === 0) {
      eventRows = [];
    } else {
      eventRows = eventRows.filter((e) => Boolean(e.provider_id && allow.has(e.provider_id)));
    }
  }

  const eventInputs = toEventInputs(eventRows);
  const totalMinutesSaved = sumMinutesSaved(eventInputs);

  const paAvoidedGold = eventRows.filter((e) => e.event_type === "pa_avoided_by_gold_card").length;
  const paAvoidedCrd = eventRows.filter((e) => e.event_type === "pa_avoided_by_crd").length;
  const totalPaVolume = paRows.length;

  const costAvoidance = computeCostAvoidance(eventInputs);
  const costAvoidanceStackUsd = computeCostAvoidanceStackUsd(costAvoidance, totalMinutesSaved);
  const payerROI = computePayerROI(paAvoidedGold, paAvoidedCrd, totalPaVolume, toPaInputs(paRows));
  const payerBreakdown = computePayerBreakdown(paRows, eventRows, days);
  const oopTransparency = computeOopTransparency(eventInputs);

  const weeklyMinutesLast12 = buildWeeklyMinutesLastNWeeks(eventRows, endIso, 12);

  const body: ValidationMetricsApiResponse = {
    range: {
      startIso: range.startIso,
      endIso: range.endIso,
      days: range.days,
    },
    filters: {
      ...(payerId ? { payerId } : {}),
      ...(providerId ? { providerId } : {}),
      ...(specialty ? { specialty } : {}),
      ...(cptModality ? { cptModality } : {}),
    },
    administrativeBurdenReduction: computeBurdenReduction(totalMinutesSaved, days),
    costAvoidance,
    costAvoidanceStackUsd,
    payerROI,
    clinicalQuality: computeClinicalQuality(eventInputs, toPaInputs(paRows)),
    payerBreakdown,
    oopTransparency,
    kpis: {
      totalPaAutoApproved: paAvoidedGold + paAvoidedCrd,
      totalMinutesSaved,
      oopSavingsRealizedUsd: costAvoidance.oopSavingsRealized,
      cms0057fComplianceRate: payerROI.cms0057fComplianceRate,
    },
    timeSeries: {
      daily: buildDailyTimeSeries(eventRows, range),
      monthlyRoi: scoped ? aggregateMonthlyRoiFromEvents(eventRows) : mapRoiSummaryRows(mvRows),
      weeklyMinutesLast12,
      mnaiGreenRate: buildMnaiGreenRateTimeSeries(auditRows, range),
    },
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}

export const GET = withInsApiLogging(getValidationMetrics);
