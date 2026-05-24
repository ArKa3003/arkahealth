# Model Card — ARKA Imaging Appropriateness XGBoost

Model card format follows [Model Cards for Model Reporting](https://modelcards.withgoogle.com/about) (Mitchell et al., 2019). This document accompanies the ARKA CDS Hooks ML service (`ml-service/`) and the Feature Rationale Catalogue (`lib/cds-platform/ml/feature-catalog.ts`).

---

## Model details

| Field | Value |
| --- | --- |
| **Model name** | ARKA Imaging Appropriateness Regressor |
| **Version** | 1.0.0 |
| **Type** | XGBoost gradient-boosted regressor |
| **Output** | Continuous appropriateness score (1–9), binned to low / uncertain / high categories |
| **Feature vector** | 23 structured features (see `lib/cds-platform/ml/feature-catalog.json`) |
| **Maintainer** | ARKA Health — [arkahealth.com](https://arkahealth.com) |

---

## Intended use

- **Primary use:** Decision support for **elective imaging order appropriateness** at order-entry time in US **adult and pediatric outpatient** settings (ambulatory, ED-adjacent elective orders, and pre-admission workflows where CDS Hooks fire on draft `ServiceRequest` resources).
- **Users:** Licensed clinicians and clinical staff reviewing whether a proposed study aligns with evidence-based appropriateness expectations before final sign-off.
- **Integration:** Consumed by ARKA CDS Hooks services; outputs support—not replace—clinician judgment alongside ACR-aligned rationale and citations surfaced from the Feature Rationale Catalogue.

---

## Out-of-scope use (do not use for)

- **Time-critical alerts** (e.g., stroke code, trauma activation, sepsis bundles) where sub-minute action is required without human review.
- **Image interpretation** or computer-aided detection/diagnosis on pixel data (FDA Criterion 1: no signal processing).
- **Autonomous ordering** or auto-acceptance of imaging requests without clinician review.
- **Inpatient-only pathways** not represented in training priors unless re-validated.
- **Screening populations** outside the synthetic indication mix unless explicitly re-evaluated.

---

## Training data

| Attribute | Description |
| --- | --- |
| **Source** | **Synthetic** data generated in `ml-service/model/train.py`, aligned with ARKA AIIE Clinical Evidence Base scenario logic |
| **Alignment** | Indication-weighted scenarios (low back pain, headache, abdominal, chest, musculoskeletal, other) mirror distributions in `lib/cds-platform/validation/synthetic-data-generator.ts` |
| **Sample size** | **5,000** labeled examples per training run (70% train / 15% validation / 15% test split) |
| **Labels** | Continuous appropriateness score 1–9 derived from rule-based clinical scenarios (red flags, duration, modality, duplicate imaging, contrast safety), plus Gaussian noise (σ ≈ 0.3) |
| **PHI** | None — fully synthetic feature vectors |
| **Real-world data** | Not used for initial model weights; retrospective validation may supplement evaluation (see below) |

**Generation method (summary):** Stratified sampling by clinical scenario weight; per-scenario score rules encode ACR-aligned heuristics (e.g., uncomplicated LBP &lt;6 weeks → lower MRI appropriateness; red flags → higher); cross-cutting adjustments for eGFR, contrast allergy, pregnancy, and duplicate imaging within 30 days.

---

## Evaluation data and metrics

| Dataset | Role |
| --- | --- |
| **Held-out synthetic test set** | 15% of generated cohort (`model/evaluation/test_set.npz`) |
| **Retrospective synthetic historical cases** | Optional validation via `generateSyntheticHistoricalData()` in `synthetic-data-generator.ts` (default n=1000, seed=42) when integrated into CI |

**Reported metrics (synthetic test set, representative run):**

| Metric | Description |
| --- | --- |
| **RMSE / MAE / R²** | Regression fit on 1–9 scale |
| **3-category accuracy** | Binned accuracy (scores 1–3, 4–6, 7–9) |
| **AUC (ordinal)** | Planned for retrospective validation reports when binary appropriate/inappropriate labels are available |
| **Calibration slope** | Planned — reliability of predicted vs. observed category frequencies |
| **ECE** | Planned — expected calibration error on binned probabilities |

Metrics are written to `ml-service/model/evaluation/metrics.json` after each training run.

---

## Fairness and subgroup analysis

Subgroup performance should be monitored on validation cohorts:

| Subgroup | Stratification |
| --- | --- |
| **Age** | Pediatric (&lt;18), adult (18–64), older adult (65+) |
| **Sex** | Male / female / other (as encoded in `patient_sex`) |
| **Modality** | CT, MRI, radiograph, ultrasound (from `modality_code`) |

**Target:** Report AUC or 3-category accuracy per subgroup; investigate gaps &gt;5 absolute percentage points vs. overall. Initial synthetic training does not guarantee fairness across real-world subgroups—deploy only with ongoing monitoring.

---

## Known limitations

- Trained on **synthetic** labels, not adjudicated real-world outcomes; generalization to live EHR documentation quality is uncertain.
- **23-feature** vector may omit site-specific pathways, local coverage rules, or nuance in free-text indications.
- **English-language, US guideline** framing (ACR-oriented); not validated for non-US practice.
- **Fallback mode:** If `trained_model.json` is absent, the service uses a rule-based scorer with lower stated confidence.
- Feature catalogue entries marked `context_dependent` require clinician interpretation alongside indication-specific criteria.
- Clinical sign-off for catalogue rationales is tracked in `docs/CLINICAL_SIGN_OFF_LOG.md` (pending items noted in source).

---

## Regulatory posture

ARKA Imaging Intelligence Engine is positioned as an **FDA Non-Device Clinical Decision Support** tool under FD&C Act §520(o)(1)(E) (21st Century Cures Act). This model:

- Does not process medical images.
- Surfaces peer-reviewed / guideline-linked rationales via the Feature Rationale Catalogue (Criterion 4).
- Requires clinician responsibility for the final order decision.

---

## Ethics and safety

- No autonomous patient-facing decisions.
- Predictions are advisory; overrides must remain available in the EHR workflow.
- Report safety or appropriateness concerns through the contact below before relying on the model in production.

---

## Contact and issue reporting

- **Issues / safety reports:** [https://arkahealth.com](https://arkahealth.com) (contact form / support channel)
- **Repository path:** `ml-service/MODEL_CARD.md`
- **Catalogue source of truth:** `lib/cds-platform/ml/feature-catalog.ts` → `npm run export:feature-catalog`

---

*Last updated: 2026-05-24. Regenerate training artifacts and metrics after any catalogue or feature-engineering change.*
