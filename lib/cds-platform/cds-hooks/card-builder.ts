/**
 * @file card-builder.ts
 * @description Builds CDS Hooks card responses (summary, detail, indicator, suggestions,
 *   overrideReasons, links) from Knowledge Matrix resolution + scoring output for the EHR.
 *
 * Card contract (production hardening, Prompt 3.5):
 * - summary &lt;140 chars and always carries the score ("AIIE 3/9 — low-value order: …").
 * - indicator from score: 1–3 warning (+suggestion), 4–6 info, 7–9 info; red-flag EXPEDITE → critical.
 * - suggestions carry a concrete alternative ServiceRequest when the matched matrix
 *   variant has a better-rated modality (coding copied from the matrix rating).
 * - overrideReasons attached to warning/critical cards (CDS Hooks 2.0 feedback contract).
 * - links point at the first-party evidence route (see lib/evidence/url.ts).
 * - every detail ends with the mandated FDA Non-Device CDS sentence.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  CDSCard,
  CDSSource,
  CDSSuggestion,
  CDSSuggestionAction,
  CDSLink,
  CDSOverrideReason,
} from './types';
import type { MLPrediction } from '../ml/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { FHIRServiceRequest } from '../fhir/resources';
import type { ModalityRating, ResolvedRating } from '@/lib/aiie/knowledge-matrix';
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';
import {
  assertMedicalBasis,
  medicalBasisFromMatrix,
} from '@/lib/cds-platform/cds-hooks/medical-basis';
import {
  betterRatedAlternative,
  isRedFlagExpedite,
  MATRIX_MODALITY_DISPLAY,
  MATRIX_VERSION,
  resolveMatrixForScenario,
} from '@/lib/cds-platform/cds-hooks/matrix-bridge';
import { evidenceUrl } from '@/lib/evidence/url';
import {
  detailIncludesFdaDisclosure,
  FDA_NON_DEVICE_CDS_DISCLOSURE,
} from '@/lib/compliance/fda-disclosure';

const ARKA_SOURCE: CDSSource = {
  label: 'ARKA Imaging Intelligence Engine v2.0',
  url: 'https://arkahealth.com',
};

/** Code system for ARKA card override reasons (CDS Hooks 2.0 feedback contract). */
export const OVERRIDE_REASON_SYSTEM =
  'https://arkahealth.com/fhir/CodeSystem/cds-override-reason';

/** Code system for AIIE matrix modality codings copied onto suggested ServiceRequests. */
const AIIE_MODALITY_SYSTEM = 'https://arkahealth.com/fhir/CodeSystem/aiie-modality';

/** Safety warning for patient-specific alerts (pregnancy, contrast allergy, renal, etc.) */
export interface SafetyWarning {
  code: string;
  summary: string;
  detail: string;
}

/** Alternative imaging option for suggestions */
export interface Alternative {
  modality: string;
  bodyPart?: string;
  display?: string;
  /** Optional pre-built FHIR ServiceRequest for create action */
  resource?: FHIRServiceRequest;
}

/**
 * Maps the AIIE 1–9 score to a CDS Hooks indicator.
 * 1–3 → warning, 4–9 → info; red-flag EXPEDITE always escalates to critical.
 *
 * @param score - AIIE appropriateness score (1–9).
 * @param expedite - True when the matrix matched a red-flag variant.
 */
export function scoreToIndicator(
  score: number,
  expedite = false,
): 'info' | 'warning' | 'critical' {
  if (expedite) return 'critical';
  if (score <= 3) return 'warning';
  return 'info';
}

/** Standard override reasons attached to warning/critical cards (require a reason on dismiss). */
export function cardOverrideReasons(): CDSOverrideReason[] {
  return [
    {
      code: 'clinical-judgment',
      system: OVERRIDE_REASON_SYSTEM,
      display: 'Clinical judgment — benefits outweigh risks',
    },
    {
      code: 'additional-information',
      system: OVERRIDE_REASON_SYSTEM,
      display: 'Additional clinical information not captured in system',
    },
    {
      code: 'radiologist-consult',
      system: OVERRIDE_REASON_SYSTEM,
      display: 'Discussed with radiologist',
    },
    {
      code: 'patient-preference',
      system: OVERRIDE_REASON_SYSTEM,
      display: 'Patient preference after informed discussion',
    },
    {
      code: 'emergency',
      system: OVERRIDE_REASON_SYSTEM,
      display: 'Emergency/time-sensitive clinical situation',
    },
  ];
}

function clampSummary(summary: string): string {
  return summary.length >= 140 ? `${summary.slice(0, 136)}...` : summary;
}

/**
 * Builds the &lt;140-char score-bearing summary line for an appropriateness card.
 *
 * @param score - AIIE appropriateness score (1–9).
 * @param orderedDisplay - Display name of the ordered modality.
 * @param expedite - True when the matrix matched a red-flag variant.
 * @param alternative - Better-rated modality on the matched variant, when one exists.
 */
export function buildScoreSummary(
  score: number,
  orderedDisplay: string,
  expedite: boolean,
  alternative: ModalityRating | null,
): string {
  if (expedite) {
    return clampSummary(
      `AIIE ${score}/9 — EXPEDITE: red-flag presentation; prioritize ${orderedDisplay} workup`,
    );
  }
  if (score <= 3) {
    const alt = alternative ? MATRIX_MODALITY_DISPLAY[alternative.modality] : null;
    return clampSummary(
      alt
        ? `AIIE ${score}/9 — low-value order: consider ${alt} first`
        : `AIIE ${score}/9 — low-value order: review evidence before proceeding`,
    );
  }
  if (score <= 6) {
    return clampSummary(
      `AIIE ${score}/9 — may be appropriate: confirm indication for ${orderedDisplay}`,
    );
  }
  return clampSummary(`AIIE ${score}/9 — appropriate: ${orderedDisplay} supported for this indication`);
}

/**
 * Builds a concrete draft FHIR ServiceRequest for a better-rated matrix modality.
 * Coding is copied from the matrix rating (modality code + evidence slug) and the
 * reason codes are carried over from the original order so the EHR can file it as-is.
 *
 * @param alternative - Better-rated matrix modality rating.
 * @param scenario - Mapped scenario for the original draft order.
 */
export function buildAlternativeServiceRequest(
  alternative: ModalityRating,
  scenario: ClinicalScenario,
): FHIRServiceRequest {
  const display = MATRIX_MODALITY_DISPLAY[alternative.modality];
  const bodyPart = scenario.proposedImaging?.bodyPart;
  const sr = scenario.serviceRequests?.[0];
  const reasonText = (sr?.reasonCodes ?? []).filter(Boolean);
  return {
    resourceType: 'ServiceRequest',
    status: 'draft',
    intent: 'order',
    subject: { reference: `Patient/${scenario.patientId}` },
    code: {
      text: `${display}${bodyPart ? ` — ${bodyPart}` : ''}`,
      coding: [
        {
          system: AIIE_MODALITY_SYSTEM,
          code: alternative.modality,
          display,
        },
      ],
    },
    ...(reasonText.length > 0
      ? { reasonCode: reasonText.map((text) => ({ text })) }
      : {}),
    ...(bodyPart ? { bodySite: [{ text: String(bodyPart) }] } : {}),
  } as FHIRServiceRequest;
}

/** Top N SHAP factors for card detail (markdown). */
function formatShapDetail(prediction: MLPrediction, topN = 3): string {
  const contribs = prediction.shapValues?.featureContributions ?? [];
  const sorted = [...contribs].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
  const lines = sorted.slice(0, topN).map((c) => {
    const dir = c.shapValue > 0 ? '+' : '';
    return `- **${c.feature}**: ${dir}${c.shapValue.toFixed(2)}`;
  });
  return lines.length ? lines.join('\n') : 'No factor details available.';
}

/**
 * Builds the evidence links for a card: the matched rating's evidence page plus the
 * alternative modality's evidence page when one is suggested. All links are
 * first-party absolute URLs per the Part 4 evidence URL contract.
 */
function buildEvidenceLinks(
  resolved: ResolvedRating,
  alternative: ModalityRating | null,
): CDSLink[] {
  const links: CDSLink[] = [
    {
      label: `AIIE Evidence — ${resolved.scenario.name}`,
      url: evidenceUrl(resolved.rating.evidenceSlug),
      type: 'absolute',
    },
  ];
  if (alternative && alternative.evidenceSlug !== resolved.rating.evidenceSlug) {
    links.push({
      label: `AIIE Evidence — ${MATRIX_MODALITY_DISPLAY[alternative.modality]} alternative`,
      url: evidenceUrl(alternative.evidenceSlug),
      type: 'absolute',
    });
  }
  return links;
}

/**
 * Builds an appropriateness card from the matrix resolution, ML prediction, and scenario.
 * Implements the full hardened card contract (summary/indicator/suggestions/overrideReasons/links).
 *
 * @param prediction - AIIE score from ML or rule-based fallback.
 * @param scenario - FHIR-mapped scenario for a single draft order.
 * @param hookType - Originating CDS hook.
 */
export function buildAppropriatenessCard(
  prediction: MLPrediction,
  scenario: ClinicalScenario,
  hookType: 'order-select' | 'order-sign',
): CDSCard & { medicalBasis: MedicalBasis } {
  const score = Math.min(9, Math.max(1, Math.round(prediction.score)));
  const resolved = resolveMatrixForScenario(scenario);
  const expedite = isRedFlagExpedite(resolved) && resolved.rating.rating >= 7;
  const alternative = betterRatedAlternative(resolved);
  const medicalBasis = medicalBasisFromMatrix(resolved);

  const orderedDisplay =
    MATRIX_MODALITY_DISPLAY[resolved.rating.modality] ??
    String(scenario.proposedImaging?.modality ?? 'Imaging');
  const indication =
    scenario.proposedImaging?.indication ?? scenario.chiefComplaint ?? 'clinical indication';

  const indicator = scoreToIndicator(score, expedite);
  const summary = buildScoreSummary(score, orderedDisplay, expedite, alternative);

  const mlLayerNote = prediction.usedFallback
    ? 'AIIE rule-based scoring (ML service offline).'
    : `Model confidence: ${(prediction.confidence * 100).toFixed(0)}%.`;
  const matchLine = resolved.variant
    ? `Matrix match: ${resolved.scenario.id} / ${resolved.variant.id} (${resolved.matchTier}, v${MATRIX_VERSION}, ${hookType}).`
    : `Matrix match: ${resolved.scenario.id} (${resolved.matchTier}, v${MATRIX_VERSION}, ${hookType}).`;
  const detail = [
    `**Guideline basis:** ${medicalBasis.label}`,
    medicalBasis.rationale,
    '',
    `**Matrix rating:** ${orderedDisplay} rated ${resolved.rating.rating}/9 for this presentation. ${matchLine}`,
    alternative
      ? `**Preferred alternative:** ${MATRIX_MODALITY_DISPLAY[alternative.modality]} rated ${alternative.rating}/9 — ${alternative.rationale}`
      : '',
    '',
    '**ARKA regulatory posture:** FDA Non-Device CDS under the 21st Century Cures Act.',
    '',
    `**AIIE score:** ${score}/9`,
    '',
    '**Top factors (SHAP):**',
    formatShapDetail(prediction),
    '',
    `**Rationale:** ${indication}. ${mlLayerNote}`,
  ]
    .filter((line, i, arr) => line !== '' || arr[i - 1] !== '')
    .join('\n');

  const suggestions: CDSSuggestion[] | undefined = alternative
    ? [
        {
          label: clampSuggestionLabel(
            `Order ${MATRIX_MODALITY_DISPLAY[alternative.modality]} instead (rated ${alternative.rating}/9)`,
          ),
          uuid: uuidv4(),
          isRecommended: true,
          actions: [
            {
              type: 'create',
              description: `Create draft order: ${MATRIX_MODALITY_DISPLAY[alternative.modality]}`,
              resource: buildAlternativeServiceRequest(alternative, scenario),
            },
          ],
        },
      ]
    : undefined;

  const overrideReasons =
    indicator === 'warning' || indicator === 'critical' ? cardOverrideReasons() : undefined;

  return build({
    summary,
    detail,
    indicator,
    source: ARKA_SOURCE,
    medicalBasis,
    suggestions,
    overrideReasons,
    links: buildEvidenceLinks(resolved, alternative),
  });
}

function clampSuggestionLabel(label: string): string {
  return label.length > 80 ? `${label.slice(0, 77)}...` : label;
}

/**
 * Builds a safety card (pregnancy + radiation, contrast allergy, renal impairment, etc.).
 * Always CRITICAL indicator; requires a reason to dismiss and carries the FDA sentence.
 *
 * @param warning - Structured safety warning.
 * @param scenario - Optional scenario used to anchor the medical basis in the matrix.
 */
export function buildSafetyCard(
  warning: SafetyWarning,
  scenario?: ClinicalScenario,
): CDSCard & { medicalBasis?: MedicalBasis } {
  const medicalBasis = scenario
    ? medicalBasisFromMatrix(resolveMatrixForScenario(scenario))
    : undefined;
  const detailParts = [
    medicalBasis ? `**Guideline basis:** ${medicalBasis.label}` : '',
    warning.detail,
  ].filter(Boolean);
  return {
    uuid: uuidv4(),
    summary: clampSummary(warning.summary),
    detail: appendDisclosure(detailParts.join('\n')),
    indicator: 'critical',
    source: ARKA_SOURCE,
    overrideReasons: cardOverrideReasons(),
    ...(medicalBasis ? { medicalBasis } : {}),
  };
}

/**
 * Builds suggestion actions for alternative imaging options (legacy heuristic path).
 * Each alternative: label, isRecommended for first/top, actions with create ServiceRequest.
 */
export function buildAlternativesSuggestions(
  alternatives: Alternative[],
  patientId: string,
): CDSSuggestion[] {
  const subjectRef = `Patient/${patientId}`;
  return alternatives.map((alt, i) => {
    const baseLabel = alt.display ?? `Order ${alt.modality} instead`;
    const label = /^Review|^Consider|^Open|^View/i.test(baseLabel)
      ? baseLabel
      : `Consider: ${baseLabel}`;
    const resource: FHIRServiceRequest = alt.resource ?? {
      resourceType: 'ServiceRequest',
      status: 'draft',
      intent: 'order',
      subject: { reference: subjectRef },
      code: {
        text: alt.modality + (alt.bodyPart ? ` - ${alt.bodyPart}` : ''),
        coding: [{ display: alt.modality, code: alt.modality.replace(/\s/g, '-').toLowerCase() }],
      },
    };
    const action: CDSSuggestionAction = {
      type: 'create',
      description: `Create order: ${alt.modality}`,
      resource,
    };
    return {
      label: clampSuggestionLabel(label),
      uuid: uuidv4(),
      isRecommended: i === 0,
      actions: [action],
    };
  });
}

/** Internal card draft: all regulatory fields required before CDS Hooks emission. */
export interface CardDraft {
  summary: string;
  detail?: string;
  indicator: 'info' | 'warning' | 'critical';
  source?: CDSSource;
  suggestions?: CDSSuggestion[];
  overrideReasons?: CDSOverrideReason[];
  links?: CDSLink[];
  medicalBasis: MedicalBasis;
}

/** Appends the mandated FDA Non-Device CDS sentence when the detail does not carry it. */
function appendDisclosure(detail: string): string {
  return detailIncludesFdaDisclosure(detail)
    ? detail
    : `${detail}\n\n${FDA_NON_DEVICE_CDS_DISCLOSURE}`;
}

/**
 * FDA Non-Device CDS: every card MUST have a medicalBasis (Criterion 2 invariant) and
 * every detail MUST end with the mandated FDA Non-Device CDS sentence.
 *
 * Validates {@link CardDraft.medicalBasis} and returns a CDS Hooks card ready for emission.
 */
export function build(card: CardDraft): CDSCard & { medicalBasis: MedicalBasis } {
  assertMedicalBasis(card.medicalBasis);
  return {
    uuid: uuidv4(),
    summary: card.summary,
    detail: appendDisclosure(card.detail ?? ''),
    indicator: card.indicator,
    source: card.source ?? ARKA_SOURCE,
    suggestions: card.suggestions,
    overrideReasons: card.overrideReasons,
    links: card.links,
    medicalBasis: card.medicalBasis,
  };
}

/** Input to build a single card (from tiered alert + score) — legacy compatibility */
export interface CardBuildInput {
  summary: string;
  detail?: string;
  indicator: 'info' | 'warning' | 'critical';
  suggestions?: Array<{
    label: string;
    actionType?: 'create' | 'update' | 'delete';
    resource?: Record<string, unknown>;
  }>;
  links?: Array<{ label: string; url: string; type?: string }>;
  sourceLabel?: string;
  sourceUrl?: string;
}

/**
 * Builds one CDS card with a unique uuid and standard source.
 */
export function buildCard(input: CardBuildInput): CDSCard {
  const source: CDSSource = {
    label: input.sourceLabel ?? ARKA_SOURCE.label,
    url: input.sourceUrl ?? ARKA_SOURCE.url,
  };
  const suggestions: CDSSuggestion[] | undefined = input.suggestions?.map((s) => ({
    label: s.label,
    uuid: uuidv4(),
    actions: s.resource
      ? [{ type: (s.actionType ?? 'create') as 'create' | 'update' | 'delete', description: s.label, resource: s.resource }]
      : undefined,
  }));
  const links: CDSLink[] | undefined = input.links?.map((l) => ({
    label: l.label,
    url: l.url,
    type: (l.type === 'smart' ? 'smart' : 'absolute') as 'absolute' | 'smart',
  }));
  return {
    uuid: uuidv4(),
    summary: input.summary,
    detail: input.detail ? appendDisclosure(input.detail) : input.detail,
    indicator: input.indicator,
    source,
    suggestions,
    links,
  };
}

/**
 * Builds multiple cards from an array of CardBuildInput.
 */
export function buildCards(inputs: CardBuildInput[]): CDSCard[] {
  return inputs.map(buildCard);
}

/**
 * Creates a "no recommendations" info card when appropriateness is high and no alerts.
 */
export function buildNoRecommendationsCard(sourceLabel?: string): CDSCard {
  return {
    uuid: uuidv4(),
    summary: 'Imaging order appears appropriate.',
    detail: appendDisclosure(
      'No significant concerns identified. Proceed if clinically indicated.',
    ),
    indicator: 'info',
    source: { label: sourceLabel ?? ARKA_SOURCE.label, url: ARKA_SOURCE.url },
  };
}
