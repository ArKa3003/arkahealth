/**
 * @file order-select.ts
 * @description POST handler for the order-select hook. Invoked when a clinician selects an
 *   imaging order. Resolves prefetch, builds ClinicalScenario, runs ML and alerting, returns cards.
 */

import pino from 'pino';
import type { CDSHooksRequest, CDSHooksResponse } from './types';
import { getFeatureCatalogEntry } from '@/lib/cds-platform/ml/feature-catalog';
import type { WeightDirection } from '@/lib/cds-platform/ml/feature-catalog';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import { getImagingDraftOrders } from './request-validator';
import {
  buildAppropriatenessCard,
  buildSafetyCard,
  buildAlternativesSuggestions,
  buildNoRecommendationsCard,
  type Alternative,
  type SafetyWarning,
} from './card-builder';
import { mapPrefetchToClinicalScenario } from '@/lib/cds-platform/fhir/mappers';
import type { PrefetchData } from '@/lib/cds-platform/fhir/prefetch';
import { createFHIRClient } from '@/lib/cds-platform/fhir/client';
import { PrefetchResolver } from '@/lib/cds-platform/fhir/prefetch';
import { createMlClient } from '@/lib/cds-platform/ml/ml-config';
import { runTieredEngine } from '@/lib/cds-platform/alerting/tiered-engine';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { FHIRServiceRequest } from '@/lib/cds-platform/fhir/resources';
import {
  checkPregnancy,
  extractEGFR,
} from '@/lib/cds-platform/fhir/mappers';

const logger = pino({
  name: 'cds-hooks-order-select',
  level: process.env.LOG_LEVEL ?? 'info',
});

/** SHAP row with FDA Criterion 4 catalogue rationale (Phase 6.3 wire format). */
export interface ShapWithRationale {
  feature: string;
  label: string;
  contribution: number;
  rationale: string;
  citationId: string;
  citationUrl: string;
  weightDirection: WeightDirection;
}

type AppropriatenessCard = ReturnType<typeof buildAppropriatenessCard> & {
  extension?: { shapWithRationales: ShapWithRationale[] };
};

/**
 * Maps ML SHAP contributions to catalogue-backed rationale rows (top 5).
 * Suppresses features without a catalogue entry (Criterion 4 invariant).
 */
function buildShapWithRationales(prediction: MLPrediction): ShapWithRationale[] {
  const contribs = prediction.shapValues?.featureContributions ?? [];
  return contribs
    .map(({ feature: name, shapValue: value }) => {
      const entry = getFeatureCatalogEntry(name);
      if (!entry) return null;
      return {
        feature: name,
        label: entry.label,
        contribution: value,
        rationale: entry.rationale,
        citationId: entry.citationId,
        citationUrl: entry.url,
        weightDirection: entry.weightDirection,
      };
    })
    .filter((row): row is ShapWithRationale => row !== null)
    .slice(0, 5);
}

function emptyBundle(): { resourceType: 'Bundle'; type: string; entry: unknown[] } {
  return { resourceType: 'Bundle', type: 'searchset', entry: [] };
}

/** Build PrefetchData from request prefetch and optional FHIR fetch. */
async function resolvePrefetch(
  request: CDSHooksRequest
): Promise<PrefetchData | null> {
  const context = request.context;
  const fhirServer = request.fhirServer;
  const auth = request.fhirAuthorization;
  const prefetch = request.prefetch as Record<string, unknown> | undefined;

  const partial: Partial<PrefetchData> = {};
  if (prefetch) {
    if (prefetch.patient && typeof prefetch.patient === 'object') partial.patient = prefetch.patient as PrefetchData['patient'];
    if (prefetch.activeConditions) partial.activeConditions = prefetch.activeConditions as PrefetchData['activeConditions'];
    if (prefetch.recentImaging) partial.recentImaging = prefetch.recentImaging as PrefetchData['recentImaging'];
    if (prefetch.relevantLabs) partial.relevantLabs = prefetch.relevantLabs as PrefetchData['relevantLabs'];
    if (prefetch.activeMedications) partial.activeMedications = prefetch.activeMedications as PrefetchData['activeMedications'];
    if (prefetch.priorServiceRequests) partial.priorServiceRequests = prefetch.priorServiceRequests as PrefetchData['priorServiceRequests'];
  }

  if (fhirServer) {
    const client = createFHIRClient({
      baseUrl: fhirServer,
      accessToken: auth?.access_token,
      timeout: 15000,
    });
    const resolver = new PrefetchResolver(client);
    if (partial.patient || Object.keys(partial).length > 0) {
      return resolver.resolveMissing(partial as Partial<PrefetchData>, context as Parameters<PrefetchResolver['resolveMissing']>[1]);
    }
    return resolver.resolveTemplates(context as Parameters<PrefetchResolver['resolveTemplates']>[0]);
  }

  if (!partial.patient || (partial.patient as { resourceType?: string })?.resourceType !== 'Patient') {
    return null;
  }
  return {
    patient: partial.patient,
    activeConditions: (partial.activeConditions as PrefetchData['activeConditions']) ?? emptyBundle(),
    recentImaging: (partial.recentImaging as PrefetchData['recentImaging']) ?? emptyBundle(),
    relevantLabs: (partial.relevantLabs as PrefetchData['relevantLabs']) ?? emptyBundle(),
    activeMedications: (partial.activeMedications as PrefetchData['activeMedications']) ?? emptyBundle(),
    priorServiceRequests: (partial.priorServiceRequests as PrefetchData['priorServiceRequests']) ?? emptyBundle(),
  };
}

/** Build safety warnings from scenario/prefetch. */
function getSafetyWarnings(prefetch: PrefetchData, scenario: ClinicalScenario): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  const pregnancy = checkPregnancy(prefetch.activeConditions, prefetch.relevantLabs);
  if (pregnancy === 'pregnant' && scenario.proposedImaging?.modality) {
    const mod = String(scenario.proposedImaging.modality).toLowerCase();
    if (mod.includes('ct') || mod.includes('x-ray') || mod.includes('nuclear') || mod.includes('pet')) {
      warnings.push({
        code: 'PREGNANCY_RADIATION',
        summary: 'Patient may be pregnant; imaging involves radiation.',
        detail: 'Consider pregnancy status before proceeding with CT, X-ray, or nuclear imaging. Use appropriate shielding or alternative (e.g. MRI, ultrasound) when indicated.',
      });
    }
  }
  if (scenario.contrastAllergy) {
    warnings.push({
      code: 'CONTRAST_ALLERGY',
      summary: 'Contrast allergy or reaction documented.',
      detail: 'Verify contrast is not contraindicated. Consider premedication or alternative modality without contrast.',
    });
  }
  const eGFR = extractEGFR(prefetch.relevantLabs);
  if (eGFR && eGFR.value < 60 && scenario.proposedImaging?.modality) {
    const mod = String(scenario.proposedImaging.modality).toLowerCase();
    if (mod.includes('contrast')) {
      warnings.push({
        code: 'RENAL_IMPAIRMENT',
        summary: 'Reduced kidney function; contrast may pose risk.',
        detail: `eGFR ${eGFR.value} (date: ${eGFR.date}). Consider hydration and metformin hold per protocol when using contrast.`,
      });
    }
  }
  return warnings;
}

/** Build a minimal list of alternatives (e.g. from modality). */
function getAlternatives(scenario: ClinicalScenario): Alternative[] {
  const modality = scenario.proposedImaging?.modality;
  const bodyPart = scenario.proposedImaging?.bodyPart;
  const alternatives: Alternative[] = [];
  if (modality && /CT|MRI|Ultrasound|X-ray/i.test(String(modality))) {
    if (!/Ultrasound/i.test(String(modality))) {
      alternatives.push({ modality: 'Ultrasound', bodyPart: bodyPart as string, display: `Order Ultrasound${bodyPart ? ` (${bodyPart})` : ''} instead` });
    }
    if (!/MRI/i.test(String(modality)) && !/CT/i.test(String(modality))) {
      alternatives.push({ modality: 'MRI', bodyPart: bodyPart as string, display: `Order MRI${bodyPart ? ` (${bodyPart})` : ''} instead` });
    }
  }
  return alternatives.slice(0, 3);
}

/**
 * Handles the order-select CDS Hook request.
 * Validates request, resolves prefetch/FHIR data, maps to ClinicalScenario, runs ML scoring
 * and tiered alerting, then returns CDS cards.
 */
export async function handleOrderSelect(request: CDSHooksRequest): Promise<CDSHooksResponse> {
  const draftOrders = request.context?.draftOrders as { entry?: Array<{ resource?: FHIRServiceRequest }> } | undefined;
  const imagingOrders = getImagingDraftOrders(draftOrders as Parameters<typeof getImagingDraftOrders>[0]);
  if (imagingOrders.length === 0) {
    return { cards: [buildNoRecommendationsCard()] };
  }

  const prefetch = await resolvePrefetch(request);
  if (!prefetch) {
    return { cards: [] };
  }

  const mlClient = createMlClient();

  const cards: CDSHooksResponse['cards'] = [];

  for (const draftOrder of imagingOrders) {
    const scenario = mapPrefetchToClinicalScenario(prefetch, draftOrder);
    let prediction: Awaited<ReturnType<ReturnType<typeof createMlClient>['predict']>>;
    try {
      prediction = await mlClient.predict(scenario as ClinicalScenario);
    } catch {
      continue;
    }
    runTieredEngine({ score: prediction.score, scenarioSummary: { modality: scenario.proposedImaging?.modality } });
    const card = buildAppropriatenessCard(prediction, scenario as ClinicalScenario, 'order-select');
    const shapWithRationales = buildShapWithRationales(prediction);
    if (shapWithRationales.length > 0) {
      (card as AppropriatenessCard).extension = { shapWithRationales };
    } else {
      logger.info(
        {
          hook: 'order-select',
          usedFallback: prediction.usedFallback,
          contributionCount: prediction.shapValues?.featureContributions?.length ?? 0,
        },
        'TODO(fda-criterion-4): shapWithRationales empty — omitting extension; card basis remains guideline',
      );
    }
    const alternatives = getAlternatives(scenario as ClinicalScenario);
    if (alternatives.length > 0 && request.context?.patientId) {
      card.suggestions = buildAlternativesSuggestions(alternatives, request.context.patientId);
    }
    cards.push(card);
  }

  const firstScenario = mapPrefetchToClinicalScenario(prefetch, imagingOrders[0]);
  const safetyWarnings = getSafetyWarnings(prefetch, firstScenario as ClinicalScenario);
  for (const w of safetyWarnings) {
    cards.push(buildSafetyCard(w));
  }

  if (cards.length === 0) {
    return { cards: [buildNoRecommendationsCard()] };
  }
  return { cards };
}
