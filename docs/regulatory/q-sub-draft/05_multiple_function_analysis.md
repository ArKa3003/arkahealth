# Multiple-Function Analysis

**ARKA Health, Inc. — Pre-Submission · Document 05 · Version 1.0 · June 9, 2026**

This analysis follows FDA's guidance *Multiple Function Device Products: Policy and Considerations*. ARKA is a single platform with distinct software functions; each function is presented with its regulatory basis so the function under review can be assessed on its own merits.

## 1. Function map

| Function | What it does | Regulatory basis presented | Status requested |
|---|---|---|---|
| **ARKA-CLIN** | Imaging-appropriateness recommendations from structured data; ranked, evidence-cited options with reviewable basis | §520(o)(1)(E) — Non-Device CDS (four criteria) | Concurrence (Question 1) |
| **ARKA-INS** | Benefit-eligibility determination, claims-based utilization/cost analysis, prior-authorization documentation, cost transparency, scheduling | §520(o)(1)(A) — administrative support of a health care facility | Concurrence (Question 2) |
| **Reference viewer** | Displays previously acquired DICOM studies as non-diagnostic thumbnails for study identification | Separate display function; contributes nothing to any recommendation | Out of scope — not under review |

## 2. Why the functions do not contaminate one another

**ARKA-CLIN never consumes images or signals.** Input validation accepts only structured FHIR resources, and continuous-integration guards (`scripts/regulatory-checks.ts` and the import-lint in `scripts/lint-scope-boundary.ts`, executed on every push and pull request by `.github/workflows/go-live.yml`) fail the build if image- or signal-processing code enters in-scope CDS paths. The reference viewer is import-fenced behind a documented scope boundary (`docs/SCOPE_BOUNDARY.md`); no CDS card content is derived from its code path.

**ARKA-INS outputs are administrative, not clinical.** Coverage, denial-risk, cost, and scheduling outputs concern benefits, finance, and workflow. They do not alter ARKA-CLIN's guideline-anchored clinical logic, and they are visually and semantically distinct card types.

**No function changes the analysis of another.** Under the multiple-function framework, ARKA-CLIN — the function for which a CDS determination is requested — is assessed on its own. The other functions introduce no image or signal processing, no clinical directives, and no non-reviewable outputs into ARKA-CLIN's path.

## 3. Requested concurrence

ARKA requests FDA's concurrence with this mapping: ARKA-CLIN assessed as Non-Device CDS under §520(o)(1)(E); ARKA-INS as administrative support under §520(o)(1)(A); and the reference viewer treated as a separate display function not part of this review.

## 4. Evidence attached with this document

- Scope boundary documentation (`docs/SCOPE_BOUNDARY.md`)
- CI enforcement configuration (`.github/workflows/go-live.yml`; `scripts/regulatory-checks.ts`; `scripts/lint-scope-boundary.ts`)
