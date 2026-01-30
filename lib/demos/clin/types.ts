// Types for ARKA-CLIN demo – clinical scenario and evaluation result

export interface ClinicalScenario {
  patientId: string;
  age: number;
  sex: "male" | "female" | "other";
  chiefComplaint: string;
  clinicalHistory: string;
  symptoms: string[];
  duration: string;
  redFlags: RedFlag[];
  pregnancyStatus?: "not-pregnant" | "pregnant" | "unknown" | "not-applicable";
  contrastAllergy?: {
    hasAllergy: boolean;
    allergyType?: "iodinated" | "gadolinium" | "both" | "unknown";
  };
  renalFunction?: {
    egfr?: number;
    hasImpairment?: boolean;
  };
  medications?: {
    onAnticoagulation?: boolean;
    onMetformin?: boolean;
  };
  proposedImaging: ProposedImaging;
  priorImaging?: PriorImaging[];
}

export interface RedFlag {
  flag: string;
  present: boolean;
}

export interface ProposedImaging {
  modality: ImagingModality;
  bodyPart: string;
  indication: string;
  urgency: "stat" | "urgent" | "routine";
}

export type ImagingModality =
  | "X-ray"
  | "CT"
  | "CT with contrast"
  | "MRI"
  | "MRI with contrast"
  | "Ultrasound"
  | "Nuclear Medicine"
  | "PET-CT";

export interface PriorImaging {
  modality: ImagingModality;
  bodyPart: string;
  date: string;
  daysAgo: number;
  findings?: string;
}

export interface EvaluationResult {
  appropriatenessScore: AppropriatenessScore;
  trafficLight: "green" | "yellow" | "red";
  matchedCriteria: ImagingCriteria;
  reasoning: string[];
  alternatives: Alternative[];
  warnings: Warning[];
  evidenceLinks: EvidenceLink[];
  confidenceLevel: "High" | "Medium" | "Low";
  coverageStatus:
    | "DIRECT_MATCH"
    | "SIMILAR_MATCH"
    | "GENERAL_GUIDANCE"
    | "INSUFFICIENT_DATA";
  evaluatedAt: string;
  shap?: {
    factors: {
      name: string;
      value: string;
      contribution: number;
      direction: "supports" | "opposes" | "neutral";
      explanation: string;
      evidenceCitation: string;
    }[];
    baselineScore: number;
    finalScore: number;
  };
}

export interface AppropriatenessScore {
  value: number;
  category:
    | "usually-not-appropriate"
    | "may-be-appropriate"
    | "usually-appropriate";
  description: string;
}

export interface ImagingCriteria {
  id: string;
  topic: string;
  variant: string;
  procedure: string;
  rating: number;
  rrl: string;
  source: string;
  lastReviewed: string;
}

export interface Alternative {
  procedure: string;
  rating: number;
  reasoning: string;
  costComparison: "lower" | "similar" | "higher";
  radiationComparison: "lower" | "similar" | "higher" | "none";
}

export interface Warning {
  type: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

export interface EvidenceLink {
  title: string;
  url: string;
  type: "guideline" | "study" | "recommendation";
}

// CDS Hooks (for Epic integration – optional)
export interface CDSHooksRequest {
  hook: string;
  hookInstance: string;
  context: {
    patientId: string;
    userId?: string;
    draftOrders?: { modality?: string; bodyPart?: string; indication?: string; reason?: string; urgency?: string; patientAge?: number; patientSex?: string; clinicalHistory?: string; symptoms?: string[]; duration?: string; redFlags?: RedFlag[]; priorImaging?: PriorImaging[] }[];
  };
}

export interface CDSHooksCard {
  summary: string;
  indicator: "info" | "warning" | "critical";
  source: { label: string };
  detail?: string;
  suggestions?: { label: string; uuid: string }[];
}

export interface CDSHooksResponse {
  cards: CDSHooksCard[];
}
