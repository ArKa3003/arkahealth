# Intended-Use / Indications Statement

> **DRAFT — the single most consequential paragraph in the package. Get it human-reviewed.**
> FDA's whole determination keys off intended use. Every word is load-bearing.

---

## A. ARKA-CLIN — proposed intended use (primary)

> **ARKA-CLIN is intended for use by licensed health care professionals to support the selection
> of clinically appropriate diagnostic imaging for [DECIDE: adult — or — adult and pediatric]
> patients in elective and non-urgent care settings. Using structured clinical data, ARKA-CLIN
> presents ranked, evidence-cited imaging options drawn from published clinical guidelines and
> peer-reviewed literature, together with the basis for each option, so that the clinician can
> independently review each recommendation and retains full responsibility for the decision.
> ARKA-CLIN does not acquire, process, or analyze medical images or physiological signals;
> does not provide time-critical alerts or triage; and does not place or block orders. It is
> intended to support, not replace, the clinician's independent judgment.**

### Why this wording (criterion mapping)
- **"licensed health care professionals" / "support, not replace"** → frames Criterion 3 (HCP-facing, recommendation not directive) and Criterion 4 (independent review).
- **"structured clinical data … not … medical images or physiological signals"** → Criterion 1 (no image/signal processing).
- **"published clinical guidelines and peer-reviewed literature … basis for each option"** → Criterion 2 ("well-understood and accepted sources") + Criterion 4 (reviewable basis).
- **"ranked … options"** (plural) → keeps you in **statutory exclusion** (multi-output), not the weaker 2026 enforcement-discretion lane for single outputs.
- **"elective and non-urgent … no time-critical alerts"** → avoids the time-critical concern (now under Criterion 4 in the 2026 guidance).

## B. ARKA-INS — function statement (administrative, §520(o)(1)(A))

> **ARKA-INS is intended for use by health care providers and qualified staff to determine
> health-benefit eligibility, analyze historical claims data to estimate future utilization and
> cost, support prior-authorization documentation, and present cost-transparency and scheduling
> information. These are administrative-support functions of a health care facility under
> §520(o)(1)(A) and are not intended to provide clinical diagnosis or treatment recommendations.**

## C. Intended users
Licensed physicians (MD/DO), nurse practitioners, physician assistants, radiologists, and qualified staff acting under clinician supervision. **Not** intended for patient or caregiver use.

## D. Out-of-scope (state explicitly)
- Medical image / signal analysis (CT, MRI, X-ray, ultrasound, ECG, CGM, SpO₂, etc.)
- Time-critical alerts/triage (stroke, sepsis, STEMI)
- Autonomous order placement or blocking
- Patient/consumer-facing recommendations
- The reference DICOM viewer (separate display function; not under review)

---

### Decisions to resolve (do not file until done)
- [ ] **[DECIDE] adults only vs adults + pediatrics** — must match model card + rules + brief.
- [ ] Confirm "elective and non-urgent" matches how the product is actually marketed and used.
- [ ] Confirm no CLIN card uses blocking/critical/"Cancel order" language (that lives only in INS).
