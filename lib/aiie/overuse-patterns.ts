import type { AIIEClinicalFactors, AIIEOrder, AIIERedFlags } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

/** Inputs for registry rule matching (snapshot optional when not yet scraped). */
export interface OveruseMatchInput {
  /** Normalized FHIR record snapshot when available. */
  snapshot?: PatientRecordSnapshot;
  /** Ordered imaging service. */
  order: AIIEOrder;
  /** Structured clinical factors from AIIE input. */
  clinical: AIIEClinicalFactors;
}

/**
 * Registry entry for a high-volume inappropriate-imaging pattern surfaced as a CDS soft block.
 */
export interface OveruseRule {
  /** Stable rule identifier for telemetry and card UUID suffix. */
  id: string;
  /** Returns true when the order matches this overuse pattern. */
  match: (input: OveruseMatchInput) => boolean;
  /** Short card headline. */
  cardTitle: string;
  /** Clinician-facing rationale (markdown-safe plain text). */
  rationale: string;
  /** Guideline-concordant alternative to document or order instead. */
  recommendedAlternative: string;
  /** ACR Appropriateness Criteria and/or Choosing Wisely citations. */
  citations: string[];
}

const LUMBAR_MRI_CPTS = new Set(["72148", "72149", "72158"]);
const LUMBAR_XRAY_CPTS = new Set(["72100", "72110", "72114"]);
const HEAD_CT_CPTS = new Set(["70450", "70460", "70470"]);
const CTPA_CPTS = new Set(["71275", "71260", "71270"]);
const KNEE_MRI_CPTS = new Set(["73721", "73722", "73723"]);
const SINUS_CT_CPTS = new Set(["70486", "70487", "70488"]);

/**
 * Returns all overuse rules that match the current order and clinical context.
 *
 * @param input - Order, clinical factors, and optional record snapshot.
 */
export function evaluateOveruseRules(input: OveruseMatchInput): OveruseRule[] {
  return OVERUSE_RULES.filter((rule) => rule.match(input));
}

/**
 * Seeded inappropriate-imaging patterns (ACR / Choosing Wisely). Extend by appending rules.
 */
export const OVERUSE_RULES: OveruseRule[] = [
  {
    id: "mri_lumbar_lbp_nored",
    match: (input) =>
      isMriLumbarOrder(input.order) &&
      isLowBackPainContext(input.clinical, input.snapshot) &&
      !input.clinical.conservativeManagementTried &&
      !hasSpinalImagingRedFlags(input.clinical.redFlags),
    cardTitle: "Lumbar MRI may be inappropriate for uncomplicated low back pain",
    rationale:
      "Up to half of lumbar spine MRIs are ordered without red flags or an adequate trial of conservative care. " +
      "For uncomplicated acute or subacute low back pain, imaging rarely changes management in the first 6 weeks.",
    recommendedAlternative:
      "Trial of NSAIDs, activity modification, and physical therapy for 4–6 weeks; re-evaluate if red flags develop or symptoms persist beyond 6 weeks.",
    citations: [
      "ACR Appropriateness Criteria — Low Back Pain (Variant 1: uncomplicated, no red flags)",
      "Choosing Wisely — Don't do imaging for low back pain within the first six weeks",
    ],
  },
  {
    id: "ct_head_minor_hit",
    match: (input) =>
      isHeadCtOrder(input.order) &&
      isMinorHeadInjuryContext(input.clinical) &&
      canadianCtHeadRuleNegative(input) &&
      !hasHeadCtRedFlags(input.clinical.redFlags),
    cardTitle: "Head CT may be unnecessary for minor head injury (Canadian CT Head Rule negative)",
    rationale:
      "In alert adults with minor head injury and no high-risk Canadian CT Head Rule criteria, the yield of non-contrast head CT is very low.",
    recommendedAlternative:
      "Clinical observation and return precautions; reserve CT for new neurologic deficit, persistent vomiting, or worsening symptoms.",
    citations: [
      "ACR Appropriateness Criteria — Head Trauma (minor injury, GCS 15)",
      "Choosing Wisely — Avoid head CT in emergency department patients with minor head injury at low risk",
    ],
  },
  {
    id: "ct_pe_low_wells",
    match: (input) =>
      isCtpaOrder(input.order) &&
      isSuspectedPeContext(input.clinical, input.snapshot) &&
      wellsScoreLowOrModerate(input) &&
      percRuleSatisfied(input) &&
      !hasPeImagingRedFlags(input.clinical.redFlags, input.snapshot),
    cardTitle: "CT pulmonary angiography may be unnecessary when PERC is negative",
    rationale:
      "When pretest probability for pulmonary embolism is low (Wells ≤ 4) and the Pulmonary Embolism Rule-out Criteria (PERC) are satisfied, CTPA is usually not indicated.",
    recommendedAlternative:
      "No further imaging for PE workup; treat alternative diagnosis and reassess if symptoms worsen.",
    citations: [
      "ACR Appropriateness Criteria — Suspected Pulmonary Embolism (low pretest probability)",
      "Choosing Wisely — Don't image for suspected pulmonary embolism when pre-test probability is low",
    ],
  },
  {
    id: "mri_knee_no_fail_conservative",
    match: (input) =>
      isKneeMriOrder(input.order) &&
      isKneePainContext(input.clinical, input.snapshot) &&
      !input.clinical.conservativeManagementTried &&
      !hasKneeMriRedFlags(input.clinical.redFlags),
    cardTitle: "Knee MRI may be premature without failed conservative management",
    rationale:
      "MRI of the knee is rarely needed before a structured trial of conservative therapy for non-traumatic knee pain without mechanical locking or acute effusion.",
    recommendedAlternative:
      "NSAIDs, activity modification, and physical therapy for at least 6 weeks; consider MRI if symptoms persist or mechanical symptoms develop.",
    citations: [
      "ACR Appropriateness Criteria — Chronic Knee Pain (non-traumatic)",
      "Choosing Wisely — Don't do MRI of the knee for non-traumatic knee pain without targeted examination findings",
    ],
  },
  {
    id: "plain_xray_low_back_pain_stable",
    match: (input) =>
      isLumbarXrayOrder(input.order) &&
      isLowBackPainContext(input.clinical, input.snapshot) &&
      isStableOrSubacuteBackPain(input.clinical) &&
      !hasSpinalImagingRedFlags(input.clinical.redFlags),
    cardTitle: "Lumbar spine X-ray is usually not needed for stable low back pain",
    rationale:
      "Plain radiographs of the lumbar spine do not improve outcomes for uncomplicated, stable low back pain without red flags or trauma.",
    recommendedAlternative:
      "Conservative management and symptom-directed care; reserve imaging for red flags, trauma, or failure of conservative therapy beyond 6 weeks.",
    citations: [
      "ACR Appropriateness Criteria — Low Back Pain (plain radiography, uncomplicated)",
      "Choosing Wisely — Avoid lumbar spine imaging in patients with non-specific low back pain",
    ],
  },
  {
    id: "ct_sinus_acute",
    match: (input) =>
      isSinusCtOrder(input.order) &&
      isAcuteRhinosinusitisContext(input.clinical, input.snapshot) &&
      !failedAntibioticCourseDocumented(input) &&
      !hasSinusCtRedFlags(input.clinical.redFlags, input.snapshot),
    cardTitle: "Sinus CT is usually not indicated for uncomplicated acute rhinosinusitis",
    rationale:
      "Uncomplicated acute bacterial rhinosinusitis is a clinical diagnosis; CT does not guide initial antibiotic therapy and exposes patients to unnecessary radiation.",
    recommendedAlternative:
      "Empiric medical therapy per IDSA guidance; consider CT only after failure of appropriate antibiotic course or when complications are suspected.",
    citations: [
      "ACR Appropriateness Criteria — Sinonasal Disease (acute uncomplicated rhinosinusitis)",
      "Choosing Wisely — Don't do CT for uncomplicated acute rhinosinusitis",
    ],
  },
];

function normalizeCpt(cpt?: string): string {
  return (cpt ?? "").replace(/\D/g, "").trim();
}

function orderText(order: AIIEOrder): string {
  return `${order.procedure} ${order.bodyPart ?? ""} ${order.modality}`.toLowerCase();
}

function clinicalText(clinical: AIIEClinicalFactors): string {
  return [
    clinical.chiefComplaint,
    clinical.duration,
    ...clinical.symptoms,
    clinical.conservativeManagementDuration ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function isMriLumbarOrder(order: AIIEOrder): boolean {
  const cpt = normalizeCpt(order.cpt);
  if (LUMBAR_MRI_CPTS.has(cpt)) {
    return true;
  }
  const text = orderText(order);
  return text.includes("mri") && /\b(lumbar|lumb|spine|spinal)\b/.test(text);
}

function isLumbarXrayOrder(order: AIIEOrder): boolean {
  const cpt = normalizeCpt(order.cpt);
  if (LUMBAR_XRAY_CPTS.has(cpt)) {
    return true;
  }
  const text = orderText(order);
  return (text.includes("x-ray") || text.includes("xray") || text.includes("radiograph")) &&
    /\b(lumbar|lumb|spine)\b/.test(text);
}

function isHeadCtOrder(order: AIIEOrder): boolean {
  const cpt = normalizeCpt(order.cpt);
  if (HEAD_CT_CPTS.has(cpt)) {
    return true;
  }
  const text = orderText(order);
  return text.includes("ct") && /\b(head|brain|cranial|skull)\b/.test(text);
}

function isCtpaOrder(order: AIIEOrder): boolean {
  const cpt = normalizeCpt(order.cpt);
  if (CTPA_CPTS.has(cpt)) {
    return true;
  }
  const text = orderText(order);
  return (
    (text.includes("ct") || text.includes("cta")) &&
    /\b(pulmonary|lung|pe\b|embol|angiograph)/.test(text)
  );
}

function isKneeMriOrder(order: AIIEOrder): boolean {
  const cpt = normalizeCpt(order.cpt);
  if (KNEE_MRI_CPTS.has(cpt)) {
    return true;
  }
  const text = orderText(order);
  return text.includes("mri") && /\bknee\b/.test(text);
}

function isSinusCtOrder(order: AIIEOrder): boolean {
  const cpt = normalizeCpt(order.cpt);
  if (SINUS_CT_CPTS.has(cpt)) {
    return true;
  }
  const text = orderText(order);
  return text.includes("ct") && /\b(sinus|sinonasal|paranasal|maxillofacial)\b/.test(text);
}

function isLowBackPainContext(clinical: AIIEClinicalFactors, snapshot?: PatientRecordSnapshot): boolean {
  const text = clinicalText(clinical);
  return /\b(low\s*back|lumbar|lumbago|back\s*pain)\b/.test(text) || hasIcdPrefixFromSnapshot(snapshot, ["M54"]);
}

function isStableOrSubacuteBackPain(clinical: AIIEClinicalFactors): boolean {
  const text = clinicalText(clinical);
  if (/\b(chronic|>?\s*6\s*weeks?|>?\s*12\s*weeks?|months?)\b/.test(text)) {
    return true;
  }
  if (/\b(acute|days?|recent|new onset)\b/.test(text)) {
    return true;
  }
  return clinical.duration === "Unknown" || !/\b(hour|emergent|stat)\b/i.test(text);
}

function isMinorHeadInjuryContext(clinical: AIIEClinicalFactors): boolean {
  const text = clinicalText(clinical);
  return (
    /\b(head\s*injur|minor\s*head|concussion|mhi\b|closed\s*head)\b/.test(text) ||
    (/\bhead\b/.test(text) && /\b(injur|trauma|fall|hit)\b/.test(text))
  );
}

function isSuspectedPeContext(clinical: AIIEClinicalFactors, snapshot?: PatientRecordSnapshot): boolean {
  const text = clinicalText(clinical);
  return (
    /\b(pe\b|pulmonary\s+embol|embolus|pleuritic|sudden\s+dyspnea)\b/.test(text) ||
    hasIcdPrefixFromSnapshot(snapshot, ["R07", "I26"])
  );
}

function isKneePainContext(clinical: AIIEClinicalFactors, snapshot?: PatientRecordSnapshot): boolean {
  const text = clinicalText(clinical);
  return /\bknee\b/.test(text) || hasIcdPrefixFromSnapshot(snapshot, ["M25.5", "M23", "M17"]);
}

function isAcuteRhinosinusitisContext(
  clinical: AIIEClinicalFactors,
  snapshot?: PatientRecordSnapshot,
): boolean {
  const text = clinicalText(clinical);
  return (
    /\b(sinusitis|rhinosinusitis|sinus\s+infection|facial\s+pain|nasal\s+congestion)\b/.test(text) ||
    hasIcdPrefixFromSnapshot(snapshot, ["J01", "J32"])
  );
}

function hasIcdPrefixFromSnapshot(snapshot: PatientRecordSnapshot | undefined, prefixes: string[]): boolean {
  if (!snapshot) {
    return false;
  }
  return snapshot.codingContext.activeIcd10.some((code) =>
    prefixes.some((p) => code.toUpperCase().startsWith(p.toUpperCase())),
  );
}

function hasSpinalImagingRedFlags(redFlags: AIIERedFlags): boolean {
  return (
    redFlags.neurologicalDeficit ||
    redFlags.bladderBowelDysfunction ||
    redFlags.cancerHistory ||
    redFlags.fever ||
    redFlags.trauma ||
    redFlags.weightLoss ||
    redFlags.progressiveSymptoms ||
    redFlags.suddenOnset ||
    redFlags.immunocompromised
  );
}

function hasHeadCtRedFlags(redFlags: AIIERedFlags): boolean {
  return (
    redFlags.neurologicalDeficit ||
    redFlags.suddenOnset ||
    redFlags.cancerHistory ||
    redFlags.immunocompromised ||
    redFlags.fever ||
    redFlags.trauma
  );
}

function hasKneeMriRedFlags(redFlags: AIIERedFlags): boolean {
  return redFlags.trauma || redFlags.neurologicalDeficit;
}

function hasPeImagingRedFlags(redFlags: AIIERedFlags, snapshot?: PatientRecordSnapshot): boolean {
  if (redFlags.trauma || redFlags.immunocompromised) {
    return true;
  }
  const text = snapshot ? snapshotText(snapshot) : "";
  return (
    /\b(hypotension|shock|hemodynamic)\b/i.test(text) ||
    snapshotLabPositive(snapshot, "d-dimer") ||
    wellsScoreHigh(snapshot, text)
  );
}

function hasSinusCtRedFlags(redFlags: AIIERedFlags, snapshot?: PatientRecordSnapshot): boolean {
  if (redFlags.fever || redFlags.immunocompromised) {
    return true;
  }
  const text = snapshot ? snapshotText(snapshot) : "";
  return /\b(orbital cellulitis|proptosis|vision change|meningitis|intracranial)\b/i.test(text);
}

function canadianCtHeadRuleNegative(input: OveruseMatchInput): boolean {
  const gcs = input.snapshot?.codingContext.glasgowComaScale;
  if (gcs != null && gcs < 15) {
    return false;
  }
  const text = `${clinicalText(input.clinical)} ${snapshotText(input.snapshot)}`;
  if (/\b(gcs\s*[<≤]\s*15|altered\s+mental|loss\s+of\s+consciousness|loc\b)\b/i.test(text)) {
    return false;
  }
  if (/\b(skull\s+fracture|basilar|battle\s+sign|raccoon\s+eyes|csf\s+leak)\b/i.test(text)) {
    return false;
  }
  if (/\b(vomit\w*\s*(x|≥|>=)\s*2|two\s+episodes?\s+of\s+vomiting)\b/i.test(text)) {
    return false;
  }
  if (/\b(dangerous\s+mechanism|pedestrian|ejection|fall\s*[>≥]\s*3|fall\s*>\s*5)\b/i.test(text)) {
    return false;
  }
  if (/\b(amnesia|anticoagul|warfarin|apixaban|rivaroxaban|bleeding\s+disorder)\b/i.test(text)) {
    return false;
  }
  if (input.clinical.redFlags.ageOver50 && /\bage\s*(≥|>=)\s*65\b/i.test(text)) {
    return false;
  }
  return gcs === 15 || gcs == null;
}

function wellsScoreLowOrModerate(input: OveruseMatchInput): boolean {
  const score = parseWellsScore(input);
  if (score == null) {
    const text = `${clinicalText(input.clinical)} ${snapshotText(input.snapshot)}`;
    return !wellsScoreHighFromText(text, input.snapshot);
  }
  return score >= 0 && score <= 4;
}

function percRuleSatisfied(input: OveruseMatchInput): boolean {
  const text = `${clinicalText(input.clinical)} ${snapshotText(input.snapshot)}`;
  if (/\bperc\s*(negative|not\s+met|failed|positive)\b/i.test(text)) {
    if (/\bperc\s*positive\b/i.test(text)) {
      return false;
    }
    return /\bperc\s*negative\b/i.test(text);
  }
  if (/\b(hemoptysis|active\s+cancer|surgery\s+within|estrogen|prior\s+(pe|dvt))\b/i.test(text)) {
    return false;
  }
  if (/\bheart\s*rate\s*≥?\s*100|tachycard/i.test(text)) {
    return false;
  }
  if (/\b(spo2|o2\s*sat).{0,12}(<|≤)\s*94\b/i.test(text)) {
    return false;
  }
  return true;
}

function parseWellsScore(input: OveruseMatchInput): number | null {
  const text = `${clinicalText(input.clinical)} ${snapshotText(input.snapshot)}`;
  const m = /\bwells\s*(?:score|criteria)?\s*[:=]?\s*(\d+(?:\.\d+)?)\b/i.exec(text);
  if (m?.[1]) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
  if (/\bwells\s*(low|unlikely)\b/i.test(text)) {
    return 1;
  }
  if (/\bwells\s*(moderate|intermediate)\b/i.test(text)) {
    return 3;
  }
  if (/\bwells\s*(high|likely)\b/i.test(text)) {
    return 6;
  }
  return null;
}

function wellsScoreHighFromText(text: string, snapshot?: PatientRecordSnapshot): boolean {
  const m = /\bwells\s*(?:score|criteria)?\s*[:=]?\s*(\d+(?:\.\d+)?)\b/i.exec(text);
  if (m?.[1]) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 4) {
      return true;
    }
  }
  if (/\bwells\s*(high|likely|>?\s*6)\b/i.test(text)) {
    return true;
  }
  return hasIcdPrefixFromSnapshot(snapshot, ["I26"]);
}

function wellsScoreHigh(snapshot: PatientRecordSnapshot | undefined, text: string): boolean {
  return wellsScoreHighFromText(text, snapshot);
}

function failedAntibioticCourseDocumented(input: OveruseMatchInput): boolean {
  const text = `${clinicalText(input.clinical)} ${snapshotText(input.snapshot)}`;
  return /\b(failed\s+antibiotic|persistent\s+after\s+antibiotic|≥\s*10\s*days?\s+of\s+antibiotic|antibiotic\s+course\s+completed)\b/i.test(
    text,
  );
}

function snapshotText(snapshot?: PatientRecordSnapshot): string {
  if (!snapshot) {
    return "";
  }
  const parts: string[] = [];
  for (const n of snapshot.notes) {
    if (n.description) {
      parts.push(n.description);
    }
  }
  for (const e of snapshot.encounters) {
    if (e.reasonDisplay) {
      parts.push(e.reasonDisplay);
    }
  }
  for (const v of snapshot.vitals) {
    parts.push(`${v.display} ${v.valueSummary ?? ""}`);
  }
  for (const l of snapshot.labs) {
    parts.push(`${l.display} ${l.valueSummary ?? ""}`);
  }
  return parts.join(" ").toLowerCase();
}

function snapshotLabPositive(snapshot: PatientRecordSnapshot | undefined, hint: string): boolean {
  if (!snapshot) {
    return false;
  }
  return snapshot.labs.some((l) => {
    const blob = `${l.display} ${l.valueSummary ?? ""}`.toLowerCase();
    if (!blob.includes(hint)) {
      return false;
    }
    return /\b(positive|elevated|high|>\s*\d{3})\b/.test(blob) || /\b\d{4,}\b/.test(blob);
  });
}
