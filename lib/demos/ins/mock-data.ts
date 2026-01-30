/**
 * ARKA-INS demo – mock data for prior auth workflow
 */

import type {
  Patient,
  InsurancePlan,
  ImagingOrder,
  Provider,
  PreSubmissionAnalysis,
  DenialPrediction,
  RBMCriteriaMatch,
  GeneratedJustification,
  GeneratedAppeal,
  MedicalHistoryItem,
  CriteriaItem,
  ConservativeTreatment,
} from "@/lib/demos/ins/types";

export const insurancePlans: InsurancePlan[] = [
  { id: "INS-001", name: "BlueCross BlueShield PPO", type: "PPO", rbmVendor: "eviCore", priorAuthRequired: true, groupNumber: "BCBS-PPO-2024", effectiveDate: "2024-01-01" },
  { id: "INS-002", name: "Aetna HMO", type: "HMO", rbmVendor: "AIM", priorAuthRequired: true, groupNumber: "AETNA-HMO-500", effectiveDate: "2024-01-01" },
  { id: "INS-003", name: "UnitedHealthcare Choice Plus", type: "Commercial", rbmVendor: "Carelon", priorAuthRequired: true, groupNumber: "UHC-COMM-750", effectiveDate: "2024-01-01" },
  { id: "INS-004", name: "Medicare Advantage - Humana Gold", type: "Medicare Advantage", rbmVendor: "Internal", priorAuthRequired: true, groupNumber: "H5216-042", effectiveDate: "2024-01-01" },
  { id: "INS-005", name: "Humana Commercial", type: "Commercial", rbmVendor: "Cohere", priorAuthRequired: true, groupNumber: "HUM-COMM-300", effectiveDate: "2024-01-01" },
];

export const providers: Provider[] = [
  { id: "PROV-001", name: "Dr. Sarah Mitchell", npi: "1234567890", specialty: "Orthopedic Surgery", facility: "Metro Spine & Orthopedics", phone: "(555) 123-4567", fax: "(555) 123-4568" },
  { id: "PROV-002", name: "Dr. James Chen", npi: "0987654321", specialty: "Neurology", facility: "Neuroscience Associates", phone: "(555) 234-5678", fax: "(555) 234-5679" },
  { id: "PROV-003", name: "Dr. Maria Rodriguez", npi: "1122334455", specialty: "Pulmonology/Oncology", facility: "Regional Cancer Center", phone: "(555) 345-6789", fax: "(555) 345-6790" },
];

const patientAMedicalHistory: MedicalHistoryItem[] = [
  { id: "MH-A1", condition: "Chronic Low Back Pain", icdCode: "M54.5", diagnosedDate: "2022-03-15", status: "chronic", treatingProvider: "Dr. Sarah Mitchell", notes: "Ongoing management" },
  { id: "MH-A2", condition: "Lumbar Disc Herniation L4-L5", icdCode: "M51.16", diagnosedDate: "2023-06-20", status: "active", treatingProvider: "Dr. Sarah Mitchell", notes: "Confirmed on imaging" },
  { id: "MH-A3", condition: "Lumbar Radiculopathy", icdCode: "M54.16", diagnosedDate: "2023-08-10", status: "active", treatingProvider: "Dr. Sarah Mitchell", notes: "Left L5 distribution" },
  { id: "MH-A4", condition: "Hypertension", icdCode: "I10", diagnosedDate: "2019-05-01", status: "chronic", notes: "Well controlled" },
];

const patientBMedicalHistory: MedicalHistoryItem[] = [
  { id: "MH-B1", condition: "Tension-type Headache", icdCode: "G44.209", diagnosedDate: "2024-11-01", status: "active", treatingProvider: "Dr. James Chen", notes: "New onset, 3 weeks" },
  { id: "MH-B2", condition: "Anxiety Disorder", icdCode: "F41.9", diagnosedDate: "2023-02-15", status: "active", notes: "Managed with counseling" },
];

const patientCMedicalHistory: MedicalHistoryItem[] = [
  { id: "MH-C1", condition: "Lung Nodule - Suspicious", icdCode: "R91.1", diagnosedDate: "2024-12-01", status: "active", treatingProvider: "Dr. Maria Rodriguez", notes: "2.3cm RUL nodule" },
  { id: "MH-C2", condition: "Suspected Lung Malignancy", icdCode: "C34.90", diagnosedDate: "2024-12-10", status: "active", treatingProvider: "Dr. Maria Rodriguez", notes: "High suspicion" },
  { id: "MH-C3", condition: "COPD", icdCode: "J44.9", diagnosedDate: "2018-04-20", status: "chronic", notes: "40 pack-year smoking" },
  { id: "MH-C4", condition: "Type 2 Diabetes", icdCode: "E11.9", diagnosedDate: "2015-08-10", status: "chronic", notes: "A1c 6.8" },
];

export const patients: Patient[] = [
  { id: "PAT-001", firstName: "Robert", lastName: "Thompson", dateOfBirth: "1966-04-12", gender: "male", memberId: "BCBS-558742190", insurancePlan: insurancePlans[0]!, medicalHistory: patientAMedicalHistory, contactInfo: { phone: "(555) 111-2222", email: "r.thompson@email.com", address: { street: "1234 Oak Street", city: "Springfield", state: "IL", zipCode: "62701" } } },
  { id: "PAT-002", firstName: "Jennifer", lastName: "Martinez", dateOfBirth: "1989-08-23", gender: "female", memberId: "AETNA-334521876", insurancePlan: insurancePlans[1]!, medicalHistory: patientBMedicalHistory, contactInfo: { phone: "(555) 333-4444", email: "j.martinez@email.com", address: { street: "567 Maple Avenue", city: "Chicago", state: "IL", zipCode: "60601" } } },
  { id: "PAT-003", firstName: "William", lastName: "Anderson", dateOfBirth: "1957-11-30", gender: "male", memberId: "H5216-887432156", insurancePlan: insurancePlans[3]!, medicalHistory: patientCMedicalHistory, contactInfo: { phone: "(555) 555-6666", email: "w.anderson@email.com", address: { street: "890 Pine Road", city: "Naperville", state: "IL", zipCode: "60540" } } },
];

const patientAConservativeTreatments: ConservativeTreatment[] = [
  { type: "Physical Therapy", startDate: "2024-01-15", endDate: "2024-04-15", duration: "12 weeks", outcome: "no-change", provider: "ProHealth PT", notes: "24 sessions" },
  { type: "NSAIDs (Meloxicam 15mg)", startDate: "2023-09-01", endDate: "2024-06-01", duration: "9 months", outcome: "no-change", provider: "Dr. Sarah Mitchell", notes: "Daily use" },
  { type: "Epidural Steroid Injection", startDate: "2024-05-20", duration: "Single injection", outcome: "no-change", provider: "Metro Pain Management", notes: "3 weeks relief only" },
  { type: "Chiropractic Care", startDate: "2024-02-01", endDate: "2024-03-15", duration: "6 weeks", outcome: "worsened", provider: "Spine Wellness", notes: "Discontinued" },
];

export const imagingOrders: ImagingOrder[] = [
  {
    id: "ORD-001", patientId: "PAT-001", orderingProvider: providers[0]!, imagingType: "MRI", cptCode: "72148", cptDescription: "MRI Lumbar Spine without Contrast", bodyPart: "Lumbar Spine", laterality: "n/a", contrast: false,
    clinicalIndication: "Chronic low back pain with left lower extremity radiculopathy. Failed 12 weeks PT, 9 months NSAIDs, one ESI. Progressive symptoms, positive SLR.",
    icdCodes: ["M54.5", "M51.16", "M54.16"], icdDescriptions: ["Low back pain", "Disc degeneration lumbar", "Radiculopathy lumbar"], urgency: "routine",
    clinicalNotes: "58-year-old male, 18-month history. Physical exam: decreased L5 sensation, positive SLR 45° left, decreased ankle reflex, antalgic gait. Failed PT x12w, NSAIDs x9mo, ESI x1, chiro discontinued. 7/10 pain.",
    status: "analyzing", createdAt: "2024-12-15T09:30:00Z", priorImagingDates: ["2023-06-20"], conservativeTreatments: patientAConservativeTreatments,
  },
  {
    id: "ORD-002", patientId: "PAT-002", orderingProvider: providers[1]!, imagingType: "MRI", cptCode: "70553", cptDescription: "MRI Brain with and without Contrast", bodyPart: "Brain", laterality: "n/a", contrast: true,
    clinicalIndication: "New onset headaches for evaluation", icdCodes: ["G44.209"], icdDescriptions: ["Tension-type headache"], urgency: "routine",
    clinicalNotes: "35-year-old female, headaches x 3 weeks. Bilateral, pressure-like. Neurological exam normal. No red flags.", status: "analyzing", createdAt: "2024-12-16T14:15:00Z", conservativeTreatments: [],
  },
  {
    id: "ORD-003", patientId: "PAT-003", orderingProvider: providers[2]!, imagingType: "PET-CT", cptCode: "78815", cptDescription: "PET-CT Skull Base to Mid-Thigh", bodyPart: "Whole Body", laterality: "n/a", contrast: false,
    clinicalIndication: "Staging for suspected primary lung malignancy. 2.3cm spiculated RUL nodule. PET-CT for staging prior to treatment planning.",
    icdCodes: ["C34.90", "R91.1"], icdDescriptions: ["Malignant neoplasm bronchus/lung", "Solitary pulmonary nodule"], urgency: "urgent",
    clinicalNotes: "67-year-old male, 40 pack-year smoking. 2.3cm RUL nodule on CXR/CT, spiculated. Biopsy scheduled 12/20. PET for staging. ECOG 1.", status: "analyzing", createdAt: "2024-12-14T11:00:00Z", priorImagingDates: ["2024-12-01", "2024-12-08"],
  },
];

export const preSubmissionAnalyses: PreSubmissionAnalysis[] = [
  { orderId: "ORD-001", timestamp: "2024-12-15T09:35:00Z", documentationScore: 92, gaps: [{ id: "GAP-001-1", category: "diagnostic", severity: "minor", description: "Previous imaging report not attached", requiredFor: ["RAD-MSK-001.4"], suggestedAction: "Attach prior imaging report", autoFixAvailable: false }], suggestions: ["Consider adding VAS/NRS", "Include functional impact"], estimatedDenialRisk: 15, readyForSubmission: true, analysisDetails: { clinicalIndicationScore: 95, historyDocumentationScore: 90, priorTreatmentScore: 98, diagnosticWorkupScore: 85 } },
  { orderId: "ORD-002", timestamp: "2024-12-16T14:20:00Z", documentationScore: 58, gaps: [{ id: "GAP-002-1", category: "prior-treatment", severity: "critical", description: "No conservative treatment documented", requiredFor: ["RAD-NEURO-002.1"], suggestedAction: "Document 4-6 weeks conservative trial", autoFixAvailable: false }, { id: "GAP-002-2", category: "clinical", severity: "critical", description: "No red flag symptoms", requiredFor: ["RAD-NEURO-002.3"], suggestedAction: "Document red flags if present", autoFixAvailable: false }], suggestions: ["RECOMMEND: 4-6 weeks conservative treatment before resubmit"], estimatedDenialRisk: 85, readyForSubmission: false, analysisDetails: { clinicalIndicationScore: 45, historyDocumentationScore: 60, priorTreatmentScore: 20, diagnosticWorkupScore: 75 } },
  { orderId: "ORD-003", timestamp: "2024-12-14T11:05:00Z", documentationScore: 85, gaps: [{ id: "GAP-003-1", category: "diagnostic", severity: "major", description: "Tissue diagnosis pending", requiredFor: ["ONC-LUNG-001.2"], suggestedAction: "Note biopsy scheduled, rationale for pre-biopsy PET", autoFixAvailable: false }, { id: "GAP-003-2", category: "clinical", severity: "minor", description: "Lung-RADS not specified", requiredFor: ["ONC-LUNG-001.1"], suggestedAction: "Add Lung-RADS 4B", autoFixAvailable: true, fixedText: "Lung-RADS 4B" }], suggestions: ["Emphasize staging for surgical planning"], estimatedDenialRisk: 35, readyForSubmission: true, analysisDetails: { clinicalIndicationScore: 90, historyDocumentationScore: 85, priorTreatmentScore: 100, diagnosticWorkupScore: 80 } },
];

export const denialPredictions: DenialPrediction[] = [
  { orderId: "ORD-001", timestamp: "2024-12-15T09:36:00Z", overallRisk: 15, riskLevel: "low", confidenceScore: 89, factors: [{ id: "RF-001-1", name: "Conservative Treatment Documentation", impact: -25, weight: 0.3, description: "Exceeds RBM requirements", mitigationStrategy: "N/A - strength", isAddressable: false }, { id: "RF-001-2", name: "Prior Imaging", impact: 10, weight: 0.15, description: "Report not attached", mitigationStrategy: "Attach prior reports", isAddressable: true }], historicalDenialRate: 12, similarCasesApproved: 847, similarCasesDenied: 115, recommendations: ["Attach prior reports", "Strong case - proceed"], predictedOutcome: "likely-approved" },
  { orderId: "ORD-002", timestamp: "2024-12-16T14:21:00Z", overallRisk: 85, riskLevel: "critical", confidenceScore: 92, factors: [{ id: "RF-002-1", name: "Missing Conservative Treatment", impact: 35, weight: 0.35, description: "No conservative management", mitigationStrategy: "Document 4-6 weeks trial", isAddressable: true }, { id: "RF-002-2", name: "Imaging Too Early", impact: 25, weight: 0.25, description: "3-week duration insufficient", mitigationStrategy: "Wait 4-6 weeks or document red flags", isAddressable: true }], historicalDenialRate: 78, similarCasesApproved: 156, similarCasesDenied: 554, recommendations: ["STRONGLY RECOMMEND: Delay until conservative trial", "High denial probability"], predictedOutcome: "likely-denied" },
  { orderId: "ORD-003", timestamp: "2024-12-14T11:06:00Z", overallRisk: 35, riskLevel: "medium", confidenceScore: 78, factors: [{ id: "RF-003-1", name: "Pending Tissue Diagnosis", impact: 20, weight: 0.3, description: "Some payers require pathology first", mitigationStrategy: "Document pre-biopsy staging rationale", isAddressable: true }, { id: "RF-003-2", name: "Strong Clinical Indication", impact: -20, weight: 0.25, description: "High-risk nodule, appropriate workup", mitigationStrategy: "N/A - strength", isAddressable: false }], historicalDenialRate: 28, similarCasesApproved: 423, similarCasesDenied: 165, recommendations: ["Add Lung-RADS 4B", "Good chance with minor enhancements"], predictedOutcome: "likely-approved" },
];

const lumbarMRICriteria: CriteriaItem[] = [
  { id: "RAD-MSK-001.1", criteriaCode: "LSP-MRI-001", description: "Low back pain with radiculopathy", category: "clinical-indication", matched: true, evidenceProvided: "L5 radiculopathy, positive SLR", evidenceRequired: "Radicular symptoms", isRequired: true },
  { id: "RAD-MSK-001.2", criteriaCode: "LSP-MRI-002", description: "Failed conservative treatment 6+ weeks", category: "conservative-treatment", matched: true, evidenceProvided: "12w PT, 9mo NSAIDs, ESI", evidenceRequired: "6+ weeks", isRequired: true },
  { id: "RAD-MSK-001.3", criteriaCode: "LSP-MRI-003", description: "Objective neurological findings", category: "physical-exam", matched: true, evidenceProvided: "L5 sensation, SLR, reflex", evidenceRequired: "Motor/sensory/reflex", isRequired: false },
  { id: "RAD-MSK-001.4", criteriaCode: "LSP-MRI-004", description: "Prior imaging or progression", category: "prior-imaging", matched: true, evidenceProvided: "Prior imaging June 2023", evidenceRequired: "Prior report or progression", isRequired: false, alternativesMet: ["Progression documented"] },
  { id: "RAD-MSK-001.5", criteriaCode: "LSP-MRI-005", description: "Symptoms > 4 weeks", category: "duration", matched: true, evidenceProvided: "18-month history", evidenceRequired: "4+ weeks", isRequired: true },
  { id: "RAD-MSK-001.6", criteriaCode: "LSP-MRI-006", description: "No contraindications", category: "contraindication", matched: true, evidenceProvided: "None noted", evidenceRequired: "No contraindications", isRequired: true },
];

const brainMRICriteria: CriteriaItem[] = [
  { id: "RAD-NEURO-002.1", criteriaCode: "BRN-MRI-001", description: "Headache > 4 weeks + conservative OR red flags", category: "clinical-indication", matched: false, evidenceProvided: "3-week duration, no conservative", evidenceRequired: "4+ weeks + treatment failure or red flags", isRequired: true },
  { id: "RAD-NEURO-002.2", criteriaCode: "BRN-MRI-002", description: "Trial of conservative treatment", category: "conservative-treatment", matched: false, evidenceProvided: null, evidenceRequired: "4-6 weeks analgesic trial", isRequired: true },
  { id: "RAD-NEURO-002.3", criteriaCode: "BRN-MRI-003", description: "Red flag symptoms", category: "red-flags", matched: false, evidenceProvided: "No red flags", evidenceRequired: "Red flag present", isRequired: false },
  { id: "RAD-NEURO-002.4", criteriaCode: "BRN-MRI-004", description: "Abnormal neuro exam", category: "physical-exam", matched: false, evidenceProvided: "Normal exam", evidenceRequired: "Abnormalities", isRequired: false },
  { id: "RAD-NEURO-002.5", criteriaCode: "BRN-MRI-005", description: "Change in headache pattern", category: "clinical-indication", matched: false, evidenceProvided: "New onset", evidenceRequired: "Change from baseline", isRequired: false },
  { id: "RAD-NEURO-002.6", criteriaCode: "BRN-MRI-006", description: "Immunocompromised", category: "clinical-indication", matched: false, evidenceProvided: null, evidenceRequired: "HIV, transplant, etc.", isRequired: false },
];

const petCTOncologyCriteria: CriteriaItem[] = [
  { id: "ONC-LUNG-001.1", criteriaCode: "PET-LUNG-001", description: "Suspicious pulmonary nodule on CT", category: "clinical-indication", matched: true, evidenceProvided: "2.3cm spiculated RUL", evidenceRequired: "CT with suspicious lesion", isRequired: true },
  { id: "ONC-LUNG-001.2", criteriaCode: "PET-LUNG-002", description: "Staging in known/suspected malignancy", category: "clinical-indication", matched: true, evidenceProvided: "Staging, surgical planning", evidenceRequired: "Staging intent", isRequired: true },
  { id: "ONC-LUNG-001.3", criteriaCode: "PET-LUNG-003", description: "Prior CT chest", category: "prior-imaging", matched: true, evidenceProvided: "CT 12/8/24", evidenceRequired: "Recent CT chest", isRequired: true },
  { id: "ONC-LUNG-001.4", criteriaCode: "PET-LUNG-004", description: "Candidate for curative treatment", category: "clinical-indication", matched: true, evidenceProvided: "ECOG 1, surgical planned", evidenceRequired: "Treatment candidacy", isRequired: true },
  { id: "ONC-LUNG-001.5", criteriaCode: "PET-LUNG-005", description: "Not for screening", category: "clinical-indication", matched: true, evidenceProvided: "Diagnostic/staging", evidenceRequired: "Clear indication", isRequired: true },
  { id: "ONC-LUNG-001.6", criteriaCode: "PET-LUNG-006", description: "4+ weeks since prior PET", category: "prior-imaging", matched: true, evidenceProvided: "No prior PET", evidenceRequired: "4-week interval", isRequired: false },
];

export const rbmCriteriaMatches: RBMCriteriaMatch[] = [
  { orderId: "ORD-001", rbmVendor: "eviCore", guidelineVersion: "2024.1", guidelineDate: "2024-01-01", matchedCriteria: lumbarMRICriteria.filter((c) => c.matched), unmatchedCriteria: lumbarMRICriteria.filter((c) => !c.matched), overallMatchScore: 100, specificGuideline: "RAD-MSK: Lumbar Spine MRI", guidelineReference: "eviCore MSK Guidelines v2024.1", guidelineCategory: "Musculoskeletal", requirementsMetCount: 6, requirementsTotalCount: 6 },
  { orderId: "ORD-002", rbmVendor: "AIM", guidelineVersion: "2024.2", guidelineDate: "2024-07-01", matchedCriteria: brainMRICriteria.filter((c) => c.matched), unmatchedCriteria: brainMRICriteria.filter((c) => !c.matched), overallMatchScore: 0, specificGuideline: "RAD-NEURO: Brain MRI Headache", guidelineReference: "AIM Neuroimaging v2024.2", guidelineCategory: "Neurological", requirementsMetCount: 0, requirementsTotalCount: 6 },
  { orderId: "ORD-003", rbmVendor: "Internal", guidelineVersion: "2024.3", guidelineDate: "2024-10-01", matchedCriteria: petCTOncologyCriteria.filter((c) => c.matched), unmatchedCriteria: petCTOncologyCriteria.filter((c) => !c.matched), overallMatchScore: 100, specificGuideline: "ONC-LUNG: PET-CT Staging", guidelineReference: "Medicare LCD L35013", guidelineCategory: "Oncology", requirementsMetCount: 6, requirementsTotalCount: 6 },
];

const justificationNarrative1 = `CLINICAL JUSTIFICATION FOR LUMBAR MRI

Patient: Robert Thompson, 58-year-old male. Ordering Provider: Dr. Sarah Mitchell.

CLINICAL PRESENTATION: 18-month chronic low back pain with left L5 radiculopathy, 7/10 pain, impacting work and daily activities.

PHYSICAL EXAM: Positive SLR 45° left, decreased L5 sensation, diminished ankle reflex, antalgic gait.

CONSERVATIVE TREATMENT: PT 24 sessions/12 weeks, NSAIDs 9 months, ESI with temporary relief, chiropractic discontinued. All failed or inadequate.

MEDICAL NECESSITY: MRI indicated to correlate anatomy with radiculopathy, assess surgical candidacy, rule out structural pathology. Meets eviCore RAD-MSK criteria.`;

export const generatedJustifications: GeneratedJustification[] = [
  { orderId: "ORD-001", narrative: justificationNarrative1, keyPoints: ["18-month chronic LBP with L5 radiculopathy", "Objective findings: SLR, sensory deficit, reflex change", "Failed 12w PT, 9mo NSAIDs, ESI", "Imaging for surgical evaluation"], supportingEvidence: ["PT notes", "Medication records", "Exam findings", "Prior imaging ref"], clinicalRationale: "MRI indicated for failed conservative management with objective deficits.", wordCount: 180, generatedAt: "2024-12-15T09:40:00Z", version: 1, tone: "clinical" },
  { orderId: "ORD-002", narrative: "Headache justification placeholder – recommend 4-6 weeks conservative trial before imaging.", keyPoints: ["New onset headache", "No conservative treatment", "Normal exam"], supportingEvidence: [], clinicalRationale: "Imaging not indicated until conservative trial completed per guidelines.", wordCount: 25, generatedAt: "2024-12-16T14:25:00Z", version: 1, tone: "concise" },
  { orderId: "ORD-003", narrative: "PET-CT staging for suspected lung malignancy. 2.3cm spiculated RUL nodule, high-risk features. Staging to guide surgical vs systemic therapy. Prior CT chest completed. ECOG 1.", keyPoints: ["Staging for suspected malignancy", "High-risk nodule", "Surgical planning"], supportingEvidence: ["CT chest", "Risk assessment"], clinicalRationale: "PET-CT medically necessary for staging.", wordCount: 45, generatedAt: "2024-12-14T11:10:00Z", version: 1, tone: "clinical" },
];

export const generatedAppeals: GeneratedAppeal[] = [
  {
    orderId: "ORD-002", appealType: "first-level",
    letterContent: `[SAMPLE APPEAL] Date: December 18, 2024. Re: Appeal – Jennifer Martinez, AETNA-334521876. Denied: MRI Brain (CPT 70553). Denial: Insufficient conservative treatment.

Dear Medical Director, I appeal the denial. Since submission: headache frequency increased to daily; new visual disturbances; trial acetaminophen 2 weeks, ibuprofen 2 weeks – no relief; headache diary shows progression. AHS guidelines recommend imaging for progressive pattern and new neurological symptoms. Request approval. Available for peer-to-peer. Dr. James Chen, MD, Neurology.`,
    citedGuidelines: ["American Headache Society Neuroimaging Guidelines", "AIM Neuroimaging – Exceptions for Progression"], supportingLiterature: [{ title: "Diagnostic Testing for Headaches", authors: "Evans RW, et al.", journal: "Neurol Clin", year: 2019, relevance: "Imaging when progressive pattern" }], peerToPeerRequested: true, generatedAt: "2024-12-18T10:00:00Z", denialReason: "Insufficient conservative treatment trial", denialDate: "2024-12-17", originalAuthNumber: "PA-2024-789456",
  },
];
