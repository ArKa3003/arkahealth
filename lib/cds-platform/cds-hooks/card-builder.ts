/**
 * @file card-builder.ts
 * @description Builds CDS Hooks card responses (summary, detail, indicator, suggestions, links)
 *   from scoring and alerting output for display in the EHR.
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
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';
import { assertMedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';

const ARKA_SOURCE: CDSSource = {
  label: 'ARKA Imaging Intelligence Engine v2.0',
  url: 'https://arka-health.com',
};

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

function scoreToIndicator(score: number): 'info' | 'warning' | 'critical' {
  if (score >= 7) return 'info';
  if (score >= 4) return 'warning';
  return 'critical';
}

function scoreToEmoji(score: number): string {
  if (score >= 7) return '✅';
  if (score >= 4) return '⚠️';
  return '🔴';
}

function scoreCategory(score: number): string {
  if (score >= 7) return 'Appropriate';
  if (score >= 4) return 'May be appropriate';
  return 'Not appropriate';
}

/** Top N SHAP factors for card detail (markdown). */
function formatShapDetail(prediction: MLPrediction, topN = 3): string {
  const contribs = prediction.shapValues?.featureContributions ?? [];
  const sorted = [...contribs].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
  // TODO(fda-criterion-4): join to feature-catalog.ts and suppress features without a catalogue entry
  const lines = sorted.slice(0, topN).map((c) => {
    const dir = c.shapValue > 0 ? '+' : '';
    return `- **${c.feature}**: ${dir}${c.shapValue.toFixed(2)}`;
  });
  return lines.length ? lines.join('\n') : 'No factor details available.';
}

/**
 * Builds an appropriateness card from ML prediction and scenario.
 * Summary &lt;140 chars, detail with score, category, top SHAP factors, rationale.
 */
export function buildAppropriatenessCard(
  prediction: MLPrediction,
  scenario: ClinicalScenario,
  hookType: 'order-select' | 'order-sign'
): CDSCard {
  const score = prediction.score;
  const indicator = scoreToIndicator(score);
  const emoji = scoreToEmoji(score);
  const category = scoreCategory(score);
  const modality = scenario.proposedImaging?.modality ?? 'Imaging';
  const indication = scenario.proposedImaging?.indication ?? scenario.chiefComplaint ?? 'clinical indication';

  const summary =
    score >= 7
      ? `${modality} for ${indication}: Appropriate (score ${score}).`
      : score >= 4
        ? `${modality} may be appropriate (score ${score}). Consider alternatives.`
        : `${modality} may not be appropriate (score ${score}). Consider alternatives or non-imaging workup.`;
  const truncatedSummary = summary.length > 140 ? summary.slice(0, 137) + '...' : summary;

  const shapBlock = formatShapDetail(prediction);
  const detail = [
    `**Score:** ${score} ${emoji} — ${category}`,
    '',
    '**Top factors (SHAP):**',
    shapBlock,
    '',
    `**Rationale:** ${indication}. Model confidence: ${(prediction.confidence * 100).toFixed(0)}%.`,
  ].join('\n');

  const card: CDSCard = {
    uuid: uuidv4(),
    summary: truncatedSummary,
    detail,
    indicator,
    source: ARKA_SOURCE,
  };

  if (hookType === 'order-sign' && (indicator === 'warning' || indicator === 'critical')) {
    card.overrideReasons = [
      { display: 'Clinical judgment — benefits outweigh risks' },
      { display: 'Additional clinical information not captured in system' },
      { display: 'Discussed with radiologist' },
      { display: 'Patient preference after informed discussion' },
      { display: 'Emergency/time-sensitive clinical situation' },
    ];
  }

  const indicationSlug = (indication ?? 'imaging')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  card.links = [
    {
      label: 'ARKA AIIE Evidence Library',
      url: `https://arka-health.com/evidence/${indicationSlug || 'imaging'}`,
      type: 'absolute',
    },
  ];

  return card;
}

/**
 * Builds a safety card (pregnancy + radiation, contrast allergy, renal impairment, etc.).
 * Always CRITICAL indicator.
 */
export function buildSafetyCard(warning: SafetyWarning): CDSCard {
  return {
    uuid: uuidv4(),
    summary: warning.summary,
    detail: warning.detail,
    indicator: 'critical',
    source: ARKA_SOURCE,
  };
}

/**
 * Builds suggestion actions for alternative imaging options.
 * Each alternative: label "Order [modality] instead", isRecommended for first/top, actions with create ServiceRequest.
 */
export function buildAlternativesSuggestions(
  alternatives: Alternative[],
  patientId: string
): CDSSuggestion[] {
  const subjectRef = `Patient/${patientId}`;
  return alternatives.map((alt, i) => {
    const label = alt.display ?? `Order ${alt.modality} instead`;
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
      label: label.length > 80 ? label.slice(0, 77) + '...' : label,
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

/**
 * FDA Non-Device CDS: every card MUST have a medicalBasis. This is the Criterion 2 invariant.
 *
 * Validates {@link medicalBasis} and returns a CDS Hooks card ready for the response payload.
 */
export function build(card: CardDraft): CDSCard & { medicalBasis: MedicalBasis } {
  assertMedicalBasis(card.medicalBasis);
  return {
    uuid: uuidv4(),
    summary: card.summary,
    detail: card.detail,
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
    detail: input.detail,
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
    detail: 'No significant concerns identified. Proceed if clinically indicated.',
    indicator: 'info',
    source: { label: sourceLabel ?? ARKA_SOURCE.label, url: ARKA_SOURCE.url },
  };
}
