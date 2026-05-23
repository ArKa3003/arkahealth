/**
 * Shared ARKA Imaging Intelligence Engine type definitions.
 *
 * These shapes preserve compatibility with the existing clinical demo engine
 * while adding the structured fields needed for ARKA-INS workflows.
 */

import type { RarityAssessment } from "@/lib/aiie/interesting-case";
import type { MNAIResult } from "@/lib/coding/mnai";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

/**
 * Administrative sex values currently used by the clinical engine.
 */
export type AIIESex = "male" | "female";

/**
 * AIIE-supported imaging modalities.
 */
export type AIIEModality =
  | "X-ray"
  | "CT"
  | "CT with contrast"
  | "MRI"
  | "MRI with contrast"
  | "Ultrasound"
  | "US"
  | "Nuclear Medicine"
  | "PET-CT"
  | string;

/**
 * Structured patient demographics passed into AIIE.
 */
export interface AIIEPatientDemographics {
  /** Patient age in years. */
  age: number;
  /** Administrative sex used by the scoring engine. */
  sex: AIIESex;
  /** Indicates whether the patient is pregnant when clinically relevant. */
  pregnant?: boolean;
}

/**
 * A single clinical factor considered by AIIE.
 */
export interface AIIEFactor {
  /** Stable factor identifier. */
  id: string;
  /** Human-readable factor name. */
  name: string;
  /** Relative factor weight in the model. */
  weight: number;
  /** Factor contribution expressed as a SHAP-style value. */
  contribution: number;
  /**
   * Whether the factor is present for the current case. When `undefined`, documentation
   * is missing and DTR should collect it as a required item.
   */
  present?: boolean;
  /** Citation or guideline supporting the factor. */
  evidenceCitation: string;
}

/**
 * Existing ARKA-CLIN red-flag set used by the current scoring engine.
 */
export interface AIIERedFlags {
  /** Prior cancer history. */
  cancerHistory: boolean;
  /** Focal neurologic deficit. */
  neurologicalDeficit: boolean;
  /** Fever or infectious concern. */
  fever: boolean;
  /** Unintentional weight loss. */
  weightLoss: boolean;
  /** Recent trauma. */
  trauma: boolean;
  /** Immunocompromised status. */
  immunocompromised: boolean;
  /** Intravenous drug use history. */
  ivDrugUse: boolean;
  /** Osteoporosis risk. */
  osteoporosis: boolean;
  /** Age over fifty flag. */
  ageOver50: boolean;
  /** Pediatric age flag. */
  ageUnder18: boolean;
  /** Progressive symptoms flag. */
  progressiveSymptoms: boolean;
  /** Bladder or bowel dysfunction flag. */
  bladderBowelDysfunction: boolean;
  /** Sudden onset flag. */
  suddenOnset: boolean;
}

/**
 * Structured clinical features used by AIIE.
 */
export interface AIIEClinicalFactors {
  /** Chief complaint or presenting problem. */
  chiefComplaint: string;
  /** Symptom duration description. */
  duration: string;
  /** Structured symptom list. */
  symptoms: string[];
  /** Existing red-flag set from ARKA-CLIN. */
  redFlags: AIIERedFlags;
  /** Whether prior imaging exists. */
  priorImaging: boolean;
  /** Time since prior imaging when known. */
  priorImagingTimeframe?: string;
  /** Whether conservative treatment has been attempted. */
  conservativeManagementTried: boolean;
  /** Duration of conservative treatment when known. */
  conservativeManagementDuration?: string;
}

/**
 * Ordered imaging service details.
 */
export interface AIIEOrder {
  /** Ordered CPT or equivalent billing code. */
  cpt?: string;
  /** Requested imaging modality. */
  modality: AIIEModality;
  /** Anatomic body part or region. */
  bodyPart?: string;
  /** Requested procedure display text. */
  procedure: string;
}

/**
 * Coverage details considered by ARKA-INS.
 */
export interface AIIECoverage {
  /** Coverage identifier or member plan id. */
  coverageId?: string;
  /** Payer identifier for ARKA-INS cache and network lookups. */
  payerId?: string;
  /** Payer display name. */
  payerName?: string;
  /** Plan display name. */
  planName?: string;
  /** Product type such as PPO or Medicare Advantage. */
  productType?: string;
  /** Whether prior authorization is expected for the service. */
  priorAuthRequired?: boolean;
}

/**
 * Plan financial attributes used for patient responsibility estimation.
 */
export interface AIIECoverageFinancials {
  /** Remaining plan deductible in USD. */
  deductibleRemaining: number;
  /** Coinsurance rate from 0 to 1 applied after deductible. */
  coinsurance: number;
  /** Flat copay in USD when applicable. */
  copay: number;
  /** Expected in-network allowed amount for the service. */
  inNetworkNegotiatedRate: number;
}

/**
 * Gold-card eligibility derived from historical PA outcomes.
 */
export interface GoldCardStatus {
  /** Whether the provider qualifies for gold-card auto-approval for this CPT and payer. */
  eligible: boolean;
  /** Wilson lower bound of historical approval rate, scaled 0–100 for storage parity. */
  score: number;
  /** Observed approval rate including auto-approved decisions. */
  approvalRate: number;
  /** Count of PA decisions in the evaluation window. */
  sampleSize: number;
  /** Machine-readable reason when not eligible. */
  reason?: "insufficient_history" | "below_threshold";
  /** Human-readable next step toward eligibility. */
  nextMilestone?: string;
}

/**
 * Standard error shape for AIIE library helpers (never thrown).
 */
export interface AIIELibError {
  /** Stable error code for branching in callers. */
  code: string;
  /** Human-readable detail safe for logs or UI. */
  message: string;
}

/**
 * Primary AIIE request payload.
 *
 * The top-level scalar fields intentionally mirror the current ARKA-CLIN
 * implementation so existing demo logic remains assignable to this interface.
 */
export interface AIIEInput {
  /** Structured patient demographics. */
  patient: AIIEPatientDemographics;
  /** Structured clinical factors. */
  clinicalFactors: AIIEClinicalFactors;
  /** Ordered imaging details. */
  order: AIIEOrder;
  /** Coverage metadata for utilization workflows. */
  coverage?: AIIECoverage;
  /** Patient age in years. */
  age: number;
  /** Administrative sex used by the scoring engine. */
  sex: AIIESex;
  /** Indicates whether the patient is pregnant when relevant. */
  pregnant?: boolean;
  /** Chief complaint or presenting problem. */
  chiefComplaint: string;
  /** Symptom duration description. */
  duration: string;
  /** Structured symptom list. */
  symptoms: string[];
  /** Existing red-flag set from the clinical engine. */
  redFlags: AIIERedFlags;
  /** Whether prior imaging exists. */
  priorImaging: boolean;
  /** Time since prior imaging when known. */
  priorImagingTimeframe?: string;
  /** Whether conservative treatment has been attempted. */
  conservativeManagementTried: boolean;
  /** Duration of conservative treatment when known. */
  conservativeManagementDuration?: string;
  /** Requested modality used by the current demo scoring engine. */
  requestedModality: AIIEModality;
  /** Requested procedure used by the current demo scoring engine. */
  requestedProcedure: string;
  /**
   * Optional full-record snapshot from async FHIR scrape; augments indication and
   * prior-imaging signals without replacing structured hook payload fields.
   */
  recordSnapshot?: PatientRecordSnapshot;
}

/**
 * AIIE scoring output.
 */
export interface AIIEScore {
  /** Clinical appropriateness score on a 1 to 9 scale. */
  clinicalScore: number;
  /**
   * Payer denial-risk proxy on 1–9 from `10 - clinicalScore` (clamped); lower values
   * correspond to stronger appropriateness and typically lower denial concern.
   */
  denialRisk: number;
  /** Model confidence from 0 to 1. */
  confidence: number;
  /** SHAP-style factor breakdown. */
  factors: AIIEFactor[];
  /** Consolidated narrative for clinical and payer-facing review. */
  narrativeRationale: string;
  /**
   * Medical Necessity Alignment Index when ICD-10/CPT and record snapshot are available.
   * Does not alter {@link clinicalScore}; append-only enrichment for ARKA-INS.
   */
  mnai?: MNAIResult;
  /**
   * Interesting-case rarity assessment (top-decile flag); append-only for teaching / QI workflows.
   */
  rarity?: RarityAssessment;
}

/**
 * Human-readable explanation bundle for an AIIE score.
 */
export interface AIIEExplanation {
  /** Strongest factors supporting the requested order. */
  topPositiveFactors: AIIEFactor[];
  /** Strongest factors opposing the requested order. */
  topNegativeFactors: AIIEFactor[];
  /** Narrative rationale suitable for UI display. */
  narrativeRationale: string;
  /** Guideline references supporting the rationale. */
  guidelineReferences: string[];
}

/**
 * Out-of-pocket estimate for the requested service.
 */
export interface OOPEstimate {
  /** Estimated patient responsibility amount. */
  estimatedPatientResponsibility: number;
  /** Remaining deductible amount. */
  deductibleRemaining: number;
  /** Coinsurance rate expressed from 0 to 1. */
  coinsurance: number;
  /** Fixed copay amount if applicable. */
  copay: number;
  /** Expected contracted in-network rate. */
  inNetworkNegotiatedRate: number;
  /** Estimated self-pay alternative amount. */
  cashPayComparator?: number;
  /** Cheapest identified in-network imaging site. */
  cheapestInNetworkSite?: {
    /** Site identifier. */
    id: string;
    /** Site display name. */
    name: string;
    /** Estimated price at this site. */
    estimatedPrice: number;
    /** Site address or locality summary. */
    location?: string;
  };
  /** Confidence in the estimate from 0 to 1. */
  confidence: number;
  /** Assumptions made while computing the estimate. */
  assumptions: string[];
  /** Whether an alternative site is recommended to reduce cost. */
  alternativeSiteRecommended: boolean;
  /** Whether the estimate satisfies good-faith estimate requirements. */
  goodFaithEstimateCompliant: boolean;
}
