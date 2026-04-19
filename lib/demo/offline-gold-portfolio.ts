/**
 * Cached gold-card portfolio used when `DEMO_MODE=true` and Supabase reads fail.
 */

import type { GoldCardPortfolioRow } from "@/lib/aiie/gold-card";

/**
 * @param providerId - Echoed provider id for consistent dashboard copy.
 */
export function buildOfflineDemoGoldPortfolio(providerId: string): {
  portfolio: GoldCardPortfolioRow[];
  unevaluatedPairs: Array<{ cptCode: string; payerId: string }>;
} {
  const now = new Date().toISOString();
  const validUntil = new Date(Date.now() + 30 * 86400000).toISOString();

  const portfolio: GoldCardPortfolioRow[] = [
    {
      cptCode: "72148",
      payerId: "uhc",
      status: {
        eligible: true,
        score: 93,
        approvalRate: 0.94,
        sampleSize: 42,
        reason: undefined,
        nextMilestone: undefined,
      },
      computedAt: now,
      validUntil,
      cacheFresh: true,
    },
    {
      cptCode: "74177",
      payerId: "bcbs-tx",
      status: {
        eligible: false,
        score: 78,
        approvalRate: 0.82,
        sampleSize: 36,
        reason: "below_threshold",
        nextMilestone:
          "You need approximately 4 more approvals at your current trajectory to reach a 90% approval rate.",
      },
      computedAt: now,
      validUntil,
      cacheFresh: true,
    },
    {
      cptCode: "70553",
      payerId: "aetna",
      status: {
        eligible: false,
        score: 0,
        approvalRate: 0,
        sampleSize: 6,
        reason: "insufficient_history",
        nextMilestone:
          "You need 4 more completed prior authorizations before gold card metrics can be evaluated.",
      },
      computedAt: now,
      validUntil,
      cacheFresh: true,
    },
  ];

  return {
    portfolio,
    unevaluatedPairs: [{ cptCode: "73721", payerId: "cigna" }],
  };
}
