import type { INSAuthorizationBand } from "@/lib/aiie/denial-risk";
import type { ParsedCoverage } from "@/lib/fhir/coverage";
import type { AIIEScore } from "@/lib/types/aiie";
import type { CDSCard } from "@/lib/types/cds-hooks";

import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
  noopSuggestionActions,
} from "@/lib/cards/card-shared";
import { medicalBasisFromDominantFactor } from "@/lib/cds-platform/cds-hooks/medical-basis";

/** Optional approval metrics derived from `ins_pa_history` for social-proof copy. */
export interface InsPaHistorySimilarMetrics {
  /** Whole-number percent of approvals among similar orders (e.g. 92). */
  approvedPercent: number;
  /** Count of historical decisions in the window. */
  sampleSize: number;
}

function topFactorsBySign(score: AIIEScore, positive: boolean, n: number) {
  const pool = score.factors.filter((f) => (positive ? f.contribution > 0 : f.contribution < 0));
  const sorted = [...pool].sort((a, b) =>
    positive ? b.contribution - a.contribution : a.contribution - b.contribution,
  );
  return sorted.slice(0, n);
}

function factorListMarkdown(title: string, factors: ReturnType<typeof topFactorsBySign>): string {
  if (factors.length === 0) {
    return `**${title}:** _No factors in this direction._`;
  }
  const lines = factors.map(
    (f) =>
      `- **${f.name}** (SHAP ${f.contribution > 0 ? "+" : ""}${f.contribution.toFixed(2)}) — _${f.evidenceCitation}_`,
  );
  return `**${title}**\n${lines.join("\n")}`;
}

function guidelineBlock(score: AIIEScore): string {
  const citations = [
    ...new Set(score.factors.map((f) => f.evidenceCitation).filter(Boolean)),
  ].slice(0, 6);
  if (citations.length === 0) {
    return "_No discrete guideline citations were attached to factors._";
  }
  return citations.map((c) => `- ${c}`).join("\n");
}

function summaryForAction(action: INSAuthorizationBand): string {
  switch (action) {
    case "AUTO_APPROVE":
      return "PA waived — Gold Card path for this order";
    case "LIKELY_APPROVE":
      return "Likely approved — strong payer alignment";
    case "CLINICAL_REVIEW":
      return "PA review likely — document medical necessity";
    case "LIKELY_DENY":
      return "High denial risk — strengthen documentation";
    default:
      return "Coverage intelligence — review PA posture";
  }
}

function suggestionsForAction(action: INSAuthorizationBand) {
  const base = noopSuggestionActions();
  if (action === "AUTO_APPROVE" || action === "LIKELY_APPROVE") {
    const recommendedLabel =
      action === "LIKELY_APPROVE" ? "Submit for auto-approval" : "Submit PA now";
    return [
      {
        label: recommendedLabel,
        uuid: "b1111111-1111-4111-8111-111111111101",
        isRecommended: true,
        actions: base,
      },
      {
        label: "Add note",
        uuid: "b1111111-1111-4111-8111-111111111102",
        actions: base,
      },
      {
        label: "Review factors",
        uuid: "b1111111-1111-4111-8111-111111111103",
        actions: base,
      },
    ];
  }
  if (action === "CLINICAL_REVIEW") {
    return [
      {
        label: "Complete DTR questionnaire",
        uuid: "b2222222-2222-4222-8222-222222222201",
        isRecommended: true,
        actions: base,
      },
      {
        label: "Submit as-is",
        uuid: "b2222222-2222-4222-8222-222222222202",
        actions: base,
      },
      {
        label: "Review order with alternative",
        uuid: "b2222222-2222-4222-8222-222222222203",
        actions: base,
      },
    ];
  }
  return [
    {
      label: "Complete DTR questionnaire",
      uuid: "b3333333-3333-4333-8333-333333333301",
      isRecommended: true,
      actions: base,
    },
    {
      label: "Choose alternative study",
      uuid: "b3333333-3333-4333-8333-333333333302",
      actions: base,
    },
    {
      label: "Submit anyway with justification",
      uuid: "b3333333-3333-4333-8333-333333333303",
      actions: base,
    },
  ];
}

/**
 * Builds the primary payer / PA intelligence CDS card from AIIE and coverage inputs.
 *
 * @param aiie - AIIE score including SHAP-style factors.
 * @param denialRisk - Payer denial-risk proxy on 1–9.
 * @param action - INS authorization routing band.
 * @param coverage - Parsed FHIR coverage for payer context.
 * @param paHistory - Optional metrics from `ins_pa_history` for social proof.
 * @returns CDS Hooks card with up to three active-choice suggestions.
 */
export function buildCoverageCard(
  aiie: AIIEScore,
  denialRisk: number,
  action: INSAuthorizationBand,
  coverage: ParsedCoverage,
  paHistory?: InsPaHistorySimilarMetrics,
): CDSCard {
  const payer = coverage.payerName ?? coverage.payerId ?? "the plan";
  const pos = topFactorsBySign(aiie, true, 3);
  const neg = topFactorsBySign(aiie, false, 3);
  const histRate =
    paHistory && paHistory.sampleSize > 0 ?
      `${paHistory.approvedPercent}% of similar orders from your specialty are approved (n=${paHistory.sampleSize}).`
    : "_Specialty-level approval rate from `ins_pa_history` was not available for this request._";

  const detailCore = `<details><summary>PA posture</summary>

- **Payer:** ${payer}
- **Denial risk (proxy):** ${denialRisk}/9 (lower is more favorable)
- **Clinical appropriateness:** ${aiie.clinicalScore}/9 (confidence ${Math.round(aiie.confidence * 100)}%)
- **Social proof:** ${histRate}

</details>

<details><summary>SHAP factors (top 3 each)</summary>

${factorListMarkdown("Top supportive factors", pos)}

${factorListMarkdown("Top opposing factors", neg)}

</details>

<details><summary>Guideline citations</summary>

${guidelineBlock(aiie)}

</details>

<details><summary>Narrative</summary>

${aiie.narrativeRationale}

</details>`;

  return {
    uuid: "arka-ins-coverage",
    summary: summaryForAction(action),
    detail: appendFdaDetailDisclaimer(detailCore),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
    medicalBasis: medicalBasisFromDominantFactor(aiie.factors),
    selectionBehavior: "at-most-one",
    suggestions: suggestionsForAction(action),
    links: [
      {
        label: "Launch DTR questionnaire (SMART)",
        url: "https://arkahealth.com/ins/dtr",
        type: "smart",
        appContext: JSON.stringify({
          payerId: coverage.payerId,
          action,
        }),
      },
    ],
  };
}
