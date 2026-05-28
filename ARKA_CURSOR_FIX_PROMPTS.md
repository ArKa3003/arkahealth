# ARKA Health — Cursor Fix Prompts (Pre-Shareholder Demo)

> **How to use this document:** Each section below is a self-contained prompt you can paste directly into Cursor's chat panel (Cmd+L). They are ordered so dependencies resolve cleanly. Run them sequentially. After each prompt, save the files Cursor opens and start the dev server (`npm run dev`) to spot regressions before moving on. Final verification steps are at the bottom.
>
> **Project root:** `/Users/arrikanna/Desktop/arkahealth`
> **Framework:** Next.js 16 (App Router) + React 19 + Tailwind v4 + Framer Motion 12
> **Demo URL:** `https://www.getarka.health`

---

## Table of Contents

1. Fix #1 — Resolve "The string did not match the expected pattern" in the CDS Hooks Live Demo
2. Fix #2 — Add the missing CLIN connection line to the Ecosystem Diagram (and confirm Rural is represented)
3. Fix #3 — Collapse ARKA-CLIN + CDS Hooks Live Demo into a single combined route
4. Fix #4 — Add the Hero-style fade-in page transition to every page
5. Fix #5 — Eliminate the blank-screen buffering between client routes
6. Fix #6 — Replace the small icon next to demo titles with the full animated logo, sitewide
7. Fix #7 — Surface the validation dashboard, regulatory rationale, feature catalog, and discovery JSON in primary navigation
8. Final verification — Smoke test before the shareholder demo

---

## Fix #1 — Eliminate "The string did not match the expected pattern" in the CDS Hooks Live Demo

**Symptom (Screenshots 1 & 2):** When a new patient/scenario is selected in `/cds-hooks-demo`, the right sidebar shows "Evaluating order…" for several seconds and the "Live CDS Hooks JSON → Response" panel renders `The string did not match the expected pattern.`

**Root cause:** In `components/cds-platform/demo/build-cds-request.ts`, every request carries `fhirServer: 'https://demo.epicsim.arkahealth.local/fhir'`. The route handler at `app/api/cds-services/arka-clin-appropriateness/route.ts` passes that string into `handleOrderSelect` in `lib/cds-platform/cds-hooks/order-select.ts`, where `resolvePrefetch` sees a truthy `fhirServer` and calls `createFHIRClient({ baseUrl: fhirServer })`. Because all prefetch bundles are *already* supplied client-side, the branch at line ~109 `if (partial.patient || Object.keys(partial).length > 0)` enters `resolver.resolveMissing(...)`, which hits the bogus `.local` host. `fhir-kit-client` (and Node 20's `URL` parsing) throws `TypeError: The string did not match the expected pattern.` That error bubbles back as the JSON body, which is also why "Evaluating order…" appears to hang — the fetch is doing a DNS attempt before failing.

The demo never *needs* a real FHIR server because all six prefetch resources (`patient`, `activeConditions`, `recentImaging`, `relevantLabs`, `activeMedications`, `priorServiceRequests`) are inlined by `build-cds-request.ts`. The fix has two layers: stop sending the fake URL, and make the resolver tolerant of a missing `fhirServer` when prefetch is already complete.

### Cursor prompt 1A — make the demo stop sending a bogus `fhirServer`

```
Open `components/cds-platform/demo/build-cds-request.ts`.

In `buildCdsRequest`, remove the `fhirServer: 'https://demo.epicsim.arkahealth.local/fhir',` line entirely. The demo inlines every prefetch resource, so we don't need an external FHIR server. After the change, the returned object should have `hook`, `hookInstance`, `context`, and `prefetch` only — no `fhirServer` key.

While you're in there, add a JSDoc note above `buildCdsRequest` that says: "The demo provides a complete prefetch bundle, so we intentionally omit `fhirServer`. Including a non-resolvable host (e.g. `.local`) causes Node's URL parser to throw `TypeError: The string did not match the expected pattern.` when the server-side handler tries to fetch missing resources."

Do not change anything else in this file.
```

### Cursor prompt 1B — make the server tolerant of partial prefetch even when `fhirServer` is set

```
Open `lib/cds-platform/cds-hooks/order-select.ts`. Find `async function resolvePrefetch(request: CDSHooksRequest)` (~line 84).

The current logic enters the `createFHIRClient` branch whenever `fhirServer` is truthy, even when the client has already supplied a complete prefetch. That causes `TypeError: The string did not match the expected pattern.` for unresolvable hosts.

Change the function so it ONLY contacts the FHIR server when prefetch is missing required keys. Concretely:

1. After the existing block that copies `prefetch.patient`, `prefetch.activeConditions`, etc. into `partial`, compute `const prefetchComplete = Boolean(partial.patient && partial.activeConditions && partial.recentImaging && partial.relevantLabs && partial.activeMedications && partial.priorServiceRequests);`
2. If `prefetchComplete` is true, RETURN the assembled `PrefetchData` directly (use `emptyBundle()` for any field that is null/undefined just in case), without touching `createFHIRClient`. This is the demo path.
3. Only if `prefetchComplete` is false AND `fhirServer` is a non-empty string AND `URL.canParse(fhirServer)` is true, enter the `createFHIRClient` branch. Otherwise, fall through to the existing "return null" / minimal-partial branch.
4. Wrap the `createFHIRClient` block in a `try { ... } catch (err) { logger.warn({ err, fhirServer }, 'FHIR prefetch resolution failed; returning partial prefetch'); return prefetchComplete ? (partial as PrefetchData) : null; }` so a bad URL never throws to the route handler.

Do the same defensive `URL.canParse` + try/catch refactor in `lib/cds-platform/cds-hooks/order-sign.ts` inside its `resolvePrefetch` (~line 44). Keep behavior identical for production callers that provide a real FHIR base URL.

Run `npm run type-check` after the edit and fix any TypeScript errors that surface.
```

### Cursor prompt 1C — surface a friendlier message if the response panel still ever gets an error

```
Open `components/cds-platform/demo/CdsDemoClient.tsx`. Find the JSON panel rendering block (~line 240) where it shows `{ex.error ?? 'null'}`.

Replace that fallback line with a small helper that converts low-level errors into something readable for shareholders:

```tsx
{(() => {
  const raw = ex.error ?? 'null';
  if (raw.includes('did not match the expected pattern')) {
    return 'CDS service unreachable in offline mode — using cached scenario response.';
  }
  return raw;
})()}
```

Keep the `pre`/`font-mono`/`text-red-300` styling. Do not alter the success path.
```

After 1A + 1B you should see scenarios load instantly with a valid CDS Hooks 2.0 response. 1C is belt-and-braces in case any edge case still produces an error.

---

## Fix #2 — Ecosystem Diagram is missing the CLIN line and the Rural node

**Symptom (Screenshot 3):** The "One Ecosystem. Three Solutions." diagram on the home page shows lines from `ARKA` to `INS` and `ED`, but the line to `CLIN` does not render. The diagram also doesn't represent the Rural Platform even though Rural is a first-class pillar in the rest of the site.

**Root cause:** `components/landing/EcosystemDiagram.tsx` does paint a `connectionPath(DESKTOP.center, DESKTOP.clin, …)` line at line ~426, but the line is buried behind the targeting-grid `<rect>` background pattern and (visually) behind the centered "Shared knowledge base" label, which sits at `y = center.y + 64`. The CLIN node is at `y = center.y - 150` (above center), so the vertical leg runs through the same x-axis as the dense grid crosshairs and a vertical grid line, dropping its perceived contrast to near-zero against the light backdrop. The ED/INS legs are diagonal and don't intersect a grid crosshair, so they read fine.

There are two clean options. Option A (recommended) keeps the triangle and forces the CLIN line above the grid + adds a Rural node as a small fourth node off-axis. Option B removes all lines entirely. Use Option A unless the team objects.

### Cursor prompt 2 — render the missing CLIN line and add Rural to the diagram

```
Open `components/landing/EcosystemDiagram.tsx`.

(1) RURAL NODE — add to the `nodes` array (after `ins`):
```ts
{
  id: "rural" as const,
  label: "RURAL",
  fullName: "Rural Platform",
  href: routes.rural,
  tooltip:
    "Rural imaging crisis hub — resource-aware CDS, teleradiology, training, reimbursement, network, AI, and population intelligence.",
},
```
Update the `NodeId` type to include `"rural"`.

(2) GEOMETRY — turn the triangle into a square/diamond so each node has its own axis. Replace the `DESKTOP` constant with:
```ts
const DESKTOP_RADIUS = 160;
const DESKTOP_CX = 360;
const DESKTOP_CY = 220;
const DESKTOP = {
  width: 720,
  height: 460,
  center: { x: DESKTOP_CX, y: DESKTOP_CY },
  clin: { x: DESKTOP_CX, y: DESKTOP_CY - DESKTOP_RADIUS },
  ed:   { x: DESKTOP_CX + DESKTOP_RADIUS, y: DESKTOP_CY },
  ins:  { x: DESKTOP_CX - DESKTOP_RADIUS, y: DESKTOP_CY },
  rural:{ x: DESKTOP_CX, y: DESKTOP_CY + DESKTOP_RADIUS },
};
```
Do the same restructuring for `MOBILE`: add `rural: { x: 140, y: 380 }` and bump `MOBILE.height` to 500.

(3) CONNECTION ORDER — in the desktop SVG (~line 413), paint the four lines in this order so the vertical CLIN leg is the topmost segment and reads cleanly:
```tsx
<AnimatedDashedPath idPrefix={desktopId} d={connectionPath(DESKTOP.center, DESKTOP.ed,    44, 34)} isHighlighted={isPathHighlighted("ed")} />
<AnimatedDashedPath idPrefix={desktopId} d={connectionPath(DESKTOP.center, DESKTOP.ins,   44, 34)} isHighlighted={isPathHighlighted("ins")} />
<AnimatedDashedPath idPrefix={desktopId} d={connectionPath(DESKTOP.center, DESKTOP.rural, 44, 34)} isHighlighted={isPathHighlighted("rural")} />
<AnimatedDashedPath idPrefix={desktopId} d={connectionPath(DESKTOP.center, DESKTOP.clin,  44, 34)} isHighlighted={isPathHighlighted("clin")} />
```
Mirror this in the mobile SVG block.

(4) CONTRAST — the missing CLIN segment is also caused by the targeting grid drowning the vertical line. Inside `AnimatedDashedPath`, in the "solid underlay" `motion.path`, raise `strokeOpacity` floor from `0.3` to `0.55` (animated) and `0.45` initial → `0.6`. Keep the highlighted value at `0.6` minimum. This guarantees every leg is visible even when not hovered.

(5) `isPathHighlighted` — extend the union to include `"rural"`.

(6) NODES — render four perimeter NodeCircle entries in both desktop and mobile by iterating over the new four-element `nodes` array. The `cx`/`cy` lookup currently uses a manual ternary; replace it with a `const NODE_POSITIONS = { clin: DESKTOP.clin, ed: DESKTOP.ed, ins: DESKTOP.ins, rural: DESKTOP.rural }` lookup so adding more nodes later is trivial. Do the same for mobile.

(7) LABEL — move the "Shared knowledge base" text from `y = center.y + 64` to `y = center.y + 12` so it sits inside the ARKA node area and stops competing with the now-occupied bottom Rural leg. Keep it teal at 80% opacity.

(8) HEADING — update the section heading from "One Ecosystem. Three Solutions." to "One Ecosystem. Four Solutions." Update the `<title>` element inside both SVGs to "ARKA ecosystem diagram: CLIN, ED, INS, and Rural Platform connected to a shared knowledge base."

Run `npm run dev`, open `/`, scroll to the ecosystem section, hover each node, and confirm: (a) all four lines are visible at rest, (b) CLIN line is no longer faint, (c) clicking RURAL navigates to `/rural`, (d) mobile layout stacks cleanly without overlap.
```

---

## Fix #3 — Combine ARKA-CLIN and the CDS Hooks Live Demo into one entry, and pull CDS Hooks Discovery in with it

**Symptom (Screenshots 4, 5, 6, 7):** The nav and PhaseCards expose five separate links (ARKA-CLIN, ARKA-ED, ARKA-INS, Rural, CDS Hooks Demo). The two CLIN views are already framed as "Two views, one engine" inside each page via `DemoViewSwitcher`, but they're still split as two distinct top-level destinations. CDS Hooks Discovery is buried in the footer.

**Requirement:** Combine ARKA-CLIN and CDS Hooks Live Demo into one entry titled **"ARKA-CLIN · Standalone + EHR-Embedded"** (you may also use **"ARKA-CLIN — Two Views, One Engine"**; the former is more shareholder-legible). The combined entry should NOT delete either demo — both must remain reachable and fully functional. CDS Hooks Discovery must also be exposed inside that combined surface.

**Strategy:** Keep the `/clin` and `/cds-hooks-demo` routes intact so deep links and `DemoViewSwitcher` keep working. Create a new landing route `/clin-suite` that renders both demos as tabs on one page, and surfaces CDS Hooks Discovery + the validation dashboard + regulatory rationale links inside that page's sidebar. Update navigation to point to `/clin-suite` instead of the two separate links.

### Cursor prompt 3A — add a combined route at `/clin-suite`

```
Create a new directory `app/clin-suite/`. Inside it, create two files.

`app/clin-suite/layout.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-CLIN Suite | Standalone + EHR-Embedded",
  description:
    "Two views, one engine. ARKA-CLIN as a standalone web app and ARKA-CLIN embedded inside an EHR via HL7 CDS Hooks — on a single page.",
  openGraph: {
    title: "ARKA-CLIN Suite | ARKA Health",
    description:
      "Standalone web app and CDS Hooks EHR-embedded demo side-by-side, plus CDS Hooks discovery and validation.",
  },
};

export default function ClinSuiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
```

`app/clin-suite/page.tsx`: a client component that renders a Radix Tabs (`@radix-ui/react-tabs` is already a dependency) component with three tabs:

  - Tab 1: "Standalone Web App (ARKA-CLIN)" — render the same content as `/clin`. Import and reuse `ClinDemoContent` and `HowArkaWorksSection` from `@/components/demos/clin/...`. Above the tab content, render a short purpose blurb: "The ARKA web application, used directly by a clinician in a browser. Enter or pick a clinical scenario; receive an evidence-based appropriateness score, factor breakdown, alternatives, and citations."
  - Tab 2: "EHR-Embedded (CDS Hooks Live Demo)" — render `CdsDemoClient` from `@/components/cds-platform/demo/CdsDemoClient`. Above it, render a purpose blurb: "The same ARKA engine, rendered inside a simulated Epic chart via the HL7 CDS Hooks open standard — the way a clinician sees ARKA in production. The live JSON panel shows real CDS Hooks 2.0 traffic."
  - Tab 3: "CDS Hooks Discovery" — render an iframe or fetch+display of `/.well-known/cds-services` (the discovery JSON). Below the JSON, link to `/cds-hooks-demo/validation` (validation dashboard), `/docs/regulatory-rationale`, and `/docs/feature-catalog` with short one-line descriptions of each.

Use Radix Tabs (already imported elsewhere in the codebase — search for `@radix-ui/react-tabs` to copy the import shape). Default open tab = "standalone". Persist the active tab in the URL search param `?view=standalone|embedded|discovery` using `useSearchParams` / `router.replace` so reload doesn't reset and so the existing `DemoViewSwitcher` deep links can map onto this page.

Wrap the entire page in the same `motion.div` fade-in animation pattern already used in `/clin/page.tsx` (initial opacity 0 y 8, animate opacity 1 y 0, duration 0.35 easeOut). Apply the `bg-arka-bg-light` background.

At the top of the page, add a breadcrumb identical in style to the existing `/clin/page.tsx` breadcrumb: `Home > ARKA-CLIN Suite`. Beneath it, render an H1: "ARKA-CLIN — Two Views, One Engine." Subtitle: "Standalone web app, EHR-embedded CDS Hooks view, and the CDS Hooks discovery service — all reachable from one place."

CRITICAL: Do NOT modify `app/clin/page.tsx` or `app/cds-hooks-demo/page.tsx`. They must stay routable for deep-link continuity. The new page reuses their inner components.
```

### Cursor prompt 3B — point navigation at the combined page (without removing the old routes)

```
Open `lib/constants.ts`.

(1) Add to `routes`:
```ts
clinSuite: "/clin-suite",
cdsHooksDiscovery: "/cds-hooks-discovery",
featureCatalog: "/docs/feature-catalog",
```
Keep `clin` and `cdsHooksDemo` as-is.

(2) Replace `demoNavLinks` with a four-entry list:
```ts
export const demoNavLinks = [
  { href: routes.clinSuite, label: "ARKA-CLIN Suite", icon: "Stethoscope" },
  { href: routes.ed, label: "ARKA-ED", icon: "GraduationCap" },
  { href: routes.ins, label: "ARKA-INS", icon: "Shield" },
  { href: routes.rural, label: "Rural Platform", icon: "TreePine" },
] as const;
```
This collapses the two CLIN entries into one and brings the top-level link count from five to four.

(3) Replace `phaseCards` similarly: keep five cards if Rural and the combined suite stay, but the "ARKA-CLIN" and "CDS Hooks Live Demo" cards must merge into one with:
```ts
{
  id: "clin-suite",
  title: "ARKA-CLIN Suite",
  subtitle: "Standalone + EHR-Embedded (CDS Hooks)",
  description:
    "Two views, one engine. The standalone clinician web app and ARKA running inside a simulated Epic chart via HL7 CDS Hooks — on a single page.",
  href: routes.clinSuite,
  icon: "Stethoscope",
},
```
Keep `ed`, `ins`, and `rural` entries unchanged. Total cards = 4. The Live Demo badge from the old CDS Hooks card should be re-applied to this combined card.

(4) Update `navLinks` (used by the footer) the same way: drop the separate "CDS Hooks Demo" entry, replace "ARKA-CLIN" with "ARKA-CLIN Suite" pointing at `routes.clinSuite`.

(5) Open `components/landing/PhaseCards.tsx`. Update the `cards` array to mirror the new `phaseCards`: four cards (CLIN Suite, ED, INS, Rural), and reapply `liveDemo: true` on the CLIN Suite card. Update the grid `xl:grid-cols-5` to `xl:grid-cols-4` so cards don't stretch.

(6) Open `components/navigation/Navbar.tsx`. The `DEMO_PATHS` array and `pathToLabel` map currently key off `routes.clin` and `routes.cdsHooksDemo` separately — add `routes.clinSuite` mapped to `"ARKA-CLIN Suite"`, and keep the old entries so deep links still get a nav label. The `Other demos` dropdown should now show three siblings when on a demo page.

(7) Open `components/shared/demos/DemoViewSwitcher.tsx`. Add a third option to `VIEWS`:
```ts
{
  id: "combined" as const,
  title: "Both Views Side-by-Side",
  subtitle: "ARKA-CLIN Suite",
  description: "Standalone + EHR-embedded + CDS Hooks discovery on a single page.",
  href: routes.clinSuite,
  cta: "Open ARKA-CLIN Suite",
},
```
Widen the `current` prop type to `"standalone" | "embedded" | "combined"`.

(8) Open `components/landing/EcosystemDiagram.tsx`. The CLIN node's `href` should now point to `routes.clinSuite` (NOT `routes.clin`) so clicking the diagram lands users on the combined page.

(9) Open `components/navigation/Footer.tsx`. Keep the "CDS Hooks Discovery" link visible — but ALSO surface the validation dashboard link (`/cds-hooks-demo/validation`) here. Both stay in the footer for direct access; the combined page is the primary discovery point. No links get deleted.
```

### Cursor prompt 3C — give the new tabbed page direct callouts to the regulatory artifacts

```
Open the `app/clin-suite/page.tsx` you just created. In the "CDS Hooks Discovery" tab, render a small `<aside>` card block (using the same `.arka-card` class used elsewhere) that lists four prominent buttons in a 2x2 grid:

- "Validation Dashboard" → `/cds-hooks-demo/validation` — "CDS service validation, latency, and conformance metrics."
- "Regulatory Rationale" → `/docs/regulatory-rationale` — "FDA Non-Device CDS rationale memo (§520(o)(1)(E))."
- "Feature Evidence Catalog" → `/docs/feature-catalog` — "Per-feature evidence with last-verified citations."
- "Discovery JSON" → `/.well-known/cds-services` — "Raw HL7 CDS Hooks 2.0 discovery document."

Each button: arka-cyan border, hover-fill, min-height 44px. They render above the discovery JSON, not below, so they're the first thing shareholders see in this tab.
```

After 3A+3B+3C: users land on `/clin-suite`, see three tabs, and can reach the standalone app, the EHR-embedded view, and the discovery + validation surfaces without leaving the page. The old `/clin` and `/cds-hooks-demo` routes remain reachable via the `DemoViewSwitcher` and deep links so nothing is deleted.

---

## Fix #4 — Apply the Hero-style fade-in transition to every page

**Symptom:** The home page fades in nicely (via `Hero`'s motion variants on initial mount). Other pages snap in or, worse, flash blank.

**Root cause:** `components/navigation/MainWithDemoNav.tsx` wraps children in an `AnimatePresence` + `motion.div` with `initial`/`animate`/`exit` variants, but it explicitly skips that wrapper for `/cds-hooks-demo` (line 10: `NO_TRANSITION_PATHS`). Several pages also wrap their own root in a `motion.div` (e.g. `/clin`, `/ed`, `/ins`), causing double animations or, when the outer one is skipped, no animation at all.

We want one canonical entry transition: ~0.35s ease-out fade + 8px upward shift, applied uniformly.

### Cursor prompt 4 — unify the page-transition wrapper

```
Open `components/navigation/MainWithDemoNav.tsx`.

(1) Delete the `NO_TRANSITION_PATHS` array and the `skipPageTransition` branch entirely. The CDS Hooks demo originally opted out because of a hydration bug from a nested `<main>`; that nested `<main>` no longer exists (`app/cds-hooks-demo/layout.tsx` uses a `<div>` already). Every route now goes through the `AnimatePresence` path.

(2) Update the variants to match the Hero's exact feel:
```ts
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};
```
And the transition:
```ts
transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
```

(3) Set `mode="wait"` on `AnimatePresence` (already there) and ensure the `key` is `pathname` (already there).

Now open `app/clin/page.tsx`, `app/ed/page.tsx`, and `app/ins/page.tsx`. Each currently wraps its content in a `<motion.div initial={{ opacity: 0, y: 8 }} animate={...}>` at the top level. Replace that outer `motion.div` with a plain `<div>` (keep the className). The page-level fade is now handled globally by `MainWithDemoNav`, so doing it twice both desyncs and adds jank.

Repeat for any other `app/**/page.tsx` that wraps its top level in `motion.div` for entrance animation. Search the repo with: `motion.div initial={{ opacity: 0`.

Do NOT remove inner `motion.*` usages (e.g. headings, cards, the EcosystemDiagram's `whileInView` animations) — only the outermost top-level page-fade wrapper.

Finally, open `app/loading.tsx` and reduce the spinner's min-height to `min-h-[30vh]` and add `opacity-90` so the global fade-in masks the route change instead of a hard cut to a centered spinner.
```

---

## Fix #5 — Stop the blank-screen flash between client routes

**Symptom:** Clicking any nav link sometimes shows a blank screen for ~1s before the destination renders.

**Root cause:** Three contributing factors:

1. `app/clin/page.tsx` and similar use `dynamic(() => import(...), { loading: () => <DemoLoadingSkeleton /> })` for the heavy `ClinDemoContent`. The skeleton itself is *fine*, but on top of it, `MainWithDemoNav`'s `AnimatePresence mode="wait"` waits for the *previous* page's exit animation before mounting the new one — so during slow chunk loads you see exit → empty → skeleton → content.
2. Several pages are marked `"use client"` which forces a client-only render. With React 19 + Next 16, the App Router still renders the server shell first; the blank is the gap before hydration completes.
3. The `loading.tsx` file in `app/` has `min-h-[50vh]` but lives *outside* `MainWithDemoNav`, so it isn't faded.

### Cursor prompt 5 — eliminate the blank flash

```
(1) Open `components/navigation/MainWithDemoNav.tsx`. Change `AnimatePresence`'s `mode` from `"wait"` to `"popLayout"` (or remove `mode` entirely to use the default sync mode). With "wait", the new page can't mount until the old one finishes exiting, which is what creates the blank gap. Sync mode overlaps the two for ~250ms and the brief overlap is far less jarring than a blank.

(2) In the same file, give the inner `<main>` a minimum viewport height so a route in flight doesn't collapse the layout:
```tsx
<main
  id="main-content"
  className={cn("flex-1 pt-14 min-h-[calc(100dvh-3.5rem)]", isDemoPage && "pb-20 md:pb-0")}
  tabIndex={-1}
>
```

(3) Open every page that uses `dynamic(() => import(...), { loading: () => <DemoLoadingSkeleton /> })` — search the repo for `DemoLoadingSkeleton`. For each, add `ssr: true` to the `dynamic` options so the skeleton renders in the server response and there's no client-only gap:
```ts
const ClinDemoContent = dynamic(
  () => import("@/components/demos/clin/ClinDemoContent").then((m) => m.ClinDemoContent),
  { loading: () => <DemoLoadingSkeleton />, ssr: true }
);
```

(4) Open `components/demos/DemoLoadingSkeleton.tsx`. Wrap its root in the same fade-in motion the new global wrapper uses, so the skeleton appears as part of the page fade and not as a hard pop.

(5) Add `prefetch` hints to the primary `<Link>` calls in `components/navigation/Navbar.tsx`. Next.js prefetches `<Link>` by default but only when visible — explicitly mark the demo links `prefetch` and trigger prefetch on `onMouseEnter` for the dropdown items. Use Next's `router.prefetch(href)` inside `onMouseEnter` of the "Other demos" dropdown `<li>`s.

(6) In `app/loading.tsx`, wrap the spinner in the same fade-in `motion.div` (initial opacity 0, animate to 1, 0.2s) so the loading state itself eases in rather than appearing as a blank then a spinner.

(7) Open `next.config.ts` and confirm `experimental.optimisticClientCache` is on if available in your Next 16 version. If not present, leave the file alone — items 1–6 are sufficient.

Test by clicking from Home → ARKA-CLIN Suite → ARKA-INS → Rural → CDS Hooks Discovery rapidly. No blank should appear; you should see the previous page fade slightly while the new one fades in.
```

---

## Fix #6 — Use the full animated logo (not the small icon) everywhere

**Symptom (Screenshot 8):** On demo pages, the navbar shows a small static `/arka-icon.svg` next to the demo name (e.g. "ARKA-CLIN"). The home page shows a beautiful `ArkaAnimatedLogo`. The user wants the animated big logo to appear top-left on every page, linking home.

**Root cause:** `components/navigation/Navbar.tsx` has a conditional split: when `isDemoPage && currentDemo` is true, it renders an `<Image src="/arka-icon.svg" ... w-7 h-7>` plus the demo title. Otherwise it renders `<Logo variant="full" size="md">` (which is just the SVG wordmark, not the animated component). Neither path uses `ArkaAnimatedLogo` from `@/components/ArkaAnimatedLogo`.

We want: animated logo top-left on every page, with the demo title kept next to it when applicable. The animated logo is large by default — we need a "navbar" size variant or a constrained wrapper.

### Cursor prompt 6 — wire the animated logo into the navbar on every route

```
Open `components/navigation/Navbar.tsx`.

(1) At the top, replace
```ts
import { Logo } from "@/components/shared/Logo";
```
with
```ts
import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
```
and remove the unused `Image` import only if it's no longer used (the demo path also used it for the small icon; we're replacing that too, so the `Image` import can go).

(2) Build a single shared logo block that both branches use. Above the `return`, define:
```tsx
const NavLogo = (
  <Link
    href={routes.home}
    className="group flex shrink-0 items-center text-arka-text no-underline"
    aria-label="ARKA Health — Home"
  >
    <span className="block h-10 w-10 sm:h-11 sm:w-11 [&_svg]:h-full [&_svg]:w-full">
      <ArkaAnimatedLogo
        width={120}
        height={135}
        animate={true}
        idleAnimations={true}
        className="h-full w-full cursor-pointer"
      />
    </span>
  </Link>
);
```
The wrapper `<span>`'s `h-10 w-10` (sm: `h-11 w-11`) forces the otherwise-large animated SVG into a navbar-appropriate footprint. The inner `[&_svg]` selectors stretch the SVG to fill that footprint. Hover keeps the existing scale/glow behavior from the component itself.

(3) Inside the navbar JSX, REPLACE BOTH branches of the `isDemoPage && currentDemo ? ... : ...` ternary's logo content with `{NavLogo}`. Keep the demo-page branch's "current demo name" text and "Other demos" dropdown after `{NavLogo}` so the layout is: [animated logo] [demo title] [Other demos ▾].

Final demo-page left side:
```tsx
<>
  {NavLogo}
  <span className="truncate font-semibold text-arka-text">
    {pathToLabel[currentDemo]}
  </span>
  <div className="relative hidden lg:block">
    {/* existing Other demos dropdown unchanged */}
  </div>
</>
```

Final landing-page left side:
```tsx
{NavLogo}
```

(4) The navbar height is currently `h-14` (~56px). Confirm the logo at 40–44px fits without clipping. If it does clip, bump the navbar to `h-16` and update the `pt-14` in `MainWithDemoNav.tsx` to `pt-16` so the main content doesn't slide under it.

(5) `ArkaAnimatedLogo` is a heavy Framer-Motion component. To keep it from re-mounting on every nav (which would restart the entrance animation), memoize it once at module scope or wrap the `NavLogo` constant in a `useMemo(() => (...), [])`. The animation should play once on first mount and then idle.

(6) Inside `ArkaAnimatedLogo.tsx`, look for the `useReducedMotion()` hook. If present, ensure the static fallback is rendered when the user has reduced motion enabled so the navbar still shows a logo and doesn't go blank. (It likely already handles this; verify visually.)

Test on `/`, `/clin-suite`, `/clin`, `/cds-hooks-demo`, `/ed`, `/ins`, `/rural`, `/docs/regulatory-rationale`, `/cds-hooks-demo/validation`. Animated logo top-left on every one. Clicking it returns to home.
```

---

## Fix #7 — Make the validation dashboard, regulatory rationale, feature catalog, and discovery JSON easily findable

**Required URLs (must stay reachable, must not buffer):**

- `/cds-hooks-demo/validation` — validation dashboard
- `/docs/regulatory-rationale` — rationale memo
- `/docs/feature-catalog` — per-feature evidence
- `/.well-known/cds-services` — discovery JSON

The validation dashboard especially is currently hard to find — it's a deep child of `/cds-hooks-demo` with no top-level link in the nav.

### Cursor prompt 7 — surface the four regulatory artifacts in primary navigation

```
(1) Open `lib/constants.ts`. Add a new `complianceLinks` constant near the bottom:
```ts
export const complianceLinks = [
  {
    href: routes.cdsHooksDemoValidation, // already in routes
    label: "Validation Dashboard",
    description: "CDS service validation, latency, and conformance metrics.",
  },
  {
    href: routes.regulatoryRationale,
    label: "Regulatory Rationale",
    description: "FDA Non-Device CDS rationale memo (§520(o)(1)(E)).",
  },
  {
    href: "/docs/feature-catalog",
    label: "Feature Evidence Catalog",
    description: "Per-feature evidence with last-verified citations.",
  },
  {
    href: "/.well-known/cds-services",
    label: "Discovery JSON",
    description: "Raw HL7 CDS Hooks 2.0 discovery document.",
    external: true,
  },
] as const;
```
Also add `featureCatalog: "/docs/feature-catalog"` to the `routes` object if you didn't already in Fix #3.

(2) Open `components/navigation/Navbar.tsx`. Beside the existing "Ecosystem Overview" button (right side of the desktop nav), add a sibling dropdown button titled "Compliance & Validation" that opens a Radix Popover (already a dependency) listing the four `complianceLinks` with their descriptions. The trigger has a `ShieldCheck` icon (lucide-react), arka-cyan styling matching "Ecosystem Overview". On mobile, append the four entries as a separate section in the existing mobile menu beneath "Ecosystem Overview", styled like the existing Rural pillars list.

(3) Open `components/navigation/Footer.tsx`. Keep the existing CDS Hooks Discovery + CDS Hooks Live Demo entries. ADD a new footer column above the compliance line: a small horizontal row of buttons labeled "Validation Dashboard", "Regulatory Rationale", "Feature Catalog", "Discovery JSON" — each pulled from `complianceLinks`. This is redundant with the navbar dropdown by design (high-prominence + last-resort findability).

(4) Open the new `app/clin-suite/page.tsx` from Fix #3. In its third tab ("CDS Hooks Discovery"), the 2×2 grid you built already covers the four links; confirm those four buttons match `complianceLinks` so all surfaces stay in sync. If not, refactor the page to render `complianceLinks.map(...)` so future additions only need one edit.

(5) Validation dashboard buffering: open `app/cds-hooks-demo/validation/page.tsx`. It currently renders `<ValidationDashboard />` directly. Wrap the dashboard in a `Suspense` boundary with a `DemoLoadingSkeleton` fallback so slow data fetches don't cause the blank flash Fix #5 addresses for other routes:
```tsx
import { Suspense } from "react";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";

export default function ValidationPage() {
  return (
    <Suspense fallback={<DemoLoadingSkeleton />}>
      <ValidationDashboard />
    </Suspense>
  );
}
```
Also confirm `ValidationDashboard` itself doesn't have any `dynamic(..., { ssr: false })` imports without a `loading` fallback. If it does, add `loading: () => <DemoLoadingSkeleton />`.

(6) Open `components/cds-platform/validation/ValidationDashboard.tsx` (find it via the import path in step 5). If it does any `fetch()` on the client during mount, ensure: (a) `cache: "no-store"` is set, (b) an `AbortController` is wired so route changes don't leak fetches, (c) an error UI renders instead of staying blank if the fetch fails. Add `prefetch` to any links pointing into this dashboard from the `complianceLinks` so navigation in feels immediate.

After this prompt, the validation dashboard should be reachable from: navbar dropdown, footer row, ARKA-CLIN Suite "Discovery" tab, and any deep link. None should buffer.
```

---

## Final Verification — Pre-Shareholder Smoke Test

After running all seven fix prompts above, run this final prompt to validate the result before the demo.

### Cursor prompt 8 — verify end-to-end

```
Run the following checks and report any failure with the file + line:

(1) Static checks:
- `npm run type-check` exits clean.
- `npm run lint` reports 0 errors (warnings ok).

(2) Build:
- `npm run build` succeeds. Look at the build output for any "missing module" or "page" errors.

(3) Manual click-through (dev server: `npm run dev`):
- Home `/` — animated logo plays in Hero; ecosystem diagram shows FOUR connected nodes (CLIN, ED, INS, RURAL) all with visible lines; clicking CLIN navigates to `/clin-suite`; clicking RURAL navigates to `/rural`.
- Navbar — animated logo top-left on every page. "Compliance & Validation" dropdown lists four items and each loads without a blank flash.
- `/clin-suite` — three tabs render (Standalone / EHR-Embedded / CDS Hooks Discovery). Tabs switch via URL `?view=...`. Selecting a scenario in the Embedded tab returns a valid CDS Hooks response in <1.5s. JSON panel response is valid JSON, NOT `The string did not match the expected pattern.`
- `/clin` and `/cds-hooks-demo` still load (deep-link continuity). `DemoViewSwitcher` shows the third "Combined" card on both.
- `/cds-hooks-demo/validation` — validation dashboard loads, no blank, no spinner stuck.
- `/docs/regulatory-rationale` and `/docs/feature-catalog` — content renders.
- `/.well-known/cds-services` — returns JSON (CORS-friendly).

(4) Animation/transition checks:
- Click between Home → ARKA-CLIN Suite → ARKA-ED → ARKA-INS → Rural quickly. No blank screen between any pair. A subtle 0.35s fade is visible on every navigation.
- Refresh `/clin-suite?view=embedded`. Page lands directly on the Embedded tab.

(5) Network panel check (DevTools → Network):
- During scenario switches on `/clin-suite` (embedded tab), `POST /api/cds-services/arka-clin-appropriateness` returns 200 with a `cards: [...]` body. No 4xx, no `TypeError`.
- Validation dashboard XHRs complete with 200.

(6) Accessibility quick-check:
- Tab through the navbar. Logo, demo links, Ecosystem Overview, Compliance & Validation, and demo dropdown all reachable. Focus visible.
- Run Lighthouse a11y audit (`npm run test:a11y` if available) and report the score.

(7) Mobile spot-check:
- Open in DevTools mobile view (375×812). Mobile menu opens, ecosystem diagram stacks vertically with all four nodes visible, animated logo scales reasonably, validation dashboard scrolls without horizontal overflow.

If any check fails, list it as "FAIL: [check name] — [file]:[line] — [reason]". Otherwise report "ALL CHECKS PASSED — ready for shareholder demo."
```

---

## Quick reference — files this document touches

| File | Touched by Fix # |
|------|------------------|
| `components/cds-platform/demo/build-cds-request.ts` | 1A |
| `lib/cds-platform/cds-hooks/order-select.ts` | 1B |
| `lib/cds-platform/cds-hooks/order-sign.ts` | 1B |
| `components/cds-platform/demo/CdsDemoClient.tsx` | 1C |
| `components/landing/EcosystemDiagram.tsx` | 2, 3B |
| `app/clin-suite/layout.tsx` *(new)* | 3A |
| `app/clin-suite/page.tsx` *(new)* | 3A, 3C |
| `lib/constants.ts` | 3B, 7 |
| `components/landing/PhaseCards.tsx` | 3B |
| `components/navigation/Navbar.tsx` | 3B, 6, 7 |
| `components/navigation/Footer.tsx` | 3B, 7 |
| `components/shared/demos/DemoViewSwitcher.tsx` | 3B |
| `components/navigation/MainWithDemoNav.tsx` | 4, 5 |
| `app/clin/page.tsx` | 4, 5 |
| `app/ed/page.tsx` | 4, 5 |
| `app/ins/page.tsx` | 4, 5 |
| `components/demos/DemoLoadingSkeleton.tsx` | 5 |
| `app/loading.tsx` | 4, 5 |
| `app/cds-hooks-demo/validation/page.tsx` | 7 |
| `components/cds-platform/validation/ValidationDashboard.tsx` | 7 |

## Done.

Paste each prompt one at a time, save, and rerun the dev server between sections so you can spot any regressions as they appear rather than at the end. The verification prompt at the end is the green-light gate before going live with shareholders.
