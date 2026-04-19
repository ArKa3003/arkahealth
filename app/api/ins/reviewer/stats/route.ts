/**
 * ARKA-INS reviewer shift stats — today’s completed cases and minutes saved from RBM dashboard events.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { RBM_REVIEWER_EVENT_SOURCE } from "@/lib/ins/reviewer-queue";
import type { ReviewerStatsApiResponse } from "@/lib/ins/reviewer-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const CACHE_CONTROL = "private, no-store";

const querySchema = z.object({
  providerId: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
});

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * GET — aggregate `provider_override` events from this dashboard since UTC midnight.
 */
async function getReviewerStats(request: Request): Promise<NextResponse<ReviewerStatsApiResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ providerId: searchParams.get("providerId") ?? undefined });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: msg || "Invalid query parameters" }, { status: 400 });
  }

  const providerId = parsed.data.providerId;

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
    return NextResponse.json(
      { error: adminErr?.message ?? "Database unavailable." },
      { status: 503 },
    );
  }

  let q = supabase
    .from("ins_validation_events")
    .select("minutes_saved, metadata, provider_id")
    .eq("event_type", "provider_override")
    .gte("occurred_at", startOfUtcDay());

  if (providerId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(providerId)) {
      return NextResponse.json({ error: "providerId must be a valid UUID when provided." }, { status: 400 });
    }
    q = q.eq("provider_id", providerId);
  }

  const { data: rows, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let casesCompletedToday = 0;
  let minutesSavedToday = 0;

  for (const row of rows ?? []) {
    const meta = row.metadata as Record<string, unknown> | null | undefined;
    if (meta?.source !== RBM_REVIEWER_EVENT_SOURCE) continue;
    casesCompletedToday += 1;
    const m = row.minutes_saved;
    if (typeof m === "number" && !Number.isNaN(m)) {
      minutesSavedToday += m;
    }
  }

  const body: ReviewerStatsApiResponse = { casesCompletedToday, minutesSavedToday };

  return NextResponse.json(body, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}

export const GET = withInsApiLogging(getReviewerStats);
