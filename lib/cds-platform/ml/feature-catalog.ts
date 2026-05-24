/**
 * FDA Criterion 4 — Feature Rationale Catalogue.
 * Each ML feature must have clinician-facing rationale and citation linkage.
 */

import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';

/** FHIR resource types permitted as feature sources (Criterion 1 boundary). */
export type FeatureSourceResource =
  | 'Patient'
  | 'Condition'
  | 'Observation'
  | 'ServiceRequest'
  | 'MedicationRequest'
  | 'AllergyIntolerance'
  | 'Coverage';

/** Direction of feature influence on appropriateness scoring. */
export type WeightDirection =
  | 'increases_appropriateness'
  | 'decreases_appropriateness'
  | 'context_dependent';

/** One catalogued ML feature with medical basis metadata. */
export interface FeatureCatalogEntry extends MedicalBasis {
  weightDirection: WeightDirection;
  sourceResource: FeatureSourceResource;
}

const LBP_CITATION = 'doi:10.1016/j.jacr.2022.02.018';
const REVIEW_ISO = '2026-05-24';

/**
 * Feature Rationale Catalogue — keys align with {@link FEATURE_NAMES} in feature-engineer.ts
 * where noted; prompt-specific aliases (e.g. prior_lumbar_imaging_90d) are included for LBP flows.
 */
export const FEATURE_CATALOG: Record<string, FeatureCatalogEntry> = {
  has_red_flags: {
    label: 'Red-flag symptoms',
    rationale:
      'ACR Appropriateness Criteria for low back pain (variant 1) prioritize urgent evaluation when red flags are present—such as cauda equina symptoms, progressive neurologic deficit, fever with spine pain, or major trauma. Their presence generally increases the appropriateness of timely advanced imaging rather than delayed outpatient MRI.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  symptom_duration_days: {
    label: 'Symptom duration (days)',
    rationale:
      'For uncomplicated low back pain without red flags, ACR variant 3 generally favors conservative management before lumbar MRI when symptoms are subacute. Duration helps distinguish early presentations (often managed without immediate imaging) from persistent symptoms that may warrant reconsideration after an adequate trial of therapy.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Condition',
  },
  is_pregnant: {
    label: 'Pregnancy status',
    rationale:
      'ACR guidance on radiation safety stresses minimizing fetal exposure and selecting modalities without ionizing radiation when clinically appropriate. Pregnancy status is a safety and appropriateness modifier: it can decrease appropriateness of CT with radiation or increase appropriateness of ultrasound/MRI alternatives depending on clinical question and gestational age.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Patient',
  },
  urgency_level: {
    label: 'Order urgency (routine / urgent / stat)',
    rationale:
      'Urgency encodes how soon imaging is requested relative to clinical stability. Appropriateness depends on indication and acuity: the same modality may be appropriate as urgent for suspected emergent pathology but inappropriate when ordered STAT for stable chronic symptoms. // TODO(Phase 5): tie to indication-specific ACR variant and institutional triage policy.',
    citationId: 'context_dependent',
    url: 'https://arkahealth.com/methodology',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'ServiceRequest',
  },
  prior_lumbar_imaging_90d: {
    label: 'Prior lumbar imaging within 90 days',
    rationale:
      'ACR low back pain variant 3 and related duplicate-imaging guidance discourage repeat lumbar MRI/CT when prior studies are recent and clinical status is unchanged. A prior lumbar study within 90 days generally decreases appropriateness of repeat advanced imaging unless new red flags or clinical change are documented.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'decreases_appropriateness',
    sourceResource: 'Observation',
  },
  prior_imaging_count_90d: {
    label: 'Prior imaging count (90 days)',
    rationale:
      'Recent prior imaging of any relevant type within 90 days is a proxy for duplicate utilization. ACR and Choosing Wisely materials emphasize avoiding repeat studies when results would not change management. Higher counts within 90 days generally decrease appropriateness of repeat orders absent clinical change.',
    citationId: 'acr:duplicate-imaging-90d',
    url: 'https://acsearch.acr.org/list',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'decreases_appropriateness',
    sourceResource: 'Observation',
  },
  patient_age_years: {
    label: 'Patient age (years)',
    rationale:
      'Age modifies pretest probability and preferred modalities (for example, pediatric RLQ pain pathways vs geriatric fall protocols). The ML model uses age as a context feature; appropriateness must be interpreted with indication-specific ACR variants rather than age alone. // TODO(Phase 5): split catalog entries by pediatric vs adult indications.',
    citationId: 'context_dependent',
    url: 'https://arkahealth.com/methodology',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Patient',
  },
  patient_age: {
    label: 'Patient age (model feature)',
    rationale:
      'Same clinical intent as patient_age_years — encoded for the XGBoost feature vector. Age influences baseline risk and guideline variant selection but does not by itself mandate or forbid imaging; interpret alongside indication and red-flag status.',
    citationId: 'context_dependent',
    url: 'https://arkahealth.com/methodology',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Patient',
  },
  has_conservative_therapy_4w: {
    label: 'Conservative therapy trial (≥ 4 weeks)',
    rationale:
      'ACR low back pain variant 4 supports advanced imaging after an adequate trial of conservative management for persistent uncomplicated low back pain without red flags. Documentation that physical therapy, NSAIDs, or comparable conservative care was tried generally increases appropriateness of lumbar MRI when symptoms persist.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  conservative_tx_tried: {
    label: 'Conservative treatment tried (chart-derived)',
    rationale:
      'Mirrors has_conservative_therapy_4w for the production feature name in feature-engineer.ts. NLP detection of conservative care in clinical history supports the same ACR variant 4 rationale: persistent symptoms after documented conservative therapy increase appropriateness of imaging when red flags are absent.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  egfr_value: {
    label: 'Estimated glomerular filtration rate (eGFR)',
    rationale:
      'ACR contrast safety guidance uses renal function to weigh iodinated contrast risk and consider alternative strategies when eGFR is reduced. Low eGFR does not automatically forbid contrast-enhanced CT but shifts appropriateness toward non-contrast or non-ionizing options and may trigger hydration or nephrology pathways.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Observation',
  },
  cancer_history: {
    label: 'History of malignancy (red-flag derived)',
    rationale:
      'Active or recent cancer history changes pretest probability for metastatic or structural causes of pain and is treated as a red-flag modifier in ACR musculoskeletal scenarios. This feature generally increases appropriateness of timely cross-sectional imaging when new or worsening symptoms suggest possible malignant involvement.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  has_contrast_allergy: {
    label: 'Contrast allergy documented',
    rationale:
      'Documented allergy or prior contrast reaction affects modality and protocol selection under ACR contrast safety principles. This safety feature is context-dependent for appropriateness scoring: it may decrease appropriateness of contrast-enhanced CT while increasing appropriateness of non-contrast MRI or alternative studies that answer the clinical question.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'AllergyIntolerance',
  },
};

/**
 * Returns a catalogue entry when the feature is registered.
 *
 * @param name - Feature name from the ML vector or SHAP output.
 */
export function getFeatureCatalogEntry(name: string): FeatureCatalogEntry | undefined {
  return FEATURE_CATALOG[name];
}

/**
 * Ensures a feature is documented in the Feature Rationale Catalogue (FDA Criterion 4).
 *
 * @param name - Feature name to validate.
 * @throws When the feature is absent from {@link FEATURE_CATALOG}.
 */
export function assertFeatureInCatalog(name: string): void {
  if (!FEATURE_CATALOG[name]) {
    throw new Error(
      `FDA Criterion 4 violation: feature "${name}" is not in the Feature Rationale Catalogue. Add to lib/cds-platform/ml/feature-catalog.ts with rationale + citation, regenerate feature-catalog.json.`,
    );
  }
}
