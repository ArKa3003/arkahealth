import type { AIIEClinicalFactors, AIIERedFlags } from "@/lib/types/aiie";

/**
 * Lexicon entry mapping free-text phrases to {@link AIIEClinicalFactors.symptoms} ids.
 */
export interface SymptomLexiconEntry {
  /** What clinicians typically write that this rule captures. */
  comment: string;
  /** Case-insensitive pattern tested against normalized note text. */
  pattern: RegExp;
  /** Canonical symptom token stored on {@link AIIEClinicalFactors.symptoms}. */
  symptomId: string;
}

/**
 * Lexicon entry mapping phrases to {@link AIIEClinicalFactors.redFlags} booleans.
 */
export interface RedFlagLexiconEntry {
  /** Clinical meaning of the matched phrase. */
  comment: string;
  pattern: RegExp;
  /** {@link AIIERedFlags} field set to true when matched. */
  flag: keyof AIIERedFlags;
}

/**
 * Regex bundle for {@link AIIEClinicalFactors.duration} extraction.
 */
export interface DurationRegexEntry {
  comment: string;
  regex: RegExp;
  /** When true, match is preferred over generic duration patterns (e.g. "x 6 weeks"). */
  priority?: boolean;
}

/**
 * Regex bundle for conservative-care fields on {@link AIIEClinicalFactors}.
 */
export interface ConservativeCareRegexEntry {
  comment: string;
  regex: RegExp;
  /** Maps capture groups to tried flag and optional duration string. */
  mapsTo: "tried" | "duration";
}

/** Symptom phrase lexicon — deterministic, no ML. */
export const SYMPTOMS: readonly SymptomLexiconEntry[] = [
  {
    comment: "Progressive or worsening symptoms (spine, neuro, general)",
    pattern: /\bprogressive(?:\s+(?:neuro(?:logical)?|symptoms?|deficits?|weakness))?\b/i,
    symptomId: "progressive_symptoms",
  },
  {
    comment: "Neurologic deficit, weakness, or sensory loss",
    pattern: /\b(?:neuro(?:logical)?\s*deficits?|focal\s+weakness|numbness|paresthesia|radiculopathy)\b/i,
    symptomId: "neurological_deficit",
  },
  {
    comment: "Sudden or acute onset",
    pattern: /\b(?:sudden|acute)\s+onset\b/i,
    symptomId: "sudden_onset",
  },
  {
    comment: "Lower back or lumbar pain",
    pattern: /\b(?:low(?:er)?\s*back|lumbar)\s+pain\b/i,
    symptomId: "low_back_pain",
  },
  {
    comment: "Radicular leg pain or sciatica",
    pattern: /\b(?:sciatica|radicular\s+leg\s+pain|leg\s+pain)\b/i,
    symptomId: "radicular_leg_pain",
  },
  {
    comment: "Headache",
    pattern: /\b(?:headache|cephalgia)\b/i,
    symptomId: "headache",
  },
  {
    comment: "Chest pain",
    pattern: /\bchest\s+pain\b/i,
    symptomId: "chest_pain",
  },
  {
    comment: "Dyspnea or shortness of breath",
    pattern: /\b(?:dyspnea|shortness\s+of\s+breath|SOB)\b/i,
    symptomId: "dyspnea",
  },
  {
    comment: "Bladder or bowel dysfunction (cauda equina concern)",
    pattern: /\b(?:bladder|bowel)\s+(?:dysfunction|retention|incontinence)\b/i,
    symptomId: "bladder_bowel_dysfunction",
  },
] as const;

/** Red-flag phrase lexicon — maps to {@link AIIERedFlags}. */
export const RED_FLAG_PHRASES: readonly RedFlagLexiconEntry[] = [
  {
    comment: "Progressive or worsening course",
    pattern: /\bprogressive\b/i,
    flag: "progressiveSymptoms",
  },
  {
    comment: "Neurologic deficit",
    pattern: /\b(?:neuro(?:logical)?\s*deficits?|focal\s+weakness|cord\s+compression)\b/i,
    flag: "neurologicalDeficit",
  },
  {
    comment: "Prior or active malignancy",
    pattern: /\b(?:cancer|malignan(?:cy|t)|oncolog|metastas)\b/i,
    flag: "cancerHistory",
  },
  {
    comment: "Unexplained weight loss",
    pattern: /\b(?:weight\s+loss|unintentional\s+weight\s+loss)\b/i,
    flag: "weightLoss",
  },
  {
    comment: "Fever or systemic infection concern",
    pattern: /\b(?:fever|febrile|infection\s+concern)\b/i,
    flag: "fever",
  },
  {
    comment: "Recent trauma",
    pattern: /\b(?:trauma|injury|fall|MVC|motor\s+vehicle)\b/i,
    flag: "trauma",
  },
  {
    comment: "Immunocompromised host",
    pattern: /\b(?:immunocompromised|immunosuppressed|HIV|transplant)\b/i,
    flag: "immunocompromised",
  },
  {
    comment: "IV drug use",
    pattern: /\b(?:IV\s*drug|intravenous\s+drug|injection\s+drug)\b/i,
    flag: "ivDrugUse",
  },
  {
    comment: "Age over 50 with new symptoms",
    pattern: /\b(?:age\s*>\s*50|over\s*50|older\s+than\s+50)\b/i,
    flag: "ageOver50",
  },
  {
    comment: "Bladder or bowel dysfunction",
    pattern: /\b(?:bladder|bowel)\s+(?:dysfunction|retention|incontinence)\b/i,
    flag: "bladderBowelDysfunction",
  },
  {
    comment: "Sudden onset red flag",
    pattern: /\b(?:sudden|acute)\s+onset\b/i,
    flag: "suddenOnset",
  },
  {
    comment: "Osteoporosis or fragility fracture risk",
    pattern: /\b(?:osteoporosis|fragility\s+fracture)\b/i,
    flag: "osteoporosis",
  },
] as const;

/** Duration patterns for {@link AIIEClinicalFactors.duration}. */
export const DURATION_REGEX: readonly DurationRegexEntry[] = [
  {
    comment: 'Symptom duration shorthand "x N unit" (e.g. x 6 weeks)',
    regex: /\bx\s*(\d+)\s*(weeks?|days?|months?|years?)\b/i,
    priority: true,
  },
  {
    comment: "Symptom duration for N weeks/days/months",
    regex: /\b(?:for|lasting|duration\s+of)\s+(\d+)\s*(weeks?|days?|months?|years?)\b/i,
  },
  {
    comment: "Bare N-unit duration when not tied to conservative care clause",
    regex: /\b(\d+)\s*(weeks?|days?|months?|years?)\b/i,
  },
] as const;

/** Conservative-care patterns for {@link AIIEClinicalFactors.conservativeManagementTried}. */
export const CONSERVATIVE_CARE_REGEX: readonly ConservativeCareRegexEntry[] = [
  {
    comment: "Physical therapy or PT course implies conservative care tried",
    regex: /\b(?:PT|physical\s+therapy)\b/i,
    mapsTo: "tried",
  },
  {
    comment: "Explicit conservative management",
    regex: /\bconservative\s+(?:care|management|treatment)\b/i,
    mapsTo: "tried",
  },
  {
    comment: "NSAIDs, activity modification, or structured non-operative trial",
    regex: /\b(?:NSAIDs?|activity\s+modification|non[- ]?operative\s+trial)\b/i,
    mapsTo: "tried",
  },
  {
    comment: "Duration of PT or conservative care (e.g. PT for 2 months)",
    regex:
      /\b(?:PT|physical\s+therapy|conservative\s+(?:care|management|treatment))\s+for\s+(\d+)\s*(weeks?|days?|months?|years?)\b/i,
    mapsTo: "duration",
  },
] as const;
