import type { RedundancyAssessment } from "@/lib/aiie/redundancy";
import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
  noopSuggestionActions,
} from "@/lib/cards/card-shared";
import type { CDSCard, CDSOverrideReason } from "@/lib/types/cds-hooks";

const DUPLICATE_ORDER_SUGGESTION_UUID = "b3333333-3333-4333-8333-333333333301";

const HIGH_OVERRIDE_REASONS: CDSOverrideReason[] = [
  {
    code: "clinical_change_since_prior",
    display: "Clinical status changed since prior study",
  },
  {
    code: "prior_non_diagnostic",
    display: "Prior study non-diagnostic or incomplete",
  },
  {
    code: "other",
    display: "Other — free-text override reason required in clinical note",
  },
];

const MEDIUM_OVERRIDE_REASONS: CDSOverrideReason[] = [
  {
    code: "shared_decision_continue",
    display: "Proceed after shared decision discussion",
  },
  {
    code: "insufficient_prior",
    display: "Prior study insufficient for current clinical question",
  },
  {
    code: "other",
    display: "Other — optional free-text note",
  },
];

function actionLabel(action: RedundancyAssessment["suggestedAction"]): string {
  switch (action) {
    case "BLOCK_SOFT":
      return "Soft block — document override to proceed";
    case "DISCUSS":
      return "Discuss with patient — consider deferring or consolidating";
    default:
      return "Proceed if clinically indicated";
  }
}

function summaryForSeverity(severity: "high" | "medium"): string {
  return severity === "high" ?
      "Potential duplicate imaging order — override reason required"
    : "Prior imaging overlap — review before ordering";
}

/**
 * CDS card for prior-imaging redundancy (soft block). Clinician may proceed with override.
 *
 * @param assessment - Output of {@link evaluateRedundancy} when severity is `high` or `medium`.
 */
export function buildDuplicateOrderCard(assessment: RedundancyAssessment): CDSCard {
  const severity = assessment.severity === "high" ? "high" : "medium";
  const indicator = severity === "high" ? "critical" : "warning";
  const daysLabel =
    assessment.daysSincePrior != null ?
      `${Math.round(assessment.daysSincePrior)} day${Math.round(assessment.daysSincePrior) === 1 ? "" : "s"}`
    : "unknown interval";

  const priorId = assessment.priorStudyId ?? "unknown";
  const overrideNote =
    severity === "high" ?
      "An override reason with **free-text justification** is required to proceed."
    : "Override is optional; document rationale if you proceed despite overlap.";

  const detailCore = `<details><summary>Prior imaging overlap</summary>

${assessment.reason}

| Field | Value |
| --- | --- |
| Prior study | \`${priorId}\` |
| Days since prior | ${daysLabel} |
| Recommended action | ${actionLabel(assessment.suggestedAction)} |

${overrideNote}

</details>`;

  return {
    uuid: "arka-ins-duplicate-order",
    summary: summaryForSeverity(severity),
    detail: appendFdaDetailDisclaimer(detailCore),
    indicator,
    source: { ...ARKA_INS_CARD_SOURCE },
    selectionBehavior: "at-most-one",
    suggestions: [
      {
        label: "Review prior study in chart",
        uuid: DUPLICATE_ORDER_SUGGESTION_UUID,
        isRecommended: true,
        actions: noopSuggestionActions(),
      },
    ],
    overrideReasons:
      severity === "high" ? [...HIGH_OVERRIDE_REASONS] : [...MEDIUM_OVERRIDE_REASONS],
  };
}
