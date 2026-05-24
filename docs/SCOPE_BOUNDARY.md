# ARKA Software — Non-Device CDS Function Scope Boundary

**Date:** 2026-05-23  
**Author:** Arri  
**Status:** DICOM pixel pipeline removed (Phase 0.10 Option C); Criterion 1 question moot for viewer

## In-scope (Non-Device CDS functions under FD&C Act §520(o)(1)(E))

- All HTTP routes under `app/api/cds-services/` (discovery + every CDS Hooks service)
- All code under `lib/cds-platform/` (to be created in Phase 2)
- All code under `lib/cards/` and `lib/aiie/` that constructs CDS Hooks card responses
- The validation harness `scripts/test-cds-sandbox.ts`
- The demo page `app/cds-hooks-demo/` (Phase 6) and validation dashboard `app/cds-hooks-demo/validation/` (Phase 8)

## Out-of-scope (separate functions, NOT Non-Device CDS)

- `lib/viewer/projection-matcher.ts`, `lib/viewer/snapshot-study.ts`, `lib/viewer/checklists/*`, `lib/viewer/view-infer.ts` — FHIR **metadata-only** helpers for prior-study matching and reference checklists (no pixel I/O)
- `components/shared/ReferenceViewer.tsx` — text-metadata reference cards and systematic checklist UI (no thumbnails or DICOM)
- Rationale: these surfaces help a user identify prior studies from structured ImagingStudy metadata. They do **not** analyse pixel data and no CDS Hooks card content is derived from medical images.

## Removed (no longer in repo)

- `lib/viewer/dicom-phi-scrub.ts` — DICOM Part 10 PHI scrub before thumbnail use
- `lib/viewer/dicom-to-webp.ts` — embedded JPEG extraction and WebP conversion
- `lib/viewer/fetch-study-dicom.ts` — WADO/DICOM fetch chain
- `lib/viewer/thumbnail-cache.ts` — in-process WebP thumbnail cache
- `app/api/ins/viewer/image/[studyUid]/route.ts` — study thumbnail API
- `dicom-parser` npm dependency (and `sharp` usage tied to that pipeline)

## Boundary enforcement

- An import-lint guard at `scripts/lint-scope-boundary.ts` fails CI if any in-scope file imports from removed DICOM paths or image-processing viewer modules.
- The regulatory rationale memo (Phase 11) cites this document in Section 3.1 (Criterion 1).

## Counsel sign-off

- Reviewer: _pending_
- Date: _pending_
- Opinion: **N/A — DICOM viewer removed; Criterion 1 question moot.**
- Document on file at: _n/a_
