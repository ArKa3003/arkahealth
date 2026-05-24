/**
 * FDA Criterion 4 — Feature Rationale Catalogue.
 * Each ML feature must have clinician-facing rationale and citation linkage.
 * Keys align 1:1 with {@link FEATURE_NAMES} in feature-engineer.ts and ml-service/model/features.py.
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
const ARKA_CONTEXT = 'arka:context';
const REVIEW_ISO = '2026-05-24';

/**
 * Feature Rationale Catalogue — exactly 23 entries matching the XGBoost feature vector.
 * // TODO(clinical-signoff): licensed clinician review pending — see docs/CLINICAL_SIGN_OFF_LOG.md
 */
export const FEATURE_CATALOG: Record<string, FeatureCatalogEntry> = {
  patient_age: {
    label: 'Patient age (years)',
    rationale:
      'Age is a context input to the appropriateness model: it shifts baseline pretest probability and which indication-specific variant applies (for example, pediatric RLQ pathways versus geriatric fall protocols). Age alone does not mandate or forbid imaging; the model uses it to calibrate scores alongside indication, red flags, and proposed modality rather than as a standalone clinical recommendation.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Patient',
  },
  patient_sex: {
    label: 'Patient sex',
    rationale:
      'Biological sex is encoded as a context modifier for the model: it affects pelvic and pregnancy-related appropriateness checks, sex-specific pretest probabilities for certain indications, and how confidently some chart-derived features are interpreted. The feature informs calibration of the score vector; it is not itself a guideline-based imaging recommendation and must be read with the full clinical scenario.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Patient',
  },
  modality_code: {
    label: 'Proposed imaging modality',
    rationale:
      'The ordered modality (CT, MRI, radiograph, ultrasound, and so on) is a core model input describing what study is being requested. Appropriateness depends on whether that modality can answer the clinical question with acceptable risk; this catalogue entry documents the feature as structured context for the XGBoost vector, not as a substitute for indication-specific variant selection performed at scoring time.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'ServiceRequest',
  },
  body_site_code: {
    label: 'Proposed body site',
    rationale:
      'Anatomic site codes anchor duplicate-imaging and red-flag logic to the region under evaluation. The model uses body site to align prior-study features and indication mappings; this entry records the feature as contextual input derived from the draft ServiceRequest rather than as an independent guideline directive about whether to image.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'ServiceRequest',
  },
  indication_category: {
    label: 'Clinical indication category',
    rationale:
      'Indication category groups the presenting complaint and reason codes into a coarse clinical bucket used to select guideline mappings and baseline priors in the model. It is essential context for interpreting other features (duration, red flags, prior imaging) but does not by itself state that imaging is appropriate or inappropriate—that determination emerges from the combined feature vector and linked evidence.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Condition',
  },
  symptom_duration_days: {
    label: 'Symptom duration (days)',
    rationale:
      'For uncomplicated low back pain without red flags, Indication-specific variant 3 generally favors conservative management before lumbar MRI when symptoms are subacute. Duration helps distinguish early presentations (often managed without immediate imaging) from persistent symptoms that may warrant reconsideration after an adequate trial of therapy.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Condition',
  },
  has_red_flags: {
    label: 'Red-flag symptoms',
    rationale:
      'Evidence-based imaging appropriateness criteria for low back pain (variant 1) prioritize urgent evaluation when red flags are present—such as cauda equina symptoms, progressive neurologic deficit, fever with spine pain, or major trauma. Their presence generally increases the appropriateness of timely advanced imaging rather than delayed outpatient MRI.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  cancer_history: {
    label: 'History of malignancy (red-flag derived)',
    rationale:
      'Active or recent cancer history changes pretest probability for metastatic or structural causes of pain and is treated as a red-flag modifier in Published musculoskeletal imaging scenarios. This feature generally increases appropriateness of timely cross-sectional imaging when new or worsening symptoms suggest possible malignant involvement.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  neurological_deficit: {
    label: 'Neurological deficit documented',
    rationale:
      'Low back pain imaging guidance (section 1) treat suspected radiculopathy, progressive motor weakness, saddle anesthesia, and cauda equina syndrome as escalated presentations where advanced imaging is more often appropriate than watchful waiting. A documented neurologic deficit signals possible nerve root or cauda equina compromise and generally increases appropriateness of timely MRI or equivalent cross-sectional evaluation.',
    citationId: LBP_CITATION,
    url: 'https://doi.org/10.1016/j.jacr.2022.02.018',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  fever_present: {
    label: 'Fever documented',
    rationale:
      'Fever modifies appropriateness by clinical context: Published pediatric RLQ imaging criteria treat fever as a red-flag modifier favoring timely imaging when appendicitis is suspected, whereas Published headache imaging criteria use fever with sudden severe headache to escalate evaluation for intracranial infection or hemorrhage. The model encodes fever as a binary modifier whose direction depends on indication, not as a universal mandate to image.',
    citationId: 'acr:ped-rlq-pain',
    url: 'https://acsearch.acr.org/docs/6948342/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Observation',
  },
  is_pregnant: {
    label: 'Pregnancy status',
    rationale:
      'Published radiation safety guidance stresses minimizing fetal exposure and selecting modalities without ionizing radiation when clinically appropriate. Pregnancy status is a safety and appropriateness modifier: it can decrease appropriateness of CT with radiation or increase appropriateness of ultrasound/MRI alternatives depending on clinical question and gestational age.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Patient',
  },
  has_contrast_allergy: {
    label: 'Contrast allergy documented',
    rationale:
      'Documented allergy or prior contrast reaction affects modality and protocol selection under published contrast safety principles. This safety feature is context-dependent for appropriateness scoring: it may decrease appropriateness of contrast-enhanced CT while increasing appropriateness of non-contrast MRI or alternative studies that answer the clinical question.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'AllergyIntolerance',
  },
  egfr_value: {
    label: 'Estimated glomerular filtration rate (eGFR)',
    rationale:
      'Published contrast safety guidance uses renal function to weigh iodinated contrast risk and consider alternative strategies when eGFR is reduced. Low eGFR does not automatically forbid contrast-enhanced CT but shifts appropriateness toward non-contrast or non-ionizing options and may trigger hydration or nephrology pathways.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Observation',
  },
  on_anticoagulation: {
    label: 'Anticoagulation therapy active',
    rationale:
      'Evidence-based imaging appropriateness criteria for head trauma recognize that anticoagulated patients have higher risk of intracranial hemorrhage after even minor head injury, lowering the threshold for CT when symptoms are present or mechanism is concerning. Anticoagulation therefore generally increases appropriateness of head CT in trauma contexts while remaining indication-specific for non-trauma orders.',
    citationId: 'acr:head-trauma',
    url: 'https://acsearch.acr.org/docs/3083021/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'MedicationRequest',
  },
  on_metformin: {
    label: 'Metformin therapy active',
    rationale:
      'The published contrast-media safety manual addresses metformin when iodinated contrast is contemplated: historical concern linked contrast-induced nephropathy with metformin-associated lactic acidosis, while current guidance favors risk stratification by eGFR and often permits continued metformin when renal function is adequate. This feature is relevant primarily for contrast studies and is context-dependent for appropriateness scoring.',
    citationId: 'acr:contrast-media-manual',
    url: 'https://www.acr.org/Clinical-Resources/Contrast-Manual',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'MedicationRequest',
  },
  prior_imaging_count_90d: {
    label: 'Prior imaging count (90 days)',
    rationale:
      'Low back pain imaging guidance variant 3 and related duplicate-imaging guidance discourage repeat advanced imaging when prior studies of the relevant region are recent and clinical status is unchanged. A higher count of prior imaging within 90 days generally decreases appropriateness of repeat orders unless new red flags, neurologic change, or documented clinical escalation is present.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'decreases_appropriateness',
    sourceResource: 'ServiceRequest',
  },
  days_since_last_imaging: {
    label: 'Days since most recent relevant imaging',
    rationale:
      'Elapsed time since the last study contextualizes duplicate-imaging features: the same raw prior count carries different weight when the most recent exam was yesterday versus eight weeks ago. The model uses this temporal input to calibrate how strongly recent prior imaging should decrease appropriateness, independent of any single published day threshold.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'ServiceRequest',
  },
  same_modality_prior_30d: {
    label: 'Same modality prior study within 30 days',
    rationale:
      'Low back pain imaging guidance (section 3 on repeat imaging intervals) and related duplicate-utilization principles hold that repeat same-modality imaging within 30 days rarely changes management when symptoms are stable and non-radicular. Yield of new actionable findings drops sharply in that window, so a recent same-modality study generally decreases appropriateness of repeat advanced imaging absent escalation.',
    citationId: LBP_CITATION,
    url: 'https://doi.org/10.1016/j.jacr.2022.02.018',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'decreases_appropriateness',
    sourceResource: 'ServiceRequest',
  },
  same_body_site_prior_30d: {
    label: 'Same body site prior study within 30 days',
    rationale:
      'Low back pain imaging guidance variant 3 and related duplicate-imaging guidance discourage repeat lumbar MRI or CT when prior studies of the same anatomic region are recent and clinical status is unchanged—even across modalities (for example, MRI lumbar within 30 days of CT lumbar). A prior study of the same body site within 30 days generally decreases appropriateness unless new red flags or clinical change are documented.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'decreases_appropriateness',
    sourceResource: 'ServiceRequest',
  },
  urgency_level: {
    label: 'Order urgency (routine / urgent / stat)',
    rationale:
      'Order urgency encodes how soon imaging is requested relative to clinical stability and triage category. The model treats urgency as contextual input: the same modality may be appropriate under urgent pathways for suspected emergent pathology but inappropriate when ordered STAT for stable chronic symptoms without red flags. Appropriateness must be read with indication and acuity together.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'ServiceRequest',
  },
  comorbidity_count: {
    label: 'Comorbidity burden (count)',
    rationale:
      'Aggregate comorbidity count summarizes chronic disease burden from problem-list and condition resources as a model context feature. It shifts baseline risk and resilience estimates in the feature vector but is not anchored to a single indication-specific variant; interpreters should combine it with indication-specific criteria rather than treating the count alone as a reason to order or defer imaging.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Condition',
  },
  conservative_tx_tried: {
    label: 'Conservative treatment tried (chart-derived)',
    rationale:
      'Low back pain imaging guidance variant 4 supports advanced imaging after an adequate trial of conservative management for persistent uncomplicated low back pain without red flags. Documentation that physical therapy, NSAIDs, or comparable conservative care was tried generally increases appropriateness of lumbar MRI when symptoms persist and neurologic status remains stable.',
    citationId: LBP_CITATION,
    url: 'https://acsearch.acr.org/docs/3108272/Narrative/',
    authorityClass: 'guideline',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'increases_appropriateness',
    sourceResource: 'Condition',
  },
  imaging_in_problem_list: {
    label: 'Imaging referenced on problem list',
    rationale:
      'Whether prior imaging appears on the active problem list is a documentation-quality signal used when inferring prior-study features from unstructured and semi-structured chart data. When imaging is explicitly listed, the model weights prior-imaging counts and recency more confidently; when absent, duplicate-imaging features may be under-detected—a context input, not a clinical appropriateness rule by itself.',
    citationId: ARKA_CONTEXT,
    url: 'https://arkahealth.com/docs/feature-catalog#context-dependent',
    authorityClass: 'context_dependent',
    lastClinicalReviewISO: REVIEW_ISO,
    weightDirection: 'context_dependent',
    sourceResource: 'Condition',
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
