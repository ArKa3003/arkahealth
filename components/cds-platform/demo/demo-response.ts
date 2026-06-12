/**
 * @file demo-response.ts
 * @description Maps CDS Hooks API responses to sidebar / chart state for the live demo.
 */

import { FEATURE_CATALOG, getFeatureCatalogEntry } from '@/lib/cds-platform/ml/feature-catalog';
import { buildFeatureCitationUrl } from '@/lib/cds-platform/ml/feature-citation-url';
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';
import type { MLPrediction, SHAPFeatureContribution } from '@/lib/cds-platform/ml/types';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import { AlertCategory, AlertTierEnum } from '@/lib/cds-platform/alerting/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import { routes } from '@/lib/constants';
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from '@/lib/compliance/fda-disclosure';
import type { CDSCard, CDSHookResponse } from '@/lib/types/cds-hooks';
import type { DemoExpectedTier, DemoScenario } from './scenarios';

/** SHAP row with clinician-facing rationale (Phase 6.3 wire format). */
export interface ShapRowWithRationale {
  label: string;
  contribution: number;
  rationale: string;
  citationId: string;
  citationUrl: string;
  citationLabel: string;
}

/** Card payload extended with optional SHAP extension from the service. */
export type DemoCdsCard = CDSCard & {
  extension?: {
    shapWithRationales?: ShapRowWithRationale[];
  };
};

/**
 * Parses appropriateness score from card detail markdown.
 *
 * @param detail - CDS card detail body.
 */
export function parseScoreFromDetail(detail?: string): number | null {
  if (!detail) return null;
  const match = detail.match(/\*\*Score:\*\*\s*(\d+)/i) ?? detail.match(/score\s+(\d)/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Builds a {@link ClinicalScenario} from a demo scenario for sidebar props.
 *
 * @param scenario - Active demo scenario.
 */
export function scenarioToClinicalScenario(scenario: DemoScenario): ClinicalScenario {
  return {
    patientId: scenario.patientId,
    age: scenario.age,
    sex: scenario.sex,
    chiefComplaint: scenario.chiefComplaint,
    duration: scenario.duration,
    redFlags: scenario.redFlags.map((r) => ({ flag: r.flag, present: r.present })),
    renalFunction: {
      value: scenario.eGFR,
      date: new Date().toISOString().slice(0, 10),
      hasImpairment: scenario.eGFR < 60,
    },
    proposedImaging: {
      modality: scenario.modality,
      bodyPart: scenario.bodyPart,
      indication: scenario.chiefComplaint,
      urgency: scenario.urgency,
    },
  };
}

/**
 * Derives SHAP display rows from card extension or scenario fallbacks.
 *
 * @param card - Primary CDS card.
 * @param scenario - Demo scenario for fallback factors.
 */
/** API extension row (order-select wire format). */
interface ApiShapRow {
  feature?: string;
  label: string;
  contribution: number;
  rationale: string;
  citationId: string;
  citationUrl: string;
  citationLabel?: string;
  weightDirection?: string;
}

/**
 * Normalizes API SHAP extension rows to sidebar display rows.
 */
function resolveShapCitationUrl(row: ApiShapRow): string {
  if (row.feature) {
    const entry = getFeatureCatalogEntry(row.feature);
    if (entry) {
      return buildFeatureCitationUrl(row.feature, entry);
    }
  }
  return row.citationUrl;
}

function mapApiShapRows(rows: ApiShapRow[]): ShapRowWithRationale[] {
  return rows.slice(0, 5).map((row) => ({
    label: row.label,
    contribution: row.contribution,
    rationale: row.rationale,
    citationId: row.citationId,
    citationUrl: resolveShapCitationUrl(row),
    citationLabel: row.citationLabel ?? row.citationId,
  }));
}

export function resolveShapRows(card: DemoCdsCard | undefined, scenario: DemoScenario): ShapRowWithRationale[] {
  const ext = card?.extension?.shapWithRationales as ApiShapRow[] | undefined;
  if (ext && ext.length > 0) {
    return mapApiShapRows(ext);
  }
  return fallbackShapRows(scenario);
}

function fallbackShapRows(scenario: DemoScenario): ShapRowWithRationale[] {
  const rows: ShapRowWithRationale[] = [];
  const durationEntry = FEATURE_CATALOG.symptom_duration_days;
  const redFlagEntry = FEATURE_CATALOG.has_red_flags;
  const ageEntry = FEATURE_CATALOG.patient_age;

  if (scenario.duration < 42 && durationEntry) {
    rows.push({
      label: 'Duration < 6 wks',
      contribution: -1.4,
      rationale: durationEntry.rationale.slice(0, 120) + '…',
      citationId: durationEntry.citationId,
      citationUrl: buildFeatureCitationUrl('symptom_duration_days', durationEntry),
      citationLabel: 'Guideline §3',
    });
  }

  const noRedFlags = scenario.redFlags.every((r) => !r.present);
  if (noRedFlags && redFlagEntry) {
    rows.push({
      label: 'No red flags',
      contribution: -0.8,
      rationale: redFlagEntry.rationale.slice(0, 100) + '…',
      citationId: redFlagEntry.citationId,
      citationUrl: buildFeatureCitationUrl('has_red_flags', redFlagEntry),
      citationLabel: 'Guideline §2',
    });
  }

  if (ageEntry) {
    rows.push({
      label: `Age ${scenario.age}, ${scenario.sex === 'Male' ? 'M' : 'F'}`,
      contribution: 0.2,
      rationale: ageEntry.rationale.slice(0, 90) + '…',
      citationId: ageEntry.citationId,
      citationUrl: buildFeatureCitationUrl('patient_age', ageEntry),
      citationLabel: 'Context',
    });
  }

  return rows.slice(0, 5);
}

/**
 * Builds an {@link MLPrediction} from API card + scenario defaults.
 */
export function buildPredictionFromCard(
  card: DemoCdsCard | undefined,
  scenario: DemoScenario,
): MLPrediction {
  const score = parseScoreFromDetail(card?.detail) ?? (scenario.expectedTier === 'passive' ? 8 : 3);
  const shapRows = resolveShapRows(card, scenario);
  const featureContributions: SHAPFeatureContribution[] = shapRows.map((r) => ({
    feature: r.label,
    shapValue: r.contribution,
    featureValue: 1,
    direction: r.contribution > 0 ? 'positive' : r.contribution < 0 ? 'negative' : 'neutral',
  }));

  return {
    score,
    category: score >= 7 ? 'Appropriate' : score >= 4 ? 'May be appropriate' : 'Not appropriate',
    confidence: 0.82,
    shapValues: { baseValue: 5, featureContributions },
    modelVersion: 'demo-xgb-2.0',
    predictionId: `demo-${scenario.id}`,
    latencyMs: 0,
    usedFallback: false,
  };
}

function indicatorToTier(indicator: CDSCard['indicator']): TieredAlert['tier'] {
  if (indicator === 'critical') return AlertTierEnum.INTERRUPTIVE;
  if (indicator === 'warning') return AlertTierEnum.ACTIVE_WARNING;
  return AlertTierEnum.PASSIVE;
}

/**
 * Maps CDS cards to tiered alerts for {@link SidebarLayout}.
 */
export function cardsToTieredAlerts(cards: DemoCdsCard[]): TieredAlert[] {
  return cards
    .filter((c) => c.indicator !== 'info' || (c.summary ?? '').toLowerCase().includes('not appropriate'))
    .slice(0, 3)
    .map((card, i) => ({
      id: card.uuid ?? `alert-${i}`,
      tier: indicatorToTier(card.indicator),
      category: AlertCategory.APPROPRIATENESS,
      title: card.summary,
      message: card.detail?.split('\n')[0] ?? card.summary,
      clinicalContext: card.medicalBasis?.label ?? 'Guideline-anchored review',
      actionRequired: card.indicator === 'critical',
      actions: [],
      suppressible: card.indicator !== 'critical',
      evidenceBasis: card.medicalBasis?.rationale ?? '',
    }));
}

/**
 * Resolves primary medical basis from response or scenario seed.
 */
export function resolveMedicalBasis(
  card: DemoCdsCard | undefined,
  scenario: DemoScenario,
): MedicalBasis {
  return card?.medicalBasis ?? scenario.medicalBasis;
}

function tierToIndicator(tier: DemoExpectedTier): CDSCard['indicator'] {
  if (tier === 'passive' || tier === 'active_info') return 'info';
  if (tier === 'warning') return 'warning';
  return 'critical';
}

function tierToScore(tier: DemoExpectedTier): number {
  if (tier === 'passive' || tier === 'active_info') return 8;
  if (tier === 'warning') return 3;
  return 2;
}

function scoreCategory(score: number): string {
  if (score >= 7) return 'Appropriate';
  if (score >= 4) return 'May be appropriate';
  return 'Not appropriate';
}

function scoreEmoji(score: number): string {
  if (score >= 7) return '✅';
  if (score >= 4) return '⚠️';
  return '🔴';
}

/**
 * Synthesizes a spec-valid CDS Hooks response when the live endpoint is unreachable.
 *
 * @param scenario - Active demo scenario.
 * @param hook - CDS hook that triggered the request.
 */
export function buildLocalCdsResponse(
  scenario: DemoScenario,
  hook: 'order-select' | 'order-sign',
): CDSHookResponse {
  const score = tierToScore(scenario.expectedTier);
  const indicator = tierToIndicator(scenario.expectedTier);
  const modality = scenario.modality;
  const indication = scenario.chiefComplaint;
  const emoji = scoreEmoji(score);
  const category = scoreCategory(score);
  const basis = scenario.medicalBasis;

  const summary =
    score >= 7
      ? `${modality} for ${indication}: Appropriate (score ${score}).`
      : score >= 4
        ? `${modality} may be appropriate (score ${score}). Consider alternatives.`
        : `${modality} may not be appropriate (score ${score}). Consider alternatives or non-imaging workup.`;
  const truncatedSummary = summary.length > 140 ? summary.slice(0, 137) + '...' : summary;

  const shapWithRationales = resolveShapRows(undefined, scenario);
  const shapBlock = shapWithRationales
    .map((row) => {
      const dir = row.contribution > 0 ? '+' : '';
      return `- **${row.label}**: ${dir}${row.contribution.toFixed(2)}`;
    })
    .join('\n');

  const detail = [
    `**Guideline basis:** ${basis.label}`,
    basis.rationale,
    '',
    `**Score:** ${score} ${emoji} — ${category}`,
    '',
    '**Top factors (SHAP):**',
    shapBlock || 'No factor details available.',
    '',
    `**Rationale:** ${indication}. Cached scenario response (${hook}; CDS endpoint unreachable).`,
    '',
    FDA_NON_DEVICE_CDS_DISCLOSURE,
  ].join('\n');

  const card: DemoCdsCard = {
    uuid: `demo-local-${scenario.id}-${hook}`,
    summary: truncatedSummary,
    detail,
    indicator,
    source: {
      label: basis.label,
      url: basis.url ?? routes.clin,
    },
    medicalBasis: basis,
    extension: { shapWithRationales },
  };

  return { cards: [card] };
}
