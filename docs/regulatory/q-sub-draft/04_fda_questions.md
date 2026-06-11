# Questions for FDA (Pre-Submission)

**ARKA Health, Inc. — Pre-Submission · Document 04 · Version 1.0 · June 9, 2026**

ARKA presents four primary topics, consistent with FDA's recommendation of no more than four per Pre-Submission. Each question states ARKA's position and then asks a closed, concurrence-style question.

---

## Question 1 — ARKA-CLIN Non-Device CDS status

**ARKA's position.** ARKA-CLIN consumes only structured clinical data (no images or signals); presents ranked, evidence-cited imaging options drawn from published clinical guidelines and peer-reviewed literature; is clinician-facing and non-blocking by architecture (the CDS Hooks standard provides no order-blocking primitive and ARKA adds none); and exposes the basis of each option — citation, rationale, and per-factor SHAP refinement detail — so the clinician can independently review every recommendation. For two guideline-anchored patterns (likely-duplicate studies and well-established overuse patterns), the order-sign card asks the clinician to record a brief override reason from a neutral-first structured list before proceeding; the clinician can always proceed, and no order is ever blocked or cancelled by the software. We have designed ARKA-CLIN to meet all four Non-Device CDS criteria under §520(o)(1)(E), as analyzed in this package.

**Question.** *Does FDA concur that ARKA-CLIN, as described in this submission — including the documented-override interaction described above — meets the four Non-Device CDS criteria under §520(o)(1)(E) and is therefore not a device?*

---

## Question 2 — ARKA-INS administrative-support status

**ARKA's position.** ARKA-INS performs benefit-eligibility determination, claims-based utilization and cost analysis, prior-authorization documentation (HL7 Da Vinci CRD/DTR/PAS), cost transparency, and scheduling checks. We treat these as administrative-support functions of a health care facility under §520(o)(1)(A), not clinical decision support, as detailed in the ARKA-INS Administrative-Support Memo (Document 06).

**Question.** *Does FDA concur that the ARKA-INS functions described are administrative-support functions under §520(o)(1)(A) and outside FDA device authority?*

---

## Question 3 — Change-control expectations

**ARKA's position.** ARKA-CLIN is rules-first: every recommendation is anchored to a published source, with machine learning providing non-authoritative refinement. Changes to the rule library, citation registry, feature catalogue, and override-reason list are gated by a documented clinician sign-off procedure, and continuous-integration checks enforce the citation requirement and the Criterion 1 import boundary on every change.

**Question.** *To maintain Non-Device CDS status for ARKA-CLIN, what does FDA expect regarding change control and version management for the rule library, feature catalogue, and machine-learning model weights — particularly when model updates occur?*

---

## Question 4 — Sufficiency of current evidence

**ARKA's position.** ARKA-CLIN's machine-learning refinement component is currently trained and evaluated on synthetic, guideline-aligned data (5,000 labeled examples per training run; held-out test RMSE ≈ 1.41 on the 1–9 scale; ~74% three-class accuracy). We do not present these figures as a clinical-performance claim. Recommendations remain anchored to published guidelines regardless of the refinement output, and the system falls back to rules-only output when the model is unavailable. A retrospective real-world validation is planned.

**Question.** *Is our current synthetic-validation and sandbox evidence sufficient to support the stated intended use for a Non-Device CDS determination, or does FDA expect prospective or retrospective real-world clinical validation? If the latter, what study characteristics would FDA consider adequate?*
