/**
 * @file shap-calculator.ts
 * @description Formats SHAP values into clinician-friendly explanations for CDS cards and UI.
 *   Produces narrative summaries, markdown detail, and evidence citations from ARKA AIIE Evidence Library.
 */

import type { SHAPValues, SHAPFeatureContribution } from './types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import { extractFeatures } from './feature-engineer';

// =============================================================================
// Output types
// =============================================================================

export interface FormattedFactor {
  featureName: string;
  displayName: string;
  value: string;
  contribution: number;
  direction: 'supports' | 'opposes' | 'neutral';
  explanation: string;
  evidenceCitation?: string;
  icon: string;
}

export interface FormattedSHAPExplanation {
  baselineScore: number;
  finalScore: number;
  factors: FormattedFactor[];
  topPositive: FormattedFactor[];
  topNegative: FormattedFactor[];
  narrativeSummary: string;
  markdownDetail: string;
  clinicalRationale: string;
}

// =============================================================================
// Feature display names (clinician-friendly)
// =============================================================================

export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  patient_age: 'Patient Age',
  patient_sex: 'Patient Sex',
  modality_code: 'Imaging Modality',
  body_site_code: 'Body Region',
  indication_category: 'Clinical Indication',
  symptom_duration_days: 'Symptom Duration',
  has_red_flags: 'Red Flag Symptoms',
  cancer_history: 'Cancer History',
  neurological_deficit: 'Neurological Deficit',
  fever_present: 'Fever',
  is_pregnant: 'Pregnancy Status',
  has_contrast_allergy: 'Contrast Allergy',
  egfr_value: 'Kidney Function (eGFR)',
  on_anticoagulation: 'On Blood Thinners',
  on_metformin: 'On Metformin',
  prior_imaging_count_90d: 'Recent Imaging Studies',
  days_since_last_imaging: 'Days Since Last Imaging',
  same_modality_prior_30d: 'Same Study in Last 30 Days',
  same_body_site_prior_30d: 'Same Region Imaged in Last 30 Days',
  urgency_level: 'Order Urgency',
  comorbidity_count: 'Number of Active Conditions',
  conservative_tx_tried: 'Conservative Treatment Attempted',
  imaging_in_problem_list: 'Imaging-Relevant Diagnosis',
};

// =============================================================================
// Reverse lookups for encoded features (match feature-engineer encodings)
// =============================================================================

const MODALITY_CODE_TO_NAME: Record<number, string> = {
  0: 'Unknown',
  1: 'CT',
  2: 'MRI',
  3: 'X-ray',
  4: 'Ultrasound',
  5: 'Nuclear Medicine',
  6: 'PET-CT',
  7: 'Mammography',
  8: 'Fluoroscopy',
  9: 'DX',
  10: 'CR',
};

const BODY_SITE_CODE_TO_NAME: Record<number, string> = {
  0: 'Unknown',
  1: 'Head',
  2: 'Brain',
  3: 'Spine',
  4: 'Chest',
  5: 'Abdomen',
  6: 'Pelvis',
  7: 'Extremity',
  8: 'Neck',
  9: 'Cardiac',
};

const INDICATION_CODE_TO_NAME: Record<number, string> = {
  0: 'Other',
  1: 'Headache',
  2: 'Back pain',
  3: 'Trauma',
  4: 'Stroke',
  5: 'Infection',
  6: 'Cancer surveillance',
  7: 'Screening',
};

const URGENCY_LEVEL_TO_NAME: Record<number, string> = {
  0: 'Routine',
  1: 'Urgent',
  2: 'ASAP',
  3: 'Stat',
};

// =============================================================================
// eGFR stage helper
// =============================================================================

function egfrStage(value: number): string {
  if (value < 0) return '';
  if (value >= 90) return 'Normal (≥90)';
  if (value >= 60) return 'Mild (60-89)';
  if (value >= 30) return 'Moderate (30-59)';
  if (value >= 15) return 'Severe (15-29)';
  return 'Failure (<15)';
}

// =============================================================================
// Feature value formatters
// =============================================================================

function formatFeatureValue(featureName: string, rawValue: number): string {
  const v = rawValue;
  switch (featureName) {
    case 'patient_age':
      return Number.isFinite(v) && v >= 0 ? `${Math.round(v)} years old` : 'Not specified';
    case 'patient_sex':
      return v === 1 ? 'Male' : v === 0 ? 'Female' : 'Unknown';
    case 'modality_code':
      return MODALITY_CODE_TO_NAME[Math.round(v)] ?? 'Unknown';
    case 'body_site_code':
      return BODY_SITE_CODE_TO_NAME[Math.round(v)] ?? 'Unknown';
    case 'indication_category':
      return INDICATION_CODE_TO_NAME[Math.round(v)] ?? 'Other';
    case 'symptom_duration_days':
      if (v < 0) return 'Not specified';
      if (v <= 14) return `${Math.round(v)} days`;
      if (v <= 60) return `${Math.round(v / 7)} weeks`;
      return `${Math.round(v / 30)} months`;
    case 'has_red_flags':
      return v === 1 ? 'Present' : 'None identified';
    case 'egfr_value':
      if (v < 0) return 'Not available';
      const stage = egfrStage(v);
      return `${Math.round(v)} mL/min/1.73m²${stage ? ` (${stage})` : ''}`;
    case 'urgency_level':
      return URGENCY_LEVEL_TO_NAME[Math.round(v)] ?? 'Routine';
    case 'days_since_last_imaging':
      if (v < 0) return 'No recent imaging';
      return `${Math.round(v)} days ago`;
    case 'prior_imaging_count_90d':
      return `${Math.round(v)} in last 90 days`;
    case 'cancer_history':
    case 'neurological_deficit':
    case 'fever_present':
    case 'is_pregnant':
    case 'has_contrast_allergy':
    case 'on_anticoagulation':
    case 'on_metformin':
    case 'same_modality_prior_30d':
    case 'same_body_site_prior_30d':
    case 'conservative_tx_tried':
    case 'imaging_in_problem_list':
      return v === 1 ? 'Yes' : 'No';
    case 'comorbidity_count':
      return Number.isFinite(v) ? `${Math.round(v)}` : '0';
    default:
      return Number.isFinite(v) ? String(v) : '—';
  }
}

// =============================================================================
// Direction and icon
// =============================================================================

function getDirectionAndIcon(contribution: number): { direction: 'supports' | 'opposes' | 'neutral'; icon: string } {
  if (contribution > 0) return { direction: 'supports', icon: '✅' };
  if (contribution < 0) return { direction: 'opposes', icon: '⚠️' };
  return { direction: 'neutral', icon: '➖' };
}

// =============================================================================
// Plain-English explanation per factor
// =============================================================================

function buildFactorExplanation(
  featureName: string,
  value: string,
  direction: 'supports' | 'opposes' | 'neutral',
  displayName: string
): string {
  if (direction === 'neutral') return `${displayName} (${value}) has minimal impact on this appropriateness score.`;
  const verb = direction === 'supports' ? 'supports' : 'reduces';
  const template = direction === 'supports'
    ? `${displayName} (${value}) ${verb} the appropriateness of this order.`
    : `${displayName} (${value}) ${verb} the appropriateness of this order.`;
  switch (featureName) {
    case 'symptom_duration_days':
      return direction === 'supports'
        ? `Symptom duration (${value}) supports a trial of conservative management before imaging when no red flags are present.`
        : `Short symptom duration (${value}) may favor imaging when red flags are present or when follow-up is needed.`;
    case 'cancer_history':
      return direction === 'supports'
        ? `Cancer history (${value}) supports advanced imaging when clinically indicated.`
        : `Absence of cancer history (${value}) is consistent with lower pretest probability for malignancy.`;
    case 'neurological_deficit':
      return direction === 'supports'
        ? `Neurological deficit (${value}) supports advanced imaging to evaluate for structural cause.`
        : `No neurological deficit (${value}) may favor conservative workup when appropriate.`;
    case 'prior_imaging_count_90d':
      return direction === 'opposes'
        ? `Recent imaging (${value}) suggests possible duplication; repeat imaging may not add value.`
        : `Limited recent imaging (${value}) supports that this study would add new information.`;
    case 'same_modality_prior_30d':
    case 'same_body_site_prior_30d':
      return direction === 'opposes'
        ? `Same study or region recently imaged (${value}) may reduce incremental benefit.`
        : `No recent same study (${value}) supports that this order adds new information.`;
    case 'conservative_tx_tried':
      return direction === 'supports'
        ? `Conservative treatment attempted (${value}) supports proceeding to imaging when symptoms persist.`
        : `No documented conservative trial (${value}) may favor non-imaging options first when appropriate.`;
    case 'egfr_value':
      return direction === 'opposes'
        ? `Kidney function (${value}) affects contrast safety; alternatives or precautions may be indicated.`
        : `Kidney function (${value}) is consistent with contrast use when indicated.`;
    case 'is_pregnant':
      return direction === 'opposes'
        ? `Pregnancy (${value}) affects modality choice (radiation/contrast); ultrasound or MRI without contrast may be preferred.`
        : `Pregnancy status (${value}) does not restrict modality selection.`;
    case 'has_contrast_allergy':
      return direction === 'opposes'
        ? `Contrast allergy (${value}) limits use of iodinated or gadolinium contrast; alternative modalities or premedication may be needed.`
        : `No contrast allergy (${value}) allows use of contrast when clinically indicated.`;
    default:
      return template;
  }
}

// =============================================================================
// Evidence citation mapper (ARKA AIIE Evidence Library — peer-reviewed; not ACR)
// =============================================================================

function getEvidenceCitation(
  featureName: string,
  scenario: ClinicalScenario,
  rawValue: number
): string | undefined {
  const modality = (scenario.proposedImaging?.modality ?? '').toString().toLowerCase();
  const indication = (scenario.proposedImaging?.indication ?? scenario.chiefComplaint ?? '').toLowerCase();
  const isBackPain = /back pain|low back|lumbar|spine pain/.test(indication);
  const isHeadache = /headache|head pain/.test(indication);
  const isChronicHeadache = /chronic headache|stable headache/.test(indication);
  const isThunderclap = /thunderclap|sudden severe/.test(indication);
  const isAppendicitis = /appendicitis|acute abdominal/.test(indication);
  const isPregnant = scenario.pregnancyStatus === 'pregnant';
  const isCT = modality.includes('ct');
  const eGFR = scenario.renalFunction?.value ?? rawValue;
  const lowEGFR = eGFR >= 0 && eGFR < 60;
  const hasContrastAllergy = scenario.contrastAllergy === true;

  if (featureName === 'symptom_duration_days' && isBackPain) {
    return 'ARKA AIIE Evidence: Low Back Pain Imaging — Imaging not recommended in first 6 weeks without red flags (Chou R et al., Lancet 2009; Jarvik JG et al., JAMA 2015)';
  }
  if (featureName === 'cancer_history') {
    return 'ARKA AIIE Evidence: Red Flag Protocols — MRI recommended when cancer history present (Deyo RA & Diehl AK, J Gen Intern Med 1988; Henschke N et al., Eur Spine J 2013)';
  }
  if (featureName === 'neurological_deficit') {
    return 'ARKA AIIE Evidence: Red Flag Protocols — Advanced imaging indicated with neurological symptoms (Chou R et al., Ann Intern Med 2007)';
  }
  if (featureName === 'indication_category' && isHeadache && isThunderclap) {
    return 'ARKA AIIE Evidence: Acute Headache — Emergent CT/CTA recommended for thunderclap headache (Edlow JA & Caplan LR, Stroke 2000; Perry JJ et al., BMJ 2011)';
  }
  if (featureName === 'prior_imaging_count_90d' || featureName === 'same_modality_prior_30d' || featureName === 'same_body_site_prior_30d') {
    return 'ARKA AIIE Evidence: Imaging Utilization — Avoid duplicate imaging within clinically appropriate intervals (ARKA institutional analysis; Defined by AIIE clinical advisory board)';
  }
  if (isPregnant && isCT && featureName === 'is_pregnant') {
    return 'ARKA AIIE Evidence: Pregnancy & Radiation Safety — Based on FDA guidance on imaging pregnant patients and ALARA principle (FDA Guidance 2019; Ray JG et al., JAMA 2016)';
  }
  if ((featureName === 'has_contrast_allergy' || featureName === 'egfr_value') && (hasContrastAllergy || lowEGFR)) {
    return 'ARKA AIIE Evidence: Contrast Safety — eGFR thresholds for iodinated contrast (Davenport MS et al., Radiology 2020; McDonald JS et al., Radiology 2014)';
  }
  if (featureName === 'patient_age' && rawValue < 18 && (isCT || modality.includes('x-ray'))) {
    return 'ARKA AIIE Evidence: Pediatric Imaging — Radiation sensitivity in pediatric patients warrants alternative modalities (Brenner DJ & Hall EJ, NEJM 2007; Miglioretti DL et al., JAMA Pediatr 2013)';
  }
  if (featureName === 'indication_category' && isAppendicitis) {
    return 'ARKA AIIE Evidence: Acute Abdominal Pain — CT sensitivity >95% for appendicitis in adults; US preferred in pediatrics (Doria AS et al., Radiology 2006; Smith-Bindman R et al., NEJM 2014)';
  }
  if (featureName === 'indication_category' && isChronicHeadache) {
    return 'ARKA AIIE Evidence: Chronic Headache — Imaging for stable chronic headache without red flags has low diagnostic yield (Frishberg BM et al., Neurology 2000; Detsky ME et al., BMJ 2006)';
  }
  if (isPregnant && modality.includes('mri') && featureName === 'is_pregnant') {
    return 'ARKA AIIE Evidence: MRI Contrast in Pregnancy — Gadolinium crosses placenta; avoid unless critical (Ray JG et al., JAMA 2016; FDA Drug Safety Communication 2018)';
  }
  return undefined;
}

// =============================================================================
// Narrative summary generator
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  Appropriate: 'appropriate',
  'May be appropriate': 'may be appropriate',
  'Not appropriate': 'not appropriate',
};

function scoreToCategory(score: number): string {
  if (score >= 7) return 'Appropriate';
  if (score >= 4) return 'May be appropriate';
  return 'Not appropriate';
}

function buildNarrativeSummary(
  scenario: ClinicalScenario,
  finalScore: number,
  topPositive: FormattedFactor[],
  topNegative: FormattedFactor[],
  category: string
): string {
  const modality = scenario.proposedImaging?.modality ?? 'Imaging';
  const bodyPart = scenario.proposedImaging?.bodyPart ?? 'region';
  const indication = scenario.proposedImaging?.indication ?? scenario.chiefComplaint ?? 'this indication';
  const categoryLower = CATEGORY_LABELS[category] ?? category.toLowerCase();
  const posReason = topPositive[0]?.explanation ?? 'clinical factors support this order';
  const negReason = topNegative[0]?.explanation ?? 'some factors suggest alternatives may be considered';
  const safetyNote = topNegative.some(
    (f) =>
      f.featureName === 'egfr_value' ||
      f.featureName === 'has_contrast_allergy' ||
      f.featureName === 'is_pregnant'
  )
    ? ' Please consider patient-specific safety factors before proceeding.'
    : '';

  const templates = [
    `This ${modality} of the ${bodyPart} for ${indication} is rated ${categoryLower} (score ${finalScore}/9). ${posReason} ${negReason}.${safetyNote}`,
    `Appropriateness score: ${finalScore}/9 (${category}). For ${indication}, ${modality} is ${categoryLower}. Key supporting factor: ${topPositive[0]?.displayName ?? 'clinical context'}. ${topNegative[0] ? `Limiting factor: ${topNegative[0].displayName}.` : ''}${safetyNote}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// =============================================================================
// Markdown detail generator (for CDS card detail field)
// =============================================================================

function buildMarkdownDetail(
  finalScore: number,
  category: string,
  factors: FormattedFactor[],
  clinicalRationale: string,
  citations: string[]
): string {
  const header = `### Appropriateness: ${finalScore}/9 — ${category}`;
  const tableRows = factors.map(
    (f) =>
      `| ${f.displayName} | ${f.value} | ${f.contribution >= 0 ? '+' : ''}${f.contribution.toFixed(2)} ${f.direction} |`
  );
  const table = [
    '**Key Factors:**',
    '',
    '| Factor | Value | Impact |',
    '|--------|-------|--------|',
    ...tableRows,
    '',
    '**Clinical Rationale:**',
    clinicalRationale,
    '',
  ].join('\n');
  const evidenceBlock =
    citations.length > 0
      ? ['**Evidence Base:**', ...citations.map((c) => `- ${c}`), ''].join('\n')
      : '';
  return [header, '', table, evidenceBlock].join('\n').trim();
}

// =============================================================================
// Clinical rationale (2–3 sentences for chart documentation)
// =============================================================================

function buildClinicalRationale(
  scenario: ClinicalScenario,
  finalScore: number,
  category: string,
  topPositive: FormattedFactor[],
  topNegative: FormattedFactor[]
): string {
  const indication = scenario.proposedImaging?.indication ?? scenario.chiefComplaint ?? 'clinical indication';
  const pos1 = topPositive[0]?.displayName;
  const neg1 = topNegative[0]?.displayName;
  const sentences = [
    `Imaging appropriateness for ${indication} is scored ${finalScore}/9 (${category}).`,
    pos1 ? `Factors supporting this order include ${pos1}.` : '',
    neg1 ? `Factors that may favor alternatives or additional workup include ${neg1}.` : '',
  ].filter(Boolean);
  return sentences.join(' ');
}

// =============================================================================
// Main export: formatSHAPExplanation
// =============================================================================

/**
 * Formats SHAP values and scenario into a clinician-friendly explanation.
 * Produces sorted factors, top positive/negative drivers, narrative summary,
 * markdown detail for CDS card, and clinical rationale for chart documentation.
 */
export function formatSHAPExplanation(
  shapValues: SHAPValues,
  scenario: ClinicalScenario
): FormattedSHAPExplanation {
  const baselineScore = shapValues.baseValue ?? 5.0;
  const contribs = shapValues.featureContributions ?? [];
  const featureVector = extractFeatures(scenario);

  const finalScore = Math.round(
    baselineScore + contribs.reduce((sum, c) => sum + c.shapValue, 0)
  );
  const clampedScore = Math.max(1, Math.min(9, finalScore));
  const category = scoreToCategory(clampedScore);

  const factors: FormattedFactor[] = contribs.map((c: SHAPFeatureContribution) => {
    const rawValue = typeof c.featureValue === 'number' ? c.featureValue : featureVector[c.feature] ?? 0;
    const value = formatFeatureValue(c.feature, rawValue);
    const displayName = FEATURE_DISPLAY_NAMES[c.feature] ?? c.feature.replace(/_/g, ' ');
    const { direction, icon } = getDirectionAndIcon(c.shapValue);
    const explanation = buildFactorExplanation(c.feature, value, direction, displayName);
    const evidenceCitation = getEvidenceCitation(c.feature, scenario, rawValue);
    return {
      featureName: c.feature,
      displayName,
      value,
      contribution: c.shapValue,
      direction,
      explanation,
      evidenceCitation,
      icon,
    };
  });

  const sortedByAbs = [...factors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topPositive = sortedByAbs.filter((f) => f.contribution > 0).slice(0, 3);
  const topNegative = sortedByAbs.filter((f) => f.contribution < 0).slice(0, 3);

  const narrativeSummary = buildNarrativeSummary(scenario, clampedScore, topPositive, topNegative, category);
  const clinicalRationale = buildClinicalRationale(scenario, clampedScore, category, topPositive, topNegative);
  const citations = [...new Set(factors.map((f) => f.evidenceCitation).filter(Boolean) as string[])];
  const markdownDetail = buildMarkdownDetail(
    clampedScore,
    category,
    sortedByAbs,
    clinicalRationale,
    citations
  );

  return {
    baselineScore,
    finalScore: clampedScore,
    factors: sortedByAbs,
    topPositive,
    topNegative,
    narrativeSummary,
    markdownDetail,
    clinicalRationale,
  };
}

// =============================================================================
// Legacy helpers (for backward compatibility with existing card-builder)
// =============================================================================

import type { FeatureVector } from './types';

/** Single feature contribution to the prediction (legacy shape) */
export interface ShapContribution {
  feature: string;
  value: number | string | boolean;
  shapValue: number;
  displayName?: string;
}

/**
 * Formats raw SHAP values from the ML response into a sorted list for display.
 * @param shapValues - Map of feature name → SHAP value from predict(explain: true)
 * @param features - Original feature vector (for displaying feature value)
 * @returns Sorted array of contributions (by absolute SHAP value)
 */
export function formatShapContributions(
  shapValues: Record<string, number>,
  features: FeatureVector
): ShapContribution[] {
  const entries = Object.entries(shapValues);
  return entries
    .map(([feature, shapValue]) => ({
      feature,
      value: features[feature] ?? 0,
      shapValue,
      displayName: FEATURE_DISPLAY_NAMES[feature] ?? feature.replace(/_/g, ' '),
    }))
    .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
}

/**
 * Returns top-N features driving the prediction (positive or negative).
 */
export function getTopContributors(contributions: ShapContribution[], n: number): ShapContribution[] {
  return contributions.slice(0, n);
}
