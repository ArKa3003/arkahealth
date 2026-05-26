import type { OveruseRule } from "@/lib/aiie/overuse-patterns";
import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
  noopSuggestionActions,
} from "@/lib/cards/card-shared";
import type { AIIEOrder } from "@/lib/types/aiie";
import {
  mapOveruseCitationToCitationId,
  medicalBasisFromCitation,
} from "@/lib/cds-platform/cds-hooks/medical-basis";
import { bump } from "@/lib/server/metrics-counters";
import type { CDSCard, CDSOverrideReason } from "@/lib/types/cds-hooks";

const OVERUSE_SUGGESTION_UUID = "b4444444-4444-4444-8444-444444444401";

const OVERUSE_OVERRIDE_REASONS: CDSOverrideReason[] = [
  {
    code: "shared_decision_documented",
    display: "Shared decision — patient prefers to proceed after counseling",
  },
  {
    code: "clinical_findings_not_captured",
    display: "Clinical findings not captured in the record support imaging",
  },
  {
    code: "prior_management_exhausted",
    display: "Conservative management or observation already completed (document in note)",
  },
  {
    code: "other",
    display: "Other — free-text override reason required in clinical note",
  },
];

/** Parameters for {@link buildOveruseCard}. */
export interface OveruseCardInput {
  /** Ordered imaging service (shown in card detail). */
  order: AIIEOrder;
}

/**
 * CDS soft-block card for a matched inappropriate-imaging pattern.
 * Override reason is mandatory (critical indicator + structured override list).
 *
 * @param rule - Matched registry rule from {@link OVERUSE_RULES}.
 * @param input - Order context for detail rendering.
 */
export function buildOveruseCard(rule: OveruseRule, input: OveruseCardInput): CDSCard {
  void bump("overuse_card_emitted", { rule_id: rule.id });
  const procedure = input.order.procedure.trim() || "Imaging order";
  const cpt = input.order.cpt?.trim();
  const citationList = rule.citations.map((c) => `- ${c}`).join("\n");
  const primaryCitation = rule.citations[0] ?? rule.rationale;
  const mapped = mapOveruseCitationToCitationId(primaryCitation);
  const overuseMedicalBasis = medicalBasisFromCitation(
    mapped.citationId,
    mapped.authorityClass,
    `${rule.rationale} Primary reference: ${primaryCitation}. // TODO(clinical-signoff): overuse rule citations are plain strings — verify citationId mapping`,
    rule.cardTitle,
  );

  const detailCore = `<details><summary>${rule.cardTitle}</summary>

**Why ARKA flagged this order**

${rule.rationale}

| Field | Value |
| --- | --- |
| Pattern | \`${rule.id}\` |
| Ordered procedure | ${procedure}${cpt ? ` (CPT ${cpt})` : ""} |

**Recommended alternative**

${rule.recommendedAlternative}

**Guideline references**

${citationList}

If proceeding, please document the clinical reasoning to support quality review.

</details>`;

  return {
    uuid: `arka-ins-overuse-${rule.id}`,
    summary: rule.cardTitle,
    detail: appendFdaDetailDisclaimer(detailCore),
    indicator: "critical",
    source: { ...ARKA_INS_CARD_SOURCE },
    medicalBasis: overuseMedicalBasis,
    selectionBehavior: "at-most-one",
    suggestions: [
      {
        label: "Review conservative alternatives and document shared decision",
        uuid: OVERUSE_SUGGESTION_UUID,
        isRecommended: true,
        actions: noopSuggestionActions(),
      },
    ],
    overrideReasons: [...OVERUSE_OVERRIDE_REASONS],
  };
}
