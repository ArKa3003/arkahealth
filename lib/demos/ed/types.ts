/**
 * ARKA-ED demo types (subset of full schema).
 * Used by case data, imaging options, and case viewer.
 */

export type SpecialtyTrack = "em" | "im" | "fm" | "surgery" | "peds";
export type CaseCategory =
  | "low-back-pain"
  | "headache"
  | "chest-pain"
  | "abdominal-pain"
  | "extremity-trauma";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type Modality =
  | "xray"
  | "ct"
  | "mri"
  | "ultrasound"
  | "nuclear"
  | "fluoroscopy"
  | "mammography"
  | "pet";
export type ACRCategory =
  | "usually-appropriate"
  | "may-be-appropriate"
  | "usually-not-appropriate";
export type ClinicalPearlCategory =
  | "clinical-pearl"
  | "high-yield"
  | "common-mistake"
  | "board-favorite";
export type PatientSex = "male" | "female";
export type TemperatureUnit = "celsius" | "fahrenheit";

export interface VitalSigns {
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  temperature_unit: TemperatureUnit | null;
  oxygen_saturation: number | null;
}

export interface LabResult {
  name: string;
  value: string | number;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
}

export interface ClinicalPearl {
  content: string;
  category: ClinicalPearlCategory;
}

export interface Reference {
  title: string;
  source: string;
  year: number;
  url?: string | null;
}

export interface Case {
  id: string;
  slug: string;
  title: string;
  chief_complaint: string;
  clinical_vignette: string;
  patient_age: number;
  patient_sex: PatientSex;
  patient_history: string[];
  vital_signs: VitalSigns | null;
  physical_exam: string | null;
  lab_results: LabResult[] | null;
  category: CaseCategory;
  specialty_tags: SpecialtyTrack[];
  difficulty: DifficultyLevel;
  acr_topic: string;
  optimal_imaging: string[];
  explanation: string;
  teaching_points: string[];
  clinical_pearls: ClinicalPearl[] | null;
  hints: string[] | null;
  references: Reference[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImagingOption {
  id: string;
  name: string;
  short_name: string;
  modality: Modality | "none";
  body_region: string;
  with_contrast: boolean;
  typical_cost_usd: number;
  radiation_msv: number;
  description: string;
  common_indications: string[];
  contraindications: string[];
  duration: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CaseImagingRating {
  id: string;
  case_id: string;
  imaging_option_id: string;
  acr_rating: number;
  rating_category: ACRCategory;
  rationale: string;
  acr_reference: string;
  created_at?: string;
  updated_at?: string;
}

export type CaseMode = "learning" | "quiz";
