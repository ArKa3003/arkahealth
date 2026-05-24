/**
 * @file feature-engineer.ts
 * @description Extracts feature vectors from ClinicalScenario for the XGBoost model.
 *   Feature names and types must match ml-service/model/features.py.
 *
 * FDA Criterion 1: this module is the boundary for what FHIR resources may produce features.
 * No image pixel arrays, no DICOM, no signal/waveform sources may be added here.
 */

/** FHIR resource types permitted as feature sources (Criterion 1 boundary). */
export type AllowedFeatureSource =
  | 'Patient'
  | 'Condition'
  | 'Observation'
  | 'ServiceRequest'
  | 'MedicationRequest'
  | 'AllergyIntolerance'
  | 'Coverage';

import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { FeatureVector } from './types';

/** Ordered list of all 23 features (must match Python FEATURE_NAMES) */
export const FEATURE_NAMES = [
  'patient_age',
  'patient_sex',
  'modality_code',
  'body_site_code',
  'indication_category',
  'symptom_duration_days',
  'has_red_flags',
  'cancer_history',
  'neurological_deficit',
  'fever_present',
  'is_pregnant',
  'has_contrast_allergy',
  'egfr_value',
  'on_anticoagulation',
  'on_metformin',
  'prior_imaging_count_90d',
  'days_since_last_imaging',
  'same_modality_prior_30d',
  'same_body_site_prior_30d',
  'urgency_level',
  'comorbidity_count',
  'conservative_tx_tried',
  'imaging_in_problem_list',
] as const;

/** Internal modality (or display) -> Python MODALITY_ENCODING code */
const MODALITY_ENCODING: Record<string, number> = {
  CT: 1,
  MRI: 2,
  XR: 3,
  'X-ray': 3,
  DX: 9,
  CR: 10,
  US: 4,
  Ultrasound: 4,
  NM: 5,
  'Nuclear Medicine': 5,
  PET: 6,
  'PET-CT': 6,
  MG: 7,
  RF: 8,
  'CT with contrast': 1,
  'MRI with contrast': 2,
  default: 0,
};

/** Body site string (case-insensitive key) -> Python BODY_SITE_ENCODING code */
const BODY_SITE_ENCODING: Record<string, number> = {
  head: 1,
  brain: 2,
  spine: 3,
  chest: 4,
  abdomen: 5,
  pelvis: 6,
  extremity: 7,
  extremities: 7,
  neck: 8,
  cardiac: 9,
  default: 0,
};

/** Chief complaint / indication phrase -> Python INDICATION_ENCODING code */
const INDICATION_ENCODING: Record<string, number> = {
  headache: 1,
  back_pain: 2,
  'low back pain': 2,
  'back pain': 2,
  trauma: 3,
  stroke: 4,
  infection: 5,
  cancer_surveillance: 6,
  screening: 7,
  'cancer screening': 7,
  default: 0,
};

/** Urgency string -> 0–3 (0=routine, 1=urgent, 2=asap, 3=stat) */
const URGENCY_LEVEL: Record<string, number> = {
  Routine: 0,
  Urgent: 1,
  ASAP: 2,
  Stat: 3,
};

/** Known imaging indication phrases (for imaging_in_problem_list) */
const IMAGING_INDICATION_PHRASES = [
  'headache', 'back pain', 'low back pain', 'chest pain', 'abdominal pain',
  'trauma', 'stroke', 'screening', 'cancer', 'pulmonary', 'appendicitis',
  'spine', 'brain', 'mri', 'ct', 'x-ray', 'imaging',
];

function toModalityCode(modality: string | undefined): number {
  if (!modality || typeof modality !== 'string') return MODALITY_ENCODING.default;
  const key = modality.trim();
  if (MODALITY_ENCODING[key] !== undefined) return MODALITY_ENCODING[key];
  const upper = key.toUpperCase();
  if (upper === 'X-RAY' || upper === 'XR') return 3;
  if (upper === 'US') return 4;
  if (upper === 'MR' || upper === 'MRI') return 2;
  if (upper === 'CT') return 1;
  if (upper === 'NM') return 5;
  if (upper === 'PT' || upper === 'PET') return 6;
  return MODALITY_ENCODING.default;
}

function toBodySiteCode(bodyPart: string | undefined): number {
  if (!bodyPart || typeof bodyPart !== 'string') return BODY_SITE_ENCODING.default;
  const normalized = bodyPart.toLowerCase().trim();
  if (BODY_SITE_ENCODING[normalized] !== undefined) return BODY_SITE_ENCODING[normalized];
  if (normalized.includes('head') && !normalized.includes('brain')) return 1;
  if (normalized.includes('brain')) return 2;
  if (normalized.includes('spine') || normalized.includes('spinal')) return 3;
  if (normalized.includes('chest') || normalized.includes('thorac')) return 4;
  if (normalized.includes('abdom')) return 5;
  if (normalized.includes('pelvis')) return 6;
  if (normalized.includes('extrem') || normalized.includes('limb') || normalized.includes('arm') || normalized.includes('leg')) return 7;
  if (normalized.includes('neck')) return 8;
  if (normalized.includes('cardiac') || normalized.includes('heart')) return 9;
  return BODY_SITE_ENCODING.default;
}

function toIndicationCategory(chiefComplaint: string | undefined, indication: string | undefined): number {
  const text = [chiefComplaint, indication].filter(Boolean).join(' ').toLowerCase();
  if (!text) return INDICATION_ENCODING.default;
  if (/\bheadache\b|head pain/i.test(text)) return 1;
  if (/\bback pain\b|low back|lumbar|spine pain/i.test(text)) return 2;
  if (/\btrauma\b|injury|fracture/i.test(text)) return 3;
  if (/\bstroke\b|tia\b|neurological deficit/i.test(text)) return 4;
  if (/\binfection\b|fever|sepsis|osteomyelitis/i.test(text)) return 5;
  if (/\bcancer\b|malignancy|surveillance|follow.?up/i.test(text)) return 6;
  if (/\bscreening\b|screen\b/i.test(text)) return 7;
  return INDICATION_ENCODING.default;
}

function toUrgencyLevel(urgency: string | undefined): number {
  if (!urgency || typeof urgency !== 'string') return 0;
  const u = urgency.trim() as keyof typeof URGENCY_LEVEL;
  return URGENCY_LEVEL[u] ?? 0;
}

/**
 * Converts a ClinicalScenario into a feature vector for the ML model.
 * @param scenario - Clinical scenario (patient, conditions, orders, imaging studies)
 * @returns Feature vector (all 23 features as numbers) matching Python feature set
 */
export function extractFeatures(scenario: ClinicalScenario): FeatureVector {
  const proposed = scenario.proposedImaging;
  const modality = proposed?.modality;
  const bodyPart = proposed?.bodyPart;
  const indication = proposed?.indication ?? scenario.chiefComplaint;
  const prior = scenario.priorImaging ?? [];
  const within90 = prior.filter((p) => p.daysAgo >= 0 && p.daysAgo <= 90);
  const within30 = prior.filter((p) => p.daysAgo >= 0 && p.daysAgo <= 30);
  const sameModality = typeof modality === 'string'
    ? within30.some((p) => (p.modality ?? '').toString().toLowerCase() === modality.toLowerCase())
    : false;
  const sameBodySite = typeof bodyPart === 'string'
    ? within30.some((p) => (p.bodyPart ?? '').toString().toLowerCase() === bodyPart.toLowerCase())
    : false;
  const lastImagingDays = prior.length > 0
    ? Math.min(...prior.map((p) => p.daysAgo).filter((d) => d >= 0))
    : -1;

  const redFlags = scenario.redFlags ?? [];
  const hasRedFlags = redFlags.some((r) => r.present) ? 1 : 0;
  const cancerHistory = redFlags.some((r) => r.present && /cancer|malignant|neoplasm/i.test(r.flag ?? '')) ? 1 : 0;
  const neurologicalDeficit = redFlags.some((r) => r.present && /neuro|deficit|weakness|numbness|saddle|bowel|bladder/i.test(r.flag ?? '')) ? 1 : 0;
  const feverPresent = (scenario.symptoms ?? []).some((s) => /fever|febrile/i.test(String(s)))
    || redFlags.some((r) => r.present && /fever/i.test(r.flag ?? ''))
    ? 1 : 0;

  const clinicalHistory = (scenario.clinicalHistory ?? '').trim();
  const comorbidityCount = clinicalHistory ? ((clinicalHistory.match(/;/g)?.length ?? 0) + 1) : 0;
  const conservativeTxTried = /conservative|physical therapy|pt\b|nsaid|trial of|failed.*treatment|prior.*treatment/i.test(clinicalHistory) ? 1 : 0;
  const imagingInProblemList = IMAGING_INDICATION_PHRASES.some((phrase) =>
    (indication ?? scenario.chiefComplaint ?? '').toLowerCase().includes(phrase)
  ) ? 1 : 0;

  const features: FeatureVector = {
    patient_age: typeof scenario.age === 'number' && scenario.age >= 0 ? scenario.age : 40,
    patient_sex: scenario.sex === 'Male' ? 1 : 0,
    modality_code: toModalityCode(modality),
    body_site_code: toBodySiteCode(bodyPart),
    indication_category: toIndicationCategory(scenario.chiefComplaint, indication),
    symptom_duration_days: typeof scenario.duration === 'number' && scenario.duration >= 0 ? scenario.duration : -1,
    has_red_flags: hasRedFlags,
    cancer_history: cancerHistory,
    neurological_deficit: neurologicalDeficit,
    fever_present: feverPresent,
    is_pregnant: scenario.pregnancyStatus === 'pregnant' ? 1 : 0,
    has_contrast_allergy: scenario.contrastAllergy === true ? 1 : 0,
    egfr_value: scenario.renalFunction?.value ?? -1,
    on_anticoagulation: scenario.medications?.onAnticoagulation === true ? 1 : 0,
    on_metformin: scenario.medications?.onMetformin === true ? 1 : 0,
    prior_imaging_count_90d: within90.length,
    days_since_last_imaging: lastImagingDays >= 0 ? lastImagingDays : -1,
    same_modality_prior_30d: sameModality ? 1 : 0,
    same_body_site_prior_30d: sameBodySite ? 1 : 0,
    urgency_level: toUrgencyLevel(proposed?.urgency),
    comorbidity_count: Math.min(50, Math.max(0, comorbidityCount)),
    conservative_tx_tried: conservativeTxTried,
    imaging_in_problem_list: imagingInProblemList,
  };

  return features;
}

/**
 * Returns the list of feature names expected by the model (for validation and SHAP ordering).
 */
export function getFeatureNames(): string[] {
  return [...FEATURE_NAMES];
}
