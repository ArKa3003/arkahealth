/**
 * Deterministic order-context normalizer for the AIIE Clinical Knowledge Matrix.
 *
 * Maps ANY input — structured FHIR fields, free text, or garbage — into a
 * {@link NormalizedOrderContext} without network calls so that downstream
 * matrix resolution never has an unmatched input.
 */

import { parseDuration } from "@/lib/aiie/duration-parser";
import { traumaGate } from "@/lib/aiie/trauma-gate";
import type { AIIEInput, AIIERedFlags } from "@/lib/types/aiie";

import { ALL_SCENARIOS } from "./regions";
import type {
  BodyRegion,
  ClinicalScenario,
  Modality,
  NormalizedOrderContext,
  RedFlagKey,
} from "./types";

// ---------------------------------------------------------------------------
// CPT → modality / region knowledge (common imaging CPT ranges)
// ---------------------------------------------------------------------------

interface CptRangeEntry {
  /** Inclusive lower CPT bound. */
  min: number;
  /** Inclusive upper CPT bound. */
  max: number;
  /** Imaging modality for the range. */
  modality: Modality;
  /** Body region when the range is region-specific. */
  region?: BodyRegion;
}

/** Common imaging CPT subranges (70000-series radiology plus vascular duplex). */
const CPT_RANGES: readonly CptRangeEntry[] = [
  { min: 70010, max: 70390, modality: "xr", region: "head_face_neck" },
  { min: 70450, max: 70470, modality: "ct", region: "head_brain" },
  { min: 70480, max: 70492, modality: "ct", region: "head_face_neck" },
  { min: 70496, max: 70498, modality: "cta", region: "head_brain" },
  { min: 70540, max: 70543, modality: "mri", region: "head_face_neck" },
  { min: 70544, max: 70549, modality: "mra", region: "head_brain" },
  { min: 70551, max: 70559, modality: "mri", region: "head_brain" },
  { min: 71045, max: 71048, modality: "xr", region: "chest" },
  { min: 71250, max: 71270, modality: "ct", region: "chest" },
  { min: 71271, max: 71275, modality: "cta", region: "chest" },
  { min: 72020, max: 72020, modality: "xr" },
  { min: 72040, max: 72052, modality: "xr", region: "spine_cervical" },
  { min: 72070, max: 72074, modality: "xr", region: "spine_thoracic" },
  { min: 72100, max: 72120, modality: "xr", region: "spine_lumbar" },
  { min: 72125, max: 72127, modality: "ct", region: "spine_cervical" },
  { min: 72128, max: 72130, modality: "ct", region: "spine_thoracic" },
  { min: 72131, max: 72133, modality: "ct", region: "spine_lumbar" },
  { min: 72141, max: 72142, modality: "mri", region: "spine_cervical" },
  { min: 72146, max: 72147, modality: "mri", region: "spine_thoracic" },
  { min: 72148, max: 72149, modality: "mri", region: "spine_lumbar" },
  { min: 72156, max: 72156, modality: "mri", region: "spine_cervical" },
  { min: 72157, max: 72157, modality: "mri", region: "spine_thoracic" },
  { min: 72158, max: 72158, modality: "mri", region: "spine_lumbar" },
  { min: 72191, max: 72191, modality: "cta", region: "pelvis" },
  { min: 72192, max: 72194, modality: "ct", region: "pelvis" },
  { min: 72195, max: 72197, modality: "mri", region: "pelvis" },
  { min: 72198, max: 72198, modality: "mra", region: "pelvis" },
  { min: 73000, max: 73140, modality: "xr", region: "msk_upper" },
  { min: 73200, max: 73202, modality: "ct", region: "msk_upper" },
  { min: 73206, max: 73206, modality: "cta", region: "msk_upper" },
  { min: 73218, max: 73223, modality: "mri", region: "msk_upper" },
  { min: 73225, max: 73225, modality: "mra", region: "msk_upper" },
  { min: 73501, max: 73660, modality: "xr", region: "msk_lower" },
  { min: 73700, max: 73702, modality: "ct", region: "msk_lower" },
  { min: 73706, max: 73706, modality: "cta", region: "msk_lower" },
  { min: 73718, max: 73723, modality: "mri", region: "msk_lower" },
  { min: 73725, max: 73725, modality: "mra", region: "msk_lower" },
  { min: 74018, max: 74022, modality: "xr", region: "abdomen" },
  { min: 74150, max: 74170, modality: "ct", region: "abdomen" },
  { min: 74174, max: 74175, modality: "cta", region: "abdomen" },
  { min: 74176, max: 74178, modality: "ct", region: "abdomen" },
  { min: 74181, max: 74183, modality: "mri", region: "abdomen" },
  { min: 74185, max: 74185, modality: "mra", region: "abdomen" },
  { min: 75557, max: 75565, modality: "mri", region: "cardiac" },
  { min: 75571, max: 75573, modality: "ct", region: "cardiac" },
  { min: 75574, max: 75574, modality: "cta", region: "cardiac" },
  { min: 76000, max: 76120, modality: "fluoro" },
  { min: 76506, max: 76999, modality: "us" },
  { min: 77046, max: 77049, modality: "mri", region: "breast" },
  { min: 77065, max: 77067, modality: "mammo", region: "breast" },
  { min: 77080, max: 77086, modality: "dexa" },
  { min: 78012, max: 78799, modality: "nm" },
  { min: 78811, max: 78816, modality: "pet_ct", region: "whole_body" },
  // Vascular duplex studies live in the 93xxx medicine series.
  { min: 93880, max: 93882, modality: "us_doppler", region: "vascular" },
  { min: 93925, max: 93931, modality: "us_doppler", region: "vascular" },
  { min: 93970, max: 93971, modality: "us_doppler", region: "vascular" },
  { min: 93975, max: 93979, modality: "us_doppler", region: "vascular" },
];

function cptRangeFor(cpt: string | undefined): CptRangeEntry | null {
  if (!cpt) {
    return null;
  }
  const digits = cpt.replace(/\D/g, "").slice(0, 5);
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) {
    return null;
  }
  return CPT_RANGES.find((r) => n >= r.min && n <= r.max) ?? null;
}

// ---------------------------------------------------------------------------
// Modality from free text
// ---------------------------------------------------------------------------

const WITH_CONTRAST_PATTERN =
  /\bwith\s+(?:iv\s+)?contrast\b|\bw\/\s*(?:iv\s*)?contrast\b|\bw\s+contrast\b|\biv\s+contrast\b|contrast[\s-]enhanced/;

/**
 * Detects contrast-enhanced studies in order text. "Without contrast followed
 * by with contrast" still counts as a contrast study.
 */
function hasContrast(text: string): boolean {
  return WITH_CONTRAST_PATTERN.test(text);
}

/**
 * Maps free order text to a matrix modality. Checks compound modalities
 * (PET-CT, CTA, MRA, duplex) before their base modalities.
 */
function modalityFromText(text: string): Modality | null {
  if (/\bpet\b|positron\s+emission/.test(text)) {
    return "pet_ct";
  }
  if (/\bcta\b|\bct\s+angio/.test(text)) {
    return "cta";
  }
  if (/\bmra\b|\bmrv\b|\bmr\s+angio|magnetic\s+resonance\s+angio/.test(text)) {
    return "mra";
  }
  if (/\bmri\b|magnetic\s+resonance|\bmr\s+imaging\b/.test(text)) {
    return hasContrast(text) ? "mri_contrast" : "mri";
  }
  if (/\bct\b|computed\s+tomography|cat\s+scan/.test(text)) {
    return hasContrast(text) ? "ct_contrast" : "ct";
  }
  if (/duplex|doppler/.test(text)) {
    return "us_doppler";
  }
  if (/ultrasound|sonogra|ultrasonogra|\bus\b|\becho\b|echocardiogram/.test(text)) {
    return "us";
  }
  if (/mammog|tomosynthesis|\bmammo\b/.test(text)) {
    return "mammo";
  }
  if (/\bdexa\b|\bdxa\b|bone\s+densitometry/.test(text)) {
    return "dexa";
  }
  if (/fluoro|barium|swallow\s+stud|upper\s+gi\b/.test(text)) {
    return "fluoro";
  }
  if (/nuclear|scintigra|\bspect\b|\bhida\b|bone\s+scan/.test(text)) {
    return "nm";
  }
  if (/x[\s-]?ray|radiograph|\bxr\b|plain\s+film/.test(text)) {
    return "xr";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Region from free text
// ---------------------------------------------------------------------------

/**
 * Region keyword sets, ordered so more specific anatomic phrases (spine
 * subdivisions) are evaluated before generic ones ("head", "neck").
 */
const REGION_KEYWORDS: ReadonlyArray<readonly [BodyRegion, readonly string[]]> = [
  ["spine_cervical", [
    "cervical spine", "c spine", "cspine", "neck pain", "cervicalgia",
    "whiplash", "cervical radiculopathy", "cervical", "myelopathy",
  ]],
  ["spine_thoracic", [
    "thoracic spine", "t spine", "tspine", "mid back", "midback",
    "upper back", "thoracic",
  ]],
  ["spine_lumbar", [
    "lumbar", "l spine", "lspine", "low back", "lower back", "lumbosacral",
    "sciatica", "lumbago", "cauda equina", "back pain",
  ]],
  ["head_brain", [
    "brain", "head", "cranial", "skull", "intracranial", "headache",
    "migraine", "stroke", "tia", "seizure", "concussion", "tbi",
  ]],
  ["head_face_neck", [
    "sinus", "sinusitis", "face", "facial", "orbit", "maxillofacial",
    "thyroid", "neck mass", "neck lump", "parotid", "mandible", "neck",
  ]],
  ["cardiac", [
    "cardiac", "heart", "coronary", "angina", "echocardiogram",
    "myocardial", "heart failure", "chf",
  ]],
  ["chest", [
    "chest", "thorax", "lung", "pulmonary", "rib", "cough", "hemoptysis",
    "dyspnea", "shortness of breath", "pneumonia", "pulmonary embolism",
  ]],
  ["abdomen", [
    "abdomen", "abdominal", "liver", "gallbladder", "pancreas",
    "pancreatitis", "appendix", "appendicitis", "bowel", "rlq", "ruq",
    "llq", "luq", "epigastric", "diverticulitis", "obstruction",
  ]],
  ["pelvis", [
    "pelvis", "pelvic", "ovary", "ovarian", "adnexal", "uterus",
    "endometrial", "ectopic",
  ]],
  ["gu_renal", [
    "kidney", "renal", "ureter", "bladder", "urinary", "hematuria",
    "scrotal", "scrotum", "testicular", "testicle", "flank", "stone",
    "nephrolithiasis", "urolithiasis",
  ]],
  ["msk_upper", [
    "shoulder", "elbow", "wrist", "hand", "humerus", "clavicle",
    "rotator cuff", "forearm", "finger",
  ]],
  ["msk_lower", [
    "hip", "knee", "ankle", "foot", "femur", "tibia", "meniscus", "acl",
    "lower extremity", "leg",
  ]],
  ["vascular", [
    "carotid", "dvt", "aorta", "aortic", "aneurysm", "duplex", "vein",
    "venous", "artery", "arterial", "vascular",
  ]],
  ["breast", ["breast", "mammogram", "mammography", "mammo"]],
  ["whole_body", ["whole body", "pan scan", "polytrauma"]],
];

/**
 * Normalizes a token: lowercase plus basic stemming (strip simple plurals,
 * normalize "wks"/"weeks" style abbreviations).
 */
function normalizeToken(token: string): string {
  let t = token.toLowerCase();
  if (t === "wks" || t === "wk") {
    return "week";
  }
  if (t === "mos" || t === "mo") {
    return "month";
  }
  if (t === "yrs" || t === "yr") {
    return "year";
  }
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) {
    t = t.slice(0, -1);
  }
  return t;
}

/** Tokenizes and normalizes text into a space-joined phrase-matchable string. */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0)
    .map(normalizeToken)
    .join(" ");
}

/** Word-boundary phrase containment over space-padded normalized text. */
function paddedIncludes(paddedText: string, normalizedPhrase: string): boolean {
  return paddedText.includes(` ${normalizedPhrase} `);
}

/**
 * Region keywords normalized once at module load so per-order resolution does
 * not re-normalize the keyword side of every phrase comparison.
 */
const NORMALIZED_REGION_KEYWORDS: ReadonlyArray<
  readonly [BodyRegion, readonly string[]]
> = REGION_KEYWORDS.map(
  ([region, keywords]) =>
    [
      region,
      keywords.map((k) => normalizeText(k)).filter((k) => k.length > 0),
    ] as const,
);

/**
 * Scenario presentation keywords normalized once at module load, keeping
 * candidate scoring O(scenarios) per order with cheap substring checks.
 */
const NORMALIZED_SCENARIO_KEYWORDS: ReadonlyMap<string, readonly string[]> =
  new Map(
    ALL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.presentationKeywords
        .map((k) => normalizeText(k))
        .filter((k) => k.length > 0),
    ]),
  );

function regionFromText(text: string): BodyRegion | null {
  const normalized = normalizeText(text);
  if (normalized.length === 0) {
    return null;
  }
  const padded = ` ${normalized} `;
  let best: BodyRegion | null = null;
  let bestHits = 0;
  for (const [region, keywords] of NORMALIZED_REGION_KEYWORDS) {
    let hits = 0;
    for (const keyword of keywords) {
      if (paddedIncludes(padded, keyword)) {
        hits += 1;
      }
    }
    // Strictly-greater keeps earlier (more specific) regions on ties.
    if (hits > bestHits) {
      best = region;
      bestHits = hits;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Scenario candidate scoring
// ---------------------------------------------------------------------------

const ICD10_WEIGHT = 3;
const SNOMED_WEIGHT = 3;
const KEYWORD_WEIGHT = 1;
const KEYWORD_CAP = 4;
const REGION_AGREEMENT_BONUS = 2;
const CANDIDATE_THRESHOLD = 2;

function scoreScenarioCandidate(
  scenario: ClinicalScenario,
  paddedClinicalText: string,
  reasonIcd10: readonly string[],
  reasonSnomed: readonly string[],
  region: BodyRegion | null,
): number {
  let score = 0;

  const icdHit = reasonIcd10.some((code) =>
    scenario.icd10Prefixes.some((prefix) =>
      code.toUpperCase().startsWith(prefix.toUpperCase()),
    ),
  );
  if (icdHit) {
    score += ICD10_WEIGHT;
  }

  const snomedHit =
    (scenario.snomedCodes ?? []).length > 0 &&
    reasonSnomed.some((code) => (scenario.snomedCodes ?? []).includes(code));
  if (snomedHit) {
    score += SNOMED_WEIGHT;
  }

  let keywordHits = 0;
  const keywords = NORMALIZED_SCENARIO_KEYWORDS.get(scenario.id) ?? [];
  for (const keyword of keywords) {
    if (paddedIncludes(paddedClinicalText, keyword)) {
      keywordHits += 1;
      if (keywordHits >= KEYWORD_CAP) {
        break;
      }
    }
  }
  score += Math.min(keywordHits, KEYWORD_CAP) * KEYWORD_WEIGHT;

  // Region agreement boosts scenarios that already have a clinical signal;
  // it never qualifies a scenario on its own (an order with only a known
  // region and no indication detail must fall through to region_default).
  if (score > 0 && region !== null && scenario.region === region) {
    score += REGION_AGREEMENT_BONUS;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Structured discriminator extraction
// ---------------------------------------------------------------------------

function extractRedFlags(input: AIIEInput): RedFlagKey[] {
  const merged: AIIERedFlags = { ...input.redFlags, ...input.clinicalFactors.redFlags };
  const keys = Object.keys(merged) as RedFlagKey[];
  return keys.filter(
    (key) =>
      input.clinicalFactors.redFlags[key] === true || input.redFlags[key] === true,
  );
}

function extractDurationDays(input: AIIEInput): number | null {
  const text =
    input.clinicalFactors.duration?.trim() || input.duration?.trim() || "";
  if (!text) {
    return null;
  }
  const parsed = parseDuration(text);
  if (parsed.value <= 0) {
    return null;
  }
  return Math.round(parsed.value * 7);
}

const TRAUMA_TEXT_PATTERN =
  /\btrauma\b|\bmvc\b|\bmva\b|\bfall\b|\bfell\b|assault|collision|\baccident\b|injur/;

function extractTrauma(input: AIIEInput, redFlags: RedFlagKey[], rawText: string): boolean {
  if (redFlags.includes("trauma")) {
    return true;
  }
  if (TRAUMA_TEXT_PATTERN.test(rawText.toLowerCase())) {
    return true;
  }
  if (input.recordSnapshot) {
    // Structured trauma severity scores (ISS/AIS) documented in the record imply trauma.
    const gate = traumaGate(input.recordSnapshot, input.order, input.clinicalFactors.redFlags);
    if (gate.severityTier !== "unknown") {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Structured reason codings extracted from a FHIR order (`ServiceRequest.reasonCode`)
 * that supplement free-text scenario matching with deterministic code lookups.
 */
export interface OrderReasonCodings {
  /** ICD-10-CM reason codes (e.g. "M54.5"). */
  reasonIcd10?: readonly string[];
  /** SNOMED CT reason codes. */
  reasonSnomed?: readonly string[];
}

/**
 * Normalizes an AIIE request into a deterministic {@link NormalizedOrderContext}
 * for matrix resolution. Pure function of the input — no network calls.
 *
 * @param input - Structured AIIE request (FHIR-derived, free text, or partial/garbage).
 * @param reasonCodings - Optional ICD-10/SNOMED reason codes from the draft order
 *   (CDS Hooks `ServiceRequest.reasonCode`) merged into scenario candidate scoring.
 * @returns Normalized clinical and order discriminators; fields the input cannot
 *   support resolve to `null`/`false` rather than failing.
 */
export function normalizeOrderContext(
  input: AIIEInput,
  reasonCodings?: OrderReasonCodings,
): NormalizedOrderContext {
  const orderText = [
    input.order.modality,
    input.order.procedure,
    input.order.bodyPart ?? "",
    input.requestedModality,
    input.requestedProcedure,
  ]
    .join(" ")
    .toLowerCase();

  const clinicalText = [
    input.chiefComplaint,
    input.clinicalFactors.chiefComplaint,
    input.symptoms.join(" "),
    input.clinicalFactors.symptoms.join(" "),
  ]
    .join(" ")
    .trim();

  const rawText = `${clinicalText} ${orderText}`.trim();
  const cptRange = cptRangeFor(input.order.cpt);

  // 1. Modality: structured fields and CPT outrank free-text keyword scanning.
  let modality = modalityFromText(orderText);
  if (modality === null && cptRange) {
    modality = cptRange.modality;
    if (modality === "ct" && hasContrast(orderText)) {
      modality = "ct_contrast";
    } else if (modality === "mri" && hasContrast(orderText)) {
      modality = "mri_contrast";
    }
  }

  // 2. Region: bodyPart text, then procedure/order text, then CPT subrange,
  //    then complaint keyword scan.
  const region =
    regionFromText(input.order.bodyPart ?? "") ??
    regionFromText(orderText) ??
    cptRange?.region ??
    regionFromText(clinicalText);

  // 4. Structured discriminators (extracted before candidates so region/trauma
  //    agreement can use them).
  const redFlags = extractRedFlags(input);
  const snapshot = input.recordSnapshot;
  const age =
    Number.isFinite(input.patient?.age) && input.patient.age > 0 ?
      input.patient.age
    : Number.isFinite(input.age) && input.age > 0 ? input.age
    : null;
  const pregnancy = input.patient?.pregnant ?? input.pregnant ?? null;
  const trauma = extractTrauma(input, redFlags, rawText);
  const priorImaging =
    input.clinicalFactors.priorImaging ||
    input.priorImaging ||
    (snapshot?.priorImaging.length ?? 0) > 0;
  const immunocompromised = redFlags.includes("immunocompromised");
  const priorConservativeCare =
    input.clinicalFactors.conservativeManagementTried ||
    input.conservativeManagementTried;
  const durationDays = extractDurationDays(input);

  // 3. Scenario candidates scored over every matrix scenario.
  const reasonIcd10: string[] = [...(reasonCodings?.reasonIcd10 ?? [])];
  if (snapshot) {
    if (snapshot.codingContext.admissionIcd10) {
      reasonIcd10.push(snapshot.codingContext.admissionIcd10);
    }
    reasonIcd10.push(...snapshot.codingContext.activeIcd10);
    for (const problem of snapshot.problems) {
      if (problem.icd10) {
        reasonIcd10.push(problem.icd10);
      }
    }
  }
  const reasonSnomed: string[] = [...(reasonCodings?.reasonSnomed ?? [])];

  const paddedClinicalText = ` ${normalizeText(rawText)} `;
  const scenarioCandidates = ALL_SCENARIOS.map((scenario) => ({
    id: scenario.id,
    score: scoreScenarioCandidate(
      scenario,
      paddedClinicalText,
      reasonIcd10,
      reasonSnomed,
      region ?? null,
    ),
  }))
    .filter((c) => c.score >= CANDIDATE_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .map((c) => c.id);

  return {
    region: region ?? null,
    modality,
    scenarioCandidates,
    redFlags,
    age,
    durationDays,
    pregnancy,
    trauma,
    priorImaging,
    immunocompromised,
    priorConservativeCare,
    rawText,
  };
}
