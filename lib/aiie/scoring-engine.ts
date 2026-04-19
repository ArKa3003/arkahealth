/**
 * This is the shared brain between ARKA-CLIN and ARKA-INS. Any change affects both products.
 *
 * Methodology: RAND/UCLA appropriateness framing with GRADE-style explicitness for factor
 * contributions (evidence-to-decision transparency). Weights follow the INS prompt; each
 * factor emits a bounded SHAP-style delta from the neutral baseline.
 */

import type {
  AIIEScore,
  AIIEInput,
  AIIEFactor,
  AIIERedFlags,
} from "@/lib/types/aiie";

import { invertToDenialRisk } from "@/lib/aiie/denial-risk";

const BASELINE = 5;
/** Scale so that fully aligned signals move roughly ±4 from baseline before rounding. */
const DELTA_SCALE = 4;

const W_INDICATION = 0.3;
const W_PRIOR_REDUNDANCY = 0.2;
const W_RED_FLAGS = 0.2;
const W_GUIDELINE = 0.15;
const W_PATIENT_RISK = 0.1;
const W_RADIATION = 0.05;

/**
 * Computes ARKA AIIE appropriateness and payer-facing denial-risk proxy for an imaging order.
 *
 * @param input - Structured clinical and order context aligned with `lib/types/aiie.ts`.
 * @returns Promise resolving to a bounded `AIIEScore` with SHAP-style factors and narrative.
 */
export async function scoreOrder(input: AIIEInput): Promise<AIIEScore> {
  const clinical = input.clinicalFactors;
  const red = clinical.redFlags;

  const indicationSignal = computeIndicationSignal(input, clinical.symptoms);
  const priorSignal = computePriorRedundancySignal(clinical);
  const redFlagSignal = computeRedFlagSignal(red);
  const guidelineSignal = computeGuidelineSignal(clinical);
  const riskSignal = computePatientRiskSignal(input.patient, red);
  const radiationSignal = computeRadiationSignal(input.order.modality);

  const factors: AIIEFactor[] = [
    buildFactor(
      "clinical_indication",
      "Clinical indication strength",
      W_INDICATION,
      indicationSignal,
      indicationSignal > 0.35,
      "GRADE summary-of-findings framing for symptom–test concordance; RAND/UCLA indication panels.",
    ),
    buildFactor(
      "prior_imaging_redundancy",
      "Prior imaging redundancy",
      W_PRIOR_REDUNDANCY,
      priorSignal,
      clinical.priorImaging,
      "Choosing Wisely / ACR appropriateness criteria on redundant imaging in stable presentations.",
    ),
    buildFactor(
      "red_flag_symptoms",
      "Red flag symptoms",
      W_RED_FLAGS,
      redFlagSignal,
      redFlagSignal > 0.25,
      "ACEP / specialty red-flag guidance for urgent diagnoses requiring expedited imaging.",
    ),
    buildFactor(
      "guideline_alignment",
      "Guideline alignment",
      W_GUIDELINE,
      guidelineSignal,
      guidelineSignal > 0.2,
      "GRADE evidence-to-decision tables favoring conservative care before advanced imaging when appropriate.",
    ),
    buildFactor(
      "patient_risk_factors",
      "Patient risk factors",
      W_PATIENT_RISK,
      riskSignal,
      riskSignal > 0.25,
      "Population risk modifiers (age, immunosuppression, pregnancy) per consensus screening guidance.",
    ),
    buildFactor(
      "radiation_exposure",
      "Radiation exposure burden",
      W_RADIATION,
      radiationSignal,
      radiationSignal < -0.05,
      "BEIR / ICRP-informed trade-offs for ionizing modalities versus lower-energy alternatives.",
    ),
  ];

  const rawDelta = factors.reduce((sum, f) => sum + f.contribution, 0);
  const clinicalScore = clampInt(Math.round(BASELINE + rawDelta), 1, 9);
  const denialRisk = invertToDenialRisk(clinicalScore);
  const confidence = computeConfidence(input);

  const narrativeRationale = buildNarrative(factors, clinicalScore);

  return {
    clinicalScore,
    denialRisk,
    confidence,
    factors,
    narrativeRationale,
  };
}

function contributionFor(weight: number, signal: number): number {
  return weight * signal * DELTA_SCALE;
}

function buildFactor(
  id: string,
  name: string,
  weight: number,
  signal: number,
  present: boolean,
  evidenceCitation: string,
): AIIEFactor {
  return {
    id,
    name,
    weight,
    contribution: contributionFor(weight, signal),
    present,
    evidenceCitation,
  };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeIndicationSignal(
  input: AIIEInput,
  symptoms: string[],
): number {
  const complaint =
    `${input.chiefComplaint} ${input.clinicalFactors.chiefComplaint}`.toLowerCase();
  const symptomScore = Math.min(1, symptoms.length / 6 + 0.15);
  const complaintDepth = Math.min(1, complaint.length / 120);
  let modalityFit = 0.35;
  const modality = `${input.order.modality} ${input.requestedModality}`.toLowerCase();
  if (modality.includes("mri") && /neuro|spine|cord|ms\b/i.test(complaint)) {
    modalityFit = 0.85;
  }
  if (modality.includes("ct") && /trauma|hemorrhage|stroke|sah/i.test(complaint)) {
    modalityFit = 0.9;
  }
  if (modality.includes("us") || modality.includes("ultrasound")) {
    modalityFit = Math.max(modalityFit, 0.55);
  }
  const blended = (symptomScore + complaintDepth + modalityFit) / 3;
  return clampSignal((blended - 0.45) * 2.1);
}

function computePriorRedundancySignal(
  clinical: AIIEInput["clinicalFactors"],
): number {
  if (!clinical.priorImaging) {
    return 0.35;
  }
  const timeframe = (clinical.priorImagingTimeframe ?? "").toLowerCase();
  const recent =
    /\b(0|1|2|3)\s*(day|week|month)s?\b/.test(timeframe) ||
    timeframe.includes("recent");
  const conservative = clinical.conservativeManagementTried;
  if (recent && !conservative) {
    return -0.85;
  }
  if (recent) {
    return -0.45;
  }
  if (!conservative) {
    return -0.35;
  }
  return 0.05;
}

function computeRedFlagSignal(red: AIIERedFlags): number {
  const count = Object.values(red).filter(Boolean).length;
  const severityBoost =
    (red.neurologicalDeficit ||
      red.bladderBowelDysfunction ||
      red.cancerHistory) ?
      0.25
    : 0;
  const signal = Math.min(1, count / 6 + severityBoost);
  return clampSignal((signal - 0.35) * 1.8);
}

function computeGuidelineSignal(
  clinical: AIIEInput["clinicalFactors"],
): number {
  if (clinical.conservativeManagementTried) {
    const dur = (clinical.conservativeManagementDuration ?? "").toLowerCase();
    const adequate =
      /\b(4|6|8)\s*weeks?\b/.test(dur) ||
      dur.includes("month") ||
      dur.includes("physical therapy") ||
      dur.includes("pt");
    return adequate ? 0.75 : 0.45;
  }
  return -0.15;
}

function computePatientRiskSignal(
  patient: AIIEInput["patient"],
  red: AIIERedFlags,
): number {
  let v = 0.25;
  if (patient.age >= 65 || patient.age <= 5) {
    v += 0.2;
  }
  if (patient.pregnant) {
    v += 0.15;
  }
  if (red.immunocompromised) {
    v += 0.2;
  }
  return clampSignal((v - 0.45) * 1.6);
}

function computeRadiationSignal(modality: string): number {
  const m = modality.toLowerCase();
  if (m.includes("pet") || m.includes("nuclear") || /\bct\b/.test(m)) {
    return -0.95;
  }
  if (m.includes("x-ray") || m.includes("xr")) {
    return -0.25;
  }
  if (m.includes("mri") || m.includes("us") || m.includes("ultrasound")) {
    return 0.15;
  }
  return -0.05;
}

function clampSignal(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function computeConfidence(input: AIIEInput): number {
  let score = 0.62;
  if (input.symptoms.length > 0) {
    score += 0.06;
  }
  if (input.chiefComplaint.trim().length > 12) {
    score += 0.06;
  }
  if (input.clinicalFactors.priorImagingTimeframe) {
    score += 0.05;
  }
  if (input.clinicalFactors.conservativeManagementDuration) {
    score += 0.05;
  }
  if (input.order.cpt) {
    score += 0.04;
  }
  if (input.coverage?.payerName) {
    score += 0.04;
  }
  return Math.min(0.95, score);
}

function buildNarrative(factors: AIIEFactor[], clinicalScore: number): string {
  const sorted = [...factors].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );
  const topPos = sorted.filter((f) => f.contribution > 0).slice(0, 2);
  const topNeg = sorted.filter((f) => f.contribution < 0).slice(0, 2);
  const posText =
    topPos.length > 0 ?
      `Supportive drivers include ${topPos.map((f) => f.name.toLowerCase()).join(" and ")}.`
    : "Supportive drivers are modest for this presentation.";
  const negText =
    topNeg.length > 0 ?
      ` Factors tempering appropriateness include ${topNeg.map((f) => f.name.toLowerCase()).join(" and ")}.`
    : "";
  return `Overall appropriateness maps to ${clinicalScore}/9 on the RAND/UCLA-style scale. ${posText}${negText} Contributions are reported as transparent, GRADE-aligned deltas from a neutral baseline of ${BASELINE}.`;
}
