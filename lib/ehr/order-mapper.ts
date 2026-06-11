/**
 * @file order-mapper.ts
 * @description Client-safe mapping from FHIR resources (Patient + ServiceRequest)
 * to the shared AIIE scoring input, plus the masked patient banner used by the
 * embedded EHR rail. Pure functions only — no network, no server dependencies —
 * so the rail can score orders entirely client-side from live FHIR responses.
 */

import type {
  FHIRBundle,
  FHIRPatient,
  FHIRServiceRequest,
} from '@/lib/cds-platform/fhir/resources';
import type { AIIEInput, AIIEModality, AIIERedFlags, AIIESex } from '@/lib/types/aiie';

/** Masked, display-only patient context for the rail banner (never persisted). */
export interface EhrPatientBanner {
  /** Display name assembled from the official HumanName. */
  name: string;
  /** Age in whole years, or null when birthDate is absent. */
  age: number | null;
  /** Administrative gender as displayed (capitalized). */
  sex: string;
  /** MRN masked to the last 4 digits (e.g. "•••1937"). */
  mrnMasked: string;
}

/** One imaging order normalized for the rail, carrying its AIIE scoring input. */
export interface EhrImagingOrder {
  /** ServiceRequest id. */
  id: string;
  /** Display text of the requested procedure. */
  procedure: string;
  /** Inferred imaging modality. */
  modality: AIIEModality;
  /** Order status (draft, active, ...). */
  status: string;
  /** Reason/indication text shown as the one-liner. */
  reason: string;
  /** True for stat/asap/urgent priority — the rail's EXPEDITE signal. */
  expedite: boolean;
  /** Fully-assembled input for the shared AIIE scoring engine. */
  aiieInput: AIIEInput;
  /** Original FHIR resource, retained for accepted-suggestion write-back. */
  serviceRequest: FHIRServiceRequest;
}

// -----------------------------------------------------------------------------
// Patient banner
// -----------------------------------------------------------------------------

/**
 * Computes age in whole years from a FHIR birthDate (ISO 8601).
 */
export function ageFromBirthDate(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}

function maskMrn(patient: FHIRPatient): string {
  const mrn = (patient.identifier ?? []).find((id) => {
    const typeText = id.type?.text ?? id.type?.coding?.[0]?.display ?? '';
    return /mrn|medical record/i.test(typeText) || Boolean(id.value);
  })?.value;
  if (!mrn) return '•••';
  return `•••${mrn.slice(-4)}`;
}

/**
 * Builds the masked banner shown at the top of the embedded rail.
 */
export function patientBannerFromFhir(patient: FHIRPatient): EhrPatientBanner {
  const name = patient.name?.[0];
  const display =
    name?.text ?? [name?.given?.join(' '), name?.family].filter(Boolean).join(' ').trim();
  const gender = patient.gender ?? 'unknown';
  return {
    name: display || 'Unknown patient',
    age: ageFromBirthDate(patient.birthDate),
    sex: gender.charAt(0).toUpperCase() + gender.slice(1),
    mrnMasked: maskMrn(patient),
  };
}

// -----------------------------------------------------------------------------
// Order mapping
// -----------------------------------------------------------------------------

const MODALITY_PATTERNS: Array<[RegExp, AIIEModality]> = [
  // "with contrast" must be explicit — "without contrast" must NOT match.
  [/\bMRI?\b.*\bwith\s+(?:iv\s+)?contrast\b/i, 'MRI with contrast'],
  [/\bMRI?\b|magnetic resonance/i, 'MRI'],
  [/\bCTA?\b.*\bwith\s+(?:iv\s+)?contrast\b|computed tomography.*\bwith\s+(?:iv\s+)?contrast\b/i, 'CT with contrast'],
  [/\bCTA?\b|computed tomography/i, 'CT'],
  [/\bPET\b/i, 'PET-CT'],
  [/ultrasound|sonogra|\bUS\b|duplex/i, 'Ultrasound'],
  [/nuclear|scintigraphy|\bSPECT\b/i, 'Nuclear Medicine'],
  [/x-?ray|radiograph|\bXR\b/i, 'X-ray'],
];

/**
 * Infers the AIIE modality from a procedure display string.
 */
export function inferModality(procedureText: string): AIIEModality {
  for (const [pattern, modality] of MODALITY_PATTERNS) {
    if (pattern.test(procedureText)) return modality;
  }
  return 'X-ray';
}

const BODY_PART_PATTERNS: Array<[RegExp, string]> = [
  [/lumbar/i, 'lumbar spine'],
  [/cervical/i, 'cervical spine'],
  [/thoracic spine/i, 'thoracic spine'],
  [/head|brain|cranial/i, 'head'],
  [/chest|thorax/i, 'chest'],
  [/abdomen.*pelvis|abd.*pelv/i, 'abdomen and pelvis'],
  [/abdomen/i, 'abdomen'],
  [/pelvis/i, 'pelvis'],
  [/knee/i, 'knee'],
  [/shoulder/i, 'shoulder'],
  [/hip/i, 'hip'],
  [/breast/i, 'breast'],
  [/neck/i, 'neck'],
];

function inferBodyPart(procedureText: string): string | undefined {
  for (const [pattern, part] of BODY_PART_PATTERNS) {
    if (pattern.test(procedureText)) return part;
  }
  return undefined;
}

/**
 * Derives the AIIE red-flag set from free-text indication keywords. Conservative:
 * a flag is true only when the reason text clearly names it.
 */
export function redFlagsFromReason(reason: string, age: number): AIIERedFlags {
  const has = (pattern: RegExp) => pattern.test(reason);
  return {
    cancerHistory: has(/cancer|malignan|tumor|metasta/i),
    neurologicalDeficit: has(/neuro|foot drop|weakness|numbness|deficit/i),
    fever: has(/fever|febrile/i),
    weightLoss: has(/weight loss/i),
    trauma: has(/trauma|fall|injury|accident/i),
    immunocompromised: has(/immunocomp|immunosupp/i),
    ivDrugUse: has(/iv drug|ivdu/i),
    osteoporosis: has(/osteoporo/i),
    ageOver50: age > 50,
    ageUnder18: age < 18,
    progressiveSymptoms: has(/progressive|worsening/i),
    bladderBowelDysfunction: has(/bladder|bowel|incontinence|retention/i),
    suddenOnset: has(/sudden|acute|thunderclap/i),
  };
}

function extractDuration(reason: string): string {
  const match = reason.match(/(?:for|x)\s+(\d+\s+(?:day|week|month|year)s?)/i);
  return match?.[1] ?? 'unspecified';
}

function extractCpt(sr: FHIRServiceRequest): string | undefined {
  return sr.code?.coding?.find((c) => (c.system ?? '').toLowerCase().includes('cpt'))?.code;
}

function isExpedite(priority: string | undefined): boolean {
  return priority === 'stat' || priority === 'asap' || priority === 'urgent';
}

/**
 * Maps one FHIR ServiceRequest (plus its patient) onto an {@link EhrImagingOrder}
 * carrying the shared {@link AIIEInput} for client-side scoring.
 */
export function mapServiceRequestToOrder(
  sr: FHIRServiceRequest,
  patient: FHIRPatient,
): EhrImagingOrder {
  const procedure = sr.code?.text ?? sr.code?.coding?.[0]?.display ?? 'Imaging study';
  const reason =
    sr.reasonCode?.[0]?.text ?? sr.reasonCode?.[0]?.coding?.[0]?.display ?? 'Indication not documented';
  const age = ageFromBirthDate(patient.birthDate) ?? 50;
  const sex: AIIESex = patient.gender === 'female' ? 'female' : 'male';
  const modality = inferModality(procedure);
  const redFlags = redFlagsFromReason(reason, age);
  const duration = extractDuration(reason);

  const aiieInput: AIIEInput = {
    patient: { age, sex },
    clinicalFactors: {
      chiefComplaint: reason,
      duration,
      symptoms: [],
      redFlags,
      priorImaging: false,
      conservativeManagementTried: false,
    },
    order: {
      cpt: extractCpt(sr),
      modality,
      bodyPart: inferBodyPart(procedure),
      procedure,
    },
    age,
    sex,
    chiefComplaint: reason,
    duration,
    symptoms: [],
    redFlags,
    priorImaging: false,
    conservativeManagementTried: false,
    requestedModality: modality,
    requestedProcedure: procedure,
  };

  return {
    id: sr.id ?? `${procedure}-${Math.random().toString(36).slice(2, 8)}`,
    procedure,
    modality,
    status: sr.status ?? 'draft',
    reason,
    expedite: isExpedite(sr.priority),
    aiieInput,
    serviceRequest: sr,
  };
}

/**
 * Extracts imaging-relevant ServiceRequests from a FHIR searchset Bundle and maps
 * each onto an {@link EhrImagingOrder}.
 */
export function mapServiceRequestBundle(
  bundle: FHIRBundle<FHIRServiceRequest>,
  patient: FHIRPatient,
): EhrImagingOrder[] {
  const resources = (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter((r): r is FHIRServiceRequest => r?.resourceType === 'ServiceRequest');
  return resources.map((sr) => mapServiceRequestToOrder(sr, patient));
}
