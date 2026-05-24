/**
 * @file order-sign.ts
 * @description POST handler for the order-sign hook. Invoked when a clinician signs an order.
 *   Same pipeline as order-select but with definitive language, override reasons, and documentation suggestion.
 */

import type { CDSHooksRequest, CDSHooksResponse, CDSCard, CDSSuggestion } from './types';
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
import { XGBoostClient, DEFAULT_ML_SERVICE_URL } from '@/lib/cds-platform/ml/xgboost-client';
import { runTieredEngine } from '@/lib/cds-platform/alerting/tiered-engine';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { FHIRServiceRequest } from '@/lib/cds-platform/fhir/resources';
import { checkPregnancy, extractEGFR } from '@/lib/cds-platform/fhir/mappers';
import { v4 as uuidv4 } from 'uuid';

function emptyBundle(): { resourceType: 'Bundle'; type: string; entry: unknown[] } {
  return { resourceType: 'Bundle', type: 'searchset', entry: [] };
}

async function resolvePrefetch(request: CDSHooksRequest): Promise<PrefetchData | null> {
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

function getSafetyWarnings(prefetch: PrefetchData, scenario: ClinicalScenario): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  const pregnancy = checkPregnancy(prefetch.activeConditions, prefetch.relevantLabs);
  if (pregnancy === 'pregnant' && scenario.proposedImaging?.modality) {
    const mod = String(scenario.proposedImaging.modality).toLowerCase();
    if (mod.includes('ct') || mod.includes('x-ray') || mod.includes('nuclear') || mod.includes('pet')) {
      warnings.push({
        code: 'PREGNANCY_RADIATION',
        summary: 'Patient may be pregnant; imaging involves radiation.',
        detail: 'Consider pregnancy status before proceeding. Use appropriate shielding or alternative when indicated.',
      });
    }
  }
  if (scenario.contrastAllergy) {
    warnings.push({
      code: 'CONTRAST_ALLERGY',
      summary: 'Contrast allergy documented.',
      detail: 'Verify contrast is not contraindicated. Consider premedication or alternative modality.',
    });
  }
  const eGFR = extractEGFR(prefetch.relevantLabs);
  if (eGFR && eGFR.value < 60 && scenario.proposedImaging?.modality) {
    const mod = String(scenario.proposedImaging.modality).toLowerCase();
    if (mod.includes('contrast')) {
      warnings.push({
        code: 'RENAL_IMPAIRMENT',
        summary: 'Reduced kidney function; contrast may pose risk.',
        detail: `eGFR ${eGFR.value}. Consider hydration and metformin hold per protocol.`,
      });
    }
  }
  return warnings;
}

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

/** Add suggestion to document override justification (DocumentReference) for critical cards. */
function addOverrideDocumentSuggestion(card: CDSCard, patientId: string): void {
  const docRef = {
    resourceType: 'DocumentReference',
    status: 'current',
    type: {
      coding: [{ system: 'http://snomed.info/sct', code: '37353009', display: 'Imaging appropriateness override' }],
    },
    subject: { reference: `Patient/${patientId}` },
    description: 'Override justification for imaging appropriateness alert',
    content: [{ attachment: { contentType: 'text/plain', data: '[Document override reason and clinical justification here.]' } }],
  };
  const suggestion: CDSSuggestion = {
    label: 'Document override justification',
    uuid: uuidv4(),
    isRecommended: false,
    actions: [{ type: 'create' as const, description: 'Create DocumentReference with override justification', resource: docRef }],
  };
  card.suggestions = [...(card.suggestions ?? []), suggestion];
}

/**
 * Handles the order-sign CDS Hook request.
 * Same flow as order-select with: definitive language, overrideReasons, evidence links,
 * and for critical alerts a suggestion to create DocumentReference with override justification.
 */
export async function handleOrderSign(request: CDSHooksRequest): Promise<CDSHooksResponse> {
  const draftOrders = request.context?.draftOrders as { entry?: Array<{ resource?: FHIRServiceRequest }> } | undefined;
  const imagingOrders = getImagingDraftOrders(draftOrders as Parameters<typeof getImagingDraftOrders>[0]);
  if (imagingOrders.length === 0) {
    return { cards: [buildNoRecommendationsCard()] };
  }

  const prefetch = await resolvePrefetch(request);
  if (!prefetch) {
    return { cards: [] };
  }

  const mlClient = new XGBoostClient({
    baseUrl: typeof process !== 'undefined' ? process.env?.ML_SERVICE_URL ?? DEFAULT_ML_SERVICE_URL : DEFAULT_ML_SERVICE_URL,
    timeout: 10000,
  });

  const cards: CDSHooksResponse['cards'] = [];
  const patientId = request.context?.patientId ?? '';

  for (const draftOrder of imagingOrders) {
    const scenario = mapPrefetchToClinicalScenario(prefetch, draftOrder);
    let prediction: Awaited<ReturnType<XGBoostClient['predict']>>;
    try {
      prediction = await mlClient.predict(scenario as ClinicalScenario);
    } catch {
      continue;
    }
    runTieredEngine({ score: prediction.score, scenarioSummary: { modality: scenario.proposedImaging?.modality } });
    const card = buildAppropriatenessCard(prediction, scenario as ClinicalScenario, 'order-sign');
    const alternatives = getAlternatives(scenario as ClinicalScenario);
    if (alternatives.length > 0 && patientId) {
      card.suggestions = buildAlternativesSuggestions(alternatives, patientId);
    }
    // FDA Criterion 3: critical indicator is a styling cue only. No structural blocking — CDS Hooks has no block primitive and we will not add one.
    if (card.indicator === 'critical' && patientId) {
      addOverrideDocumentSuggestion(card, patientId);
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
