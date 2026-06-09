# Product / Function Description

> **DRAFT.** Shows the Non-Device story rather than asserting it. Attach annotated screenshots and the data-flow diagram.

---

## 1. Overview
ARKA is a unified digital-health platform that integrates into clinician ordering workflows over the HL7 **CDS Hooks** protocol (order-select, order-sign, appointment-book) with **FHIR R4** prefetch. It comprises distinct software functions; this submission concerns two of them.

## 2. ARKA-CLIN (clinical decision support — §520(o)(1)(E))
At order-select and order-sign for diagnostic imaging, ARKA-CLIN returns cards containing ranked, evidence-cited imaging-appropriateness options.

**Architecture — rules-first, ML-as-refinement:**
1. Build a clinical scenario from structured FHIR prefetch (Patient, Condition, Observation, ServiceRequest, MedicationRequest, AllergyIntolerance).
2. A rule engine evaluates the scenario against a library where **every rule is anchored to a published guideline / peer-reviewed source**. If no guideline-anchored rule fires, ARKA returns **no card** (it does not "ML its way" into an unsupported recommendation).
3. Where a rule fires, an optional ML step (XGBoost) refines the score and produces SHAP factor contributions — attached as a *secondary* "patient-specific refinement," never as the primary basis.
4. Each card shows the guideline label + rationale + citation **above** any ARKA-derived score, with a tiered transparency view (immediate → expanded SHAP → full methodology).
5. If the ML service is unavailable, the system **falls back to rules-only** output by design.

**Inputs (Criterion 1):** structured data only. No DICOM pixels, no waveforms, no continuous physiological streams. An input-validation layer rejects image/signal formats; a CI guard blocks image/signal imports into CLIN code paths.

**Outputs (Criterion 3):** ranked options with RAND/UCLA-style 1–9 appropriateness scores and "Usually / May Be / Usually Not Appropriate" language. Non-blocking; overrides require no justification on CLIN cards.

**Independent review (Criterion 4):** citations + per-factor SHAP rationale exposed; purpose/limitations shown; uncertainty disclosed. Designed for usability (decision-relevant details first, depth on demand) per the 2026 guidance emphasis.

## 3. ARKA-INS (administrative support — §520(o)(1)(A))
Over the same CDS Hooks surface, ARKA-INS provides: payer coverage/eligibility intelligence, prior-authorization documentation (Da Vinci CRD/DTR/PAS), gold-card auto-approval scoring (claims-history based), out-of-pocket estimates / Good Faith Estimate / shoppable-site comparison, and appointment-booking/site checks. These are administrative and financial functions (see `06_INS_administrative_support_memo.md`).

## 4. Reference viewer (out of scope)
A separate utility renders previously acquired DICOM studies as **non-diagnostic thumbnails** so a user can identify a prior study. It does **not** analyze pixels to derive any recommendation and is walled off from CLIN by `SCOPE_BOUNDARY.md` + import-lint. Not part of the functions under review.

## 5. Data flow (CLIN)
`Clinician → EHR CDS Hook → input validation → rule engine (guideline-anchored) → [optional ML refinement + SHAP] → ranked, cited options → clinician independent review → clinician decision`

## 6. What the software deliberately does NOT do
No image/signal analysis · no time-critical alerts/triage · no autonomous order placement or blocking · no patient/consumer-facing recommendations · no definitive diagnosis.

---

### Attach with this section
- [ ] Data-flow diagram (from brief §5)
- [ ] Annotated CLIN card screenshot (citation above score; tiered view)
- [ ] Data-input inventory table (from brief §3.1)
- [ ] Architecture summary (from `REGULATORY_RATIONALE_MEMO.md` §4)
