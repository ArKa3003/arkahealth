/**
 * ARKA-INS demo – TypeScript types for prior auth workflow
 */

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  memberId: string;
  insurancePlan: InsurancePlan;
  medicalHistory: MedicalHistoryItem[];
  contactInfo?: ContactInfo;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: { street: string; city: string; state: string; zipCode: string };
}

export interface InsurancePlan {
  id: string;
  name: string;
  type: InsurancePlanType;
  rbmVendor: RBMVendor;
  priorAuthRequired: boolean;
  groupNumber?: string;
  effectiveDate?: string;
}

export type InsurancePlanType =
  | "HMO"
  | "PPO"
  | "Medicare"
  | "Medicaid"
  | "Commercial"
  | "Medicare Advantage";

export type RBMVendor = "eviCore" | "AIM" | "Carelon" | "Cohere" | "Internal" | "NIA";

export interface MedicalHistoryItem {
  id: string;
  condition: string;
  icdCode: string;
  diagnosedDate: string;
  status: MedicalConditionStatus;
  treatingProvider?: string;
  notes?: string;
}

export type MedicalConditionStatus = "active" | "resolved" | "chronic";

export interface ImagingOrder {
  id: string;
  patientId: string;
  orderingProvider: Provider;
  imagingType: ImagingType;
  cptCode: string;
  cptDescription?: string;
  bodyPart: string;
  laterality: Laterality;
  contrast: boolean;
  clinicalIndication: string;
  icdCodes: string[];
  icdDescriptions?: string[];
  urgency: OrderUrgency;
  clinicalNotes: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  priorImagingDates?: string[];
  conservativeTreatments?: ConservativeTreatment[];
}

export type ImagingType =
  | "MRI"
  | "CT"
  | "PET"
  | "PET-CT"
  | "Nuclear"
  | "Ultrasound"
  | "X-Ray"
  | "Mammography"
  | "DEXA";

export type Laterality = "left" | "right" | "bilateral" | "n/a";
export type OrderUrgency = "routine" | "urgent" | "emergent";

export type OrderStatus =
  | "draft"
  | "analyzing"
  | "pending"
  | "submitted"
  | "approved"
  | "denied"
  | "appealing"
  | "appeal-approved"
  | "appeal-denied";

export interface ConservativeTreatment {
  type: string;
  startDate: string;
  endDate?: string;
  duration: string;
  outcome: "improved" | "no-change" | "worsened" | "ongoing";
  provider?: string;
  notes?: string;
}

export interface Provider {
  id: string;
  name: string;
  npi: string;
  specialty: string;
  facility: string;
  phone?: string;
  fax?: string;
}

export interface PreSubmissionAnalysis {
  orderId: string;
  timestamp: string;
  documentationScore: number;
  gaps: DocumentationGap[];
  suggestions: string[];
  estimatedDenialRisk: number;
  readyForSubmission: boolean;
  analysisDetails?: {
    clinicalIndicationScore: number;
    historyDocumentationScore: number;
    priorTreatmentScore: number;
    diagnosticWorkupScore: number;
  };
}

export interface DocumentationGap {
  id: string;
  category: DocumentationGapCategory;
  severity: GapSeverity;
  description: string;
  requiredFor: string[];
  suggestedAction: string;
  autoFixAvailable?: boolean;
  fixedText?: string;
}

export type DocumentationGapCategory =
  | "clinical"
  | "diagnostic"
  | "history"
  | "contraindication"
  | "prior-treatment"
  | "symptoms"
  | "physical-exam"
  | "laboratory";

export type GapSeverity = "critical" | "major" | "minor";

export interface DenialPrediction {
  orderId: string;
  timestamp: string;
  overallRisk: number;
  riskLevel: RiskLevel;
  confidenceScore: number;
  factors: RiskFactor[];
  historicalDenialRate: number;
  similarCasesApproved: number;
  similarCasesDenied: number;
  recommendations: string[];
  predictedOutcome: "likely-approved" | "uncertain" | "likely-denied";
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskFactor {
  id: string;
  name: string;
  impact: number;
  weight: number;
  description: string;
  mitigationStrategy: string;
  isAddressable: boolean;
}

export interface RBMCriteriaMatch {
  orderId: string;
  rbmVendor: RBMVendor;
  guidelineVersion: string;
  guidelineDate: string;
  matchedCriteria: CriteriaItem[];
  unmatchedCriteria: CriteriaItem[];
  overallMatchScore: number;
  specificGuideline: string;
  guidelineReference: string;
  guidelineCategory: string;
  requirementsMetCount: number;
  requirementsTotalCount: number;
}

export interface CriteriaItem {
  id: string;
  criteriaCode: string;
  description: string;
  category: CriteriaCategory;
  matched: boolean;
  evidenceProvided: string | null;
  evidenceRequired: string;
  isRequired: boolean;
  alternativesMet?: string[];
}

export type CriteriaCategory =
  | "clinical-indication"
  | "conservative-treatment"
  | "prior-imaging"
  | "physical-exam"
  | "red-flags"
  | "contraindication"
  | "step-therapy"
  | "duration";

export interface GeneratedJustification {
  orderId: string;
  narrative: string;
  keyPoints: string[];
  supportingEvidence: string[];
  clinicalRationale: string;
  wordCount: number;
  generatedAt: string;
  version: number;
  tone: "clinical" | "detailed" | "concise";
}

export interface GeneratedAppeal {
  orderId: string;
  appealType: AppealType;
  letterContent: string;
  citedGuidelines: string[];
  supportingLiterature: LiteratureCitation[];
  peerToPeerRequested: boolean;
  generatedAt: string;
  denialReason?: string;
  denialDate?: string;
  originalAuthNumber?: string;
}

export type AppealType = "first-level" | "second-level" | "external" | "expedited";

export interface LiteratureCitation {
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  relevance: string;
}
