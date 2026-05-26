# ARKA CDS Card Language Style Guide
**Version:** 1.0
**Enforces:** FDA Non-Device CDS Criterion 3 (support, not replace)
**Enforced by:** scripts/lint-cards.ts (CI)

## Purpose
Every card-facing string (card.summary, card.detail, suggestion.label, button text in CDS sidebar UI) must use supportive, evidence-framed language. This guide lists banned verbs, permitted alternatives, and rewrites for common patterns.

## Banned verbs and phrases (linter fails the build)
- cancel
- stop (except as part of compound nouns like "stop-loss" or "MOOP/OOP stop")
- switch (to)
- replace
- do not order
- must (in directive sense; "must include" in spec text is fine)
- require / required (as coercion; "required by payer policy" is fine when literally true)
- immediately (except in clinical-urgency labels like "CRITICAL:" prefixes)
- urgent action
- you should
- you must

## Permitted alternatives
- consider, evaluate, review, weigh
- the evidence suggests
- an alternative consistent with {guideline} is
- clinicians may wish to
- please document the reasoning if proceeding
- {guideline} rates this {N}/9 for the indication

## Examples

| ❌ Banned | ✅ Preferred |
|---|---|
| "Cancel the MRI order." | "Consider whether MRI is the appropriate first-line study; ACR rates this 2/9 for non-radicular low back pain < 6 weeks." |
| "Switch to ultrasound." | "Review ultrasound as a first-line alternative consistent with ACR Appropriateness Criteria for pediatric right-lower-quadrant pain." |
| "You must document a reason to proceed." | "If proceeding, please document the clinical reasoning to support quality review." |
| "Override required to sign." | "If proceeding, the EHR will prompt for an override reason; choose the option that best reflects your clinical reasoning." |

## Citation placement
Every card body must include `medicalBasis.label` and a clickable link to `medicalBasis.url` BEFORE any ARKA-derived risk score or SHAP factor. The citation comes first; ARKA's contribution is shown as refinement, not authority.

## Suggestion button labels
Every `card.suggestions[].label` must start with one of: Review, Consider, Open, View. The lint enforces this regex: `^(Review|Consider|Open|View)`.

## Da Vinci payer-workflow exception
Strings in lib/davinci/* that reflect HL7 Da Vinci CRD/DTR payer-adjudication semantics (not CDS coercion) may use "needed for adjudication" and "DTR completion" verbs. These are contractual payer requirements, not directive CDS recommendations. The linter has an allowlist for files under lib/davinci/.

## Process
Any addition or change to this guide bumps the Version above and requires an entry in docs/CLINICAL_SIGN_OFF_LOG.md.
