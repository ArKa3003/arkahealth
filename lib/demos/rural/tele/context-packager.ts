import type {
  ClinicalContextPackage,
  TeleStudy,
  TeleradiologyProvider,
  RoutingDecision,
  TeleradiologyService,
} from "../types";

/** Maps short subspecialty keys (e.g. "neuro") to service tags on providers. */
const SUBSPECIALTY_SERVICE: Record<string, TeleradiologyService> = {
  neuro: "subspecialty-neuro",
  msk: "subspecialty-msk",
  pediatric: "subspecialty-pediatric",
  cardiac: "subspecialty-cardiac",
  body: "subspecialty-body",
};

/**
 * Package clinical context for teleradiology read.
 * This assembles all relevant data that a remote radiologist needs,
 * filling the gap that makes rural teleradiology reads less accurate.
 */
export function packageClinicalContext(params: {
  orderIndication: string;
  patientHistory: string[];
  labs: {
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
    date: string;
  }[];
  priorFindings: string[];
  arkaScore: number;
  arkaCategory: string;
  redFlags: string[];
  medications: string[];
  allergies: string[];
  clinicalQuestion: string;
}): ClinicalContextPackage {
  return {
    orderingIndication: params.orderIndication,
    relevantHistory: params.patientHistory,
    labValues: params.labs,
    priorImagingFindings: params.priorFindings,
    arkaClnScore: params.arkaScore,
    arkaClnCategory: params.arkaCategory,
    redFlags: params.redFlags,
    medications: params.medications,
    allergies: params.allergies,
    clinicalQuestion: params.clinicalQuestion,
  };
}

/**
 * Route a study to the optimal teleradiology provider.
 * Evaluates all available providers and selects the best match based on
 * study complexity, subspecialty needs, turnaround, cost, and quality.
 */
export function routeToOptimalProvider(
  study: Pick<TeleStudy, "modality" | "bodyPart">,
  urgency: "stat" | "urgent" | "routine",
  subspecialtyNeeded: string | null,
  providers: TeleradiologyProvider[]
): RoutingDecision {
  const active = providers.filter((p) => p.contractStatus === "active");
  if (active.length === 0) {
    return {
      selectedProvider: "—",
      reason: "No active teleradiology contracts available for routing.",
      factors: {
        studyComplexity: "moderate",
        subspecialtyNeeded,
        estimatedTurnaround: 0,
        costPerRead: 0,
        qualityScore: 0,
      },
      alternativeProviders: [],
    };
  }

  const scored = active
    .map((p) => {
      let score = 0;

      if (urgency === "stat" && p.servicesProvided.includes("emergency-stat")) score += 30;
      if (urgency === "stat" && p.availableHours === "24/7") score += 20;

      if (subspecialtyNeeded) {
        const key = subspecialtyNeeded.toLowerCase();
        const subService = SUBSPECIALTY_SERVICE[key];
        if (subService && p.servicesProvided.includes(subService)) score += 25;
      }

      score += p.qualityScore * 0.2;
      score += Math.max(0, 20 - p.averageTurnaroundMinutes / 5);
      score += Math.max(0, 10 - p.costPerRead / 10);

      if (p.servicesProvided.includes("ai-triage")) score += 10;

      return { provider: p, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = scored[0]!;
  const complexity = subspecialtyNeeded ? "complex" : urgency === "stat" ? "moderate" : "simple";

  return {
    selectedProvider: selected.provider.name,
    reason: `Selected based on ${urgency === "stat" ? "STAT availability, " : ""}${subspecialtyNeeded ? subspecialtyNeeded + " subspecialty coverage, " : ""}quality score ${selected.provider.qualityScore}/100, and ${selected.provider.averageTurnaroundMinutes}-min average turnaround.`,
    factors: {
      studyComplexity: complexity,
      subspecialtyNeeded,
      estimatedTurnaround: selected.provider.averageTurnaroundMinutes,
      costPerRead: selected.provider.costPerRead,
      qualityScore: selected.provider.qualityScore,
    },
    alternativeProviders: scored.slice(1).map((s) => s.provider.name),
  };
}
