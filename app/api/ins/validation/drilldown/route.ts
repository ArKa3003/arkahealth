/**
 * Traceability drill-down for ROI KPIs: underlying `ins_validation_events` or `ins_pa_history` rows.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { cptMatchesImagingModality } from "@/lib/validation/metrics";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const kpiSchema = z.enum([
  "pa_auto",
  "minutes",
  "oop",
  "cms_sla",
  "cost_appeal",
  "cost_imaging",
  "cost_labor",
  "denial_specificity",
  "oop_reroute",
]);

const querySchema = z.object({
  kpi: kpiSchema,
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

function rangeBounds(days: number): { startIso: string; endIso: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/**
 * GET — rows backing a KPI for audit / traceability drawers.
 */
async function getValidationDrilldown(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const raw = {
    kpi: searchParams.get("kpi") ?? "",
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

  const { kpi, timeRange, payerId, providerId, specialty, cptModality } = parsed.data;
  if (providerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(providerId)) {
    return NextResponse.json({ error: "providerId must be a UUID when provided." }, { status: 400 });
  }

  const days = daysForRange(timeRange);
  const { startIso, endIso } = rangeBounds(days);

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
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
      return NextResponse.json({
        kpi,
        source: "ins_validation_events" as const,
        rows: [],
        note: "No providers match the selected specialty.",
      });
    }
  }

  if (kpi === "cms_sla") {
    let paQuery = supabase
      .from("ins_pa_history")
      .select(
        "id, payer_id, provider_id, submitted_at, decision_at, cpt_code, appeal_filed, appeal_overturned, pas_response",
      )
      .gte("submitted_at", startIso)
      .lt("submitted_at", endIso)
      .not("decision_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(500);

    if (providerId) {
      paQuery = paQuery.eq("provider_id", providerId);
    }
    if (payerId) {
      paQuery = paQuery.eq("payer_id", payerId);
    }
    if (specialtyProviderIds) {
      paQuery = paQuery.in("provider_id", specialtyProviderIds);
    }

    const paRes = await paQuery;
    if (paRes.error) {
      return NextResponse.json({ error: paRes.error.message }, { status: 500 });
    }
    let rows = (paRes.data ?? []) as Array<{
      id: string;
      payer_id: string;
      provider_id: string;
      submitted_at: string;
      decision_at: string | null;
      cpt_code: string;
      appeal_filed: boolean;
      appeal_overturned: boolean;
      pas_response: Record<string, unknown> | null;
    }>;

    if (cptModality) {
      rows = rows.filter((r) => cptMatchesImagingModality(r.cpt_code, cptModality));
    }

    return NextResponse.json({
      kpi,
      source: "ins_pa_history" as const,
      rows,
    });
  }

  let eventsQuery = supabase
    .from("ins_validation_events")
    .select("id, event_type, minutes_saved, amount_usd, occurred_at, metadata, provider_id, payer_id")
    .gte("occurred_at", startIso)
    .lt("occurred_at", endIso)
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (providerId) {
    eventsQuery = eventsQuery.eq("provider_id", providerId);
  }
  if (payerId) {
    eventsQuery = eventsQuery.eq("payer_id", payerId);
  }
  if (specialtyProviderIds) {
    eventsQuery = eventsQuery.in("provider_id", specialtyProviderIds);
  }

  switch (kpi) {
    case "pa_auto":
      eventsQuery = eventsQuery.in("event_type", ["pa_avoided_by_gold_card", "pa_avoided_by_crd"]);
      break;
    case "minutes":
      eventsQuery = eventsQuery.gt("minutes_saved", 0);
      break;
    case "oop":
      eventsQuery = eventsQuery.eq("event_type", "oop_savings_realized");
      break;
    case "cost_appeal":
      eventsQuery = eventsQuery.eq("event_type", "dtr_denial_risk_reduced");
      break;
    case "cost_imaging":
      eventsQuery = eventsQuery.eq("event_type", "alternative_imaging_avoided");
      break;
    case "cost_labor":
      eventsQuery = eventsQuery.gt("minutes_saved", 0);
      break;
    case "denial_specificity":
      eventsQuery = eventsQuery.in("event_type", ["dtr_denial_risk_reduced", "pa_submitted"]);
      break;
    case "oop_reroute":
      eventsQuery = eventsQuery.eq("event_type", "oop_savings_realized");
      break;
    default:
      break;
  }

  const evRes = await eventsQuery;
  if (evRes.error) {
    return NextResponse.json({ error: evRes.error.message }, { status: 500 });
  }

  let rows = (evRes.data ?? []) as Array<{
    id: string;
    event_type: string;
    minutes_saved: number | null;
    amount_usd: number | null;
    occurred_at: string;
    metadata: unknown;
    provider_id: string | null;
    payer_id: string | null;
  }>;

  if (cptModality) {
    let paQ = supabase
      .from("ins_pa_history")
      .select("provider_id, cpt_code")
      .gte("submitted_at", startIso)
      .lt("submitted_at", endIso);
    if (providerId) {
      paQ = paQ.eq("provider_id", providerId);
    }
    if (payerId) {
      paQ = paQ.eq("payer_id", payerId);
    }
    if (specialtyProviderIds) {
      paQ = paQ.in("provider_id", specialtyProviderIds);
    }
    const paRes = await paQ;
    if (paRes.error) {
      return NextResponse.json({ error: paRes.error.message }, { status: 500 });
    }
    const paRows = ((paRes.data ?? []) as Array<{ provider_id: string; cpt_code: string }>).filter((r) =>
      cptMatchesImagingModality(r.cpt_code, cptModality),
    );
    const allow = new Set(paRows.map((p) => p.provider_id));
    if (allow.size === 0) {
      rows = [];
    } else {
      rows = rows.filter((e) => e.provider_id && allow.has(e.provider_id));
    }
  }

  if (kpi === "oop_reroute") {
    rows = rows.filter((r) => {
      const m = r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : null;
      return m?.cheaperSiteReroute === true;
    });
  }

  return NextResponse.json({
    kpi,
    source: "ins_validation_events" as const,
    rows,
  });
}

export const GET = withInsApiLogging(getValidationDrilldown);
