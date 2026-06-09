# FDA Questions (Pre-Submission)

> **DRAFT.** FDA recommends **no more than four primary topics**. These four are at the ceiling — resist adding more.
> Each question states ARKA's position first, then asks for concurrence (closed questions get usable answers).

---

## Question 1 — ARKA-CLIN Non-Device CDS status (the main event)

**ARKA's position:** ARKA-CLIN consumes only structured clinical data (no images/signals); presents ranked, evidence-cited imaging options drawn from published guidelines and peer-reviewed literature; is non-blocking and clinician-facing; and exposes the basis (citations + per-factor SHAP rationale) so the clinician can independently review each recommendation. We have designed it to meet all four Non-Device CDS criteria under §520(o)(1)(E).

**Question:** *Does FDA concur that ARKA-CLIN, as described in this submission, meets the four Non-Device CDS criteria under §520(o)(1)(E) and is therefore not a device?*

---

## Question 2 — ARKA-INS administrative-support status

**ARKA's position:** ARKA-INS performs benefit-eligibility determination, claims-based utilization/cost analysis, prior-authorization documentation, cost transparency, and scheduling checks. We treat these as administrative-support functions of a health care facility under §520(o)(1)(A), not clinical decision support.

**Question:** *Does FDA concur that the ARKA-INS functions described are administrative-support functions under §520(o)(1)(A) and outside FDA device authority?*

---

## Question 3 — Change-control expectations

**ARKA's position:** ARKA-CLIN is rules-first (every recommendation anchored to a published guideline) with ML providing non-authoritative refinement. We gate changes to the rule library, citation registry, feature catalogue, and model weights via clinician sign-off and CI checks (see change-control plan).

**Question:** *To maintain Non-Device CDS status for ARKA-CLIN, what does FDA expect regarding change-control and version management for the rule library, feature catalogue, and ML model weights — particularly when model updates occur?*

---

## Question 4 — Sufficiency of current evidence

**ARKA's position:** ARKA-CLIN's ML component is currently trained and evaluated on synthetic, guideline-aligned data (held-out RMSE ≈ 1.41; ~74% 3-class accuracy). This is not presented as a production clinical-performance claim. Recommendations remain anchored to published guidelines regardless of the ML refinement, and the system falls back to rules-only output when ML is unavailable.

**Question:** *Is our current synthetic-validation and sandbox evidence sufficient to support the stated intended use for a Non-Device CDS determination, or does FDA expect prospective or retrospective real-world clinical validation? If the latter, what study characteristics would FDA consider adequate?*

---

### Reviewer notes (delete before sending)
- Lead with Q1 (CLIN). It's your main event.
- Keep each question to a stated position + one closed ask.
- If a regulatory reviewer suggests trimming to 3, drop Q4 into the meeting discussion rather than as a formal topic.
