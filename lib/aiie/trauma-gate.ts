/**
 * Trauma-severity gate: translates structured trauma scores (AIS, ISS, GCS, RTS, REMS)
 * from the EHR snapshot into an order-specific appropriateness signal for AIIE.
 *
 * Scores are measurements, not diagnoses — see AAST ISS resource and ACR head-injury criteria.
 */

import type { AIIEOrder, AIIERedFlags } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

const LOINC_GCS = "9269-2";
const LOINC_ISS = "75261-1";
/** NTDS Abbreviated Injury Scale panel (LOINC 76067-8). */
const LOINC_AIS_PANEL = "76067-8";
/** Revised Emergency Medicine Score when reported as a single observation. */
const LOINC_REMS = "98985-8";
/** Revised Trauma Score total when present as a structured observation. */
const LOINC_RTS = "96853-3";

const GATE_MIN = -0.8;
const GATE_MAX = 0.8;

/** Body-region keys for AIS values parsed from vitals/labs. */
const AIS_REGION_PATTERN =
  /\b(?:ais|abbreviated\s+injury\s+scale)\b.*\b(head|face|neck|chest|thorax|abdomen|spine|extremit|pelvis|external)\b/i;

/** Region token normalization for {@link TraumaGateResult.ais}. */
const AIS_REGION_ALIASES: Record<string, string> = {
  head: "head",
  face: "face",
  neck: "neck",
  chest: "chest",
  thorax: "chest",
  abdomen: "abdomen",
  spine: "spine",
  extremit: "extremity",
  extremity: "extremity",
  pelvis: "pelvis",
  external: "external",
};

/**
 * Structured trauma gate output consumed by the scoring engine.
 */
export interface TraumaGateResult {
  /** Injury Severity Score when available or derived from AIS. */
  iss?: number;
  /** Abbreviated Injury Scale severity per body region (1–6). */
  ais?: Record<string, number>;
  /** Glasgow Coma Scale total (3–15). */
  gcs?: number;
  /** Revised Trauma Score when documented or derived from GCS/SBP/RR. */
  rts?: number;
  /** Revised Emergency Medicine Score when documented. */
  rems?: number;
  /** ISS/AIS-derived acuity tier. */
  severityTier: "minor" | "moderate" | "severe" | "critical" | "unknown";
  /** Order-specific signal in [-0.8, +0.8] before the scoring weight is applied. */
  gateSignal: number;
  /** Human-readable gate rationale for narrative and audit. */
  narrative: string;
}

/**
 * Evaluates trauma severity measurements against the requested imaging order.
 *
 * @param snapshot - Normalized FHIR record snapshot with trauma observations.
 * @param order - Ordered imaging service.
 * @param redFlags - Optional clinical red flags; minor-injury dampening is waived when any are set.
 */
export function traumaGate(
  snapshot: PatientRecordSnapshot,
  order: AIIEOrder,
  redFlags?: AIIERedFlags,
): TraumaGateResult {
  const metrics = extractTraumaMetrics(snapshot);
  const tier = classifySeverityTier(metrics.iss, metrics.ais);
  const hasRedFlags = redFlags ? Object.values(redFlags).some(Boolean) : false;

  let gateSignal = 0;
  const parts: string[] = [];

  if (tier === "minor") {
    if (isExtremityAdvancedImaging(order) && !hasRedFlags) {
      // AAST ISS guidance: ISS ≤8 / AIS 1 injuries rarely warrant advanced extremity imaging without red flags.
      gateSignal -= 0.4;
      parts.push(
        "Minor trauma severity (ISS ≤8 or regional AIS ≤1) dampens advanced extremity CT/MRI absent red flags.",
      );
    } else {
      parts.push("Minor trauma severity documented; no order-specific gate adjustment.");
    }
  } else if (tier === "moderate") {
    parts.push("Moderate trauma severity (ISS 9–15); trauma gate neutral for this order.");
  } else if (tier === "severe") {
    if (isWholeBodyCtOrder(order)) {
      // Polytrauma imaging alignment per major trauma activation literature (ISS 16–24).
      gateSignal += 0.4;
      parts.push("Severe trauma (ISS 16–24) supports whole-body CT when clinically indicated.");
    }
  } else if (tier === "critical") {
    if (isWholeBodyCtOrder(order)) {
      gateSignal += 0.7;
      parts.push("Critical trauma (ISS ≥25) strongly supports whole-body CT.");
    }
    if (isCtHeadOrder(order)) {
      gateSignal += 0.7;
      parts.push("Critical trauma (ISS ≥25) strongly supports CT head.");
    }
  }

  if (metrics.gcs !== undefined && metrics.gcs <= 13 && isCtHeadOrder(order)) {
    // ACR Appropriateness Criteria / ACEP head trauma: GCS ≤13 elevates head CT even without focal complaint.
    gateSignal += 0.3;
    parts.push(`GCS ${metrics.gcs} ≤13 elevates CT head appropriateness per ACR head-injury criteria.`);
  }

  if (metrics.rems !== undefined) {
    gateSignal += remsModifier(metrics.rems);
    parts.push(`REMS ${metrics.rems} applied as a bounded modifier only.`);
  }

  gateSignal = clampGate(gateSignal);

  const narrative =
    parts.length > 0 ?
      parts.join(" ")
    : "No trauma severity measurements or no applicable gate rule for this order.";

  return {
    iss: metrics.iss,
    ais: metrics.ais,
    gcs: metrics.gcs,
    rts: metrics.rts,
    rems: metrics.rems,
    severityTier: tier,
    gateSignal,
    narrative,
  };
}

interface TraumaMetrics {
  iss?: number;
  ais?: Record<string, number>;
  gcs?: number;
  rts?: number;
  rems?: number;
}

function extractTraumaMetrics(snapshot: PatientRecordSnapshot): TraumaMetrics {
  const ctx = snapshot.codingContext;
  const ais = parseAisFromObservations(snapshot);
  let iss = ctx.injurySeverityScore;
  if (iss === undefined && ais && Object.keys(ais).length > 0) {
    // Baker SP et al., J Trauma 1974 — ISS = sum of squares of three highest AIS per body region.
    iss = computeIssFromAis(ais);
  }

  const gcs = ctx.glasgowComaScale ?? parseNumericFromRows(snapshot, LOINC_GCS, /\bglasgow\b/i);
  const rems = parseNumericFromRows(snapshot, LOINC_REMS, /\brems\b|rapid emergency medicine score/i);
  const rts =
    parseNumericFromRows(snapshot, LOINC_RTS, /\brts\b|revised trauma score/i) ??
    deriveRtsFromVitals(snapshot, gcs);

  return { iss, ais, gcs, rts, rems };
}

/**
 * ISS = sum of squares of the three highest AIS scores (AAST / NTDS).
 */
function computeIssFromAis(ais: Record<string, number>): number {
  const scores = Object.values(ais).filter((n) => Number.isFinite(n) && n > 0);
  const topThree = [...scores].sort((a, b) => b - a).slice(0, 3);
  if (topThree.length === 0) {
    return 0;
  }
  while (topThree.length < 3) {
    topThree.push(0);
  }
  return topThree.reduce((sum, n) => sum + n * n, 0);
}

function classifySeverityTier(
  iss: number | undefined,
  ais: Record<string, number> | undefined,
): TraumaGateResult["severityTier"] {
  const maxAis =
    ais && Object.keys(ais).length > 0 ?
      Math.max(...Object.values(ais).filter((n) => Number.isFinite(n)))
    : undefined;
  const singleRegionMinor = maxAis !== undefined && maxAis <= 1;

  if (iss !== undefined) {
    if (iss <= 8 || singleRegionMinor) {
      return "minor";
    }
    if (iss <= 15) {
      return "moderate";
    }
    if (iss <= 24) {
      return "severe";
    }
    return "critical";
  }

  if (singleRegionMinor) {
    return "minor";
  }
  return "unknown";
}

function parseAisFromObservations(
  snapshot: PatientRecordSnapshot,
): Record<string, number> | undefined {
  const ais: Record<string, number> = {};
  const rows = [...snapshot.vitals, ...snapshot.labs];

  for (const row of rows) {
    const code = row.code ?? "";
    if (code === LOINC_AIS_PANEL) {
      const v = parseValueSummaryNumber(row.valueSummary);
      if (v !== undefined && v >= 1 && v <= 6) {
        ais.external = Math.max(ais.external ?? 0, v);
      }
    }

    const display = `${row.display} ${row.valueSummary ?? ""}`;
    const regionMatch = display.match(AIS_REGION_PATTERN);
    if (regionMatch) {
      const rawRegion = regionMatch[1].toLowerCase();
      const regionKey =
        Object.entries(AIS_REGION_ALIASES).find(([k]) => rawRegion.includes(k))?.[1] ??
        rawRegion;
      const score =
        parseValueSummaryNumber(row.valueSummary) ??
        extractTrailingAisScore(display);
      if (score !== undefined && score >= 1 && score <= 6) {
        ais[regionKey] = Math.max(ais[regionKey] ?? 0, score);
      }
    }
  }

  return Object.keys(ais).length > 0 ? ais : undefined;
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

function extractTrailingAisScore(text: string): number | undefined {
  const m = text.match(/\b(?:ais|severity)\s*[:=]?\s*(\d)\b/i) ?? text.match(/\b(\d)\s*$/);
  if (!m) {
    return undefined;
  }
  const n = Number.parseInt(m[1], 10);
  return n >= 1 && n <= 6 ? n : undefined;
}

/**
 * RTS from GCS, systolic BP, and respiratory rate (Champion HR, Circulation 1981).
 */
function deriveRtsFromVitals(
  snapshot: PatientRecordSnapshot,
  gcs: number | undefined,
): number | undefined {
  if (gcs === undefined) {
    return undefined;
  }
  const sbp = findVitalNumeric(snapshot, /\bsystolic\b|\bsbp\b|blood pressure/i, 0);
  const rr = findVitalNumeric(snapshot, /\brespiratory\s+rate\b|\brr\b/i, 0);
  if (sbp === undefined || rr === undefined) {
    return undefined;
  }
  const rts = 0.9368 * gcs + 0.7326 * sbp + 0.2908 * rr;
  return Math.round(rts * 100) / 100;
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

/** REMS is a bounded modifier only — small nudge, not a primary driver. */
function remsModifier(rems: number): number {
  if (rems >= 15) {
    return 0.08;
  }
  if (rems >= 11) {
    return 0.05;
  }
  if (rems <= 4) {
    return -0.05;
  }
  return 0;
}

function isCtHeadOrder(order: AIIEOrder): boolean {
  const text = orderText(order);
  return /\bct\b/.test(text) && /\b(head|brain|cranial|skull)\b/.test(text);
}

function isWholeBodyCtOrder(order: AIIEOrder): boolean {
  const text = orderText(order);
  if (!/\bct\b/.test(text)) {
    return false;
  }
  if (/\b(whole\s*body|pan\s*scan|polytrauma|trauma\s*series)\b/.test(text)) {
    return true;
  }
  const regions = ["chest", "abdomen", "pelvis", "thorax"];
  const hit = regions.filter((r) => text.includes(r)).length;
  return hit >= 2;
}

function isExtremityAdvancedImaging(order: AIIEOrder): boolean {
  const text = orderText(order);
  const advanced = /\b(ct|mri)\b/.test(text);
  const extremity =
    /\b(knee|ankle|wrist|elbow|shoulder|hip|foot|hand|extremit|limb|femur|tibia|humerus)\b/.test(
      text,
    );
  return advanced && extremity;
}

function orderText(order: AIIEOrder): string {
  return `${order.modality} ${order.procedure} ${order.bodyPart ?? ""}`.toLowerCase();
}

function clampGate(value: number): number {
  return Math.max(GATE_MIN, Math.min(GATE_MAX, value));
}
