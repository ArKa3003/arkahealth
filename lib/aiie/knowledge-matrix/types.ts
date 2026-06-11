/**
 * AIIE Clinical Knowledge Matrix — type definitions.
 *
 * Deterministic clinical appropriateness knowledge base owned by ARKA. Every
 * normalized order context resolves through this matrix to an evidence-linked
 * modality rating for auditability and CDS scoring.
 */

import type { AIIERedFlags } from "@/lib/types/aiie";

/**
 * Anatomic body regions used to partition clinical scenarios in the matrix.
 */
export type BodyRegion =
  | "head_brain"
  | "head_face_neck"
  | "spine_cervical"
  | "spine_thoracic"
  | "spine_lumbar"
  | "chest"
  | "cardiac"
  | "abdomen"
  | "pelvis"
  | "gu_renal"
  | "msk_upper"
  | "msk_lower"
  | "vascular"
  | "breast"
  | "whole_body";

/**
 * Imaging modalities represented in the AIIE Clinical Knowledge Matrix.
 */
export type Modality =
  | "xr"
  | "ct"
  | "cta"
  | "ct_contrast"
  | "mri"
  | "mri_contrast"
  | "mra"
  | "us"
  | "us_doppler"
  | "nm"
  | "pet_ct"
  | "fluoro"
  | "mammo"
  | "dexa";

/**
 * Keys from {@link AIIERedFlags} used as variant discriminators in the matrix.
 */
export type RedFlagKey = keyof AIIERedFlags;

/**
 * Appropriateness rating on the ARKA 1–9 clinical scale.
 */
export type AppropriatenessRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Relative radiation burden tier for a modality in a given scenario (0 = none).
 */
export type RadiationLevel = 0 | 1 | 2 | 3 | 4;

/**
 * How specifically the matrix matched an order to a rating.
 */
export type MatchTier =
  | "exact_variant"
  | "scenario_default"
  | "region_default"
  | "conservative_default";

/**
 * Optional numeric range discriminator for variant matching.
 */
export interface NumericRange {
  /** Inclusive minimum when set. */
  min?: number;
  /** Inclusive maximum when set. */
  max?: number;
}

/**
 * Discriminators that select among variants within a clinical scenario.
 */
export interface VariantCriteria {
  /** Required red flags (keys from {@link AIIERedFlags}) that must be present. */
  redFlags: RedFlagKey[];
  /** Symptom duration window in days. */
  durationDays?: NumericRange;
  /** Patient age window in years. */
  ageRange?: NumericRange;
  /** Whether prior imaging for the same region is required or excluded. */
  priorImaging?: boolean;
  /** Pregnancy status when clinically relevant. */
  pregnancy?: boolean;
  /** Acute trauma presentation. */
  trauma?: boolean;
  /** Immunocompromised host. */
  immunocompromised?: boolean;
  /** Whether conservative care was attempted before advanced imaging. */
  priorConservativeCare?: boolean;
}

/**
 * Evidence-linked appropriateness rating for one modality within a variant.
 */
export interface ModalityRating {
  /** Imaged modality. */
  modality: Modality;
  /** Clinical appropriateness on the 1–9 ARKA scale. */
  rating: AppropriatenessRating;
  /** Relative radiation tier (0 = none). */
  radiationLevel: RadiationLevel;
  /** Stable slug referencing matrix evidence metadata. */
  evidenceSlug: string;
  /** Clinician-facing rationale tied to the evidence slug. */
  rationale: string;
  /** Whether this modality is the preferred first-line option for the variant. */
  isPreferred?: boolean;
  /** Contrast-specific cautions (renal function, allergy, pregnancy). */
  contrastIssues?: string;
}

/**
 * A discriminated branch within a clinical scenario with modality-specific ratings.
 */
export interface ScenarioVariant {
  /** Stable variant identifier (slug). */
  id: string;
  /** Discriminators used to match this variant. */
  criteria: VariantCriteria;
  /** Modality appropriateness ratings for this variant. */
  ratings: ModalityRating[];
  /**
   * When false, variant represents conservative care without imaging indication
   * (e.g. uncomplicated acute low back pain under 6 weeks).
   */
  imagingIndicated?: boolean;
  /** Default variant when no other variant criteria match within a scenario. */
  isDefault?: boolean;
}

/**
 * A clinical presentation cluster in the AIIE Clinical Knowledge Matrix.
 */
export interface ClinicalScenario {
  /** Stable scenario identifier (slug). */
  id: string;
  /** Primary anatomic region. */
  region: BodyRegion;
  /** Short display name. */
  name: string;
  /** Clinical description of the presentation. */
  description: string;
  /** Free-text keywords used during scenario candidate resolution. */
  presentationKeywords: string[];
  /** ICD-10-CM prefixes that support this scenario. */
  icd10Prefixes: string[];
  /** Optional SNOMED CT codes that support this scenario. */
  snomedCodes?: string[];
  /** Variant branches with modality ratings. */
  variants: ScenarioVariant[];
}

/**
 * Slim scenario reference attached to a resolved rating.
 */
export interface MatchedScenario {
  /** Scenario slug from the matrix. */
  id: string;
  /** Scenario display name. */
  name: string;
  /** Scenario primary body region. */
  region: BodyRegion;
}

/**
 * Slim variant reference attached to a resolved rating.
 */
export interface MatchedVariant {
  /** Variant slug from the matrix. */
  id: string;
  /** Criteria that defined this variant match. */
  criteria: VariantCriteria;
}

/**
 * Fully resolved appropriateness outcome from the AIIE Clinical Knowledge Matrix.
 */
export interface ResolvedRating {
  /** Modality-specific appropriateness and evidence. */
  rating: ModalityRating;
  /** Matched clinical scenario. */
  scenario: MatchedScenario;
  /** Matched variant; null when a scenario or region default was used. */
  variant: MatchedVariant | null;
  /** Specificity tier of the matrix match. */
  matchTier: MatchTier;
}

/**
 * Normalized clinical order context fed into matrix resolution.
 *
 * Produced by upstream normalization from CDS Hooks payloads, FHIR service
 * requests, and NLP extraction before {@link resolveRating} is invoked.
 */
export interface NormalizedOrderContext {
  /** Resolved anatomic region, if known. */
  region: BodyRegion | null;
  /** Requested imaging modality, if known. */
  modality: Modality | null;
  /** Scenario slugs ranked by presentation / coding match strength. */
  scenarioCandidates: string[];
  /** Active red-flag keys from {@link AIIERedFlags}. */
  redFlags: RedFlagKey[];
  /** Patient age in years. */
  age: number | null;
  /** Symptom duration in days. */
  durationDays: number | null;
  /** Pregnancy status when known. */
  pregnancy: boolean | null;
  /** Whether acute trauma is present. */
  trauma: boolean;
  /** Whether prior imaging exists for the region. */
  priorImaging: boolean;
  /** Whether the patient is immunocompromised. */
  immunocompromised: boolean;
  /** Whether conservative management was attempted before this order. */
  priorConservativeCare: boolean;
  /** Concatenated clinical text used for keyword and NLP fallback. */
  rawText: string;
}
