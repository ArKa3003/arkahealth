/**
 * STAT priority gate: restricts true STAT to emergent criteria; otherwise recommends Urgent (4h).
 */

import type { AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

const LOINC_GCS = "9269-2";
const LOINC_ISS = "75261-1";

/** Canonical criterion ids returned in {@link StatGateResult.matchedCriteria}. */
export const STAT_CRITERION_IDS = {
  GCS_LE_13: "gcs_le_13",
  SUSPECTED_STROKE: "suspected_stroke",
  PE_HEMODYNAMIC: "suspected_pe_hemodynamic_instability",
  AORTIC_DISSECTION: "suspected_aortic_dissection",
  TRAUMA_SEVERE: "trauma_iss_ge_16_or_hemodynamic_instability",
  PEDIATRIC_FEVER_UNSTABLE: "pediatric_fever_unstable_vitals",
} as const;

export type StatCriterionId = (typeof STAT_CRITERION_IDS)[keyof typeof STAT_CRITERION_IDS];

/** Human-readable labels for CDS card detail. */
export const STAT_CRITERION_LABELS: Record<StatCriterionId, string> = {
  [STAT_CRITERION_IDS.GCS_LE_13]: "Glasgow Coma Scale ≤ 13",
  [STAT_CRITERION_IDS.SUSPECTED_STROKE]:
    "Suspected acute stroke (complaint matches NIHSS-aligned lexicon)",
  [STAT_CRITERION_IDS.PE_HEMODYNAMIC]:
    "Suspected pulmonary embolism with hemodynamic instability",
  [STAT_CRITERION_IDS.AORTIC_DISSECTION]: "Suspected acute aortic dissection",
  [STAT_CRITERION_IDS.TRAUMA_SEVERE]:
    "Major trauma (ISS ≥ 16) or trauma with hemodynamic instability",
  [STAT_CRITERION_IDS.PEDIATRIC_FEVER_UNSTABLE]:
    "Pediatric patient with fever and unstable vital signs",
};

export type StatPriority = "routine" | "urgent" | "stat";

/**
 * Outcome of evaluating whether a STAT (or STAT-equivalent) priority is warranted.
 */
export interface StatGateResult {
  /** True when at least one emergent criterion is satisfied. */
  meetsCriteria: boolean;
  /** Criterion ids that matched clinical documentation or snapshot measurements. */
  matchedCriteria: string[];
  /** Priority ARKA recommends when STAT is not warranted (typically urgent). */
  recommendedPriority: StatPriority;
  /** Short narrative for audit and CDS detail. */
  rationale: string;
}

export interface EvaluateStatInput {
  snapshot: PatientRecordSnapshot;
  order: AIIEOrder;
  complaint: string;
  priority: StatPriority;
  /** Patient age in years when known (for pediatric criterion). */
  patientAgeYears?: number;
}

const STROKE_LEXICON =
  /\b(?:stroke|cva|cerebrovascular|facial\s+droop|facial\s+weakness|facial\s+palsy|arm\s+drift|arm\s+weakness|leg\s+weakness|hemiparesis|hemiplegia|aphasia|dysarthria|slurred\s+speech|word[- ]finding|neglect|extinction|sudden\s+(?:numbness|weakness|vision)|nih\s*ss|nih\s+stroke\s+scale|large\s+vessel\s+occlusion|\blvo\b)\b/i;

const PE_LEXICON =
  /\b(?:pulmonary\s+embol(?:ism|us)|\bpe\b|pleuritic|wells\s+(?:score|criteria)|geneva\s+score|pretest.*pe|saddle\s+embolus)\b/i;

const DISSECTION_LEXICON =
  /\b(?:aortic\s+dissection|dissecting\s+aorta|tearing\s+(?:chest\s+)?pain|rip(?:ping)?\s+pain|pain\s+radiat(?:ing|es)\s+to\s+(?:the\s+)?back|interscapular|marfan|bicuspid\s+aortic)\b/i;

const FEVER_LEXICON = /\bfever\b|hyperthermia|\btemp(?:erature)?\s*(?:of\s*)?(?:10[3-9]|[4-9]\d)/i;

const HEMODYNAMIC_TEXT =
  /\b(?:hypotension|hypotensive|shock|hemodynamic(?:ally)?\s+instab|unstable\s+(?:blood\s+pressure|vitals)|sbp\s*[<≤]\s*9\d|map\s*[<≤]\s*6\d|cardiac\s+arrest|pulseless)\b/i;

/**
 * Evaluates whether the requested priority satisfies ARKA STAT policy.
 *
 * Non-STAT priorities pass through unchanged. STAT without a matching emergent
 * criterion yields `recommendedPriority: "urgent"`.
 *
 * @param input - Record snapshot, order, complaint text, and requested priority.
 */
export function evaluateStat(input: EvaluateStatInput): StatGateResult {
  const normalizedPriority = normalizePriority(input.priority);

  if (normalizedPriority !== "stat") {
    return {
      meetsCriteria: true,
      matchedCriteria: [],
      recommendedPriority: normalizedPriority,
      rationale: "STAT gate applies only when priority is STAT.",
    };
  }

  const text = buildClinicalText(input.snapshot, input.complaint, input.order);
  const matched: StatCriterionId[] = [];

  const gcs = extractGcs(input.snapshot);
  if (gcs !== undefined && gcs <= 13) {
    matched.push(STAT_CRITERION_IDS.GCS_LE_13);
  }

  if (STROKE_LEXICON.test(text)) {
    matched.push(STAT_CRITERION_IDS.SUSPECTED_STROKE);
  }

  if (PE_LEXICON.test(text) && hasHemodynamicInstability(input.snapshot, text)) {
    matched.push(STAT_CRITERION_IDS.PE_HEMODYNAMIC);
  }

  if (DISSECTION_LEXICON.test(text)) {
    matched.push(STAT_CRITERION_IDS.AORTIC_DISSECTION);
  }

  const iss = extractIss(input.snapshot);
  const traumaContext = /\btrauma\b|injur(?:y|ies)|fracture|polytrauma|mvc|fall from/i.test(text);
  if (
    (iss !== undefined && iss >= 16) ||
    (traumaContext && hasHemodynamicInstability(input.snapshot, text))
  ) {
    matched.push(STAT_CRITERION_IDS.TRAUMA_SEVERE);
  }

  const age = input.patientAgeYears;
  if (
    age !== undefined &&
    age < 18 &&
    hasFever(input.snapshot, text) &&
    hasUnstableVitals(input.snapshot, text)
  ) {
    matched.push(STAT_CRITERION_IDS.PEDIATRIC_FEVER_UNSTABLE);
  }

  const uniqueMatched = [...new Set(matched)];

  if (uniqueMatched.length > 0) {
    return {
      meetsCriteria: true,
      matchedCriteria: uniqueMatched,
      recommendedPriority: "stat",
      rationale: `STAT warranted: ${uniqueMatched.map((id) => STAT_CRITERION_LABELS[id]).join("; ")}.`,
    };
  }

  return {
    meetsCriteria: false,
    matchedCriteria: [],
    recommendedPriority: "urgent",
    rationale:
      "No emergent STAT criteria detected in the record or complaint. ARKA recommends Urgent (next 4 hours) instead of STAT to reduce queue misuse.",
  };
}

/** All STAT criterion ids for missing-criteria display. */
export function allStatCriterionIds(): StatCriterionId[] {
  return Object.values(STAT_CRITERION_IDS);
}

function normalizePriority(priority: StatPriority): StatPriority {
  return priority;
}

function buildClinicalText(
  snapshot: PatientRecordSnapshot,
  complaint: string,
  order: AIIEOrder,
): string {
  const parts: string[] = [complaint, order.modality, order.procedure, order.bodyPart ?? ""];
  for (const p of snapshot.problems) {
    parts.push(p.display);
    if (p.icd10) {
      parts.push(p.icd10);
    }
  }
  for (const e of snapshot.encounters) {
    if (e.reasonDisplay) {
      parts.push(e.reasonDisplay);
    }
  }
  for (const n of snapshot.notes) {
    if (n.description) {
      parts.push(n.description);
    }
  }
  return parts.join(" ").toLowerCase();
}

function extractGcs(snapshot: PatientRecordSnapshot): number | undefined {
  const ctx = snapshot.codingContext.glasgowComaScale;
  if (ctx !== undefined && Number.isFinite(ctx)) {
    return ctx;
  }
  return parseNumericFromRows(snapshot, LOINC_GCS, /\bglasgow\b/i);
}

function extractIss(snapshot: PatientRecordSnapshot): number | undefined {
  const ctx = snapshot.codingContext.injurySeverityScore;
  if (ctx !== undefined && Number.isFinite(ctx)) {
    return ctx;
  }
  return parseNumericFromRows(snapshot, LOINC_ISS, /\binjury\s+severity\b|\biss\b/i);
}

function parseNumericFromRows(
  snapshot: PatientRecordSnapshot,
  loinc: string,
  displayPattern: RegExp,
): number | undefined {
  for (const row of [...snapshot.vitals, ...snapshot.labs]) {
    if (row.code === loinc) {
      const v = parseValueSummaryNumber(row.valueSummary);
      if (v !== undefined) {
        return v;
      }
    }
    if (displayPattern.test(row.display)) {
      const v = parseValueSummaryNumber(row.valueSummary);
      if (v !== undefined) {
        return v;
      }
    }
  }
  return undefined;
}

function parseValueSummaryNumber(summary: string | undefined): number | undefined {
  if (!summary) {
    return undefined;
  }
  const match = summary.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return undefined;
  }
  const n = Number.parseFloat(match[0]);
  return Number.isFinite(n) ? n : undefined;
}

function hasHemodynamicInstability(snapshot: PatientRecordSnapshot, text: string): boolean {
  if (HEMODYNAMIC_TEXT.test(text)) {
    return true;
  }
  const sbp = findVitalNumeric(snapshot, /\bsystolic\b|\bsbp\b|blood pressure/i, 0);
  if (sbp !== undefined && sbp < 90) {
    return true;
  }
  const hr = findVitalNumeric(snapshot, /\bheart\s+rate\b|\bpulse\b|\bhr\b/i, 0);
  if (hr !== undefined && hr > 120) {
    return true;
  }
  return snapshot.labs.some((l) => /lactate/i.test(l.display) && parseValueSummaryNumber(l.valueSummary) !== undefined &&
    (parseValueSummaryNumber(l.valueSummary) ?? 0) > 4);
}

function hasFever(snapshot: PatientRecordSnapshot, text: string): boolean {
  if (FEVER_LEXICON.test(text)) {
    return true;
  }
  return snapshot.codingContext.activeIcd10.some((c) => c.startsWith("R50"));
}

function hasUnstableVitals(snapshot: PatientRecordSnapshot, text: string): boolean {
  if (hasHemodynamicInstability(snapshot, text)) {
    return true;
  }
  const spo2 = findVitalNumeric(snapshot, /\bspo2\b|oxygen saturation/i, 0);
  if (spo2 !== undefined && spo2 < 92) {
    return true;
  }
  const rr = findVitalNumeric(snapshot, /\brespiratory\s+rate\b|\brr\b/i, 0);
  if (rr !== undefined && (rr > 30 || rr < 10)) {
    return true;
  }
  const hr = findVitalNumeric(snapshot, /\bheart\s+rate\b|\bpulse\b/i, 0);
  if (hr !== undefined && hr > 160) {
    return true;
  }
  return false;
}

function findVitalNumeric(
  snapshot: PatientRecordSnapshot,
  pattern: RegExp,
  componentIndex: number,
): number | undefined {
  for (const row of snapshot.vitals) {
    if (!pattern.test(row.display)) {
      continue;
    }
    const parts = (row.valueSummary ?? "").match(/\d+(?:\.\d+)?/g);
    if (!parts?.length) {
      continue;
    }
    const idx = Math.min(componentIndex, parts.length - 1);
    const n = Number.parseFloat(parts[idx]);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}
