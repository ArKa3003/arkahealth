/**
 * @file index.ts
 * @description Shared types for the CDS Hooks pipeline, including ClinicalScenario
 *   used by the scoring engine and ML pipeline.
 */

/** Urgency of the proposed imaging order */
export type ImagingUrgency = 'Routine' | 'Urgent' | 'Stat' | 'ASAP';

/** Imaging modality (aligns with code-systems ImagingModality) */
export type ImagingModality =
  | 'X-ray'
  | 'CT'
  | 'CT with contrast'
  | 'MRI'
  | 'MRI with contrast'
  | 'Ultrasound'
  | 'Nuclear Medicine'
  | 'PET-CT';

/** One prior imaging study for appropriateness context */
export interface PriorImaging {
  modality?: ImagingModality | string;
  bodyPart?: string;
  daysAgo: number;
  studyDescription?: string;
}

/** Renal function from eGFR observation */
export interface RenalFunction {
  value: number;
  date: string;
  hasImpairment: boolean;
}

/** Medication flags relevant to imaging safety */
export interface MedicationFlags {
  onAnticoagulation: boolean;
  onMetformin: boolean;
}

/** Proposed imaging order (from draft ServiceRequest) */
export interface ProposedImaging {
  modality?: ImagingModality | string;
  bodyPart?: string;
  indication?: string;
  urgency?: ImagingUrgency;
}

/** Red flag check result */
export interface RedFlagResult {
  flag: string;
  present: boolean;
}

/**
 * Clinical scenario representation used by AIIE scoring and ML.
 * Mapped from FHIR prefetch + draft ServiceRequest.
 */
export interface ClinicalScenario {
  /** Patient demographics */
  patientId: string;
  age?: number;
  sex?: 'Male' | 'Female' | 'Other';

  /** Clinical presentation */
  chiefComplaint?: string;
  clinicalHistory?: string;
  symptoms?: string[];
  duration?: number; // days

  /** Red flags for appropriateness */
  redFlags: RedFlagResult[];

  /** Patient safety factors */
  pregnancyStatus?: 'pregnant' | 'not_pregnant' | 'unknown';
  contrastAllergy?: boolean;
  renalFunction?: RenalFunction;
  medications?: MedicationFlags;

  /** Proposed imaging (draft order) */
  proposedImaging?: ProposedImaging;

  /** Prior imaging studies (recent, sorted by date) */
  priorImaging?: PriorImaging[];

  /** Legacy fields for backward compatibility with feature-engineer */
  conditions?: Array<{ code?: string; system?: string; display?: string; onset?: string }>;
  serviceRequests?: Array<{
    code?: string;
    system?: string;
    display?: string;
    authoredOn?: string;
    /** ServiceRequest.occurrenceDateTime when present on the draft order. */
    occurrenceDateTime?: string;
    reasonCodes?: string[];
    /** ICD-10-CM reason codes extracted from ServiceRequest.reasonCode. */
    reasonIcd10?: string[];
    /** SNOMED CT reason codes extracted from ServiceRequest.reasonCode. */
    reasonSnomed?: string[];
  }>;
  imagingStudies?: Array<{
    modality?: string;
    procedureCodes?: string[];
    started?: string;
  }>;

  [key: string]: unknown;
}
