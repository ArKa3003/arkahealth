/**
 * Maps ARKA-INS CDS coverage card output into demo store shapes (denial prediction + RBM criteria).
 */

import type {
  DenialPrediction,
  RBMCriteriaMatch,
  CriteriaItem,
  RiskFactor,
  RiskLevel,
  RBMVendor,
} from "@/lib/demos/ins/types";
import type { CDSCard } from "@/lib/types/cds-hooks";

export interface ParsedCoverageDemo {
  denialPrediction: DenialPrediction;
  rbmCriteriaMatch: RBMCriteriaMatch;
}

function riskLevelFromDenialProxy(d: number): RiskLevel {
  if (d <= 2) {
    return "low";
  }
  if (d <= 4) {
    return "medium";
  }
  if (d <= 6) {
    return "high";
  }
  return "critical";
}

function predictedOutcomeFromDenial(d: number): DenialPrediction["predictedOutcome"] {
  if (d <= 3) {
    return "likely-approved";
  }
  if (d <= 6) {
    return "uncertain";
  }
  return "likely-denied";
}

function parseDenialProxy(detail: string): number | undefined {
  const m = detail.match(/Denial risk \(proxy\):\s*(\d+)\s*\/\s*9/i);
  if (!m) {
    return undefined;
  }
  return Number.parseInt(m[1] ?? "", 10);
}

function parseClinicalConfidence(detail: string): { clinical: number | undefined; confidencePct: number | undefined } {
  const m = detail.match(/Clinical appropriateness:\s*(\d+)\s*\/\s*9\s*\(confidence\s*(\d+)%\)/i);
  if (!m) {
    return { clinical: undefined, confidencePct: undefined };
  }
  return {
    clinical: Number.parseInt(m[1] ?? "", 10),
    confidencePct: Number.parseInt(m[2] ?? "", 10),
  };
}

function parseSimilarCohort(detail: string): { approvedPct?: number; sampleSize?: number } {
  const m = detail.match(/(\d+)%\s+of\s+similar\s+orders[\s\S]*?\(n=(\d+)\)/i);
  if (!m) {
    return {};
  }
  return { approvedPct: Number.parseInt(m[1] ?? "", 10), sampleSize: Number.parseInt(m[2] ?? "", 10) };
}

/** Parses `- **Name** (SHAP ±x.xx) — _citation_` lines from the SHAP section. */
function parseShapFactorLines(detail: string): Array<{ name: string; contribution: number; citation: string }> {
  const lines = detail.split(/\n/);
  const out: Array<{ name: string; contribution: number; citation: string }> = [];
  const re = /^-\s*\*\*(.+?)\*\*\s*\(SHAP\s*([+-]?\d+(?:\.\d+)?)\)\s*—\s*_(.+)_\s*$/;
  for (const line of lines) {
    const t = line.trim();
    const m = t.match(re);
    if (!m) {
      continue;
    }
    out.push({
      name: (m[1] ?? "").trim(),
      contribution: Number.parseFloat(m[2] ?? "0"),
      citation: (m[3] ?? "").trim(),
    });
  }
  return out;
}

function extractGuidelineBullets(detail: string): string[] {
  const start = detail.indexOf("<summary>Guideline citations</summary>");
  if (start < 0) {
    return [];
  }
  const sub = detail.slice(start);
  const end = sub.indexOf("</details>");
  const block = end > 0 ? sub.slice(0, end) : sub;
  const lines = block.split(/\n/).map((l) => l.trim());
  const bullets: string[] = [];
  for (const line of lines) {
    if (line.startsWith("- ") && !line.includes("**")) {
      bullets.push(line.slice(2).trim());
    }
  }
  return bullets;
}

function extractNarrativeBlock(detail: string): string {
  const start = detail.indexOf("<summary>Narrative</summary>");
  if (start < 0) {
    return "";
  }
  const sub = detail.slice(start);
  const end = sub.indexOf("</details>");
  const block = end > 0 ? sub.slice(0, end) : sub;
  return block
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function factorsToRiskFactors(
  rows: Array<{ name: string; contribution: number; citation: string }>,
): RiskFactor[] {
  return rows.map((r, i) => ({
    id: `wire-${i}-${r.name.slice(0, 12)}`,
    name: r.name,
    impact: Math.round(r.contribution * 100),
    weight: 0.2,
    description: r.citation,
    mitigationStrategy: r.contribution < 0 ? "Complete DTR documentation and address payer concerns." : "Maintain current documentation strength.",
    isAddressable: r.contribution < 0,
  }));
}

function factorsToCriteriaItems(
  rows: Array<{ name: string; contribution: number; citation: string }>,
): { matched: CriteriaItem[]; unmatched: CriteriaItem[] } {
  const matched: CriteriaItem[] = [];
  const unmatched: CriteriaItem[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    const base: CriteriaItem = {
      id: `wire-crit-${i}`,
      criteriaCode: `AIIE-${i + 1}`,
      description: r.name,
      category: "clinical-indication",
      matched: r.contribution > 0,
      evidenceProvided: `${r.citation} (SHAP ${r.contribution >= 0 ? "+" : ""}${r.contribution.toFixed(2)})`,
      evidenceRequired: "AIIE modeled factor with evidence citation",
      isRequired: false,
    };
    if (r.contribution > 0) {
      matched.push(base);
    } else {
      unmatched.push(base);
    }
  }
  return { matched, unmatched };
}

/**
 * Finds the primary ARKA-INS coverage CDS card.
 */
export function findArkaInsCoverageCard(cards: CDSCard[]): CDSCard | undefined {
  return cards.find((c) => c.uuid === "arka-ins-coverage");
}

/**
 * Converts coverage card detail text into demo denial + RBM structures.
 *
 * @param orderId - Current demo order id.
 * @param detail - Raw `detail` HTML from the coverage card (includes FDA disclaimer).
 * @param summary - Card summary line (PA posture headline).
 * @param suggestions - Optional CDS suggestions for recommendation bullets.
 */
export function mapCoverageCardToDemoModels(params: {
  orderId: string;
  detail: string;
  summary: string;
  suggestions?: CDSCard["suggestions"];
  rbmVendor: RBMVendor;
}): ParsedCoverageDemo {
  const { orderId, detail, summary, suggestions, rbmVendor } = params;
  const denialProxy = parseDenialProxy(detail) ?? 5;
  const cohortFallbackN = 200;
  const { clinical, confidencePct } = parseClinicalConfidence(detail);
  const cohort = parseSimilarCohort(detail);
  const shapRows = parseShapFactorLines(detail);
  const guidelines = extractGuidelineBullets(detail);
  const narrative = extractNarrativeBlock(detail);

  const overallPct = Math.min(100, Math.max(0, Math.round((denialProxy / 9) * 100)));
  const riskFactors = factorsToRiskFactors(shapRows);
  const { matched, unmatched } = factorsToCriteriaItems(shapRows);

  for (let i = 0; i < guidelines.length; i++) {
    const g = guidelines[i]!;
    const item: CriteriaItem = {
      id: `wire-guide-${i}`,
      criteriaCode: `CITE-${i + 1}`,
      description: g,
      category: "clinical-indication",
      matched: true,
      evidenceProvided: g,
      evidenceRequired: "Guideline citation",
      isRequired: false,
    };
    matched.push(item);
  }

  const recs: string[] = [];
  if (suggestions?.length) {
    recs.push(...suggestions.map((s) => s.label));
  }
  if (narrative.length > 40) {
    recs.push(narrative.slice(0, 280) + (narrative.length > 280 ? "…" : ""));
  }
  if (recs.length === 0) {
    recs.push(summary);
  }

  const n = matched.length + unmatched.length;
  const met = matched.length;

  const denialPrediction: DenialPrediction = {
    orderId,
    timestamp: new Date().toISOString(),
    overallRisk: overallPct,
    riskLevel: riskLevelFromDenialProxy(denialProxy),
    confidenceScore: confidencePct ?? 75,
    factors: riskFactors.length > 0 ? riskFactors : [
      {
        id: "wire-placeholder",
        name: "Coverage intelligence",
        impact: 0,
        weight: 0.1,
        description: "Parse the coverage card for SHAP rows when available.",
        mitigationStrategy: "Complete documentation per payer criteria.",
        isAddressable: true,
      },
    ],
    historicalDenialRate: Math.min(100, denialProxy * 11),
    similarCasesApproved:
      cohort.approvedPct != null && cohort.sampleSize != null ?
        Math.round((cohort.approvedPct / 100) * cohort.sampleSize)
      : Math.round(((9 - denialProxy) / 9) * cohortFallbackN),
    similarCasesDenied:
      cohort.approvedPct != null && cohort.sampleSize != null ?
        Math.max(0, cohort.sampleSize - Math.round((cohort.approvedPct / 100) * cohort.sampleSize))
      : Math.max(0, cohortFallbackN - Math.round(((9 - denialProxy) / 9) * cohortFallbackN)),
    recommendations: recs.slice(0, 6),
    predictedOutcome: predictedOutcomeFromDenial(denialProxy),
  };

  const matchScore =
    clinical != null ? Math.min(100, Math.round((clinical / 9) * 100))
    : n > 0 ? Math.round((met / n) * 100)
    : 72;

  const rbmCriteriaMatch: RBMCriteriaMatch = {
    orderId,
    rbmVendor,
    guidelineVersion: "AIIE-2.0",
    guidelineDate: new Date().toISOString().slice(0, 10),
    matchedCriteria: matched,
    unmatchedCriteria: unmatched,
    overallMatchScore: matchScore,
    specificGuideline: summary || "AIIE coverage intelligence",
    guidelineReference: "AIIE factor evidence citations (CDS coverage service)",
    guidelineCategory: "aiie-evidence",
    requirementsMetCount: met,
    requirementsTotalCount: Math.max(n, 1),
  };

  return { denialPrediction, rbmCriteriaMatch };
}
