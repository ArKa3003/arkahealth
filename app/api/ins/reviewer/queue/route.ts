/**
 * ARKA-INS RBM reviewer queue — mock-sorted cases with optional social proof from `ins_pa_history`.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildMockReviewerQueue,
  REVIEWER_DEMO_PROVIDER_ID,
  sortReviewerQueue,
} from "@/lib/ins/reviewer-queue";
import type { ReviewerQueueApiResponse, ReviewerQueueCase } from "@/lib/ins/reviewer-types";
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

type PaDecisionRow = {
  cpt_code: string;
  payer_id: string;
  decision: string;
};

/**
 * Aggregates approved/denied counts for CPT+payer from rolling 7-day PA history.
 */
function aggregateSocialProof(rows: PaDecisionRow[]): Map<string, { approved: number; denied: number }> {
  const map = new Map<string, { approved: number; denied: number }>();
  for (const row of rows) {
    const k = `${row.cpt_code}|${row.payer_id}`;
    const cur = map.get(k) ?? { approved: 0, denied: 0 };
    if (row.decision === "approved" || row.decision === "auto_approved") {
      cur.approved += 1;
    } else if (row.decision === "denied") {
      cur.denied += 1;
    }
    map.set(k, cur);
  }
  return map;
}

/**
 * Overwrites embedded mock social proof when real aggregates exist for that CPT+payer pair.
 */
function mergeSocialProof(
  cases: ReviewerQueueCase[],
  fromDb: Map<string, { approved: number; denied: number }>,
): ReviewerQueueCase[] {
  return cases.map((c) => {
    const k = `${c.cptCode}|${c.payerId}`;
    const m = fromDb.get(k);
    if (m !== undefined && (m.approved > 0 || m.denied > 0)) {
      return { ...c, socialProof: { approved: m.approved, denied: m.denied } };
    }
    return c;
  });
}

/**
 * GET — sorted reviewer queue and demo provider id.
 */
async function getReviewerQueue(request: Request): Promise<NextResponse<ReviewerQueueApiResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ providerId: searchParams.get("providerId") ?? undefined });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: msg || "Invalid query parameters" }, { status: 400 });
  }

  const providerId = parsed.data.providerId ?? REVIEWER_DEMO_PROVIDER_ID;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(providerId)) {
    return NextResponse.json({ error: "providerId must be a valid UUID when provided." }, { status: 400 });
  }

  let cases = buildMockReviewerQueue(providerId);

  const { data: supabase, error: adminErr } = createAdminClient();
  if (!adminErr && supabase) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: paRows, error: paErr } = await supabase
      .from("ins_pa_history")
      .select("cpt_code, payer_id, decision")
      .gte("submitted_at", weekAgo);

    if (!paErr && paRows && paRows.length > 0) {
      const map = aggregateSocialProof(paRows as PaDecisionRow[]);
      cases = mergeSocialProof(cases, map);
      cases = sortReviewerQueue(cases);
    }
  }

  const body: ReviewerQueueApiResponse = {
    cases,
    demoProviderId: REVIEWER_DEMO_PROVIDER_ID,
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}

export const GET = withInsApiLogging(getReviewerQueue);
