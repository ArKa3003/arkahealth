/**
 * ARKA-INS RBM Reviewer Dashboard — shared types (no PHI in field names or values).
 */

/** Human reviewer disposition for a queued case. */
export type ReviewerAction =
  | "approve"
  | "approve_with_note"
  | "request_dtr"
  | "pend"
  | "deny";

/** AIIE factor row for SHAP-style visualization. */
export interface ReviewerFactorBar {
  /** Stable id for keys. */
  id: string;
  /** Display label. */
  label: string;
  /** Signed contribution toward appropriateness (absolute value drives bar length). */
  contribution: number;
}

/** Single alternative imaging site row (illustrative planning). */
export interface ReviewerAlternativeSite {
  name: string;
  distanceMiles: number;
  cashPriceUsd: number;
}

/** Read-only DTR item for embedded questionnaire viewer. */
export interface ReviewerDtrItem {
  linkId: string;
  text: string;
  type: "boolean" | "string" | "choice" | "display";
  prefilled?: string;
}

/** Clinical tab payload. */
export interface ReviewerClinicalDetail {
  /** AIIE appropriateness score (1–9). */
  score: number;
  positiveFactors: ReviewerFactorBar[];
  negativeFactors: ReviewerFactorBar[];
  guidelineCitations: string[];
}

/** Coverage tab payload. */
export interface ReviewerCoverageDetail {
  planName: string;
  memberIdMasked: string;
  paRequired: boolean;
  goldCardEligible: boolean;
  goldCardScore?: number;
  parsedSummary: string;
}

/** OOP tab payload. */
export interface ReviewerOopDetail {
  deductibleRemainingUsd: number;
  coinsurancePct: number;
  estimatedPatientPayUsd: number;
  cashPayComparatorUsd: number;
  alternativeSites: ReviewerAlternativeSite[];
}

/** Social proof for similar CPT + payer (rolling window). */
export interface ReviewerSocialProof {
  approved: number;
  denied: number;
}

/** One queue row with progressive-disclosure payload. */
export interface ReviewerQueueCase {
  id: string;
  patientInitials: string;
  cptCode: string;
  payerId: string;
  payerDisplay: string;
  providerId: string;
  submittedAt: string;
  slaDeadlineAt: string;
  expedited: boolean;
  denialRisk: number;
  aiieRecommendationLabel: string;
  aiieRecommendationConfidencePct: number;
  clinical: ReviewerClinicalDetail;
  coverage: ReviewerCoverageDetail;
  oop: ReviewerOopDetail;
  dtr: { items: ReviewerDtrItem[] };
  socialProof: ReviewerSocialProof;
  /** Full AIIE narrative for expanded queue row (no PHI). */
  aiieNarrative: string;
}

/** GET /api/ins/reviewer/queue */
export interface ReviewerQueueApiResponse {
  cases: ReviewerQueueCase[];
  demoProviderId: string;
}

/** POST /api/ins/reviewer/action */
export interface ReviewerActionRequestBody {
  caseId: string;
  cptCode: string;
  payerId: string;
  action: ReviewerAction;
  note: string;
  overrideReason: string;
  minutesOnCase: number;
  providerId: string;
}

/** GET /api/ins/reviewer/stats */
export interface ReviewerStatsApiResponse {
  casesCompletedToday: number;
  minutesSavedToday: number;
}

/** GET /api/ins/reviewer/history */
export interface ReviewerHistoryRow {
  submittedAt: string;
  decision: string;
}

export interface ReviewerHistoryApiResponse {
  rows: ReviewerHistoryRow[];
}
