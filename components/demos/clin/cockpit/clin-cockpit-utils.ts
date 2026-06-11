import type { ClinicalScenario, EvaluationResult } from "@/lib/demos/clin/types";

/** Severity dot color for demo scenario list items. */
export type ScenarioSeverity = "success" | "warning" | "danger";

/**
 * Maps demo scenario titles to severity for list dots.
 */
export function getScenarioSeverity(title: string): ScenarioSeverity {
  if (
    title.includes("Usually Not Appropriate") ||
    title.includes("Radiation Awareness") ||
    title.includes("Contraindication") ||
    title.includes("Contrast Safety")
  ) {
    return "danger";
  }
  if (title.includes("Usually Appropriate")) {
    return "success";
  }
  return "warning";
}

/**
 * Demo-safe hashed MRN display from patient id.
 */
export function displayHashedMrn(patientId: string): string {
  let hash = 0;
  for (let i = 0; i < patientId.length; i += 1) {
    hash = (hash << 5) - hash + patientId.charCodeAt(i);
    hash |= 0;
  }
  return `MRN ${Math.abs(hash).toString(16).slice(0, 8).padStart(8, "0")}`;
}

/**
 * Inverse denial-risk percentage from AIIE score (9 → 0%, 1 → 100%).
 */
export function computeDenialRisk(score: number): number {
  const clamped = Math.min(9, Math.max(1, score));
  return Math.round(((9 - clamped) / 8) * 100);
}

/**
 * Slug for /evidence/[slug] links from factor name.
 */
export function factorEvidenceSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type RecommendationState = "appropriate" | "conditional" | "low-value";

/**
 * Maps evaluation result to cockpit recommendation card state.
 */
export function getRecommendationState(result: EvaluationResult): RecommendationState {
  const { category } = result.appropriatenessScore;
  if (category === "usually-appropriate") return "appropriate";
  if (category === "usually-not-appropriate") return "low-value";
  return "conditional";
}

/**
 * Active problems derived from scenario for patient context card.
 */
export function deriveActiveProblems(scenario: ClinicalScenario): string[] {
  const problems: string[] = [];
  if (scenario.chiefComplaint.trim()) {
    problems.push(scenario.chiefComplaint.trim());
  }
  const presentRedFlags = scenario.redFlags.filter((r) => r.present).map((r) => r.flag);
  for (const flag of presentRedFlags.slice(0, 2)) {
    if (!problems.some((p) => p.toLowerCase().includes(flag.toLowerCase()))) {
      problems.push(flag);
    }
  }
  return problems.slice(0, 4);
}

/**
 * Allergies list for patient context card.
 */
export function deriveAllergies(scenario: ClinicalScenario): string[] {
  const allergies: string[] = [];
  if (scenario.contrastAllergy?.hasAllergy) {
    const type = scenario.contrastAllergy.allergyType ?? "contrast";
    allergies.push(`${type === "both" ? "Iodinated & gadolinium" : type} contrast`);
  }
  return allergies;
}

export const EVALUATION_STEPS = [
  "Parsing order",
  "Matching AIIE Knowledge Matrix",
  "Scoring factors",
  "Building recommendation",
] as const;

export const STEP_DURATION_MS = 300;
