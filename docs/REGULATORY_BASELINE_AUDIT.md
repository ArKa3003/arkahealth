# Regulatory Baseline Audit — ARKA Health (Pre–Phase 2)

**Date:** 2026-05-23  
**Commit:** `d8f8a6e83b2729c60a0ccb72be46b039e441c0b1`  
**Scope:** READ-ONLY starting-state survey against FD&C Act §520(o)(1)(E) four Non-Device CDS criteria  
**Playbook reference:** `~/Desktop/arka cds/ARKA_CDS_HOOKS_UNIFIED_PLAYBOOK.md` (Phase 0–1 baseline, before Phase 2)

---

## TL;DR

- **Overall starting state:** Partially aligned scaffolding exists (INS CDS hooks, AIIE scoring, FDA banner/disclosure constants, some card builders with citations), but the playbook’s `lib/cds-platform/` regulatory layer (`MedicalBasis`, feature catalogue, decision log, card linter) is **entirely absent**. This is expected pre–Phase 2.
- **Biggest pre-existing risk:** **Criterion 1 — DICOM pixel pipeline** under `lib/viewer/` + `app/api/ins/viewer/` actively fetches DICOM binaries, extracts embedded JPEG pixel data, and renders thumbnails in `ReferenceViewer`. This is actual medical-image processing, not metadata-only FHIR use.
- **Copy-scrubbing (Criterion 5):** **Zero hits** for `FDA (approved|cleared|registered|certified|endorsed)` repo-wide. Phase 11.1 forbidden-marketing grep job sizes to **0 replacements** for that pattern; other FDA phrasing still needs Phase 11 alignment (banner/disclosure wording).
- **Image/signal code:** **Yes — deal-breaker class findings exist** (DICOM→WebP thumbnail path). No `wfdb`, `pydicom`, `scipy.signal`, `pylibjpeg`, or `presentedForm` hits. No `ml-service/` directory or `requirements.txt`.
- **Phase 11 copy-scrub task size:** Forbidden marketing pattern = **0 hits**. Banner + card disclosure alignment = **2 core files** (`FDANonDeviceBanner.tsx`, `fda-disclosure.ts`) plus broader “designed to meet criteria” pass across marketing pages per Phase 11.1 step 2 (not yet audited line-by-line beyond the forbidden pattern).

---

## 1. Criterion 1 — Data Input

**What was searched:**  
`presentedForm|DiagnosticReport|Media\b|ImagingStudy|DICOM|pixel|wfdb|pydicom|scipy\.signal|pylibjpeg` across `*.{ts,tsx,js,py}`; plus `ml-service/requirements.txt` (absent).

### Summary counts

| Classification | File count | Line hits (approx.) |
| --- | ---: | ---: |
| **HARD VIOLATION** (actual DICOM/pixel processing or display) | 5 | 28 |
| **TYPE-DEFINITION-ONLY** (FHIR types, metadata, prefetch templates) | 12 | 34 |
| **FALSE-POSITIVE** (`matchMedia`, SVG `<stop>`, equipment copy) | 8 | 22 |
| **Test-only** (excluded from violation count) | 3 | 12 |

`ml-service/requirements.txt`: **does not exist** (no `ml-service/` directory in repo).

### Raw findings (file:line)

#### HARD VIOLATION — actual processing / pixel display

| File:line | One-line description |
| --- | --- |
| `lib/viewer/dicom-phi-scrub.ts:1` | Imports `dicom-parser` for DICOM Part 10 parsing. |
| `lib/viewer/dicom-phi-scrub.ts:12–16` | `scrubDicomPhiBuffer()` parses DICOM in-place before downstream use. |
| `lib/viewer/dicom-to-webp.ts:1,4` | Imports `dicom-parser`; uses scrubbed DICOM buffer. |
| `lib/viewer/dicom-to-webp.ts:13–21` | `extractJpegFromDicom()` reads pixel element `x7fe00010` (embedded JPEG). |
| `lib/viewer/dicom-to-webp.ts:50–55` | `dicomBufferToWebp()` converts DICOM buffer → WebP thumbnail. |
| `lib/viewer/fetch-study-dicom.ts:20–24` | `fetchStudyDicomBuffer()` resolves ImagingStudy → WADO/DICOM bytes. |
| `lib/viewer/fetch-study-dicom.ts:70–75` | `resolveStudyWebpThumbnail()` chains DICOM fetch → WebP conversion. |
| `lib/fhir/client.ts:418` | WADO/Binary fetch sends `Accept: application/dicom, application/octet-stream`. |
| `app/api/ins/viewer/image/[studyUid]/route.ts:4–5` | API route imports DICOM→WebP resolver for study thumbnails. |
| `app/api/ins/viewer/image/[studyUid]/route.ts:71` | Serves WebP derived from DICOM for a study UID. |
| `components/shared/ReferenceViewer.tsx:30–34` | Builds `/api/ins/viewer/image/…` thumbnail URL per study. |
| `components/shared/ReferenceViewer.tsx:70–72` | Renders `<img>` of DICOM-derived thumbnail (“non-diagnostic”). |
| `components/shared/ReferenceViewer.tsx:160` | UI copy references “Pixel data may be compressed”. |

#### TYPE-DEFINITION-ONLY — FHIR/metadata, no pixel analysis

| File:line | One-line description |
| --- | --- |
| `lib/types/record-snapshot.ts:62–66` | `PriorImagingStudy` interface; comment “no DICOM pixels”. |
| `lib/types/record-snapshot.ts:83–84` | `PriorDiagnosticReport` interface (report metadata). |
| `lib/types/record-snapshot.ts:175,177` | Snapshot fields `priorImaging`, `priorReports`. |
| `lib/fhir/client.ts:381–390` | `readImagingStudy()` FHIR metadata read by logical id. |
| `lib/fhir/record-scraper.ts:92–93` | Prefetch query strings for `ImagingStudy?patient=` and `DiagnosticReport?patient=`. |
| `lib/fhir/record-normalizer.ts:278–280,307–309` | Normalizes ImagingStudy/DiagnosticReport resources to snapshot types. |
| `lib/aiie/incidentals.ts:3–4,262,308` | Uses prior report/study **metadata** types. |
| `lib/aiie/redundancy.ts:4–5,201–203,229–231` | Parses DiagnosticReport **conclusion text** (not pixels). |
| `lib/aiie/control-sheet-rows.ts:2,12,61` | Prior imaging row typing for control sheet. |
| `lib/viewer/snapshot-study.ts:50–58` | Finds prior imaging row by FHIR id or Study UID (metadata). |
| `lib/viewer/projection-matcher.ts:1,20–94` | Matches studies by modality/bodyPart/view metadata. |
| `app/api/cds-services/route.ts:30` | Discovery prefetch template `ImagingStudy?patient={{context.patientId}}`. |
| `components/shared/PriorImagingControlSheet.tsx:217–218,313` | UI labels referencing DiagnosticReport ids. |

#### FALSE-POSITIVE

| File:line | One-line description |
| --- | --- |
| `components/shared/ThemeProvider.tsx:29,37,43` | `window.matchMedia("(prefers-color-scheme: dark)")` — not FHIR Media. |
| `components/ArkaAnimatedLogo/*.tsx` (multiple) | SVG gradient `<stop offset=…>` elements. |
| `components/landing/EcosystemDiagram.tsx:136–138` | SVG gradient stops. |
| `components/demos/rural/network/HubSpokeNetworkDiagram.tsx:62–63` | SVG gradient stops. |
| `components/demos/rural/cds/MobileUnitProtocol.tsx:15` | Marketing copy “transmit DICOM + clinical context pack”. |
| `lib/demos/rural/ai/marketplace-data.ts:24,47,70,93,116` | Equipment requirement strings mentioning DICOM connectivity. |
| `lib/fhir/coverage.ts:157` | Cost-kind matcher includes `"stop"` (MOOP/OOP label, not directive verb). |

#### Test-only (informational)

| File:line | One-line description |
| --- | --- |
| `__tests__/viewer/dicom-phi-scrub.test.ts` | Unit tests for DICOM PHI scrub + WebP path. |
| `__tests__/viewer/projection-matcher.test.ts:7–28` | Uses `PriorImagingStudy` fixtures. |
| `__tests__/fhir/record-scraper.test.ts:76` | Mock `resourceType: "ImagingStudy"`. |

**No hits:** `presentedForm`, `wfdb`, `pydicom`, `scipy.signal`, `pylibjpeg`.

**Implication for playbook:** Phase 2+ must treat the existing DICOM viewer pipeline as in-scope for Criterion 1 remediation or explicit exclusion from Non-Device CDS scope; the playbook’s greenfield `lib/cds-platform/` path does not yet address this pre-existing INS viewer code.

---

## 2. Criterion 2 — Medical Information

### 2a. Card-building files (`indicator.*['"](info|warning|critical)` in TS)

| File | Role |
| --- | --- |
| `lib/cards/coverage-card.ts` | Primary PA/coverage intelligence card |
| `lib/cards/overuse-soft-block-card.ts` | Overuse pattern soft-block card |
| `lib/cards/duplicate-order-card.ts` | Prior-imaging redundancy card |
| `lib/cards/gold-card-card.ts` | Gold Card auto-approval card |
| `lib/cards/oop-card.ts` | Out-of-pocket transparency card |
| `lib/cards/alternative-site-card.ts` | Site-shopping / reroute card |
| `lib/cards/stat-reclass-card.ts` | STAT→Urgent reclassification card |
| `lib/davinci/crd.ts` | CRD card assembly (doc gap, order-sign, appointment) |
| `lib/demos/clin/evaluate-imaging.ts` | CLIN demo CDS card converter (`convertResultToCDSCards`) |
| `app/api/cds-services/arka-ins-appointment/route.ts` | Inline appointment card builder (~line 310) |
| `lib/validation/cds-hooks-response.ts` | Zod schema (not a builder) |
| `__tests__/cards/*.ts`, `__tests__/cds/*.ts` | Tests |

### 2b. Citation presence per card builder

**Includes published-source citation references in card body:**

| File | Evidence |
| --- | --- |
| `lib/cards/coverage-card.ts` | SHAP lines cite `f.evidenceCitation` (`:34`); `Guideline citations` section (`:39–46`, `:170–172`). |
| `lib/cards/overuse-soft-block-card.ts` | `rule.citations` rendered as “Guideline references” (`:49`, `:66–68`); seeded ACR / Choosing Wisely in `lib/aiie/overuse-patterns.ts:65–68`. |

**Does NOT include ACR / USPSTF / NICE / Choosing Wisely / doi / PMID / guideline strings in card body:**

| File | Notes |
| --- | --- |
| `lib/cards/duplicate-order-card.ts` | Clinical overlap narrative only (`:77–89`). |
| `lib/cards/gold-card-card.ts` | Wilson-score metrics only (`:23–40`). |
| `lib/cards/oop-card.ts` | Cost-sharing tables only (`:75–101,101`). |
| `lib/cards/alternative-site-card.ts` | Financial comparison only (`:72–84`). |
| `lib/cards/stat-reclass-card.ts` | Internal STAT criterion labels only (`:48–71`); no published citations. |
| `lib/davinci/crd.ts` | All card builders (`:73–386`); no citation keywords in `detail`/`summary`. |
| `lib/demos/clin/evaluate-imaging.ts` | `convertResultToCDSCards()` (`:264–270`) uses `result.reasoning` without embedding `evidenceLinks`; `buildMatchedCriteria` source is generic `'AIIE evidence-based methodology'` (`:119`). |
| `app/api/cds-services/arka-ins-appointment/route.ts` | Inline card at `:308–312`; scheduling/cost copy only. |

### 2c. `medicalBasis` / evidence field consistency

| Field / concept | Present? | Location |
| --- | --- | --- |
| `medicalBasis` | **No** | Zero matches repo-wide |
| `MedicalBasis` type | **No** | `lib/cds-platform/` absent |
| `evidenceCitation` on factors | **Yes** | `lib/types/aiie.ts:61–62` on `AIIEFactor`; populated in `lib/aiie/scoring-engine.ts:220–228` via `buildFactor()` |
| `OveruseRule.citations` | **Yes** | `lib/aiie/overuse-patterns.ts:28–29` |
| `CDSCard.source` | **Yes** | `lib/types/cds-hooks.ts:69–76`, set via `ARKA_INS_CARD_SOURCE` in `lib/cards/card-shared.ts:4–7` |
| Card `detail` FDA footer | **Yes** | `appendFdaDetailDisclaimer()` in `lib/cards/card-shared.ts:22–27` |

**Closest analog to playbook `MedicalBasis`:** `AIIEFactor.evidenceCitation` + `OveruseRule.citations` — factor-level strings, not a first-class card field. No `assertMedicalBasis`, no citation library, no required `medicalBasis` on `CDSCard`.

**Implication for playbook:** Phase 2 should import `MedicalBasis` from arkacdshooks and wire card builders to it; existing `evidenceCitation` strings are the migration source for coverage/overuse cards only.

---

## 3. Criterion 3 — HCP Recommendations

**What was searched:** Case-insensitive `\b(cancel|stop|switch to|do not order|you must|you should|immediately|urgent action)\b` in `*.{ts,tsx,md}`, excluding tests/types/comments where noted; plus UI hard-block pattern scan.

### 3a. Banned-verb hits (user-facing JSX / card copy / .md UI copy)

| File:line | Surrounding string | Notes |
| --- | --- | --- |
| `lib/cards/coverage-card.ts:102` | `label: "Cancel order"` | CDS suggestion label in `suggestionsForAction()` |
| `components/demos/clin/ClinResultsView.tsx:339` | `Switch to this order` | Button label in alternatives panel |
| `lib/demos/rural/scoring/raas-engine.ts:300` | `"CRITICAL: Initiate transfer immediately. Pre-notify receiving facility."` | `clinicalSafetyNote` returned to rural triage UI |
| `components/demos/rural/cds/SmartTriagePathway.tsx:265` | `{recommendation.clinicalSafetyNote}` | Renders raas-engine “immediately” string |
| `docs/INS_SANDBOX_TESTING.md:69` | `you should see CDS cards` | Sandbox testing doc (UI-adjacent) |
| `docs/ARKA-INS_Payer_Pitch.md:239` | `economics flip immediately` | Marketing doc |

**Excluded as false positives:** SVG `<stop>` elements in `components/ArkaAnimatedLogo/*`, `EcosystemDiagram.tsx`, `HubSpokeNetworkDiagram.tsx`; `lib/fhir/coverage.ts:157` MOOP “stop” label; demo vignette clinical narrative in `lib/demos/ed/data/cases/*` (educational case text, not CDS card copy).

**Not found in card builders:** `do not order`, `you must`, `urgent action` in `lib/cards/*.ts` detail/summary strings.

**Coercive non-banned language (informational):**

| File:line | String |
| --- | --- |
| `lib/cards/overuse-soft-block-card.ts:70` | `override reason with free-text justification is required to proceed with this order` |
| `lib/cards/duplicate-order-card.ts:74` | `override reason with **free-text justification** is required to proceed` |
| `lib/davinci/crd.ts:241` | `Likely denial risk — signature requires override or DTR completion` |

### 3b. Hard-block–like UI patterns

| File:line | Pattern | Description |
| --- | --- | --- |
| `lib/cards/overuse-soft-block-card.ts:78` | `indicator: "critical"` | Critical-tier overuse card with mandatory override framing |
| `lib/cards/duplicate-order-card.ts:65,74` | `indicator: "critical"` (high severity) | Soft-block duplicate imaging |
| `lib/davinci/crd.ts:233–262` | `buildOrderSignCriticalBlockCard()` | `indicator: "critical"`; summary “signature requires override or DTR completion” |
| `components/ins/reviewer/ActionPanel.tsx:74–77` | `window.confirm(...)` | OK/Cancel gate before recording demo denial disposition |
| `components/ins/provider/OrderLifecycleTable.tsx:161` | `DialogContent` | Modal workflow for order lifecycle actions |
| `components/shared/compliance/AIIEEvidenceModal.tsx:30` | `DialogContent` | Informational modal (non-blocking to ordering) |
| `app/ins/provider/gold-card/page.tsx:13` | `redirect(...)` | Route redirect (navigation, not CDS hook block) |

No route guards that `throw` to prevent CDS hook responses were found in CDS service routes.

**Implication for playbook:** Phase 2 `override-reasons.ts`, Phase 11 style guide + `lint-cards.ts`, and Phase 4 CLIN hook card language will need to reconcile existing INS “soft-block” / order-sign critical cards with Criterion 3 non-coercion rules.

---

## 4. Criterion 4 — Independent Review

### 4a. `lib/cds-platform/ml/feature-catalog.ts`

**Absent** (expected — Phase 2 deliverable). No `lib/cds-platform/` directory exists.

### 4b. SHAP / attribution / explainability surfacing

| File:line | What surfaces |
| --- | --- |
| `lib/cards/coverage-card.ts:34,162–166` | SHAP factor markdown in CDS card `detail` |
| `components/demos/clin/ClinResultsView.tsx:204–284` | SHAP waterfall UI in CLIN demo |
| `lib/demos/ins/parse-coverage-cds-response.ts:70–74,189–195` | Parses SHAP lines from card detail for INS demo |
| `lib/types/aiie.ts:54–55,254` | `contribution` as SHAP-style value on factors |
| `lib/aiie/scoring-engine.ts:6,39` | Engine emits SHAP-style factor breakdown |
| `components/demos/rural/cds/DualScoreDisplay.tsx:125–177` | “Resource Context Factors (SHAP-style)” bars |
| `lib/demos/rural/scoring/raas-engine.ts:391–513` | `generateResourceFactors()` for RAAS display |
| `components/demos/ed/IntroducingAIIESection.tsx:11` | Marketing copy mentions SHAP |
| `lib/demos/clin/constants/fda-compliance.ts:12,42,72` | Static compliance copy references SHAP |

### 4c. Rationale + citation paired per attribution row?

| Location | Rationale string | Citation link/string | Paired? |
| --- | --- | --- | --- |
| `lib/cards/coverage-card.ts:34` | Factor name + SHAP value (inline) | `_f.evidenceCitation_` on same line | **Yes** (same markdown line) |
| `components/demos/clin/ClinResultsView.tsx:229–268` | `factor.explanation` (`:263`) | `factor.evidenceCitation` (`:267`) — toggle via “Show evidence citations” | **Yes** (same component; citation hidden until toggled) |
| `components/demos/rural/cds/DualScoreDisplay.tsx:131–175` | `ResourceFactor.explanation` exists on type (`lib/demos/rural/types.ts:326`) but **not rendered** | No citation field on `ResourceFactor` | **No** |
| `lib/demos/ins/parse-coverage-cds-response.ts:149` | Parses combined string | Citation embedded in parsed SHAP line | **Partial** (depends on card detail format) |

No feature-catalog lookup; no catalogue-gated filtering of SHAP features.

**Implication for playbook:** Phase 2 `feature-catalog.ts` + Phase 5 ML integration must backfill rationale+citation for every surfaced SHAP feature; rural RAAS and CLIN demo paths need alignment with catalogue entries.

---

## 5. Forbidden Marketing Copy

**What was searched:** `FDA (approved|cleared|registered|certified|approved|endorsed)` case-insensitive, all file types.

### Results

**0 matches** repo-wide.

**Implication for playbook:** Phase 11.1 step 2 forbidden-pattern grep is already clean; remaining work is banner/disclosure wording alignment and broader “designed to meet criteria” phrasing (see §6).

---

## 6. Existing Regulatory Artefacts

### 6a. `components/shared/compliance/FDANonDeviceBanner.tsx`

**Exists:** yes

**Current copy (verbatim core FDA paragraph, `:64–65`):**

> ARKA is an FDA Non-Device Clinical Decision Support tool under Section 520(o)(1)(E) of the FD&C Act (21st Century Cures Act). This tool provides information to support clinical decisions; it does not replace clinical judgment.

**Phase 11.1 exact target copy:**

> ARKA Clinical Decision Support is designed to meet all four criteria for Non-Device CDS under FD&C Act §520(o)(1)(E) and FDA's September 2022 final guidance on Clinical Decision Support Software. Recommendations support, not replace, the clinician's judgment. Every recommendation is anchored in a published guideline or peer-reviewed source, with the basis available for independent review.

**Match:** **MISMATCH** (different product naming, missing “designed to meet all four criteria”, missing citation/independent-review clause; CTA is “Learn more” not “Read the regulatory rationale ↗”).

### 6b. `lib/compliance/fda-disclosure.ts`

**Exists:** yes

**Current `FDA_NON_DEVICE_CDS_DISCLOSURE` (`:5–6`):**

```text
This recommendation is provided by ARKA Imaging Intelligence Engine, an FDA Non-Device Clinical Decision Support tool under the 21st Century Cures Act. The ordering clinician retains full responsibility for the final decision.
```

**Playbook Phase 2 §6 target (user referenced “Section 3.7”; playbook Appendix C §3 stops at 3.4 — disclosure spec lives in Phase 2 step 6):**

```text
This recommendation is intended to support, not replace, clinical judgment. It is generated by ARKA, software designed to meet the four criteria for Non-Device Clinical Decision Support under FD&C Act §520(o)(1)(E) and FDA's 2022 final guidance on Clinical Decision Support Software. The clinician is responsible for the final decision.
```

**Match:** **MISMATCH** (different opening framing; says “FDA Non-Device … tool” vs “designed to meet the four criteria”; missing §520(o)(1)(E) and 2022 guidance references; `FDA_DISCLOSURE_VERSION` constant **absent**).

Also duplicated inline in: `lib/coding/mnai.ts:80`, `lib/davinci/dtr.ts:34`, `components/shared/IncidentalFollowupCard.tsx:23`.

### 6c. Phase 0.6 regulatory docs vs repo

| Playbook Phase 0.6 artefact | Status |
| --- | --- |
| `docs/REGULATORY_RATIONALE_MEMO.md` | **Absent** |
| `docs/CLINICAL_SIGN_OFF_LOG.md` | **Absent** |
| `docs/CDS_CARD_LANGUAGE_STYLE_GUIDE.md` | **Absent** |
| `docs/PHI_REDACTION.md` | **Absent** |
| `docs/CDS_SANDBOX_REGISTRATION.md` | **Absent** |
| `docs/regulatory-evidence/sandbox-screenshots/` | **Absent** |
| `lib/cds-platform/cds-hooks/medical-basis.ts` | **Absent** |
| `lib/cds-platform/citations/index.ts` | **Absent** |
| `lib/cds-platform/ml/feature-catalog.ts` | **Absent** |
| `lib/cds-platform/audit/decision-log.ts` | **Absent** |
| `lib/cds-platform/alerting/override-reasons.ts` | **Absent** |
| `ml-service/MODEL_CARD.md` | **Absent** |
| `scripts/lint-cards.ts` | **Absent** |
| `scripts/regulatory-checks.ts` | **Absent** |

**Existing regulatory-adjacent docs in `docs/`:**

| File | Nature |
| --- | --- |
| `docs/INS_GO_LIVE_CHECKLIST.md` | Checklist mentions FDA banner |
| `docs/INS_SANDBOX_TESTING.md` | Sandbox + disclosure verification steps |
| `docs/INS_ARCHITECTURE.md` | Architecture; references compliance paths |
| `docs/GO_LIVE_CHECKLIST.md` | General go-live |
| `docs/FEDERATED_PRIVACY.md` | Privacy (not regulatory memo) |
| Other `docs/*` | Deployment, pitch, rural guide — not Phase 0.6 evidence trail |

**Implication for playbook:** Phase 2 creates scaffolds; Phase 11 produces memo/style guide/PHI doc; Phase 10 produces sandbox registration + screenshots.

---

## 7. Existing CDS Hooks Routes

### 7a. Files under `app/api/cds-services/`

| File | Service id | Hook |
| --- | --- | --- |
| `app/api/cds-services/route.ts` | (discovery) | GET discovery |
| `app/api/cds-services/arka-ins-coverage/route.ts` | `arka-ins-coverage` | `order-select` |
| `app/api/cds-services/arka-ins-final-check/route.ts` | `arka-ins-final-check` | `order-sign` |
| `app/api/cds-services/arka-ins-appointment/route.ts` | `arka-ins-appointment` | `appointment-book` |

**Total:** 4 files (1 discovery + 3 hook routes).

### 7b. Phase 1 inventory reconciliation

| Phase 1 inventory item | Baseline status |
| --- | --- |
| Discovery `app/api/cds-services/route.ts` | **Present** |
| `arka-ins-coverage` | **Present** |
| `arka-ins-final-check` | **Present** |
| `arka-ins-appointment` | **Present** |
| `arka-clin-appropriateness` route | **Absent** (advertised only) |
| `arka-clin-appropriateness-sign` route | **Absent** |

**Discovery advertises `arka-clin-appropriateness`:** **Yes** — `app/api/cds-services/route.ts:22–31` lists `id: "arka-clin-appropriateness"` with ImagingStudy prefetch.

**Route file for `arka-clin-appropriateness`:** **No** — `app/api/cds-services/arka-clin-appropriateness/route.ts` does not exist (expected; Phase 4 deliverable).

**Implication for playbook:** Phase 4 must create the advertised CLIN hook route or temporarily remove it from discovery to avoid sandbox 404s; Phase 1 inventory otherwise matches.

---

## Recommendations — Findings → Playbook Phases

| Finding | Addressed by |
| --- | --- |
| DICOM pixel pipeline (`lib/viewer/*`, `app/api/ins/viewer/*`, `ReferenceViewer`) | Phase 0.6 scoping decision + Phase 11 PHI/redaction; may need explicit Criterion 1 exclusion or refactor outside CDS scope |
| `lib/cds-platform/` absent (`MedicalBasis`, citations, feature catalogue, decision log) | **Phase 2** |
| `medicalBasis` field missing on cards; partial `evidenceCitation` coverage | **Phase 2–3** (types + card-builder reconciliation) |
| Card builders without guideline citations (gold, OOP, alt-site, stat, CRD, CLIN converter) | **Phase 3–4** (`TODO(fda-criterion-2)`), **Phase 11** (`lint-cards.ts`) |
| Banned verbs in CDS/demo copy (`Cancel order`, `Switch to`, `immediately`) | **Phase 11** (style guide + linter) |
| Critical-tier / override-required soft blocks | **Phase 2** (`override-reasons.ts`), **Phase 4–6** (CLIN hooks), **Phase 11** (style guide) |
| SHAP without feature catalogue; rural RAAS missing citation pairing | **Phase 2** (catalogue), **Phase 5** (ML), **Phase 6** (demo sidebar) |
| `FDA_NON_DEVICE_CDS_DISCLOSURE` / banner wording mismatch | **Phase 11.1** |
| Phase 0.6 evidence docs absent | **Phase 2** (scaffolds), **Phase 10–11** (memo, sign-off, PHI, sandbox evidence) |
| `arka-clin-appropriateness` advertised but no route | **Phase 4** |
| Forbidden FDA marketing pattern (`approved`/`cleared`/etc.) | **Already zero** — **Phase 11.1** verifies sustained |

---

*End of baseline audit. No source files were modified.*
