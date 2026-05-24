import type { GoldCardStatus } from "@/lib/types/aiie";
import type { CDSCard } from "@/lib/types/cds-hooks";

import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
  noopSuggestionActions,
} from "@/lib/cards/card-shared";
import { medicalBasisFromCitation } from "@/lib/cds-platform/cds-hooks/medical-basis";

const SKIP_PA_UUID = "a1111111-1111-4111-8111-111111111101";

/**
 * Builds a CDS card when Gold Card eligibility allows skipping standard PA.
 *
 * @param score - Gold card metrics for the provider, CPT, and payer.
 * @param providerName - Ordering clinician display name.
 * @param cpt - Procedure code.
 * @returns CDS Hooks card with progressive disclosure and a single recommended action.
 */
export function buildGoldCardCard(score: GoldCardStatus, providerName: string, cpt: string): CDSCard {
  const approvalPct = Math.round(score.approvalRate * 100);
  const wilsonLb = score.score;
  const detailCore = `<details><summary>Gold Card metrics</summary>

| Metric | Value |
| --- | --- |
| Historical approval rate | ${approvalPct}% |
| Sample size | ${score.sampleSize} |
| Wilson 95% lower bound | ${wilsonLb}% |
| Validity | Rolling 30-day cache from last computation |

</details>

<details><summary>Ordering context</summary>

- **Clinician:** ${providerName}
- **CPT:** ${cpt}
${score.nextMilestone ? `- **Next milestone:** ${score.nextMilestone}` : ""}

</details>`;

  return {
    uuid: "arka-ins-gold-card",
    summary: "✓ Gold Card: Auto-approved (no PA needed)",
    detail: appendFdaDetailDisclaimer(detailCore),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
    medicalBasis: medicalBasisFromCitation(
      "cms:gold-card-medicare-advantage",
      "cms_lcd",
      `This provider meets CMS Medicare Advantage gold-carding thresholds (historical approval ${approvalPct}%, n=${score.sampleSize}, Wilson lower bound ${wilsonLb}%) for CPT ${cpt}, supporting auto-approval without standard prior authorization when plan policy aligns. // TODO(clinical-signoff)`,
      "CMS Medicare Advantage Gold Card",
    ),
    selectionBehavior: "at-most-one",
    suggestions: [
      {
        label: "Skip prior authorization",
        uuid: SKIP_PA_UUID,
        isRecommended: true,
        actions: noopSuggestionActions(),
      },
    ],
    links: [
      {
        label: "Open Gold Card workflow",
        url: "https://arkahealth.com/ins/aiie?flow=gold-card",
        type: "smart",
        appContext: JSON.stringify({ cpt, flow: "gold-card" }),
      },
    ],
  };
}
