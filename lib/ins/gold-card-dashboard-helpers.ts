import type { GoldCardPortfolioRow } from "@/lib/aiie/gold-card";

/** Radiology specialty peer benchmark: approximate share of cases by AIIE clinical score (1–9). */
const PEER_BENCHMARK_SHARE: number[] = [1, 2, 4, 7, 12, 22, 28, 18, 6];

/**
 * Parses "N more approvals" / "N more completed prior authorization" style milestone strings.
 *
 * @param text - Human-readable next-step copy from gold card status.
 * @returns Parsed count when found, otherwise null.
 */
export function parseApprovalsNeeded(text: string | undefined): number | null {
  if (!text?.trim()) {
    return null;
  }
  const m = text.match(
    /(\d+)\s+more\s+(?:completed\s+prior\s+authorizations?|approvals?)/i,
  );
  if (m) {
    return Number.parseInt(m[1], 10);
  }
  return null;
}

/**
 * Ranks near-eligible CPT × payer rows for the Next Milestone widget.
 *
 * @param rows - Portfolio rows that are not yet gold-carded.
 */
export function rankNearMilestones(rows: GoldCardPortfolioRow[]): GoldCardPortfolioRow[] {
  const ineligible = rows.filter((r) => !r.status.eligible && r.status.nextMilestone);
  return [...ineligible].sort((a, b) => {
    const na = parseApprovalsNeeded(a.status.nextMilestone) ?? 999;
    const nb = parseApprovalsNeeded(b.status.nextMilestone) ?? 999;
    if (na !== nb) {
      return na - nb;
    }
    return `${a.cptCode}:${a.payerId}`.localeCompare(`${b.cptCode}:${b.payerId}`);
  });
}

export interface AiieHistogramPoint {
  scoreLabel: string;
  providerPct: number;
  peerPct: number;
}

/**
 * Builds a demo AIIE clinical score distribution (1–9) vs a static specialty peer curve,
 * using portfolio Wilson scores as a shape prior when history is sparse.
 *
 * @param portfolio - Cached gold card rows for the provider.
 */
export function buildAiieScoreHistogram(portfolio: GoldCardPortfolioRow[]): AiieHistogramPoint[] {
  const meanWilson =
    portfolio.length > 0 ?
      portfolio.reduce((s, r) => s + r.status.score, 0) / portfolio.length
    : 55;
  const center = 4.5 + (meanWilson / 100) * 3.5;
  const buckets = Array.from({ length: 9 }, () => 0);
  for (let i = 0; i < 120; i++) {
    const noise = Math.sin(i * 2.17 + meanWilson) * 1.15;
    const bin = Math.round(Math.max(1, Math.min(9, center + noise))) - 1;
    buckets[bin] += 1;
  }
  const sum = buckets.reduce((a, b) => a + b, 0) || 1;
  const peerSum = PEER_BENCHMARK_SHARE.reduce((a, b) => a + b, 0) || 1;

  return buckets.map((count, i) => ({
    scoreLabel: String(i + 1),
    providerPct: Math.round((count / sum) * 1000) / 10,
    peerPct: Math.round((PEER_BENCHMARK_SHARE[i] / peerSum) * 1000) / 10,
  }));
}
