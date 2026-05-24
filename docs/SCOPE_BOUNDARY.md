# ARKA Software — Non-Device CDS Function Scope Boundary

**Date:** 2026-05-23  
**Author:** Arri  
**Status:** Draft pending regulatory counsel review (see Phase 0.10)

## In-scope (Non-Device CDS functions under FD&C Act §520(o)(1)(E))

- All HTTP routes under `app/api/cds-services/` (discovery + every CDS Hooks service)
- All code under `lib/cds-platform/` (to be created in Phase 2)
- All code under `lib/cards/` and `lib/aiie/` that constructs CDS Hooks card responses
- The validation harness `scripts/test-cds-sandbox.ts`
- The demo page `app/cds-hooks-demo/` (Phase 6) and validation dashboard `app/cds-hooks-demo/validation/` (Phase 8)

## Out-of-scope (separate functions, NOT Non-Device CDS)

- `lib/viewer/*` — DICOM-to-WebP thumbnail rendering for reference display
- `app/api/ins/viewer/image/[studyUid]/route.ts` — thumbnail-serving route
- `components/shared/ReferenceViewer.tsx` — thumbnail UI
- Rationale: these functions display previously-acquired imaging studies as reference thumbnails to help a user identify prior studies. They do NOT analyse pixel data to derive a CDS recommendation. No CDS Hooks card content is derived from this code path.

## Boundary enforcement

- An import-lint guard at `scripts/lint-scope-boundary.ts` (added in 1.5.B) fails CI if any in-scope file imports from any out-of-scope path.
- The regulatory rationale memo (Phase 11) cites this document in Section 3.1 (Criterion 1).

## Counsel sign-off

- Reviewer: _pending_
- Date: _pending_
- Opinion: _pending counsel review_
- Document on file at: _pending_
