/**
 * Shared Da Vinci CRD, DTR, and PAS type definitions.
 */

import type { CDSCard } from "./cds-hooks";
import type { AIIEInput } from "./aiie";
import type {
  Claim,
  ClaimResponse,
  Coverage,
  FHIRCodeableConcept,
  FHIRExtension,
  Practitioner,
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireResponse,
  ServiceRequest,
} from "./fhir";

/**
 * Gold carding status used in utilization management decisions.
 */
export interface GoldCardStatus {
  /** Whether the ordering entity is currently gold-card eligible. */
  eligible: boolean;
  /** Composite gold-card score from 0 to 100. */
  score: number;
  /** Historical approval rate expressed from 0 to 1. */
  historicalApprovalRate: number;
  /** Number of cases contributing to the rate. */
  sampleSize: number;
  /** Date when the next formal review occurs. */
  nextReviewDate: string;
  /** Optional milestone that may change the next review cadence. */
  nextMilestone?: string;
}

/**
 * Estimated out-of-pocket exposure presented to the clinician.
 */
export interface EstimatedOOP {
  /** Expected patient responsibility in the payer workflow currency. */
  amount: number;
  /** Currency code for the estimate. */
  currency: string;
  /** Short explanation of the estimate basis. */
  basis?: string;
}

/**
 * CRD card with prior authorization and cost transparency extensions.
 */
export interface CRDCard<TResource = unknown> extends CDSCard<TResource> {
  /** Indicates whether prior authorization is required. */
  priorAuthRequired?: boolean;
  /** Gold-carding details for the provider or organization. */
  goldCardStatus?: GoldCardStatus;
  /** Estimated out-of-pocket amount for the requested service. */
  estimatedOOP?: EstimatedOOP;
}

/**
 * FHIR extension for a referenced CQL library.
 */
export interface DTRCqlLibraryExtension extends FHIRExtension {
  /** Canonical URL for the CQL library extension. */
  url: string;
  /** Canonical library reference URI. */
  valueUri: string;
}

/**
 * FHIR extension carrying the AIIE factor identifier for a question.
 */
export interface DTRAIIEFactorExtension extends FHIRExtension {
  /** Canonical URL for the AIIE factor extension. */
  url: string;
  /** Stable AIIE factor identifier. */
  valueString: string;
}

/**
 * DTR questionnaire enriched with Da Vinci and AIIE metadata.
 */
export interface DTRQuestionnaire extends Questionnaire {
  /** Resource type literal. */
  resourceType: "Questionnaire";
  /** Extensions declaring DTR-specific metadata. */
  extension?: Array<FHIRExtension | DTRCqlLibraryExtension>;
  /** Questionnaire items enriched with AIIE factor bindings. */
  item?: DTRQuestionnaireItem[];
}

/**
 * DTR questionnaire item enriched with AIIE metadata.
 */
export interface DTRQuestionnaireItem extends QuestionnaireItem {
  /** Extensions, including optional `aiie-factor-id`. */
  extension?: Array<FHIRExtension | DTRAIIEFactorExtension | DTRCqlLibraryExtension>;
  /** Nested child items. */
  item?: DTRQuestionnaireItem[];
}

/**
 * Full PAS submission packet: Da Vinci PAS Claim plus DTR replay inputs for AIIE adjudication.
 */
export interface PASRequest {
  /** FHIR Claim with Da Vinci PAS profile (X12 278 semantics). */
  claim: Claim;
  /** Completed DTR QuestionnaireResponse referenced from the claim. */
  questionnaireResponse: QuestionnaireResponse;
  /** Baseline AIIE input for the same session used to author the questionnaire. */
  aiieInput: AIIEInput;
  /** Ordering ServiceRequest (prescription) for DTR merge replay. */
  serviceRequest: ServiceRequest;
  /** Coverage used for payer routing and DTR initials. */
  coverage: Coverage;
  /** Ordering practitioner for Claim.provider and audit. */
  orderingProvider: Practitioner;
}

/**
 * PAS response decision outcomes.
 */
export type PASDecision = "approved" | "pended" | "denied" | "partial";

/**
 * CMS-0057-F denial/pend detail row (X12 AAA–aligned reason plus AIIE transparency).
 */
export interface PASCmsDenialDetail {
  /** X12 AAA–compatible reason code. */
  reasonCode: string;
  /** Plain-language explanation tied to a specific AIIE factor. */
  reasonText: string;
  /** AIIE evidence source for the factor. */
  citation: string;
  /** How and where to appeal. */
  appealInstructions: string;
  /** Regulatory appeal window end (ISO-8601). */
  appealDeadline: string;
  /** Decision instant for SLA tracking (ISO-8601). */
  decisionTimestamp: string;
}

/**
 * PAS response modeled as a FHIR ClaimResponse with utilization metadata.
 */
export interface PASResponse extends ClaimResponse {
  /** Resource type literal. */
  resourceType: "ClaimResponse";
  /** Meta profiles asserting Da Vinci PAS conformance. */
  meta?: ClaimResponse["meta"] & {
    /** Profile URIs applied to the claim response. */
    profile?: string[];
  };
  /** Business decision rendered by the payer (simulated). */
  decision: PASDecision;
  /** Structured reason codes supporting the decision. */
  reasonCodes: FHIRCodeableConcept[];
  /** Last date on which an appeal may be initiated. */
  appealDeadline: string;
  /** Timestamp of the utilization management decision. */
  decisionTimestamp: string;
  /** CMS-0057-F structured rows (empty when approved without pend/denial factors). */
  cmsDenialDetails: PASCmsDenialDetail[];
  /** Correlation id matching `ins_pa_history.id`. */
  paId: string;
  /** Echo of AIIE denial risk used in simulation. */
  aiieDenialRisk: number;
  /** Echo of AIIE clinical score. */
  aiieClinicalScore: number;
}
