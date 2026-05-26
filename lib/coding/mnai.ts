/**
 * Medical Necessity Alignment Index (MNAI) — ICD-10/CPT pair matching against curated payer-policy tables.
 * Deterministic evidence retrieval; does not alter AIIE clinical score numerics.
 */

import pairsJson from "@/lib/coding/icd-cpt-pairs.json";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import type { AIIEScore } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

/** ACR-aligned policy strength labels surfaced to clinicians. */
export type PolicyStrength =
  | "usually_appropriate"
  | "may_be_appropriate"
  | "usually_not_appropriate"
  | "usually_appropriate_with_red_flags";

/** Curated payer / guideline reference row. */
export interface PolicyRef {
  /** Human-readable policy or guideline source. */
  source: string;
  /** ACR-style appropriateness strength. */
  strength: PolicyStrength;
}

/** Curated ICD-10-CM + CPT pair row from {@link pairsJson}. */
export interface IcdCptPair {
  icd10: string;
  cpt: string;
  defaultAlignment:
    | "requires_qualifiers"
    | "usually_appropriate"
    | "may_be_appropriate"
    | "usually_not_appropriate"
    | "neutral";
  requiredQualifiers: string[];
  redFlagOverrides: string[];
  policyReferences: PolicyRef[];
}

/** MNAI output tier for UI and persistence. */
export type MNAITier = "green" | "amber" | "red";

/** Per-qualifier evaluation state. */
export type QualifierStatus = "met" | "unmet" | "unknown";

/** Medical Necessity Alignment Index result bundle. */
export interface MNAIResult {
  /** Alignment index 0–100 (higher = stronger policy alignment). */
  index: number;
  /** Traffic-light tier derived from index and pair context. */
  tier: MNAITier;
  /** Qualifier checklist keyed by stable qualifier id. */
  qualifierStatus: Record<string, QualifierStatus>;
  /** Guideline / payer policy references for clinician review. */
  policyReferences: PolicyRef[];
  /** Plain-language summary for cards and modals. */
  narrative: string;
  /** Matched ICD-10 when a curated pair was found; otherwise undefined. */
  matchedIcd10?: string;
  /** Matched CPT when a curated pair was found; otherwise undefined. */
  matchedCpt?: string;
  /** Whether the pair was found in the curated table. */
  curated: boolean;
}

export interface ComputeMNAIInput {
  /** Working / admission ICD-10-CM codes (normalized upstream). */
  icd10: string[];
  /** Requested procedure CPT code. */
  cpt: string;
  /** Optional FHIR record snapshot for duration and coding context. */
  snapshot: PatientRecordSnapshot;
  /** Completed AIIE score (factor rows inform qualifier inference). */
  aiie: AIIEScore;
}

const CURATED_PAIRS: IcdCptPair[] = pairsJson as IcdCptPair[];

const NEUTRAL_NARRATIVE =
  "No curated ICD-10/CPT policy mapping exists for this code combination. ARKA does not infer medical necessity without an evidence-backed pair; review payer policy and clinical documentation directly.";

/**
 * Computes the Medical Necessity Alignment Index for an order's ICD-10 and CPT codes.
 *
 * @param input - ICD-10 list, CPT, record snapshot, and completed AIIE score.
 * @returns Deterministic {@link MNAIResult} for identical inputs.
 */
export function computeMNAI(input: ComputeMNAIInput): MNAIResult {
  const cpt = normalizeCpt(input.cpt);
  const icdCodes = collectIcd10(input.icd10, input.snapshot);
  const pair = findCuratedPair(icdCodes, cpt);

  if (!pair) {
    return buildNeutralResult(icdCodes, cpt);
  }

  const qualifierStatus = evaluateQualifiers(pair, input.snapshot, input.aiie);
  const activeRedFlags = detectRedFlags(pair.redFlagOverrides, input.snapshot, input.aiie);
  const hasRedFlagOverride = activeRedFlags.length > 0;

  const index = computeIndex(pair, qualifierStatus, hasRedFlagOverride);
  const tier = tierFromIndex(index, pair.defaultAlignment, hasRedFlagOverride);
  const narrative = buildNarrative(pair, qualifierStatus, activeRedFlags, index, tier);

  return {
    index,
    tier,
    qualifierStatus,
    policyReferences: pair.policyReferences,
    narrative: `${narrative} ${FDA_NON_DEVICE_CDS_DISCLOSURE}`,
    matchedIcd10: pair.icd10,
    matchedCpt: pair.cpt,
    curated: true,
  };
}

/** Standard FDA non-device CDS footer for MNAI UI surfaces. */
export function mnaiFdaDisclaimer(): string {
  return FDA_NON_DEVICE_CDS_DISCLOSURE;
}

function normalizeCpt(cpt: string): string {
  return cpt.replace(/\D/g, "").trim();
}

function normalizeIcd10(code: string): string {
  return code.trim().toUpperCase().replace(/\./g, "");
}

function collectIcd10(provided: string[], snapshot: PatientRecordSnapshot): string[] {
  const fromSnapshot = [
    ...snapshot.codingContext.activeIcd10,
    snapshot.codingContext.admissionIcd10 ?? "",
    ...snapshot.problems.map((p) => p.icd10 ?? ""),
  ].filter(Boolean);
  const merged = [...provided, ...fromSnapshot];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of merged) {
    const n = normalizeIcd10(raw);
    if (!n || seen.has(n)) {
      continue;
    }
    seen.add(n);
    out.push(n);
  }
  return out;
}

function icdMatches(candidate: string, pairIcd: string): boolean {
  const a = normalizeIcd10(candidate);
  const b = normalizeIcd10(pairIcd);
  return a === b || a.startsWith(b) || b.startsWith(a);
}

function findCuratedPair(icdCodes: string[], cpt: string): IcdCptPair | undefined {
  if (!cpt) {
    return undefined;
  }
  for (const code of icdCodes) {
    const hit = CURATED_PAIRS.find(
      (p) => normalizeCpt(p.cpt) === cpt && icdMatches(code, p.icd10),
    );
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

function buildNeutralResult(icdCodes: string[], cpt: string): MNAIResult {
  return {
    index: 50,
    tier: "amber",
    qualifierStatus: {},
    policyReferences: [],
    narrative: `${NEUTRAL_NARRATIVE} ${FDA_NON_DEVICE_CDS_DISCLOSURE}`,
    matchedCpt: cpt || undefined,
    matchedIcd10: icdCodes[0],
    curated: false,
  };
}

function factorById(aiie: AIIEScore, id: string) {
  return aiie.factors.find((f) => f.id === id);
}

function evaluateQualifiers(
  pair: IcdCptPair,
  snapshot: PatientRecordSnapshot,
  aiie: AIIEScore,
): Record<string, QualifierStatus> {
  const status: Record<string, QualifierStatus> = {};
  const allQualifierIds = [
    ...pair.requiredQualifiers,
    ...pair.redFlagOverrides,
  ];
  for (const id of allQualifierIds) {
    status[id] = evaluateSingleQualifier(id, pair, snapshot, aiie);
  }
  return status;
}

function evaluateSingleQualifier(
  id: string,
  pair: IcdCptPair,
  snapshot: PatientRecordSnapshot,
  aiie: AIIEScore,
): QualifierStatus {
  const guideline = factorById(aiie, "guideline_alignment");
  const redFlagFactor = factorById(aiie, "red_flag_symptoms");
  const indication = factorById(aiie, "clinical_indication");
  const prior = factorById(aiie, "prior_imaging_redundancy");
  const activeIcd = snapshot.codingContext.activeIcd10.map(normalizeIcd10);
  const problemText = snapshot.problems
    .map((p) => `${p.display} ${p.icd10 ?? ""}`)
    .join(" ")
    .toLowerCase();

  switch (id) {
    case "conservative_management_tried":
      if (guideline?.present === true && (guideline.contribution ?? 0) >= 0.35) {
        return "met";
      }
      if (guideline?.present === false) {
        return "unmet";
      }
      return /physical therapy|\bpt\b|nsaid|ibuprofen|naproxen|cyclobenzaprine/i.test(
        problemText,
      ) ?
          "met"
        : "unknown";

    case "duration_ge_6_weeks":
      return durationMet(snapshot, pair.icd10, 42);

    case "duration_ge_4_weeks_or_escalation":
      return durationMet(snapshot, pair.icd10, 28);

    case "absence_of_red_flags_negates": {
      const overrides = detectRedFlags(pair.redFlagOverrides, snapshot, aiie);
      return overrides.length === 0 ? "met" : "unmet";
    }

    case "prior_imaging_interval_met": {
      if (prior?.present === false) {
        return "met";
      }
      if (prior?.present === true && (prior.contribution ?? 0) < -0.2) {
        return "unmet";
      }
      return "unknown";
    }

    case "pretest_probability_documented":
      return indication?.present === true ? "met" : "unknown";

    case "symptom_onset_within_window":
      return durationMet(snapshot, pair.icd10, 1) === "met" ? "met" : "unknown";

    case "ct_head_already_performed":
      return snapshot.priorImaging.some((s) =>
        s.modality.some((m) => /ct/i.test(m)),
      ) || snapshot.priorReports.some((r) => r.procedureCode === "70450") ?
          "met"
        : "unknown";

    case "trauma_mechanism_documented":
      return activeIcd.some((c) => c.startsWith("S")) || /trauma|fracture|injury/i.test(problemText) ?
          "met"
        : "unknown";

    case "pediatric_patient":
      return snapshot.codingContext.activeIcd10.length > 0 ?
          snapshot.problems.some((p) => /pediatric|child/i.test(p.display ?? "")) ?
            "met"
          : "unknown"
        : "unknown";

    case "ultrasound_nondiagnostic_or_contraindicated":
      return snapshot.priorImaging.some((s) =>
        s.modality.some((m) => /us|ultrasound/i.test(m)),
      ) ?
          "met"
        : "unknown";

    case "failed_antibiotic_course":
      return /antibiotic|amoxicillin|augmentin|azithromycin/i.test(problemText) ? "met" : "unknown";

    case "mechanical_locking":
      return /locking|catching/i.test(problemText) ? "met" : "unknown";

    case "effusion_acute":
      return /effusion|swelling/i.test(problemText) ? "met" : "unknown";

    case "neurological_deficit":
    case "bladder_bowel_dysfunction":
    case "cancer_history":
    case "ivdu":
    case "progressive_weakness":
    case "sudden_onset":
    case "fever":
    case "immunocompromised":
    case "age_over_50":
    case "peritoneal_signs":
    case "trauma":
    case "weight_loss":
    case "hemodynamic_instability":
    case "d_dimer_elevated":
    case "pe_high_pretest":
    case "hypoxemia":
    case "pregnancy":
    case "anticoagulation":
    case "carotid_stenosis_clinical_suspicion":
    case "open_fracture":
    case "neurovascular_compromise":
    case "compartment_syndrome_signs":
    case "dislocation_reducible":
    case "orbital_cellulitis_signs":
    case "bilious_vomiting":
    case "appendicitis_high_suspicion":
    case "pregnancy_excluded":
      return redFlagQualifier(id, snapshot, aiie, redFlagFactor);

    default:
      return "unknown";
  }
}

function durationMet(
  snapshot: PatientRecordSnapshot,
  pairIcd: string,
  minDays: number,
): QualifierStatus {
  const target = normalizeIcd10(pairIcd);
  const problem = snapshot.problems.find(
    (p) => p.icd10 && icdMatches(normalizeIcd10(p.icd10), target),
  );
  if (!problem?.onsetIso) {
    return "unknown";
  }
  const onset = Date.parse(problem.onsetIso);
  if (!Number.isFinite(onset)) {
    return "unknown";
  }
  const days = (Date.now() - onset) / (1000 * 60 * 60 * 24);
  return days >= minDays ? "met" : "unmet";
}

function redFlagQualifier(
  id: string,
  snapshot: PatientRecordSnapshot,
  aiie: AIIEScore,
  redFlagFactor: AIIEScore["factors"][number] | undefined,
): QualifierStatus {
  const active = detectRedFlags([id], snapshot, aiie);
  if (active.includes(id)) {
    return "met";
  }
  if (redFlagFactor?.present === false) {
    return "unmet";
  }
  return "unknown";
}

function detectRedFlags(
  ids: string[],
  snapshot: PatientRecordSnapshot,
  aiie: AIIEScore,
): string[] {
  const activeIcd = snapshot.codingContext.activeIcd10.map(normalizeIcd10);
  const text = snapshot.problems.map((p) => p.display.toLowerCase()).join(" ");
  const redFactor = factorById(aiie, "red_flag_symptoms");
  const systemicRed = (redFactor?.contribution ?? 0) > 0.25;

  const hits: string[] = [];
  for (const id of ids) {
    if (flagIdActive(id, activeIcd, text, systemicRed, snapshot)) {
      hits.push(id);
    }
  }
  return hits;
}

function flagIdActive(
  id: string,
  activeIcd: string[],
  text: string,
  systemicRed: boolean,
  snapshot: PatientRecordSnapshot,
): boolean {
  switch (id) {
    case "neurological_deficit":
      return (
        activeIcd.some((c) => c.startsWith("G83") || c.startsWith("R29")) ||
        /weakness|numbness|paresis|deficit/i.test(text) ||
        systemicRed
      );
    case "bladder_bowel_dysfunction":
      return /bowel|bladder|incontinence|retention/i.test(text) || activeIcd.some((c) => c.startsWith("R33"));
    case "cancer_history":
      return activeIcd.some((c) => c.startsWith("C"));
    case "ivdu":
      return activeIcd.some((c) => c.startsWith("F11")) || /ivdu|intravenous drug/i.test(text);
    case "progressive_weakness":
      return /progressive weakness|worsening weakness/i.test(text);
    case "sudden_onset":
      return /sudden onset|thunderclap|worst headache/i.test(text);
    case "fever":
      return activeIcd.some((c) => c.startsWith("R50")) || /fever/i.test(text);
    case "immunocompromised":
      return /immunocomprom|transplant|chemotherapy|hiv/i.test(text);
    case "age_over_50":
      return false;
    case "peritoneal_signs":
      return /peritoneal|rebound|guarding/i.test(text);
    case "trauma":
      return activeIcd.some((c) => c.startsWith("S")) || /trauma/i.test(text);
    case "weight_loss":
      return /weight loss|cachexia/i.test(text);
    case "hemodynamic_instability":
      return /hypotension|shock|hemodynamic/i.test(text);
    case "d_dimer_elevated":
      return snapshotLabHint(snapshot, "d-dimer");
    case "pe_high_pretest":
      return /wells|geneva|pretest.*pe|pulmonary embolism/i.test(text);
    case "hypoxemia":
      return /hypox|spo2|oxygen saturation/i.test(text);
    case "pregnancy":
      return activeIcd.some((c) => c.startsWith("Z33")) || /pregnant|pregnancy/i.test(text);
    case "anticoagulation":
      return /warfarin|apixaban|rivaroxaban|anticoagul/i.test(text);
    case "open_fracture":
      return /open fracture|compound fracture/i.test(text);
    case "neurovascular_compromise":
      return /neurovascular|pulseless|pale extremity/i.test(text);
    case "compartment_syndrome_signs":
      return /compartment syndrome/i.test(text);
    case "orbital_cellulitis_signs":
      return /orbital cellulitis|proptosis|ophthalmoplegia/i.test(text);
    case "bilious_vomiting":
      return /bilious vomiting/i.test(text);
    case "appendicitis_high_suspicion":
      return /appendicitis|mcburney|rlq pain/i.test(text);
    default:
      return false;
  }
}

function snapshotLabHint(snapshot: PatientRecordSnapshot, hint: string): boolean {
  return snapshot.labs.some((l) => l.display.toLowerCase().includes(hint));
}

function computeIndex(
  pair: IcdCptPair,
  qualifierStatus: Record<string, QualifierStatus>,
  hasRedFlagOverride: boolean,
): number {
  const base = alignmentBase(pair.defaultAlignment);
  if (hasRedFlagOverride && pair.defaultAlignment !== "usually_not_appropriate") {
    return clampIndex(Math.max(base, 78));
  }

  const required = pair.requiredQualifiers;
  if (required.length === 0) {
    return clampIndex(base);
  }

  let met = 0;
  let unmet = 0;
  let unknown = 0;
  for (const q of required) {
    const s = qualifierStatus[q] ?? "unknown";
    if (s === "met") {
      met += 1;
    } else if (s === "unmet") {
      unmet += 1;
    } else {
      unknown += 1;
    }
  }

  const total = required.length;
  const metRatio = met / total;
  const penalty = unmet * 12 + unknown * 4;
  const raw = base + metRatio * 35 - penalty;
  return clampIndex(raw);
}

function alignmentBase(
  alignment: IcdCptPair["defaultAlignment"],
): number {
  switch (alignment) {
    case "usually_appropriate":
      return 82;
    case "may_be_appropriate":
      return 62;
    case "usually_not_appropriate":
      return 28;
    case "requires_qualifiers":
      return 48;
    default:
      return 50;
  }
}

function tierFromIndex(
  index: number,
  alignment: IcdCptPair["defaultAlignment"],
  hasRedFlagOverride: boolean,
): MNAITier {
  if (hasRedFlagOverride && alignment !== "usually_not_appropriate") {
    return index >= 65 ? "green" : "amber";
  }
  if (index >= 70) {
    return "green";
  }
  if (index >= 40) {
    return "amber";
  }
  return "red";
}

function clampIndex(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildNarrative(
  pair: IcdCptPair,
  qualifierStatus: Record<string, QualifierStatus>,
  activeRedFlags: string[],
  index: number,
  tier: MNAITier,
): string {
  const required = pair.requiredQualifiers;
  const met = required.filter((q) => qualifierStatus[q] === "met").length;
  const unmet = required.filter((q) => qualifierStatus[q] === "unmet").length;
  const redText =
    activeRedFlags.length > 0 ?
      ` Documented red-flag context (${activeRedFlags.join(", ")}) may align with expedited imaging per cited policies.`
    : "";
  return (
    `Curated mapping ${pair.icd10} + CPT ${pair.cpt}: MNAI ${index}/100 (${tier}). ` +
    `Policy qualifiers ${met}/${required.length} met, ${unmet} unmet.${redText} ` +
    `Default alignment: ${pair.defaultAlignment.replace(/_/g, " ")}.`
  );
}
