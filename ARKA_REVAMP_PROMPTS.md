# ARKA Platform Revamp — Cursor Prompt Playbook

A sequenced set of copy-paste Cursor prompts that takes ARKA from polished demo to production-grade, unicorn-tier product. Run them **in order** — later prompts depend on earlier ones. Run each prompt in a fresh Cursor Composer/Agent session, review the diff, run `npm run build && npm run lint`, and commit before moving on.

**Ground rules baked into every prompt (Cursor will also read `.cursorrules`):**

- Keep the existing color scheme: navy `#0F172A`, slate `#1E293B`, teal `#14B8A6`. Refine, don't replace.
- TypeScript strict, no `any`, `{ data, error }` tuples from lib functions, shadcn/ui + Tailwind only.
- The clinical engine is the **AIIE (ARKA Imaging Intelligence Engine)**. The knowledge layer is the **AIIE Clinical Knowledge Matrix**. It is never referred to by any external guideline body's name anywhere in code, UI, comments, or docs.
- FDA Non-Device CDS disclaimer stays on every card and page exactly as specified in `.cursorrules`.
- **MOTION PRESERVATION CONTRACT (applies to every prompt):** `components/ArkaAnimatedLogo/` is frozen — do not modify any file in it, and render it everywhere at its current size with its current animation, timing, and props. All EXISTING transition and animation behavior across the site (the 300ms ease-out default, the existing `fadeIn`/`slideUp`/`pulseGlow` keyframes, and every current `transition-*`/`animate-*` usage) stays exactly as it is. New keyframes and motion introduced by these prompts are ADDITIVE and apply only to newly created components and sections — never retime, re-ease, remove, or replace an existing animation.

---

## Part 0 — Design System Foundation (run first; everything else inherits it)

### Prompt 0.1 — Elevate the design tokens

```
You are revamping the design system of ARKA, a healthtech clinical decision support platform built with Next.js (App Router), Tailwind, and shadcn/ui. The brand colors (navy #0F172A, slate #1E293B, teal #14B8A6) must stay, but the visual execution needs to reach the level of Linear, Stripe, and Vercel.

Work only on tailwind.config.ts, styles/, and app/layout.tsx. Do not touch page content yet.

1. Typography: keep Inter, but load it via next/font with `display: swap` and enable OpenType features ("cv02","cv03","cv04","cv11"). Add a type scale as Tailwind fontSize entries with paired line-heights and letter-spacing: display (clamp(2.5rem,5vw,4rem), -0.03em), h1 (-0.025em), h2 (-0.02em), h3 (-0.015em), body-lg, body, caption. Headings tighter; never use default tracking on headings again.
2. Extend the teal into a full 50–950 ramp under `arka-teal-*` (50 #F0FDFA through 950 #042F2E) and a slate ramp under `arka-slate-*`, so components stop hard-coding one-off hex values.
3. Add semantic tokens: `surface` (white), `surface-raised` (#FCFDFE), `surface-sunken` (#F1F5F9), `surface-dark` (#0F172A), `surface-dark-raised` (#16203A), `border-subtle` (#E2E8F0), `border-strong` (#CBD5E1), plus `success`, `warning`, `danger`, `info` ramps tuned for clinical UI (success #059669, warning #D97706, danger #DC2626, info #0284C7) — each with a `-bg` pastel for badges.
4. Shadows: replace the current flat shadows with a layered elevation system: `elevation-1` through `elevation-4` using stacked low-opacity shadows (e.g. elevation-2: 0 1px 2px rgb(15 23 42/0.04), 0 4px 8px rgb(15 23 42/0.06), 0 12px 24px rgb(15 23 42/0.05)). Keep `glow` variants but lower opacity ~30% so teal glow reads premium, not neon.
5. Radii: token set `radius-sm` 6px, `radius-md` 10px, `radius-lg` 14px, `radius-xl` 20px. Cards use lg, buttons md, inputs md, modals xl.
6. Motion: PRESERVE the existing motion system untouched — keep the 300ms ease-out default transition and the existing `fadeIn`/`slideUp`/`pulseGlow` keyframes exactly as they are; do not retime or re-ease anything currently in use, and do not modify components/ArkaAnimatedLogo/ in any way. ADD (additive only, for new components built later in this playbook): `fade-in-up` (12px, 400ms, cubic-bezier(0.16,1,0.3,1)), `scale-in` (0.97→1, 250ms), `shimmer` (for skeletons), and a `stagger-children` pattern documented in a comment.
7. Add a subtle global noise/grain data-URI utility class `bg-grain` (4% opacity) for dark hero sections, and a `bg-grid-faint` utility (1px slate lines, 32px cells, masked radial fade) for technical sections.
8. In app/layout.tsx set `antialiased`, `text-arka-slate-900`, `bg-surface`, and `selection:bg-arka-teal-200 selection:text-arka-slate-900`.

Do not break existing class references: keep the old color keys as aliases mapping to the new ramps. Run a project-wide check that nothing references removed tokens. Acceptance: `npm run build` passes; visual tokens documented in a new docs/DESIGN_SYSTEM.md table.
```

### Prompt 0.2 — Rebuild the shadcn primitives to premium quality

```
Upgrade every component in components/ui/ (Button, badge, card, dialog, popover, tabs, ArkaSpinner, TableScrollWrapper) to a premium standard using the new tokens from tailwind.config.ts. framer-motion is already a dependency — use it where it adds polish, never gratuitously. Do NOT touch components/ArkaAnimatedLogo/ (frozen), and do not change any transition timing on existing components outside components/ui/ — existing site-wide animations stay exactly as they are.

Button: variants primary (teal-600 bg, white text, hover teal-500, active scale-[0.98], elevation-1→2 on hover), secondary (white bg, border-strong, slate-700 text), ghost, destructive, and a new `premium` variant (navy bg, subtle teal inner glow on hover) for hero CTAs. Sizes sm/md/lg/icon. Focus-visible ring: 2px teal-500 offset 2. Loading state with inline spinner that swaps the label without layout shift (fixed width via tabular-nums or grid overlay).

Card: default uses surface + border-subtle + elevation-1, hover:elevation-2 with 200ms transition. Add `<Card variant="interactive">` (cursor-pointer, hover lift translate-y-[-2px]) and `<Card variant="dark">` (surface-dark-raised, border-white/10, used on dark sections).

Dialog: backdrop blur-sm bg-slate-950/40, panel radius-xl elevation-4, scale-in animation, close button 40px hit area.

Tabs: animated active indicator (layoutId via framer-motion) instead of static underline.

Badge: pill, semantic variants (success/warning/danger/info/neutral) using the `-bg` pastels + 600-level text, dot variant with 6px status dot.

Add three NEW primitives (shadcn style, Radix where applicable):
- components/ui/skeleton.tsx — shimmer skeleton using the shimmer keyframe.
- components/ui/tooltip.tsx — Radix tooltip (dep already installed), dark slate panel, 8px offset, 150ms delay.
- components/ui/score-ring.tsx — an SVG circular gauge for AIIE scores 1–9: animated stroke (framer-motion pathLength), color interpolates danger(1–3)/warning(4–6)/success(7–9), center shows score in tabular-nums with /9 caption. Props: score, size, label, animate. This becomes the signature visual of the product — make it flawless, with a11y (role="meter", aria-valuenow).

Every component: full keyboard a11y, focus-visible rings, prefers-reduced-motion respected (disable transforms, keep opacity fades). Acceptance: build + lint pass; no page imports break.
```

### Prompt 0.3 — Navigation & global chrome

```
Redesign the global navigation and footer (components/navigation/, app/layout.tsx) to flagship quality.

Header: sticky, transparent over the dark hero, transitioning on scroll (useScroll from framer-motion or a scroll listener) to bg-white/80 backdrop-blur-md border-b border-subtle. Left: ArkaAnimatedLogo rendered exactly as it currently is — same component, same props, same size, same animation; do not modify components/ArkaAnimatedLogo/ or wrap it in anything that alters its timing or scale. Center: nav items (Platform, Phases dropdown with CLIN/ED/INS/RURAL each with icon + one-line description in a Radix popover mega-menu, Evidence, ROI, Docs). Right: secondary "Sign in" ghost button + primary "Book a demo" premium button. Mobile: full-screen sheet menu with staggered fade-in-up items, body scroll locked.

Phases dropdown items use a 2-col grid: icon in a 40px teal-50 rounded-lg tile, name + descriptor, hover bg-surface-sunken. Add a thin teal progress bar at the very top of the viewport indicating page scroll progress (2px, only on docs/long pages).

Footer: dark navy with bg-grain, 4-column (Product / Phases / Compliance / Company), compliance column includes FDA Non-Device CDS note, HIPAA stance, CMS-0057-F readiness with links to /docs. Bottom row: logo, copyright, system-status dot ("All systems operational" with green pulse).

Add a global <CommandMenu> (cmd+K) using Radix Dialog: fuzzy-search over routes (all phases, demos, evidence pages, docs) defined in a typed registry lib/navigation/routes.ts. No new heavy deps; simple includes()-based filtering is fine.

Acceptance: header behavior verified on /, /clin, /ins (dark and light page tops); keyboard navigable; mobile menu traps focus.
```

---

## Part 1 — Landing Page Overhaul

### Prompt 1.1 — Hero & narrative flow

```
Rebuild the landing page (app/page.tsx and components/landing/*) into a top-1% SaaS landing experience. Keep the existing narrative sections and copy intent (Hero, GetPaid, Problem, RevenueProof, WhyArka, TrustBand, PlatformEcosystem, Testimonials, Cta) but re-execute the visuals.

Hero: full-viewport dark navy with bg-grain + a slow ambient radial teal gradient (CSS only, animated background-position, disabled under prefers-reduced-motion). Headline in the new display scale. Two CTAs (premium + ghost-light). Below the fold of the hero, embed a LIVE product visual instead of a static mock: a self-playing, looped mini CDS card simulation — a fake EHR order panel where an imaging order types itself in, the AIIE score-ring animates to its value, and an evidence chip appears; loop every ~9s with crossfade. Build it as components/landing/HeroSimulation.tsx with hard-coded data, framer-motion sequenced via useAnimationControls. It must be pure presentation (no API calls) and pause when offscreen (IntersectionObserver).

Add a logo/credibility strip under the hero: "Built for" + grayscale inline SVG wordmarks (Epic-compatible, FHIR R4, CDS Hooks 2.0, CMS-0057-F) as neutral badges — these are standards badges, not fake customer logos. Do not invent customer names.

Section rhythm: alternate surface / surface-sunken backgrounds, max-w-7xl, py-24 md:py-32, every section heading preceded by a small teal mono-style eyebrow label. All sections animate in with fade-in-up + stagger on first scroll into view (whileInView, once: true). Any EXISTING animation on these sections that already works (current fadeIn/slideUp entrances, hover transitions, the ArkaAnimatedLogo) is kept as-is — apply the new entrance motion only where a section currently has none, and never retime what's already animated.

RevenueProof: rebuild numbers as animated count-up stats (IntersectionObserver-triggered, tabular-nums) inside dark Cards with the score-ring aesthetic. PlatformEcosystem: redesign the four-phase diagram as an SVG orbital layout — central "AIIE Knowledge Core" node with four phase nodes connected by animated dashed paths (stroke-dashoffset animation); each node clickable → phase page; fully keyboard accessible with a visually-hidden description.

Testimonials: if current testimonials are placeholders, replace with three outcome-framed pull-quotes attributed to roles only ("Chief of Emergency Medicine, 400-bed health system") — never invented names. Cta: dark panel, grain, single centered premium CTA.

Acceptance: Lighthouse performance ≥ 90 (defer the simulation with next/dynamic, ssr: false), CLS < 0.05, all images/SVGs sized, build passes.
```

### Prompt 1.2 — Trust, compliance & evidence surfaces

```
Polish trust surfaces sitewide. Create components/shared/ComplianceBar.tsx: a slim band used on every phase page showing four items with tooltips — "FDA Non-Device CDS · 21st Century Cures §520(o)(1)(E)", "No PHI stored · SHA-256 hashed identifiers", "CMS-0057-F aligned", "CDS Hooks 2.0 / FHIR R4". Replace each phase's ad-hoc FDA banner usage (e.g. components/ins/FDANonDeviceBanner.tsx) with this single component while preserving the exact mandated disclaimer text in a tooltip/expandable detail.

Restyle /privacy, /terms, and /docs with the docs typography (prose styles, sticky table of contents, reading-progress bar). Add a /trust page summarizing the regulatory posture with links into docs/regulatory — sourced from the actual files in docs/regulatory and docs/regulatory-evidence, no invented claims.
```

---

## Part 2 — Phase UI Overhauls

> Run 2.1–2.4 separately. Each prompt is scoped to its phase per `.cursorrules` isolation rules — tell Cursor explicitly it may modify that phase's directories.
>
> **Paste this line at the top of each phase prompt:** "Motion preservation: components/ArkaAnimatedLogo/ is frozen (same size, same animation everywhere). Keep every existing transition/animation on this phase's pages at its current timing and easing; new motion (fade-in-up, scale-in, score-ring animation, skeletons) is additive and only for newly built elements."

### Prompt 2.1 — ARKA-CLIN: the clinician cockpit

```
You may modify app/clin/, app/clin-suite/, components/demos/clin/, and read lib/demos/clin/. Redesign the ARKA-CLIN experience into a clinician cockpit that looks like a flagship clinical product, using the design system in components/ui/ and tokens in tailwind.config.ts.

Layout: replace the current single-column demo with a three-zone workspace on desktop:
- Left rail (320px): patient context card (demographics, hashed MRN badge, active problems, allergies) + scenario picker redesigned as a searchable list with severity dots, sourced from lib/demos/clin/demo-scenarios.ts.
- Center: the order composer. Modality/body-part/indication inputs become large, keyboard-first comboboxes with inline validation. On submit, show a sequenced evaluation animation: "Parsing order → Matching AIIE Knowledge Matrix → Scoring factors → Building recommendation" as a 4-step inline tracker (each step ~300ms, checkmark morph), then render results.
- Right rail (360px): results. The AIIE score in the score-ring (large, animated), denial-risk inverse gauge below it, then the SHAP-style factor breakdown as horizontal diverging bars (recharts or pure CSS): teal bars push right (supports), amber push left (against), each row expandable to show the factor's evidence line and a "View evidence" link (these links will be wired in Part 4 — point them at /evidence/[slug] now).

Recommendation states must be visually unmistakable: appropriate (success left-border card), conditionally appropriate (warning, shows the conditions checklist), low-value (danger, shows the recommended alternative as a one-click "Switch order" suggestion that re-runs scoring).

Mobile: stack zones, sticky results summary bar at bottom (score + indicator) that expands to a sheet. Loading: skeletons, never spinners-on-white. Empty state: an elegant zero-state explaining the workflow with a "Load example case" button.

Persist nothing new; this is presentation over the existing lib/demos/clin/evaluate-imaging.ts pipeline. Acceptance: all existing scenarios render, keyboard-only flow works end-to-end, build + existing tests in __tests__ pass.
```

### Prompt 2.2 — ARKA-ED: speed-first emergency view

```
You may modify app/ed/ and components/demos/ed/, reading lib/demos/ed/. ARKA-ED is the emergency department phase — the design language is the same system but tuned for speed and glanceability: bigger type, higher contrast, fewer words.

Rebuild as a split view: left, an "incoming cases" board listing the five case files from lib/demos/ed/data/cases/ (chest pain, headache, abdominal pain, low back pain, extremity trauma) as triage cards with acuity color edge (ESI-style), chief complaint, vitals chips, and time-since-arrival ticking live. Selecting a case slides in the right panel: the proposed imaging order, the AIIE score-ring rendered INSTANTLY (no artificial delay — ED is about speed; animate the ring but resolve data synchronously), red-flag callouts as prominent danger badges with the matched flags (e.g. "thunderclap onset", "neuro deficit"), and the disposition recommendation.

Add a persistent header strip with simulated department stats (cases scored today, median time-to-decision 0.4s, low-value orders avoided) using count-up numbers. Add a "STAT" visual treatment: when a case has trauma-gate or stat-gate signals (lib/aiie/stat-gate.ts, trauma-gate.ts), the results panel gets a pulsing red left border and the recommendation headline prefixes "EXPEDITE — ".

Every red flag chip and factor row links to /evidence/[slug]. Mobile: board becomes horizontal snap-scroll cards. Acceptance: all five cases score and render distinct outputs; no layout shift when switching cases (fixed panel heights with skeleton crossfade).
```

### Prompt 2.3 — ARKA-INS: payer-grade dashboard

```
You may modify app/ins/ and components/ins/. ARKA-INS is the payer/utilization phase with four personas (dashboard, patient, provider, reviewer). Bring all four up to the new design system with a dashboard density and polish matching Stripe's dashboard.

Shared shell: app/ins/layout.tsx gets a left sidebar (collapsible to icon rail at <1280px) with persona switcher, ComplianceBar, and breadcrumbs. All metric cards across INS pages standardize on one components/ins/MetricCard.tsx: label, big tabular-nums value, delta chip (▲/▼ with semantic color), 7-point sparkline (recharts Line, no axes), skeleton state.

Dashboard: rework into a grid — top row 4 MetricCards (auth requests, auto-approval rate, median decision time, gold-card providers); middle: approval funnel (recharts) + denial-reason Pareto bar chart, both restyled with arka-teal ramp, slate gridlines at 6% opacity, custom tooltip matching the dark tooltip primitive; bottom: recent decisions table — zebra-free, row hover bg-surface-sunken, status badges, AIIE score as a 28px mini score-ring per row, row click → decision drawer (Radix Dialog right-side sheet) showing the full factor breakdown + evidence links + the FDA disclaimer.

Reviewer view: redesign as a work queue with keyboard j/k navigation, approve/deny/pend actions as large bottom action bar, SLA countdown chips (72h standard / 24h expedited per CMS-0057-F, color shifts amber <12h, red <4h). Patient view: simplify to a friendly OOP estimate card with the oop-estimator output, plain-language explanations, no clinical jargon. Provider view: gold-card status hero (score-ring), PA history table, denial-risk trends.

Keep all data flowing from the existing lib/ins, lib/aiie, lib/davinci modules — presentation only. Acceptance: all four personas navigable, drawer a11y (focus trap, esc), build passes, ins_* table contracts untouched.
```

### Prompt 2.4 — ARKA-RURAL: access & equity phase

```
You may modify app/rural/ and components/demos/rural/. ARKA-RURAL has seven sub-areas (ai, cds, intelligence, network, reimbursement, tele, training). Unify them under one polished hub.

app/rural/page.tsx becomes a hub: a hero with a stylized SVG map motif (abstract dot-grid map of a rural region, teal nodes = connected sites, animated pulse traveling along connection lines — pure SVG/CSS, no map library), then a 7-card grid (Card variant="interactive") linking to each sub-area with icon, one-line value statement, and a "phase status" badge.

Each sub-area page gets the standard phase chrome: breadcrumb, ComplianceBar, consistent page header (eyebrow + h1 + description), and its existing content re-laid-out into the design system (Cards, MetricCards, proper tables). Special attention: /rural/tele gets a side-by-side "originating site / distant site" visual flow; /rural/reimbursement gets a clean rate table with sticky header and a calculator card; /rural/training gets a curriculum checklist with progress indicators.

Acceptance: every sub-route renders with consistent chrome; no orphan styles; mobile clean.
```

---

## Part 3 — The AIIE Clinical Knowledge Matrix (production-grade engine)

> This is the core fix. The current `computeIndicationSignal` in `lib/aiie/scoring-engine.ts` uses regex keyword matching (`/neuro|spine|cord/`, `/trauma|hemorrhage|stroke/`) — that's why most CDS Hooks inputs fall through with a flat default. Replace heuristics with a complete, deterministic knowledge matrix so **every** input resolves to a clinically correct, evidence-linked score. Run 3.1 → 3.5 in order.

### Prompt 3.1 — Knowledge matrix schema & types

```
Create the AIIE Clinical Knowledge Matrix foundation. This is a deterministic clinical appropriateness knowledge base owned by ARKA — it is called the "AIIE Clinical Knowledge Matrix" everywhere (types, comments, UI, docs). Do not name it after any external guideline body.

Create lib/aiie/knowledge-matrix/types.ts with strict types:

- BodyRegion: union of "head_brain" | "head_face_neck" | "spine_cervical" | "spine_thoracic" | "spine_lumbar" | "chest" | "cardiac" | "abdomen" | "pelvis" | "gu_renal" | "msk_upper" | "msk_lower" | "vascular" | "breast" | "whole_body".
- Modality: "xr" | "ct" | "cta" | "ct_contrast" | "mri" | "mri_contrast" | "mra" | "us" | "us_doppler" | "nm" | "pet_ct" | "fluoro" | "mammo" | "dexa".
- ClinicalScenario: { id: string (slug); region: BodyRegion; name: string; description: string; presentationKeywords: string[]; icd10Prefixes: string[]; snomedCodes?: string[]; variants: ScenarioVariant[] }.
- ScenarioVariant: { id: string; criteria: VariantCriteria; ratings: ModalityRating[] } where VariantCriteria captures discriminators: redFlags (string[] from the existing AIIERedFlags keys in lib/types/aiie.ts), durationDays ({min?, max?}), ageRange ({min?, max?}), priorImaging (boolean?), pregnancy (boolean?), trauma (boolean?), immunocompromised (boolean?), priorConservativeCare (boolean?).
- ModalityRating: { modality: Modality; rating: 1|2|3|4|5|6|7|8|9; radiationLevel: 0|1|2|3|4; evidenceSlug: string; rationale: string; isPreferred?: boolean; contrastIssues?: string }.
- ResolvedRating: rating + matched scenario/variant + matchTier: "exact_variant" | "scenario_default" | "region_default" | "conservative_default".

Create lib/aiie/knowledge-matrix/index.ts exporting `resolveRating(input: NormalizedOrderContext): { data: ResolvedRating | null; error: string | null }` (stub for now, implemented in 3.3) and a `MATRIX_VERSION` const ("1.0.0") that will be stamped into every score for auditability.

Also define NormalizedOrderContext in the same types file: { region: BodyRegion | null; modality: Modality | null; scenarioCandidates: string[]; redFlags: string[]; age: number | null; durationDays: number | null; pregnancy: boolean | null; trauma: boolean; priorImaging: boolean; immunocompromised: boolean; rawText: string }.

JSDoc on every export. No runtime logic changes yet. Build must pass.
```

### Prompt 3.2 — Populate the matrix: complete clinical coverage

```
Populate the AIIE Clinical Knowledge Matrix with comprehensive, clinically accurate appropriateness content. Create one file per body region in lib/aiie/knowledge-matrix/regions/ (head-brain.ts, spine-lumbar.ts, chest.ts, cardiac.ts, abdomen.ts, pelvis.ts, msk-upper.ts, msk-lower.ts, vascular.ts, gu-renal.ts, head-face-neck.ts, spine-cervical.ts, spine-thoracic.ts, breast.ts), each exporting ClinicalScenario[] and aggregated in regions/index.ts.

Coverage requirement — implement AT MINIMUM these scenarios with variants, drawing on established evidence-based appropriateness ratings for each modality (rate every modality in the Modality union for every variant, even if rating 1 "usually not appropriate"):

head_brain: acute headache (variants: thunderclap, with neuro deficit, with fever+immunocompromised, chronic stable, new >50y, post-trauma GCS<15, post-trauma GCS 15 low-risk); suspected stroke (<4.5h, wake-up, TIA); seizure (first, breakthrough); head trauma (adult by decision-rule risk tiers, pediatric by age <2 / 2–18).
spine_lumbar: low back pain (uncomplicated <6wk — imaging usually NOT appropriate, that nuance must be explicit; with radiculopathy >6wk after conservative care; with cauda equina signs — MRI 9, EXPEDITE; with cancer history; with infection signs/IVDU; with osteoporosis/fragility fracture risk; post-trauma).
spine_cervical: neck pain (uncomplicated, with myelopathy signs, trauma by clinical decision-rule criteria).
chest: acute chest pain (suspected ACS, suspected PE by pretest probability low/intermediate/high with d-dimer branches, aortic dissection suspicion); chronic cough; hemoptysis; lung cancer screening eligibility (age 50–80, 20 pack-years).
cardiac: stable chest pain (CCTA vs stress paths), new heart failure, pre-op clearance (usually not appropriate — say so).
abdomen: RLQ pain/suspected appendicitis (adult CT, pediatric/pregnant US-first then MRI); RUQ pain/suspected cholecystitis (US first 9); epigastric pain/pancreatitis; suspected SBO; diverticulitis; blunt abdominal trauma (hemodynamically stable/unstable).
pelvis/gu_renal: renal colic (low-dose CT 8, US for pregnant/young recurrent); hematuria (micro vs gross); pelvic pain female (US-first 9, ectopic workup); scrotal pain (US doppler 9, torsion EXPEDITE).
msk_lower: knee pain (acute trauma decision-rule criteria for XR, suspected meniscal/ligament MRI after XR, chronic OA — MRI usually not appropriate); hip pain (occult fracture MRI after negative XR); ankle (decision-rule criteria).
msk_upper: shoulder pain (chronic rotator cuff MRI vs US, acute trauma XR first).
vascular: suspected DVT (US doppler 9), carotid stenosis workup, AAA screening/surveillance.
breast: screening by age/risk tier, palpable lump by age (<30 US first, ≥30 diagnostic mammo+US).
head_face_neck: sinusitis (uncomplicated — imaging not appropriate; complicated/orbital signs CT), thyroid nodule (US 9), neck mass adult.

Every ModalityRating gets: an honest rating, radiationLevel (0 for US/MRI; 1–4 scaled for XR/CT/NM), a one-sentence clinically substantive rationale, and an evidenceSlug following the pattern "{region}-{scenario}-{variant}" (the evidence registry in Part 4 will resolve these — keep slugs stable and kebab-case). presentationKeywords must be rich: include synonyms, abbreviations, and misspellings clinicians actually type (e.g. lumbar: "lbp", "low back", "lumbago", "sciatica", "back pain"; PE: "pe", "pulmonary embolism", "pleuritic", "sob", "shortness of breath", "dyspnea").

This file set is large — keep each region file under 600 lines, data-only (no logic), and add a regions/index.ts that also exports SCENARIO_COUNT and asserts at module load (dev only) that no duplicate scenario ids or evidence slugs exist. Add __tests__/knowledge-matrix-content.test.ts: every scenario has ≥1 variant, every variant rates ≥6 modalities, every rating has rationale ≥20 chars and a valid slug format, at least one modality rated ≥7 per variant OR the variant explicitly represents an "imaging not indicated" pattern (allow a sentinel `isPreferred` on a rating with modality "xr" rating 1 plus rationale referencing conservative care — design a cleaner mechanism if you have one: e.g. variant-level `imagingIndicated: boolean`).
```

### Prompt 3.3 — Deterministic normalizer & resolver (zero unmatched inputs)

```
Implement the matching layer so ANY input — structured FHIR, free text, garbage — resolves deterministically. Create:

lib/aiie/knowledge-matrix/normalizer.ts — `normalizeOrderContext(input: AIIEInput): NormalizedOrderContext`. Deterministic pipeline, no network calls:
1. Modality: map from input.order.modality / requestedModality / CPT code (extend lib/aiie/cpt-pricing.ts knowledge or add a CPT→Modality map for the common imaging CPT ranges: 70000-series by subrange, 93880 carotid duplex, etc.) / procedure text keywords ("computed tomography", "cat scan"→ct; contrast detection from "with contrast", "w/", "iv contrast").
2. Region: from order.bodyPart, procedure text, and CPT subrange; fall back to scanning complaint text against region keyword sets.
3. Scenario candidates: score every ClinicalScenario by (a) ICD-10 prefix match on any reason codes (weight 3), (b) SNOMED match (weight 3), (c) presentationKeywords hits in the combined complaint+indication text using word-boundary matching after lowercasing and basic stemming (strip plurals, normalize "weeks"/"wks") (weight 1 per distinct keyword, cap 4), (d) region agreement (+2). Return candidates sorted by score, threshold ≥2.
4. Extract structured discriminators from AIIEInput: redFlags (already structured in lib/types/aiie.ts), age from patient, durationDays (reuse lib/demos/clin/duration-parser.ts — move it to lib/aiie/ if needed so both demo and engine share it), pregnancy, trauma (also via lib/aiie/trauma-gate.ts signals), priorImaging, immunocompromised.

lib/aiie/knowledge-matrix/resolver.ts — implement resolveRating with a STRICT four-tier cascade, never returning null data when error is null:
- Tier 1 exact_variant: best scenario candidate whose variant criteria all match the normalized context (unspecified criteria = wildcard). Specificity tiebreak: most criteria matched wins; red-flag variants always outrank non-red-flag variants when their flags match.
- Tier 2 scenario_default: scenario matched but no variant criteria fit → use the scenario's most permissive variant (define `isDefault: true` on one variant per scenario; add that flag in the region files and enforce in the content test).
- Tier 3 region_default: region+modality known but no scenario → return a region-level default rating table (add DEFAULTS per region in regions/defaults.ts: conservative mid ratings, e.g. ct abdomen unspecified = 5 with rationale "Insufficient indication detail; appropriateness indeterminate — documentation improvement recommended").
- Tier 4 conservative_default: nothing resolvable → rating 4, radiationLevel by modality (or 2 if unknown), evidenceSlug "aiie-indeterminate-order", rationale instructing what clinical detail would change the score. NEVER throw; return { data, error: null } in all four tiers.

Then rewire lib/aiie/scoring-engine.ts: replace the body of computeIndicationSignal and computeGuidelineSignal to derive from the resolver — indicationSignal = (resolved.rating - 5) / 4 bounded to [-1, 1] (plus existing snapshot deltas), guideline factor evidence string now cites the matrix: "AIIE Clinical Knowledge Matrix v{MATRIX_VERSION}: {rationale}". Add to AIIEScore (lib/types/aiie.ts): matrixMatch: { tier, scenarioId, variantId, evidenceSlug, matrixVersion }. Keep weights, SHAP factor structure, denial-risk inversion, trauma/swallow gates, and the {data,error} contract intact. Both CLIN and INS consume this engine — verify app/api/cds-services/* routes and lib/demos/clin/evaluate-imaging.ts still compile and their existing tests pass; update test fixtures where scores legitimately changed, with a comment explaining the clinical reason for each changed expectation.
```

### Prompt 3.4 — Exhaustive permutation testing

```
Prove total coverage. Create __tests__/knowledge-matrix-exhaustive.test.ts (vitest):

1. FULL CARTESIAN SWEEP: iterate every BodyRegion × every Modality × every scenario's presentationKeywords[0] as complaint text × redFlags on/off × age in {8, 35, 72} × priorImaging on/off. For every single combination assert: scoreOrder() resolves, clinicalScore is an integer 1–9, denialRisk present, factors non-empty, matrixMatch present with a valid tier, narrativeRationale non-empty, and evidenceSlug non-empty. Zero exceptions allowed.
2. ADVERSARIAL INPUTS: empty strings, emoji, 10k-char lorem, SQL-ish strings, wrong-language text ("dolor de cabeza" should still tier-4 or better), modality-only ("CT"), complaint-only ("headache"), contradictory (pregnancy=true + age 80). All must resolve at tier 4 or better with no throw.
3. CLINICAL CORRECTNESS GOLDEN SET: a table of ≥60 named cases with expected score RANGES and expected preferred modality, covering the clinically critical patterns, e.g.: cauda equina + MRI lumbar → 8–9 exact_variant; uncomplicated LBP 2 weeks + MRI → 1–3; thunderclap headache + CT head → 8–9; first trimester pregnancy + suspected appendicitis: US → 8–9 while CT → ≤4; suspected PE high pretest + CTA → 8–9; low pretest no d-dimer + CTA → ≤4; renal colic + low-dose CT → 7–9; pre-op screening CXR asymptomatic → 1–3; testicular torsion + US doppler → 9 with stat signal; pediatric head trauma low-risk by decision-rule → CT ≤3. Each golden case asserts tier is exact_variant or scenario_default (never region/conservative default — if it falls through, the matrix has a gap: FIX THE MATRIX DATA, not the test).
4. DETERMINISM: same input scored 50× yields identical output (deep equal).
5. PERFORMANCE: scoring 1,000 random sweep inputs completes in <2s total (matrix resolution must be O(scenarios), precompute lowercase keyword sets at module load).

Also create scripts/matrix-coverage-report.ts (run with tsx): prints scenario count, variant count, rating count, per-region coverage, % of sweep resolving at each tier — and exits non-zero if tier-3/4 resolutions exceed 15% of the keyword-driven sweep. Wire it as `npm run matrix:coverage` and add it to the go-live GitHub workflow.
```

### Prompt 3.5 — CDS Hooks production hardening

```
Harden the CDS Hooks services in app/api/cds-services/ (arka-clin-appropriateness, arka-clin-appropriateness-sign, arka-ins-appointment, arka-ins-coverage, arka-ins-final-check) and lib/cds-platform/cds-hooks/ to production grade:

1. request-validator.ts: validate full CDS Hooks 2.0 request shape with zod (already a dep) — hook, hookInstance (uuid), context per hook type, prefetch. On invalid: HTTP 200 with empty cards array + OperationOutcome-style extension (CDS Hooks services must not 500 into an EHR), log via pino with hookInstance correlation id.
2. Map FHIR context robustly in lib/cds-platform/fhir/mappers.ts: draftOrders Bundle → extract every ServiceRequest (not just the first), reasonCode → ICD-10/SNOMED for the normalizer, occurrence/authoredOn, patient age from prefetch Patient. Multiple draft orders → one card per order, each independently scored.
3. medical-basis.ts: delete the "No indication-specific guideline mapping is registered" dead-end. It now resolves through the Knowledge Matrix evidenceSlug and ALWAYS returns a basis (tier-4 returns the indeterminate-order basis with documentation guidance).
4. card-builder.ts: cards must include — summary <140 chars with score ("AIIE 3/9 — low-value order: consider US first"), indicator critical/warning/info mapped from score (1–3 warning + suggestion, 4–6 info, 7–9 info success-toned; red-flag EXPEDITE → critical), the suggestions array with a concrete alternative ServiceRequest when a better-rated modality exists for the matched variant (copy coding from the matrix preferred rating), overrideReasons (require reason when dismissing a warning card per CDS Hooks 2.0 feedback), and links — see Part 4 for the evidence URL contract. Every detail ends with the mandated FDA Non-Device CDS sentence.
5. Add a feedback endpoint app/api/cds-services/feedback/route.ts capturing card acceptance/override per CDS Hooks 2.0 §Feedback, logged to the existing decision-log (lib/cds-platform/audit/decision-log.ts) with hookInstance, card uuid, outcome, overrideReason. No PHI.
6. p95 budget: add a timing wrapper logging duration per request; cold path must stay <800ms (matrix is in-memory so this is achievable — verify no fs/network in the hot path).
7. __tests__/cds-services-e2e.test.ts: golden CDS Hooks request fixtures (valid order-select with draft MRI lumbar + LBP reason code; missing prefetch; three draft orders; malformed) asserting full card JSON contracts.
```

---

## Part 4 — Evidence System (fix the broken links for good)

### Prompt 4.1 — Internal evidence registry & route

```
The evidence links are broken: lib/cds-platform/cds-hooks/card-builder.ts builds `https://arka-health.com/evidence/${indicationSlug}` — a domain/route that doesn't exist. Fix this permanently with a first-party evidence system:

1. lib/evidence/registry.ts: typed registry keyed by evidenceSlug (the same slugs the Knowledge Matrix emits). EvidenceEntry: { slug, title, summary (2–3 sentence plain-language synthesis), clinicalBottomLine, keyPoints: string[], citations: { label, source, year, url, doi? }[], relatedSlugs, lastReviewed }. Generate one entry per evidenceSlug in the matrix (write a script scripts/generate-evidence-stubs.ts that diffs matrix slugs against registry keys and scaffolds missing entries; CI fails on missing). Citations must be real, resolvable URLs to actual published guidance and literature (society guidelines, USPSTF, Choosing Wisely, peer-reviewed articles via doi.org). The PAGE and the ENGINE are ARKA/AIIE-branded; the citations underneath are the real external literature.
2. app/evidence/[slug]/page.tsx: server component, generateStaticParams from the registry, styled with the docs typography: header (eyebrow "AIIE Evidence", title, lastReviewed badge, matrix version), clinical bottom line in a highlighted teal-50 card, key points, citation list with outbound links (rel="noopener", external-link icon), related evidence chips, ComplianceBar, and the FDA Non-Device CDS disclaimer. generateMetadata for SEO. Unknown slug → a designed not-found page listing the evidence index, never a 404 dead-end from a clinical card.
3. app/evidence/page.tsx: searchable index grouped by body region.
4. Fix the link construction: in card-builder.ts and everywhere else (grep for "arka-health.com" and "/evidence/"), build URLs from process.env.NEXT_PUBLIC_SITE_URL (see README) + `/evidence/${slug}`, with a single helper lib/evidence/url.ts#evidenceUrl(slug). CDS link type "absolute". Update components/ins/AIIEEvidenceModal.tsx and all phase UIs (CLIN factor rows, ED red-flag chips, INS decision drawer) to link to the internal route.
5. __tests__/evidence-links.test.ts: every matrix evidenceSlug resolves in the registry; every registry citation URL is well-formed https; evidenceUrl() output matches /^https?:\/\/.+\/evidence\/[a-z0-9-]+$/. Add scripts/check-evidence-links.ts (npm run evidence:check) that HTTP-HEADs every external citation URL and reports dead links (network-dependent — wire into the go-live workflow as a non-blocking warning job, document in docs/CI_KNOWN_ISSUES.md).
```

---

## Part 5 — Epic EHR Integration (icon mode, zero workflow friction)

### Prompt 5.1 — SMART on FHIR launch + embedded app shell

```
ARKA currently lives as standalone demo pages. Build the EHR-embedded delivery so ARKA runs INSIDE Epic-class EHRs as an unobtrusive icon/panel while CDS Hooks does the automation. Two pillars: (A) SMART on FHIR embedded app, (B) the existing CDS Hooks services (already hardened in 3.5) registered for EHR launch.

A. SMART on FHIR (EHR launch flow):
1. lib/ehr/smart-auth.ts: implement the SMART App Launch EHR-launch sequence — receive `iss` + `launch` params, fetch {iss}/.well-known/smart-configuration, OAuth2 authorize redirect with PKCE (S256), token exchange, store tokens in encrypted httpOnly session cookies (jose is already a dep for JWT/JWE). Scopes: `launch openid fhirUser patient/Patient.read patient/ServiceRequest.read patient/Condition.read patient/Observation.read patient/DiagnosticReport.read`. Handle refresh. {data,error} tuples, never throw.
2. app/ehr/launch/route.ts (starts auth) and app/ehr/callback/route.ts (token exchange) and app/ehr/app/page.tsx (the embedded UI).
3. The embedded UI is a COMPACT RAIL designed for Epic's sidebar dimensions (~340–420px wide, variable height, white background, NO marketing chrome, no global nav/footer — create app/ehr/layout.tsx that strips the site shell): top = patient banner pulled from the launch context (name, age, MRN masked); middle = "Active imaging orders" auto-loaded via FHIR ServiceRequest query, each with its live AIIE mini score-ring and one-line recommendation; tap → expandable detail with factor bars and evidence links (open in new tab); bottom = a quiet status row ("AIIE active · monitoring orders · v{MATRIX_VERSION}") and the FDA disclaimer in 11px.
4. ICON MODE: default state is a single 48px floating button containing the existing ArkaAnimatedLogo rendered UNMODIFIED — same component, same animation behavior and timing as everywhere else on the site (use its existing mark-only/compact variant from components/ArkaAnimatedLogo/index.ts if one fits the 48px container; do not edit the component or its CSS). The rail expands ONLY when (a) the clinician clicks the badge, or (b) a draft order scores ≤3 or has an EXPEDITE signal — then the CONTAINER (not the logo) shows a one-time pulse ring and a count badge (no sound, no modal, never steals focus). State in zustand (already a dep). This is the contract: ARKA never interrupts; it signals.
5. Demo/sandbox support: when NEXT_PUBLIC_EHR_DEMO=1, app/ehr/app runs against fixtures in sandbox-fixtures/ so the embedded experience is demoable without a live EHR, and add a "Launch simulated EHR" button on /docs/integrations showing the rail inside a mock EHR chrome screenshot frame.

B. Registration & docs: create docs/integrations/epic-deployment.md covering: CDS Hooks service registration (discovery endpoint app/api/cds-services/route.ts, the hooks consumed: order-select, order-sign, appointment-book), SMART app registration fields (redirect URIs, scopes, public client + PKCE), required FHIR resources, and the icon-mode UX contract. Add JWT validation of incoming CDS Hooks requests per the CDS Hooks security model (verify iss/aud against an allowlist in env, JWKS fetch + cache) in the request validator from 3.5 — enabled when CDS_JWT_REQUIRED=1 so local demos still work.

Acceptance: `npm run build` passes; /ehr/app renders in demo mode inside a 360px-wide viewport with zero horizontal scroll; the icon→rail expansion is animated (200ms) and keyboard accessible; no PHI persisted server-side (tokens in cookies only, patient data rendered client-side from FHIR responses).
```

### Prompt 5.2 — Silent automation & write-back

```
Extend the EHR integration so ARKA automates documentation without clinician effort, building on lib/aiie/requisition-autofill.ts and the matrix:

1. lib/ehr/writeback.ts: when a clinician accepts a CDS suggestion card (via the 3.5 feedback endpoint or the rail UI), construct the updated FHIR ServiceRequest: corrected modality coding, reasonCode completed from the matched scenario's ICD-10, supportingInfo reference to the AIIE evidence URL, and an annotation note "Order optimized by AIIE vX — clinician approved". Write back only with explicit user action (the accept click) using the SMART token; never silent writes to orders.
2. Silent documentation assist (allowed): auto-generate the prior-auth / medical-necessity narrative for INS from the matrix rationale + factor breakdown (lib/aiie/requisition-autofill.ts extended), attached to the card as a copyable block and posted to the decision log. This removes the PA paperwork burden invisibly.
3. Audit everything: every rail render, card view, accept, override → decision-log with hashed patient id, no PHI, timestamps, matrix version. Add app/ins/dashboard surfacing of automation stats (narratives generated, clicks saved estimate).
4. Tests: writeback payload golden tests; a fixture-driven rail e2e (vitest + testing-library) covering icon → expand → accept → writeback payload assertion.
```

---

## Part 6 — Verification & Launch Quality Gate

### Prompt 6.1 — Full QA sweep

```
Run a release-quality verification pass over the entire ARKA platform and fix everything found:

1. `npm run build`, `npm run lint`, full vitest suite, `npm run matrix:coverage`, `npm run evidence:check` — all green (evidence:check warnings triaged).
2. Dead link audit: crawl every internal href in app/ (write scripts/check-internal-links.ts that statically extracts hrefs from the route manifest + rendered nav registries and asserts each maps to an existing route). Zero broken internal links.
3. Lighthouse (per README target): performance and a11y ≥ 90 on /, /clin, /ed, /ins/dashboard, /rural, /evidence/[any]. Fix LCP (preload hero font, dynamic-import heavy charts), CLS (explicit dimensions), a11y (contrast on teal-on-white must use teal-600+, all interactive elements labeled).
4. Cross-check the .cursorrules contracts still hold: FDA sentence on every card detail, ins_ table prefixes untouched, no `any`, JSDoc on exports, {data,error} tuples, 800ms p95 on API routes (log review).
4b. MOTION REGRESSION CHECK: `git diff` on components/ArkaAnimatedLogo/ must be empty across the entire revamp — if anything changed it, revert. Confirm the logo renders at its original size with its original animation in the header, footer, and EHR icon badge. Spot-check that pre-existing transitions (tailwind `transition-*` usages and the original fadeIn/slideUp/pulseGlow keyframes) kept their original timing/easing — the 300ms default must still be in tailwind.config.ts.
5. Update README.md deployment checklist with the new gates (matrix coverage, evidence links, EHR demo mode) and tick what passes. Produce docs/RELEASE_NOTES_REVAMP.md summarizing: new design system, four phase UIs, AIIE Clinical Knowledge Matrix (scenario/variant/rating counts from the coverage report), evidence system, Epic integration. No marketing fluff — engineering facts.
```

---

## Suggested execution order & commit plan

| Order | Prompt | Commit message |
|---|---|---|
| 1 | 0.1–0.3 | `feat(design): token system, premium primitives, global chrome` |
| 2 | 1.1–1.2 | `feat(landing): flagship landing + trust surfaces` |
| 3 | 3.1–3.2 | `feat(aiie): knowledge matrix schema + clinical content` |
| 4 | 3.3–3.4 | `feat(aiie): deterministic resolver + exhaustive coverage tests` |
| 5 | 4.1 | `feat(evidence): first-party evidence registry + routes, fix dead links` |
| 6 | 3.5 | `feat(cds): production-hardened CDS Hooks services` |
| 7 | 2.1–2.4 | `feat(phases): CLIN/ED/INS/RURAL UI overhaul` (4 commits) |
| 8 | 5.1–5.2 | `feat(ehr): SMART on FHIR icon-mode integration + automation` |
| 9 | 6.1 | `chore(release): QA gate + release notes` |

Engine prompts (Part 3–4) run before phase UIs (Part 2) so the new UIs bind to the final score/evidence contracts and you never wire components twice.

**Why this ordering matters:** the matrix + resolver change the `AIIEScore` shape (`matrixMatch`, evidence slugs). Building the phase UIs first would mean rework. Design system goes first because every subsequent diff renders against it.
