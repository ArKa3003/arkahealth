/**
 * VFSS vs FEES vs bedside clinical swallow evaluation triage (Non-Device CDS).
 *
 * Rule rows (first matching clinical context wins):
 * | Factor | Recommendation |
 * |--------|----------------|
 * | Stroke with aspiration concern | FEES bedside first unless posterior fossa involvement |
 * | Post-extubation | Bedside SLP evaluation ± FEES first |
 * | Progressive neuromuscular disease (ALS, PD) | VFSS for compensatory strategy trial |
 * | Esophageal phase concern / dysphagia with reflux | VFSS |
 * | Head & neck cancer post-treatment | VFSS |
 * | No swallow-specific red flags | Clinical bedside swallow eval |
 *
 * Citations:
 * - ASHA Practice Portal — Fiberoptic Endoscopic Evaluation of Swallowing (FEES);
 *   bedside swallow screening before instrumental studies when safe.
 * - ACR Appropriateness Criteria — Dysphagia (oropharyngeal vs esophageal phase;
 *   modified barium swallow / VFSS when esophageal or structural assessment required).
 *
 * @module lib/aiie/swallow-triage
 */

import type { AIIEFactor, AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

/** Instrument or evaluation modality proposed or recommended. */
export type SwallowModality = "VFSS" | "FEES" | "bedside_sle" | "unknown";

/**
 * Structured swallow-study triage output for CDS cards and AIIE factor append.
 */
export interface SwallowTriageAssessment {
  /** Modality inferred from the current order text. */
  proposed: SwallowModality;
  /** Guideline-aligned modality for this clinical context. */
  recommendation: SwallowModality;
  /** Plain-language rationale for clinicians and QI review. */
  rationale: string;
  /** SHAP-style factors documenting which rule rows fired. */
  supportingFactors: AIIEFactor[];
  /** True when the ordered study likely exceeds the recommended first step. */
  disagreesWithProposed: boolean;
}

export interface TriageSwallowInput {
  snapshot: PatientRecordSnapshot;
  order: AIIEOrder;
  complaint: string;
}

const SWALLOW_ORDER_PATTERN =
  /video\s*swallow|modified\s*barium|VFSS|FEES|fiberoptic\s*endoscopic\s*evaluation/i;

const VFSS_ORDER_PATTERN = /video\s*swallow|modified\s*barium|VFSS|barium\s*swallow/i;
const FEES_ORDER_PATTERN = /FEES|fiberoptic\s*endoscopic\s*evaluation/i;

const STROKE_LEXICON =
  /\b(?:stroke|cva|cerebrovascular|brain\s+infarct|ischemic\s+stroke|hemorrhagic\s+stroke)\b/i;
const ASPIRATION_LEXICON =
  /\b(?:aspiration|aspirates?|dysphagia|swallow\s+difficult|penetration|silent\s+aspiration)\b/i;
const POSTERIOR_FOSSA_LEXICON =
  /\b(?:posterior\s+fossa|brainstem|pontine|cerebellar\s+infarct|medullary|infratentorial)\b/i;
const POST_EXTUBATION_LEXICON =
  /\b(?:post[- ]?extubat(?:ion|ed)?|after\s+extubat(?:ion|ed)?|recently\s+extubat(?:ion|ed)?|post[- ]?intubat(?:ion|ed)?|weaned\s+from\s+vent)\b/i;
const NEUROMUSCULAR_LEXICON =
  /\b(?:\bals\b|amyotrophic\s+lateral|parkinson|parkinson'?s|progressive\s+neuromuscular|bulbar\s+als)\b/i;
const ESOPHAGEAL_LEXICON =
  /\b(?:esophageal\s+phase|esophageal\s+dysphagia|transfer\s+dysphagia|GERD|gastroesophageal\s+reflux|reflux|globus|odynophagia)\b/i;
const HEAD_NECK_CANCER_LEXICON =
  /\b(?:head\s+and\s+neck\s+cancer|HNC|oropharyngeal\s+cancer|laryngeal\s+cancer|post[- ]?radiation|post[- ]?chemoradiation|post[- ]?XRT|post[- ]?RT\s+to\s+neck)\b/i;

const ASHA_FEES_CITATION =
  "ASHA Practice Portal — FEES: bedside screening and endoscopic evaluation before fluoroscopy when oropharyngeal mechanism is the primary question.";
const ACR_VFSS_CITATION =
  "ACR Appropriateness Criteria — Dysphagia: VFSS/modified barium swallow when esophageal phase, structural, or compensatory strategy assessment requires fluoroscopy.";
const ASHA_BEDSIDE_CITATION =
  "ASHA — Clinical bedside swallow evaluation is the appropriate first step when no red flags require immediate instrumental study.";

const FACTOR_WEIGHT = 0.06;
const DELTA_SCALE = 4;

/**
 * Returns true when the procedure text describes a swallow instrumental study.
 *
 * @param procedure - Order procedure display string.
 */
export function isSwallowStudyOrder(procedure: string): boolean {
  return SWALLOW_ORDER_PATTERN.test(procedure);
}

/**
 * Scores swallow orders against condition-appropriate VFSS / FEES / bedside triage rules.
 *
 * @param input - Record snapshot, order, and presenting complaint text.
 */
export function triageSwallow(input: TriageSwallowInput): SwallowTriageAssessment {
  const proposed = inferProposedModality(input.order.procedure);
  const corpus = buildClinicalCorpus(input);

  const matched = matchTriageRule(corpus);
  const recommendation = matched.recommendation;
  const disagreesWithProposed =
    proposed !== "unknown" &&
    recommendation !== "unknown" &&
    proposed !== recommendation;

  const supportingFactors: AIIEFactor[] = [
    buildSwallowFactor(matched.factorId, matched.factorName, matched.present, matched.citation, matched.signal),
  ];

  if (disagreesWithProposed) {
    supportingFactors.push(
      buildSwallowFactor(
        "swallow_over_order_risk",
        "Ordered swallow study exceeds recommended first step",
        true,
        `${ASHA_FEES_CITATION} ${ACR_VFSS_CITATION}`,
        -0.45,
      ),
    );
  }

  return {
    proposed,
    recommendation,
    rationale: matched.rationale,
    supportingFactors,
    disagreesWithProposed,
  };
}

interface MatchedRule {
  factorId: string;
  factorName: string;
  recommendation: SwallowModality;
  rationale: string;
  citation: string;
  present: boolean;
  signal: number;
}

function matchTriageRule(corpus: string): MatchedRule {
  if (STROKE_LEXICON.test(corpus) && ASPIRATION_LEXICON.test(corpus)) {
    if (POSTERIOR_FOSSA_LEXICON.test(corpus)) {
      return {
        factorId: "swallow_stroke_posterior_fossa",
        factorName: "Stroke with posterior fossa involvement",
        recommendation: "VFSS",
        rationale:
          "Posterior fossa or brainstem involvement may require fluoroscopic assessment of swallow physiology; VFSS is appropriate when bedside screening cannot characterize pharyngeal transfer.",
        citation: ACR_VFSS_CITATION,
        present: true,
        signal: 0.35,
      };
    }
    return {
      factorId: "swallow_stroke_aspiration",
      factorName: "Stroke with aspiration concern",
      recommendation: "FEES",
      rationale:
        "After stroke with aspiration concern, FEES at the bedside is typically the first instrumental study unless posterior fossa involvement requires fluoroscopic characterization.",
      citation: ASHA_FEES_CITATION,
      present: true,
      signal: 0.4,
    };
  }

  if (POST_EXTUBATION_LEXICON.test(corpus)) {
    return {
      factorId: "swallow_post_extubation",
      factorName: "Post-extubation dysphagia",
      recommendation: "bedside_sle",
      rationale:
        "Post-extubation swallow screening should begin with bedside clinical evaluation by speech-language pathology, with FEES when instrumental confirmation is needed before fluoroscopy.",
      citation: ASHA_BEDSIDE_CITATION,
      present: true,
      signal: 0.35,
    };
  }

  if (NEUROMUSCULAR_LEXICON.test(corpus)) {
    return {
      factorId: "swallow_neuromuscular",
      factorName: "Progressive neuromuscular disease",
      recommendation: "VFSS",
      rationale:
        "Progressive neuromuscular disease (e.g., ALS, Parkinson disease) often warrants VFSS to trial compensatory strategies and document pharyngeal bolus flow under fluoroscopy.",
      citation: ACR_VFSS_CITATION,
      present: true,
      signal: 0.3,
    };
  }

  if (ESOPHAGEAL_LEXICON.test(corpus)) {
    return {
      factorId: "swallow_esophageal_phase",
      factorName: "Esophageal phase / reflux-related dysphagia",
      recommendation: "VFSS",
      rationale:
        "Esophageal-phase dysphagia or reflux-related symptoms align with VFSS to evaluate bolus transit through the pharynx and esophagus.",
      citation: ACR_VFSS_CITATION,
      present: true,
      signal: 0.3,
    };
  }

  if (HEAD_NECK_CANCER_LEXICON.test(corpus)) {
    return {
      factorId: "swallow_head_neck_cancer",
      factorName: "Head and neck cancer post-treatment",
      recommendation: "VFSS",
      rationale:
        "Post-treatment head and neck cancer often requires VFSS to assess structural changes, aspiration risk, and compensatory maneuvers under fluoroscopy.",
      citation: ACR_VFSS_CITATION,
      present: true,
      signal: 0.35,
    };
  }

  return {
    factorId: "swallow_bedside_first",
    factorName: "No swallow-specific red flags",
    recommendation: "bedside_sle",
    rationale:
      "Without stroke-aspiration, post-extubation, neuromuscular, esophageal, or head-and-neck cancer drivers, begin with clinical bedside swallow evaluation before ordering VFSS or FEES.",
    citation: ASHA_BEDSIDE_CITATION,
    present: false,
    signal: 0.15,
  };
}

function inferProposedModality(procedure: string): SwallowModality {
  if (FEES_ORDER_PATTERN.test(procedure)) {
    return "FEES";
  }
  if (VFSS_ORDER_PATTERN.test(procedure)) {
    return "VFSS";
  }
  if (isSwallowStudyOrder(procedure)) {
    return "unknown";
  }
  return "unknown";
}

function buildClinicalCorpus(input: TriageSwallowInput): string {
  const parts: string[] = [
    input.complaint,
    input.order.procedure,
    input.order.bodyPart ?? "",
  ];
  for (const p of input.snapshot.problems) {
    parts.push(p.display);
  }
  for (const n of input.snapshot.notes) {
    if (n.description) {
      parts.push(n.description);
    }
  }
  for (const e of input.snapshot.encounters) {
    if (e.reasonDisplay) {
      parts.push(e.reasonDisplay);
    }
  }
  return parts.join(" ").toLowerCase();
}

function buildSwallowFactor(
  id: string,
  name: string,
  present: boolean,
  evidenceCitation: string,
  signal: number,
): AIIEFactor {
  const clamped = Math.max(-1, Math.min(1, signal));
  return {
    id,
    name,
    weight: FACTOR_WEIGHT,
    contribution: FACTOR_WEIGHT * clamped * DELTA_SCALE,
    present,
    evidenceCitation,
  };
}
