# Product / Function Description

**ARKA Health, Inc. — Pre-Submission · Document 02 · Version 1.0 · June 9, 2026**

## 1. Platform overview

ARKA is a unified digital-health platform that integrates into clinician ordering workflows over the HL7 **CDS Hooks** standard (order-select, order-sign, and appointment-book hooks) with **FHIR R4** prefetch, the integration surface supported by major commercial EHRs. The platform exposes five registered CDS services plus a discovery endpoint. It comprises distinct software functions; this submission concerns two of them — ARKA-CLIN and ARKA-INS — and identifies a third (a reference-image viewer) that is outside the scope of review.

## 2. ARKA-CLIN — clinical decision support function (§520(o)(1)(E))

At order-select and order-sign for diagnostic imaging, ARKA-CLIN returns cards containing ranked, evidence-cited imaging-appropriateness options.

### 2.1 Architecture — rules first, machine learning as refinement

1. A clinical scenario is assembled from structured FHIR prefetch (Patient, Condition, Observation, ServiceRequest, MedicationRequest, AllergyIntolerance).
2. A rule engine evaluates the scenario against a rule library in which **every rule is anchored to a published clinical guideline or peer-reviewed source**. If no guideline-anchored rule fires, ARKA-CLIN returns **no card**; the system is designed never to produce a recommendation that lacks published backing.
3. Where a rule fires, an optional machine-learning step (an XGBoost regressor) refines the appropriateness score and produces per-factor SHAP contributions. This output is attached as a clearly labeled, secondary "patient-specific refinement" — never as the primary basis of the recommendation.
4. Each card displays the guideline label, rationale, and citation **above** any ARKA-derived score. A tiered transparency design presents decision-relevant information first (citation and top contributing factors), with expanded SHAP detail and full methodology one click away, consistent with the usability emphasis of FDA's January 2026 CDS guidance.
5. If the machine-learning service is unavailable, the system **falls back to rules-only output** by design; guideline-anchored recommendations and citations remain fully functional without the model.

### 2.2 Inputs (Criterion 1)

ARKA-CLIN consumes structured data only: the FHIR resource types listed above, transformed into a 23-feature vector documented in a clinician-facing feature catalogue (each feature carries a rationale and citation reference). It does not acquire, process, or analyze medical images, in-vitro-diagnostic signals, or signal-acquisition patterns. An input-validation layer rejects image and signal formats, and continuous-integration checks (`scripts/regulatory-checks.ts`, `scripts/lint-scope-boundary.ts`, run on every push and pull request via `.github/workflows/go-live.yml`) fail the build if image- or signal-processing code is imported into in-scope CDS paths.

### 2.3 Outputs (Criterion 3)

ARKA-CLIN presents ranked options with RAND/UCLA-style 1–9 appropriateness scores expressed as "Usually Appropriate / May Be Appropriate / Usually Not Appropriate." Output is non-blocking by architecture: the CDS Hooks specification provides no order-blocking primitive, and ARKA adds none. Visual urgency indicators on cards are styling cues only. For a small set of guideline-anchored patterns — a likely duplicate study (same modality and body region within seven days) and well-established overuse patterns — the order-sign card asks the clinician to record a brief override reason before proceeding, using a structured, neutral-first list (the first option is "Clinical judgment based on findings not captured in chart") with free-text available. The clinician can always proceed; ARKA never prevents, places, or cancels an order.

### 2.4 Independent review (Criterion 4)

Every card exposes its basis: the anchoring guideline citation, the rationale, and — where the refinement step ran — per-factor SHAP contributions, each mapped to a catalogued feature with its own rationale and citation. Purpose and limitations are disclosed on-card, and every card carries the standard footer stating that the recommendation supports, not replaces, clinical judgment and that the clinician is responsible for the final decision.

## 3. ARKA-INS — administrative-support function (§520(o)(1)(A))

Over the same CDS Hooks surface, ARKA-INS provides payer coverage and benefit-eligibility intelligence, prior-authorization documentation workflows (HL7 Da Vinci CRD/DTR/PAS), gold-card auto-approval scoring based on historical claims, out-of-pocket cost estimates, Good Faith Estimates, shoppable-site comparison, and appointment-booking and site-of-service checks. These are administrative and financial functions of a health-care facility; they are addressed in detail in the ARKA-INS Administrative-Support Memo (Document 06).

## 4. Reference viewer — separate function, out of scope

A separate utility renders previously acquired DICOM studies as non-diagnostic thumbnails so a user can identify a prior study. It does not analyze pixel data to derive any recommendation, and no CDS card content is derived from its code path. It is walled off from ARKA-CLIN by a documented scope boundary (`docs/SCOPE_BOUNDARY.md`) and an import-lint guard that fails the build if any in-scope CDS file imports viewer code. It is not part of the functions under review.

## 5. Data flow (ARKA-CLIN)

`Clinician → EHR CDS Hook (FHIR R4 prefetch) → input validation (structured data only) → rule engine (guideline-anchored; no rule, no card) → optional ML refinement + SHAP (secondary) → ranked, cited options with disclosure footer → clinician independent review → clinician decision`

## 6. What the software deliberately does not do

No medical-image or physiological-signal analysis · no time-critical alerts or triage (e.g., stroke, sepsis, STEMI) · no autonomous order placement, cancellation, or blocking · no patient- or consumer-facing recommendations · no definitive diagnosis.

## 7. Evidence attached with this document

- Data-input inventory (FHIR resource types and 23-feature catalogue summary)
- Annotated ARKA-CLIN card screenshots — citation displayed above score; tiered transparency view (`docs/regulatory-evidence/sandbox-screenshots/`)
- Model card for the refinement model (`ml-service/MODEL_CARD.md`)
- Scope boundary and CI enforcement configuration (`docs/SCOPE_BOUNDARY.md`; `.github/workflows/go-live.yml`)
