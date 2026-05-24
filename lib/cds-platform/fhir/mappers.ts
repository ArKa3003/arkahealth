/**
 * @file mappers.ts
 * @description Maps FHIR R4 resources to the application's ClinicalScenario type used by the
 *   scoring engine and ML pipeline. Normalizes codes (SNOMED, ICD-10-CM, CPT, LOINC) and dates.
 */

import pino from 'pino';
import type { ClinicalScenario, PriorImaging } from '@/lib/cds-platform/types';
import type { PrefetchData } from './prefetch';
import type {
  FHIRPatient,
  FHIRCondition,
  FHIRServiceRequest,
  FHIRImagingStudy,
  FHIRObservation,
  FHIRMedicationRequest,
  FHIRBundle,
  Coding,
  CodeableConcept,
} from './resources';
import {
  mapFHIRModalityToInternal,
  mapFHIRBodySiteToInternal,
  RED_FLAG_CODES,
  LAB_CODES,
  MEDICATION_CODES,
  type ImagingModality,
} from './code-systems';
import { parseDurationToDays, daysSince } from './duration-parser';

// -----------------------------------------------------------------------------
// Logger
// -----------------------------------------------------------------------------

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
}).child({ module: 'fhir/mappers' });

// -----------------------------------------------------------------------------
// Bundle helpers
// -----------------------------------------------------------------------------

function getBundleResources<T>(bundle: FHIRBundle<T> | null | undefined): T[] {
  if (!bundle?.entry?.length) return [];
  return bundle.entry
    .map((e) => e?.resource)
    .filter((r): r is T => r != null);
}

/** Get first display or code from CodeableConcept, preferring SNOMED then ICD-10 then CPT. */
function getDisplayFromCodeableConcept(cc: CodeableConcept | null | undefined): string | undefined {
  if (!cc?.coding?.length) return cc?.text?.trim() || undefined;
  const snomed = cc.coding.find((c) => c.system?.toLowerCase().includes('snomed'));
  if (snomed?.display) return snomed.display.trim();
  const icd = cc.coding.find((c) => c.system?.toLowerCase().includes('icd'));
  if (icd?.display) return icd.display.trim();
  const cpt = cc.coding.find((c) => c.system?.toLowerCase().includes('cpt'));
  if (cpt?.display) return cpt.display.trim();
  const first = cc.coding.find((c) => c.display);
  return first?.display?.trim() ?? first?.code ?? undefined;
}

/** Get all codings from a CodeableConcept (or array of them) for code lookups. */
function getCodings(cc: CodeableConcept | CodeableConcept[] | null | undefined): Coding[] {
  if (!cc) return [];
  const list = Array.isArray(cc) ? cc : [cc];
  const out: Coding[] = [];
  for (const c of list) {
    if (c?.coding) out.push(...c.coding);
  }
  return out;
}

/** Resolve a reference like "Condition/123" to id part. */
function referenceToId(ref: { reference?: string } | null | undefined): string | null {
  const r = ref?.reference?.trim();
  if (!r) return null;
  const slash = r.lastIndexOf('/');
  return slash >= 0 ? r.slice(slash + 1) : r;
}

// -----------------------------------------------------------------------------
// Exported helpers: demographics
// -----------------------------------------------------------------------------

/**
 * Extract age in years from Patient.birthDate. Handles missing birthDate gracefully.
 */
export function extractAge(patient: FHIRPatient | null | undefined): number | undefined {
  if (!patient?.birthDate) {
    logger.debug({ patientId: patient?.id }, 'Missing birthDate for age calculation');
    return undefined;
  }
  const birth = new Date(patient.birthDate);
  if (Number.isNaN(birth.getTime())) {
    logger.debug({ birthDate: patient.birthDate }, 'Invalid birthDate for age calculation');
    return undefined;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  logger.debug({ patientId: patient?.id, birthDate: patient.birthDate, age }, 'Extracted age');
  return age >= 0 ? age : undefined;
}

/**
 * Map Patient.gender to ClinicalScenario sex.
 */
export function extractGender(patient: FHIRPatient | null | undefined): 'Male' | 'Female' | 'Other' {
  const g = patient?.gender?.toLowerCase();
  if (g === 'male') return 'Male';
  if (g === 'female') return 'Female';
  if (g === 'other' || g === 'unknown') return 'Other';
  logger.debug({ patientId: patient?.id, gender: patient?.gender }, 'Unmapped gender, defaulting to Other');
  return 'Other';
}

// -----------------------------------------------------------------------------
// Exported helpers: conditions
// -----------------------------------------------------------------------------

/**
 * Extract condition names (code.text or coding[0].display) from a bundle of Conditions.
 */
export function extractConditionNames(conditions: FHIRBundle<FHIRCondition> | null | undefined): string[] {
  const list = getBundleResources(conditions ?? null);
  const names: string[] = [];
  for (const c of list) {
    const name = c?.code?.text?.trim() || getDisplayFromCodeableConcept(c?.code);
    if (name) names.push(name);
  }
  return names;
}

/** Check if a code (system + code) matches cancer: ICD-10 C00-C97 or SNOMED malignant neoplasm. */
function isCancerCode(system: string | undefined, code: string | undefined): boolean {
  if (!code) return false;
  const sys = (system ?? '').toLowerCase();
  const c = code.trim();
  if (sys.includes('icd')) {
    const match = /^[Cc](\d{2})/.exec(c);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 0 && num <= 97) return true;
    }
  }
  if (sys.includes('snomed')) {
    const cancerSnomed = ['109355002', '363346000', '93974005']; // malignant neoplasm, malignant tumor, cancer
    if (cancerSnomed.includes(c)) return true;
    if (c.startsWith('109355') || c.startsWith('363346')) return true;
  }
  return false;
}

/** Check if condition code indicates neurological finding. */
function isNeurologicalCode(system: string | undefined, code: string | undefined): boolean {
  if (!code) return false;
  const sys = (system ?? '').toLowerCase();
  if (!sys.includes('snomed')) return false;
  const neuroSnomed = ['230572002', '102957003', '268646009']; // neurological finding, etc.
  return neuroSnomed.includes(code.trim());
}

/** LOINC for body temperature (for fever check). */
const LOINC_TEMP = ['8310-5', '8331-1', '8332-9', '11288-0'];
const LOINC_SYSTEM = 'http://loinc.org';

/**
 * Find red flags from active conditions and observations (e.g. fever).
 */
export function findRedFlags(
  conditions: FHIRBundle<FHIRCondition> | null | undefined,
  observations: FHIRBundle<FHIRObservation> | null | undefined
): Array<{ flag: string; present: boolean }> {
  const conditionList = getBundleResources(conditions ?? null);
  const obsList = getBundleResources(observations ?? null);

  const results: Array<{ flag: string; present: boolean }> = [];
  const flagNames = Object.keys(RED_FLAG_CODES);

  for (const flagName of flagNames) {
    let present = false;

    if (flagName === 'Cancer history') {
      present = conditionList.some((c) => {
        const codings = getCodings(c?.code);
        return codings.some((x) => isCancerCode(x.system, x.code));
      });
    } else if (flagName === 'Neurological deficit') {
      present = conditionList.some((c) => {
        const codings = getCodings(c?.code);
        return codings.some((x) => isNeurologicalCode(x.system, x.code));
      });
    } else if (flagName === 'Fever with back pain') {
      const feverFromObs = obsList.some((o) => {
        const code = o?.code?.coding?.find((c) => c.system === LOINC_SYSTEM && LOINC_TEMP.includes(c.code ?? ''));
        if (!code) return false;
        const v = o?.valueQuantity?.value;
        return typeof v === 'number' && v > 38.0;
      });
      const feverFromCond = conditionList.some((c) => {
        const rf = RED_FLAG_CODES['Fever with back pain'];
        return getCodings(c?.code).some((x) => x.system?.includes('snomed') && x.code === rf?.code);
      });
      present = feverFromObs || feverFromCond;
    } else {
      const redFlagEntry = RED_FLAG_CODES[flagName];
      const snomedCode = redFlagEntry?.code;
      if (snomedCode) {
        present = conditionList.some((c) =>
          getCodings(c?.code).some((x) => x.system?.toLowerCase().includes('snomed') && x.code === snomedCode)
        );
      }
    }

    results.push({ flag: flagName, present });
    if (present) logger.debug({ flag: flagName }, 'Red flag present');
  }

  return results;
}

// -----------------------------------------------------------------------------
// Exported helpers: labs / safety
// -----------------------------------------------------------------------------

const LOINC_EGFR = ['69405-9', '62238-1', '77147-7'];

/**
 * Find most recent eGFR from observations (LOINC 69405-9, etc.). Returns value and date.
 */
export function extractEGFR(
  observations: FHIRBundle<FHIRObservation> | null | undefined
): { value: number; date: string } | null {
  const list = getBundleResources(observations ?? null);
  let best: { value: number; date: string; effective: string } | null = null;

  for (const o of list) {
    const isEGFR = o?.code?.coding?.some(
      (c) => c.system === LOINC_SYSTEM && LOINC_EGFR.includes(c.code ?? '')
    );
    if (!isEGFR) continue;
    const value = o?.valueQuantity?.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const effective = o?.effectiveDateTime ?? o?.issued ?? '';
    if (!effective) continue;
    if (!best || effective > best.effective) {
      best = { value, date: effective, effective };
    }
  }

  if (!best) {
    logger.debug('No eGFR observation found');
    return null;
  }
  logger.debug({ value: best.value, date: best.date }, 'Extracted eGFR');
  return { value: best.value, date: best.date };
}

/** Pregnancy ICD-10 ranges: Z33, O00-O9A. */
function isPregnancyCode(system: string | undefined, code: string | undefined): boolean {
  if (!code) return false;
  const sys = (system ?? '').toLowerCase();
  if (!sys.includes('icd')) return false;
  const c = code.trim().toUpperCase();
  if (c === 'Z33' || c.startsWith('Z33.')) return true;
  if (/^O\d{2}[A-Z]?/.test(c) || /^O0\d/.test(c)) return true;
  return false;
}

/** Check for positive hCG in observations. */
function hasPositiveHCG(observations: FHIRBundle<FHIRObservation> | null | undefined): boolean {
  const list = getBundleResources(observations ?? null);
  const hcgLoincs = (LAB_CODES['Pregnancy test (hCG)'] ?? []).map((x) => x.code);
  for (const o of list) {
    const isHCG = o?.code?.coding?.some((c) => c.system === LOINC_SYSTEM && hcgLoincs.includes(c.code ?? ''));
    if (!isHCG) continue;
    const val = o?.valueQuantity?.value ?? (o as { valueInteger?: number }).valueInteger;
    if (typeof val === 'number' && val > 0) return true;
    const vc = o?.valueCodeableConcept?.coding?.[0]?.code;
    if (vc === 'POS' || vc === 'positive') return true;
  }
  return false;
}

/**
 * Determine pregnancy status from conditions and labs.
 */
export function checkPregnancy(
  conditions: FHIRBundle<FHIRCondition> | null | undefined,
  observations: FHIRBundle<FHIRObservation> | null | undefined
): 'pregnant' | 'not_pregnant' | 'unknown' {
  const conditionList = getBundleResources(conditions ?? null);
  const pregnancyCondition = conditionList.some((c) =>
    getCodings(c?.code).some((x) => isPregnancyCode(x.system, x.code))
  );
  if (pregnancyCondition) {
    logger.debug('Pregnancy condition found');
    return 'pregnant';
  }
  if (hasPositiveHCG(observations)) {
    logger.debug('Positive hCG lab found');
    return 'pregnant';
  }
  return 'unknown';
}

/** Contrast reaction / allergy SNOMED or ICD codes. */
const CONTRAST_ALLERGY_CODES = new Set([
  '419199007', // Allergy to contrast media
  '410942007', // Drug allergy
  '39579001',  // Anaphylaxis
]);
const CONTRAST_ICD = ['T80.89', 'T88.7', 'T50.8'];

function isContrastAllergyCode(system: string | undefined, code: string | undefined): boolean {
  if (!code) return false;
  const c = code.trim();
  if (system?.toLowerCase().includes('snomed') && CONTRAST_ALLERGY_CODES.has(c)) return true;
  if (system?.toLowerCase().includes('icd')) {
    if (CONTRAST_ICD.some((icd) => c === icd || c.startsWith(icd + '.'))) return true;
  }
  return false;
}

/**
 * Check MedicationRequest bundle for anticoagulant (RxNorm) codes.
 */
export function checkAnticoagulation(
  medications: FHIRBundle<FHIRMedicationRequest> | null | undefined
): boolean {
  const list = getBundleResources(medications ?? null);
  const rxnorms = new Set<string>();
  for (const keys of ['Warfarin', 'Heparin', 'Enoxaparin', 'Rivaroxaban', 'Apixaban', 'Dabigatran'] as const) {
    const arr = MEDICATION_CODES[keys];
    if (arr) for (const m of arr) rxnorms.add(m.rxcui);
  }
  const rxnormSystem = 'http://www.nlm.nih.gov/research/umls/rxnorm';
  for (const mr of list) {
    const codings = getCodings(mr?.medicationCodeableConcept);
    if (codings.some((c) => c.system === rxnormSystem && c.code && rxnorms.has(c.code))) {
      logger.debug('Anticoagulation medication found');
      return true;
    }
  }
  return false;
}

/**
 * Check MedicationRequest bundle for metformin (RxNorm) codes.
 */
export function checkMetformin(
  medications: FHIRBundle<FHIRMedicationRequest> | null | undefined
): boolean {
  const list = getBundleResources(medications ?? null);
  const metforminRx = new Set((MEDICATION_CODES.Metformin ?? []).map((m) => m.rxcui));
  const rxnormSystem = 'http://www.nlm.nih.gov/research/umls/rxnorm';
  for (const mr of list) {
    const codings = getCodings(mr?.medicationCodeableConcept);
    if (codings.some((c) => c.system === rxnormSystem && c.code && metforminRx.has(c.code))) {
      logger.debug('Metformin medication found');
      return true;
    }
  }
  return false;
}

// -----------------------------------------------------------------------------
// Exported helpers: prior imaging
// -----------------------------------------------------------------------------

type UrgencyOption = 'Routine' | 'Urgent' | 'Stat' | 'ASAP';

/** Map urgency from ServiceRequest.priority. */
function mapUrgency(priority: FHIRServiceRequest['priority']): UrgencyOption {
  const p = (priority ?? 'routine').toLowerCase();
  if (p === 'stat') return 'Stat';
  if (p === 'urgent') return 'Urgent';
  if (p === 'asap') return 'ASAP';
  return 'Routine';
}

/**
 * Map ImagingStudy bundle to PriorImaging[], sorted by date (most recent first), limit 10.
 */
export function mapPriorImaging(
  imagingStudies: FHIRBundle<FHIRImagingStudy> | null | undefined
): PriorImaging[] {
  const list = getBundleResources(imagingStudies ?? null);
  const now = new Date();
  const prior: PriorImaging[] = [];

  for (const study of list) {
    const started = study?.started;
    const daysAgo = started ? (daysSince(started, now) ?? 0) : 0;
    const modalityCodings = study?.modality ?? study?.series?.[0]?.modality ? [study.series![0].modality!] : [];
    const modality = mapFHIRModalityToInternal(modalityCodings) ?? undefined;
    const bodySiteCodings = study?.series?.[0]?.bodySite ? [study.series[0].bodySite!] : [];
    const bodyPart = mapFHIRBodySiteToInternal(bodySiteCodings) ?? undefined;
    prior.push({
      modality,
      bodyPart,
      daysAgo,
      studyDescription: study?.description ?? study?.series?.[0]?.description ?? undefined,
    });
  }

  prior.sort((a, b) => a.daysAgo - b.daysAgo);
  const limited = prior.slice(0, 10);
  logger.debug({ count: limited.length }, 'Mapped prior imaging');
  return limited;
}

// -----------------------------------------------------------------------------
// Main: mapPrefetchToClinicalScenario
// -----------------------------------------------------------------------------

/**
 * Resolve ServiceRequest.reasonReference to a Condition from the bundle (by reference id).
 */
function resolveReasonReferenceCondition(
  reasonRef: { reference?: string } | undefined,
  conditions: FHIRCondition[]
): FHIRCondition | null {
  const id = referenceToId(reasonRef);
  if (!id) return null;
  return conditions.find((c) => c.id === id) ?? null;
}

/**
 * Build chief complaint from ServiceRequest: reasonCode[0], then reasonReference→Condition, then code.
 */
function extractChiefComplaint(
  draftOrder: FHIRServiceRequest,
  conditions: FHIRCondition[]
): string | undefined {
  const reasonCode = draftOrder?.reasonCode?.[0];
  if (reasonCode) {
    const text = reasonCode.text?.trim();
    if (text) return text;
    const display = getDisplayFromCodeableConcept(reasonCode);
    if (display) return display;
  }
  const reasonRef = draftOrder?.reasonReference?.[0];
  if (reasonRef) {
    const cond = resolveReasonReferenceCondition(reasonRef, conditions);
    const display = cond ? getDisplayFromCodeableConcept(cond.code) : undefined;
    if (display) return display;
  }
  const codeDisplay = getDisplayFromCodeableConcept(draftOrder?.code);
  if (codeDisplay) return codeDisplay;
  logger.debug('No chief complaint could be extracted from ServiceRequest');
  return undefined;
}

/**
 * Build clinical history string from active conditions (code.text or coding display).
 */
function buildClinicalHistory(conditions: FHIRCondition[]): string {
  const parts = conditions.map((c) => c?.code?.text?.trim() || getDisplayFromCodeableConcept(c?.code)).filter(Boolean);
  return parts.join('; ') || '';
}

/**
 * Extract symptoms from Condition.evidence[].code[].coding[].display.
 */
function extractSymptoms(conditions: FHIRCondition[]): string[] {
  const symptoms: string[] = [];
  for (const c of conditions) {
    for (const ev of c?.evidence ?? []) {
      for (const cc of ev?.code ?? []) {
        const d = getDisplayFromCodeableConcept(cc);
        if (d) symptoms.push(d);
      }
    }
  }
  return [...new Set(symptoms)];
}

/**
 * Derive duration in days from conditions: onsetDateTime (days since onset) or notes parsed via duration-parser.
 */
function extractDuration(conditions: FHIRCondition[]): number | undefined {
  const now = new Date();
  for (const c of conditions) {
    if (c?.onsetDateTime) {
      const days = daysSince(c.onsetDateTime, now);
      if (days != null && days >= 0) {
        logger.debug({ conditionId: c.id, onsetDateTime: c.onsetDateTime, days }, 'Duration from onsetDateTime');
        return days;
      }
    }
    if (c?.onsetString) {
      const days = parseDurationToDays(c.onsetString);
      if (days != null) {
        logger.debug({ conditionId: c.id, onsetString: c.onsetString, days }, 'Duration from onsetString');
        return days;
      }
    }
    for (const note of c?.note ?? []) {
      const days = parseDurationToDays(note?.text);
      if (days != null) {
        logger.debug({ conditionId: c.id, note: note?.text, days }, 'Duration from note');
        return days;
      }
    }
  }
  return undefined;
}

/**
 * Map prefetch data and the draft imaging order to a full ClinicalScenario.
 * This is the critical bridge between FHIR data and the scoring engine.
 */
export function mapPrefetchToClinicalScenario(
  prefetch: PrefetchData,
  draftOrder: FHIRServiceRequest
): ClinicalScenario {
  const patient = prefetch?.patient;
  const conditionList = getBundleResources(prefetch?.activeConditions ?? null);

  const patientId = patient?.id ?? 'unknown';
  const age = extractAge(patient);
  const sex = extractGender(patient);

  const chiefComplaint = extractChiefComplaint(draftOrder, conditionList);
  const clinicalHistory = buildClinicalHistory(conditionList);
  const symptoms = extractSymptoms(conditionList);
  const duration = extractDuration(conditionList);

  const redFlags = findRedFlags(prefetch.activeConditions, prefetch.relevantLabs);

  const pregnancyStatus = checkPregnancy(prefetch.activeConditions, prefetch.relevantLabs);
  let contrastAllergy = false;
  for (const c of conditionList) {
    if (getCodings(c?.code).some((x) => isContrastAllergyCode(x.system, x.code))) {
      contrastAllergy = true;
      break;
    }
  }
  const eGFRResult = extractEGFR(prefetch.relevantLabs);
  const renalFunction = eGFRResult
    ? {
        value: eGFRResult.value,
        date: eGFRResult.date,
        hasImpairment: eGFRResult.value < 60,
      }
    : undefined;
  const medications = {
    onAnticoagulation: checkAnticoagulation(prefetch.activeMedications),
    onMetformin: checkMetformin(prefetch.activeMedications),
  };

  const codeCodings = getCodings(draftOrder?.code);
  const modality = mapFHIRModalityToInternal(codeCodings) ?? undefined;
  if (codeCodings.length > 0 && modality == null) {
    logger.debug(
      { codings: codeCodings.map((c) => ({ system: c.system, code: c.code, display: c.display })) },
      'Unmapped ServiceRequest code (modality); use code-systems for new mappings'
    );
  }
  const bodySiteCodings = (draftOrder?.bodySite ?? [])
    .flatMap((bs) => getCodings(bs))
    .filter(Boolean);
  const bodyPart = mapFHIRBodySiteToInternal(bodySiteCodings) ?? undefined;
  if (bodySiteCodings.length > 0 && bodyPart == null) {
    logger.debug(
      { codings: bodySiteCodings.map((c) => ({ system: c.system, code: c.code, display: c.display })) },
      'Unmapped body site; use code-systems for new mappings'
    );
  }
  const indication =
    draftOrder?.reasonCode?.[0]?.text?.trim() ||
    getDisplayFromCodeableConcept(draftOrder?.reasonCode?.[0]) ||
    undefined;
  const urgency = mapUrgency(draftOrder?.priority);

  const priorImaging = mapPriorImaging(prefetch.recentImaging);

  const scenario: ClinicalScenario = {
    patientId,
    age,
    sex,
    chiefComplaint,
    clinicalHistory: clinicalHistory || undefined,
    symptoms: symptoms.length ? symptoms : undefined,
    duration,
    redFlags,
    pregnancyStatus,
    contrastAllergy: contrastAllergy || undefined,
    renalFunction,
    medications,
    proposedImaging: {
      modality: modality as ImagingModality | string | undefined,
      bodyPart,
      indication,
      urgency,
    },
    priorImaging,
  };

  logger.debug(
    {
      patientId,
      age,
      chiefComplaint,
      modality,
      redFlagCount: redFlags.filter((r) => r.present).length,
    },
    'Mapped prefetch to ClinicalScenario'
  );

  return scenario;
}

// -----------------------------------------------------------------------------
// Legacy exports (for backward compatibility)
// -----------------------------------------------------------------------------

export type { ClinicalScenario };
export type { FHIRPatient, FHIRCondition, FHIRServiceRequest, FHIRImagingStudy };

export function mapPatientToScenario(
  patient: FHIRPatient | null,
  scenario: ClinicalScenario
): void {
  scenario.patientId = patient?.id ?? scenario.patientId ?? 'unknown';
  scenario.age = extractAge(patient);
  scenario.sex = extractGender(patient);
}

export function mapConditionsToScenario(
  conditions: FHIRCondition[],
  scenario: ClinicalScenario
): void {
  if (!scenario.conditions) scenario.conditions = [];
  for (const c of conditions) {
    const display = getDisplayFromCodeableConcept(c?.code);
    const coding = c?.code?.coding?.[0];
    scenario.conditions.push({
      code: coding?.code,
      system: coding?.system,
      display: display ?? coding?.display,
      onset: c?.onsetDateTime ?? c?.onsetString,
    });
  }
}

export function mapServiceRequestsToScenario(
  serviceRequests: FHIRServiceRequest[],
  scenario: ClinicalScenario
): void {
  if (!scenario.serviceRequests) scenario.serviceRequests = [];
  for (const sr of serviceRequests) {
    const display = getDisplayFromCodeableConcept(sr?.code);
    const coding = sr?.code?.coding?.[0];
    const reasonCodes = (sr?.reasonCode ?? []).map((r) => getDisplayFromCodeableConcept(r) ?? '').filter(Boolean);
    scenario.serviceRequests.push({
      code: coding?.code,
      system: coding?.system,
      display: display ?? coding?.display,
      authoredOn: sr?.authoredOn,
      reasonCodes,
    });
  }
}

export function mapImagingStudiesToScenario(
  imagingStudies: FHIRImagingStudy[],
  scenario: ClinicalScenario
): void {
  if (!scenario.imagingStudies) scenario.imagingStudies = [];
  for (const is of imagingStudies) {
    const modalityCoding = is?.modality?.[0] ?? is?.series?.[0]?.modality;
    const modality = modalityCoding?.display ?? modalityCoding?.code;
    const procedureCodes = (is?.procedureCode ?? [])
      .flatMap((pc) => (pc?.coding ?? []).map((c) => c.code).filter(Boolean)) as string[];
    scenario.imagingStudies.push({
      modality,
      procedureCodes,
      started: is?.started,
    });
  }
}

export function buildClinicalScenario(params: {
  patient: FHIRPatient | null;
  conditions: FHIRCondition[];
  serviceRequests: FHIRServiceRequest[];
  imagingStudies: FHIRImagingStudy[];
  patientIdFromContext: string;
}): ClinicalScenario {
  const scenario: ClinicalScenario = {
    patientId: params.patientIdFromContext,
    redFlags: [],
  };
  mapPatientToScenario(params.patient, scenario);
  mapConditionsToScenario(params.conditions, scenario);
  mapServiceRequestsToScenario(params.serviceRequests, scenario);
  mapImagingStudiesToScenario(params.imagingStudies, scenario);
  return scenario;
}
