# ARKA CDS Platform — Regulatory Rationale Memo

FDA Non-Device Clinical Decision Support posture under FD&C Act §520(o)(1)(E) (21st Century Cures Act). This memo summarizes how ARKA CDS Hooks implementations satisfy the four statutory criteria and points to evidence artefacts in the repository.

---

## 1. Not device software (Criterion 1)

ARKA does not acquire, process, or analyze medical images or signals from in vitro diagnostic devices. Inputs are structured FHIR resources (`Patient`, `Condition`, `Observation`, `ServiceRequest`, etc.) and derived scalar features documented in the Feature Rationale Catalogue.

---

## 2. Basis in published evidence (Criterion 2)

Recommendations link to ACR Appropriateness Criteria, specialty society guidance, and ARKA context-dependent entries with citations in `lib/cds-platform/citations/` and per-feature metadata in `lib/cds-platform/ml/feature-catalog.ts`.

---

## 3. Recommendations, not directives (Criterion 3)

Card and API copy state that the ordering clinician retains decisional authority. Disclosure text is centralized in compliance constants and rendered on user-facing surfaces.

---

## 4. Independent review (Criterion 4)

Clinicians can review **why** a score was produced:

- SHAP feature contributions on `/predict` responses.
- Optional `?include_metadata=true` on `/predict` returns `feature_metadata` (feature name → clinical rationale) from the exported catalogue JSON.
- Training refuses undocumented features (`ml-service/model/train.py` guard against catalogue drift).

---

## 5. ML model transparency and model card

The imaging appropriateness XGBoost model is documented in **[`ml-service/MODEL_CARD.md`](../ml-service/MODEL_CARD.md)** following Google's Model Cards for Model Reporting framework. That card covers:

- Intended and out-of-scope use (elective outpatient appropriateness; not time-critical alerts, image interpretation, or autonomous ordering).
- Synthetic training data provenance (5,000 samples, ACR-aligned scenario generation).
- Evaluation metrics and planned calibration / fairness subgroup reporting.
- Known limitations and contact for issues ([arkahealth.com](https://arkahealth.com)).

Runtime alignment is verifiable via `GET /health` on the ML service, which returns SHA-256 hashes of the bundled `MODEL_CARD.md` and `feature-catalog.json` alongside `model_loaded` status.

---

## Related artefacts

| Artefact | Path |
| --- | --- |
| Feature Rationale Catalogue (source) | `lib/cds-platform/ml/feature-catalog.ts` |
| Exported catalogue (ML guardrails) | `lib/cds-platform/ml/feature-catalog.json` |
| Clinical sign-off log | `docs/CLINICAL_SIGN_OFF_LOG.md` |
| Regulatory baseline audit | `docs/REGULATORY_BASELINE_AUDIT.md` |

---

*ARKA is an FDA Non-Device Clinical Decision Support tool. The ordering clinician retains full responsibility for the final decision.*
