import { createHash } from "node:crypto";

import { invertToDenialRisk } from "@/lib/aiie/denial-risk";
import { evaluateStat } from "@/lib/aiie/stat-gate";
import { scoreOrder } from "@/lib/aiie/scoring-engine";
import { traumaGate } from "@/lib/aiie/trauma-gate";
import { getImagingRatingsForCase } from "@/lib/demos/ed";
import type { Case } from "@/lib/demos/ed/types";
import type { ImagingOption } from "@/lib/demos/ed/types";
import type {
  AIIEClinicalFactors,
  AIIEInput,
  AIIEOrder,
  AIIERedFlags,
  AIIEScore,
} from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

import type { EdCockpitCase } from "./ed-cockpit-cases";
import {
  extractEdRedFlags,
  getDisposition,
  getImagingOptionById,
  isExpediteCase,
  type EdCaseEvaluationBundle,
} from "./ed-cockpit-utils";

const MODALITY_LABEL: Record<string, string> = {
  xray: "X-ray",
  ct: "CT",
  mri: "MRI",
  ultrasound: "Ultrasound",
  nuclear: "Nuclear Medicine",
  fluoroscopy: "Fluoroscopy",
  mammography: "Mammography",
  pet: "PET-CT",
  none: "None",
};

/**
 * Maps an ED imaging option to an {@link AIIEOrder}.
 */
export function imagingOptionToAIIEOrder(option: ImagingOption): AIIEOrder {
  const baseModality = MODALITY_LABEL[option.modality] ?? option.modality;
  const modality =
    option.modality === "ct" && option.with_contrast
      ? "CT with contrast"
      : option.modality === "mri" && option.with_contrast
        ? "MRI with contrast"
        : baseModality;

  return {
    modality,
    bodyPart: option.body_region,
    procedure: option.name,
  };
}

/**
 * Parses case narrative into structured AIIE red flags.
 */
function mapCaseRedFlags(caseData: Case): AIIERedFlags {
  const text = [
    caseData.chief_complaint,
    caseData.clinical_vignette,
    caseData.physical_exam ?? "",
    ...(caseData.patient_history ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const has = (pattern: RegExp) => pattern.test(text);

  return {
    cancerHistory: has(/\bcancer\b|\bmalignan|\bcarcinoma\b/),
    neurologicalDeficit: has(/\bweakness\b|\bnumbness\b|\bdeficit\b|\bsphincter\b|\bsaddle\b/),
    fever: has(/\bfever\b|temperature\s*3[89]|38\.\d/),
    weightLoss: has(/\bweight loss\b|\blost \d+ pounds\b/),
    trauma: has(/\btrauma\b|\bfall\b|\binjur/),
    immunocompromised: has(/\bimmunocompromised\b|\btransplant\b|\bchemo/),
    ivDrugUse: has(/\bivdu\b|intravenous drug/),
    osteoporosis: has(/\bosteoporosis\b|\bosteopenia\b/),
    ageOver50: caseData.patient_age > 50,
    ageUnder18: caseData.patient_age < 18,
    progressiveSymptoms: has(/\bprogressive\b|\bworsening\b/),
    bladderBowelDysfunction: has(/\bbladder\b|\bbowel\b|\burinary retention\b|\bsphincter\b/),
    suddenOnset: has(/\bsudden\b|\bthunderclap\b|\bmaximal intensity within seconds\b/),
  };
}

/**
 * Builds a PHI-safe record snapshot from an ED demo case.
 */
export function buildEdRecordSnapshot(caseData: Case): PatientRecordSnapshot {
  const patientHash = createHash("sha256").update(caseData.id).digest("hex");
  const vitals: PatientRecordSnapshot["vitals"] = [];
  const vs = caseData.vital_signs;

  if (vs) {
    if (vs.blood_pressure_systolic != null && vs.blood_pressure_diastolic != null) {
      vitals.push({
        display: "Blood pressure systolic",
        valueSummary: String(vs.blood_pressure_systolic),
      });
      vitals.push({
        display: "Heart rate",
        valueSummary: vs.heart_rate != null ? String(vs.heart_rate) : "",
      });
    }
    if (vs.respiratory_rate != null) {
      vitals.push({
        display: "Respiratory rate",
        valueSummary: String(vs.respiratory_rate),
      });
    }
    if (vs.oxygen_saturation != null) {
      vitals.push({
        display: "Oxygen saturation",
        valueSummary: String(vs.oxygen_saturation),
      });
    }
  }

  const labs =
    caseData.lab_results?.map((lab, index) => ({
      id: `ed-lab-${index}`,
      display: lab.name,
      valueSummary: `${lab.value} ${lab.unit}`,
    })) ?? [];

  const clinicalText = `${caseData.chief_complaint} ${caseData.clinical_vignette}`.toLowerCase();
  const traumaContext = /\btrauma\b|injur|fracture|fall/.test(clinicalText);

  return {
    patientHash,
    capturedAtIso: new Date().toISOString(),
    ttlSeconds: 1800,
    problems: [{ display: caseData.chief_complaint }],
    medications: [],
    allergies: [],
    encounters: [{ reasonDisplay: caseData.chief_complaint, typeDisplay: "Emergency" }],
    priorImaging: [],
    priorReports: [],
    labs,
    vitals,
    notes: [
      {
        description: caseData.clinical_vignette.slice(0, 800),
        typeCodings: [{ display: "ED triage note" }],
      },
    ],
    codingContext: {
      activeIcd10: [],
      activeCpt: [],
      injurySeverityScore: traumaContext ? 9 : undefined,
    },
  };
}

/**
 * Builds {@link AIIEClinicalFactors} from an ED case.
 */
export function caseToClinicalFactors(caseData: Case): AIIEClinicalFactors {
  return {
    chiefComplaint: caseData.chief_complaint,
    duration: "acute ED presentation",
    symptoms: [caseData.chief_complaint],
    redFlags: mapCaseRedFlags(caseData),
    priorImaging: false,
    conservativeManagementTried: false,
  };
}

/**
 * Builds a full {@link AIIEInput} for an ED cockpit case.
 */
export function buildEdAIIEInput(
  caseData: Case,
  proposedImagingId: string,
): AIIEInput | null {
  const option = getImagingOptionById(proposedImagingId);
  if (!option) return null;

  const clinicalFactors = caseToClinicalFactors(caseData);
  const order = imagingOptionToAIIEOrder(option);
  const snapshot = buildEdRecordSnapshot(caseData);

  return {
    patient: { age: caseData.patient_age, sex: caseData.patient_sex },
    clinicalFactors,
    order,
    recordSnapshot: snapshot,
    age: caseData.patient_age,
    sex: caseData.patient_sex,
    chiefComplaint: caseData.chief_complaint,
    duration: clinicalFactors.duration,
    symptoms: clinicalFactors.symptoms,
    redFlags: clinicalFactors.redFlags,
    priorImaging: false,
    conservativeManagementTried: false,
    requestedModality: order.modality,
    requestedProcedure: order.procedure,
  };
}

/**
 * Scores a single ED cockpit case via the shared AIIE engine.
 */
export async function evaluateEdCase(
  cockpitCase: EdCockpitCase,
): Promise<EdCaseEvaluationBundle | null> {
  const input = buildEdAIIEInput(cockpitCase.case, cockpitCase.proposedImagingId);
  if (!input || !input.recordSnapshot) return null;

  const score = await scoreOrder(input);
  const complaint = `${cockpitCase.case.chief_complaint} ${cockpitCase.case.clinical_vignette} ${cockpitCase.case.title}`;

  const statGate = evaluateStat({
    snapshot: input.recordSnapshot,
    order: input.order,
    complaint,
    priority: "stat",
    patientAgeYears: cockpitCase.case.patient_age,
  });

  const traumaGateResult = traumaGate(
    input.recordSnapshot,
    input.order,
    input.clinicalFactors.redFlags,
  );

  const redFlags = extractEdRedFlags(cockpitCase.case);
  const acrAdjusted = applyAcrRatingToScore(
    score,
    cockpitCase.case.id,
    cockpitCase.proposedImagingId,
  );
  const expedite = isExpediteCase(statGate, traumaGateResult, {
    esiLevel: cockpitCase.esiLevel,
    redFlags,
  });
  const disposition = getDisposition(acrAdjusted, cockpitCase.case, expedite);

  return {
    input,
    score: acrAdjusted,
    redFlags,
    statGate,
    traumaGate: traumaGateResult,
    expedite,
    disposition,
  };
}

/**
 * Precomputes AIIE evaluations for all cockpit cases (server-side).
 */
export async function precomputeEdEvaluations(
  cases: EdCockpitCase[],
): Promise<Record<string, EdCaseEvaluationBundle>> {
  const entries = await Promise.all(
    cases.map(async (cockpitCase) => {
      const evaluation = await evaluateEdCase(cockpitCase);
      if (!evaluation) {
        throw new Error(`Failed to evaluate ED case ${cockpitCase.caseId}`);
      }
      return [cockpitCase.caseId, evaluation] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/**
 * Aligns displayed AIIE score with case-specific ACR appropriateness ratings.
 */
function applyAcrRatingToScore(
  score: AIIEScore,
  caseId: string,
  proposedImagingId: string,
): AIIEScore {
  const ratings = getImagingRatingsForCase(caseId);
  const match = ratings.find((r) => r.imaging_option_id === proposedImagingId);
  if (!match) return score;

  const clinicalScore = match.acr_rating;
  return {
    ...score,
    clinicalScore,
    denialRisk: invertToDenialRisk(clinicalScore),
    narrativeRationale: match.rationale,
  };
}

export type { AIIEScore };
