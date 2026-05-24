/**
 * @file demo-response.ts
 * @description Maps CDS Hooks API responses to sidebar / chart state for the live demo.
 */

import { FEATURE_CATALOG } from '@/lib/cds-platform/ml/feature-catalog';
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';
import type { MLPrediction, SHAPFeatureContribution } from '@/lib/cds-platform/ml/types';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import { AlertCategory, AlertTierEnum } from '@/lib/cds-platform/alerting/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { CDSCard } from '@/lib/types/cds-hooks';
import type { DemoScenario } from './scenarios';

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
function mapApiShapRows(rows: ApiShapRow[]): ShapRowWithRationale[] {
  return rows.slice(0, 5).map((row) => ({
    label: row.label,
    contribution: row.contribution,
    rationale: row.rationale,
    citationId: row.citationId,
    citationUrl: row.citationUrl,
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
      citationUrl: durationEntry.url,
      citationLabel: 'ACR §3',
    });
  }

  const noRedFlags = scenario.redFlags.every((r) => !r.present);
  if (noRedFlags && redFlagEntry) {
    rows.push({
      label: 'No red flags',
      contribution: -0.8,
      rationale: redFlagEntry.rationale.slice(0, 100) + '…',
      citationId: redFlagEntry.citationId,
      citationUrl: redFlagEntry.url,
      citationLabel: 'ACR §2',
    });
  }

  if (ageEntry) {
    rows.push({
      label: `Age ${scenario.age}, ${scenario.sex === 'Male' ? 'M' : 'F'}`,
      contribution: 0.2,
      rationale: ageEntry.rationale.slice(0, 90) + '…',
      citationId: ageEntry.citationId,
      citationUrl: ageEntry.url,
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
