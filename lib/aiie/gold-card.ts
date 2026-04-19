import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIELibError, GoldCardStatus } from "@/lib/types/aiie";

type PADecision = "approved" | "denied" | "pended" | "auto_approved";

interface PAHistoryRow {
  decision: PADecision;
}

interface GoldCardCacheRow {
  approval_rate: number | null;
  sample_size: number;
  score: number;
  eligible: boolean;
  valid_until: string | null;
  computed_at: string;
}

/** Rows older than this are recomputed from PA history (API latency budget). */
export const GOLD_CARD_CACHE_FRESHNESS_DAYS = 7;

const CACHE_VALIDITY_DAYS = 30;
const WINDOW_MONTHS = 24;
const MIN_SAMPLE = 10;
const ELIGIBILITY_MIN_SAMPLE = 20;
const ELIGIBILITY_MIN_RATE = 0.9;
const Z = 1.96;

// Wilson score lower bound for a binomial proportion (conservative approval-rate estimate).
function wilsonLowerBound(successes: number, trials: number): number {
  if (trials <= 0) {
    return 0;
  }
  const p = successes / trials;
  const z2 = Z * Z;
  const denom = 1 + z2 / trials;
  const center = p + z2 / (2 * trials);
  const margin =
    Z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);
  return Math.max(0, Math.min(1, (center - margin) / denom));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

function isCacheFresh(computedAtIso: string, maxAgeDays: number): boolean {
  const computed = new Date(computedAtIso).getTime();
  if (Number.isNaN(computed)) {
    return false;
  }
  const ageMs = Date.now() - computed;
  return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
}

function buildStatusFromCacheRow(row: GoldCardCacheRow): GoldCardStatus {
  const sampleSize = row.sample_size;
  const approvalRate = Number(row.approval_rate ?? 0);
  const approvalCount = Math.round(approvalRate * sampleSize);
  const score = Number(row.score);
  const eligible = row.eligible;
  const reason: GoldCardStatus["reason"] =
    eligible ? undefined : sampleSize < MIN_SAMPLE ? "insufficient_history" : "below_threshold";
  const nextMilestone =
    eligible ? undefined : buildNextMilestone(sampleSize, approvalCount, approvalRate);
  return {
    eligible,
    score,
    approvalRate,
    sampleSize,
    reason,
    nextMilestone,
  };
}

function buildNextMilestone(
  sampleSize: number,
  approvalCount: number,
  approvalRate: number,
): string | undefined {
  if (sampleSize < MIN_SAMPLE) {
    return undefined;
  }
  if (sampleSize < ELIGIBILITY_MIN_SAMPLE) {
    const need = ELIGIBILITY_MIN_SAMPLE - sampleSize;
    return `You need ${need} more completed prior authorization${
      need === 1 ? "" : "s"
    } to reach the minimum sample size (20) for gold card eligibility.`;
  }
  if (approvalRate < ELIGIBILITY_MIN_RATE) {
    const needApprovals = Math.ceil(
      (ELIGIBILITY_MIN_RATE * sampleSize - approvalCount) / (1 - ELIGIBILITY_MIN_RATE),
    );
    if (needApprovals > 0 && Number.isFinite(needApprovals)) {
      return `You need approximately ${needApprovals} more approval${
        needApprovals === 1 ? "" : "s"
      } at your current trajectory to reach a 90% approval rate.`;
    }
    return "Continue improving approval outcomes to reach the 90% approval-rate threshold.";
  }
  return undefined;
}

/**
 * Computes gold-card eligibility using two-year PA history, Wilson scoring, and a 30-day cache.
 *
 * @param providerId - Ordering provider UUID (`ins_providers.id`).
 * @param cptCode - Procedure code under evaluation.
 * @param payerId - Payer identifier tied to historical decisions.
 * @returns Eligibility payload or a structured error when inputs or Supabase reads fail.
 */
export async function computeGoldCardScore(
  providerId: string,
  cptCode: string,
  payerId: string,
): Promise<{ data: GoldCardStatus | null; error: AIIELibError | null }> {
  if (!isUuid(providerId)) {
    return {
      data: null,
      error: { code: "INVALID_PROVIDER_ID", message: "providerId must be a UUID." },
    };
  }
  if (!cptCode.trim()) {
    return {
      data: null,
      error: { code: "INVALID_CPT", message: "cptCode is required." },
    };
  }
  if (!payerId.trim()) {
    return {
      data: null,
      error: { code: "INVALID_PAYER", message: "payerId is required." },
    };
  }

  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return { data: null, error: adminError };
  }

  const nowIso = new Date().toISOString();
  const { data: cached, error: cacheReadError } = await supabase
    .from("ins_gold_card_scores")
    .select("approval_rate, sample_size, score, eligible, valid_until, computed_at")
    .eq("provider_id", providerId)
    .eq("cpt_code", cptCode)
    .eq("payer_id", payerId)
    .maybeSingle<GoldCardCacheRow>();

  if (cacheReadError) {
    return {
      data: null,
      error: {
        code: "GOLD_CARD_CACHE_READ_FAILED",
        message: cacheReadError.message,
      },
    };
  }

  if (cached && isCacheFresh(cached.computed_at, GOLD_CARD_CACHE_FRESHNESS_DAYS)) {
    return {
      data: buildStatusFromCacheRow(cached),
      error: null,
    };
  }

  const windowStart = monthsAgo(WINDOW_MONTHS).toISOString();
  const { data: rows, error: historyError } = await supabase
    .from("ins_pa_history")
    .select("decision")
    .eq("provider_id", providerId)
    .eq("cpt_code", cptCode)
    .eq("payer_id", payerId)
    .gte("submitted_at", windowStart);

  if (historyError) {
    return {
      data: null,
      error: {
        code: "GOLD_CARD_HISTORY_READ_FAILED",
        message: historyError.message,
      },
    };
  }

  const list = (rows ?? []) as PAHistoryRow[];
  const sampleSize = list.length;
  if (sampleSize < MIN_SAMPLE) {
    const status: GoldCardStatus = {
      eligible: false,
      score: 0,
      approvalRate: 0,
      sampleSize,
      reason: "insufficient_history",
      nextMilestone:
        sampleSize === 0 ?
          "No prior authorization history was found in the last 24 months."
        : `You need ${MIN_SAMPLE - sampleSize} more completed prior authorization${
            MIN_SAMPLE - sampleSize === 1 ? "" : "s"
          } before gold card metrics can be evaluated.`,
    };
    return { data: status, error: null };
  }

  const approvalCount = list.filter(
    (r) => r.decision === "approved" || r.decision === "auto_approved",
  ).length;
  const approvalRate = approvalCount / sampleSize;
  const wilson = wilsonLowerBound(approvalCount, sampleSize);
  const scorePercent = Math.round(wilson * 100);

  const eligible =
    sampleSize >= ELIGIBILITY_MIN_SAMPLE && approvalRate >= ELIGIBILITY_MIN_RATE;
  const reason: GoldCardStatus["reason"] =
    eligible ? undefined : "below_threshold";

  const status: GoldCardStatus = {
    eligible,
    score: scorePercent,
    approvalRate,
    sampleSize,
    reason,
    nextMilestone: eligible ? undefined : buildNextMilestone(
      sampleSize,
      approvalCount,
      approvalRate,
    ),
  };

  const validUntil = addDays(new Date(), CACHE_VALIDITY_DAYS).toISOString();
  const { error: upsertError } = await supabase.from("ins_gold_card_scores").upsert(
    {
      provider_id: providerId,
      cpt_code: cptCode,
      payer_id: payerId,
      approval_rate: approvalRate,
      sample_size: sampleSize,
      score: scorePercent,
      eligible,
      computed_at: nowIso,
      valid_until: validUntil,
    },
    { onConflict: "provider_id,cpt_code,payer_id" },
  );

  if (upsertError) {
    return {
      data: status,
      error: {
        code: "GOLD_CARD_CACHE_WRITE_FAILED",
        message: upsertError.message,
      },
    };
  }

  return { data: status, error: null };
}

/**
 * One cached CPT × payer row for the provider Gold Card dashboard (GET portfolio).
 */
export interface GoldCardPortfolioRow {
  /** Procedure code. */
  cptCode: string;
  /** Payer identifier. */
  payerId: string;
  /** Eligibility and milestone copy. */
  status: GoldCardStatus;
  /** When the score row was last computed (ISO-8601). */
  computedAt: string;
  /** Cache validity upper bound from last upsert, if set. */
  validUntil: string | null;
  /** Whether the row is within {@link GOLD_CARD_CACHE_FRESHNESS_DAYS} for hot-path reads. */
  cacheFresh: boolean;
}

/**
 * Returns cached gold-card rows plus CPT × payer pairs seen in PA history that lack a cache row.
 *
 * @param providerId - Ordering provider UUID (`ins_providers.id`).
 */
export async function fetchGoldCardPortfolio(providerId: string): Promise<{
  data: {
    portfolio: GoldCardPortfolioRow[];
    unevaluatedPairs: Array<{ cptCode: string; payerId: string }>;
  } | null;
  error: AIIELibError | null;
}> {
  if (!isUuid(providerId)) {
    return {
      data: null,
      error: { code: "INVALID_PROVIDER_ID", message: "providerId must be a UUID." },
    };
  }

  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return { data: null, error: adminError };
  }

  const { data: scoreRows, error: scoresErr } = await supabase
    .from("ins_gold_card_scores")
    .select(
      "cpt_code, payer_id, approval_rate, sample_size, score, eligible, valid_until, computed_at",
    )
    .eq("provider_id", providerId);

  if (scoresErr) {
    return {
      data: null,
      error: {
        code: "GOLD_CARD_PORTFOLIO_READ_FAILED",
        message: scoresErr.message,
      },
    };
  }

  const portfolio: GoldCardPortfolioRow[] = (scoreRows ?? []).map((r) => {
    const row: GoldCardCacheRow = {
      approval_rate: r.approval_rate as number | null,
      sample_size: r.sample_size as number,
      score: Number(r.score),
      eligible: r.eligible as boolean,
      valid_until: r.valid_until as string | null,
      computed_at: r.computed_at as string,
    };
    return {
      cptCode: r.cpt_code as string,
      payerId: r.payer_id as string,
      status: buildStatusFromCacheRow(row),
      computedAt: r.computed_at as string,
      validUntil: r.valid_until as string | null,
      cacheFresh: isCacheFresh(r.computed_at as string, GOLD_CARD_CACHE_FRESHNESS_DAYS),
    };
  });

  const { data: histRows, error: histErr } = await supabase
    .from("ins_pa_history")
    .select("cpt_code, payer_id")
    .eq("provider_id", providerId);

  if (histErr) {
    return {
      data: null,
      error: {
        code: "GOLD_CARD_HISTORY_DISTINCT_FAILED",
        message: histErr.message,
      },
    };
  }

  const pairKey = (cpt: string, payer: string): string => `${cpt}::${payer}`;
  const cachedKeys = new Set(portfolio.map((p) => pairKey(p.cptCode, p.payerId)));
  const seen = new Set<string>();
  const unevaluatedPairs: Array<{ cptCode: string; payerId: string }> = [];

  for (const h of histRows ?? []) {
    const cpt = String(h.cpt_code ?? "");
    const payer = String(h.payer_id ?? "");
    const k = pairKey(cpt, payer);
    if (seen.has(k)) {
      continue;
    }
    seen.add(k);
    if (!cachedKeys.has(k)) {
      unevaluatedPairs.push({ cptCode: cpt, payerId: payer });
    }
  }

  return { data: { portfolio, unevaluatedPairs }, error: null };
}

/**
 * Records ROI when adjudication skips a manual PA because the provider is gold-carded.
 *
 * @param providerId - Ordering provider UUID.
 * @param payerId - Payer identifier on the coverage.
 */
export async function logGoldCardPaAvoided(
  providerId: string,
  payerId: string,
): Promise<{ error: AIIELibError | null }> {
  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return { error: adminError };
  }

  const { error } = await supabase.from("ins_validation_events").insert({
    event_type: "pa_avoided_by_gold_card",
    provider_id: providerId,
    payer_id: payerId,
    amount_usd: 25,
    minutes_saved: 25,
  });

  if (error) {
    return {
      error: { code: "GOLD_CARD_ROI_LOG_FAILED", message: error.message },
    };
  }

  return { error: null };
}
