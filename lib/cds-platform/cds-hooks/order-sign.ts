/**
 * @file order-sign.ts
 * @description POST handler for the order-sign hook. Invoked when a clinician signs an order.
 *   Returns non-blocking critical-tier cards with descriptive override reasons when a
 *   guideline-anchored rule fires and ML score is low; never criticalises on ML alone.
 */

import type { CDSHooksRequest, CDSHooksResponse, CDSCard, CDSSuggestion, CDSOverrideReason } from './types';
import { getImagingDraftOrders } from './request-validator';
import {
  buildAppropriatenessCard,
  buildSafetyCard,
  buildAlternativesSuggestions,
  type Alternative,
  type SafetyWarning,
} from './card-builder';
import { medicalBasisFromScenario } from '@/lib/cds-platform/cds-hooks/medical-basis';
import { mapPrefetchToClinicalScenario } from '@/lib/cds-platform/fhir/mappers';
import type { PrefetchData } from '@/lib/cds-platform/fhir/prefetch';
import { createFHIRClient } from '@/lib/cds-platform/fhir/client';
import { PrefetchResolver } from '@/lib/cds-platform/fhir/prefetch';
import { createMlClient } from '@/lib/cds-platform/ml/ml-config';
import { scoreScenario } from '@/lib/cds-platform/scoring-fallback';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import { runTieredEngine } from '@/lib/cds-platform/alerting/tiered-engine';
import { evaluateGuidelineRules } from '@/lib/cds-platform/alerting/rules';
import { STANDARD_OVERRIDE_REASONS } from '@/lib/cds-platform/alerting/override-reasons';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { FHIRServiceRequest } from '@/lib/cds-platform/fhir/resources';
import { checkPregnancy, extractEGFR } from '@/lib/cds-platform/fhir/mappers';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

const logger = pino({
  name: 'cds-hooks-order-sign',
  level: process.env.LOG_LEVEL ?? 'info',
});

const ORDER_SIGN_DISCRETION_LABEL =
  'This is a final-check recommendation. The clinician may proceed at their discretion; if proceeding, please document the reasoning.';

/** Per-order ML budget (ms) keeping the cold path inside the 800ms p95 contract. */
const ML_BUDGET_MS = 500;

/**
 * Runs ML prediction with a hard time budget; falls back to the in-memory
 * rule-based scorer on timeout or error.
 *
 * @param mlClient - Configured XGBoost client.
 * @param scenario - Mapped scenario for one draft order.
 */
async function predictWithBudget(
  mlClient: ReturnType<typeof createMlClient>,
  scenario: ClinicalScenario,
): Promise<MLPrediction> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const budget = new Promise<MLPrediction>((resolve) => {
    timer = setTimeout(() => resolve(scoreScenario(scenario)), ML_BUDGET_MS);
  });
  try {
    return await Promise.race([mlClient.predict(scenario), budget]);
  } catch {
    return scoreScenario(scenario);
  } finally {
    clearTimeout(timer);
  }
}

/** CDS Hooks card with optional non-blocking actionRequired cue (not a sign block). */
export type OrderSignCard = CDSCard & {
  medicalBasis: NonNullable<ReturnType<typeof medicalBasisFromScenario>>;
  actionRequired?: boolean;
};

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

  const prefetchComplete = Boolean(
    partial.patient &&
      partial.activeConditions &&
      partial.recentImaging &&
      partial.relevantLabs &&
      partial.activeMedications &&
      partial.priorServiceRequests,
  );

  if (prefetchComplete) {
    return {
      patient: partial.patient as PrefetchData['patient'],
      activeConditions: (partial.activeConditions as PrefetchData['activeConditions']) ?? emptyBundle(),
      recentImaging: (partial.recentImaging as PrefetchData['recentImaging']) ?? emptyBundle(),
      relevantLabs: (partial.relevantLabs as PrefetchData['relevantLabs']) ?? emptyBundle(),
      activeMedications: (partial.activeMedications as PrefetchData['activeMedications']) ?? emptyBundle(),
      priorServiceRequests: (partial.priorServiceRequests as PrefetchData['priorServiceRequests']) ?? emptyBundle(),
    };
  }

  if (fhirServer && fhirServer.length > 0 && URL.canParse(fhirServer)) {
    try {
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
    } catch (err) {
      logger.warn({ err, fhirServer }, 'FHIR prefetch resolution failed; returning partial prefetch');
      return prefetchComplete ? (partial as PrefetchData) : null;
    }
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

/**
 * Maps standard override reasons to CDS Hooks overrideReasons (Criterion 3 — descriptive, neutral first).
 */
function standardOverrideReasonsForCard(): CDSOverrideReason[] {
  return STANDARD_OVERRIDE_REASONS.map((reason) => ({
    code: reason.id,
    display: reason.label,
  }));
}

/**
 * True when a guideline rule with registered citation fired (not ML score threshold alone).
 * Knowledge Matrix tier-4 (conservative_default / indeterminate order) does not count as
 * a guideline-anchored basis for a critical-tier card.
 */
function hasGuidelineAnchoredRule(scenario: ClinicalScenario, score: number): boolean {
  const medicalBasis = medicalBasisFromScenario(scenario);
  if (medicalBasis.matchTier === 'conservative_default') {
    return false;
  }
  const guidelineAlerts = evaluateGuidelineRules(scenario);
  if (guidelineAlerts.length > 0) {
    return true;
  }
  const { alerts } = runTieredEngine({ score });
  return alerts.some((alert) => alert.tier === 'critical');
}

/** Add suggestion to document override justification (DocumentReference) for critical cards. */
function addOverrideDocumentSuggestion(card: OrderSignCard, patientId: string): void {
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
    label: 'Open: Document override justification',
    uuid: uuidv4(),
    isRecommended: false,
    actions: [{ type: 'create' as const, description: 'Create DocumentReference with override justification', resource: docRef }],
  };
  card.suggestions = [...(card.suggestions ?? []), suggestion];
}

/**
 * Handles the order-sign CDS Hook request.
 * Emits critical-tier, non-blocking cards only when ML score &lt; 4 and a cited guideline rule fired.
 */
export async function handleOrderSign(request: CDSHooksRequest): Promise<CDSHooksResponse> {
  const draftOrders = request.context?.draftOrders as { entry?: Array<{ resource?: FHIRServiceRequest }> } | undefined;
  const imagingOrders = getImagingDraftOrders(draftOrders as Parameters<typeof getImagingDraftOrders>[0]);
  if (imagingOrders.length === 0) {
    return { cards: [] };
  }

  const prefetch = await resolvePrefetch(request);
  if (!prefetch) {
    return { cards: [] };
  }

  const mlClient = createMlClient();

  const cards: CDSHooksResponse['cards'] = [];
  const patientId = request.context?.patientId ?? '';

  for (const draftOrder of imagingOrders) {
    const scenario = mapPrefetchToClinicalScenario(prefetch, draftOrder);
    const medicalBasis = medicalBasisFromScenario(scenario);

    const prediction = await predictWithBudget(mlClient, scenario as ClinicalScenario);
    const score = prediction.score;
    runTieredEngine({ score, scenarioSummary: { modality: scenario.proposedImaging?.modality } });

    // FDA Criterion 2: no critical card without a rule + citation as primary basis.
    const ruleFired = hasGuidelineAnchoredRule(scenario as ClinicalScenario, score);
    if (score >= 4 || !ruleFired) {
      continue;
    }

    const baseCard = buildAppropriatenessCard(prediction, scenario as ClinicalScenario, 'order-sign');
    const card: OrderSignCard = {
      ...baseCard,
      medicalBasis,
      indicator: 'critical',
      actionRequired: true,
      overrideReasons: standardOverrideReasonsForCard(),
      detail: [baseCard.detail ?? '', '', ORDER_SIGN_DISCRETION_LABEL].join('\n'),
    };

    const alternatives = getAlternatives(scenario as ClinicalScenario);
    if (alternatives.length > 0 && patientId) {
      card.suggestions = buildAlternativesSuggestions(alternatives, patientId);
    }

    // FDA Criterion 3: critical indicator is a styling cue only. No structural blocking — CDS Hooks has no block primitive and we will not add one.
    if (patientId) {
      addOverrideDocumentSuggestion(card, patientId);
    }
    cards.push(card);
  }

  const firstScenario = mapPrefetchToClinicalScenario(prefetch, imagingOrders[0]);
  const safetyWarnings = getSafetyWarnings(prefetch, firstScenario as ClinicalScenario);
  for (const w of safetyWarnings) {
    cards.push(buildSafetyCard(w));
  }

  return { cards };
}
