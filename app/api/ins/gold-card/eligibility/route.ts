/**
 * Gold Card eligibility API — forward-looking utilization intelligence that typical
 * radiology benefit managers (RBMs) do not expose as a first-class product surface.
 *
 * Strategic value: gold carding shifts the UM conversation from episodic denials to
 * *trajectory* and *trust* — it lets high-performing ordering communities earn predictable
 * throughput (fewer administrative stalls, measurable time and dollars returned to care
 * delivery) while keeping ARKA-INS aligned with CMS-0057-F transparency and auditability.
 * This endpoint powers both real-time eligibility checks and portfolio views for
 * provider-facing dashboards without recomputing scores on every request.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  computeGoldCardScore,
  fetchGoldCardPortfolio,
} from "@/lib/aiie/gold-card";
import { buildOfflineDemoGoldPortfolio } from "@/lib/demo/offline-gold-portfolio";
import { isDemoMode } from "@/lib/demo/demo-mode";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import type { GoldCardStatus } from "@/lib/types/aiie";

const postBodySchema = z.object({
  providerId: z.string().uuid(),
  cptCode: z.string().min(1, "cptCode is required"),
  payerId: z.string().min(1, "payerId is required"),
});

const providerQuerySchema = z.object({
  providerId: z.string().uuid(),
});

/**
 * POST — real-time gold card eligibility for one provider × CPT × payer (cache-hot; under 200ms p95 target).
 */
async function postGoldCardEligibility(request: Request): Promise<NextResponse<{ goldCardStatus: GoldCardStatus } | { error: string; code?: string }>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors.join("; ") }, { status: 400 });
  }

  const { providerId, cptCode, payerId } = parsed.data;

  const result = await computeGoldCardScore(providerId, cptCode, payerId);
  if (result.error) {
    if (isDemoMode() && result.error.code !== "INVALID_PROVIDER_ID" && result.error.code !== "INVALID_CPT" && result.error.code !== "INVALID_PAYER") {
      const demo: GoldCardStatus = {
        eligible: false,
        score: 74,
        approvalRate: 0.83,
        sampleSize: 28,
        reason: "below_threshold",
        nextMilestone:
          "You need approximately 3 more approvals at your current trajectory to reach a 90% approval rate.",
      };
      return NextResponse.json({ goldCardStatus: demo });
    }
    return NextResponse.json(
      { error: result.error.message, code: result.error.code },
      { status: result.error.code === "INVALID_PROVIDER_ID" || result.error.code === "INVALID_CPT" || result.error.code === "INVALID_PAYER" ? 400 : 503 },
    );
  }

  if (!result.data) {
    return NextResponse.json({ error: "Gold card status unavailable." }, { status: 503 });
  }

  if (!isDemoMode()) {
    const { data: supabase } = createAdminClient();
    if (supabase) {
      await supabase.from("ins_validation_events").insert({
        event_type: "gold_card_check",
        provider_id: providerId,
        payer_id: payerId,
      });
    }
  }

  return NextResponse.json({ goldCardStatus: result.data });
}

export const POST = withInsApiLogging(postGoldCardEligibility);

/**
 * GET — full cached portfolio for a provider (all CPT × payer rows in `ins_gold_card_scores`,
 * plus history pairs not yet scored). Intended for the provider Gold Card dashboard.
 */
async function getGoldCardPortfolio(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = providerQuerySchema.safeParse({
    providerId: url.searchParams.get("providerId") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Query parameter providerId must be a UUID." }, { status: 400 });
  }

  const portfolioResult = await fetchGoldCardPortfolio(parsed.data.providerId);
  if (portfolioResult.error) {
    if (isDemoMode() && portfolioResult.error.code !== "INVALID_PROVIDER_ID") {
      return NextResponse.json(buildOfflineDemoGoldPortfolio(parsed.data.providerId));
    }
    return NextResponse.json(
      { error: portfolioResult.error.message, code: portfolioResult.error.code },
      { status: portfolioResult.error.code === "INVALID_PROVIDER_ID" ? 400 : 503 },
    );
  }

  if (!portfolioResult.data) {
    return NextResponse.json({ error: "Portfolio unavailable." }, { status: 503 });
  }

  return NextResponse.json(portfolioResult.data);
}

export const GET = withInsApiLogging(getGoldCardPortfolio);
