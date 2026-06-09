# Multiple-Function Analysis

> **DRAFT.** Frames ARKA under FDA's *Multiple Function Device Products: Policy and Considerations* guidance.
> Purpose: show that a multi-feature app can still be non-device, and pre-empt "but what about X?" questions.

---

## Function map

| Function | What it does | Regulatory basis | Status sought |
|---|---|---|---|
| **ARKA-CLIN** | Imaging-appropriateness recommendations from structured data; ranked, cited options | **§520(o)(1)(E)** Non-Device CDS (four criteria) | Concurrence (Question 1) |
| **ARKA-INS** | Benefit eligibility, claims-based utilization/cost analysis, PA documentation, cost transparency, scheduling | **§520(o)(1)(A)** administrative support | Concurrence (Question 2) |
| **Reference viewer** | Displays prior DICOM studies as non-diagnostic thumbnails | Separate display function; does not feed any recommendation | Out of scope — not under review |

## Why the functions don't contaminate each other
- **ARKA-CLIN never consumes images or signals.** Input validation + a CI guard prevent image/signal code from entering CLIN paths; the reference viewer is import-fenced (`SCOPE_BOUNDARY.md`, `scripts/lint-scope-boundary.ts`).
- **ARKA-INS recommendations are administrative, not clinical.** Coverage/denial-risk/cost outputs concern benefits and finance, not diagnosis or treatment, and do not alter ARKA-CLIN's guideline-anchored clinical logic.
- **No function makes another a device.** Under the multiple-function framework, the function-under-review (ARKA-CLIN) is assessed on its own; the other functions do not introduce image/signal processing, directives, or non-reviewable outputs into it.

## Requested concurrence
That FDA agrees with the above mapping: ARKA-CLIN as Non-Device CDS under (E); ARKA-INS as administrative support under (A); and the reference viewer as a separate display function not part of this review.

---

### Attach / reference
- [ ] `SCOPE_BOUNDARY.md`
- [ ] CI guard configuration + a passing run screenshot (Criterion-1 firewall)
