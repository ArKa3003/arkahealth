# ARKA Clinical Decision Support — Regulatory Rationale Memo

**Version:** 1.0 (draft)  
**Date:** 2026-05-26  
**Author:** Arri Kanna, ARKA Health  
**Scope:** ARKA-CLIN-APPROPRIATENESS (order-select, order-sign) and ARKA-INS suite (coverage, final-check, appointment-book)

---

## 1. Executive Summary

[TODO: USER FILLS — one paragraph, ~120 words. Cursor: leave a placeholder paragraph that I will rewrite. Placeholder should be: "ARKA Clinical Decision Support is software designed to meet all four criteria for Non-Device CDS under FD&C Act §520(o)(1)(E) (21st Century Cures Act §3060) and FDA's September 2022 final guidance on Clinical Decision Support Software. This memo maps ARKA's architecture to each criterion, with citations to specific files in the repository and external regulatory artefacts. The core architectural commitment is rules-first response composition: every shipped card's primary basis is a published clinical guideline or peer-reviewed source, with ML-derived risk refinement surfaced as an ancillary, optional confidence layer. The DICOM viewer (lib/viewer/) is explicitly out of Non-Device CDS scope per the function-boundary argument in docs/SCOPE_BOUNDARY.md."]

---

## 2. Product Description

ARKA Clinical Decision Support supports licensed health care professionals who order elective diagnostic imaging in U.S. outpatient and non-emergent inpatient workflows. At order-select and order-sign, ARKA-CLIN surfaces imaging appropriateness recommendations, documentation prompts, and patient-specific refinement anchored in published evidence. ARKA-INS extends the same CDS Hooks surface with payer-aligned coverage intelligence, prior-authorization documentation (Da Vinci CRD/DTR), duplicate-order awareness, and appointment-booking checks. ARKA does not provide time-critical emergency alerts (for example sepsis bundles, stroke clock, or STEMI pathways), does not interpret acquired image pixels to derive recommendations, and does not autonomously place or block orders. Intended users are licensed clinicians and qualified staff acting under clinician supervision; the ordering clinician retains full responsibility for the final decision.

---

## 3. Mapping to the Four Non-Device CDS Criteria

### 3.1 Criterion 1 — Data Input

ARKA Non-Device CDS functions consume only structured FHIR resources supplied through CDS Hooks prefetch and authorization context—never medical images, in vitro diagnostic signals, or acquisition waveforms. The feature-engineering boundary in `lib/cds-platform/ml/feature-engineer.ts` documents `AllowedFeatureSource` as the union of Patient, Condition, Observation, ServiceRequest, MedicationRequest, AllergyIntolerance, and Coverage; every scalar in the 23-feature XGBoost vector is derived from those types via `lib/cds-platform/ml/feature-catalog.ts` `sourceResource` metadata. A CI guard in `scripts/regulatory-checks.ts` [TODO: to be wired in Prompt 11.E] will fail builds that import image or signal-processing libraries into in-scope CDS paths. The DICOM thumbnail pipeline (`lib/viewer/`, `app/api/ins/viewer/`) is explicitly scoped **out** of Non-Device CDS per `docs/SCOPE_BOUNDARY.md` and enforced by `scripts/lint-scope-boundary.ts`, which blocks in-scope routes from importing viewer code.

### 3.2 Criterion 2 — Medical Information

Every shipped CDS card carries a structured `medicalBasis` object referencing a published or regulatory source. `lib/cds-platform/cds-hooks/card-builder.ts` calls `assertMedicalBasis` from `lib/cds-platform/cds-hooks/medical-basis.ts` at build time so cards cannot ship without `label`, `rationale`, `citationId`, `url`, `authorityClass`, and `lastClinicalReviewISO`. The canonical citation registry in `lib/cds-platform/citations/index.ts` currently registers these `citationId` values: `doi:10.1016/j.jacr.2022.02.018`, `acr:duplicate-imaging-90d`, `acr:price-transparency`, `choosing-wisely:imaging-stat`, `hl7:davinci-crd`, `cms:gold-card-medicare-advantage`, `context_dependent`, `arka:context`, `acr:ped-rlq-pain`, `uspstf:lbp-imaging`, `acr:knee-oa`, `acr:sudden-headache`, `acr:head-trauma`, and `acr:contrast-media-manual`. CI card linting in `scripts/lint-cards.ts` [TODO: to be wired in Prompt 11.D] will assert every production card resolves a registered citation. Card copy tone is governed by `docs/CDS_CARD_LANGUAGE_STYLE_GUIDE.md` (v1.0; enforced by `scripts/lint-cards.ts`).

### 3.3 Criterion 3 — HCP Recommendations

ARKA uses a non-blocking CDS Hooks architecture: the HL7 specification provides no order-block primitive, and ARKA does not add a proprietary block layer. `app/api/cds-services/arka-clin-appropriateness-sign/route.ts` documents that critical-tier cards are styling cues only; `lib/cds-platform/cds-hooks/order-sign.ts` emits critical indicators with descriptive override reasons, not workflow coercion. Override dialogs lead with the neutral reason “Clinical judgment based on findings not captured in chart” per `lib/cds-platform/alerting/override-reasons.ts` (`STANDARD_OVERRIDE_REASONS[0]`). Supportive, non-directive phrasing for summaries and detail fields is specified in `docs/CDS_CARD_LANGUAGE_STYLE_GUIDE.md` (v1.0; enforced by `scripts/lint-cards.ts`). For INS order-sign, `lib/davinci/crd.ts` (`buildOrderSignCriticalBlockCard`, ~line 248) implements **Da Vinci CRD payer-adjudication semantics**—documented override paths for denial-risk and DTR completion—not unsolicited CDS coercion; the summary was softened to “DTR completion or documented override needed for adjudication” to reflect payer workflow gating rather than clinical mandate language.

### 3.4 Criterion 4 — Independent Review

Every model feature is catalogued with clinician-facing rationale and citation linkage. `lib/cds-platform/ml/feature-catalog.ts` documents **23 of 23** model features (matching `FEATURE_NAMES` in `feature-engineer.ts`), including **14** `guideline`-class and **9** `context_dependent` entries per `docs/CLINICAL_SIGN_OFF_LOG.md`. The build-time sidecar `lib/cds-platform/ml/feature-catalog.json` is exported via `npm run export:feature-catalog` (`scripts/export-feature-catalog.ts`). `ml-service/model/train.py` refuses to train when `feature-catalog.json` is missing or contains features absent from the catalogue. `ml-service/MODEL_CARD.md` states intended use, training-data provenance, evaluation metrics, fairness monitoring targets, and known limitations. The CDS demo surfaces SHAP rows with rationale and citation links through `components/cds-platform/demo/CdsDemoClient.tsx` → `CdsDemoSidebar.tsx` → `ShapFactorsBlock.tsx`. Pre–Phase-2 baseline gaps for Criterion 4 are recorded in `docs/REGULATORY_BASELINE_AUDIT.md` §4; subsequent phases added the catalogue and demo wiring described above.

---

## 4. Architecture Summary

```
Hook fires
  │
  ▼
[1] Build ClinicalScenario from FHIR prefetch  (Patient, Conditions, Observations, draftOrders)
  │
  ▼
[2] AIIE Rule Engine evaluates the scenario against the rule library
        ├── Each rule references a published guideline (NICE, USPSTF, NCCN, ACP/AAFP, AAOS, AAP, ACEP, Choosing Wisely, ACOG, or other specialty society — never ACR; see Evidence-Source Policy)
        ├── Each rule output is a RuleFinding with: ruleId, medicalBasis, baseTier, baseRationale
        └── Output: RuleFinding[]  (may be empty if no rule matches)
  │
  ▼
[3] If RuleFinding[] is non-empty:
        Build a draft Card per finding using rule.medicalBasis as the card's primary basis
    If RuleFinding[] is empty:
        Return { cards: [] }   ← INTENTIONAL. We do not ML our way into a recommendation
        that has no published guideline backing. Silence is regulatory-safe.
  │
  ▼
[4] (Optional, non-blocking) Call ML service for risk refinement:
        ├── ML returns appropriatenessScore + SHAP feature contributions
        ├── Look up each SHAP feature in feature-catalog.ts
        └── Filter to features that have a catalogue entry; discard the rest
  │
  ▼
[5] For each draft Card, attach the ML score as a "Patient-specific refinement" section,
    NOT as the primary basis:
        ┌─────────────────────────────────────────────┐
        │ {Guideline label}                            │  ← primary basis (Criterion 2 + 4)
        │ {Rationale paragraph + citation link}        │
        │                                              │
        │ ── Patient-specific refinement ──            │  ← secondary, ML-derived
        │ ARKA risk estimate: {score}/9 ({tier})       │
        │ Top contributing factors:                    │
        │   • {feature label}  ({±}{contribution})     │
        │     {feature rationale} [cite]               │
        └─────────────────────────────────────────────┘
  │
  ▼
[6] Append FDA non-device disclosure block; ship.
```

(Source: Phase 0.4, `ARKA_CDS_HOOKS_UNIFIED_PLAYBOOK.md` — Rules-First, ML-as-Confidence.)

The rules engine in `lib/cds-platform/alerting/rules.ts` and tiered alerting (`lib/cds-platform/alerting/tiered-engine.ts`) evaluate the clinical scenario first; when no guideline-anchored rule fires, order-sign returns empty cards (`lib/cds-platform/cds-hooks/order-sign.ts`). When rules fire, ML refines scores and SHAP attributions but does not originate the recommendation—`medicalBasis` on each card remains citation-first. When the Python service is unreachable, `lib/cds-platform/ml/ml-config.ts` and `lib/cds-platform/scoring-fallback.ts` fall back to rules-only scoring; `.env.example` documents `ML_FALLBACK_ENABLED=true` with `ML_FALLBACK_ENABLED_REASON=fda_criterion_4_independent_review` as the intended production posture so clinicians can still review guideline-backed output without relying primarily on the model.

---

## 5. Evidence Appendix

- **`lib/cds-platform/ml/feature-catalog.ts`** — Source-of-truth Feature Rationale Catalogue (23 features, rationale, citationId, sourceResource).
- **`lib/cds-platform/ml/feature-catalog.json`** — Build-exported JSON sidecar consumed by `ml-service/model/train.py` and runtime guards.
- **`lib/cds-platform/citations/index.ts`** — Canonical `citationId` registry for all `medicalBasis` references.
- **`docs/REGULATORY_BASELINE_AUDIT.md`** — Pre–Phase-2 READ-ONLY survey of Criterion 1–4 starting state and artefact gaps.
- **`docs/CLINICAL_SIGN_OFF_LOG.md`** — Append-only clinician sign-off ledger; open TODOs pending licensed review (no signed entries yet).
- **`docs/CDS_CARD_LANGUAGE_STYLE_GUIDE.md`** — Non-coercive CDS copy conventions (v1.0; banned verbs, permitted alternatives, suggestion-label regex; enforced by `scripts/lint-cards.ts`).
- **`docs/PHI_REDACTION.md`** — Decision-log redaction contract (hashed identifiers, age buckets, no raw PHI).
- **`docs/SCOPE_BOUNDARY.md`** — In-scope CDS paths vs out-of-scope DICOM viewer; import-lint enforcement.
- **`docs/CDS_SANDBOX_REGISTRATION.md`** — HL7 sandbox discovery URL and five registered services.
- **`docs/regulatory-evidence/sandbox-screenshots/`** — Sandbox capture artefacts:
  - `ins-coverage-fallback-2026-05-24.png`
  - `ins-coverage-fallback2-2026-05-24.png`
  - `lbp-1-developer-panel-clin-2026-05-24.png`
  - `lbp-1-order-sign-local-demo-2026-05-24.png`
  - `lbp-1-order-sign-local-demo2-2026-05-24.png`
- **`docs/regulatory-evidence/sandbox-loom-url.txt`** — Recorded demo video URL [TODO: file not yet committed].
- **`ml-service/MODEL_CARD.md`** — Model Card (intended use, synthetic training data, metrics, limitations).
- **`logs/sandbox-validation-report-2026-05-24.html`** — Most recent sandbox validation HTML report [TODO: no file under `logs/` at time of memo draft; generate via `npm run test:sandbox`].
- **`scripts/lint-cards.ts`** — CI assertion that every card has valid `medicalBasis` [TODO: to be wired in Prompt 11.D].
- **`scripts/regulatory-checks.ts`** — CI guard against image/signal imports in CDS scope [TODO: to be wired in Prompt 11.E].

---

## 6. Known Limitations and Risks

Training data for the imaging appropriateness XGBoost model is **synthetic** and ACR-aligned scenario logic in `ml-service/model/train.py`, not adjudicated real-world labelled outcomes; retrospective validation against labelled clinical data remains **pending**. The latest held-out synthetic metrics in `ml-service/model/evaluation/metrics.json` report test **RMSE ≈ 1.41**, **3-class accuracy ≈ 73.9%** (74% rounded)—investor-demo grade, not a production clinical-performance claim. Subgroup fairness gaps (age, sex, modality) are defined in `ml-service/MODEL_CARD.md` but require confirmation on validation cohorts via the `/cds-hooks-demo/validation` dashboard. Out-of-distribution scenarios degrade gracefully to rules-plus-citations output (`scoring-fallback.ts`, empty-card paths in `order-sign.ts`) rather than failing closed on ML absence; that degradation must be monitored so clinicians are not left without guidance when rules do fire.

---

## 7. Change Control

Changes to `lib/cds-platform/ml/feature-catalog.ts`, `lib/cds-platform/citations/index.ts`, `lib/cds-platform/alerting/override-reasons.ts`, or any rule library under `lib/cds-platform/alerting/` require a dated entry in `docs/CLINICAL_SIGN_OFF_LOG.md` with clinician reviewer name and status. Changes to `FDA_NON_DEVICE_CDS_DISCLOSURE` or `FDA_DISCLOSURE_VERSION` in `lib/compliance/fda-disclosure.ts` trigger a Phase 11 regulatory copy review and must stay consistent with card footers appended via `appendFdaDetailDisclaimer`. CI enforcers `scripts/lint-cards.ts` and `scripts/regulatory-checks.ts` [TODO: Prompt 11.D / 11.E] are intended to prevent silent regressions on `medicalBasis` and Criterion 1 import boundaries; `scripts/lint-scope-boundary.ts` already runs in `npm run lint:scope`.

---

## 8. Regulatory Engagement Plan

A **Q-Submission (Pre-Sub)** with FDA’s Digital Health Center of Excellence is **planned within six months of general availability**, not yet filed. Proposed discussion topics: confirmation of Non-Device CDS positioning for ARKA-CLIN and ARKA-INS, FDA expectations for change control over the rule library, feature catalogue, and model weights, and whether the current synthetic validation and sandbox evidence package is sufficient for the stated intended use. Pre-Sub question drafts will live under `docs/regulatory/q-sub-draft/` [TODO: directory and drafts not yet created]. This plan is forward-looking; it does not represent FDA feedback or approval.

---

## 9. Contacts and Sign-offs

[TODO: USER FILLS]

- **Engineering lead:** Arri Kanna (arrikanna2447@gmail.com)
- **Clinical lead:** [TODO — pending licensed clinician engagement]
- **Regulatory consultant:** [TODO — pending engagement, see Phase 0.10 of unified playbook]
- **Last review date:** 2026-05-26
- **Signature:** ___________________
