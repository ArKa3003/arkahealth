# ARKA Front-Page Revenue-First Rewrite — Cursor Prompt Library

**Goal:** Transform the homepage into a **revenue-first, Problem→Solution** narrative that matches the demo video script (`ARKA_unified_demo_video_script_v3.md`) beat-for-beat. A clinical worker (or a CFO) should read the top of the page and *groan in recognition* at the denial / prior-auth pain — then exhale when ARKA resolves it, with hard numbers, regulatory reassurance, and a promise of zero workflow change. The page's spine is the script's spine, in this order of emphasis: **recover the revenue you're already losing to denials → pass every regulation by design → never touch the doctor's workflow.**

**Companion docs:** `ARKA_REVENUE_FIRST_UNICORN.md` (all copy, numbers, and sources) + `docs/ARKA-INS_Payer_Pitch.md` (denial/ROI economics) + `ARKA_unified_demo_video_script_v3.md` (the video this page must stay in lockstep with — same claims, same numbers, same honesty rule).

**Stack reality (do not change):** Next.js (App Router) · React · TypeScript strict · Tailwind (tokens in `tailwind.config.ts`) · framer-motion · lucide-react · `@/...` alias. Landing sections live in `components/landing/*` and are composed in `app/page.tsx`.

**Design tokens you must reuse (already defined):**
`arka-navy` / `arka-bg-dark` `#0F172A` · `arka-bg-medium` `#1E293B` · `arka-teal` & `arka-cyan` `#14B8A6` · `arka-bg-alt` `#F1F5F9` · `arka-bg-light` `#F8FAFC` · text on dark: `arka-text` / `arka-text-soft` · text on light: `arka-text-dark` / `arka-text-dark-muted`. Buttons: `.arka-button-primary`, `.arka-button-secondary`. Routes: `lib/constants.ts` (`routes.ins`, `routes.cdsHooksDemo`, `routes.clinSuite`, `routes.regulatoryRationale`).

---

## How to use this file

Run the prompts **in order** — each is additive and self-contained. Paste one prompt at a time into Cursor (Cmd/Ctrl-K or the chat), let it complete and build, then move to the next. **Prompt 0** is the shared guardrail block — paste it once at the start of the session (or drop it into `.cursorrules`) so every later prompt inherits it.

## 🔴 The two-lane numbers rule (read once — identical to the video script)

**Two kinds of numbers appear on this page. Keep them in their lanes — investors and CFOs both check.** This mirrors the "READ THIS BEFORE YOU EDIT" banner in `ARKA_unified_demo_video_script_v3.md`; the website and the video must never disagree.

1. **Measured product metrics** (the validation dashboard at `routes.cdsHooksDemo` + `/validation`). These must match what's actually rendered: **three-class accuracy 74% on the synthetic ACR-aligned validation cohort; real-world AUC pending pilot data.** Do **not** inflate them. The honesty *is* the credibility moat.
2. **Modeled revenue figures** (the ROI model in `ARKA_REVENUE_FIRST_UNICORN.md`, Appendix A/B). These are *sourced, conservative ranges* (CAQH, KFF, MGMA, AMA, ACR) — not measured outcomes. Every time a dollar figure appears on screen it carries a small **"Modeled estimate"** footnote. This keeps the dollar claims legally clean for a Non-Device CDS product. Never present a modeled figure as a measured result, and never invent a number that isn't in Appendix A.

| Claim on the page | What it is | Required treatment |
|---|---|---|
| "~$3.5M recovered/yr", "~$0.5M throughput", "$1,180/order", "2.3× ROI", "$0.30–$0.50 PMPM" | Modeled (sourced ranges) | Footnote "Modeled estimate"; conservative column only |
| "20–40% denied · ~86% avoidable · ~half never reworked" | Sourced industry ranges (AHA/Premier; Change Healthcare; MGMA) | Fine to state plainly; they are cited figures |
| "74% three-class accuracy" | Measured (synthetic ACR cohort) | Must match the validation dashboard; always pair with "real-world AUC pending" |
| "<800ms", "35–40% auto-clear" | Product / modeled | Plain is fine; trace to the engine + UHC program data |

---

## Prompt 0 — Shared guardrails (paste first, once)

```
You are editing the ARKA Health marketing site (Next.js App Router, React, TypeScript strict,
Tailwind, framer-motion, lucide-react). Repo root is the open folder. We are doing a REVENUE-FIRST
rewrite of the homepage that must stay in lockstep with ARKA_unified_demo_video_script_v3.md — same
claims, same numbers, same honesty. Apply these rules to every change in this session:

## Hard constraints
1. ADDITIVE & MINIMAL. Only touch files I name. Do not refactor unrelated code, do not rename exports,
   do not change routing, do not touch /app/clin*, /app/ed*, /app/ins*, /app/rural*, or any /api route.
2. REUSE THE DESIGN SYSTEM. Use only existing Tailwind tokens (arka-navy, arka-bg-dark, arka-bg-medium,
   arka-teal, arka-cyan, arka-bg-alt, arka-bg-light, arka-text, arka-text-soft, arka-text-dark,
   arka-text-dark-muted) and the existing .arka-button-primary / .arka-button-secondary classes.
   Match the existing framer-motion fade-in pattern (initial opacity:0,y:24 → animate on inView).
3. ACCESSIBILITY. Keep one <h1> on the page. Section headings are <h2>. Maintain WCAG AA contrast
   (dark text on light bg, light text on dark bg — never teal text on white for body copy). Every
   interactive control has a visible focus ring and min 44px hit target. Decorative SVG is aria-hidden.
4. FDA NON-DEVICE POSTURE IS BINDING. ARKA is Non-Device CDS under §520(o)(1)(E). Marketing copy may
   say ARKA "supports", "documents", "recommends", "flags", "recovers revenue", "reduces denials".
   It may NOT say ARKA "diagnoses", "auto-approves without a clinician", "guarantees" outcomes, or
   "replaces clinical judgment". ARKA never analyzes image pixels — it evaluates whether to order the
   study. Keep "the ordering clinician retains the final decision" available for the reassurance block.
5. NUMBERS ARE FIXED, AND THEY HAVE TWO LANES. Use ONLY the figures I give you in each prompt.
   (a) MODELED dollar/ROI figures (~$3.5M, ~$0.5M, $1,180, 2.3×, $0.30–$0.50 PMPM) must carry a
   "Modeled estimate" footnote marker. (b) The one MEASURED metric — 74% three-class accuracy on the
   synthetic ACR-aligned cohort — must match the validation dashboard and ALWAYS appear paired with
   "real-world AUC pending pilot data." Never present a modeled figure as measured; never invent a
   number not in ARKA_REVENUE_FIRST_UNICORN.md Appendix A.
6. TypeScript strict, no `any`, JSDoc on new exported components, "use client" only where motion/state
   is used (matches existing landing components).

## Voice
Lead with the PROBLEM in the clinician's / CFO's own words (they should groan in recognition), then
resolve with ARKA + a hard number. EHR mentions are always "Epic, Cerner, and Athena." Acknowledge
these rules and wait for the first task.
```

---

## Prompt 1 — Rewrite the Hero into a revenue-first hook (`components/landing/Hero.tsx`)

```
Edit ONLY components/landing/Hero.tsx.

Keep the existing visual scaffolding intact: the <ArkaAnimatedLogo>, the HeroGridPattern,
HeroRadarRings, HeroParticles, HeroScanLine, the DemoModal, the dark gradient section, and all
framer-motion timing. Do NOT remove the animated logo or the background effects.

Change ONLY the copy and the CTAs:

1. Replace the eyebrow line "Advanced Radio-imaging Knowledge Architecture" with a small teal
   eyebrow: "REVENUE-FIRST IMAGING DECISION SUPPORT".

2. Make the headline VISIBLE (it is currently sr-only). Add a visible <h1> below the logo, large and
   bold in arka-text (white), reading exactly:
   "You did the scan. Now get paid for it."
   Keep it as the single <h1> on the page. Animate it with the existing fade-in (delay ~0.2).

3. Replace the subhead "Cutting-Edge clinical decision support that never misses." with:
   "Imaging prior-auth denials run 20–40% — and ~86% of them were avoidable. ARKA is one engine that
   runs on both sides of the prior-auth wall — the doctor's and the payer's — documenting the clinical
   justification at the moment the order is placed, inside Epic, Cerner, and Athena, in under 800ms,
   without adding a single click. Clean claims go out the first time."
   Use arka-text-soft, max-w-2xl, centered.

4. CTAs (keep the three-button layout and styles):
   - Primary (.arka-button-primary): label "See the revenue model" → links to the #revenue section
     (use next/link, or keep the scroll-to behavior but point at the new #revenue section id —
     prefer linking to "#revenue" which Prompt 4 will create).
   - Secondary (.arka-button-secondary, keep the Play icon + DemoModal trigger): label "Watch 90-sec demo".
   - The outlined full-width link stays, label unchanged-in-spirit:
     "See ARKA live inside an EHR (CDS Hooks demo)" → routes.cdsHooksDemo.

5. Add a single, small reassurance line under the CTAs in arka-text-soft/70, text-xs:
   "Non-Device CDS · No FDA 510(k) · CMS-0057-F ready · the ordering clinician keeps the final call."

Do not change the file's imports beyond what's needed. Keep "use client". Build must pass.
```

---

## Prompt 2 — New "The bleed" Problem section (`components/landing/ProblemSection.tsx`)

```
Create a NEW component components/landing/ProblemSection.tsx ("use client"), styled to match the
existing landing sections (see components/landing/WhyArka.tsx for the exact section/heading/motion
pattern). This is the GROAN section — it names the pain in the clinician's and rev-cycle team's own
words. Light background (bg-arka-bg-alt), border-t border-arka-light, py-24, scroll-mt-14,
id="the-problem".

Heading (<h2>, arka-text-dark): "The work got done. The money didn't show up."
Sub (arka-text-dark-muted, max-w-2xl, centered): "Every imaging team knows this loop. ARKA breaks it."

Render a responsive grid (sm:grid-cols-2) of FOUR pain cards. Each card: white bg, rounded-xl,
border-arka-light, shadow-card, hover:-translate-y-1, a lucide icon in an arka-teal/15 rounded badge,
a bold arka-text-dark title, and arka-text-dark-muted body. Use these exact contents:

1. icon FileX → title "The denial nobody saw coming"
   body: "The scan was justified. The auth bounced six weeks later over one line of documentation no
   one asked for — and now it's a write-off. Prior-auth denial rates on advanced imaging run 20–40%."
2. icon Repeat → title "The appeal you can't afford to file"
   body: "Roughly half of denied claims are never reworked — the appeal costs more staff time than the
   claim is worth. So the hospital eats earned revenue, and a nurse loses hours to a payer hold line."
3. icon Clock → title "The backlog on your best-margin line"
   body: "Imaging is one of the highest-margin service lines you run. Every order stuck waiting on
   auth is a scan not completed this month — slow approvals are slow revenue."
4. icon BellOff → title "The tool everyone deletes in a week"
   body: "The last 'AI' tool flagged everything, interrupted every order, and added five clicks. The
   team clicked past it until it was switched off. Sound familiar?"

Add a closing line under the grid, centered, arka-text-dark font-medium:
"~86% of imaging denials are avoidable. The fix has to happen where the order is placed — not in the
billing office six weeks later."

Use framer-motion useInView with the same fadeIn object the other sections use. Default export a named
export `ProblemSection` (match the codebase's named-export convention). Do not wire it into the page yet.
```

---

## Prompt 3 — Rewrite `WhyArka.tsx` into "How ARKA pays for itself"

```
Edit ONLY components/landing/WhyArka.tsx. Keep the exact section structure, motion, grid, and card
styling — change only the heading, sub, and the three benefit objects so they are money-first and map
to the three front-facing pillars. Keep id but you may rename the heading.

Heading (<h2>): "How ARKA pays for itself"
Sub: "Three reasons a CFO signs — and a physician never notices."

Replace the `benefits` array with these three (keep icon usage from lucide-react; swap icons to the
ones named):

1. icon TrendingUp → title "Recover revenue you already earned"
   description: "ARKA documents medical necessity at the point of order, so claims go out clean.
   Modeled recovery: ~$3.5M/yr in avoidable imaging denials for a mid-sized system.*"
2. icon ShieldCheck → title "Pass every regulation by design"
   description: "Non-Device CDS under §520(o)(1)(E) — no FDA 510(k). HIPAA-safe federated learning,
   no raw PHI moved. A CMS-0057-F Da Vinci PAS endpoint shipping in production today."
3. icon MousePointerClick → title "Zero change to the doctor's workflow"
   description: "Non-blocking, in-flow, under 800ms, inside Epic, Cerner, and Athena. Silent unless a
   guideline fires. 35–40% of orders auto-clear and never enter a queue. No new screen, ever."

Add an asterisk footnote line beneath the grid (arka-text-dark-soft, text-xs):
"*Modeled estimate; sourced ranges in ARKA's revenue model. ARKA is decision support — the ordering
clinician retains the final decision."

Do not change anything else in the file.
```

---

## Prompt 4 — New "Revenue model" proof strip (`components/landing/RevenueProof.tsx`)

```
Create a NEW component components/landing/RevenueProof.tsx ("use client"). This is the numbers section
the hero's primary CTA scrolls to. DARK section to contrast the light ones around it:
bg-arka-bg-dark (or the gradient-hero), py-24, scroll-mt-14, id="revenue". Use arka-text / arka-text-soft
for copy and arka-teal/arka-cyan for the stat numbers.

Heading (<h2>, arka-text): "The math a CFO can sign"
Sub (arka-text-soft, max-w-2xl): "Modeled for a regional hospital group running ~120,000 advanced
imaging studies a year — the conservative case."

A) A row of FOUR big stat tiles (grid, sm:grid-cols-2 lg:grid-cols-4). Each: huge arka-cyan number,
   small arka-text-soft label. Use exactly:
   - "~$3.5M"  → "recovered/yr in avoidable imaging denials*"
   - "86%"     → "of imaging denials are avoidable"
   - "<800ms"  → "to score an order, in-flow, no extra click"
   - "35–40%"  → "of orders auto-clear and never hit a queue"

B) A short "from one order to a system" scale line (arka-text-soft, max-w-2xl, centered), to mirror the
   demo's ROI moment: "One guideline-redirected order: ~$1,180 avoided.* Scale that across 120,000
   studies and the conservative recovery is ~$3.5M/yr — plus roughly ~$0.5M in faster throughput on
   your highest-margin line."

C) Below it, a compact "where the money comes from" list (4 items, lucide Check icons in teal),
   matching the §3.3 levers from the strategy doc:
   - "Denial recovery — clean documentation at the point of order converts would-be denials to clean pays."
   - "Rework labor avoided — fewer denials means fewer appeals to staff."
   - "Throughput defense — faster approvals shorten the backlog on your highest-margin line (~$0.5M*)."
   - "Admin redirected — auto-approval removes human touch from clean orders."

D) A pricing line (arka-text-soft, text-sm, centered): "Priced at ~$0.30–$0.50 PMPM — a modeled ~2.3×
   first-year return.*"

E) A primary CTA button (.arka-button-primary): "See the full ROI breakdown" → routes.ins.

F) Footnote (arka-text-soft/60, text-xs): "*Modeled, conservative estimate using published CAQH, KFF,
   MGMA, AMA, and ACR figures; aggressive case ~1.5×. ARKA is Non-Device CDS — figures are
   decision-support economics, not a guarantee of outcomes."

Match the existing framer-motion fadeIn pattern. Named export `RevenueProof`. Do not wire into the page yet.
```

---

## Prompt 5 — New regulatory + workflow + validation reassurance band (`components/landing/TrustBand.tsx`)

```
Create a NEW component components/landing/TrustBand.tsx ("use client"). Light section
(bg-arka-bg-light), border-t border-arka-light, py-20, id="trust". This closes the two objections a
buyer raises after "how much do we make?": "will it clear our regulators?" and "will my doctors revolt?"
— and then earns trust with an honest validation line.

Heading (<h2>, arka-text-dark): "Built to clear the two reviews that kill health tech"
Two columns (md:grid-cols-2), each a white rounded-xl bordered card:

Left card — lucide ShieldCheck badge, title "Regulatory: clears by design":
A short bulleted list (real <ul>, blank line before it; arka-text-dark-muted):
- "Non-Device CDS under §520(o)(1)(E) — no FDA 510(k), no device timeline. ARKA evaluates whether to
  order the study; it never analyzes image pixels."
- "Rules-first and citation-first: every recommendation cites a published guideline (ACR / RAND-UCLA),
  every ML factor paired with rationale (SHAP)."
- "HIPAA-safe: federated learning moves encrypted model updates, never patient records."
- "CMS-0057-F ready: real, live Da Vinci CRD/DTR/PAS endpoints in production now (discovery at
  /.well-known/cds-services), ahead of the Jan 2027 mandate."
Add a small link "Read the regulatory rationale →" → routes.regulatoryRationale.

Right card — lucide MousePointerClick badge, title "Workflow: doctors never notice":
- "Lives inside Epic, Cerner, and Athena via HL7 CDS Hooks — no new app, no second login."
- "Non-blocking: ARKA informs an order, it cannot stop one. The clinician keeps the final call."
- "Silent unless a guideline fires — no alert fatigue, no flag-everything noise."
- "Under 800ms, non-modal, with a one-click neutral override."

Below the two cards, a full-width honest-validation strip (centered, arka-text-dark-muted, text-sm),
matching the video's "honesty is the moat" beat:
"Measured today: 74% three-class accuracy on our synthetic, ACR-aligned validation cohort — real-world
AUC is pending pilot data. We publish what we've measured and label what we've modeled."
Add a small link "See the validation dashboard →" → routes.cdsHooksDemo + "/validation" (or the
validation route if defined in lib/constants.ts).

Match the existing motion/heading patterns. Named export `TrustBand`. Do not wire into the page yet.
```

---

## Prompt 6 — New "platform, not a feature" band (`components/landing/PlatformBand.tsx`)

```
Create a NEW component components/landing/PlatformBand.tsx ("use client"). Dark section to echo the
revenue strip: bg-arka-bg-medium (or gradient-hero), border-t border-arka-bg-dark, py-24,
scroll-mt-14, id="platform". This is the demo's "imaging is just the wedge" beat — it turns a product
into a platform.

Heading (<h2>, arka-text): "Imaging is the wedge, not the whole company"
Sub (arka-text-soft, max-w-2xl): "One decision engine, four surfaces — the same math on both sides of
the prior-auth wall."

Render a responsive grid (sm:grid-cols-2) of FOUR surface cards (each: rounded-xl,
bg-arka-bg-dark/60, border-arka-bg-dark, a lucide icon in an arka-teal/15 badge, bold arka-text title,
arka-text-soft body):
1. icon Stethoscope → "ARKA-CLIN" → "The provider-side appropriateness + denial-risk engine — what the
   demo shows."
2. icon ShieldCheck → "ARKA-INS" → "The same engine on the payer's side: CMS-0057-F Da Vinci PAS,
   shipping today."
3. icon GraduationCap → "ARKA-ED" → "Trains residents to order appropriately — filling the gap left by
   the repealed PAMA AUC mandate."
4. icon MapPin → "ARKA RURAL" → "Resource-aware decision support for low-capacity and rural sites."

Closing line under the grid (centered, arka-text font-medium):
"At ~$0.30–$0.50 PMPM, a modeled ~2.3× first-year return* — and the same engine reaches into the
~$10B appropriateness layer of American medicine."

Footnote (arka-text-soft/60, text-xs): "*Modeled estimate; sourced ranges in ARKA's revenue model."

Match the existing framer-motion fadeIn pattern. Named export `PlatformBand`. Do not wire into the page yet.
```

---

## Prompt 7 — Wire the new sections into the page (`app/page.tsx`) + update metadata

```
Edit ONLY app/page.tsx.

1. Import the new components: ProblemSection, RevenueProof, TrustBand, PlatformBand from
   "@/components/landing/...".
2. Reorder the homepage to this Problem→Solution flow (keep all existing components, just insert):
     <Hero />
     <ProblemSection />        // the groan
     <RevenueProof />          // the money (hero CTA scrolls here, id="revenue")
     <WhyArka />               // how it pays for itself (3 pillars)
     <TrustBand />             // regulatory + workflow + honest validation
     <PlatformBand />          // imaging is the wedge — 4 surfaces, pricing, $10B layer
     <PhaseCards />            // explore the platform
     <EcosystemDiagram />
     <Testimonials />
     <CtaSection />
3. Update the exported `metadata`:
   title stays "Home"; set description to:
   "ARKA recovers imaging revenue lost to prior-auth denials — clean documentation at the point of
   order, inside Epic, Cerner, and Athena, with zero workflow change. Non-Device CDS, CMS-0057-F ready."
   Mirror the same text into openGraph.title ("ARKA — Get paid for the imaging you already do") and
   openGraph.description.

Build must pass. Do not touch any other file.
```

---

## Prompt 8 — Update the closing CTA to the CFO one-liner (`components/landing/CtaSection.tsx`)

```
Edit ONLY components/landing/CtaSection.tsx. Keep all structure, motion, and button styles.

- Heading: "Find out what you're leaving on the table."
- Paragraph: "ARKA recovers revenue you're already losing to denials, speeds up your highest-margin
  service line, and reduces the admin burden doing it — without changing how your physicians order."
- Primary button label: "See the revenue model" → change href to "#revenue".
- Secondary button label: "Explore the platform" → keep href "#solutions".
- Optional small brand line beneath the buttons (arka-text-soft/70, text-xs):
  "remARKAbly precise — and remarkably profitable."

Nothing else changes.
```

---

## Prompt 9 — Verification pass (run last)

```
Verification only — do not add features.

1. Run the production build (npm run build). Fix any type or lint error introduced by the homepage
   changes; do not silence errors with `any` or @ts-ignore.
2. Confirm there is exactly one <h1> on "/" (the Hero headline) and all section titles are <h2>.
3. Confirm the hero primary CTA and the closing CTA both scroll to id="revenue", and that
   RevenueProof renders with id="revenue".
4. Grep the homepage components for banned marketing verbs and fix any: ensure no copy says
   "diagnose", "guarantee", "replaces clinical judgment", or "auto-approve" without a clinician, and
   no copy claims ARKA analyzes images/pixels. Confirm the "modeled estimate" footnotes are present
   under WhyArka, RevenueProof, and PlatformBand.
5. NUMBERS-IN-LANES CHECK. Confirm every modeled dollar/ROI figure (~$3.5M, ~$0.5M, $1,180, 2.3×,
   $0.30–$0.50 PMPM) carries a "Modeled estimate" footnote, and that the ONLY measured metric on the
   page — "74% three-class accuracy" — appears paired with "real-world AUC pending pilot data" and
   matches the validation dashboard. No measured figure may be presented as modeled, or vice versa.
6. Start the app and run the Lighthouse a11y audit (npm run test:a11y). Report the accessibility and
   performance scores; both should stay >90. Confirm AA contrast on the dark RevenueProof and
   PlatformBand sections (teal numbers on dark bg) and light sections.
7. Take a full-page screenshot of "/" at desktop and mobile widths and confirm the Problem→Revenue→
   WhyArka→Trust→Platform order reads as a single narrative.
8. Summarize what changed, the before/after of the hero copy, and any contrast or build issues found.
```

---

## Optional Prompt 10 — Tighten the nav CTA to match (only if you want full alignment)

```
Edit ONLY components/navigation/Navbar.tsx. If there is a primary nav CTA button, relabel it to
"See revenue model" pointing at "/#revenue" (or routes.ins). Do not change nav links, layout, mobile
menu behavior, or anything else. If no such button exists, make no change and report that.
```

---

### Copy reference card (so every surface uses the same numbers as the video)

| Surface | Headline | Key number |
|---|---|---|
| Hero | "You did the scan. Now get paid for it." | 20–40% denial rate · 86% avoidable · <800ms · both sides of the wall |
| Problem | "The work got done. The money didn't show up." | ~86% avoidable · ~half never reworked |
| Revenue | "The math a CFO can sign" | $1,180/order · ~$3.5M/yr · ~$0.5M throughput · 86% · <800ms · 35–40% · 2.3× ROI |
| WhyArka | "How ARKA pays for itself" | ~$3.5M/yr · no 510(k) · 35–40% auto-clear |
| Trust | "Built to clear the two reviews that kill health tech" | §520(o)(1)(E) · CMS-0057-F · 74% three-class (AUC pending) |
| Platform | "Imaging is the wedge, not the whole company" | 4 surfaces · ~$0.30–$0.50 PMPM · 2.3× · ~$10B layer |
| CTA | "Find out what you're leaving on the table." | — |

All figures trace to `ARKA_REVENUE_FIRST_UNICORN.md` Appendix A and match `ARKA_unified_demo_video_script_v3.md`. Keep the "modeled estimate" footnote anywhere a dollar figure appears; keep "74% three-class accuracy" paired with "real-world AUC pending" everywhere it appears.
