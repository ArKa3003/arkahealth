# ARKA Demo — Investor-Ready Fix Pack (Cursor Prompt Playbook)

**Purpose:** Paste each prompt below into Cursor (Agent / Composer mode, `claude` or `gpt` model with the repo open). They are ordered so you can run them top-to-bottom. Every prompt is self-contained: it names the exact file(s), the symptom, the root cause, the required change, and the acceptance criteria.

**How to use:**
1. Open the repo `arkahealth` in Cursor.
2. Run `npm run dev` (or `pnpm dev`) in a terminal so you can verify each fix live at `http://localhost:3000`.
3. Paste one prompt block at a time. After each, reload the relevant page and confirm the **Acceptance criteria** before moving on.
4. Run the final QA + Clarity prompts (Sections 9 and 10) last.

---

## ⚠️ Read this first — the one quirk that explains most of the bugs

This app is **hard-locked into dark mode**:
- `app/layout.tsx` sets `<html className="dark">`.
- `components/shared/ThemeProvider.tsx` defaults `theme = "dark"` and re-applies `.dark` on mount.

Because `.dark` is **always** present, every Tailwind `dark:` variant in the codebase is **permanently active**, and any panel painted with a translucent dark token (`bg-arka-bg-medium/40`, `bg-arka-bg-dark/…`, `dark:bg-…`) renders as a dark/gray surface. When that surface is paired with dark text tokens (`text-arka-text-dark`, `text-arka-text-dark-muted`), you get the **dark-text-on-dark-background** and **gray-box** problems seen in the ARKA-CLIN, ARKA-INS, and Rural screenshots.

**Design intent (confirm as you go):** The marketing/landing shell (hero, navbar, footer) is dark navy with light text. **All demo surfaces** (ARKA-CLIN Suite, ARKA-ED, ARKA-INS, Rural) are meant to be **light surfaces** (white / `#F8FAFC` backgrounds) with **dark navy text**. Several prompts below make those demo surfaces explicitly, opaquely light so they no longer inherit dark backgrounds.

Color tokens (from `tailwind.config.ts` / `styles/globals.css`) — do not invent new ones:
- Light backgrounds: `bg-white`, `bg-arka-bg-light` (`#F8FAFC`), `bg-arka-bg-alt` / `bg-arka-pale` (`#F1F5F9`)
- Dark backgrounds: `bg-arka-navy` / `bg-arka-bg-dark` (`#0F172A`), `bg-arka-bg-medium` (`#1E293B`)
- Text on light: `text-arka-text-dark` (`#0F172A`), `text-arka-text-dark-muted` (`#475569`), `text-arka-text-dark-soft` (`#64748B`)
- Text on dark: `text-arka-text` (`#FFFFFF`), `text-arka-text-muted`, `text-arka-text-soft`
- Accent: `text-arka-teal` / `bg-arka-teal` (`#14B8A6`)

---

## 1. Homepage — delete the distorted "Shared Knowledge Base" hub diagram and reformat the section

**Screenshot:** #1 — the ARKA hub-and-spoke SVG (CLIN / ED / INS / RURAL around an ARKA hub) is geometrically distorted: connector lines overshoot the nodes and the "SHARED KNOWLEDGE BASE" label collides with the INS node.

**File:** `components/landing/PlatformEcosystem.tsx`

**Root cause:** A hand-laid SVG (`viewBox="0 0 600 240"`, the `HUB`/`NODES` constants on lines ~76–82 and the `<svg>` block on lines ~131–197) uses fixed coordinates that don't scale cleanly; nodes/lines/labels overlap at the rendered size.

> **Cursor prompt:**
>
> In `components/landing/PlatformEcosystem.tsx`, **completely remove the SVG hub-and-spoke diagram**. Specifically:
> - Delete the entire `<motion.div>` block that wraps the `<svg viewBox="0 0 600 240" …>` (the element starting around line 120 with `className="mx-auto mt-12 max-w-xl"` and ending at its closing `</motion.div>` after the `</svg>`), including the `<p className="sr-only">…</p>` inside it.
> - Delete the now-unused `HUB` and `NODES` constants (lines ~76–82).
> - Keep the section heading ("One engine. One shared knowledge base. Four phases.") and the intro paragraph.
> - Replace the deleted diagram with a clean, **non-distorted, responsive** visual that reinforces the "one shared engine → four phases" idea using styled HTML (no hand-drawn SVG geometry). Build it as a centered horizontal band:
>   - A centered pill labeled **"ARKA · Shared Knowledge Base"** using `bg-arka-navy text-arka-text` with a subtle `text-arka-teal` accent dot.
>   - Below it, a responsive row of four small chips — **CLIN**, **ED**, **INS**, **RURAL** — each a rounded `border border-arka-light bg-white` chip with `text-arka-text-dark`, wrapping gracefully on mobile (`flex flex-wrap justify-center gap-3`).
>   - A short caption under the chips in `text-arka-text-dark-soft text-sm`: "The same decision engine, four surfaces — clinician, learner, payer, and rural site."
> - Preserve the existing `framer-motion` fade-in pattern (`fadeIn`, `isInView`) so the new block animates in like the rest of the section.
> - Keep the four phase cards (`phases.map(...)`) and everything below them unchanged.
> - Do not leave any unused imports; remove them if the SVG deletion orphans any.
>
> **Acceptance criteria:** No SVG diagram remains; nothing overlaps at any width from 320px to 1440px; the section reads cleanly as heading → intro → "shared engine → four phases" band → four phase cards; `npm run build` has no unused-variable/import errors.

---

## 2. Homepage — replace the "Testimonials placeholder" with two real clinician testimonials

**Screenshot:** #2 — "Trusted by clinicians" shows "Social proof and testimonials — coming soon" and an empty dashed placeholder box.

**File:** `components/landing/Testimonials.tsx`

**Root cause:** The component is still a placeholder (the `Quote` icon block on lines ~41–54 and the "coming soon" subtitle on line ~39).

**Approved testimonials (already professionalized — use these exact quotes and attributions):**

- **Dr. Michael Glass, MD — Physician, Stormont Vail Health (Topeka, KS):**
  > "ARKA is genuinely unlike anything else I've used at the point of order. Having evidence-based imaging guidance surface right in the workflow — with the reasoning shown — saves clinicians countless hours and a real amount of day-to-day stress. It's the rare tool that makes the *right* decision the *easy* one."

- **Mike Odgren — Radiology Assistant, Stormont Vail Health (Topeka, KS):**
  > "If a tool like ARKA is implemented thoughtfully into our clinical systems, it has the potential to change healthcare for the better. It streamlines imaging decisions without getting in the way of the people doing the work — and that's exactly what frontline radiology teams need."

> **Cursor prompt:**
>
> In `components/landing/Testimonials.tsx`, replace the placeholder with two real testimonial cards.
> - Change the subtitle paragraph from "Social proof and testimonials — coming soon." to: "Early feedback from clinicians and radiology teams using ARKA."
> - Remove the dashed `Testimonials placeholder` block (the `<motion.div>` containing the `Quote` icon, "Testimonials placeholder", and "Quotes and logos will go here").
> - Add a responsive two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-6`) of two quote cards. Define the data as a local `const testimonials = [...]` array of `{ quote, name, title, org, location }` and `.map()` over it.
> - Use these two entries verbatim:
>   1. quote: "ARKA is genuinely unlike anything else I've used at the point of order. Having evidence-based imaging guidance surface right in the workflow — with the reasoning shown — saves clinicians countless hours and a real amount of day-to-day stress. It's the rare tool that makes the right decision the easy one." — name: "Dr. Michael Glass, MD", title: "Physician", org: "Stormont Vail Health", location: "Topeka, KS"
>   2. quote: "If a tool like ARKA is implemented thoughtfully into our clinical systems, it has the potential to change healthcare for the better. It streamlines imaging decisions without getting in the way of the people doing the work — and that's exactly what frontline radiology teams need." — name: "Mike Odgren", title: "Radiology Assistant", org: "Stormont Vail Health", location: "Topeka, KS"
> - Each card: white surface (`arka-card` or `bg-white border border-arka-light rounded-xl shadow-card`), padding `p-6 sm:p-8`, a small `Quote` icon (lucide-react, already imported) in `text-arka-teal`, the quote in `text-arka-text-dark` (readable, not muted), and a footer block with the clinician's name in `font-semibold text-arka-text-dark`, then `title · org` and `location` in `text-arka-text-dark-soft text-sm`. Add an avatar circle with the person's initials (`bg-arka-navy text-arka-text`) for polish.
> - Keep the existing `framer-motion` stagger/fade-in pattern so each card animates in.
> - Keep the section heading "Trusted by clinicians".
>
> **Acceptance criteria:** Both quotes render fully, are easy to read (dark text on white), attributions are correct, cards are balanced on desktop and stack cleanly on mobile, no placeholder text remains.

---

## 3. Global header — remove "Compliance & Validation" and "Ecosystem Overview" buttons and re-balance the nav

**Screenshot:** #3 — the top nav shows the ARKA logo, the demo links (ARKA-CLIN Suite, ARKA-ED, ARKA-INS, Rural Platform), then two right-aligned buttons: **Compliance & Validation** and **Ecosystem Overview**.

**File:** `components/navigation/Navbar.tsx`

**Root cause:** The two buttons live in the "Right" cluster (the `<Popover>` for "Compliance & Validation" on lines ~291–337 and the "Ecosystem Overview" `<button>` on lines ~338–345). They crowd the header.

> **Cursor prompt:**
>
> In `components/navigation/Navbar.tsx`, remove the two desktop header buttons and rebalance the bar:
> - **Delete** the entire `<Popover>…</Popover>` block that renders the "Compliance & Validation" trigger and its `PopoverContent` (lines ~291–337).
> - **Delete** the "Ecosystem Overview" `<button>` (lines ~338–345, the one with `onClick={handleEcosystemClick}` and the `LayoutGrid` icon).
> - Keep the mobile hamburger `<button>` (the `Menu` icon) that opens the mobile overlay.
> - After deletion, clean up: remove now-unused imports/symbols if they're no longer referenced anywhere else in the file — check `Popover`, `PopoverContent`, `PopoverTrigger`, `ShieldCheck`, `LayoutGrid`, `ExternalLink`, `complianceLinks`, and `handleEcosystemClick`. **Important:** `ShieldCheck`, `ExternalLink`, and `complianceLinks` are ALSO used inside the mobile overlay (`AnimatePresence` block lower in the file) — only remove an import if it has zero remaining usages. Do not break the mobile menu. (Leave the mobile menu's Compliance/Ecosystem items intact — those links still live in the footer too, so users can still reach them.)
> - **Re-space the remaining items** so the bar looks intentional now that the right cluster is lighter. In the `<nav>` (the `flex h-14 max-w-6xl items-center justify-between` element):
>   - On the landing pages, the center `<ul>` of `demoNavLinks` should be evenly distributed. Increase its spacing (e.g., `gap-8` → `gap-10`) and let the logo sit left, the links centered, and the right cluster (just the mobile trigger on desktop) collapse. Keep `justify-between`.
>   - Ensure the right `<div>` no longer reserves width for the removed buttons (it can become `lg:flex-initial` with just the mobile menu button, hidden on `lg`).
> - Do not change the demo-page variant (logo + current demo label + "Other demos" dropdown) other than confirming it still aligns now that the right cluster is empty on desktop.
>
> **Acceptance criteria:** The two buttons are gone on every page; the logo + nav links are evenly spaced and visually centered; no console errors; the mobile menu still opens and still contains its links; `npm run build` passes with no unused-import warnings.

---

## 4. Browser tab — replace the default Next.js/Vercel favicon with the ARKA logo

**Screenshot:** #4 — the Safari tab shows the black triangle (the default Next.js/Vercel favicon), not the ARKA mark.

**Files:** `app/favicon.ico` (the culprit), `public/arka-icon.svg` (the correct ARKA mark, already in the repo), `app/layout.tsx` (metadata already points at the SVG).

**Root cause:** Next.js App Router auto-serves `app/favicon.ico` at the highest priority, overriding the `icons` metadata in `app/layout.tsx` (which already references `/arka-icon.svg`). The existing `app/favicon.ico` (dated Jan 29, 25,931 bytes) is the default `create-next-app` icon — the Vercel triangle.

> **Cursor prompt:**
>
> The browser tab is showing the default Next.js favicon instead of the ARKA logo. Fix it using the App-Router icon convention so I don't need a binary `.ico` toolchain:
> - **Delete** `app/favicon.ico` (it is the default create-next-app Vercel-triangle icon and it overrides everything else).
> - **Create** `app/icon.svg` containing the ARKA mark by copying the contents of `public/arka-icon.svg` exactly. Next.js will auto-serve `app/icon.svg` as the favicon.
> - For Safari pinned tabs / iOS, also **create** `app/apple-icon.svg` with the same ARKA SVG contents.
> - In `app/layout.tsx`, leave the `metadata.icons` block pointing at `/arka-icon.svg` (it's fine), but confirm there is no remaining reference to a `.ico`.
> - If the ARKA SVG has a transparent or very light background that would look invisible on a light tab strip, wrap the artwork on a `#0F172A` (arka-navy) rounded square background inside `app/icon.svg` so the mark stays legible at 16×16.
>
> **Acceptance criteria:** After deleting `app/favicon.ico`, restarting `npm run dev`, and hard-refreshing (favicons cache aggressively — try a new tab or incognito), the tab shows the ARKA mark, not the triangle. `app/icon.svg` exists and renders.

---

## 5. ARKA-CLIN Suite — fix dark-text-on-dark, cut-off borders, and the too-narrow centered layout

**Screenshots:** #5–#8 — across all three tabs (Standalone Web App, EHR-Embedded / CDS Hooks Live Demo, CDS Hooks Discovery): the intro paragraphs and several section headings render **dark text on a dark band** (unreadable); content is **cramped in a narrow center column** with borders/cards getting clipped at the page edges.

**Files:**
- `app/clin-suite/page.tsx` (page shell, container width, the three `TabsContent` intro paragraphs, the Discovery tab)
- `components/demos/clin/ClinDemoContent.tsx` (Standalone tab body)
- `components/demos/clin/HowArkaWorksSection.tsx` ("How ARKA Works", "FDA Non-Device CDS Criteria", "The AIIE Scoring Methodology")

**Root cause:** See the "Read this first" note. The page is supposed to be a **light** surface, but because the app is permanently in `.dark`, ambient dark backgrounds bleed through behind the bare intro `<p>` paragraphs and section headings (which use `text-arka-text-dark`), so dark text sits on a dark band. The container is also `max-w-5xl` (except the embedded tab), which leaves content narrow and lets cards touch/clip the viewport edges on mid widths.

> **Cursor prompt:**
>
> The ARKA-CLIN Suite renders dark text on dark bands and is too narrow with clipped borders. Make this entire surface an explicitly **light** page that does not depend on the global theme, and give it more room. Run `npm run dev` and verify at `/clin-suite` (all three tabs: `?view=standalone`, `?view=embedded`, `?view=discovery`).
>
> In `app/clin-suite/page.tsx`:
> - Make the outer wrapper an **opaque light surface**: change the root `<div className="min-h-screen bg-arka-bg-light">` to `min-h-screen bg-white` (or keep `bg-arka-bg-light` but ensure it is opaque and that no ancestor paints it dark). This guarantees the section behind every heading/paragraph is light.
> - **Widen the container.** The inner container uses `max-w-5xl` for non-embedded views. Change the standalone and discovery views to `max-w-7xl` and bump horizontal padding so nothing clips at the edges: use `px-4 sm:px-6 lg:px-8 xl:px-12`. Keep the embedded view's wider `max-w-[1600px]`.
> - **Fix the three `TabsContent` intro paragraphs** (the standalone, embedded, and discovery `<p className="… text-arka-text-dark-muted">`): wrap each in a light, bordered intro panel so it can never sit on a dark band — e.g. `rounded-xl border border-arka-light bg-arka-bg-alt p-4 sm:p-5 text-arka-text-dark` (keep `-muted` only if it stays clearly readable on the light panel; otherwise use `text-arka-text-dark`). Thicken borders to `border` (1px is fine if visible) and ensure they're `border-arka-light` not a low-opacity navy.
> - In `DiscoveryTabContent`, the quick-action cards and the `/.well-known/cds-services` panel must be light cards (`bg-white border border-arka-light`) with dark text; the JSON `<pre>` stays dark (`bg-slate-900 text-slate-100`) — that's intentional and readable. Increase the surrounding card border from `border-arka-primary/20` to a clearly visible `border-arka-light`.
>
> In `components/demos/clin/HowArkaWorksSection.tsx`:
> - This `<section>` is transparent, so its headings ("How ARKA Works", "FDA Non-Device CDS Criteria", "The AIIE Scoring Methodology") currently risk sitting on a dark band. Give the section its own **opaque light background**: add `bg-white` (or `bg-arka-bg-light`) plus rounded corners/padding so the whole block is a guaranteed light surface, and confirm every heading uses `text-arka-text-dark` and every body uses `text-arka-text-dark-muted` on that light background. The white `arka-card` cards inside are fine.
>
> In `components/demos/clin/ClinDemoContent.tsx`:
> - Confirm the "Imaging Appropriateness Evaluation" heading + paragraph and the "Quick Demo Scenarios" card all sit on a light surface and use dark text. If the heading/paragraph could inherit a dark ambient background, wrap that intro `<section>` in `bg-white`/`bg-arka-bg-light` so it's guaranteed readable.
>
> **Global audit for this surface:** Search the CLIN suite files and their children for any `dark:bg-…`, `bg-arka-bg-dark…`, `bg-arka-bg-medium…`, or `bg-arka-navy…` used as a content background, and for any `text-arka-text-dark*` placed on such a background. Because `.dark` is always on, those produce dark-on-dark. Convert content surfaces to light (`bg-white` / `bg-arka-bg-light` / `bg-arka-bg-alt`) with dark text, OR pair any intentionally-dark surface with light text (`text-arka-text`). Do not introduce new color tokens.
>
> **Acceptance criteria:** On all three tabs, every heading and paragraph is clearly readable (no dark-on-dark); the page uses the full width with comfortable side padding; no card or border is clipped at the viewport edge from 320px to 1440px; borders are visible (`border-arka-light`); the dark JSON code block is the only dark surface and its light text is readable.

---

## 6. ARKA-ED — stop truncating case titles; fix readability and edge clipping

**Screenshots:** #9–#10 — in the Case Library, card titles are cut off ("Chronic Daily Headache in a…", "Acute Low Back Pain in a Young…", "Suspected Pulmonary…"); inside an opened case, the header title is also clipped ("Suspected Pulmor…").

**Files:**
- `components/demos/ed/EdDemoContent.tsx` (Case Library card title — line ~67 `line-clamp-2`)
- `components/demos/ed/CaseViewer.tsx` (opened-case header title — line ~200 `line-clamp-1 … truncate`)

**Root cause:** Titles are intentionally clamped/truncated (`line-clamp-2` on the card, `line-clamp-1 truncate` on the viewer header) instead of allowed to wrap, so longer case names get an ellipsis.

> **Cursor prompt:**
>
> In the ARKA-ED demo, case titles are being truncated. Show the **full** title everywhere. Verify live at `/ed`.
>
> In `components/demos/ed/EdDemoContent.tsx` (the `CaseCard` component):
> - Change the title `<h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">` so the **full title shows**. Remove `line-clamp-2` (or raise it to `line-clamp-3` if you want a hard cap) and let it wrap naturally. Add `leading-snug` for tidy multi-line wrapping. Ensure card height is driven by content (the grid already allows it), so taller cards don't clip.
> - The chief-complaint `<p>` can keep `line-clamp-2`.
> - Keep text dark on the light card (`text-slate-900` / `text-slate-800` are fine and readable here).
>
> In `components/demos/ed/CaseViewer.tsx` (the case header, ~line 200):
> - Change `<h1 className="font-semibold text-arka-text line-clamp-1 text-sm sm:text-base truncate">` to allow the full title: remove `truncate` and `line-clamp-1`; allow it to wrap to two lines if needed (`leading-snug`, and let the flex item grow — the parent already has `min-w-0`; you can drop `min-w-0` on the title or use `line-clamp-2` as a safety cap). Bump the size slightly to `text-base sm:text-lg` for a header. This header sits on the dark `bg-arka-bg-dark` band, so keep `text-arka-text` (white) — that contrast is correct.
> - Verify the right-side controls (timer/hints/mode toggle) still fit; if a very long title would crowd them, let the title wrap underneath rather than truncate.
>
> **Audit ARKA-ED for the same dark-on-dark / clipping issues called out in Section 5:** confirm no case card or panel renders dark text on a dark background, and that nothing clips at the page edges (add `px-4 sm:px-6 lg:px-8` to the page container if needed). The opened-case body uses light split panels (`bg-slate-50` / `bg-white`) with dark text — keep those readable.
>
> **Acceptance criteria:** Every case-library card shows its complete title (wrapping as needed, no "…"); the opened-case header shows the complete case name; all ED text is readable; nothing clips at the edges from 320px to 1440px.

---

## 7. ARKA-INS — fix the patient cards (Complex badge overlap + truncated names) and the infinite "Generating appeal…"

This is two related problems on the ARKA-INS utilization-management flow.

### 7a. Patient & Payer Selection cards — badge overlap and truncated names

**Screenshot:** #12 — the "Complex" badge overlaps the patient name, and names are cut off ("Robert Th…", "Jennifer …", "William A…").

**File:** `components/demos/ins/PatientIntake.tsx`

**Root cause:** The name `<h3>` uses `truncate` (line ~86), so it ellipsizes. The "Complex" badge is absolutely positioned at `top-3 right-3` (lines ~73–79) over the same row as the name, with no reserved space, so it sits on top of the name's end.

> **Cursor prompt:**
>
> In `components/demos/ins/PatientIntake.tsx` (the `PatientCard` component), fix the name truncation and the "Complex" badge overlap. Verify at `/ins` step 1 ("Patient & Payer Selection").
> - **Show full names.** On the patient name `<h3 className="font-heading text-lg font-semibold text-slate-900 truncate">`, remove `truncate` so `{patient.firstName} {patient.lastName}` shows in full. Add `leading-snug` and allow wrapping; keep `min-w-0` on the parent flex item only if names still fit — if wrapping looks better, that's fine.
> - **Stop the badge from covering the name.** The `isComplex` "Complex" `Badge` is `absolute top-3 right-3`. Reserve space so it never overlaps: add right padding to the header row or the card content so text never runs under the badge — e.g. give the name/identity `<div className="flex-1 min-w-0">` a `pr-20` (or move the avatar+identity row to `pr-24`) on complex cards, OR relocate the badge out of the absolute layer into normal flow (a top row above the avatar) so it can't overlap. Also make sure the selected-state check circle (`absolute -top-2 -right-2`) and the Complex badge don't collide — if both can show, stack them or place the Complex badge top-left.
> - Keep all card text dark-on-light and readable (the card is light; `text-slate-900/800/700/600` are fine). The dark "Primary Diagnosis" sub-panel (`bg-arka-deep` with white text) is intentional — leave it.
>
> **Acceptance criteria:** Full patient names are visible on all three cards; the "Complex" badge never overlaps the name or the selected check; cards look clean at 320px–1440px.

### 7b. Step 10 "Generating appeal…" never finishes — and the generated appeal must look like a real medical-imaging insurance appeal

**Screenshot:** #11 — after completing all 10 steps, the page is stuck on "Generating appeal…" forever.

**Files:**
- `components/demos/ins/SubmitAppealStep.tsx` (the stuck UI + where the appeal is rendered)
- `lib/demos/ins/demo-store.ts` (`simulateAppealGeneration`, lines ~211–220)
- `lib/demos/ins/mock-data.ts` (`generatedAppeals`, lines ~150–158 — only contains ONE appeal, for `ORD-002`)
- `lib/demos/ins/types.ts` (`GeneratedAppeal` interface, lines ~236–246)

**Root cause (the infinite spinner):** `generatedAppeals` only has an entry for `ORD-002` (Jennifer Martinez). For the other scenarios (`ORD-001` Robert Thompson / lumbar, `ORD-003` William Anderson / lung nodule), `getAppealForOrder(currentOrderId)` returns `null`. In `SubmitAppealStep`, the effect condition is `!generatedAppeal && currentOrderId && !processing.isGenerating`. When generation finishes with a `null` appeal, `generatedAppeal` stays `null` and `isGenerating` flips back to `false`, so the effect's condition is **true again** → it re-triggers `simulateAppealGeneration()` endlessly. That's the perpetual "Generating appeal…".

**Two things must change:** (1) generation must always produce a real appeal so the loop terminates, and (2) the appeal must be rendered as a detailed, professional, real-looking insurance appeal letter.

> **Cursor prompt (part 1 — always generate a rich appeal, kill the loop):**
>
> Fix the infinite "Generating appeal…" in ARKA-INS and make every scenario produce a complete, professional medical-necessity appeal letter.
>
> **A. Build a real appeal generator.** In `lib/demos/ins/mock-data.ts` (or a new `lib/demos/ins/build-appeal.ts`), add an exported function `buildGeneratedAppeal(order: ImagingOrder, patient: Patient): GeneratedAppeal` that **always** returns a fully populated `GeneratedAppeal` (per the `GeneratedAppeal` interface in `lib/demos/ins/types.ts`). It must compose a realistic, detailed appeal letter in `letterContent` using the real data available on `order` and `patient` (names, member ID, payer/`insurancePlan.name`, RBM vendor, primary diagnosis + ICD code, CPT code + description, body part, ordering provider). Structure the letter exactly like a real payer appeal:
>   - **Letterhead line:** "ARKA-INS · Utilization Management" and today's date.
>   - **Payer block:** "To: {insurancePlan.name} — Medical Director, Prior Authorization Appeals" and the RBM vendor if present.
>   - **RE: line:** Member name, Member ID, Date of Service, Requested study (CPT + description), Authorization/Reference # (synthesize a plausible `PA-YYYY-######`).
>   - **Subject:** "Formal Appeal of Prior Authorization Denial — Request for Reconsideration".
>   - **Body paragraphs:** (1) statement of appeal and the denial reason being contested; (2) clinical summary — patient age/sex, presenting diagnosis + ICD, relevant history, and documented conservative management already tried; (3) medical-necessity justification tied to guidelines (ACR Appropriateness Criteria for the relevant body part, and the payer/RBM policy) explaining why the requested study is the appropriate next step; (4) explicit request to overturn the denial and an offer of a peer-to-peer review.
>   - **Signature block:** ordering provider name + credentials, specialty, NPI (synthesize), practice/contact line.
>   - Populate `appealType` (e.g. `"first-level"`), `citedGuidelines` (e.g. `["ACR Appropriateness Criteria — {bodyPart}", "{payer} Imaging Policy", "{rbmVendor} Clinical Guidelines"]`), `supportingLiterature` (2–3 plausible `LiteratureCitation` entries with title/authors/journal/year/relevance), `peerToPeerRequested: true`, `generatedAt: new Date().toISOString()`, and a `denialReason` appropriate to the scenario. Tailor the clinical wording per body part (lumbar spine, brain, lung nodule) so each of the three scenarios reads correctly.
>   - Keep the existing `generatedAppeals` array as fallback, but make the store prefer the generator.
>
> **B. Use the generator in the store.** In `lib/demos/ins/demo-store.ts`, update `simulateAppealGeneration` (lines ~211–220): after the simulated delay/progress, compute the appeal as `getAppealForOrder(currentOrderId) ?? buildGeneratedAppeal(currentOrder, currentPatient)` — i.e. fall back to the generator so it is **never null**. Pull `currentOrder`/the patient from the store (`get()`); if needed, look them up via the existing `getOrderById` / `getPatientById` helpers. Then `set({ generatedAppeal: appeal, processing: initialProcessing, … })` as before. Ensure `processingProgress` animates 0 → 50 → 100 before completing so the bar looks intentional.
>
> **C. Make the trigger one-shot (defensive).** In `components/demos/ins/SubmitAppealStep.tsx`, guard the generation effect so it can only fire once per order even if the result were ever empty. Add a `const requestedRef = React.useRef<string | null>(null);` and only call `simulateAppealGeneration()` when `currentOrderId && requestedRef.current !== currentOrderId && !generatedAppeal && !processing.isGenerating`; set `requestedRef.current = currentOrderId` immediately before calling. This makes a repeat-trigger loop impossible regardless of the data.
>
> **Acceptance criteria for part 1:** Completing all 10 steps for **every** patient (Robert/ORD-001, Jennifer/ORD-002, William/ORD-003, and the High-Risk and Gold Card demo modes) ends with a fully rendered appeal — never a perpetual spinner. The progress bar completes and disappears.

> **Cursor prompt (part 2 — make the appeal LOOK like a real, professional appeal letter):**
>
> Redesign the appeal output in `components/demos/ins/SubmitAppealStep.tsx` so it reads like an authentic, professionally formatted medical-imaging insurance appeal letter on clean UI.
> - Render the appeal inside a **white "letter" sheet**: `bg-white text-slate-900 rounded-xl border border-slate-200 shadow-card max-w-3xl mx-auto`, generous padding (`p-8 sm:p-10`), comfortable line length and `leading-relaxed`. (Do NOT keep `prose-invert` — that's for dark backgrounds and is part of why text looked off. Use `prose prose-slate` or plain styled elements.)
> - Lay it out like a real letter:
>   - A **letterhead** header row: ARKA mark/wordmark on the left ("ARKA-INS · Utilization Management"), the date on the right, separated by a thin rule.
>   - A structured **RE: block** as a small definition grid (Member, Member ID, Payer, Date of Service, Requested Study (CPT), Reference #) in a light `bg-slate-50 border border-slate-200 rounded-lg p-4` panel with `font-mono` values.
>   - The **subject line** in bold.
>   - The **body** rendered from `letterContent` with real paragraph spacing (split on blank lines and map to `<p>` elements, or render with `whitespace-pre-wrap` but ensure paragraph gaps are visible).
>   - A **"Cited guidelines"** and **"Supporting literature"** section listed cleanly (small headings + list), pulling from `citedGuidelines` and `supportingLiterature`.
>   - A **signature block** at the bottom.
>   - A footer line: a subtle "Generated by ARKA-INS · {generatedAt} · Demonstration only — not for clinical use." in `text-slate-500 text-xs`.
> - Add an **action bar** above or below the letter with clean buttons: "Copy letter" (copies `letterContent` to clipboard), "Download" (triggers a text/printable download or `window.print()`), and "Reset & Start Over" (existing `onReset`). Use the existing `Button` component variants. Make it print-friendly (the letter sheet should print cleanly).
> - Make the loading state look intentional too: keep the `FileText` pulse + the `Progress` bar, but ensure the message reads "Generating appeal letter…" and the bar visibly fills.
>
> **Acceptance criteria for part 2:** The generated appeal looks like a real, detailed, professionally formatted insurance appeal letter (letterhead, RE block, subject, multi-paragraph body, cited guidelines, signature, footer), on a clean white sheet with fully readable dark text; copy/download/reset actions work; it prints cleanly; it renders correctly for all three patients.

---

## 8. Rural Platform — fix the truncated training case title and the unreadable gray-on-dark panels

**Screenshots:** #13–#17 — Rural Training shows a clipped case title ("Suspected PE at …"); the Reimburse, Network, AI, and Intel pages render as **washed-out gray panels with hard-to-read dark text** instead of the clean light UI used elsewhere.

**Files:**
- `components/demos/rural/training/RuralCaseViewer.tsx` (case title — line ~164 `truncate`)
- `components/demos/rural/shared/ui/Card.tsx` (shared card — `dark:bg-arka-bg-medium/40`, line 15)
- `components/demos/rural/shared/ui/Tabs.tsx` (`bg-arka-bg-medium/30`, line 36; `dark:data-[state=active]:bg-arka-bg-dark/80`, line 53)
- `components/demos/rural/shared/ui/Select.tsx` (`dark:bg-arka-bg-medium/80`, line 22)
- `components/demos/rural/shared/RuralSidebar.tsx` (`dark:bg-arka-navy/95`, line 15)
- `components/demos/rural/intelligence/PopulationHealthAnalytics.tsx` (`bg-arka-bg-medium/30`, line 20)
- `components/demos/rural/network/NetworkManagerDashboard.tsx` (`bg-arka-bg-medium/20`, lines ~163/183/200/250)
- `components/demos/rural/network/EquipmentRegistry.tsx` (`bg-arka-bg-medium/30`, line 18)
- `components/demos/rural/shared/MapVisualization.tsx` (`bg-arka-bg-medium/40`, line 14)
- `components/demos/rural/network/HubSpokeNetworkDiagram.tsx` (`fill-arka-bg-medium/60 … dark:stroke-white/30`, line 103)

**Root cause:** Because `.dark` is permanently on (see "Read this first"), the shared Rural `Card` paints `dark:bg-arka-bg-medium/40` (a translucent dark navy) while its `CardTitle`/content use `text-arka-text-dark` (dark navy). Many Rural panels and rows also use `bg-arka-bg-medium/20–40` as fills. Dark navy fill + dark navy text = the unreadable "gray box with black text" look. The training title is simply `truncate` (line ~164).

> **Cursor prompt (part 1 — un-truncate the Rural Training case title):**
>
> In `components/demos/rural/training/RuralCaseViewer.tsx`, the case header title (~line 164) is `<h1 className="truncate text-sm font-semibold text-arka-text sm:text-base">`. Remove `truncate` so the full case name shows (e.g. "Suspected PE at a Facility with Only X-ray and Ultrasound"). Let it wrap (`leading-snug`, allow two lines), and bump to `text-base sm:text-lg`. This header sits on the dark band, so keep `text-arka-text` (white). Ensure the back button and any right-side controls still fit; let the title wrap rather than clip. Verify at `/rural/training` after opening a case.
>
> **Acceptance criteria:** The full training case title is visible, wrapping if needed, never ellipsized.

> **Cursor prompt (part 2 — convert all Rural panels to the clean light UI used elsewhere):**
>
> The Rural pages (Reimburse, Network, AI, Intel, and shared components) render as washed-out gray panels with unreadable dark text because the app is permanently in `.dark` and these surfaces use translucent dark fills (`bg-arka-bg-medium/20–40`, `dark:bg-arka-bg-medium/*`, `dark:bg-arka-navy/95`) under dark text. Convert every Rural **content** surface to the clean **light** UI used by the rest of the demos: light backgrounds with dark, readable text. Do not invent new tokens. Verify live at `/rural/reimbursement`, `/rural/network`, `/rural/ai`, and `/rural/intelligence`.
>
> Make these specific changes:
> - `components/demos/rural/shared/ui/Card.tsx` (line 15): remove the `dark:border-white/10 dark:bg-arka-bg-medium/40` so the card stays `bg-white border border-arka-light shadow-sm` in all themes. Confirm `CardTitle` (`text-arka-text-dark`) and content are dark-on-white.
> - `components/demos/rural/shared/ui/Tabs.tsx`: change the tablist background `bg-arka-bg-medium/30` (line 36) to a light tint like `bg-arka-bg-alt` (`#F1F5F9`); change the active-tab `dark:data-[state=active]:bg-arka-bg-dark/80` (line 53) so the active tab is `bg-white text-arka-teal shadow-sm` (drop the dark override). Inactive tab text `text-arka-text-dark-muted` is fine on the light tint.
> - `components/demos/rural/shared/ui/Select.tsx` (line 22): remove `dark:bg-arka-bg-medium/80` so the select stays `bg-white text-arka-text-dark`.
> - `components/demos/rural/shared/RuralSidebar.tsx` (line 15): the sidebar should match the light shell — remove `dark:bg-arka-navy/95` so it stays `bg-white/90`; ensure the nav item labels and icons use readable dark/teal tokens (`text-arka-text-dark`, active = `text-arka-teal`), not white-on-white. (If you prefer the sidebar to stay dark navy, instead switch its item text to `text-arka-text`/`text-arka-text-muted` so it's readable — but light is the cleaner match here.)
> - Replace **content-fill** uses of `bg-arka-bg-medium/20`, `/30`, `/40` with light tints in these files: `components/demos/rural/intelligence/PopulationHealthAnalytics.tsx` (line 20), `components/demos/rural/network/NetworkManagerDashboard.tsx` (lines ~163, 183, 200, 250), `components/demos/rural/network/EquipmentRegistry.tsx` (line 18), and `components/demos/rural/shared/MapVisualization.tsx` (line 14). Use `bg-arka-bg-alt` or `bg-slate-50` with `border border-arka-light` and `text-arka-text-dark`/`-muted`. The map/diagram placeholders can keep a subtle tint but must not look like a broken dark overlay.
> - `components/demos/rural/network/HubSpokeNetworkDiagram.tsx` (line 103): adjust node fills/strokes so they read on a light background (e.g. `fill-arka-pale stroke-arka-primary/40`), and drop the `dark:stroke-white/30` override if it harms contrast.
> - **Then sweep the whole `components/demos/rural/**` tree** for any remaining `dark:bg-…`, `bg-arka-bg-medium…`, or `bg-arka-bg-dark…` used as a content background, plus the page wrappers in `app/rural/**`. Anywhere dark text sits on a dark/translucent-dark fill, switch the fill to light and keep dark text (or, for intentionally dark headers/bands, switch the text to `text-arka-text`). The intended result is the same clean, professional, light UI as `/clin-suite` and `/ed`.
>
> **Acceptance criteria:** `/rural/reimbursement`, `/rural/network`, `/rural/ai`, and `/rural/intelligence` all render as clean light surfaces with fully readable dark text — no washed-out gray panels, no dark-on-dark; the sidebar and tabs are readable; the look matches the rest of the demo surfaces; nothing clips at the edges from 320px–1440px.

---

## 9. Final QA pass — smooth, glitch-free, investor-demo ready

Run this after Sections 1–8.

> **Cursor prompt:**
>
> Do a full pre-demo QA pass on the ARKA app so it runs smoothly with no buffering or visual glitches for an investor presentation.
> - Run `npm run build` (or `pnpm build`) and fix every TypeScript error, unused import, and ESLint warning introduced by the recent changes. The build must pass clean.
> - Start `npm run dev` and click through, in order: `/` (full homepage scroll), `/clin-suite` (all three tabs), `/ed` (open at least 3 cases incl. a long-titled one, both Learning and Quiz modes), `/ins` (run all 10 steps for all three patients AND the High-Risk and Gold Card demo modes, confirming the appeal letter renders every time), and `/rural` plus `/rural/training`, `/rural/reimbursement`, `/rural/network`, `/rural/ai`, `/rural/intelligence`.
> - Watch the browser console and fix any errors or warnings (hydration mismatches, missing keys, failed fetches, act() warnings).
> - Check for layout shift / jank: confirm `framer-motion` entrance animations don't cause content to jump or overflow horizontally; confirm no element triggers a horizontal scrollbar at 320px, 768px, 1024px, 1440px.
> - Confirm every primary nav link and CTA routes correctly and that route transitions are smooth (no flashes of dark-on-dark while a page mounts).
> - Confirm all the specific fixes from Sections 1–8 are in place and verify each one's acceptance criteria.
> - Report a short checklist of what you verified and anything you couldn't fix.
>
> **Acceptance criteria:** Clean build, no console errors on any route, no horizontal overflow at common breakpoints, all flows complete without getting stuck, all Section 1–8 fixes confirmed.

---

## 10. Clarity pass — anyone landing on the site instantly understands what ARKA is

The single most important investor requirement: a first-time viewer must immediately grasp what ARKA does.

> **Cursor prompt:**
>
> Make it impossible to be confused about what ARKA is within the first screen. ARKA is an **evidence-based imaging clinical decision support engine** that helps clinicians order the *right* imaging at the point of care, runs the same appropriateness math on the payer's side (utilization review / appeals), trains clinicians (ED), and extends to rural sites — recovering imaging revenue lost to prior-auth denials, as Non-Device CDS (no FDA 510(k)), CMS-0057-F ready.
>
> - In `components/landing/Hero.tsx`: above or below the "CUTTING EDGE IMAGING DECISION SUPPORT" eyebrow, add a clear, plain-language **headline** and **one-sentence subheadline** that state, in non-jargon terms, what ARKA is and who it's for. Example headline: "Order the right imaging — the first time." Example subheadline: "ARKA is an evidence-based decision-support engine that guides imaging orders at the point of care, then runs the same appropriateness check on the payer side — fewer denials, less administrative burden, and the ordering clinician always keeps the final call." Keep it readable (light text on the dark hero), responsive, and animated consistently with the existing hero motion. Do not remove the existing CTAs.
> - Confirm the section right under the hero reinforces the "what/why" before diving into revenue or platform detail; if the first scrolled section jumps straight to numbers, add a one-line framing sentence so the narrative is: what ARKA is → why it matters → how it works (four phases) → proof → CTA.
> - On each demo landing (`/clin-suite`, `/ed`, `/ins`, `/rural`), confirm the top of the page has a one-line plain-language description of what that surface does (most already have a subtitle — tighten any that are jargon-heavy so a non-clinical investor understands them).
> - Keep copy concise and professional. Don't overpromise; preserve the existing compliance framing ("Non-Device CDS", "CMS-0057-F ready", "supports, not replaces, clinical judgment").
>
> **Acceptance criteria:** A first-time visitor reading only the hero understands what ARKA is, who uses it, and why it matters; each demo page states its purpose in one plain sentence; tone stays professional and compliant.

---

## Quick reference — issue → files

| # | Issue | Primary file(s) |
|---|-------|-----------------|
| 1 | Distorted hub diagram → delete + reformat | `components/landing/PlatformEcosystem.tsx` |
| 2 | Add real testimonials | `components/landing/Testimonials.tsx` |
| 3 | Remove 2 header buttons + re-space nav | `components/navigation/Navbar.tsx` |
| 4 | Favicon → ARKA logo | `app/favicon.ico` (delete), `app/icon.svg` (add), `public/arka-icon.svg` |
| 5 | CLIN suite dark-on-dark + narrow/clipped | `app/clin-suite/page.tsx`, `components/demos/clin/HowArkaWorksSection.tsx`, `components/demos/clin/ClinDemoContent.tsx` |
| 6 | ED truncated case titles | `components/demos/ed/EdDemoContent.tsx`, `components/demos/ed/CaseViewer.tsx` |
| 7a | INS patient card badge/name | `components/demos/ins/PatientIntake.tsx` |
| 7b | INS infinite "Generating appeal" + real letter | `components/demos/ins/SubmitAppealStep.tsx`, `lib/demos/ins/demo-store.ts`, `lib/demos/ins/mock-data.ts`, `lib/demos/ins/types.ts` |
| 8 | Rural truncated title + gray-on-dark panels | `components/demos/rural/training/RuralCaseViewer.tsx`, `components/demos/rural/shared/ui/Card.tsx`, `…/ui/Tabs.tsx`, `…/ui/Select.tsx`, `…/RuralSidebar.tsx`, `…/intelligence/PopulationHealthAnalytics.tsx`, `…/network/NetworkManagerDashboard.tsx`, `…/network/EquipmentRegistry.tsx`, `…/shared/MapVisualization.tsx`, `…/network/HubSpokeNetworkDiagram.tsx` |
| 9 | Final QA pass | all |
| 10 | Clarity pass | `components/landing/Hero.tsx` + demo landings |

