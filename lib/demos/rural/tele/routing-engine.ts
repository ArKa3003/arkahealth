import type { AITriageResult, RoutingDecision, TeleStudy } from "@/lib/demos/rural/types";

function routingDecision(overrides: Partial<RoutingDecision["factors"]> = {}): RoutingDecision {
  return {
    selectedProvider: "Demo Teleradiology Group",
    reason: "Demo routing by availability and subspecialty fit",
    factors: {
      studyComplexity: "moderate",
      subspecialtyNeeded: null,
      estimatedTurnaround: 45,
      costPerRead: 85,
      qualityScore: 92,
      ...overrides,
    },
    alternativeProviders: ["Regional Night Hawk", "Academic Overflow"],
  };
}

function aiTriage(priority: AITriageResult["priority"]): AITriageResult {
  return {
    algorithmName: "ARKA Demo Triage",
    vendor: "Demo",
    priority,
    findings: [],
    confidence: 0.86,
    processingTimeMs: 420,
    flaggedForImmediateReview: priority === "critical",
  };
}

/** Demo queue for prioritizer — fully typed against TeleStudy */
export const demoTeleStudies: TeleStudy[] = [
  {
    id: "t1",
    facilityId: "fac-001",
    patientId: "p-demo-1",
    modality: "CT",
    bodyPart: "head",
    studyDate: new Date().toISOString().slice(0, 10),
    clinicalContextPackage: {
      orderingIndication: "Headache, red flags",
      relevantHistory: [],
      labValues: [],
      priorImagingFindings: [],
      arkaClnScore: 7,
      arkaClnCategory: "usually-appropriate",
      redFlags: [],
      medications: [],
      allergies: [],
      clinicalQuestion: "Rule out acute intracranial process",
    },
    aiTriageResult: aiTriage("urgent"),
    routingDecision: routingDecision({ estimatedTurnaround: 25, qualityScore: 94 }),
    status: "queued",
    submittedAt: new Date().toISOString(),
  },
  {
    id: "t2",
    facilityId: "fac-002",
    patientId: "p-demo-2",
    modality: "X-ray",
    bodyPart: "chest",
    studyDate: new Date().toISOString().slice(0, 10),
    clinicalContextPackage: {
      orderingIndication: "Cough",
      relevantHistory: [],
      labValues: [],
      priorImagingFindings: [],
      arkaClnScore: 5,
      arkaClnCategory: "may-be-appropriate",
      redFlags: [],
      medications: [],
      allergies: [],
      clinicalQuestion: "Evaluate for pneumonia",
    },
    aiTriageResult: aiTriage("routine"),
    routingDecision: routingDecision({ estimatedTurnaround: 120, qualityScore: 88 }),
    status: "queued",
    submittedAt: new Date().toISOString(),
  },
  {
    id: "t3",
    facilityId: "fac-001",
    patientId: "p-demo-3",
    modality: "CT-with-contrast",
    bodyPart: "chest",
    studyDate: new Date().toISOString().slice(0, 10),
    clinicalContextPackage: {
      orderingIndication: "PE rule-out",
      relevantHistory: [],
      labValues: [],
      priorImagingFindings: [],
      arkaClnScore: 8,
      arkaClnCategory: "usually-appropriate",
      redFlags: ["hypoxia"],
      medications: [],
      allergies: [],
      clinicalQuestion: "Suspected pulmonary embolism",
    },
    aiTriageResult: aiTriage("critical"),
    routingDecision: routingDecision({ studyComplexity: "complex", estimatedTurnaround: 18, qualityScore: 96 }),
    status: "assigned",
    submittedAt: new Date().toISOString(),
  },
];

function triageRank(s: TeleStudy): number {
  const p = s.aiTriageResult?.priority;
  if (p === "critical") return 3;
  if (p === "urgent") return 2;
  return 1;
}

export function assignProviderQueue(studies: TeleStudy[]): TeleStudy[] {
  return [...studies].sort((a, b) => triageRank(b) - triageRank(a) || b.routingDecision.factors.qualityScore - a.routingDecision.factors.qualityScore);
}

export function suggestSubspecialty(modality: string): string {
  if (modality.toLowerCase().includes("mr")) return "MSK / Neuro";
  if (modality.toLowerCase().includes("ct")) return "Body / ED";
  return "General diagnostic";
}
