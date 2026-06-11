import { imagingOptions } from "@/lib/demos/ed";
import type { Case, ImagingOption } from "@/lib/demos/ed/types";
import type { AIIEInput } from "@/lib/types/aiie";
import type { AIIEScore } from "@/lib/types/aiie";
import type { StatGateResult } from "@/lib/aiie/stat-gate";
import type { TraumaGateResult } from "@/lib/aiie/trauma-gate";

import type { EdEsiLevel } from "./ed-cockpit-cases";

/** Red-flag slugs that trigger STAT / EXPEDITE pathway in the ED cockpit. */
const EXPEDITE_FLAG_SLUGS = new Set([
  "thunderclap-onset",
  "tearing-chest-pain",
  "meningeal-signs",
]);

/**
 * Resolves an imaging option by id (client-safe).
 */
export function getImagingOptionById(id: string): ImagingOption | undefined {
  return imagingOptions.find((o) => o.id === id);
}

/** ESI acuity left-edge colors (high contrast for glanceability). */
export const ESI_EDGE_CLASS: Record<EdEsiLevel, string> = {
  1: "border-l-[6px] border-l-danger",
  2: "border-l-[6px] border-l-warning",
  3: "border-l-[6px] border-l-info",
  4: "border-l-[6px] border-l-arka-slate-400",
  5: "border-l-[6px] border-l-arka-slate-300",
};

export const ESI_LABEL: Record<EdEsiLevel, string> = {
  1: "ESI 1",
  2: "ESI 2",
  3: "ESI 3",
  4: "ESI 4",
  5: "ESI 5",
};

export interface EdRedFlag {
  label: string;
  slug: string;
}

/**
 * Slug for /evidence/[slug] links from factor or flag name.
 */
export function factorEvidenceSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const RED_FLAG_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bthunderclap\b|worst headache of (?:my |her |his )?life|maximal intensity within seconds/, label: "Thunderclap onset" },
  { pattern: /\btearing\b|\bripping\b|aortic dissection/, label: "Tearing chest pain" },
  {
    pattern:
      /\bneuro(?:logical)?\s+deficit\b|\b(?:leg|arm|facial)\s+weakness\b|\bnumbness\b|\bsaddle anesthesia\b|\b(?:urinary|bowel)\s+(?:retention|incontinence|dysfunction)\b|\bsphincter\b/i,
    label: "Neuro deficit",
  },
  { pattern: /\bfever\b|temperature\s*38[.\d]|hyperthermia/, label: "Fever" },
  { pattern: /\bweight loss\b|\bunintentional(?:ly)?\s+lost\b/, label: "Weight loss" },
  { pattern: /\bcancer\b|\bmalignan/, label: "Cancer history" },
  { pattern: /\btrauma\b|\bfall\b|\binjur/, label: "Recent trauma" },
  { pattern: /\bsudden onset\b|\bsudden(?:ly)?\s+severe\b/, label: "Sudden onset" },
  { pattern: /\bpapilledema\b|\bsubhyaloid\b|\bnuchal rigidity\b|\bmeningismus\b/, label: "Meningeal signs" },
  { pattern: /\bimmunocompromised\b|\btransplant\b|\bchemo/, label: "Immunocompromised" },
  { pattern: /\bprogressive\b|\bworsening\b/, label: "Progressive symptoms" },
];

/**
 * Returns true when a pattern match is negated in nearby text (e.g. "denies fever").
 */
function isNegatedMatch(text: string, matchIndex: number): boolean {
  const window = text.slice(Math.max(0, matchIndex - 28), matchIndex);
  return /\b(?:no|denies|denied|without|absent|negative for)\s+[\w\s]{0,20}$/i.test(window);
}

/**
 * Extracts matched clinical red flags from case narrative for ED callouts.
 */
export function extractEdRedFlags(caseData: Case): EdRedFlag[] {
  const text = [
    caseData.chief_complaint,
    caseData.clinical_vignette,
    caseData.physical_exam ?? "",
    ...(caseData.patient_history ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const matched: EdRedFlag[] = [];
  for (const { pattern, label } of RED_FLAG_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    const hit = re.exec(text);
    if (
      hit &&
      !isNegatedMatch(text, hit.index) &&
      !matched.some((m) => m.label === label)
    ) {
      matched.push({ label, slug: factorEvidenceSlug(label) });
    }
  }
  return matched.slice(0, 6);
}

/**
 * True when stat-gate, trauma-gate, ESI-1 acuity, or emergent red flags apply.
 */
export function isExpediteCase(
  statGate: StatGateResult,
  traumaGate: TraumaGateResult,
  options?: { esiLevel?: EdEsiLevel; redFlags?: EdRedFlag[] },
): boolean {
  const statSignal =
    statGate.meetsCriteria && statGate.matchedCriteria.length > 0;
  const traumaSignal =
    traumaGate.gateSignal > 0.15 ||
    traumaGate.severityTier === "severe" ||
    traumaGate.severityTier === "critical";
  const esiSignal = options?.esiLevel === 1;
  const flagSignal = (options?.redFlags ?? []).some((f) =>
    EXPEDITE_FLAG_SLUGS.has(f.slug),
  );
  return statSignal || traumaSignal || esiSignal || flagSignal;
}

export type DispositionTone = "proceed" | "caution" | "defer";

export interface DispositionRecommendation {
  headline: string;
  detail: string;
  tone: DispositionTone;
}

/**
 * ED disposition line derived from AIIE score and case optimal imaging.
 */
export function getDisposition(
  score: AIIEScore,
  caseData: Case,
  expedite: boolean,
): DispositionRecommendation {
  const s = score.clinicalScore;
  const prefix = expedite ? "EXPEDITE — " : "";

  if (s >= 7) {
    const orderLabel = caseData.optimal_imaging[0]?.replace(/-/g, " ") ?? "proposed study";
    return {
      headline: `${prefix}Proceed with imaging`,
      detail: `AIIE ${s}/9 supports ${orderLabel}. Activate appropriate pathway and document indication.`,
      tone: "proceed",
    };
  }
  if (s >= 4) {
    return {
      headline: `${prefix}Discuss before ordering`,
      detail: `Score ${s}/9 — benefits and risks are balanced. Confirm indication with attending before scan.`,
      tone: "caution",
    };
  }
  return {
    headline: `${prefix}Defer imaging`,
    detail: `Score ${s}/9 — low-value order risk. Reassess clinically; consider observation or alternate workup.`,
    tone: "defer",
  };
}

/**
 * Formats elapsed time since arrival for triage cards.
 */
export function formatTimeSinceArrival(totalMinutes: number, secondsTick: number): string {
  const totalSeconds = totalMinutes * 60 + secondsTick;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

/**
 * Compact vitals chip labels for triage cards.
 */
export function vitalsChips(caseData: Case): string[] {
  const vs = caseData.vital_signs;
  if (!vs) return [];
  const chips: string[] = [];
  if (vs.heart_rate != null) chips.push(`HR ${vs.heart_rate}`);
  if (vs.blood_pressure_systolic != null && vs.blood_pressure_diastolic != null) {
    chips.push(`BP ${vs.blood_pressure_systolic}/${vs.blood_pressure_diastolic}`);
  }
  if (vs.respiratory_rate != null) chips.push(`RR ${vs.respiratory_rate}`);
  if (vs.oxygen_saturation != null) chips.push(`SpO₂ ${vs.oxygen_saturation}%`);
  if (vs.temperature != null) {
    const temp =
      vs.temperature_unit === "fahrenheit"
        ? `${vs.temperature}°F`
        : `${vs.temperature}°C`;
    chips.push(temp);
  }
  return chips;
}

/** Department header stats for the ED cockpit strip. */
export const ED_DEPT_STATS = {
  casesScoredToday: 127,
  medianTimeToDecisionSec: 0.4,
  lowValueOrdersAvoided: 34,
} as const;

export type EdCaseEvaluationBundle = {
  input: AIIEInput;
  score: AIIEScore;
  redFlags: EdRedFlag[];
  statGate: StatGateResult;
  traumaGate: TraumaGateResult;
  expedite: boolean;
  disposition: DispositionRecommendation;
};
