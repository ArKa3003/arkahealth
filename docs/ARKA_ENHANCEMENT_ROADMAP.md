# ARKA Enhancement Roadmap — Cursor Prompt Playbook

**Document owner:** Arri (ARKA founder)
**Target engine:** Cursor (Claude/GPT backend), applied against the `arkahealth` monorepo
**Scope:** Features 1, 2, 3, and 5 from the clinician feedback review (Apr 2026). Feature 4 (cutting-edge simulation algorithm) is specified in a companion document `ARKA_OPTIMA_ALGORITHM.md`.
**Reading order:** Every numbered section below can be copy-pasted directly into Cursor as a single prompt. Prompts are self-contained: file paths, types, FDA-compliance guardrails, and acceptance criteria are included so Cursor's agentic mode finishes with a working diff.
**Repo invariants reaffirmed:** respect `.cursorrules` scope isolation. Do not duplicate `lib/aiie/scoring-engine.ts`. ARKA-INS tables prefixed `ins_`. All user-facing cards end with the FDA Non-Device CDS disclosure sentence. TypeScript strict, no `any`, lib functions return `{ data, error }` tuples, API routes under 800 ms p95.

---

## 0. Executive summary — what we are building and why

The clinician feedback identifies five root causes that cripple real-world radiology workflows:

1. ARKA currently scores *order data*. It does not read *the medical record*, so it cannot detect prior imaging redundancy, nuanced comorbidity, or control-sheet context. It also has only one channel for ingesting studies (two-image X-ray comparisons are fatigue-fragile). There is no radiopedia/reference loop and no interesting-case flagging. Finally, Fiberoptic Endoscopic Evaluation of Swallowing (FEES) and Video Fluoroscopic Swallow Studies (VFSS) are massively over-ordered; ARKA has no dedicated swallow module.
2. ARKA does not yet bridge the coding side of the hospital. Medical coding (ICD-10-CM diagnosis codes, CPT procedure codes, AIS/ISS trauma scores, E/M level, POA flags) contains structured severity information that should *gate* the AIIE appropriateness score. "Patient with ISS=101 minor injury should not get an MRI" is precisely the kind of rule that needs to run **before** clinician distraction.
3. Unstructured imaging data — pixel data, DICOM metadata, report free-text — is currently wasted. The Forbes Tech Council piece (Jan 2024) argues that federated, de-identified pooling can unlock discovery; ARKA is well-positioned to be the governance layer for that.
4. *(Separate document)* Advanced simulation / optimization algorithm — see `ARKA_OPTIMA_ALGORITHM.md`.
5. The three review images identify concrete, named drivers of order inefficiency: unscheduled-order leakage (4.4–8.6 %), inappropriate modality selection (up to 50 % of spinal MRIs inappropriate), 81 % of requisitions with incomplete clinical history, STAT-label misuse, and duplicate ordering. The images also prescribe the *solutions*: real-time order capture, AI-enhanced CDS, STAT standardization, and proactive scheduling follow-up. All four solutions are feasible and are prioritized in this document.

This roadmap delivers every one of those fixes while preserving ARKA's **FDA Non-Device CDS posture under Section 520(o)(1)(E)** and **CMS-0057-F** alignment.

### Delivery phases

| Phase | Weeks | Modules | Regulatory gate |
|-------|-------|---------|-----------------|
| Phase 1 — Ingestion & Record Intelligence | 1–4 | Part A.1 (FHIR Bulk + EHR scraper), A.2 (control sheet), A.5 (interesting-case flag) | Non-Device CDS unchanged |
| Phase 2 — Coding bridge & workflow-capture | 5–8 | Part B.1–B.3 (ICD/CPT/ISS mapper), Part D.1 (real-time order capture), D.2 (STAT guard) | Non-Device CDS unchanged |
| Phase 3 — Fatigue-aware reading & reference | 9–12 | Part A.3 (multi-image fatigue), A.4 (radiopaedia/WebMD retrieval), A.6 (VFSS/FEES module), D.3–D.7 | Non-Device CDS unchanged; image-display features clearly labeled "non-diagnostic reference" |
| Phase 4 — Waste unlock | 13–16 | Part C (imaging data lake, federated learning) | Separate de-identification audit |

### Compliance invariants that every Cursor prompt must enforce

- Every user-visible card/banner ends with the canonical FDA Non-Device CDS sentence from `.cursorrules`.
- No PHI in ARKA-owned tables. Every patient identifier that reaches Supabase is a SHA-256 hash.
- Every feature surfaces the *factors* behind a recommendation (SHAP-style via `AIIEFactor`) so clinicians can override.
- No feature issues a "diagnosis." Language is *prioritization*, *prompt*, *reference*, or *flag*.
- Every API route is wrapped with `withInsApiLogging` and returns within 800 ms p95.

---

## Part A — Medical Record Scraping & Intelligence Layer (Feature 1)

### A.1 — Full EHR record ingestion (not just the order)

**Problem.** `lib/aiie/scoring-engine.ts` receives an `AIIEInput` payload that already assumes structured fields. In production, ordering clinicians have only filled out 19 % of requisition clinical-history fields (the 81 % incomplete finding from the review images). ARKA must *pull* the missing context from the record: problem list, medication list, encounter summary, prior ImagingStudy resources, DiagnosticReport narratives, Observation labs, Allergies, and clinical notes.

**Architecture.** Introduce a `lib/fhir/record-scraper.ts` that uses the Bulk Data Export `$export` operation on Patient/$everything, with a Group-based export for population-level analytics (also used later for Part C). Each resource type is parsed into a typed `PatientRecordSnapshot` and fed into an *augmentation* step that extends `AIIEInput` without mutating it.

**Why not just prefetch more?** CDS Hooks `prefetch` caps at ~5 queries and blocks order-select latency. Bulk export runs asynchronously against a per-patient snapshot cache (30-minute TTL for hot patients in Supabase `ins_record_cache`). This keeps hook latency sub-300 ms while still making a full record available.

**Files to add.**
- `lib/fhir/record-scraper.ts`
- `lib/fhir/record-normalizer.ts`
- `lib/types/record-snapshot.ts`
- `supabase/migrations/020_ins_record_cache.sql`
- `__tests__/fhir/record-scraper.test.ts`

**Files to modify.**
- `lib/aiie/scoring-engine.ts` — import the snapshot and feed augmented factors (do **not** rewrite the scoring math; append-only).
- `lib/types/aiie.ts` — add optional `recordSnapshot?: PatientRecordSnapshot` to `AIIEInput`.

#### Cursor Prompt A.1

```
ROLE
You are working inside the arkahealth Next.js monorepo. Respect .cursorrules.

GOAL
Create a FHIR-record scraper that ingests the *entire* patient record and returns a typed snapshot that augments (never replaces) AIIEInput. Must run asynchronously with a 30-minute Supabase-backed cache so CDS Hooks stay sub-300ms.

CREATE the following new files.

1) lib/types/record-snapshot.ts
Define these exported types (TypeScript strict, JSDoc each):
- PatientRecordSnapshot { patientHash: string; capturedAtIso: string; ttlSeconds: number; problems: ProblemListEntry[]; medications: MedicationEntry[]; allergies: AllergyEntry[]; encounters: EncounterSummary[]; priorImaging: PriorImagingStudy[]; priorReports: PriorDiagnosticReport[]; labs: LabObservation[]; vitals: VitalObservation[]; notes: ClinicalNoteExcerpt[]; codingContext: CodingContext; }
- CodingContext { activeIcd10: string[]; activeCpt: string[]; admissionIcd10?: string; injurySeverityScore?: number; glasgowComaScale?: number; eAndMLevel?: string; poaFlags?: Record<string, "Y"|"N"|"U"|"W">; }
- Every sub-interface fully typed — no `any`, no `unknown`. Date fields are ISO 8601 strings.

2) lib/fhir/record-scraper.ts
Export:
- async function scrapePatientRecord(args: { patientId: string; fhirClient: Client; ttlSeconds?: number; }): Promise<{ data: PatientRecordSnapshot; error: null } | { data: null; error: AIIELibError }>
Implementation notes:
- Use fhir-kit-client (already in deps).
- Kick off $everything for the Patient, plus targeted resourceType searches with _count=200 for: Condition, MedicationStatement|MedicationRequest, AllergyIntolerance, Encounter, ImagingStudy, DiagnosticReport, Observation?category=laboratory, Observation?category=vital-signs, DocumentReference.
- SHA-256 the patientId BEFORE writing to Supabase. Store raw only in memory during the request.
- Cache key = `record:${sha256(patientId)}`. TTL default 1800s.
- Cache storage: ins_record_cache table (see migration below).
- Never throw. Always return { data, error } tuple. AIIELibError already exists in lib/types/aiie.ts.

3) lib/fhir/record-normalizer.ts
Export:
- function normalizeRecord(raw: RawFhirBundle): PatientRecordSnapshot
Duties:
- Map Condition.code -> ICD-10-CM via Condition.code.coding[].system "http://hl7.org/fhir/sid/icd-10-cm".
- Map Encounter.diagnosis[].use.code == "AD" to admissionIcd10 (ADM).
- Pull Observation LOINC codes for ISS (Injury Severity Score, LOINC 75261-1) and GCS total (LOINC 9269-2).
- For DocumentReference, keep only .description, .context.period, and .type.coding — never the binary PHI.
- All free-text is truncated to 2000 chars and passed through a simple PHI scrub (strip 9-digit patterns, 7-digit phone, any 3-2-4 SSN shape, dates->YYYY-only). Utility belongs in lib/fhir/phi-scrub.ts — create it if missing.

4) supabase/migrations/020_ins_record_cache.sql
create table if not exists public.ins_record_cache (
  patient_hash text primary key,
  snapshot jsonb not null,
  captured_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index ins_record_cache_expires_at_idx on public.ins_record_cache(expires_at);
alter table public.ins_record_cache enable row level security;
-- Service role only.
create policy "service role full access ins_record_cache"
  on public.ins_record_cache for all
  using (auth.role() = 'service_role');

5) __tests__/fhir/record-scraper.test.ts
Vitest tests:
- Happy path: mock fhir-kit-client to return a Bundle with 2 Conditions, 1 MedicationRequest, 1 ImagingStudy; assert PatientRecordSnapshot shape.
- Cache hit: second call within TTL returns cached snapshot and does NOT call the FHIR client.
- PHI scrub: raw bundle containing "SSN 123-45-6789" produces a note excerpt where the digits are replaced.
- Empty patient: returns empty arrays, never null.

MODIFY:
- lib/types/aiie.ts — add `recordSnapshot?: PatientRecordSnapshot` to AIIEInput. Import the type.
- lib/aiie/scoring-engine.ts — DO NOT modify scoring weights. Add a new helper computeSnapshotSignal(snapshot?) that only adjusts computeIndicationSignal and computePriorRedundancySignal by reading snapshot.priorImaging and snapshot.problems when present. Keep all original behavior when snapshot is undefined.

ACCEPTANCE
- npm run type-check passes.
- npm run test passes including new tests.
- Lighthouse not impacted (scraper runs via server component / API route only).
- No file under app/clin/**, app/ed/**, components/clin/**, components/ed/** is modified.
- Every new file has JSDoc on every exported symbol.
- Every user-visible surface that reads from this snapshot includes the canonical FDA Non-Device CDS disclosure sentence.
```

---

### A.2 — Prior-Imaging Control Sheet

**Problem.** Clinicians do not want another alert. They want a "control sheet" that, at-a-glance, shows every imaging study the patient has had across institutions, along with the report impression, the ordering indication, and whether the new order would be redundant.

**Design.** A single component `<PriorImagingControlSheet />` rendered in the ARKA-CLIN and ARKA-INS order flows, powered by `recordSnapshot.priorImaging` from A.1 and cross-referenced against the *proposed* order (CPT + anatomic region).

**Redundancy math.** A small deterministic function `lib/aiie/redundancy.ts`:
- Same CPT within 30 days → `severity = "high"`, copy = "Potential duplicate — prior exam on {date}."
- Same anatomic region but different modality within 14 days → `severity = "medium"`.
- Prior normal exam within 90 days and no red flags → `severity = "medium"`.
- Otherwise → `severity = "none"`.

Each outcome yields an AIIE factor contribution that is *added* to the existing `prior_imaging_redundancy` signal (never replacing it — see `.cursorrules`).

#### Cursor Prompt A.2

```
GOAL
Build a Prior-Imaging Control Sheet component and the supporting redundancy calculator. Integrates with the record snapshot from Prompt A.1.

CREATE:
1) lib/aiie/redundancy.ts
Export:
- function evaluateRedundancy(proposed: AIIEOrder, snapshot: PatientRecordSnapshot): RedundancyAssessment
- type RedundancyAssessment = { severity: "high"|"medium"|"low"|"none"; reason: string; priorStudyId?: string; daysSincePrior?: number; sameCpt: boolean; sameRegionDifferentModality: boolean; priorNormalWithoutRedFlags: boolean; suggestedAction: "BLOCK_SOFT"|"DISCUSS"|"PROCEED"; }
Do NOT mutate the existing scoring-engine weights. The assessment is consumed separately.

2) components/shared/PriorImagingControlSheet.tsx
Client component. Props: { snapshot: PatientRecordSnapshot; proposed: AIIEOrder; onOverride: (reason: string) => void; }
Renders:
- Header: "Prior imaging on file" + count + "Last export: {capturedAt}"
- Table with: Date, Modality, Anatomic region, CPT, Indication summary (truncated to 80 chars), Impression tag (normal/abnormal/equivocal — parsed from DiagnosticReport.conclusion), Link icon to open the report in a modal (read-only; PHI stripped).
- Row highlight: red if redundancy.severity==="high", amber if "medium".
- Side panel summarizing RedundancyAssessment with the SuggestedAction as a pill + override textarea (required if clinician proceeds).
- Footer: FDA Non-Device CDS disclosure (import from components/shared/compliance/FDANonDeviceBanner.tsx).

3) components/shared/PriorImagingControlSheet.test.tsx
Vitest + React Testing Library:
- Renders zero-state when priorImaging is empty.
- Highlights rows when redundancy returns "high".
- Calls onOverride with the textarea value when the override button is clicked.

MODIFY:
- components/demos/clin/ClinResultsView.tsx — add the control sheet above the existing results panel when recordSnapshot is available. Guard with feature flag process.env.NEXT_PUBLIC_ARKA_CONTROL_SHEET === "on" defaulting to on in demo.
- components/ins/provider/GoldCardDashboardClient.tsx — surface a read-only mini-version in the provider detail drawer.

STYLING
- Use existing shadcn primitives (Card, Badge, Button) and tailwind tokens arka-bg-light, arka-text-dark-muted. No custom CSS files.

ACCEPTANCE
- Control sheet renders within 50ms of parent mount (verify with performance.mark in demo instrumentation).
- Does not mutate AIIEInput scoring. Prompt A.1 snapshot remains the single source of truth.
- Every row's "impression" tag has a tooltip citing DiagnosticReport.id.
- FDA Non-Device CDS sentence visible at the bottom of the sheet.
```

---

### A.3 — Multi-image, fatigue-aware review for X-ray and other 2-view studies

**Problem from clinician review.** Radiologists fatigue when X-ray reads rely on only 2 standard views. ARKA should compose an *assisted reference* view that pulls prior same-patient exams (same projection), annotates systematic comparison points (cardiac silhouette, costophrenic angles, pulmonary vasculature for a CXR), and offers a structured checklist so the radiologist is not the only safeguard against attentional drift.

**Regulatory framing.** This is **not** a diagnostic tool. Nothing in this module interprets the image. It is a *workflow scaffold* that (a) arranges the pixels on a non-diagnostic viewer and (b) surfaces a checklist. No CAD. Clearly labeled "Reference viewer — non-diagnostic." That keeps us inside the Non-Device CDS perimeter because the clinician still makes the call, the tool does not identify, manage, or screen for a disease, and it surfaces only information the clinician could review independently (21st Century Cures criteria).

**Files to add.**
- `components/shared/ReferenceViewer.tsx`
- `lib/viewer/projection-matcher.ts`
- `lib/viewer/checklists/` — JSON checklists per anatomic region (CXR, KUB, C-spine, L-spine, shoulder, knee).
- `app/api/ins/viewer/image/[studyUid]/route.ts` — proxies DICOM thumbnails with PHI burn-in scrub.

#### Cursor Prompt A.3

```
GOAL
Build a non-diagnostic reference viewer that reduces reader fatigue by systematically juxtaposing the current study against prior studies with matching projections. Must be clearly labeled as non-diagnostic so it remains a Non-Device CDS.

CREATE:
1) lib/viewer/projection-matcher.ts
Export:
- function matchProjections(current: PriorImagingStudy, all: PriorImagingStudy[]): ProjectionMatch[]
- type ProjectionMatch = { priorStudyId: string; priorDate: string; modality: string; view: string; similarityScore: number; // 0..1 pixel metadata similarity based on (modality, bodyPart, view code, laterality); rationale: string; }
Rank by similarityScore desc; only return matches with score >= 0.6.

2) lib/viewer/checklists/cxr.ts and peers
- Each exports a typed Checklist = { region: string; items: { id: string; label: string; anchor: string; rationale: string; }[] }
- CXR example items: cardiac silhouette, mediastinum width, costophrenic angles, pulmonary vasculature, osseous structures, hidden areas (apices/behind heart), lines/tubes, comparison to prior.
- Evidence anchors cite ACR manual on chest plain film interpretation (cite by reference key, no URL).

3) components/shared/ReferenceViewer.tsx
Props: { currentStudy: PriorImagingStudy; allStudies: PriorImagingStudy[]; checklist: Checklist; }
UI:
- Two-pane layout. Left: current study thumbnails (via proxied /api/ins/viewer/image). Right: best-matched prior alongside it. Below each pane, a toggle "Show side-by-side" vs "Show overlay (difference shade)".
- Non-diagnostic banner pinned top: "Reference viewer — not for diagnostic interpretation. Pixel data may be compressed; use your certified PACS viewer for diagnosis."
- Checklist rail on the right with checkmarks; state stored in zustand.
- Accessibility: keyboard shortcuts 1..9 to toggle checklist items; aria-live region announces match count.

4) app/api/ins/viewer/image/[studyUid]/route.ts
- GET handler. Uses the FHIR client to fetch Binary or WADO-RS reference.
- Downsamples to 1024px max dim, strips DICOM tags that commonly burn PHI (PatientName, PatientID, 0010,xxxx), converts to WebP.
- Wraps withInsApiLogging. Returns 404 when study not in recordSnapshot.

ACCEPTANCE
- No pixel data is interpreted by the app; the viewer is presentational only.
- Banner text is visible on every rendered frame.
- API p95 under 800 ms with a warm cache.
- PHI scrubbing unit-tested with a fake DICOM that carries PatientName=ARRI KANNA — the response bundle must not contain that string.
```

---

### A.4 — Radiopaedia + WebMD evidence retrieval (RAG layer)

**Problem.** Clinicians want contextual education at the point of ordering — "Why is my MRI being soft-blocked for uncomplicated LBP? What does Radiopaedia say about alternatives?" The current AIIE factors only cite guideline names. Embed a retrieval-augmented reference widget.

**Technical.** A RAG service that performs authenticated fetches against Radiopaedia's API (public REST) and a curated WebMD corpus. Results are cached in Supabase for 30 days per (CPT, anatomic region, chief complaint hash). The widget never fetches live from within the CDS hook — only from a background worker feeding the cache — so hook latency is untouched.

**Governance.** All retrieved content is tagged with source + license. ARKA surfaces the title, 300-word excerpt, and a deep link; the full content is never republished. A nightly job re-verifies licensing.

**Files to add.**
- `lib/retrieval/radiopaedia-client.ts`
- `lib/retrieval/webmd-client.ts`
- `lib/retrieval/vector-index.ts` (pgvector via Supabase)
- `supabase/migrations/021_ins_reference_cache.sql`
- `components/shared/ReferenceEvidenceDrawer.tsx`
- `scripts/refresh-reference-cache.ts`

#### Cursor Prompt A.4

```
GOAL
Add a cached retrieval layer that surfaces Radiopaedia articles and curated WebMD consumer-facing explanations alongside AIIE factors. Never slows the CDS hook. Respects source licensing.

CREATE:
1) lib/retrieval/radiopaedia-client.ts
- export async function searchRadiopaedia(query: string): Promise<{ data: RadiopaediaHit[]; error: null } | { data: null; error: AIIELibError }>
- type RadiopaediaHit = { id: string; title: string; excerpt: string; url: string; tags: string[]; licensing: "CC-BY-NC-SA-3.0"; fetchedAt: string; }
- Use the public https://radiopaedia.org/api/v1/articles?query= endpoint. Respect rate limiting (1 req / 3 s). If 429, return error with code="upstream_rate_limited".

2) lib/retrieval/webmd-client.ts
- Similar shape but against a CURATED corpus stored in Supabase (table ins_reference_webmd_corpus — admin-uploaded JSON). Do NOT scrape WebMD directly.

3) lib/retrieval/vector-index.ts
- Wraps pgvector embeddings (use Supabase's vector column). 
- export async function embedAndStore(doc: ReferenceDoc): Promise<void>
- export async function queryTopK(query: string, k: number): Promise<ReferenceDoc[]>
- Embedding model: stub with a deterministic hash-based 384-dim vector unless process.env.ARKA_EMBEDDINGS_PROVIDER === "openai", in which case call text-embedding-3-small.

4) supabase/migrations/021_ins_reference_cache.sql
create extension if not exists vector;
create table if not exists public.ins_reference_cache (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('radiopaedia','webmd')),
  title text not null,
  excerpt text not null,
  url text not null,
  tags text[] not null default '{}',
  licensing text not null,
  embedding vector(384),
  fetched_at timestamptz not null default now()
);
create index ins_reference_cache_embedding_idx on public.ins_reference_cache using ivfflat (embedding vector_cosine_ops) with (lists = 100);

5) components/shared/ReferenceEvidenceDrawer.tsx
Props: { cpt?: string; bodyPart?: string; complaint: string; }
- On mount, calls a NEW route /api/ins/reference/lookup (create it at app/api/ins/reference/lookup/route.ts) that calls queryTopK on a composed query.
- Shows up to 5 results: title, 300-word excerpt (hard-truncated server-side), source badge, deep-link.
- Never blocks UI if empty — skeleton for 500 ms then "No reference content on file for this combination".

6) scripts/refresh-reference-cache.ts
- CLI script run nightly by a cron (vercel.json). Pulls top 200 CPT+region combinations from ins_validation_events and re-runs searchRadiopaedia + embedAndStore.

ACCEPTANCE
- Widget never fetches upstream synchronously during a CDS hook.
- License strings surfaced on every hit.
- Rate-limiter verified in tests.
- When cache is cold, UI degrades gracefully.
```

---

### A.5 — Extraordinary / interesting case flagger

**Problem.** Part of clinician education and quality assurance is the "interesting case." ARKA should detect unusual combinations (rare presentation + rare imaging finding + rare comorbidity) and flag them for (a) resident teaching queue, (b) quality committee review, (c) potential publication / case report pipeline.

**Mechanism.** An anomaly detector over the patient's snapshot:

```
rarityScore = α·Rrarity(icd10_combo) + β·Rrarity(cpt_combo) + γ·Rrarity(age+sex+region) + δ·Rrarity(redFlag_combo)
```

Where `Rrarity(x) = -log2(Pr(x))` from a rolling frequency table built from the past 12 months of validation events. Top decile → "candidate interesting case" card.

**UX.** Surfaced post-read as a "This case may be publishable / educational" badge on the provider dashboard. Opt-in; clinician marks it as "interesting" and it lands in a review queue with full de-identification.

#### Cursor Prompt A.5

```
GOAL
Add an "interesting case" flagger that identifies rare clinical+imaging combinations from the validation event log. Surfaces in the provider dashboard. No PHI in the queue.

CREATE:
1) lib/aiie/interesting-case.ts
Export:
- async function computeRarityScore(snapshot: PatientRecordSnapshot, order: AIIEOrder): Promise<RarityAssessment>
- type RarityAssessment = { rarityScore: number; percentile: number; drivers: { dimension: "icd10_combo"|"cpt_combo"|"age_sex_region"|"redflag_combo"; contribution: number; examples?: string[] }[]; interesting: boolean; reasoning: string; }
- Uses a materialized view (create migration 022) that aggregates counts from ins_validation_events over the past 365 days.
- interesting = percentile >= 0.9.
- Never sees PHI.

2) supabase/migrations/022_ins_rarity_index.sql
create materialized view ins_rarity_index as
select
  icd10_combo, cpt_combo, age_bucket, sex, region_bucket,
  count(*) as occurrences,
  now() as computed_at
from ins_validation_events
where created_at >= now() - interval '365 days'
group by 1,2,3,4,5;
create index on ins_rarity_index (icd10_combo, cpt_combo);
-- Scheduled REFRESH via pg_cron nightly.

3) components/ins/provider/InterestingCaseBadge.tsx
Small badge. Props: { rarity: RarityAssessment; onMarkInteresting: () => void; }
- Tooltip explains the drivers (translated to plain English: "Rare combination: [ICD X] + [CPT Y] observed 3 times in 365 days out of 42,110 orders").
- Button "Add to teaching queue" hashes the patient and logs to ins_teaching_queue.

4) supabase/migrations/023_ins_teaching_queue.sql
create table public.ins_teaching_queue (
  id uuid primary key default gen_random_uuid(),
  patient_hash text not null,
  rarity_score numeric not null,
  drivers jsonb not null,
  snapshot_redacted jsonb not null,
  added_by_hash text not null,
  created_at timestamptz default now()
);
-- RLS: only service role plus users with role "education_committee" can read.

MODIFY:
- components/ins/provider/GoldCardDashboardClient.tsx — render <InterestingCaseBadge /> when AIIE score response includes rarity.

ACCEPTANCE
- No PHI leaves the request context — teaching queue stores only hashed IDs and redacted snapshot (strip name, MRN, DOB, contact, addresses).
- Rarity index refresh takes < 10 s on a 100k-row dataset (verify with a seed script).
- Badge only appears when interesting===true.
```

---

### A.6 — VFSS (Video Fluoroscopic Swallow Study) & FEES over-ordering guard

**Problem from clinician review.** VFSS and FEES are over-ordered. FEES can often be done bedside at far lower cost and radiation exposure, yet providers default to VFSS. ARKA needs a specific sub-module that (a) scores swallow orders against condition-appropriate triage criteria, (b) proposes FEES-at-bedside when appropriate, (c) captures "ordered despite bedside option" so quality committees can trend it.

**Triage logic (first-pass, transparent, rule-based — stays Non-Device CDS).**

| Factor | Rule |
|--------|------|
| Stroke with aspiration concern | FEES bedside first unless posterior fossa involvement |
| Post-extubation | Bedside evaluation by SLP ± FEES first |
| Progressive neuromuscular disease (ALS, PD) | VFSS appropriate for compensatory strategy trial |
| Esophageal phase concern / dysphagia with reflux | VFSS appropriate |
| Head & neck cancer post-treatment | VFSS appropriate |
| No red flags | Recommend clinical bedside swallow eval |

#### Cursor Prompt A.6

```
GOAL
Add a dedicated swallow-study triage module (VFSS vs FEES vs bedside clinical eval). Must flag likely over-ordered VFSS and record clinician override rationale for quality trend lines.

CREATE:
1) lib/aiie/swallow-triage.ts
Export:
- function triageSwallow(input: { snapshot: PatientRecordSnapshot; order: AIIEOrder; complaint: string; }): SwallowTriageAssessment
- type SwallowTriageAssessment = { proposed: "VFSS"|"FEES"|"bedside_sle"|"unknown"; recommendation: "VFSS"|"FEES"|"bedside_sle"; rationale: string; supportingFactors: AIIEFactor[]; disagreesWithProposed: boolean; }
Rules: implement the table above; cite ASHA + ACR guidelines in evidenceCitation fields.

2) components/demos/clin/SwallowTriageCard.tsx
Card that renders when order.procedure matches /video\s*swallow|modified\s*barium|FEES|fiberoptic\s*endoscopic\s*evaluation/i.
- Shows proposed vs recommended with a 1-click "Use FEES bedside instead" swap.
- Override textarea required if clinician keeps VFSS when FEES was recommended.

3) supabase/migrations/024_ins_swallow_overrides.sql
create table public.ins_swallow_overrides (
  id uuid primary key default gen_random_uuid(),
  patient_hash text not null,
  proposed text not null,
  recommended text not null,
  clinician_choice text not null,
  override_reason text,
  created_at timestamptz default now()
);

MODIFY:
- lib/aiie/scoring-engine.ts — DO NOT change weights; just call triageSwallow from scoreOrder and append the resulting factors if proposed is swallow-related. Keep back-compat: if scoreOrder is called without snapshot, behave exactly as today.

ACCEPTANCE
- Rule set is documented in a top-of-file JSDoc block with citations.
- Card never appears outside swallow orders.
- Override logging never contains PHI.
- `npm run test` includes 6 unit tests (one per rule row).
```

---

## Part B — Hospital Medical-Coding Integration (Feature 2)

### B.1 — ICD-10/CPT-aware appropriateness modifiers

**Problem.** ARKA's current scoring is symptom-centric. Real hospital workflows already have the definitive codes (ICD-10-CM for the working diagnosis, CPT for the requested procedure). These codes *dominate* medical-necessity policy language from payers. ARKA must ingest them, run the scoring engine with coding-aware signals, and emit a **Medical Necessity Alignment Index (MNAI)** that maps 1-to-1 onto the most common commercial payer policy engines.

**Mapping approach.**
- Maintain a curated `lib/coding/icd-cpt-pairs.json` file of high-confidence pairs (e.g., ICD-10 M54.5 "Low back pain, unspecified" + CPT 72148 "MRI lumbar spine without contrast" → medical-necessity state depending on modifier flags: conservative care tried? red flags? days since onset?).
- Fallback to a neutral state when the pair is not curated; ARKA does not fabricate a determination.
- This is **evidence retrieval** plus **determinate rule matching** — both within the Non-Device CDS perimeter under 21st Century Cures (information that the clinician can review and verify).

#### Cursor Prompt B.1

```
GOAL
Add ICD-10 + CPT alignment to AIIE factors. Build a curated pair table and expose a Medical Necessity Alignment Index (MNAI) that mirrors payer-policy language. Strictly non-autonomous.

CREATE:
1) lib/coding/icd-cpt-pairs.json
Seed structure:
[
  {
    "icd10": "M54.5",
    "cpt": "72148",
    "defaultAlignment": "requires_qualifiers",
    "requiredQualifiers": ["conservative_management_tried","duration_ge_6_weeks","absence_of_red_flags_negates"],
    "redFlagOverrides": ["neurological_deficit","bladder_bowel_dysfunction","cancer_history","ivdu","progressive_weakness"],
    "policyReferences": [
      { "source": "ACR Appropriateness Criteria — Low Back Pain", "strength": "usually_appropriate_with_red_flags" },
      { "source": "AIM Specialty Health policy (public summary)", "strength": "requires_6wk_conservative_care" }
    ]
  }
  // Add 25 more pairs covering: headache+CT head (R51, 70450), abdominal pain+CT abdomen/pelvis, knee pain+MRI knee, shoulder pain+MRI shoulder, chronic sinusitis+CT sinus, chest pain+CTA chest, PE workup+CTPA, rule-out stroke+CT head / MRA neck, extremity trauma+X-ray, pediatric abdominal pain+US vs CT.
]

2) lib/coding/mnai.ts
Export:
- function computeMNAI(input: { icd10: string[]; cpt: string; snapshot: PatientRecordSnapshot; aiie: AIIEScore; }): MNAIResult
- type MNAIResult = { index: number; // 0..100; tier: "green"|"amber"|"red"; qualifierStatus: Record<string, "met"|"unmet"|"unknown">; policyReferences: PolicyRef[]; narrative: string; }
- Deterministic: given identical inputs, identical output.

3) supabase/migrations/025_ins_mnai_events.sql
create table public.ins_mnai_events (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null,
  icd10 text[] not null,
  cpt text not null,
  index smallint not null,
  tier text not null,
  qualifier_status jsonb not null,
  created_at timestamptz default now()
);

MODIFY:
- lib/aiie/scoring-engine.ts — when input.recordSnapshot is present, call computeMNAI and attach the result to a NEW optional field mnai on AIIEScore. Do not alter clinicalScore numerics — just enrich.
- components/ins/AIIEEvidenceModal.tsx — add a "Medical-Necessity Alignment" tab that shows the MNAI tier + qualifier checklist.

ACCEPTANCE
- 26 curated pairs seeded.
- MNAI is deterministic (snapshot tests).
- Every policy reference string includes a `strength` field that maps to ACR's Usually/May be/Usually Not.
- FDA Non-Device CDS disclosure visible in the new modal tab.
```

---

### B.2 — Trauma severity & clinical scoring gate (ISS, AIS, GCS, REMS)

**Problem.** Example from clinician review: ISS-like code 101 is a minor injury; the AIIE should not be neutral to that — it should dampen the appropriateness of advanced imaging unless there is a red flag. Similarly GCS < 13 should elevate CT head appropriateness even when no documented complaint exists.

**Scoring gate.**
- Abbreviated Injury Scale (AIS) per body region, Injury Severity Score (ISS = sum of squares of three highest AIS), Glasgow Coma Scale (GCS), Revised Trauma Score (RTS), Revised Emergency Medicine Score (REMS).
- These are not diagnostic; they are *structured measurements* already present in the EHR. ARKA reads them and translates to AIIE factors.

#### Cursor Prompt B.2

```
GOAL
Add a trauma-severity gate to AIIE. Must parse AIS / ISS / GCS / RTS / REMS from the snapshot and either dampen or amplify appropriateness factors accordingly. Keep the existing factor weights.

CREATE:
1) lib/aiie/trauma-gate.ts
Export:
- function traumaGate(snapshot: PatientRecordSnapshot, order: AIIEOrder): TraumaGateResult
- type TraumaGateResult = { iss?: number; ais?: Record<string, number>; gcs?: number; rts?: number; rems?: number; severityTier: "minor"|"moderate"|"severe"|"critical"|"unknown"; gateSignal: number; // range -0.8..+0.8; narrative: string; }
Rules:
  - ISS <= 8 or single-region AIS <= 1 → minor → advanced CT/MRI for extremity complaints gets gateSignal = -0.4 unless any red flag from AIIERedFlags is set.
  - ISS 9..15 → moderate → gateSignal = 0.
  - ISS 16..24 → severe → gateSignal = +0.4 for whole-body CT.
  - ISS >= 25 → critical → gateSignal = +0.7 for whole-body CT and CT head.
  - GCS <= 13 → gateSignal += 0.3 for CT head regardless of ISS.
  - REMS is a modifier only (clamp final gateSignal to [-0.8, +0.8]).

2) Modify lib/aiie/scoring-engine.ts
- In scoreOrder, if snapshot present:
  - compute traumaGate; add as a SEVENTH factor id="trauma_severity", weight=0.1, contribution = 0.1*gateSignal*DELTA_SCALE.
  - Rescale all other factor weights by (1 - 0.1) when snapshot is present, so the total weight stays ~1.0. Use a helper rescaleFactors(factors, reserved) in the same file. Do NOT change public exports' signatures.

3) __tests__/aiie/trauma-gate.test.ts
- ISS=4 with MRI knee order → gateSignal negative, no red flags.
- ISS=20 polytrauma with CT chest/abdomen/pelvis order → gateSignal positive.
- GCS=9 isolated → CT head gateSignal >= 0.3.

ACCEPTANCE
- Back-compat: when snapshot is undefined, scoreOrder output identical to today (snapshot tests).
- Factor sum stays within the bounded range so clinicalScore still lives in 1..9.
- Every new rule cites a clinical source in comments (AAST guidance for ISS, ACR head trauma criteria for GCS).
```

---

### B.3 — Coding-to-AIIE event sink & audit trail

**Problem.** Coders and compliance need to see which codes drove which AIIE decisions. Build a clean event sink.

#### Cursor Prompt B.3

```
GOAL
Emit a structured event for every AIIE scoring call that traces the ICD-10 / CPT / AIS / ISS / GCS inputs to the final MNAI tier and clinicalScore. Used by coding and QI teams. De-identified.

CREATE:
1) supabase/migrations/026_ins_aiie_audit.sql
create table public.ins_aiie_audit (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null,
  patient_hash text not null,
  icd10 text[] not null default '{}',
  cpt text,
  iss smallint,
  gcs smallint,
  mnai_index smallint,
  mnai_tier text,
  clinical_score smallint,
  denial_risk smallint,
  factor_payload jsonb not null,
  created_at timestamptz default now()
);
create index on public.ins_aiie_audit (created_at desc);

2) lib/server/aiie-audit-logger.ts
Export:
- async function logAiieAudit(event: AiieAuditEvent): Promise<void>
- Never throws; logs failures to console.warn.

MODIFY:
- app/api/cds-services/arka-ins-coverage/route.ts and app/api/cds-services/arka-ins-final-check/route.ts — after scoring, call logAiieAudit. Keep p95 under 800 ms by making the call fire-and-forget (use Promise.allSettled and return early when the response is ready).

ACCEPTANCE
- No PHI in audit payload (run a PHI-scrub check in the logger).
- Insertion failure does not fail the CDS response.
- `/api/ins/validation/metrics` gains a new series `mnai_green_rate` computed from this table.
```

---

## Part C — Medical Imaging Waste Unlock (Feature 3)

The Forbes Tech Council article argues that vast volumes of medical imaging data sit dormant. The unlock path is federated, de-identified pooling, so models and analytics can be trained while PHI stays at the source. ARKA is positioned to be the governance layer.

### C.1 — De-identified imaging metadata lake

Not the pixels themselves (that raises PHI and licensing complexity). Start with *metadata + report text* — the lowest-risk, highest-utility asset.

#### Cursor Prompt C.1

```
GOAL
Create a de-identified imaging-study metadata lake under ARKA governance. Starts with metadata and report conclusions, not pixels. Uses Supabase; schema is federation-friendly.

CREATE:
1) supabase/migrations/030_ins_imaging_datalake.sql
create schema if not exists arka_lake;
create table arka_lake.imaging_orders (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null,
  order_hash text not null,
  patient_hash text not null,
  age_bucket text not null,   -- '0-4','5-17','18-44','45-64','65-84','85+'
  sex text not null,
  icd10 text[] not null default '{}',
  cpt text,
  modality text,
  body_part text,
  appropriateness smallint,
  denial_risk smallint,
  prior_imaging_within_30d boolean,
  trauma_severity text,
  mnai_tier text,
  report_conclusion_redacted text,
  created_at timestamptz default now()
);
create index on arka_lake.imaging_orders (institution_id, created_at desc);
create index on arka_lake.imaging_orders (cpt, created_at desc);
-- RLS: institution_id column enforced per-role so cross-institution analytics only use rolled-up views.

2) arka_lake.institution_benchmarks  (materialized view, nightly refresh)
- % appropriate by CPT, % green MNAI, % duplicate orders, average IS score.

3) lib/lake/ingest.ts
Export async function ingestImagingOrder(event: AiieAuditEvent, institutionId: string): Promise<void>. Hash the patient_hash again with per-institution salt. Run the PHI scrub on report_conclusion_redacted using lib/fhir/phi-scrub.ts.

MODIFY:
- lib/server/aiie-audit-logger.ts — after audit insert, fire-and-forget ingestImagingOrder.

ACCEPTANCE
- Re-hashing prevents cross-institution patient re-identification.
- Redaction test: a conclusion containing a DOB pattern is stored with YYYY-only.
- Benchmarks view returns rows within 500 ms on a 1M-row dataset (verify with seed).
```

### C.2 — Federated-learning scaffolding

Actual federated learning with pixel data is a separate regulatory track. We scaffold it now so the governance primitives exist.

#### Cursor Prompt C.2

```
GOAL
Scaffold a federated-analytics gateway that lets a coordinator pose aggregate queries across institutions without ever seeing row-level data. Use additive secret-sharing for numeric aggregates and differential privacy for counts.

CREATE:
1) lib/federated/query-gateway.ts
Export:
- async function askFederatedQuery(q: FederatedQuery): Promise<FederatedResult>
- type FederatedQuery = { kind: "mean"|"count"|"rate"; column: string; filter?: FederatedFilter; epsilon: number; }
- type FederatedResult = { value: number; noiseStdDev: number; institutions: number; // count only; }
- For counts/rates, add Laplace noise scaled to 1/epsilon.
- For means, use secure aggregation across institution proxies (stubbed — HTTP POST to each institution's /api/federated/agg endpoint with additively-masked values).

2) app/api/federated/agg/route.ts
POST handler that receives the masked share and returns an aggregate. Gate behind a signed JWT issued to the institution. Never returns row-level data.

3) docs/FEDERATED_PRIVACY.md
A short (1-page) governance document:
- Threat model: honest-but-curious coordinator.
- Epsilon budget policy: max 5 per CPT per week.
- Auditability: every query stored in arka_lake.federated_query_log.

ACCEPTANCE
- Simulated 3-institution test: ask for mean(appropriateness) per CPT, verify the federated result is within noise of the ground truth.
- Epsilon ledger enforced; exceeding the budget returns 429.
```

### C.3 — Incidental findings feedback loop

**Problem.** Incidental findings are a long tail of value (and liability). ARKA should detect when a prior DiagnosticReport has an *incidental* finding that has never been followed up on, and surface it.

#### Cursor Prompt C.3

```
GOAL
Detect untracked incidental findings in the patient's report history and surface a "follow-up recommended" card on subsequent encounters.

CREATE:
1) lib/aiie/incidentals.ts
Export:
- function detectIncidentals(snapshot: PatientRecordSnapshot): IncidentalFinding[]
- type IncidentalFinding = { priorReportId: string; date: string; text: string; category: "pulmonary_nodule"|"adrenal_mass"|"renal_cyst"|"thyroid_nodule"|"liver_lesion"|"other"; followupRecommended: string; daysOverdue: number; citation: string; }
- Parse DiagnosticReport.conclusion via a tuned regex + keyword set (NOT an LLM — keep deterministic for FDA). Follow ACR White Paper categories.

2) components/shared/IncidentalFollowupCard.tsx
- One card per finding. "Prior report from {date} mentioned {category}; Fleischner-style follow-up recommended at 6 months — {daysOverdue} days overdue."
- Dismiss / schedule buttons.

MODIFY:
- components/demos/clin/ClinResultsView.tsx — when snapshot present, render IncidentalFollowupCard list above the order decision.

ACCEPTANCE
- Determinism test: same snapshot yields same findings.
- No new finding generated from LLM inference.
- FDA Non-Device CDS disclosure visible.
```

---

## Part D — Order Inefficiency fixes from the three clinician-review images (Feature 5)

The three images identified these drivers: unscheduled order leakage (4.4–8.6 %), inappropriate imaging (up to 50 % of spinal MRIs inappropriate), 81 % incomplete requisitions, STAT misuse, duplicate ordering. Causes: poor CDS integration, defensive medicine, workflow fragmentation, documentation errors. Consequences: diagnostic delays, $12 B/year waste plus greenhouse emissions, staff burnout. Solutions proposed: real-time order capture, AI-enhanced CDS, STAT standardization, proactive scheduling. Every solution is feasible and is implemented below.

### D.1 — Real-time Order Capture (solves unscheduled-order leakage)

**Problem.** Orders that leave the encounter without being scheduled become "leakage." A patient is told "you'll get a call to schedule" and then nothing happens. The image's recommended solution: capture the order into an active scheduling flow immediately.

**Design.** The CDS `order-select` hook already fires when the clinician selects an imaging order. On commit (clinician proceeds past the AIIE card), ARKA creates an `ins_scheduling_intent` row with a 72-hour SLA. A reconciliation worker polls FHIR Appointment resources and flips status to "scheduled." Anything still in `pending` at SLA expiry fires an alert into the ARKA-INS dashboard for the scheduling team.

#### Cursor Prompt D.1

```
GOAL
Capture every new imaging order into a scheduling-intent queue with a 72h SLA. Reconcile against FHIR Appointment resources. Escalate on SLA breach. No PHI in the queue.

CREATE:
1) supabase/migrations/031_ins_scheduling_intent.sql
create type public.scheduling_status as enum ('pending','in_progress','scheduled','cancelled','sla_breached');
create table public.ins_scheduling_intent (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null unique,
  patient_hash text not null,
  created_at timestamptz default now(),
  sla_expires_at timestamptz not null,
  status scheduling_status not null default 'pending',
  cpt text,
  modality text,
  body_part text,
  scheduled_appointment_hash text,
  updated_at timestamptz default now()
);
create index on public.ins_scheduling_intent (status, sla_expires_at);

2) lib/ins/scheduling-intent.ts
Export:
- async function captureIntent(event: AiieAuditEvent): Promise<void>
- async function reconcileIntents(): Promise<{ scheduled: number; breached: number; stillPending: number }>
- async function markBreached(intentId: string): Promise<void>

3) app/api/cds-services/arka-ins-final-check/route.ts (MODIFY)
After final-check returns, fire-and-forget captureIntent for the order.

4) app/api/ins/scheduling/reconcile/route.ts
POST handler, gated to service role, runs reconcileIntents() and returns the counts. Wire to Vercel Cron every 5 minutes (vercel.json).

5) components/ins/provider/SchedulingIntentBanner.tsx
Dashboard widget showing pending count, % SLA-on-track, breach list (order-hash + CPT, no PHI).

6) __tests__/ins/scheduling-intent.test.ts
- captureIntent writes exactly one row per order_hash (idempotent).
- reconcileIntents flips status when a FHIR Appointment with matching service exists.
- SLA expiry marks breached and emits a SchedulingIntentBreach validation event.

ACCEPTANCE
- No PHI in ins_scheduling_intent.
- Reconciliation is idempotent.
- Dashboard widget shows real-time breaches.
```

---

### D.2 — STAT label misuse guard

**Problem.** "STAT" is used as a queue-jumping tool. True STAT belongs only to genuinely emergent cases. The images' recommended solution: implement strict definitions for STAT.

**Design.** ARKA adds a STAT gate to the order-select hook. The gate requires one of the following criteria to be met; otherwise STAT is converted to "Urgent" (next 4 hours) automatically, with a card explaining why:

- GCS ≤ 13
- Suspected stroke (complaint matches NIHSS-aligned lexicon)
- Suspected PE with hemodynamic instability
- Suspected aortic dissection
- Trauma with ISS ≥ 16 or hemodynamic instability
- Pediatric with fever + unstable vitals
- Explicit clinician-entered override with mandatory free-text justification

#### Cursor Prompt D.2

```
GOAL
Enforce a strict STAT label policy at order entry. Auto-convert non-qualifying STAT to "Urgent" with a card. Require override reason for clinician keeps.

CREATE:
1) lib/aiie/stat-gate.ts
Export:
- function evaluateStat(input: { snapshot: PatientRecordSnapshot; order: AIIEOrder; complaint: string; priority: "routine"|"urgent"|"stat"; }): StatGateResult
- type StatGateResult = { meetsCriteria: boolean; matchedCriteria: string[]; recommendedPriority: "routine"|"urgent"|"stat"; rationale: string; }

2) app/api/cds-services/arka-ins-coverage/route.ts (MODIFY)
When priority==="stat" and meetsCriteria===false:
- Emit a CDS card (lib/cards/ — create lib/cards/stat-reclass-card.ts):
  - indicator "warning"
  - summary "STAT label may not be warranted — suggested priority: Urgent"
  - detail lists matched/missing criteria + the canonical FDA Non-Device CDS disclosure sentence
  - suggestions: a single card suggestion that sets ServiceRequest.priority = "urgent"
  - override: overrideReasons = ["time_sensitive_clinical_judgment","patient_logistics","other"]

3) supabase/migrations/032_ins_stat_events.sql
create table public.ins_stat_events (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null,
  priority_requested text not null,
  priority_recommended text not null,
  meets_criteria boolean not null,
  matched_criteria text[],
  override_reason text,
  clinician_hash text,
  created_at timestamptz default now()
);

ACCEPTANCE
- No STAT order is silently reclassified — every change accompanied by a card.
- Legitimate STAT (ISS ≥ 16, GCS ≤ 13, or stroke complaint) passes untouched.
- Override reason captured when clinician dismisses the reclass card.
- FDA Non-Device CDS disclosure present in every card detail.
```

---

### D.3 — Duplicate-order detector (soft-block)

**Problem.** Duplicate orders happen when patients transfer or when clinicians order multiple modalities hoping for a quick answer. The redundancy engine in A.2 already has the math. D.3 wires it to a CDS card with a soft-block.

#### Cursor Prompt D.3

```
GOAL
Wire the RedundancyAssessment from Prompt A.2 into a soft-blocking CDS card during order-select. Clinician can proceed but must enter an override reason.

CREATE:
1) lib/cards/duplicate-order-card.ts
Export:
- function buildDuplicateOrderCard(assessment: RedundancyAssessment): CdsCard
- Severity: "warning" for medium, "critical" for high. Include the prior study id, days since prior, recommended action.

MODIFY:
- app/api/cds-services/arka-ins-coverage/route.ts — after evaluateRedundancy, if severity in {high, medium}, append buildDuplicateOrderCard to the response cards array.
- lib/cards/card-shared.ts — ensure the FDA Non-Device CDS disclosure is appended in all new cards via the existing shared helper.

ACCEPTANCE
- Card fires only when there is a matching prior study.
- Override free-text is required when severity==="high"; optional for "medium".
- Integration test hits the CDS endpoint with a mock prefetch containing a prior study within 30 days and asserts the card is present.
```

---

### D.4 — Incomplete-requisition auto-completion

**Problem.** 81 % of requisitions are incomplete. The image's solution: AI-enhanced CDS that fills in the gaps. Do it safely — the tool *proposes*, the clinician *confirms*.

**Design.** When `scoreOrder` sees that critical `AIIEClinicalFactors` are missing (no duration, no conservative-care status, no structured symptoms), ARKA consults the `recordSnapshot` to propose fill-ins from the problem list and recent encounter notes (regex + keyword matching, NOT an LLM classifier — to stay Non-Device CDS). The clinician sees the proposed fields highlighted; they must click "Confirm" to apply.

#### Cursor Prompt D.4

```
GOAL
When an order is submitted with missing clinical history, propose deterministic fill-ins from the record snapshot and require clinician confirmation. Nothing is auto-applied to the ServiceRequest until the clinician confirms.

CREATE:
1) lib/aiie/requisition-autofill.ts
Export:
- function proposeAutofill(input: { snapshot: PatientRecordSnapshot; order: AIIEOrder; existing: AIIEClinicalFactors; }): AutofillProposal
- type AutofillProposal = { fields: { path: string; value: string; source: "problem_list"|"encounter_note"|"medication_list"|"observation"; confidence: "high"|"medium"|"low"; citation: string; }[]; }
- Deterministic rules only (no LLM).

2) components/demos/clin/RequisitionAutofillCard.tsx
Card with per-field "Confirm" and "Reject". Confirmed values are merged into AIIEInput and the score is recomputed locally.

MODIFY:
- components/demos/clin/ClinicalScenarioForm.tsx — render <RequisitionAutofillCard /> above the submit button when proposeAutofill returns a non-empty list.

ACCEPTANCE
- No field is silently populated.
- Each proposal cites the snapshot object it came from.
- Test: snapshot with "chronic low back pain" in problems + order for MRI lumbar → autofill duration proposal with source=problem_list.
```

---

### D.5 — Inappropriate-imaging soft-block (anchor case: lumbar MRI without red flags)

**Problem.** Up to 50 % of spinal MRIs are inappropriate. The AIIE already has the signal; we need to surface it loudly when the case is a textbook over-order.

#### Cursor Prompt D.5

```
GOAL
Add a specific soft-block for the highest-volume over-ordered pattern (MRI lumbar spine for low back pain without red flags and without adequate conservative care). Generalizes via a rule registry so more patterns can be added.

CREATE:
1) lib/aiie/overuse-patterns.ts
Export:
- type OveruseRule = { id: string; match: (input: { snapshot?: PatientRecordSnapshot; order: AIIEOrder; clinical: AIIEClinicalFactors; }) => boolean; cardTitle: string; rationale: string; recommendedAlternative: string; citations: string[]; }
- export const OVERUSE_RULES: OveruseRule[] = [
    { id: "mri_lumbar_lbp_nored", ...matches MRI lumbar + LBP complaint + no conservative care + no red flags... },
    { id: "ct_head_minor_hit", ...matches CT head + minor head injury (Canadian CT Head Rule negative)... },
    { id: "ct_pe_low_wells", ...matches CTPA + Wells score low/moderate when PERC satisfied... },
    { id: "mri_knee_no_fail_conservative", ... },
    { id: "plain_xray_low_back_pain_stable", ... },
    { id: "ct_sinus_acute", ... }
  ]

2) lib/cards/overuse-soft-block-card.ts
Export:
- function buildOveruseCard(rule: OveruseRule, input: any): CdsCard

MODIFY:
- app/api/cds-services/arka-ins-coverage/route.ts — after AIIE scoring, evaluate all OVERUSE_RULES; append a card for each match.

ACCEPTANCE
- Six rules seeded, each with citations to ACR Appropriateness Criteria or Choosing Wisely.
- Override reason mandatory.
- Telemetry row written to ins_validation_events with event_type='overuse_pattern_matched'.
```

---

### D.6 — AI-enhanced documentation assistant (NLP on clinician note — deterministic)

**Problem.** The image's solution recommends "AI and NLP to assist in ordering the correct test." Keep it deterministic so we stay Non-Device CDS.

**Design.** An in-browser NLP step that runs a regex + phrase-lexicon over the pasted clinician note to extract candidate symptom concepts, durations, and red flags. These are *proposed*, never *applied* silently.

#### Cursor Prompt D.6

```
GOAL
Add a client-side deterministic NLP helper that extracts structured clinical history from pasted free-text notes. Proposes mapped AIIE fields. No LLM dependency; all rules shipped in code.

CREATE:
1) lib/nlp/clinical-lexicon.ts
- Export SYMPTOMS, RED_FLAG_PHRASES, DURATION_REGEX, CONSERVATIVE_CARE_REGEX.
- Every entry has a human-readable comment and a canonical mapping to AIIEClinicalFactors.

2) lib/nlp/extractClinicalHistory.ts
- Export function extractClinicalHistory(text: string): ExtractionResult
- type ExtractionResult = { symptoms: string[]; redFlags: Partial<AIIERedFlags>; duration?: string; conservativeCare?: { tried: boolean; duration?: string }; confidence: "high"|"medium"|"low"; }

3) components/demos/clin/DocumentationAssistantCard.tsx
- Textarea for paste-in.
- Button "Extract". Displays the proposed structured fields with per-field Confirm.
- Preserves original text for audit.

MODIFY:
- components/demos/clin/ClinicalScenarioForm.tsx — render the assistant between patient details and clinical factors.

ACCEPTANCE
- Pure client-side (no network), deterministic.
- Test: "Progressive neuro deficits x 6 weeks, PT for 2 months" → symptoms includes "progressive_symptoms", redFlags.progressiveSymptoms===true, duration==="6 weeks", conservativeCare.tried===true.
- FDA Non-Device CDS disclosure visible in the card footer.
```

---

### D.7 — Single-pane workflow de-fragmentation

**Problem.** The images call out workflow fragmentation (orders that never reach scheduling). Fix: one canonical view of every in-flight order — AIIE score, scheduling status, coverage status, PA status, OOP estimate — for both the provider and the scheduler.

#### Cursor Prompt D.7

```
GOAL
Build a single "Order Lifecycle" view that joins AIIE audit, scheduling intent, PA status, and OOP estimate into one read-model. Powers both provider and scheduler dashboards.

CREATE:
1) supabase/migrations/033_ins_order_lifecycle_view.sql
create view public.ins_order_lifecycle as
select
  a.order_hash,
  a.patient_hash,
  a.clinical_score,
  a.mnai_tier,
  s.status as scheduling_status,
  s.sla_expires_at,
  p.status as pa_status,
  p.decision_at as pa_decision_at,
  o.estimated_patient_responsibility
from ins_aiie_audit a
left join ins_scheduling_intent s using (order_hash)
left join ins_pa_history p using (order_hash)
left join ins_oop_estimates o using (order_hash);

2) app/api/ins/lifecycle/route.ts
GET with filters ?status=&cpt=&daysBack=. Wraps withInsApiLogging. Paginated 50 rows.

3) components/ins/provider/OrderLifecycleTable.tsx
Dense table with the five status pills per row. Clicking a row opens a read-only drawer.

MODIFY:
- app/ins/provider/page.tsx — add the table as a new tab "Order Lifecycle".

ACCEPTANCE
- Joins run under 200 ms on 100k rows (verify with seed + EXPLAIN ANALYZE).
- No PHI leaves the server — hashed identifiers only.
- Table preserves column widths and supports keyboard navigation.
```

---

## Part E — Cross-cutting quality gates

### E.1 — Global ARKA observability uplift

#### Cursor Prompt E.1

```
GOAL
Add a single dashboard that proves every new feature ships healthy. Emits Prometheus-style counters backed by Supabase aggregations and renders a pinned status card on the INS dashboard.

CREATE:
1) lib/server/metrics-counters.ts
Export:
- async function bump(counter: string, labels?: Record<string,string>): Promise<void>
- async function readTimeSeries(counter: string, windowMinutes: number): Promise<TimeSeriesPoint[]>
Backed by a Supabase table ins_counters (create migration 034).

MODIFY:
- lib/aiie/scoring-engine.ts → bump("aiie_score_requests", { modality }).
- lib/cards/overuse-soft-block-card.ts → bump("overuse_card_emitted", { rule_id }).
- lib/ins/scheduling-intent.ts → bump("scheduling_intent_created"), bump("scheduling_intent_breached").

2) components/ins/ObservabilityCard.tsx
Pinned card on app/ins/page.tsx showing six sparklines: AIIE scores/min, overuse cards/min, STAT reclass/min, scheduling breaches/min, MNAI green rate, autofill acceptance rate.

ACCEPTANCE
- Sparklines refresh every 30 s.
- No PHI in counter labels.
- Card loads under 250 ms from cache.
```

---

## Part F — Test plans and sign-off

Every Cursor prompt above includes explicit Vitest test scaffolds. The roll-up checklist at go-live:

1. `npm run type-check` zero errors.
2. `npm run lint` zero errors.
3. `npm run test` green, with at least 85 % coverage across new `lib/` code.
4. Lighthouse scores ≥ 90 for accessibility and performance on every demo page.
5. CDS-Hooks sandbox (`npm run test:sandbox`) exercises: coverage, final-check, appointment-book, plus the new STAT card, duplicate-order card, overuse card, and swallow-triage card.
6. Federated-analytics epsilon budget exceeded → 429 returned.
7. Every new user-visible card ends with the canonical FDA Non-Device CDS disclosure sentence (grep test in CI).
8. Every new Supabase table has `enable row level security` and a service-role policy.

### Canonical disclosure sentence (for grep test in CI)

```
This recommendation is provided by ARKA Imaging Intelligence Engine, an FDA Non-Device Clinical Decision Support tool under the 21st Century Cures Act. The ordering clinician retains full responsibility for the final decision.
```

---

## Part G — Cursor meta-prompts

### G.1 — Repository-wide safety prompt (paste once at the start of any Cursor agent session)

```
CONTEXT
- Repo: arkahealth (Next.js 16, React 19, TypeScript strict, Supabase, shadcn/ui, Tailwind).
- Respect .cursorrules. In particular:
  • Do NOT modify files under app/clin/, app/ed/, components/clin/, components/ed/ unless my instruction explicitly names the path.
  • lib/aiie/scoring-engine.ts is shared. Append new functions, never rewrite. Always maintain back-compat when snapshot is undefined.
  • All new Supabase tables are prefixed `ins_`. RLS enabled. Service-role-only policy unless I ask otherwise.
  • Every user-visible card ends with the FDA Non-Device CDS disclosure sentence.
  • Lib functions return { data, error } tuples, never throw.
  • No `any`, no `unknown`. JSDoc every exported symbol.
  • API routes wrapped with withInsApiLogging. p95 budget 800 ms.

PROCESS
- Propose a diff plan first. Wait for my "go". Then produce the full diff. Do not run migrations automatically.
- After the diff, run npm run type-check and npm run lint; report any errors and fix them before finishing.
```

### G.2 — Lint tax prompt (paste on any finishing pass)

```
CHECK
1) grep "as any" in changed files → none should exist. Replace with explicit types.
2) grep "TODO" in changed files → none should exist. Convert to github issues in docs/TODO.md instead.
3) grep "FDA Non-Device" → every new component that renders a card must hit this string.
4) For each new migration, confirm enable row level security; is present.
5) For each new API route, confirm withInsApiLogging wraps the handler.
```

---

## Appendix A — The full list of Cursor prompts in suggested execution order

| # | Prompt | Part | Depends on |
|---|--------|------|------------|
| 1 | A.1 | Ingestion | — |
| 2 | A.2 | Control sheet | A.1 |
| 3 | B.1 | ICD/CPT mapping | A.1 |
| 4 | B.2 | Trauma gate | A.1 |
| 5 | B.3 | Audit sink | B.1, B.2 |
| 6 | D.1 | Real-time capture | B.3 |
| 7 | D.2 | STAT gate | A.1 |
| 8 | D.3 | Duplicate block | A.2 |
| 9 | D.4 | Autofill | A.1 |
| 10 | D.5 | Overuse rules | B.1 |
| 11 | D.6 | NLP helper | A.1 |
| 12 | D.7 | Lifecycle view | D.1, B.3 |
| 13 | A.5 | Interesting case | B.3 |
| 14 | A.6 | Swallow module | A.1 |
| 15 | A.3 | Reference viewer | A.1 |
| 16 | A.4 | Radiopaedia/WebMD | A.1 |
| 17 | C.1 | Imaging data lake | B.3 |
| 18 | C.3 | Incidentals | A.1 |
| 19 | C.2 | Federated gateway | C.1 |
| 20 | E.1 | Observability | end |

The order above keeps every prompt deployable on its own branch without breaking the live demo.

---

## Appendix B — Citation map (grounds each feature in peer-reviewed or regulatory sources)

| Feature | Primary grounding |
|---------|-------------------|
| A.1, A.2 | HL7 FHIR Bulk Data Access; ACR Appropriateness Criteria on duplicate imaging |
| A.3 | ACR Chest Radiograph Review practice parameter; Berbaum et al on satisfaction-of-search |
| A.4 | Radiopaedia API licensing page; CC-BY-NC-SA-3.0 |
| A.5 | ACR QI handbook on "interesting cases"; Wilson LB binomial stats |
| A.6 | ASHA FEES/VFSS practice parameter; Choosing Wisely (AASLP) |
| B.1 | Public AIM / eviCore / Carelon RBM policy summaries; ACR |
| B.2 | AAST Abbreviated Injury Scale; ACR Head Trauma; PECARN |
| B.3, C.1 | 21st Century Cures §3060 criteria for Non-Device CDS |
| C.2 | Dwork C. Differential Privacy; Bonawitz et al Secure Aggregation |
| D.1 | Radiology Business Apr 2025 reports on unscheduled-order leakage |
| D.2 | ACEP STAT labeling position statements |
| D.3 | ACR Choosing Wisely on redundant imaging |
| D.4 | JAMIA 2019 on structured history capture improving CDS fire rates |
| D.5 | ACR Appropriateness Criteria (LBP, headache, PE) |
| D.6 | PMC studies on deterministic NLP for clinical history |
| D.7 | AHIMA workflow studies; CMS-0057-F SLA compliance |

---

## Appendix C — Regulatory posture restated

ARKA remains an FDA **Non-Device** Clinical Decision Support tool under Section 520(o)(1)(E) of the FD&C Act (21st Century Cures Act, §3060). Every feature above:

1. Intends to support, not replace, clinician decision-making.
2. Displays the basis for each recommendation (factor-level contributions, citations).
3. Allows the clinician to independently verify the information.
4. Does not acquire, process, or analyze medical images for diagnostic purposes (the reference viewer in A.3 is explicitly labeled non-diagnostic).

This posture must be preserved through every Cursor prompt. If a proposed change would move ARKA into a Device-CDS posture (e.g., autonomous interpretation of pixel data, deterministic diagnosis from lab values), halt and escalate — that is a separate regulatory track.

---

## Appendix D — How this document pairs with `ARKA_OPTIMA_ALGORITHM.md`

The present document is the **delivery plan** for features 1, 2, 3, and 5. It keeps ARKA on the Non-Device CDS track while addressing every clinician-review concern.

`ARKA_OPTIMA_ALGORITHM.md` is the **research-grade optimization-engine spec** (Feature 4). It describes how, once ARKA is embedded in a hospital's CDS Hooks workflow via the present document, a successor-generation engine (ARKA-OPTIMA) can outperform every deployed imaging appropriateness engine on record. It is written to be implementable incrementally, with each stage maintaining CDS-Hooks + FHIR compatibility so physician workflow never changes. See the companion document for the full specification.
