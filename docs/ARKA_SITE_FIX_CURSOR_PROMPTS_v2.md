# ARKA Website Fix — Cursor Prompt Pack v2

**Date:** 2026-06-11
**Repo:** `arkahealth` (Next.js App Router, Tailwind, framer-motion)
**How to use:** Paste each prompt into Cursor **one at a time, in order**. Each prompt is self-contained, names the exact files involved, and ends with verification steps. After each prompt, run `pnpm dev`, verify in the browser, commit, then move to the next. Do NOT batch multiple prompts into one Cursor message — smaller scopes produce dramatically better results.

**Key file map discovered in this repo (referenced throughout):**

| Concern | File(s) |
|---|---|
| Homepage composition | `app/page.tsx` (Hero → GetPaid → Problem → RevenueProof → WhyArka → TrustBand → PlatformEcosystem → Testimonials → Cta) |
| Hero section | `components/landing/Hero.tsx` |
| CDS Hooks mini-demo in hero | `components/landing/HeroSimulation.tsx` |
| Navbar | `components/navigation/Navbar.tsx` (links: Platform / Phases / Evidence / ROI / Docs / Sign in / Book a demo) |
| Animated logo (already vendored) | `components/ArkaAnimatedLogo/` — exports `ArkaAnimatedLogo`, `ArkaAnimatedLogoCSS`, `ArkaLogoSimple`, `ArkaLogoStatic` from `index.ts` |
| Platform orbit diagram (says "AIIE") | `components/landing/PlatformOrbit.tsx` (label at ~line 139) + `components/landing/PlatformEcosystem.tsx` |
| Testimonials (mock quotes) | `components/landing/Testimonials.tsx` |
| Bottom CTA (missing Evidence/Action Plan buttons) | `components/landing/CtaSection.tsx` |
| Sign in (currently a mailto:) | `lib/navigation/routes.ts` → `SIGN_IN_MAILTO`, used in `Navbar.tsx` + `MobileMenuSheet.tsx` |
| AIIE vs ACR comparison (exists, orphaned) | `components/demos/ed/IntroducingAIIESection.tsx` — **not rendered anywhere on the homepage** |
| ARKA-ED page | `app/ed/page.tsx` + `components/demos/ed/EdPageClient.tsx`, quiz components: `CaseViewer.tsx`, `QuizTimer.tsx`, `HintSystem.tsx`, `LearningModeToggle.tsx`, `FeedbackPanel.tsx`, `ed-cockpit-cases.ts` |
| Evidence library | `app/evidence/page.tsx`, `app/evidence/[slug]/page.tsx`, `components/evidence/EvidenceIndexClient.tsx`, nav "Evidence" opens a **modal** via `components/shared/compliance/evidence-modal-context.tsx` |
| Feature Rationale Catalogue | `app/docs/feature-catalog/page.tsx` |
| Rural Intelligence map | `components/demos/rural/intelligence/ImagingDesertMap.tsx` → `components/demos/rural/shared/MapVisualization.tsx`, data in `lib/demos/rural/intelligence/imaging-desert-data.ts` |
| Footer | `components/navigation/Footer.tsx` |
| Global styles / page shell | `styles/globals.css`, `app/layout.tsx` |
| Real testimonial source text | `docs/ARKA_DEMO_FIX_CURSOR_PROMPTS.md` lines 68–82 |
| Security & Compliance page prompt pack | `docs/ARKA_SECURITY_PAGE_CURSOR_PROMPTS.md` (8 prompts → builds `/security`, `lib/security/compliance-data.ts`, `components/security/**`) |

---

 ## PROMPT 0 — Pre-flight context (paste first, before anything else)

```
You are working in the arkahealth Next.js App Router repo. Before making any changes, read and internalize these conventions — every subsequent task must follow them:

1. Styling: Tailwind with custom design tokens (arka-teal-*, arka-slate-*, surface, surface-dark, surface-dark-raised, surface-sunken, border-subtle, radius-* and elevation-* utilities). NEVER hard-code hex colors in JSX when a token exists. Read styles/globals.css and tailwind config to learn the tokens.
2. Animation: framer-motion is already a dependency. All scroll-reveal sections use the pattern in components/landing/Testimonials.tsx (useInView + motion with initial {opacity:0, y:24}). Reuse that pattern. Every animation MUST respect prefers-reduced-motion via useReducedMotion() — see components/ArkaAnimatedLogo/ArkaAnimatedLogo.tsx for the canonical example.
3. Buttons: use buttonVariants from components/ui/Button.tsx (variants: premium, ghost; sizes: sm, lg). Min touch target 44px (`min-h-[44px] touch-manipulation`).
4. Routes are centralized in lib/constants.ts (`routes` object) and lib/navigation/routes.ts. New pages must be registered there, in app/sitemap.ts, and in the footer.
5. Accessibility: every interactive element needs focus-visible rings (focus-visible:ring-2 focus-visible:ring-arka-teal-500), aria-labels, and sr-only live regions where content animates.
6. Dark sections use bg-surface-dark with text-white/text-arka-slate-300; light sections use bg-surface/bg-surface-sunken with text-arka-slate-900/600. NEVER place slate-300 text on light backgrounds or slate-700 on dark — this exact bug exists today in the navbar.
7. After every change run: pnpm lint && pnpm tsc --noEmit && pnpm build. Fix all errors before declaring done.

Reply "ready" and wait for my first task. Do not modify anything yet.
```

---

## PROBLEM 1 — Hero logo, invisible navbar, stuck CDS Hooks mini-demo

### PROMPT 1A — Add the large animated ARKA logo to the hero (first thing you see)

```
TASK: Make the animated ARKA logo the centerpiece of the homepage hero, exactly like the previous version of the site: large, centered, the very first thing a visitor sees, with the "remARKAbly precise" tagline drawing in beneath it. It must look flagship-grade.

CONTEXT — everything you need already exists in this repo:
- components/ArkaAnimatedLogo/ArkaAnimatedLogo.tsx is a fully built framer-motion SVG logo (viewBox 0 0 800 900). Props: width, height, animate (default true), idleAnimations (default true — radar pulses, floating medical symbols, continuous idle motion), animationSpeed, onAnimationComplete, className. Its entrance sequence is ~2.5s: rings draw on, spear assembles, ARKA letters reveal, precision dots pop in with radar pulses, then the italic "remARKAbly precise" tagline writes itself with an underline.
- It is currently used ONLY at 40px in the navbar (components/navigation/Navbar.tsx, NavLogo const). The hero (components/landing/Hero.tsx) has NO logo at all — that is the bug.

IMPLEMENT in components/landing/Hero.tsx:
1. Inside the hero <section> (the one with className "hero-ambient-gradient bg-grain relative flex min-h-[100dvh] ..."), insert the logo block ABOVE the eyebrow <p> ("Cutting edge imaging decision support"), as the first child of the centered column:

   <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[600px]" aria-label="ARKA — remARKAbly precise">
     <ArkaAnimatedLogo
       width={600}
       height={675}
       animate
       idleAnimations
       className="h-auto w-full drop-shadow-[0_0_60px_rgba(20,184,166,0.25)]"
     />
   </div>

   Import: `import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";`
   NOTE: the component is "use client" and Hero.tsx is already "use client", so a direct import is fine. Do NOT wrap in next/dynamic with ssr:false — the component already self-gates animation until hydration (isMounted state), and we want the static SVG in the SSR payload to avoid layout shift.

2. Presentation polish (this must look impressive, not just pasted in):
   - Add a soft radial glow behind the logo: an absolutely-positioned div behind it with `bg-[radial-gradient(closest-side,rgba(20,184,166,0.18),transparent)] blur-2xl` sized ~120% of the logo, aria-hidden.
   - Stagger the rest of the hero copy so it enters AFTER the logo entrance: wrap the eyebrow, h1, paragraph, CTA row, and compliance line in motion.div elements that fade/slide in (opacity 0→1, y 16→0, duration 0.5) with delays 1.6s, 1.8s, 2.0s, 2.2s, 2.4s respectively, so the page choreography reads: logo draws → headline lands → CTAs land. Under prefers-reduced-motion all delays collapse to 0 and everything renders visible immediately.
   - The hero already uses min-h-[100dvh]; rebalance vertical padding (reduce pt-24 if needed) so logo + headline + CTAs all fit above the fold on a 13" laptop (900px viewport height). The HeroSimulation card below may sit just below the fold — that is fine.
3. Mobile: at <640px the logo max-width is 420px and idle animations remain on; verify no horizontal overflow (body already has overflow-x-hidden).
4. Performance guardrails: the logo animates transform/opacity only (already GPU-hinted). Lighthouse performance on / must not drop more than 3 points; if it does, pass idleAnimations={false} on mobile only via a useMediaQuery hook — but keep them on desktop.

VERIFY:
- Hard-refresh /: the FIRST thing visible is the large ARKA logo playing its full entrance (rings draw, spear assembles, tagline writes), then the headline and buttons cascade in beneath it.
- The navbar 40px logo still works and is unchanged.
- With OS "reduce motion" enabled: static logo, no entrance, all copy visible instantly.
- pnpm build passes; no hydration warnings in console.
```

### PROMPT 1B — Fix invisible navbar links; make them bigger and animated

```
TASK: The top navigation links (Platform, Phases, Evidence, ROI, Docs, Sign in) are currently INVISIBLE on the homepage — light text rendered over a light header. Fix the contrast bug for good, then upgrade the links: larger, with a polished animated hover/active treatment. They currently look tiny and dull.

ROOT CAUSE — read components/navigation/Navbar.tsx:
- The header has two visual states driven by `isSolid = lightTop || scrolled`: transparent (over the dark hero, links styled white via `inverted`) and solid (white/80 + blur, links slate-700).
- The bug: there are states where `inverted` text styling and the actual backdrop disagree (e.g. light banner/page top where isLightTopPage(pathname) in lib/navigation/routes.ts misses a route, or the header transitions while the hero behind it is light). White/90 text then sits on a near-white surface → invisible.

IMPLEMENT in components/navigation/Navbar.tsx (and lib/navigation/routes.ts if route lists are stale):
1. Make contrast structurally impossible to break: the text color must derive from the SAME boolean as the background. Refactor so a single `appearance: "overlay" | "solid"` value drives BOTH the header background classes AND link color classes from one place (a small lookup object), instead of two independently computed class strings. Audit isLightTopPage() against every route in app/ — any page whose top section is light MUST be listed (check /evidence, /docs/*, /roi, /action-plan, /trust, /clin-suite, /ed, /ins, /rural and children). Add a comment explaining the invariant.
2. Belt-and-suspenders: in the overlay (transparent) state, add a subtle scrim so white text is readable over ANY content: `bg-gradient-to-b from-black/35 to-transparent` on the header (or text-shadow utility). In the solid state keep bg-white/80 backdrop-blur with text-arka-slate-700.
3. Bigger links: in the NavLink component change `px-2 py-1.5 text-sm` → `px-3.5 py-2 text-base font-semibold tracking-tight` (apply the same sizing to the PhasesMegaMenu trigger and the Evidence button so all six items match). Bump the Sign in / Book a demo buttons from size "sm" to default with text-base.
4. Animated links — implement an underline-grow + lift microinteraction (CSS only, transform/opacity, 200ms, motion-reduce:transition-none):
   - Each link gets a relative wrapper with an absolutely-positioned 2px bottom bar (bg-arka-teal-400, scale-x-0, origin-left) that scales to 1 on hover/focus-visible.
   - On hover the label translates up 1px and brightens (overlay state: text-white; solid state: text-arka-slate-900).
   - ACTIVE route: the underline stays at scale-x-100 and the label gets the teal accent (text-arka-teal-300 in overlay, text-arka-teal-700 in solid). Use usePathname() to compute active state (Platform is active on "/" + #platform, ROI on /roi, Docs on /docs/*).
   - On first mount, stagger the six nav items in with framer-motion (opacity 0→1, y -8→0, delay index*0.06) — subtle, runs once.
5. Mirror the size/contrast fixes in components/navigation/MobileMenuSheet.tsx so mobile nav matches.

VERIFY:
- On /, before scrolling: links are clearly readable over the dark hero. After scrolling 100px: header goes solid, links are dark and readable. NO state in between where text disappears (drag-scroll slowly to check the transition).
- Visit every top-level route and confirm readable links at scrollY=0 on each.
- Hover/keyboard-focus each link: underline animates, label lifts; current page shows persistent underline.
- Tap targets ≥44px; axe DevTools reports no contrast violations on the header in either state.
```

### PROMPT 1C — Make the hero CDS Hooks mini-demo loop forever (it gets stuck)

```
TASK: The mini EHR/CDS Hooks simulation card in the homepage hero (components/landing/HeroSimulation.tsx) plays once and then gets STUCK — it must run as a seamless, infinite loop whenever it is on screen.

HOW IT WORKS TODAY (read the file first):
- An IntersectionObserver sets isVisible; a useEffect keyed on [isVisible, cycle, ...] runs runCycle(): resets state, types the order text char-by-char with setTimeout chains, reveals the score ring and evidence chip, then schedules setCycle(c => c+1) at LOOP_MS to restart.
- BUG CLASS: the loop silently dies. Likely causes — (a) LOOP_MS is shorter than the real animation tail (typingEnd + 700 + exit), so the next cycle's reset races the AnimatePresence exit and framer-motion controls get orphaned (controls.start() on unmounted components rejects and the chain stops); (b) when the tab is backgrounded, timers are throttled and the observer/cycle handshake deadlocks (isVisible stays true but no timer fires again); (c) panelControls.set/start being called before mount throws and kills the effect.

IMPLEMENT — rewrite the sequencing to be deterministic and unkillable:
1. Replace the ad-hoc setTimeout choreography with a single requestAnimationFrame-driven timeline OR a self-rescheduling async loop with AbortController:
   - Compute the full cycle duration ONCE from its parts: INTRO(200) + typing(600 + orderText.length*45) + SCORE_DELAY(200) + EVIDENCE_DELAY(700) + HOLD(2600) + EXIT(600). Derive LOOP_MS from these constants instead of hard-coding, so changing the copy can never break the loop again.
   - Each phase sets a `phase` state ("idle" | "typing" | "score" | "evidence" | "hold" | "exit"); render purely from phase + elapsed chars. Guard every controls.start() with .catch(() => {}) so an unmount mid-flight can never poison the next cycle.
2. Visibility handling: keep the IntersectionObserver, AND add a document.visibilitychange listener — when the tab returns to foreground or the card re-enters the viewport, if phase !== "typing"-through-"exit" (i.e., the loop is not provably mid-flight), hard-reset and start a fresh cycle. This makes "stuck" unrecoverable states self-heal.
3. prefers-reduced-motion: keep the existing reduced path but ALSO loop it (show completed state for 4s → crossfade reset → re-reveal in 3 steps). Reduced motion means no typing/motion, not a dead card.
4. Add a 600ms crossfade between cycles via the existing AnimatePresence mode="wait" keyed on cycle — verify exit duration < inter-cycle gap so there is never a blank frame.
5. Keep the sr-only aria-live region but set aria-live="off" while looping (announce only the first cycle) so screen readers aren't spammed every ~8s.

VERIFY:
- Watch / for 5 full minutes: the card types → scores → shows evidence → holds → fades → restarts, indefinitely, no stalls.
- Switch tabs for 60s, return: card is animating (or resumes within 1s).
- Scroll the card out of view and back: it restarts cleanly.
- CPU profile: no timer leak (timeout count stable across cycles).
```

---

## PROBLEM 2 — What "Sign in" does today + build a real, professional sign-in page

**Answer to your question first:** in the current code, **Sign in is not an account system at all**. In `lib/navigation/routes.ts` it is `SIGN_IN_MAILTO` — a `mailto:hello@…?subject=ARKA platform access` link. Clicking it just opens the visitor's email client. There is no auth, no user database, and **no difference between having and not having an account, because accounts don't exist yet**. The Supabase client libs are present in `lib/supabase` but unused for auth. The prompt below gives "an account" a real meaning (saved demo state, action plans, validation dashboards) and builds a working page.

### PROMPT 2 — Create a working, professional /signin page

```
TASK: Replace the fake mailto "Sign in" with a real /signin route: a polished, professional split-screen sign-in page that actually works (demo-credential auth with session), and clearly communicates what an ARKA account gives you.

WHAT AN ACCOUNT MEANS (use this copy on the page — left panel value props):
- "Save your Action Plans" — revisit and edit ROI action plans from /action-plan instead of rebuilding them.
- "Pick up demos where you left off" — persistent state across ARKA-CLIN, ARKA-ED and ARKA-INS sandboxes.
- "Access the Validation Dashboard" — full CDS validation metrics and regulatory artifacts (/cds-hooks-demo/validation).
- "Early access" — new AIIE knowledge-matrix releases and CMS-0057-F tooling before public launch.
Everything else on the site stays open — no paywall on evidence or docs.

IMPLEMENT:
1. Create app/signin/page.tsx (metadata title "Sign in — ARKA") + a client component components/auth/SignInForm.tsx.
2. Layout — split screen, flagship quality:
   - LEFT (hidden on mobile, 45% width on lg): bg-surface-dark with the bg-grain texture and hero-ambient-gradient, the ArkaAnimatedLogo at ~280px (animate, idleAnimations), and the four value props above as a staggered framer-motion list (each with a lucide icon: FileText, PlayCircle, BarChart3, Sparkles), fading in 0.08s apart.
   - RIGHT: centered card (max-w-md) on bg-surface: "Welcome back" h1, email + password fields, primary submit button (buttonVariants premium, full width), divider, then a "Request access" secondary block that keeps the old mailto as the path for new prospects (reuse SIGN_IN_MAILTO renamed to REQUEST_ACCESS_MAILTO in lib/navigation/routes.ts).
3. Form behavior (this must WORK, not be decorative):
   - React Hook Form or controlled state with zod-style validation: email format, password ≥ 8 chars, inline error text in text-red-600 with aria-describedby, error summary focus management.
   - Auth: create app/api/auth/signin/route.ts that accepts POST {email, password}. Validate against demo credentials from env (DEMO_USER_EMAIL / DEMO_USER_PASSWORD in .env.local, documented in .env.local.example — e.g. demo@getarka.health / arka-demo-2026). On success set an httpOnly signed cookie "arka_session" (7-day expiry) and return 200; on failure return 401 {error}.
   - Client: loading state on submit (spinner in button, disabled), shake animation on the card on 401 with message "Invalid credentials — use the demo login or request access below.", redirect to /?signedin=1 on success.
   - Add a "Use demo credentials" ghost button that autofills the demo login — this is a demo site; make the happy path one click.
   - Session awareness: in Navbar.tsx, read the session (small /api/auth/me endpoint or server component check) and swap "Sign in" for an avatar chip with "Sign out" (POST /api/auth/signout clears the cookie). Keep it lightweight — no user DB, the demo user is the only principal.
4. Wire the nav: in Navbar.tsx and MobileMenuSheet.tsx change the Sign in href from SIGN_IN_MAILTO to "/signin". Register routes.signin in lib/constants.ts, add to app/sitemap.ts, add isLightTopPage entry ("/signin" right panel is light — but if you keep the dark left panel full-bleed behind the header, register it as dark instead; ensure navbar text is readable either way per the Prompt-1B invariant).
5. Page transition + scroll: ensure the page participates in the global template transition (added later in Prompt 12) and has no overscroll white gap (footer hidden on /signin is acceptable — use a minimal footer variant if cleaner).

VERIFY:
- /signin renders the split layout; logo animates on the left; all text passes contrast.
- Wrong password → inline 401 error + shake. Demo credentials → cookie set, redirected, navbar shows signed-in state; Sign out reverts it.
- Form fully keyboard navigable; labels associated; pnpm build clean.
```

---

## PROBLEM 3 — Platform diagram says "AIIE", must say "ARKA"

### PROMPT 3 — One-word fix in the platform orbit

```
TASK: In the homepage "Platform" section diagram (the orbit with CLIN / ED / INS / RURAL around a dark center circle), the center label reads "AIIE" with subtitle "Knowledge Core". Change the big label to "ARKA".

IMPLEMENT:
1. components/landing/PlatformOrbit.tsx (~line 139): change the rendered center label text "AIIE" → "ARKA". Keep "Knowledge Core" as the subtitle.
2. Same file ~line 77: update the aria-label/alt description string "ARKA platform diagram: AIIE Knowledge Core at center..." → "ARKA platform diagram: ARKA Knowledge Core at center...".
3. Search the rest of components/landing/ (PlatformEcosystem.tsx, EcosystemDiagram.tsx, PlatformBand.tsx) for any other CENTER-NODE label rendering "AIIE" and apply the same change. DO NOT rename AIIE anywhere else on the site (evidence pages, ED comparison section, INS copy) — AIIE remains the engine's name; only the platform-diagram center node becomes ARKA.
4. Check the label still fits the circle at all breakpoints (ARKA is 4 chars like AIIE — should be fine; verify letter-spacing).

VERIFY: / → Platform section shows ARKA in the center node, screen-reader description updated, no other AIIE references changed. pnpm build passes.
```

---

## PROBLEM 4 — Replace mock testimonials with the real Stormont Vail quotes

### PROMPT 4 — Real quotes in the Outcomes section

```
TASK: components/landing/Testimonials.tsx currently renders three INVENTED role-only quotes ("Chief of Emergency Medicine", "VP Revenue Cycle", "Director of Radiology") plus a subheading admitting "roles only, no invented names." Replace with the two REAL quotes from Stormont Vail Health, restyled as the centerpiece they deserve.

THE REAL QUOTES (use verbatim, do not paraphrase):
1. "ARKA is genuinely unlike anything else I've used at the point of order. Having evidence-based imaging guidance surface right in the workflow — with the reasoning shown — saves clinicians countless hours and a real amount of day-to-day stress. It's the rare tool that makes the right decision the easy one."
   — Dr. Michael Glass, MD · Physician · Stormont Vail Health, Topeka, KS
2. "If a tool like ARKA is implemented thoughtfully into our clinical systems, it has the potential to change healthcare for the better. It streamlines imaging decisions without getting in the way of the people doing the work — and that's exactly what frontline radiology teams need."
   — Mike Odgren · Radiology Assistant · Stormont Vail Health, Topeka, KS

IMPLEMENT in components/landing/Testimonials.tsx:
1. Replace the testimonials array: two entries with fields {quote, name, title, org, location}. Delete the three mock entries entirely.
2. Update the subheading from "Outcome-framed feedback... no invented names." → "What clinicians at Stormont Vail Health say after using ARKA at the point of order." Keep the "Outcomes" eyebrow and "What teams report after deployment" h2 (or retitle to "What clinicians are saying" — pick whichever reads better with two real quotes).
3. Layout: switch from 3-col grid to a 2-col grid (md:grid-cols-2, max-w-5xl centered) so two cards feel intentional, not like one is missing. Larger type for the quote (text-lg leading-relaxed). Keep the teal Quote icon, the existing card styling (rounded-radius-lg border bg-surface shadow-elevation-2), and the staggered useInView entrance already in the file.
4. Attribution block per card: name in font-semibold text-arka-slate-900, then title · org on one line in text-arka-slate-600, location in text-sm text-arka-slate-500. Add a subtle "Stormont Vail Health" hospital affiliation feel — a small building/hospital lucide icon next to org is enough; do NOT fabricate a logo.
5. Add structured data: a Review/quotation JSON-LD script block is optional; skip if it adds complexity.

VERIFY: / → Outcomes section shows exactly two real attributed quotes, verbatim text, balanced 2-col layout, entrance animation intact, contrast AA, build clean.
```

---

## PROBLEM 5 — Bottom CTA must have working "Evidence" and "Action Plan" buttons

### PROMPT 5 — Restore the two-button CTA

```
TASK: The final homepage CTA section (components/landing/CtaSection.tsx, "Find out what you're leaving on the table.") currently has ONE button ("Build your action plan"). Restore the previous two-button design: a primary "Evidence & Compliance" button and a secondary "Action Plan" button — both must navigate to real pages.

IMPLEMENT in components/landing/CtaSection.tsx:
1. Replace the single Link with a flex row (flex-col sm:flex-row, gap-3 sm:gap-4, justify-center):
   - Button 1 (primary, buttonVariants premium, size lg): label "Evidence & Compliance" → href "/evidence" (the Evidence Library index — app/evidence/page.tsx). Use next/link.
   - Button 2 (secondary): label "Action Plan" → href "/action-plan" (app/action-plan exists). Style: outlined teal on dark — `border border-arka-teal-400 text-arka-teal-300 hover:bg-arka-teal-400/10` via the ghost variant + overrides, matching the screenshot reference (teal outline button).
2. Keep min-h-[44px] touch-manipulation on both; keep the staggered framer-motion entrance (both buttons in the same motion.div).
3. The closing line "remARKAbly precise — and remarkably profitable." is nearly invisible (text-arka-slate-500 on dark). Bump to text-arka-slate-400 and verify ≥4.5:1 contrast against the section background.
4. Note: this section renders on BOTH dark (homepage variant per one screenshot) and light contexts in different builds — check whether CtaSection is reused elsewhere (grep). Style buttons for the actual section background in this repo (bg-surface-dark).

VERIFY: / → bottom CTA shows both buttons; "Evidence & Compliance" lands on the Evidence Library; "Action Plan" lands on the action-plan builder; both have hover/focus states and pass contrast; mobile stacks vertically.
```

---

## PROBLEM 6 — Full ARKA-CLIN Suite audit (Standalone, EHR-Embedded, CDS Hooks Discovery)

### PROMPT 6 — CLIN Suite end-to-end QA and polish pass

```
TASK: Audit and fix the ENTIRE ARKA-CLIN Suite across its three surfaces. Treat this as a release-blocking QA pass: every control must work, every word must be readable (no text color matching its background), and layout/UI must be professional and impressive.

SURFACES & FILES:
A. Standalone web app — app/clin/page.tsx, app/clin-suite/page.tsx, components/demos/clin/** (cockpit: OrderComposer, PatientContextRail, ResultsRail, ShapFactorBreakdown, DenialRiskGauge, EvaluationStepTracker, MobileResultsSheet, ClinCombobox, ClinEmptyState; plus ClinDemoContent, ClinicalScenarioForm, ClinResultsView, ClinAppropriatenessIndicator, HowArkaWorksSection, SwallowTriageCard, DocumentationAssistantCard, RequisitionAutofillCard).
B. EHR-Embedded CDS Hooks live demo — app/cds-hooks-demo/page.tsx, app/cds-hooks-demo/validation/page.tsx, components/cds-platform/demo/** (CdsDemoClient, CdsDemoSidebar, EpicSimChart, scenarios.ts, build-cds-request.ts, demo-response.ts, JsonSyntaxPre, RoiCounter, ShapFactorsBlock, ReviewAlternativePanel), components/cds-platform/sidebar/**, plus app/ehr/** (EhrEmbedClient, EhrOrderCard, sandbox).
C. CDS Hooks Discovery — app/cds-hooks-discovery/page.tsx and the API it documents: app/api/cds-services/route.ts + the per-service routes.

EXECUTE this checklist file by file; fix everything you find:
1. INTERACTION SWEEP: every button, tab, combobox, scenario selector, form submit, copy-to-clipboard, JSON expander, "run request" action must do something visible. For each broken handler: fix the wiring (most common bugs: stale state keys after scenario switch, fetch to API routes failing silently — add error states using components/demos/ins/DemoErrorState.tsx as the pattern, disabled buttons with no aria-disabled reason). The CDS Hooks live demo must complete a full loop: select scenario → build request → POST to /api/cds-services/arka-clin-appropriateness → render cards → record feedback POST.
2. CONTRAST SWEEP: search these trees for light-on-light/dark-on-dark utilities: grep for "text-white", "text-arka-slate-300", "text-arka-slate-400" inside components rendered on light cards, and "text-arka-slate-600/700" inside bg-surface-dark blocks. Check the JSON viewers (JsonSyntaxPre) — syntax token colors must be tuned for their actual background. Run axe DevTools per page and fix every contrast finding.
3. LAYOUT/POLISH SWEEP per page: consistent max-w container, breadcrumb (match app/ed/page.tsx pattern), section spacing rhythm (py-24 md:py-32 on landing-style sections; tighter inside app shells), cards on shadow-elevation-2 with border-border-subtle, no orphan UI (empty panels must use ClinEmptyState), loading states use DemoLoadingSkeleton, and every demo panel has an entrance animation consistent with the landing patterns (useInView fade-up, respect reduced motion).
4. MOBILE: 375px width — no horizontal scroll, MobileResultsSheet works, tap targets ≥44px.
5. Cross-links: clin-suite page must clearly route to (a) standalone demo, (b) EHR-embedded demo, (c) discovery JSON, and each demo links back. Verify routes in lib/constants.ts are used (no hard-coded paths).

DELIVERABLE: in your reply, list every defect found and fixed as a table (file, symptom, fix). Then run pnpm lint && pnpm tsc --noEmit && pnpm build and confirm clean.
```

---

## PROBLEM 7 — ARKA-ED: turn the confusing queue into a sample-scenario quiz experience

### PROMPT 7 — ARKA-ED practice mode with sample questions + answers

```
TASK: The current ARKA-ED page (app/ed/page.tsx → components/demos/ed/EdPageClient.tsx) drops visitors into an "Incoming Imaging Queue" cockpit with no explanation — it looks like an ops dashboard, not the education product. The previous site presented SAMPLE SCENARIOS: appropriateness questions with answers. Rebuild ARKA-ED as a guided practice experience: a bank of sample clinical vignettes where the user picks the imaging study, answers are revealed with AIIE scoring + evidence, and a score is tracked. Professional, impressive layout.

ASSETS ALREADY IN THE REPO — reuse, don't rebuild:
- Quiz machinery exists in components/demos/ed/: CaseViewer.tsx, ClinicalVignette.tsx, OrderingInterface.tsx, ImagingOptionCard.tsx, FeedbackPanel.tsx, HintSystem.tsx, QuizTimer.tsx, LearningModeToggle.tsx, ACRRatingBadge.tsx, RadiationBadge.tsx, ed-scoring.ts, ed-cockpit-cases.ts (case data with precomputed evaluations).
- The cockpit (IncomingCasesBoard, EdDeptHeader, EdResultsPanel) is the OTHER mode — keep it, but demote it.

IMPLEMENT:
1. Restructure app/ed/page.tsx into a two-mode page with a clear hero header:
   - Header block: breadcrumb (keep), h1 "ARKA-ED — Imaging Appropriateness Training", one-paragraph explainer ("Work through real ED presentations. Choose the imaging you'd order, then see how AIIE scores every option — with the evidence."), and a segmented control with two modes: "Practice scenarios" (DEFAULT) and "Live ED queue" (the current cockpit, clearly labeled "simulated department view").
2. PRACTICE MODE (the new default) — components/demos/ed/PracticeMode.tsx:
   - Scenario picker: responsive card grid of 6–10 sample cases sourced from ed-cockpit-cases.ts (chief complaint, age/sex, vitals chips, difficulty badge, est. time). Entrance: staggered fade-up.
   - Flow per scenario: (a) ClinicalVignette renders the full presentation; (b) OrderingInterface + ImagingOptionCard list 4–6 modality options (include "No imaging — clinical observation" where appropriate); (c) user selects → FeedbackPanel reveals the ANSWER: correct choice highlighted, AIIE score ring (components/ui/score-ring.tsx) per option, EdFactorBreakdown for the why, ACRRatingBadge comparison, RadiationBadge, and a link to the matching /evidence/[slug] topic; (d) "Next scenario" advances; HintSystem available before answering; QuizTimer optional via LearningModeToggle.
   - Session score: sticky summary chip (X/Y correct, streak); end-of-set summary screen with per-case recap and "Review evidence" links. Confetti is NOT the brand — use a clean teal pulse on completion.
   - All reveal transitions: framer-motion height/opacity, no layout jump, reduced-motion safe.
3. LIVE QUEUE MODE: mount the existing cockpit unchanged, but add a one-line explainer banner ("Simulated ED queue — ARKA-ED scoring live cases as they arrive") so it is never confusing again.
4. State: mode + progress in useState/useReducer (optionally persist progress to localStorage… actually persist to sessionStorage only, keep it simple).
5. Layout/polish bar: same QA standard as the CLIN prompt — contrast sweep, 375px mobile pass, focus management when panels reveal (move focus to the feedback heading), pnpm build clean.

VERIFY: /ed defaults to Practice scenarios; completing 3 cases shows correct answers with AIIE scores + evidence links and a running score; mode toggle swaps to the live queue with explainer; nothing from the old page is reachable-but-broken.
```

---

## PROBLEM 8 — Evidence Library vs Feature Rationale Catalogue (answer + fix)

**Answer to your question:** these two pages serve **different audiences and should stay separate**:

- **Evidence Library** (`/evidence`) is **clinical** — per-scenario syntheses of imaging appropriateness (headache, low back pain, etc.) with society guidelines, USPSTF statements and literature. Audience: clinicians, educators, prospects evaluating clinical credibility. It backs every AIIE recommendation card.
- **Feature Rationale Catalogue** (`/docs/feature-catalog`) is **regulatory/ML** — documentation of every machine-learning *feature* (patient age, eGFR, red flags…) feeding ARKA-CLIN scoring, written for **FDA Non-Device CDS Criterion 4 independent review**. Audience: regulators, payer diligence teams, data scientists.

Merging them would dilute both: a clinician searching "low back pain" shouldn't wade through SHAP attribution docs, and a regulator auditing Criterion 4 needs the catalogue to remain a clean, self-contained artifact. The right move is **keep separate, cross-link aggressively, and give Evidence a first-class nav link** (today the navbar "Evidence" opens a modal, not the page). The prompt below does exactly that.

### PROMPT 8 — Evidence gets a real nav link; cross-link the two libraries

```
TASK: Three related fixes. (1) The navbar "Evidence" item currently opens a modal (evidenceModal.setOpen in components/navigation/Navbar.tsx) instead of navigating — make it a real link to /evidence. (2) Cross-link the Evidence Library (/evidence — clinical evidence per scenario) and the Feature Rationale Catalogue (/docs/feature-catalog — ML feature docs for FDA Criterion 4) so each audience can find the other. (3) Polish both index pages to flagship standard.

IMPLEMENT:
1. Navbar: in components/navigation/Navbar.tsx replace the Evidence <button> (which calls useEvidenceModalOptional) with a standard NavLink to "/evidence" (add routes.evidence = "/evidence" to lib/constants.ts and use it). Keep the evidence modal component itself — it is still used by in-demo "view evidence" affordances — but the global nav must navigate. Update MobileMenuSheet.tsx identically. Active-state underline per the Prompt-1B pattern.
2. Cross-linking:
   - On /evidence (app/evidence/page.tsx / EvidenceIndexClient.tsx): add a slim banner card below the search box: "Looking for the ML feature documentation behind ARKA-CLIN scoring? → Feature Rationale Catalogue" linking to /docs/feature-catalog, with a FileSearch lucide icon.
   - On /docs/feature-catalog (app/docs/feature-catalog/page.tsx): mirror banner: "Looking for the clinical evidence behind each recommendation? → Evidence Library" → /evidence. Also ensure each feature card's "View underlying citation" link works (audit hrefs).
   - On each evidence detail page (app/evidence/[slug]/page.tsx): footer nav row with "← All topics" and "Feature Catalogue →".
3. Polish pass on /evidence index: sticky search with result count announced via aria-live; category sections (Cross-Cutting Principles etc.) get anchor links + a sticky on-this-page rail on xl screens (reuse the pattern from feature-catalog's "ON THIS PAGE" rail); card hover lift (translate-y-[-2px] + shadow-elevation-2 transition); staggered useInView entrance per section; "REVIEWED <date>" stamps in font-mono text-xs. Verify topic count claim ("113 topics") is computed from data, not hard-coded.
4. Polish pass on /docs/feature-catalog: ensure the left "ON THIS PAGE" rail highlights the active section on scroll (IntersectionObserver scrollspy), smooth-scrolls, and collapses to a dropdown on mobile.
5. Footer (components/navigation/Footer.tsx): confirm both "Evidence" and "Feature Catalog" links exist and point at the pages (they appear in the bottom strip today — verify hrefs).

VERIFY: clicking Evidence in the navbar navigates to /evidence (no modal); both pages cross-link; scrollspy works; mobile clean at 375px; axe passes; build clean.
```

---

## PROBLEM 9 — Full ARKA-INS audit

### PROMPT 9 — INS end-to-end QA and polish pass

```
TASK: Audit and fix the ENTIRE ARKA-INS surface — every sub-section must work, every word readable, layout professional. Same release-blocking QA standard as the CLIN pass.

SURFACES & FILES:
- Landing: app/ins/page.tsx + components/demos/ins/** (InsLandingDemoModules, InsCorePlatformSection, HowArkaInsWorksSection, AIIEForUtilizationManagementSection, OrderEntry, PatientIntake, PreSubmissionAnalyzer, DocumentationAssistant, RBMCriteriaMapper, GoldCardCheck, CMSComplianceCheck, AppealRiskPredictor, HITLReview, SubmitAppealStep, EnhancedSidebar, InsDemoView, DemoEmptyState/DemoErrorState, AnalysisTimeoutBanner).
- Payer dashboard: app/ins/dashboard/page.tsx + roi/ (PayerDashboardClient, PayerDashboardCharts, DecisionDrawer, RoiDashboardClient, MethodologyModal, recent-decisions.ts).
- Provider: app/ins/provider/page.tsx + gold-card/ (ProviderDashboardClient, GoldCardDashboardClient, OrderLifecycleTable, SchedulingIntentBanner, InterestingCaseBadge).
- Reviewer: app/ins/reviewer/ (ReviewerDashboardClient, QueueList, CaseDetail, ActionPanel, ReviewerActionBar, SlaCountdownChip).
- Patient explainer: app/ins/patient/explainer/[orderId]/page.tsx.
- Shell/chrome: components/ins/InsShell.tsx, MetricCard, ObservabilityCard, FDANonDeviceBanner, DemoModeWatermark, AIIEEvidenceModal.
- APIs these depend on: app/api/ins/** (reviewer queue/stats/action, pas submit/status, dtr, gold-card, oop, lifecycle, validation, observability, teaching-queue, counters…).

CHECKLIST (execute per surface, fix everything):
1. CLICK-THROUGH: walk the full INS story — order entry → patient intake → pre-submission analysis → documentation assistant → RBM criteria mapping → gold-card check → CMS compliance → submit → reviewer queue → reviewer action → provider lifecycle update → patient explainer. Every step's buttons, drawers, modals, tab switches and API calls must succeed or show a designed error state (DemoErrorState), never a silent no-op or console error. Check the reviewer SLA countdown actually counts.
2. CONTRAST: full sweep as in the CLIN prompt (grep light-on-light utilities; axe per page). Pay extra attention to: chart axis/legend colors in PayerDashboardCharts vs card background (ins-chart-theme.tsx), badge text (ui/Badge.tsx variants), DemoModeWatermark opacity over content, and SlaCountdownChip in its warning/expired states.
3. LAYOUT: consistent InsShell gutters, dashboard cards aligned to one grid, tables (OrderLifecycleTable) wrapped in TableScrollWrapper for mobile, empty states designed, loading skeletons present, entrance animations consistent + reduced-motion safe.
4. DATA SANITY: no NaN/undefined rendering in metrics; dates formatted consistently; counters in /api/ins/counters actually increment when demos run.
5. MOBILE 375px pass on every sub-page.

DELIVERABLE: defect table (file, symptom, fix) in your reply, then pnpm lint && pnpm tsc --noEmit && pnpm build clean.
```

---

## PROBLEM 10 — AIIE vs ACR Appropriateness Criteria section (animated, on the homepage)

**Good news:** the section already exists — `components/demos/ed/IntroducingAIIESection.tsx` (side-by-side "Traditional ACR" vs "AIIE" columns with stats like 2.4% voluntary ACR adoption and AIIE AUC 0.876–0.942). It is **orphaned: rendered nowhere**. The prompt upgrades it and mounts it on the homepage.

### PROMPT 10 — Resurrect and supercharge the "Introducing AIIE" comparison

```
TASK: The previous site clearly introduced AIIE and how it differs from — and beats — the ACR Appropriateness Criteria. That section exists in this repo as components/demos/ed/IntroducingAIIESection.tsx but is rendered NOWHERE. Move it to components/landing/, upgrade it into an extremely impressive animated comparison, and mount it on the homepage.

IMPLEMENT:
1. Move/rename: components/demos/ed/IntroducingAIIESection.tsx → components/landing/AiieVsAcrSection.tsx (update any imports; leave a re-export at the old path only if something references it — grep first, currently nothing does).
2. Mount in app/page.tsx between WhyArka and TrustBand (dynamic import like its siblings). Give it id="aiie" and add an "AIIE" anchor link to the PhasesMegaMenu or Platform section so it is discoverable.
3. Upgrade the section to flagship quality (keep the existing content/claims — they are sourced; do not invent numbers):
   a. HEADER: eyebrow "AIIE Technology", h2 "Introducing AIIE — the ARKA Imaging Intelligence Engine", subline contrasting with "the ACR Appropriateness Criteria you already know."
   b. ANIMATED COMPARISON — two columns that build as you scroll (useInView, staggered):
      - LEFT "Traditional ACR" (muted slate styling): static tables, 2.4% voluntary adoption (JACR), lookup happens OUTSIDE the workflow, generic — not patient-specific. Each item enters with a flat, deliberately plain fade (the dullness is the point).
      - RIGHT "AIIE" (teal accent, glow border, slightly scaled): patient-specific ML scoring on structured FHIR context, in-workflow at order entry via CDS Hooks, SHAP-transparent reasoning per score, continuously validated (AUC 0.876–0.942 in published studies), every output linked to the Evidence Library. Items enter with a spring + teal pulse.
      - Between the columns on lg: an animated "vs" node — a small circle that draws in (scale + ring draw like the logo language).
   c. ANIMATED STAT STRIP below the columns: reuse components/landing/CountUpStat.tsx to count up the key stats (2.4% ACR voluntary adoption vs AIIE AUC 0.876–0.942 vs in-workflow 0 extra clicks). Numbers animate only when in view, once.
   d. FLOW VIGNETTE (the impressive bit): a slim auto-playing strip showing the same order evaluated both ways — "ACR path": clinician leaves EHR → searches PDF → generic rating (rendered as a grey, 3-step stepper that ends in a shrug glyph) vs "AIIE path": order typed → score 7/9 with reasons appears inline (a compact reuse of the HeroSimulation card pattern from Prompt 1C, sharing its loop logic via a small hook if practical — extract useLoopedTimeline() into lib/hooks/). Both loop continuously, reduced-motion shows final frames.
   e. CTA row: "Browse the evidence" → /evidence; "See AIIE score live" → routes.cdsHooksDemo.
4. Section styling: light background (bg-surface-sunken) to alternate with neighbors; py-24 md:py-32; all animation transform/opacity only; reduced-motion = everything visible, no motion.
5. ALSO keep ARKA-ED's reference to this content: in the new /ed practice mode (Prompt 7), the intro header links to /#aiie ("What is AIIE?").

VERIFY: homepage scroll reaches an animated ACR-vs-AIIE showdown that builds in view, counts its stats, and loops the dual-path vignette indefinitely; anchors work from nav; reduced-motion clean; Lighthouse perf drop ≤2; build clean.
```

---

## PROBLEM 11 — Rural Intelligence: real geographic map + working rural demos

### PROMPT 11A — Replace the placeholder "Imaging access snapshot" with a real geographic map

```
TASK: In ARKA-RURAL → Intel (app/rural/intelligence → RuralIntelligenceDashboard → components/demos/rural/intelligence/ImagingDesertMap.tsx → components/demos/rural/shared/MapVisualization.tsx), the "Imaging access snapshot (demo)" is an empty grey rectangle with three floating dots positioned by index math (left: 30 + i*18%). Replace it with a real, ArcGIS-style geographic visualization of the three tracked regions: Northwest Kansas (access 22/100), Oklahoma Panhandle (15/100), Mississippi Delta (8/100). Data lives in lib/demos/rural/intelligence/imaging-desert-data.ts — extend it, don't fork it.

IMPLEMENT:
1. Library: use react-simple-maps (+ d3-geo, topojson-client) with the bundled-at-build us-atlas states-10m TopoJSON (pnpm add react-simple-maps d3-geo topojson-client us-atlas; import the JSON locally — NO runtime CDN fetch, this must work offline). If react-simple-maps' React version conflicts with the repo, fall back to rendering the same TopoJSON manually through d3-geo geoAlbersUsa + plain SVG paths — same visual spec either way.
2. New component components/demos/rural/intelligence/ImagingAccessMap.tsx (client). Replace MapVisualization's grey box with it; keep the Card chrome and the list below as an accessible fallback/legend.
3. Visual spec (ArcGIS-quality, on-brand):
   - Projection geoAlbersUsa, fitted to the central/southern US (Kansas→Mississippi window) rather than all 50 states, so the three regions dominate the frame.
   - Base: state polygons filled var(--arka-bg-alt)-equivalent (use fill from a CSS variable or tailwind-resolved hex constant), 0.5px borders in slate-300; the three host states (KS, OK, MS) slightly elevated fill.
   - REGION MARKERS at real coordinates — extend imaging-desert-data.ts entries with {lat, lng}: Northwest Kansas ≈ [-100.8, 39.4]; Oklahoma Panhandle ≈ [-101.5, 36.7]; Mississippi Delta ≈ [-90.9, 33.8]. Each marker: a choropleth-style graduated circle sized/colored by access score on a teal→amber→red severity ramp (22 → amber-ish, 15 → orange, 8 → red), with a soft radar pulse ring (reuse the logo's pulse pattern: scale 1→2, opacity .5→0, 2.5s loop, motion-reduce: none).
   - CONNECTIONS: animated great-circle-ish arcs (SVG path with stroke-dasharray draw-on loop) linking the three regions to a "hub" marker (use the Topeka, KS area ≈ [-95.7, 39.05] as the ARKA hub, teal). This gives the connected-network look you asked for.
   - LABELS: each region gets a leader-line label chip ("Northwest Kansas · 22/100") positioned to avoid overlap; font-mono text-xs.
   - INTERACTION: hover/focus a marker → tooltip card (region, access score, modality gaps one-liner from data file) + the corresponding list item below highlights; click → pins the tooltip. Keyboard: markers are buttons in a logical tab order. aria-label on the SVG summarizing all three scores.
4. Responsiveness: the map keeps aspect-[16/9], scales to container, labels collapse to dots+legend below 480px (the list under the map becomes the labels on mobile).
5. Make the severity ramp + score thresholds constants in imaging-desert-data.ts so PredictiveFacilityRisk/OutcomeCorrelationEngine can share them.

VERIFY: /rural/intelligence shows actual US geography with three pulsing, labeled, connected region markers at correct locations; hover and keyboard tooltips work; no CDN request for map data (check Network tab); reduced-motion stops pulses/arc draw but keeps the full map; build clean.
```

### PROMPT 11B — ARKA-RURAL full audit: every demo interactive and working

```
TASK: QA-and-fix pass across the ENTIRE ARKA-RURAL section — every sub-page, every demo must be interactive and working, every word readable, layout professional. Same standard as the CLIN/INS audits.

SURFACES: app/rural/page.tsx (landing) and sub-apps: /rural/cds (RuralCDSDemo, FacilityProfileForm, ResourceAwareScoring, DualScoreDisplay, SmartTriagePathway, TransferProtocol, LocalFirstProtocol, MobileUnitProtocol), /rural/tele (TeleDashboard, TeleSiteFlow, AITriagePrioritizer, StoreAndForwardManager, MultiProviderRouter, ClinicalContextPackager, QualityAssuranceDashboard), /rural/training (RuralTrainingHub, RuralTrainingClient, CaseViewer/Vignette, CMETracker, CertificationProgress, CurriculumChecklist, ScopeExpansionModule, MobileUnitTraining, ResourceConstrainedCase), /rural/network (NetworkManagerDashboard + Loader, HubSpokeConfigurator, HubSpokeNetworkDiagram, EquipmentRegistry, MobileUnitScheduler, StaffingVisibility, SharedQualityDashboard, TransferProtocolAutomation), /rural/reimbursement (RuralReimbursementDashboard, RuralRevenueCalculator, REHPaymentOptimizer, PayerMixOptimizer, RuralRateTable, BatchAuthorizationWorkflow, GrantFundingNavigator, RevenueCycleIntelligence, AlternativeStudyJustifier, RuralExemptionDetector), /rural/ai (AIDiagnosticsDashboard, AIMarketplace, AIPreliminaryRead, POCUS* components, RuralPriorityAISelector), /rural/intelligence (dashboard + the new map from 11A, OutcomeCorrelationEngine, PredictiveFacilityRisk, PopulationHealthAnalytics, ResearchDataPlatform), shared chrome (RuralSidebar, RuralMobileNav, RuralPhaseChrome, RuralStatBanner, RuralHubMap/Lazy).
APIs: app/api/rural/evaluate and /exemptions — demos calling them must handle success AND failure states.

CHECKLIST per sub-page:
1. Every form computes (RuralRevenueCalculator must produce numbers that change with inputs), every dashboard card renders data (no empty/placeholder boxes like the old map), every stepper advances, every select filters, sidebar nav highlights the active section (screenshot shows "Intel" active state working — verify the rest).
2. The "demo / illustrative / synthetic" badges (seen on the Intel stat cards) stay — they are honest — but style them consistently (one Badge variant).
3. Contrast sweep + axe per page (watch the sidebar's small grey labels, and the PREDICTIVE FACILITY RISK "AMBER · 60" pill which is light-on-light in the screenshot — fix that specific badge).
4. The truncated/garbled eyebrow text at the top of Intel ("POPULATION ANALYTICS" appears clipped behind the sticky header) — fix the scroll-margin/z-index so section eyebrows are never hidden under chrome.
5. Layout: consistent grid gutters, cards aligned, mobile 375px pass with RuralMobileNav.
6. Entrance animations on each dashboard panel (stagger, useInView, reduced-motion safe).

DELIVERABLE: defect table (file, symptom, fix), then pnpm lint && pnpm tsc --noEmit && pnpm build clean.
```

---

## PROBLEM 12 — Security & Compliance page (`/security`) — IMPORTANT

This page details ARKA's compliance process and is built from the **existing prompt pack** `docs/ARKA_SECURITY_PAGE_CURSOR_PROMPTS.md` — a Vanta/Drata-style trust center: hero with live program-status pills (HIPAA in force · SOC 2 in progress · HITRUST e1 roadmap), framework cards, six control pillars, certification timeline + document-coverage chart (Recharts), the 21-document controlled library, no-PHI demo attestation band, FAQ, and cross-links with `/trust`.

**How to run it:** open `docs/ARKA_SECURITY_PAGE_CURSOR_PROMPTS.md` and paste its **Prompts 1 → 8 in order, verbatim** (it has its own dependency ordering and a final smoke-test checklist). Two non-negotiables from that doc carry over here:

1. **Truth-in-claims rule** — never let Cursor "improve" status wording to "certified/attested/audited" for SOC 2 or HITRUST. All statuses live in `lib/security/compliance-data.ts` only.
2. **Single source of truth** — copy/status/document edits go in `compliance-data.ts`, never in components.

Run it at the point indicated in the execution order table below (after the audits, before the global transition/scroll fixes), then immediately run Prompt 15 below — it reconciles the security page with everything else this pack changed (the new navbar, transitions, overscroll fix) and holds it to the same layout/UI bar.

### PROMPT 15 — /security integration + flagship layout/UI pass (run right after the security pack)

```
TASK: The /security "Security & Compliance" page was just built from docs/ARKA_SECURITY_PAGE_CURSOR_PROMPTS.md (app/security/page.tsx, components/security/**, lib/security/compliance-data.ts). Reconcile it with the sitewide changes made in this fix round, and run a final professional-polish pass on its layout and UI. Do NOT change any compliance copy or status wording — lib/security/compliance-data.ts is the single source of truth and its claims are legally calibrated.

A. INTEGRATION with this round's changes:
1. Navbar: the security pack added a "Security" link — restyle it to match the Prompt-1B link system exactly (text-base font-semibold, animated underline-grow, active-route state on /security, correct overlay/solid contrast driven by the single `appearance` value). Verify "/security" is registered in isLightTopPage() in lib/navigation/routes.ts according to its actual top section: the hero is DARK navy (bg-arka-bg-dark), so it must be treated like the homepage (overlay navbar with white links at scrollY=0). If the navbar is currently white-on-white or dark-on-dark over the security hero, this registration is the fix.
2. Transitions: confirm /security inherits the app/template.tsx route transition (Prompt 12) with no double-animation — its sections already use useInView reveals; page-level entry must not re-trigger them (audit initial states).
3. Overscroll: apply the Prompt-13 invariant — scroll past the bottom of /security shows the footer's dark color, never white; footer is the last painted element; no phantom space (check the Recharts containers don't add overflow height).
4. Cross-links: footer compliance column links Security above Trust Center; /trust shows the callout to /security and the /security FAQ links back to /trust (the pack's Prompt 8 does this — verify it survived); ALSO add a "Security & Compliance" link to the /signin page's value-prop panel footer (built in Prompt 2 of this pack) since prospects evaluating access care about it; and in the Evidence Library banner row (Prompt 8 of this pack) consider a third quiet link "Security & Compliance →" only if it doesn't crowd the layout.
5. Sitemap + sweep registration: /security present in app/sitemap.ts, and include /security in the Prompt-14 final QA route list.

B. LAYOUT / UI FLAGSHIP PASS (double-check everything — this page faces hospital CISOs):
1. Visual rhythm: hero pt clears the sticky header with zero overlap; consistent section paddings (py-20/24) and one max-w container; the sticky in-page nav (Frameworks / Controls / Timeline / Documents / Demo data / FAQ) gets a working IntersectionObserver scrollspy with the teal active underline, smooth-scroll, and scroll-mt-24 on every target — same mechanics as the /docs/feature-catalog rail (Prompt 8).
2. Status pills: "In force" (success green), "In progress" (warning amber), "Roadmap" (neutral slate) — verify each pill's text/background pair passes AA on the dark hero AND wherever pills repeat on light cards; pills get a subtle pulse-dot (motion-reduce safe), not blinking text.
3. Framework cards + control pillars: equal-height grid (grid auto-rows-fr), icon chips in teal-50/teal-600, hover lift (translate-y-[-2px] + shadow transition), staggered useInView entrance; no card text below text-sm; docRef strings in font-mono text-xs.
4. Timeline + Recharts chart: axis/legend/tooltip colors tuned to the actual background (no default Recharts grey-on-light-grey); chart is responsive (ResponsiveContainer), has an aria-label and a visually-hidden data table fallback; timeline milestones readable at 375px (vertical layout on mobile).
5. Document library: 21 documents render in a scannable table/grid with category grouping, monospace doc IDs, and a working "request the package" CTA (mailto or /signin-gated — match what the pack built); the Data Security Overview PDF link resolves (public/docs/ARKA_Data_Security_Overview.pdf exists — verify, copy from compliance/06_Prospect_Facing/ if missing).
6. FAQ: accessible disclosure pattern (button + aria-expanded, chevron rotate, height animation reduced-motion safe), one open at a time is fine.
7. Full contrast + formatting sweep per the Prompt-14 standard: axe clean, exactly one h1, heading order, no horizontal scroll at 375px, zero console errors, pnpm lint && pnpm tsc --noEmit && pnpm build clean.

VERIFY: /security loads with overlay navbar readable over the navy hero → solid on scroll; scrollspy tracks; all statuses show exact original wording; every document/PDF/cross-link resolves; page transition plays; bottom overscroll is dark; axe + build clean.
```

---

## GLOBAL FIX A — Page transitions everywhere

### PROMPT 12 — App-wide route transitions

```
TASK: Every page navigation must have a smooth transition. Implement App Router route transitions globally, the idiomatic Next.js way.

IMPLEMENT:
1. Create app/template.tsx (client component). Because template.tsx remounts per navigation, a simple mount animation runs on every route change:
   - Wrap children in a motion.div: initial {opacity: 0, y: 12}, animate {opacity: 1, y: 0}, transition {duration: 0.35, ease: [0.16, 1, 0.3, 1]}.
   - useReducedMotion(): if true, render children with no motion wrapper.
2. Layered polish:
   - components/navigation/NavigationProgress.tsx already exists — verify it shows a top progress bar during navigation and tune it to the teal token; if it is unused, mount it in app/layout.tsx.
   - Section-level reveals (useInView fade-up) already exist on landing components; do NOT double-animate — the template handles page entry, sections handle scroll reveal. Audit for sections that currently animate on mount AND in-view (would flash twice) and set their initial state accordingly.
3. Demo shells with their own layouts (app/clin-suite/layout.tsx, app/ed/layout.tsx, app/ins/layout.tsx, app/rural/layout.tsx, cds-hooks-* layouts) inherit the root template automatically — verify none of them define a conflicting template or animate their own mount in a way that compounds (fix by removing the inner mount animation, keeping the root one).
4. Scroll behavior: ensure each navigation starts at top (App Router default) EXCEPT hash links (#platform, #aiie) which smooth-scroll (scroll-behavior: smooth is likely in globals.css — verify, and add scroll-mt offsets for the sticky header on all anchor targets: scroll-mt-20).
5. No CLS: the transition animates opacity/transform only; no layout-affecting properties.

VERIFY: click through Home → CLIN Suite → ED → INS → Rural → Evidence → Docs → ROI → Action Plan → Sign in: every route fades/slides in consistently; back/forward buttons animate too; hash anchors smooth-scroll under the header without being covered; reduced-motion disables it all; build clean.
```

---

## GLOBAL FIX B — Kill the white over-scroll page after the footer

### PROMPT 13 — Footer is the end of the page, period

```
TASK: BUG — scrolling past the bottom of pages reveals a WHITE page below the footer (rubber-band/overscroll exposes the document background; on some pages there may also be literal empty space below the footer). Scrolling to the bottom must terminate cleanly at the footer (the site index) everywhere.

ROOT CAUSES TO FIX (apply all):
1. Background mismatch: app/layout.tsx sets body to bg-surface (light) while the footer (components/navigation/Footer.tsx) is dark. When macOS/iOS rubber-band overscroll stretches past the document, the body/html background (white-ish) shows. FIX:
   - In styles/globals.css set `html { background-color: <the footer's dark surface color token, e.g. var(--surface-dark) or the resolved arka slate-950 value>; }` — html paints the overscroll glow area top AND bottom on macOS, so ALSO verify the top: since the homepage hero is dark this is consistent; for light pages the sticky header covers the top band. If top overscroll on light pages looks wrong, instead use: html gets the dark color and body keeps bg-surface — body covers the document, html only shows in overscroll, which at the bottom (footer) is dark. Test both directions on macOS Safari + Chrome trackpad.
   - Add `overscroll-behavior-y: none` to html — kills the rubber-band reveal entirely in Chromium/Firefox (Safari ignores it gracefully; the background fix covers Safari).
2. Phantom space below the footer: audit for elements extending past the footer — common culprits: (a) an element with margin-bottom on the last section creating body overflow (margins don't collapse through the footer's border); (b) absolutely/fixed positioned helpers (FeedbackWidget.tsx chat bubble, DemoBottomNav, toasts) with heights that pad the body; (c) min-h-screen + flex layout where main lacks flex-1 so short pages show body background below the footer. FIX: in app/layout.tsx ensure the shell is `<body class="flex min-h-screen flex-col"> <Navbar/> <main class="flex-1">{children}</main> <Footer/>` (adapt to the existing SiteChrome/MainWithDemoNav structure in components/navigation/) so the footer is ALWAYS the last painted element and short pages stretch main, not expose background.
3. Per-page check: some demo layouts (ins, rural, ehr, cds-hooks-*) render their own shells — verify each either includes the global footer or intentionally ends with its own dark chrome; none may end on an unstyled background.

VERIFY:
- On macOS trackpad (Safari + Chrome) scroll hard past the bottom of: /, /clin-suite, /ed, /ins, /rural, /rural/intelligence, /evidence, /docs/feature-catalog, /roi, /action-plan, /signin, /security → the overscroll area is ALWAYS the footer's dark color, never white.
- iOS Safari (responsive mode + device if available): same.
- Short pages (e.g. /privacy, /terms, 404 at /nonexistent): footer sits at the bottom of the viewport, no gap below it.
- document.body.scrollHeight === html.scrollHeight on each page (no phantom overflow): run in console.
```

---

## GLOBAL FIX C — Final sweep

### PROMPT 14 — Site-wide formatting, readability and regression QA (run last)

```
TASK: Final release QA across the ENTIRE site. Do not add features — find and fix regressions and rough edges from all previous work.

SWEEP EVERY ROUTE in app/ (enumerate from app/sitemap.ts + the file tree, including dynamic routes with sample params):
1. READABILITY: automated contrast pass (axe or pa11y CLI against a local build) on every route, both scroll states of the navbar; fix every AA failure. Then a manual grep audit for the known foot-guns: text-white / text-arka-slate-200/300/400 on light surfaces; text-arka-slate-600/700/900 inside bg-surface-dark / bg-grain sections.
2. FORMATTING: every page has — exactly one h1; heading levels don't skip; consistent container widths (max-w-7xl marketing, page-specific shells for demos); consistent section paddings; breadcrumbs on all demo pages (pattern from app/ed/page.tsx); no unstyled raw <a>/<button>; images/SVGs have alt or aria-hidden.
3. TRANSITIONS: confirm the app/template.tsx transition fires on every route including dynamic ones; no double-animation flashes; NavigationProgress bar appears on slow navigations.
4. SCROLL: bottom overscroll dark on every route (Prompt 13 spot-check on 6 random pages); all hash anchors respect scroll-mt; no horizontal scroll at 375px anywhere.
5. LINKS: crawl all internal hrefs (write a quick script with `next build` + linkinator against `next start`, or grep hrefs and fetch) — zero 404s; the footer's utility links (Validation Dashboard, Regulatory Rationale, Feature Catalog, Discovery JSON, Evidence, Action Plan, CDS Hooks Discovery, Privacy, Terms) all resolve.
6. CONSOLE: zero errors/warnings (hydration mismatches especially) on every route in dev AND in production build.
7. PERF: Lighthouse on / (mobile + desktop): performance ≥ previous baseline -3, accessibility = 100 target, no CLS regressions from the new logo/sections.

DELIVERABLE: a QA report table (route × {contrast, formatting, transition, scroll, links, console} → pass/fixed-list), then final pnpm lint && pnpm tsc --noEmit && pnpm build all green.
```

---

## Suggested execution order & commit plan

| Order | Prompt | Commit message |
|---|---|---|
| 1 | 0 | (no commit — context only) |
| 2 | 1A | feat(hero): large animated ARKA logo as hero centerpiece |
| 3 | 1B | fix(nav): contrast-safe navbar, larger animated links |
| 4 | 1C | fix(hero): CDS Hooks simulation loops continuously |
| 5 | 3 | fix(platform): center node AIIE → ARKA |
| 6 | 4 | feat(testimonials): real Stormont Vail quotes |
| 7 | 5 | feat(cta): Evidence & Compliance + Action Plan buttons |
| 8 | 2 | feat(auth): working /signin with demo session |
| 9 | 8 | feat(evidence): real nav link + cross-links + polish |
| 10 | 10 | feat(home): animated AIIE vs ACR section |
| 11 | 7 | feat(ed): practice scenarios with answers |
| 12 | 11A | feat(rural): geographic imaging-access map |
| 13 | 6, 9, 11B | fix(clin/ins/rural): full audit fixes |
| 14 | `ARKA_SECURITY_PAGE_CURSOR_PROMPTS.md` Prompts 1–8 | feat(security): /security trust center page |
| 15 | 15 | fix(security): integrate /security with nav/transitions/overscroll + polish |
| 16 | 12 | feat(app): global route transitions |
| 17 | 13 | fix(layout): footer terminates scroll, no white overscroll |
| 18 | 14 | chore(qa): site-wide release sweep (include /security in the route list) |

Rationale: visual quick wins first (logo, nav, loop, label, quotes, CTA) so the homepage is demo-ready early; structural work next; audits after features so they catch the new code too; the security page lands before the global transition/scroll fixes so Prompts 12–14 validate it like every other route.
