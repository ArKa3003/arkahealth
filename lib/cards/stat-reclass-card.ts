import {
  allStatCriterionIds,
  STAT_CRITERION_LABELS,
  type StatGateResult,
} from "@/lib/aiie/stat-gate";
import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
} from "@/lib/cards/card-shared";
import { bump } from "@/lib/server/metrics-counters";
import type { CDSCard, CDSOverrideReason } from "@/lib/types/cds-hooks";
import type { ServiceRequest } from "@/lib/types/fhir";

const STAT_RECLASS_SUGGESTION_UUID = "b2222222-2222-4222-8222-222222222201";

const STAT_OVERRIDE_REASONS: CDSOverrideReason[] = [
  {
    code: "time_sensitive_clinical_judgment",
    display: "Time-sensitive clinical judgment — document rationale in the chart",
  },
  {
    code: "patient_logistics",
    display: "Patient logistics require STAT scheduling",
  },
  {
    code: "other",
    display: "Other — free-text justification required in clinical note",
  },
];

export interface StatReclassCardParams {
  /** CDS evaluation output from {@link evaluateStat}. */
  gate: StatGateResult;
  /** Imaging ServiceRequest being ordered (for update suggestion). */
  serviceRequest: ServiceRequest;
}

/**
 * CDS card when STAT priority does not meet emergent criteria — suggests Urgent (4h).
 *
 * @param params - Gate result and target ServiceRequest.
 */
export function buildStatReclassCard(params: StatReclassCardParams): CDSCard {
  void bump("stat_reclass_card_emitted");
  const { gate, serviceRequest } = params;
  const srId = serviceRequest.id?.trim() ?? "unknown-order";

  const matchedRows =
    gate.matchedCriteria.length > 0 ?
      gate.matchedCriteria
        .map((id) => {
          const label = STAT_CRITERION_LABELS[id as keyof typeof STAT_CRITERION_LABELS];
          return label ? `- ✓ ${label}` : `- ✓ ${id}`;
        })
        .join("\n")
    : "- _(none detected)_";

  const missingIds = allStatCriterionIds().filter((id) => !gate.matchedCriteria.includes(id));
  const missingRows = missingIds.map((id) => `- ○ ${STAT_CRITERION_LABELS[id]}`).join("\n");

  const detailCore = `<details><summary>Why STAT may not be warranted</summary>

${gate.rationale}

**Matched emergent criteria**
${matchedRows}

**Required STAT criteria not met**
${missingRows}

ARKA suggests changing priority to **Urgent** (target: next 4 hours) unless you document an override reason below.

</details>`;

  const updateResource: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: srId,
    intent: serviceRequest.intent,
    subject: serviceRequest.subject,
    priority: "urgent",
  };

  return {
    uuid: "arka-ins-stat-reclass",
    summary: "STAT label may not be warranted — suggested priority: Urgent",
    detail: appendFdaDetailDisclaimer(detailCore),
    indicator: "warning",
    source: { ...ARKA_INS_CARD_SOURCE },
    selectionBehavior: "at-most-one",
    suggestions: [
      {
        label: "Change priority to Urgent (next 4 hours)",
        uuid: STAT_RECLASS_SUGGESTION_UUID,
        isRecommended: true,
        actions: [
          {
            type: "update",
            description: "Set ServiceRequest.priority to urgent",
            resource: updateResource,
          },
        ],
      },
    ],
    overrideReasons: [...STAT_OVERRIDE_REASONS],
  };
}
