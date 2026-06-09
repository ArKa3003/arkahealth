# ARKA Health — Homepage Fix Cursor Prompts (v1, May 2026)

> **How to use this document.** Each numbered fix below contains one or more **Cursor prompts** inside fenced code blocks. Open Cursor's chat panel (`Cmd+L`), paste a prompt verbatim, and let it apply the change. Prompts are ordered so dependencies resolve cleanly — run them top to bottom. After each fix, save the files Cursor opens and run `npm run dev` to spot regressions before moving on. The final section is a smoke-test checklist.
>
> **Project root:** `/Users/arrikanna/Desktop/arkahealth`
> **Framework:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Framer Motion 12 · Recharts 3 · Radix UI · lucide-react
> **Live URL:** `https://www.getarka.health`
>
> **Design tokens you will reuse (from `tailwind.config.ts`):**
> `arka-navy / arka-bg-dark` = `#0F172A` · `arka-bg-medium` = `#1E293B` · `arka-deep` = `#1E293B` · `arka-teal / arka-cyan` = `#14B8A6` · `arka-bg-alt` = `#F1F5F9` · `arka-text` = `#FFFFFF` · `arka-text-soft` = `#E2E8F0` · `arka-text-dark` = `#0F172A` · `arka-text-dark-muted` = `#475569`.
>
> **Routes object** lives in `lib/constants.ts` (`export const routes = {...}`). Several prompts add keys to it.

---

## Table of Contents

1. **Fix 1** — FDA Non-Device CDS modal: white text, larger box, larger fonts
2. **Fix 2** — Hero restructure: new tagline under the logo, much larger animated logo, split "You did the scan…" into its own section
3. **Fix 3** — Turn the "Every imaging team knows this loop" section into an *actual* visual loop (arrows and all)
4. **Fix 4** — New dedicated, fully-researched ROI page (`/roi`) with charts, sourced numbers, and clean UI — and rewire the "See the full ROI breakdown" button
5. **Fix 5** — Merge the three repetitive platform sections (Ecosystem diagram + Phase cards + Platform band) into one cumulative "ARKA: one shared knowledge base, four phases" section
6. **Fix 6** — Replace the bottom-CTA buttons with "Evidence & Compliance" and "Action Plan", linked to the existing Evidence modal and `/action-plan`
7. **Fix 7** — Add an "ARKA-RURAL" phase to the feedback widget
8. **Appendix A** — ROI research: every figure, formula, and citation used on the new ROI page
9. **Final verification** — smoke test before sharing

---

## Fix 1 — FDA Non-Device CDS modal: white text, bigger box, bigger fonts

**Screenshot 1.** The one-time regulatory acknowledgment dialog renders dark/low-contrast body copy that is hard to read, the box is small, and the type is cramped.

**File:** `components/shared/compliance/FDAAcknowledgmentModal.tsx`
**Supporting primitive:** `components/ui/dialog.tsx` (the `DialogContent` default is light; this modal overrides it with `bg-[#EFF6FF] text-slate-800`, which is what produces the dark-on-dark / low-contrast look).

The fix: switch the modal to a **dark navy panel with white text**, widen and pad the box, and bump every font size (title, body, links, button).

### Cursor prompt 1A

```
Open components/shared/compliance/FDAAcknowledgmentModal.tsx.

Goal: make this one-time FDA Non-Device CDS acknowledgment modal much more readable — white text on a dark navy panel, a noticeably larger box, and larger fonts throughout. Keep all existing behavior (one-time acknowledgment via setFdaNoticeAcknowledged, non-dismissible by clicking outside or Escape, the two regulatory links, the "I Acknowledge" button). Do not change any imports' source paths.

Make these exact changes:

1) DialogContent className — replace the current
   "max-w-lg border-blue-200 bg-[#EFF6FF] text-slate-800 sm:max-w-xl [&>button]:hidden"
   with
   "max-w-xl border border-arka-teal/30 bg-arka-bg-dark text-arka-text-soft p-7 sm:p-9 sm:max-w-2xl [&>button]:hidden"

2) DialogTitle className — replace
   "text-base font-semibold text-slate-900 sm:text-lg"
   with
   "text-xl font-bold text-white sm:text-2xl"

3) The body paragraph that renders {noticeText} — replace its className
   "text-left text-sm leading-relaxed text-slate-800"
   with
   "text-left text-base leading-relaxed text-arka-text-soft sm:text-lg"

4) The REGULATORY_LINK_CLASS constant at the top of the file — replace its value with:
   "text-base font-semibold text-arka-cyan underline decoration-arka-cyan/70 underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-arka-bg-dark"
   Also change the wrapping <div> that holds the two links from "gap-3 text-sm" to "gap-4 text-base" and add "pt-1" so the links sit a little lower.

5) The "I Acknowledge" button className — replace
   "w-full rounded-lg bg-arka-teal px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-arka-teal/90 focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 sm:w-auto"
   with
   "w-full rounded-lg bg-arka-teal px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-arka-teal/90 focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-dark sm:w-auto"

Keep the DialogDescription sr-only element unchanged. After editing, confirm the file still compiles (no TypeScript errors) and that the modal now shows white/light text on a dark navy panel.
```

**Verify:** Clear the acknowledgment flag so the modal reappears — in the browser devtools console run `localStorage.removeItem('arka-fda-non-device-cds-acknowledged')` (this is the exact key defined as `FDA_ACKNOWLEDGMENT_STORAGE_KEY` in `lib/compliance/fda-notice-copy.ts`) and reload `/`. The notice should be a larger dark panel with crisp white text.

---

## Fix 2 — Hero restructure: tagline, bigger logo, split the headline into its own section

**Screenshot 2.** Three asks:

1. Replace the eyebrow **"REVENUE-FIRST IMAGING DECISION SUPPORT"** with **"CUTTING EDGE IMAGING DECISION SUPPORT"**, and move it directly **under the animated logo / "remARKAbly precise" lockup** (above the headline).
2. Make the **animated logo much bigger**.
3. Move **"You did the scan. Now get paid for it."** + the paragraph beneath it out of the hero and into **its own dedicated section** lower on the page.

**Files:** `components/landing/Hero.tsx` and `app/page.tsx`. You will also create one small new section component.

### Cursor prompt 2A — restructure the Hero

```
Open components/landing/Hero.tsx.

Make these changes to the Hero section's main content block (the <div className="relative z-10 ...">):

1) ENLARGE THE LOGO. The <ArkaAnimatedLogo .../> currently has
   className="w-full max-w-[350px] sm:max-w-[380px] md:max-w-[min(400px,48vw)] lg:max-w-[min(400px,50vw)] h-auto cursor-pointer"
   Replace that className with
   "w-full max-w-[440px] sm:max-w-[520px] md:max-w-[min(620px,60vw)] lg:max-w-[min(720px,58vw)] h-auto cursor-pointer"
   Keep the width={800} height={900} props as-is (they are the intrinsic SVG size; the max-w classes control rendered size).

2) ADD THE TAGLINE UNDER THE LOGO. Immediately AFTER the closing </motion.div> of the logo wrapper (the motion.div with onMouseEnter={handleLogoMouseEnter}), and BEFORE the <motion.h1 id="hero-heading">, insert this tagline paragraph:

   <motion.p
     className="font-semibold text-arka-teal"
     style={{
       fontSize: "clamp(0.9rem, 1.6vw + 0.7rem, 1.15rem)",
       letterSpacing: "0.08em",
     }}
     initial={{ opacity: 0, y: 16 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
   >
     CUTTING EDGE IMAGING DECISION SUPPORT
   </motion.p>

3) REMOVE THE HEADLINE + DESCRIPTION FROM THE HERO. Delete the <motion.h1 id="hero-heading"> ... "You did the scan. Now get paid for it." ... </motion.h1> element AND the <motion.p> immediately after it that begins "Imaging prior-auth denials run 20–40% ...". (These move into a new section in prompt 2B.) Also DELETE the old eyebrow <motion.p> that reads "REVENUE-FIRST IMAGING DECISION SUPPORT" — it is replaced by the tagline added in step 2.

4) Because we removed the element carrying id="hero-heading", update the <section> aria-labelledby. Change aria-labelledby="hero-heading" to aria-label="ARKA hero" and remove the aria-labelledby attribute.

Keep the CTA button block (the motion.div with "See the revenue model", "Watch 90-sec demo", and the CDS Hooks demo link) exactly where it is, directly under the tagline. Keep DemoModal and all background layers (HeroGridPattern, HeroRadarRings, HeroParticles, HeroScanLine) unchanged. Ensure the file still compiles.
```

### Cursor prompt 2B — create the standalone "Get paid" section

```
Create a new file components/landing/GetPaidSection.tsx with this exact content:

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/**
 * Standalone headline section moved out of the Hero.
 * "You did the scan. Now get paid for it." + the prior-auth framing paragraph.
 */
export function GetPaidSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="get-paid"
      className="scroll-mt-14 border-t border-arka-deep/40 bg-gradient-to-b from-arka-navy to-arka-bg-medium px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="get-paid-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          id="get-paid-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-3xl font-bold text-arka-text sm:text-4xl"
        >
          You did the scan. Now get paid for it.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-arka-text-soft"
        >
          Imaging prior-auth denials run 20–40% — and ~86% of them were avoidable. ARKA is one engine
          that runs on both sides of the prior-auth wall — the doctor&apos;s and the payer&apos;s —
          documenting the clinical justification at the moment the order is placed, inside Epic,
          Cerner, and Athena, in under 800ms, without adding a single click. Clean claims go out the
          first time.
        </motion.p>
      </div>
    </section>
  );
}
```

### Cursor prompt 2C — wire the new section into the homepage

```
Open app/page.tsx.

1) Add an import near the other landing imports:
   import { GetPaidSection } from "@/components/landing/GetPaidSection";

2) In the returned JSX, insert <GetPaidSection /> immediately AFTER <Hero /> and BEFORE <ProblemSection />.

Save the file. The homepage order should now be: Hero, GetPaidSection, ProblemSection, RevenueProof, WhyArka, TrustBand, PlatformBand, PhaseCards, EcosystemDiagram, Testimonials, CtaSection. (Later fixes will further consolidate the platform sections.)
```

**Verify:** On `/`, the hero shows a large animated logo, the teal eyebrow "CUTTING EDGE IMAGING DECISION SUPPORT" directly beneath it, then the CTA buttons. Scrolling down, "You did the scan. Now get paid for it." now appears as its own full-width section.

---

## Fix 3 — Make "Every imaging team knows this loop" an actual loop

**Screenshot 3.** The section claims a "loop" but renders a flat 2×2 grid of four cards. Turn it into a genuine cyclical diagram: four stages connected by arrows that visually return to the start.

**File:** `components/landing/ProblemSection.tsx`. The four existing pain points become the four nodes of the loop, in this clockwise order: *The denial nobody saw coming → The appeal you can't afford to file → The backlog on your best-margin line → The tool everyone deletes in a week → (back to start)*.

### Cursor prompt 3A

```
Open components/landing/ProblemSection.tsx.

Rebuild the section so the four painPoints render as a closed LOOP with connecting arrows, instead of a flat 2x2 grid. Keep the existing painPoints array (icons, titles, bodies), the heading "The work got done. The money didn't show up.", the subhead "Every imaging team knows this loop. ARKA breaks it.", and the closing "~86% of imaging denials are avoidable..." paragraph. Keep the framer-motion useInView fade-in behavior and the existing color tokens (arka-light, arka-bg-alt, white cards, arka-teal accents, arka-text-dark / arka-text-dark-muted).

Replace ONLY the grid block (the <div className="mt-16 grid gap-10 sm:grid-cols-2"> ... </div> that maps over painPoints) with a loop layout that works responsively:

DESKTOP / TABLET (md and up): a 2x2 arrangement of the four cards with arrows forming a clockwise cycle:
  - card[0] top-left  --(arrow right)-->  card[1] top-right
  - card[1] top-right --(arrow down)-->   card[2] bottom-right
  - card[2] bottom-right --(arrow left)--> card[3] bottom-left
  - card[3] bottom-left --(arrow up)-->    card[0] top-left
Implement this as a CSS grid: grid-cols-[1fr_auto_1fr] with three rows, where the center column/row hold the arrow glyphs. Use lucide-react icons ArrowRight, ArrowDown, ArrowLeft, ArrowUp (import them) rendered in arka-teal, sized h-7 w-7, centered in their cells. Add a small "1 / 2 / 3 / 4" step number badge to each card (a teal rounded-full badge, top-left of the card) so the cycle order reads clearly. Place a centered label in the very middle cell that reads "THE DENIAL LOOP" in uppercase tracking-wider text-arka-teal text-xs font-semibold, with a circular ArrowRight/refresh motif — use the lucide-react RefreshCw icon above the label, h-6 w-6, text-arka-teal.

MOBILE (below md): stack the four cards vertically, each followed by a downward ArrowDown glyph (arka-teal, centered), and after the 4th card show an ArrowUp plus a small "loops back to the start" caption in text-xs text-arka-text-dark-muted to convey the cycle.

Keep each card's existing styling: rounded-xl border border-arka-light bg-white px-6 py-8 shadow-card, the teal icon chip, bold title, muted body, and the hover -translate-y-1 transition. Preserve the staggered fade-in (delay 0.12 + i * 0.1). Make sure all arrows have aria-hidden and the section remains accessible (the cards are still readable in DOM order 1->2->3->4). Ensure the file compiles with no unused imports.
```

**Verify:** On desktop the four cards sit in a square with teal arrows running clockwise and a "THE DENIAL LOOP" hub in the center; on mobile they stack with down-arrows and a "loops back" cue at the end.

---

## Fix 4 — New dedicated ROI page (`/roi`) with researched numbers and charts

**Screenshots 4 & 5.** "See the full ROI breakdown" currently links to `routes.ins` (the ARKA-INS demo), which is the wrong destination. Build a **standalone, professional ROI page** at `/roi` with sourced figures, charts (Recharts is already installed at `^3.8.1`), and a clean UI, then point the button there.

> **All numbers, formulas, and citations for this page are specified in Appendix A.** The prompts below embed them directly so Cursor builds the page with the exact, defensible values. Recharts components must be rendered inside a client component.

### Cursor prompt 4A — add the route

```
Open lib/constants.ts. In the `routes` object, add a new key after the `featureCatalog` line:
  roi: "/roi",
Save. (Add a trailing comma as needed so the object stays valid.)
```

### Cursor prompt 4B — repoint the homepage button

```
Open components/landing/RevenueProof.tsx.

Find the <Link href={routes.ins} ...> whose text is "See the full ROI breakdown" and change its href from routes.ins to routes.roi. Do not change anything else about that link or the rest of the file.
```

### Cursor prompt 4C — build the ROI data module (single source of truth, with citations)

```
Create a new file lib/roi/roi-model.ts with this exact content:

/**
 * ARKA ROI model — single source of truth for the /roi page.
 * Every figure is a MODELED, conservative estimate built on published third-party
 * figures (CAQH, KFF, MGMA, AMA, ACR, Change Healthcare, Johns Hopkins). ARKA is
 * Non-Device CDS; these are decision-support economics, not a guarantee of outcomes.
 * Citations are listed in CITATIONS below and surfaced on the page.
 */

export type Citation = {
  id: string;
  label: string;
  detail: string;
  url: string;
};

export const CITATIONS: Citation[] = [
  {
    id: "change-healthcare",
    label: "Change Healthcare 2020 Denials Index",
    detail: "86% of denials are potentially avoidable; 34% are unequivocally avoidable; ~48% of avoidable denials are never recovered.",
    url: "https://www.rivethealth.com/blog/denials-revenue-cycle-management",
  },
  {
    id: "kff-2023",
    label: "KFF — ACA Marketplace claims denials & appeals (2023)",
    detail: "HealthCare.gov insurers denied ~19–20% of in-network claims; consumers appealed fewer than 1% of denials; 56% of appealed denials were upheld.",
    url: "https://www.kff.org/private-insurance/claims-denials-and-appeals-in-aca-marketplace-plans-in-2023/",
  },
  {
    id: "mgma-rework",
    label: "MGMA / Change Healthcare — cost to rework a denied claim",
    detail: "~$25 average administrative cost to rework a claim; up to ~$118 fully loaded; MGMA estimates 50–65% of denials are never reworked.",
    url: "https://www.mgma.com/mgma-stats/6-keys-to-addressing-denials-in-your-medical-practice-s-revenue-cycle",
  },
  {
    id: "caqh-index",
    label: "CAQH Index (2023 / 2024)",
    detail: "Manual prior authorization costs providers ~$10.97 per transaction and ~24 minutes of staff time; full electronic PA cuts cost and time dramatically.",
    url: "https://www.caqh.org/hubfs/43908627/drupal/2024-01/2023_CAQH_Index_Report.pdf",
  },
  {
    id: "ama-survey",
    label: "AMA 2024 Prior Authorization Physician Survey",
    detail: "94% of physicians report PA delays care; 78% report patients abandon treatment; physicians average ~13 hours/week on PA.",
    url: "https://www.ama-assn.org/practice-management/prior-authorization/exhausted-prior-auth-many-patients-abandon-care-ama-survey",
  },
  {
    id: "jhu-prices",
    label: "Johns Hopkins — commercial vs. Medicare radiology prices (2021)",
    detail: "Median commercial price for MRI brain w/wo contrast ~$1,788 (4x Medicare $446); CT head w/o contrast ~$813 (5.9x Medicare $137).",
    url: "https://hub.jhu.edu/2021/12/13/radiological-services-compared-to-medicare/",
  },
  {
    id: "oig-ma",
    label: "HHS OIG — Medicare Advantage prior-authorization denials",
    detail: "Among denied payment requests reviewed, ~18% met Medicare coverage and billing rules — i.e., were improperly denied.",
    url: "https://oig.hhs.gov/oei/reports/OEI-09-18-00260.pdf",
  },
];

/** Model assumptions for the conservative case (a regional hospital group). */
export const ASSUMPTIONS = {
  annualAdvancedStudies: 120000,          // advanced imaging studies / yr (MRI, CT, PET)
  denialRatePct: 22,                      // conservative midpoint of the 20–40% range
  avoidablePct: 86,                       // share of denials that are avoidable (Change Healthcare)
  blendedValuePerOrder: 1180,             // blended reimbursement/margin at risk per avoidable advanced-imaging order ($)
  arkaCaptureOfStudiesPct: 2.5,           // conservative share of ALL studies ARKA converts to clean pays
  reworkCostPerClaim: 25,                 // $ admin cost to rework one denied claim (low end)
  throughputRecovery: 500000,             // $ / yr from faster approvals on highest-margin line
  pmpmLow: 0.30,                          // $ price per member per month (low)
  pmpmHigh: 0.50,                         // $ price per member per month (high)
  modeledFirstYearReturnX: 2.3,           // modeled first-year return multiple
} as const;

/** Derived headline numbers (kept in one place so the page and charts stay in sync). */
const ordersRecovered = Math.round(
  ASSUMPTIONS.annualAdvancedStudies * (ASSUMPTIONS.arkaCaptureOfStudiesPct / 100),
);
const denialRecovery = ordersRecovered * ASSUMPTIONS.blendedValuePerOrder; // ≈ $3.54M
const reworkAvoided = ordersRecovered * ASSUMPTIONS.reworkCostPerClaim;     // ≈ $75K
const throughput = ASSUMPTIONS.throughputRecovery;                          // $0.5M
const grossRecovery = denialRecovery + reworkAvoided + throughput;

export const RESULTS = {
  ordersRecovered,
  denialRecovery,
  reworkAvoided,
  throughput,
  grossRecovery,
} as const;

/** Waterfall data for the recovery chart. */
export const WATERFALL = [
  { name: "Denial recovery", value: Math.round(denialRecovery), note: "Clean documentation at point of order converts would-be denials to clean pays." },
  { name: "Rework labor avoided", value: Math.round(reworkAvoided), note: "Fewer denials means fewer appeals worked by staff." },
  { name: "Throughput defense", value: Math.round(throughput), note: "Faster approvals shorten the backlog on your highest-margin line." },
] as const;

/** Headline stat cards. */
export const HEADLINE_STATS = [
  { value: "~$3.5M", label: "recovered / yr in avoidable imaging denials" },
  { value: "86%", label: "of imaging denials are avoidable" },
  { value: "<800ms", label: "to score an order, in-flow, no extra click" },
  { value: "35–40%", label: "of orders auto-clear and never hit a queue" },
] as const;

export function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}
```

### Cursor prompt 4D — build the ROI page client component (charts + layout)

```
Create a new file components/roi/RoiPageClient.tsx. It must be a client component ("use client") and use Recharts (already installed) for visualizations. Build a clean, professional, single-column-on-mobile / multi-column-on-desktop layout on a dark ARKA background (bg-arka-bg-dark, white/soft text), matching the rest of the site. Import model data from "@/lib/roi/roi-model" — do NOT hardcode numbers that already exist there; read from ASSUMPTIONS, RESULTS, WATERFALL, HEADLINE_STATS, CITATIONS, and formatUsd.

Structure the page top to bottom:

1) HERO STRIP
   - Eyebrow (uppercase, tracking-wider, text-arka-teal): "ARKA ROI MODEL · CONSERVATIVE CASE"
   - h1 (text-3xl sm:text-5xl font-bold text-arka-text): "The math a CFO can sign"
   - Subhead (text-arka-text-soft, max-w-2xl): "Modeled for a regional hospital group running ~120,000 advanced imaging studies a year. Every figure is a conservative estimate built on published CAQH, KFF, MGMA, AMA, ACR, Change Healthcare, and Johns Hopkins data — sourced at the bottom of this page."
   - A back link to "/" ("← Back to home", text-arka-cyan).

2) HEADLINE STAT CARDS — map HEADLINE_STATS into a responsive grid (grid-cols-2 lg:grid-cols-4). Each: big value in text-arka-cyan (text-4xl sm:text-5xl font-bold), label in text-sm text-arka-text-soft. Wrap each card in a subtle rounded-xl border border-arka-deep/60 bg-arka-bg-medium/40 p-6.

3) RECOVERY WATERFALL CHART (Recharts)
   - Section heading: "Where the ~$3.5M comes from".
   - Render a ResponsiveContainer (width="100%" height={340}) with a BarChart over WATERFALL data. X axis = name, Y axis formatted with formatUsd. Bars filled #14B8A6. Add a Tooltip whose formatter shows formatUsd(value) and the item's `note`. Add CartesianGrid with a faint stroke (#1E293B). Make axis tick text fill #E2E8F0. Below the chart, show the total in a callout: "Modeled gross recovery: {formatUsd(RESULTS.grossRecovery)} / yr".
   - IMPORTANT: import Recharts pieces individually: import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";

4) "HOW THE MODEL WORKS" — a transparent assumptions table built from ASSUMPTIONS. Render a 2-column definition list / table with rows:
   - "Advanced imaging studies / yr" → ASSUMPTIONS.annualAdvancedStudies.toLocaleString()
   - "Prior-auth denial rate (conservative)" → `${ASSUMPTIONS.denialRatePct}% (published range 20–40%)`
   - "Share of denials that are avoidable" → `${ASSUMPTIONS.avoidablePct}%`
   - "Blended value at risk per avoidable order" → formatUsd(ASSUMPTIONS.blendedValuePerOrder)
   - "Orders ARKA converts to clean pays (conservative)" → `${RESULTS.ordersRecovered.toLocaleString()} (${ASSUMPTIONS.arkaCaptureOfStudiesPct}% of studies)`
   - "Cost to rework one denied claim" → formatUsd(ASSUMPTIONS.reworkCostPerClaim)
   - "Throughput recovery (highest-margin line)" → formatUsd(ASSUMPTIONS.throughputRecovery)
   Style as rounded-xl border border-arka-deep/60 bg-arka-bg-medium/30 with divided rows; labels in text-arka-text-soft, values in text-arka-text font-semibold.

5) FOUR VALUE LEVERS — a 2x2 grid of cards explaining the levers (reuse the WATERFALL notes plus a fourth "Admin redirected — when the clinician's documentation is complete, clean orders clear payer review without a queue."). Each card: lucide-react icon in a teal chip, bold title, muted body. Use icons: TrendingUp, Clock, Gauge, ShieldCheck.

6) PRICING & RETURN
   - A short band: "Priced at ~$0.30–$0.50 PMPM — a modeled ~2.3× first-year return." Pull the values from ASSUMPTIONS.pmpmLow, ASSUMPTIONS.pmpmHigh, ASSUMPTIONS.modeledFirstYearReturnX.
   - A simple Recharts donut/PieChart OR a two-bar comparison (annual ARKA cost vs. modeled gross recovery) to visualize the 2.3x. Compute modeled annual cost = RESULTS.grossRecovery / ASSUMPTIONS.modeledFirstYearReturnX and chart "ARKA annual cost" vs "Modeled gross recovery".

7) INDUSTRY CONTEXT STRIP — 3–4 small stat callouts drawn from CITATIONS detail text, each with the figure bolded and a footnote number, e.g.:
   - "Fewer than 1% of denied in-network claims are ever appealed." (KFF 2023)
   - "Physicians spend ~13 hours/week on prior authorization." (AMA 2024)
   - "~18% of Medicare Advantage payment denials reviewed were improper." (HHS OIG)
   Each links its citation.

8) SOURCES — render CITATIONS as a numbered list; each item shows label (bold), detail (muted), and an external link (target="_blank" rel="noopener noreferrer", text-arka-cyan) to url. Add a closing disclaimer in text-xs text-arka-text-soft/60: "Modeled, conservative estimate. ARKA is Non-Device CDS — figures are decision-support economics, not a guarantee of outcomes. Aggressive case ≈ 1.5× the conservative figures."

Use framer-motion for subtle fade-in-on-scroll (optional, keep it light). Make sure the file compiles, all imported icons exist in lucide-react, and there are no unused imports. Keep the page fully responsive and readable on mobile.
```

### Cursor prompt 4E — build the route page (server component + metadata)

```
Create a new file app/roi/page.tsx with this exact content:

import type { Metadata } from "next";
import { RoiPageClient } from "@/components/roi/RoiPageClient";

const ROI_DESCRIPTION =
  "ARKA ROI model — the conservative case for a regional hospital group running ~120,000 advanced imaging studies a year. Modeled denial recovery, rework labor avoided, and throughput defense, built on published CAQH, KFF, MGMA, AMA, ACR, Change Healthcare, and Johns Hopkins figures.";

export const metadata: Metadata = {
  title: "ROI Breakdown",
  description: ROI_DESCRIPTION,
  openGraph: {
    title: "ARKA — The math a CFO can sign",
    description: ROI_DESCRIPTION,
  },
};

export default function RoiPage() {
  return <RoiPageClient />;
}

Then create app/roi/layout.tsx ONLY IF other top-level demo routes in this repo use a per-route layout for shared chrome (check app/action-plan — if it has no layout.tsx, skip creating one for /roi and rely on the root app/layout.tsx). If a layout is needed, mirror the structure of app/action-plan if present.
```

**Verify:** Visit `/roi`. You should see the headline stats, a recovery waterfall chart, a transparent assumptions table, the four levers, a pricing/return comparison chart, the industry-context strip, and a numbered Sources list — all on the dark ARKA theme. The homepage "See the full ROI breakdown" button now lands here, not on `/ins`.

---

## Fix 5 — Merge the three repetitive platform sections into one cumulative section

**Screenshots 6, 7, 8, 9.** The homepage repeats the same four phases three times: the **Ecosystem diagram** (`EcosystemDiagram`, "One Ecosystem. Four Solutions."), the **Phase cards** (`PhaseCards`, "Explore the platform"), and the **Platform band** (`PlatformBand`, "Imaging is the wedge…"). Collapse these into **one** section that (a) introduces ARKA as a **shared knowledge base**, (b) introduces the four phases, (c) gives each phase a description that **absorbs every description currently shown across those three components**, and (d) gives each phase an **"Enter Demo" link**. It may take a bit more vertical space than a single band, but far less than the current three sections combined.

> **Descriptions to merge per phase** (use these consolidated copy blocks so nothing from the old sections is lost):
> - **ARKA-CLIN** — "Standalone + EHR-embedded (CDS Hooks). Two views, one engine: the standalone clinician web app and ARKA running inside a simulated Epic chart via HL7 CDS Hooks. The provider-side appropriateness + denial-risk engine — evidence-based ordering guidance at the point of care."
> - **ARKA-ED** — "For medical students & residents. An interactive learning platform for mastering radiology protocols and imaging appropriateness criteria — training clinicians to order appropriately and filling the gap left by the repealed PAMA AUC mandate."
> - **ARKA-INS** — "For radiology benefit managers. The same engine on the payer's side: CMS-0057-F Da Vinci PAS, shipping today. Streamlined utilization review that ensures appropriate imaging while reducing administrative burden."
> - **Rural Platform (ARKA-RURAL)** — "Resource-aware decision support for low-capacity and rural sites — teleradiology, training, reimbursement, network, AI, and population intelligence for rural imaging access."

### Cursor prompt 5A — create the unified section

```
Create a new file components/landing/PlatformEcosystem.tsx. It is a "use client" component that REPLACES three existing sections (EcosystemDiagram, PhaseCards, PlatformBand) with one cumulative section. Use framer-motion useInView for fade-ins, lucide-react icons, next/link, and routes from "@/lib/constants".

Layout, top to bottom, inside a <section id="platform" className="scroll-mt-14 border-t border-arka-light bg-white px-4 py-24 sm:px-6 lg:px-8"> with an inner <div className="mx-auto max-w-6xl">:

1) HEADER
   - h2 (text-center text-2xl font-bold text-arka-text-dark sm:text-3xl): "One engine. One shared knowledge base. Four phases."
   - Intro paragraph (mx-auto mt-4 max-w-3xl text-center text-arka-text-dark-muted): "ARKA is a single decision engine with a shared knowledge base. Insights from each phase inform and improve the others — the same math runs on both sides of the prior-auth wall, from the clinician's order to the payer's review. Explore the four phases below."

2) A COMPACT "SHARED KNOWLEDGE BASE" VISUAL
   - A small centered hub-and-spoke graphic: a central pill labeled "ARKA" with a teal ring, and four small labeled chips (CLIN, ED, INS, RURAL) arranged around it connected by thin teal lines. Keep it modest in height (about 220–260px). You may implement it as an inline SVG (viewBox 0 0 600 240) with four lines from a center circle to four node circles, center labeled "ARKA" and a small caption beneath: "SHARED KNOWLEDGE BASE" (uppercase, tracking-wider, text-arka-teal text-xs). This replaces the large standalone EcosystemDiagram — keep it intentionally compact. Mark the SVG aria-hidden and provide a visually-hidden text alternative.

3) FOUR PHASE CARDS (cumulative)
   Define a `phases` array with these four entries (id, title, subtitle, description, href, icon, accentColor, liveDemo?):
   - clin-suite: title "ARKA-CLIN", subtitle "Standalone + EHR-Embedded (CDS Hooks) · For Clinicians", description "Two views, one engine: the standalone clinician web app and ARKA running inside a simulated Epic chart via HL7 CDS Hooks. The provider-side appropriateness + denial-risk engine — evidence-based ordering guidance at the point of care.", href routes.clinSuite, icon Stethoscope, accentColor "#14B8A6", liveDemo true
   - ed: title "ARKA-ED", subtitle "For Medical Students & Residents", description "An interactive learning platform for mastering radiology protocols and imaging appropriateness criteria — training clinicians to order appropriately and filling the gap left by the repealed PAMA AUC mandate.", href routes.ed, icon GraduationCap, accentColor "#14B8A6"
   - ins: title "ARKA-INS", subtitle "For Radiology Benefit Managers", description "The same engine on the payer's side: CMS-0057-F Da Vinci PAS, shipping today. Streamlined utilization review that ensures appropriate imaging while reducing administrative burden.", href routes.ins, icon ShieldCheck, accentColor "#0F172A"
   - rural: title "Rural Platform", subtitle "Rural Imaging Crisis", description "Resource-aware decision support for low-capacity and rural sites — teleradiology, training, reimbursement, network, AI, and population intelligence for rural imaging access.", href routes.rural, icon MapPin, accentColor "#0d9488"

   Render them in a responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6). Each card is a next/link to href: group relative flex flex-col rounded-xl border border-arka-light bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover. Inside each: an icon chip (h-11 w-11 rounded-lg text-white with backgroundColor = accentColor), a "Live Demo" pill in the top-right ONLY when liveDemo is true (reuse the existing pill styles: rounded-full border border-arka-cyan/60 bg-arka-cyan/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-arka-cyan), the title (text-lg font-semibold text-arka-text-dark), the subtitle (text-sm font-medium, color = accentColor), the description (text-sm leading-relaxed text-arka-text-dark-muted flex-1), and a bottom "Enter Demo →" row using lucide-react ArrowRight (text-sm font-semibold, color = accentColor, with group-hover:translate-x-1 on the arrow).

4) FOOTER LINE (mx-auto mt-12 max-w-3xl text-center font-medium text-arka-text-dark): "At ~$0.30–$0.50 PMPM, a modeled ~2.3× first-year return — and the same engine reaches into the ~$10B appropriateness layer of American medicine." Followed by a tiny disclaimer (text-xs text-arka-text-dark-muted): "Modeled estimate; full sourced ranges in the ROI breakdown." Make that disclaimer's phrase "ROI breakdown" a next/link to routes.roi (text-arka-teal underline).

Stagger the card fade-ins (delay i * 0.1). Ensure no unused imports and the file compiles.
```

### Cursor prompt 5B — swap the sections on the homepage

```
Open app/page.tsx.

1) Remove these three imports:
   import { PlatformBand } from "@/components/landing/PlatformBand";
   import { PhaseCards } from "@/components/landing/PhaseCards";
   import { EcosystemDiagram } from "@/components/landing/EcosystemDiagram";

2) Add this import with the other landing imports:
   import { PlatformEcosystem } from "@/components/landing/PlatformEcosystem";

3) In the JSX, remove <PlatformBand />, <PhaseCards />, and <EcosystemDiagram />, and insert a single <PlatformEcosystem /> in their place (put it where <PlatformBand /> used to be, i.e. after <TrustBand />). The final homepage order should be:
   Hero, GetPaidSection, ProblemSection, RevenueProof, WhyArka, TrustBand, PlatformEcosystem, Testimonials, CtaSection.

Do NOT delete the old component files yet (PlatformBand.tsx, PhaseCards.tsx, EcosystemDiagram.tsx) — leave them in the repo unused until the final verification passes, in case you need to revert. Save and confirm the homepage compiles.
```

**Verify:** The homepage now has a single platform section: header introducing ARKA as a shared knowledge base, a compact hub-and-spoke visual, four phase cards each carrying the merged description and an "Enter Demo →" link, and the closing PMPM line. The old three-section repetition is gone.

---

## Fix 6 — Bottom-CTA buttons → "Evidence & Compliance" and "Action Plan"

**Screenshot 10.** Replace the `CtaSection` buttons "See the revenue model" and "Explore the platform" with **"Evidence & Compliance"** and **"Action Plan"**, wired to the same destinations as the footer's Evidence (modal) and Action Plan (`/action-plan`) links.

> The footer "Evidence" control opens a global modal via `useEvidenceModal()` from `@/components/shared/compliance/evidence-modal-context`. "Action Plan" is a normal link to `/action-plan`. We'll reuse both.

### Cursor prompt 6A

```
Open components/landing/CtaSection.tsx.

Goal: replace the two CTA buttons with "Evidence & Compliance" (opens the global evidence/compliance modal) and "Action Plan" (links to /action-plan).

1) At the top, add:
   import { useEvidenceModal } from "@/components/shared/compliance/evidence-modal-context";
   (Keep the existing imports for motion, useInView, useRef, Link.)

2) Inside the CtaSection component body, before the return, add:
   const { setOpen } = useEvidenceModal();

3) Replace the two <Link> buttons inside the motion.div (currently "See the revenue model" -> "#revenue", and "Explore the platform" -> "#solutions") with:

   - A <button type="button" onClick={() => setOpen(true)} ...> labeled "Evidence & Compliance" using the existing primary button classes (arka-button-primary inline-flex min-h-[44px] items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-light touch-manipulation).

   - A <Link href="/action-plan" ...> labeled "Action Plan" using the existing secondary button classes (arka-button-secondary inline-flex min-h-[44px] items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-light touch-manipulation).

Keep the heading, the descriptive paragraph, and the "remARKAbly precise — and remarkably profitable." line unchanged.

IMPORTANT — context availability: useEvidenceModal throws if it is not rendered inside EvidenceModalProvider. This is already satisfied: app/layout.tsx wraps the whole app in <FDAComplianceProvider>, which internally renders <EvidenceModalProvider> (see components/shared/compliance/FDAComplianceProvider.tsx), so the homepage CtaSection is inside the provider and the primary path works. (Defensive fallback, only if you ever move the provider) instead import useEvidenceModalOptional from the same module, call it, and guard: const evidence = useEvidenceModalOptional(); then onClick={() => evidence?.setOpen(true)} — and if evidence is null, fall back to a <Link href="/docs/regulatory-rationale">. Verify by clicking the button on the homepage and confirming the evidence modal opens.
```

**Verify:** On the bottom CTA, "Evidence & Compliance" opens the same evidence modal the footer opens; "Action Plan" navigates to `/action-plan`.

---

## Fix 7 — Add "ARKA-RURAL" to the feedback widget

**Screenshot 11.** The feedback form's "Which phase is this feedback for?" list has ARKA-CLIN, ARKA-ED, ARKA-INS, and General/Overall. Add **ARKA-RURAL**.

**File:** `components/FeedbackWidget.tsx`. The phase list is `PHASE_OPTIONS` (around line 8), and the initial selection state object appears in **two** places (initial `useState` around line 31 and the reset block around line 52).

### Cursor prompt 7A

```
Open components/FeedbackWidget.tsx.

Add an "ARKA-RURAL" phase to the feedback form. Make these three edits consistently:

1) In the PHASE_OPTIONS array, add a new entry BETWEEN the "arka-ins" entry and the "general" entry:
   { id: "arka-rural", value: "ARKA-RURAL", label: "ARKA-RURAL" },

2) In the initial useState object for `phases` (the one initialized with "ARKA-CLIN": false, "ARKA-ED": false, "ARKA-INS": false, "General/Overall": false), add "ARKA-RURAL": false in the same order (after "ARKA-INS": false).

3) In the reset/clear block that sets phases back to all-false after a successful submit (the second object with the same four keys), likewise add "ARKA-RURAL": false after "ARKA-INS": false.

Do not change any other logic. The multi-select validation (at least one phase required) and the submit payload (selectedPhases) will pick up the new option automatically. Confirm the file compiles and that "ARKA-RURAL" now appears as a selectable checkbox in the feedback form between "ARKA-INS" and "General/Overall".
```

**Verify:** Open the feedback widget; "ARKA-RURAL" appears as a checkbox; selecting it and submitting includes it in the payload.

---

## Appendix A — ROI research: figures, formulas, and citations

Every number on `/roi` traces to a published third-party source. These are **modeled, conservative estimates** — ARKA is Non-Device CDS, so they are decision-support economics, not guaranteed outcomes.

### A.1 — Source figures

| Figure | Value used | Source |
|---|---|---|
| Advanced-imaging prior-auth denial rate | 20–40% (model uses 22% conservative) | Medicare Advantage denial patterns; MRI denial >30% for some insurers |
| Share of denials that are avoidable | 86% (34% "unequivocally") | Change Healthcare 2020 Denials Index |
| Avoidable denials never recovered | ~48% | Change Healthcare 2020 Denials Index |
| Denials never reworked | 50–65% | MGMA |
| Denials appealed (ACA in-network) | <1%; 56% upheld on appeal | KFF 2023 |
| ACA in-network claim denial rate | ~19–20% | KFF 2023 |
| Cost to rework one denied claim | ~$25 admin (up to ~$118 fully loaded) | MGMA / Change Healthcare |
| Manual prior-auth cost (provider) | ~$10.97 / transaction, ~24 min | CAQH Index 2023 |
| Physician PA burden | 94% delays care; 78% abandon treatment; ~13 hrs/week; 29% serious adverse event | AMA 2024 PA survey |
| Commercial MRI brain w/wo contrast | ~$1,788 median (4× Medicare $446) | Johns Hopkins, 2021 |
| Commercial CT head w/o contrast | ~$813 median (5.9× Medicare $137) | Johns Hopkins, 2021 |
| Improper MA payment denials | ~18% met coverage rules | HHS OIG (OEI-09-18-00260) |

### A.2 — The model (conservative case)

```
Annual advanced imaging studies ............... 120,000
Blended value at risk per avoidable order ..... $1,180   (between commercial CT ~$813 and MRI ~$1,788)
ARKA conservative capture of all studies ...... 2.5%  →  ~2,966 orders converted to clean pays
Denial recovery ............................... 2,966 × $1,180   ≈ $3.50M
Rework labor avoided .......................... 2,966 × $25      ≈ $0.07M
Throughput defense (highest-margin line) ...... ~$0.50M
-----------------------------------------------------------------
Modeled gross recovery ........................ ≈ $4.07M / yr
Pricing ....................................... ~$0.30–$0.50 PMPM
Modeled first-year return ..................... ~2.3×  (aggressive case ≈ 1.5× the conservative figures)
```

The $1,180 "blended value per avoidable order" sits deliberately below the median commercial advanced-imaging price (Johns Hopkins data: CT head ~$813, MRI brain w/wo contrast ~$1,788), so the headline ~$3.5M recovery is conservative.

### A.3 — Citation URLs (used in `lib/roi/roi-model.ts` `CITATIONS`)

- Change Healthcare Denials Index (via Rivet): https://www.rivethealth.com/blog/denials-revenue-cycle-management
- KFF ACA denials & appeals 2023: https://www.kff.org/private-insurance/claims-denials-and-appeals-in-aca-marketplace-plans-in-2023/
- MGMA denials: https://www.mgma.com/mgma-stats/6-keys-to-addressing-denials-in-your-medical-practice-s-revenue-cycle
- CAQH 2023 Index Report: https://www.caqh.org/hubfs/43908627/drupal/2024-01/2023_CAQH_Index_Report.pdf
- AMA 2024 PA survey: https://www.ama-assn.org/practice-management/prior-authorization/exhausted-prior-auth-many-patients-abandon-care-ama-survey
- Johns Hopkins radiology prices: https://hub.jhu.edu/2021/12/13/radiological-services-compared-to-medicare/
- HHS OIG MA denials: https://oig.hhs.gov/oei/reports/OEI-09-18-00260.pdf

---

## Final verification — smoke test before sharing

Run the dev server (`npm run dev`) and walk through this checklist:

1. **FDA modal (Fix 1):** Clear the acknowledgment key in localStorage, reload `/`. Modal is a larger dark navy panel with white/light, readable text; links and button are larger. Click "I Acknowledge" — it dismisses and stays dismissed on reload.
2. **Hero (Fix 2):** Logo is noticeably larger; teal "CUTTING EDGE IMAGING DECISION SUPPORT" sits directly under it; "You did the scan…" + paragraph now appear as their own section further down.
3. **Loop (Fix 3):** The problem section reads as a closed cycle with arrows (square on desktop, stacked with down-arrows + "loops back" on mobile).
4. **ROI page (Fix 4):** "See the full ROI breakdown" → `/roi` (not `/ins`). Charts render, assumptions table and Sources list are present, numbers match Appendix A.
5. **Unified platform (Fix 5):** One platform section only; four phase cards with merged copy and "Enter Demo →" links; compact shared-knowledge-base visual; old three sections gone from the page.
6. **Bottom CTA (Fix 6):** "Evidence & Compliance" opens the evidence modal; "Action Plan" → `/action-plan`.
7. **Feedback (Fix 7):** "ARKA-RURAL" checkbox present between ARKA-INS and General/Overall and submits correctly.
8. **Build:** `npm run build` completes with no type errors. Then optionally delete the now-unused `PlatformBand.tsx`, `PhaseCards.tsx`, and `EcosystemDiagram.tsx` (Fix 5) — run `npm run build` again to confirm nothing else imported them.

> Tip: after `npm run build` passes, run `npx tsc --noEmit` for a final type check and grep for any leftover imports of the removed components: `grep -rn "EcosystemDiagram\|PhaseCards\|PlatformBand" app components`.
