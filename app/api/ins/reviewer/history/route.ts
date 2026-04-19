/**
 * ARKA-INS reviewer — this provider’s `ins_pa_history` rows for a CPT + payer (no PHI).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import type { ReviewerHistoryApiResponse, ReviewerHistoryRow } from "@/lib/ins/reviewer-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const CACHE_CONTROL = "private, no-store";

const querySchema = z.object({
  providerId: z.string().uuid(),
  cptCode: z.string().min(1).max(16),
  payerId: z.string().min(1).max(64),
});

/**
 * GET — recent PA outcomes for analytics tab.
 */
async function getReviewerHistory(request: Request): Promise<NextResponse<ReviewerHistoryApiResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const raw = {
    providerId: searchParams.get("providerId") ?? "",
    cptCode: searchParams.get("cptCode") ?? "",
    payerId: searchParams.get("payerId") ?? "",
  };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: msg || "Invalid query parameters" }, { status: 400 });
  }

  const { providerId, cptCode, payerId } = parsed.data;

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
    return NextResponse.json(
      { error: adminErr?.message ?? "Database unavailable." },
      { status: 503 },
    );
  }

  const { data: rows, error } = await supabase
    .from("ins_pa_history")
    .select("submitted_at, decision")
    .eq("provider_id", providerId)
    .eq("cpt_code", cptCode)
    .eq("payer_id", payerId)
    .order("submitted_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const out: ReviewerHistoryRow[] = (rows ?? []).map((r) => ({
    submittedAt: r.submitted_at as string,
    decision: r.decision as string,
  }));

  const body: ReviewerHistoryApiResponse = { rows: out };

  return NextResponse.json(body, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}

export const GET = withInsApiLogging(getReviewerHistory);
