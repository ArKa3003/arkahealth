// ============================================================================
// ARKA RURAL PLATFORM — MASTER TYPE DEFINITIONS
// ============================================================================

// ---------------------------------------------------------------------------
// FACILITY & INFRASTRUCTURE
// ---------------------------------------------------------------------------

export interface FacilityProfile {
  id: string;
  name: string;
  type: FacilityType;
  designation: FacilityDesignation[];
  location: FacilityLocation;
  equipment: ImagingEquipment[];
  staffing: FacilityStaffing;
  mobileUnits: MobileUnitSchedule[];
  teleradiologyProviders: TeleradiologyProvider[];
  transferAgreements: TransferAgreement[];
  financials: FacilityFinancials;
  networkRole: "hub" | "spoke" | "independent";
  hubFacilityId?: string; // if spoke, which hub
  operationalStatus: "active" | "at-risk" | "reduced-services" | "closed";
  lastUpdated: string;
}

export type FacilityType =
  | "critical-access-hospital"
  | "rural-emergency-hospital"
  | "rural-health-clinic"
  | "community-hospital"
  | "regional-medical-center"
  | "federally-qualified-health-center";

export type FacilityDesignation =
  | "CAH" // Critical Access Hospital
  | "REH" // Rural Emergency Hospital
  | "RHC" // Rural Health Clinic
  | "FQHC" // Federally Qualified Health Center
  | "Sole-Community"
  | "Medicare-Dependent"
  | "HPSA" // Health Professional Shortage Area
  | "MUA"; // Medically Underserved Area

export interface FacilityLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  ruralUrbanCode: number; // USDA RUCA code 1-10
  nearestUrbanCenter: string;
  distanceToUrbanCenter: number; // miles
  population: number; // service area population
}

export interface ImagingEquipment {
  id: string;
  modality: ImagingModality;
  manufacturer: string;
  model: string;
  yearInstalled: number;
  age: number; // calculated from yearInstalled
  capabilities: string[];
  limitations: string[];
  doseReductionCapable: boolean;
  aiCompatible: boolean;
  maintenanceStatus: "operational" | "degraded" | "down" | "scheduled-maintenance";
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  utilizationRate: number; // 0-100%
  averageStudiesPerDay: number;
}

export type ImagingModality =
  | "X-ray"
  | "CT"
  | "CT-with-contrast"
  | "MRI"
  | "MRI-with-contrast"
  | "Ultrasound"
  | "Nuclear-Medicine"
  | "PET-CT"
  | "Mammography"
  | "DEXA"
  | "Fluoroscopy"
  | "C-arm";

export interface FacilityStaffing {
  radiologists: StaffMember[];
  technologists: StaffMember[];
  coverageSchedule: CoverageSchedule;
  hasAfterHoursCoverage: boolean;
  teleradiologyForAfterHours: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: "radiologist" | "technologist" | "nurse" | "physician-assistant";
  certifications: string[];
  modalityCompetencies: ImagingModality[];
  fullTime: boolean;
  scheduledHours: number; // per week
}

export interface CoverageSchedule {
  weekday: { start: string; end: string }; // "08:00" / "17:00"
  weekend: { start: string; end: string } | null;
  holidays: "normal" | "reduced" | "closed";
}

export interface MobileUnitSchedule {
  id: string;
  modality: ImagingModality;
  provider: string; // e.g. "Shared Medical Services"
  visitDays: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday")[];
  visitFrequency: "weekly" | "biweekly" | "monthly";
  nextVisitDate: string;
  slotsPerVisit: number;
  averageUtilization: number; // 0-100%
  contactPhone: string;
  schedulingUrl?: string;
}

export interface TeleradiologyProvider {
  id: string;
  name: string;
  servicesProvided: TeleradiologyService[];
  averageTurnaroundMinutes: number;
  subspecialties: string[];
  costPerRead: number;
  contractStatus: "active" | "pending" | "expired";
  qualityScore: number; // 0-100
  availableHours: "24/7" | "business-hours" | "after-hours-only";
}

export type TeleradiologyService =
  | "general-reads"
  | "subspecialty-neuro"
  | "subspecialty-msk"
  | "subspecialty-pediatric"
  | "subspecialty-cardiac"
  | "subspecialty-body"
  | "emergency-stat"
  | "ai-triage"
  | "second-opinion";

export interface TransferAgreement {
  id: string;
  partnerFacilityId: string;
  partnerFacilityName: string;
  distanceMiles: number;
  estimatedTransferMinutes: number;
  availableModalities: ImagingModality[];
  transferProtocol: "ambulance" | "patient-transport" | "self-transport";
  preNotificationRequired: boolean;
  contactPhone: string;
  faxNumber?: string;
  acceptsDirectScheduling: boolean;
}

export interface FacilityFinancials {
  annualImagingRevenue: number;
  operatingMarginPercent: number;
  payerMix: PayerMixEntry[];
  monthlyREHPayment?: number; // $285,625.90 for REH facilities
  atRiskOfClosure: boolean;
  riskScore: number; // 0-100
}

export interface PayerMixEntry {
  payer: string;
  percentVolume: number;
  averageReimbursementRate: number;
  denialRate: number;
}

// ---------------------------------------------------------------------------
// RESOURCE-ADJUSTED APPROPRIATENESS SCORING (RAAS)
// ---------------------------------------------------------------------------

export interface RAASInput {
  clinicalScenario: ClinicalScenarioExtended;
  facilityProfile: FacilityProfile;
  patientContext: PatientRuralContext;
}

export interface ClinicalScenarioExtended {
  // Inherits all fields from existing ClinicalScenario in lib/demos/clin/types.ts
  patientId: string;
  age: number;
  sex: "male" | "female" | "other";
  chiefComplaint: string;
  clinicalHistory: string;
  symptoms: string[];
  duration: string;
  redFlags: { flag: string; present: boolean }[];
  proposedImaging: {
    modality: ImagingModality;
    bodyPart: string;
    indication: string;
    urgency: "stat" | "urgent" | "routine";
  };
  priorImaging?: {
    modality: ImagingModality;
    bodyPart: string;
    date: string;
    daysAgo: number;
    findings?: string;
  }[];
  pregnancyStatus?: "not-pregnant" | "pregnant" | "unknown" | "not-applicable";
  contrastAllergy?: { hasAllergy: boolean; allergyType?: string };
  renalFunction?: { egfr?: number; hasImpairment?: boolean };
}

export interface PatientRuralContext {
  distanceToFacilityMiles: number;
  transportationAccess: "own-vehicle" | "public-transit" | "medical-transport" | "none";
  employmentImpact: "minimal" | "half-day" | "full-day" | "multi-day";
  childcareNeeded: boolean;
  insuranceType: "Medicare" | "Medicaid" | "Commercial" | "Uninsured" | "Medicare-Advantage";
  preferredLanguage: string;
  mobilityLimitations: boolean;
}

export interface RAASResult {
  clinicalAppropriatenessScore: CASScore;
  resourceAdjustedScore: RAASScore;
  triageRecommendation: TriageRecommendation;
  alternativePathways: AlternativePathway[];
  resourceFactors: ResourceFactor[];
  overallRecommendation: string;
  urgencyClassification: UrgencyClassification;
  estimatedCost: CostEstimate;
  evaluatedAt: string;
}

export interface CASScore {
  value: number; // 1-9 ACR scale
  category: "usually-not-appropriate" | "may-be-appropriate" | "usually-appropriate";
  description: string;
  confidenceLevel: "High" | "Medium" | "Low";
  matchedCriteria: string;
}

export interface RAASScore {
  value: number; // 1-9 adjusted scale
  category: "usually-not-appropriate" | "may-be-appropriate" | "usually-appropriate";
  adjustmentReason: string;
  resourceContextWeight: number; // 0-1, how much resource context affected score
  description: string;
}

export interface TriageRecommendation {
  tier: "local-first" | "mobile-unit" | "transfer" | "defer";
  protocol: LocalFirstProtocol | MobileUnitProtocol | TransferProtocol | DeferProtocol;
  reasoning: string;
  clinicalSafetyNote: string;
}

export interface LocalFirstProtocol {
  type: "local-first";
  recommendedStudy: string;
  modality: ImagingModality;
  protocolGuidance: string[];
  expectedFindings: string;
  limitations: string;
  followUpRequired: boolean;
  followUpStudy?: string;
  followUpTimeframe?: string;
}

export interface MobileUnitProtocol {
  type: "mobile-unit";
  recommendedStudy: string;
  modality: ImagingModality;
  nextAvailableDate: string;
  nextAvailableSlot: string;
  waitTimeHours: number;
  clinicalSafetyOfWait: "safe" | "acceptable-with-monitoring" | "not-recommended";
  preparationInstructions: string[];
  alternativeIfUrgent: string;
}

export interface TransferProtocol {
  type: "transfer";
  receivingFacility: string;
  receivingFacilityId: string;
  distanceMiles: number;
  estimatedTransferMinutes: number;
  transportMethod: "ambulance" | "patient-transport" | "self-transport";
  requiredModality: ImagingModality;
  preNotificationTemplate: string;
  clinicalSummary: string;
  contactNumber: string;
  directSchedulingAvailable: boolean;
}

export interface DeferProtocol {
  type: "defer";
  reason: string;
  monitoringPlan: string;
  reassessmentTimeframe: string;
  redFlagsTriggeringEscalation: string[];
}

export interface AlternativePathway {
  study: string;
  modality: ImagingModality;
  availability: "local-now" | "local-scheduled" | "mobile-unit" | "transfer-required";
  casScore: number;
  raasScore: number;
  costEstimate: number;
  radiationDose: "none" | "low" | "moderate" | "high";
  rationale: string;
}

export interface ResourceFactor {
  name: string;
  value: string;
  impact: "increases-score" | "decreases-score" | "neutral";
  weight: number; // 0-1
  explanation: string;
}

export type UrgencyClassification =
  | "emergent" // Imaging needed within 1 hour (e.g. stroke, trauma)
  | "urgent" // Imaging needed within 24 hours
  | "semi-urgent" // Imaging needed within 72 hours
  | "routine" // Can wait for mobile unit or scheduled appointment
  | "screening"; // Preventive, can be scheduled at convenience

export interface CostEstimate {
  localEstimate: number | null;
  mobileUnitEstimate: number | null;
  transferEstimate: number | null;
  patientOutOfPocket: number | null;
  travelCost: number | null;
  currency: "USD";
}

// ---------------------------------------------------------------------------
// TELERADIOLOGY ORCHESTRATION (ARKA-TELE)
// ---------------------------------------------------------------------------

export interface TeleStudy {
  id: string;
  facilityId: string;
  patientId: string;
  modality: ImagingModality;
  bodyPart: string;
  studyDate: string;
  clinicalContextPackage: ClinicalContextPackage;
  aiTriageResult?: AITriageResult;
  assignedProvider?: TeleradiologyProvider;
  routingDecision: RoutingDecision;
  status: TeleStudyStatus;
  submittedAt: string;
  interpretedAt?: string;
  turnaroundMinutes?: number;
  report?: TeleReport;
}

export type TeleStudyStatus =
  | "queued"
  | "transmitting"
  | "received"
  | "ai-triaging"
  | "assigned"
  | "in-progress"
  | "preliminary"
  | "final"
  | "addendum";

export interface ClinicalContextPackage {
  orderingIndication: string;
  relevantHistory: string[];
  labValues: LabValue[];
  priorImagingFindings: string[];
  arkaClnScore: number;
  arkaClnCategory: string;
  redFlags: string[];
  medications: string[];
  allergies: string[];
  clinicalQuestion: string;
}

export interface LabValue {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
  date: string;
}

export interface AITriageResult {
  algorithmName: string;
  vendor: string;
  priority: "critical" | "urgent" | "routine";
  findings: string[];
  confidence: number;
  processingTimeMs: number;
  flaggedForImmediateReview: boolean;
  suggestedAction?: string;
}

export interface RoutingDecision {
  selectedProvider: string;
  reason: string;
  factors: {
    studyComplexity: "simple" | "moderate" | "complex";
    subspecialtyNeeded: string | null;
    estimatedTurnaround: number;
    costPerRead: number;
    qualityScore: number;
  };
  alternativeProviders: string[];
}

export interface TeleReport {
  id: string;
  radiologist: string;
  findings: string;
  impression: string;
  criticalFindings: string[];
  recommendations: string[];
  comparisonStudies: string[];
  reportedAt: string;
  isAddendum: boolean;
}

export interface QualityMetrics {
  facilityId: string;
  period: string; // "2026-Q1"
  totalStudies: number;
  averageTurnaroundMinutes: number;
  turnaroundByUrgency: {
    stat: number;
    urgent: number;
    routine: number;
  };
  addendumRate: number;
  criticalFindingCallbackRate: number;
  concordanceRate: number;
  providerPerformance: ProviderPerformanceMetric[];
}

export interface ProviderPerformanceMetric {
  providerId: string;
  providerName: string;
  studiesRead: number;
  averageTurnaround: number;
  addendumRate: number;
  qualityScore: number;
}

// ---------------------------------------------------------------------------
// RURAL TRAINING & CME (ARKA-ED EXTENSION)
// ---------------------------------------------------------------------------

export interface RuralCase {
  id: string;
  title: string;
  category: RuralCaseCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  setting: string; // e.g. "Critical Access Hospital, population 2,400"
  availableEquipment: ImagingModality[];
  unavailableEquipment: ImagingModality[];
  nearestAdvancedImaging: { facility: string; distance: number; modalities: ImagingModality[] };
  patientVignette: string;
  patientDemographics: {
    age: number;
    sex: string;
    occupation: string;
    insuranceType: string;
    transportAccess: string;
  };
  vitalSigns: Record<string, string>;
  physicalExam: string;
  labResults: LabValue[];
  clinicalQuestion: string;
  imagingOptions: RuralImagingOption[];
  optimalLocalChoice: string; // ID of the best local option
  optimalOverallChoice: string; // ID of best option if no constraints
  teachingPoints: TeachingPoint[];
  clinicalPearls: string[];
  references: string[];
  cmeCredits: number;
  specialtyTags: string[];
  estimatedCompletionMinutes: number;
}

export type RuralCaseCategory =
  | "resource-constrained"
  | "scope-expansion"
  | "mobile-unit-optimization"
  | "transfer-decision"
  | "pocus-application"
  | "emergency-triage";

export interface RuralImagingOption {
  id: string;
  study: string;
  modality: ImagingModality;
  availableLocally: boolean;
  availableViaMobile: boolean;
  requiresTransfer: boolean;
  casRating: number;
  raasRating: number;
  feedback: {
    isOptimalLocal: boolean;
    isOptimalOverall: boolean;
    explanation: string;
    whenToUse: string;
    limitations: string;
    followUpPlan: string;
  };
  cost: number;
  radiationDose: string;
  contraindications: string[];
  turnaroundTime: string;
}

export interface TeachingPoint {
  id: string;
  category: "clinical-pearl" | "rural-specific" | "safety-critical" | "cost-effectiveness" | "evidence-based";
  title: string;
  content: string;
  evidenceLevel: "A" | "B" | "C";
  source: string;
}

export interface CMEProgress {
  learnerId: string;
  totalCreditsEarned: number;
  creditsThisYear: number;
  completedCases: CompletedCase[];
  certifications: CertificationProgress[];
  streak: number; // consecutive days
  lastActivityDate: string;
}

export interface CompletedCase {
  caseId: string;
  completedAt: string;
  score: number;
  creditsEarned: number;
  timeSpentMinutes: number;
  attempts: number;
}

export interface CertificationProgress {
  certificationId: string;
  name: string;
  requiredCredits: number;
  earnedCredits: number;
  requiredCases: number;
  completedCases: number;
  specialtyArea: string;
  status: "not-started" | "in-progress" | "completed" | "expired";
  expirationDate?: string;
}

// ---------------------------------------------------------------------------
// RURAL REIMBURSEMENT (ARKA-INS EXTENSION)
// ---------------------------------------------------------------------------

export interface RuralExemption {
  id: string;
  payerId: string;
  payerName: string;
  exemptionType: RuralExemptionType;
  eligibleDesignations: FacilityDesignation[];
  description: string;
  requirements: string[];
  effectiveDate: string;
  expirationDate?: string;
  documentationRequired: string[];
  estimatedTimeSavedMinutes: number;
  autoDetectable: boolean;
}

export type RuralExemptionType =
  | "prior-auth-waiver"
  | "travel-distance-exception"
  | "critical-access-exemption"
  | "reh-exemption"
  | "emergency-bypass"
  | "modified-criteria"
  | "gold-card-rural";

export interface BatchAuthorizationRequest {
  id: string;
  facilityId: string;
  mobileUnitVisitDate: string;
  orders: BatchOrderEntry[];
  status: "preparing" | "submitting" | "partial-complete" | "complete" | "failed";
  submittedAt?: string;
  completedAt?: string;
  approvedCount: number;
  deniedCount: number;
  pendingCount: number;
  totalEstimatedRevenue: number;
}

export interface BatchOrderEntry {
  orderId: string;
  patientId: string;
  patientName: string;
  modality: ImagingModality;
  cptCode: string;
  indication: string;
  status: "pending" | "approved" | "denied" | "info-requested";
  denialReason?: string;
  exemptionApplied?: string;
  estimatedReimbursement: number;
}

export interface RevenueCycleAnalysis {
  facilityId: string;
  period: string;
  totalImagingRevenue: number;
  revenueByModality: { modality: ImagingModality; revenue: number; volume: number; avgReimbursement: number }[];
  revenueByPayer: { payer: string; revenue: number; volume: number; denialRate: number }[];
  denialAnalysis: {
    totalDenials: number;
    denialRate: number;
    topDenialReasons: { reason: string; count: number; revenueLost: number }[];
    appealSuccessRate: number;
  };
  optimizationOpportunities: OptimizationOpportunity[];
  rehPaymentStatus?: {
    monthlyPayment: number;
    ytdPaymentsReceived: number;
    complianceStatus: "compliant" | "at-risk" | "non-compliant";
    requiredServices: string[];
  };
}

export interface OptimizationOpportunity {
  id: string;
  category: "coding" | "documentation" | "payer-mix" | "volume" | "denial-reduction" | "service-line";
  title: string;
  description: string;
  estimatedAnnualImpact: number;
  implementationEffort: "low" | "medium" | "high";
  priority: "critical" | "high" | "medium" | "low";
}

export interface GrantOpportunity {
  id: string;
  name: string;
  agency: "HRSA" | "USDA" | "NIH" | "State" | "Foundation";
  amount: { min: number; max: number };
  deadline: string;
  eligibleFacilityTypes: FacilityDesignation[];
  purpose: string;
  matchRequired: boolean;
  matchPercent?: number;
  applicationUrl: string;
  contactInfo: string;
  status: "open" | "closing-soon" | "closed" | "upcoming";
}

// ---------------------------------------------------------------------------
// HUB-AND-SPOKE NETWORK
// ---------------------------------------------------------------------------

export interface NetworkConfiguration {
  id: string;
  name: string;
  hub: FacilityProfile;
  spokes: FacilityProfile[];
  sharedMobileUnits: MobileUnitSchedule[];
  sharedProtocols: SharedProtocol[];
  qualityStandards: QualityStandard[];
  networkMetrics: NetworkMetrics;
}

export interface SharedProtocol {
  id: string;
  name: string;
  modality: ImagingModality;
  bodyRegion: string;
  version: string;
  lastUpdated: string;
  parameters: Record<string, string | number>;
  appliesTo: "all" | "hub-only" | "spoke-only";
}

export interface QualityStandard {
  id: string;
  metric: string;
  target: number;
  unit: string;
  currentValue: number;
  trend: "improving" | "stable" | "declining";
  lastMeasured: string;
}

export interface NetworkMetrics {
  totalStudiesThisMonth: number;
  transfersThisMonth: number;
  averageTransferTime: number;
  mobileUnitUtilization: number;
  networkUptime: number;
  patientSatisfactionScore: number;
}

/** Lightweight row for demo hub-and-spoke lists */
export interface HubSpokeNode {
  id: string;
  name: string;
  role: "hub" | "spoke";
  distanceMiles: number;
}

// ---------------------------------------------------------------------------
// AI DIAGNOSTICS MARKETPLACE
// ---------------------------------------------------------------------------

export interface AIAlgorithm {
  id: string;
  name: string;
  vendor: string;
  fdaClearanceNumber: string;
  fdaClearanceDate: string;
  category: AIAlgorithmCategory;
  supportedModalities: ImagingModality[];
  description: string;
  clinicalUse: string;
  ruralValueScore: number; // 1-10, how valuable for rural settings
  ruralValueReason: string;
  costPerStudy: number;
  averageProcessingTimeSeconds: number;
  sensitivity: number;
  specificity: number;
  integrationStatus: "available" | "coming-soon" | "beta";
  requiredEquipment: string[];
  peerReviewedStudies: number;
}

export type AIAlgorithmCategory =
  | "chest-xray-triage"
  | "fracture-detection"
  | "stroke-triage"
  | "lung-nodule-tracking"
  | "pe-detection"
  | "mammography-screening"
  | "cardiac-assessment"
  | "general-triage"
  | "pocus-quality";

export interface AIPreliminaryAssessment {
  studyId: string;
  algorithmId: string;
  algorithmName: string;
  timestamp: string;
  overallAssessment: "likely-normal" | "likely-abnormal" | "critical-finding";
  findings: AIFinding[];
  confidence: number;
  processingTimeSeconds: number;
  disclaimer: string; // Always: "AI-generated preliminary assessment requiring radiologist confirmation"
  requiresImmediateAction: boolean;
  suggestedAction?: string;
}

export interface AIFinding {
  description: string;
  location: string;
  severity: "critical" | "moderate" | "mild" | "incidental";
  confidence: number;
  relatedConditions: string[];
}

export interface POCUSProtocol {
  id: string;
  name: string;
  indication: string;
  category: POCUSCategory;
  difficulty: "basic" | "intermediate" | "advanced";
  steps: POCUSStep[];
  normalFindings: string[];
  abnormalFindings: string[];
  clinicalDecisionPoints: string[];
  pitfalls: string[];
  references: string[];
  videoUrl?: string;
  estimatedDurationMinutes: number;
}

export type POCUSCategory =
  | "FAST"
  | "cardiac"
  | "DVT"
  | "gallbladder"
  | "renal"
  | "obstetric"
  | "lung"
  | "aorta"
  | "soft-tissue"
  | "procedural-guidance";

export interface POCUSStep {
  stepNumber: number;
  instruction: string;
  probePosition: string;
  expectedView: string;
  qualityIndicators: string[];
  commonErrors: string[];
  imageExample?: string; // URL to reference image
}

// ---------------------------------------------------------------------------
// DATA INTELLIGENCE & POPULATION HEALTH
// ---------------------------------------------------------------------------

export interface ImagingDesertRegion {
  id: string;
  name: string;
  state: string;
  county: string;
  population: number;
  coordinates: { lat: number; lng: number };
  nearestModalities: {
    modality: ImagingModality;
    nearestFacility: string;
    distanceMiles: number;
    driveTimeMinutes: number;
  }[];
  healthDisparityIndex: number; // 0-100, higher = worse
  uninsuredRate: number;
  medianIncome: number;
  smokingRate: number;
  obesityRate: number;
  cancerScreeningRate: number;
}

export interface OutcomeCorrelation {
  metric: string;
  arkaFacilityValue: number;
  nonArkaFacilityValue: number;
  improvementPercent: number;
  statisticalSignificance: number; // p-value
  sampleSize: number;
  period: string;
}

export interface FacilityRiskPrediction {
  facilityId: string;
  facilityName: string;
  riskScore: number; // 0-100
  riskLevel: "low" | "moderate" | "high" | "critical";
  riskFactors: {
    factor: string;
    weight: number;
    currentValue: string;
    threshold: string;
    status: "safe" | "warning" | "critical";
  }[];
  predictedTimeToServiceReduction: number; // months
  recommendedInterventions: string[];
  arkaImpactEstimate: string;
}

export interface PopulationMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "flat";
}

// ---------------------------------------------------------------------------
// DEMO / MOCK STATE
// ---------------------------------------------------------------------------

export interface RuralDemoState {
  // Active facility profile
  selectedFacility: FacilityProfile | null;

  // CDS state
  raasResult: RAASResult | null;
  activeTriageTier: "local-first" | "mobile-unit" | "transfer" | "defer" | null;

  // Tele state
  teleStudies: TeleStudy[];
  qualityMetrics: QualityMetrics | null;

  // Training state
  currentCase: RuralCase | null;
  cmeProgress: CMEProgress | null;

  // Reimbursement state
  activeExemptions: RuralExemption[];
  batchAuth: BatchAuthorizationRequest | null;
  revenueCycle: RevenueCycleAnalysis | null;
  grants: GrantOpportunity[];

  // Network state
  networkConfig: NetworkConfiguration | null;

  // AI state
  selectedAlgorithms: AIAlgorithm[];
  preliminaryAssessment: AIPreliminaryAssessment | null;
  activePOCUSProtocol: POCUSProtocol | null;

  // Intelligence state
  imagingDeserts: ImagingDesertRegion[];
  outcomes: OutcomeCorrelation[];
  facilityRisks: FacilityRiskPrediction[];
}
