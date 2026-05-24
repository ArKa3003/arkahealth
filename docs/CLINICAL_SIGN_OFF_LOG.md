# Clinical sign-off log (ARKA CDS platform)

Tracks clinician review of guideline-linked CDS content. Engineering may ship draft catalogue entries; this log records when content becomes defensible for production.

| Date | Artefact | Scope | Guideline-class | Context-dependent | Status | Notes |
|------|----------|-------|-----------------|-------------------|--------|-------|
| 2026-05-24 | Feature Rationale Catalogue v1 | `lib/cds-platform/ml/feature-catalog.ts` — 23/23 model features | 14 | 9 | Draft | Expanded from 13 keys (3 aliases removed). Six new guideline entries: neurological_deficit, fever_present, on_anticoagulation, on_metformin, same_modality_prior_30d, same_body_site_prior_30d. Seven new context-dependent entries: patient_sex, modality_code, body_site_code, indication_category, days_since_last_imaging, comorbidity_count, imaging_in_problem_list. **TODO: Clinical reviewer signature pending.** |
