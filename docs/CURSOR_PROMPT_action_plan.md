# Cursor Prompt — Embed `ARKA_Action_Plan_ver7.pdf` into the ARKA website

Paste everything below the line into Cursor (Cmd-K / Composer, in Agent mode, with the repo root open).

---

You are working in the existing Next.js 16 / React 19 / Tailwind v4 codebase for the ARKA Health marketing + demo site. The repo root is the folder I have open in Cursor.

## Hard constraints — read before doing anything

1. **Do NOT change the existing UI.** Do not modify `components/landing/*`, `components/navigation/Navbar.tsx`, `app/page.tsx`, or any demo page (`app/clin`, `app/ed`, `app/ins`, `app/rural`). The Hero, WhyArka, PhaseCards, EcosystemDiagram, Testimonials, CtaSection, and the Navbar must look and behave exactly as they do today. No new sections injected into the homepage. No new nav links in the navbar.
2. **The only edits to existing files are to `components/navigation/Footer.tsx`** — and that edit is a single, subtle text link inserted into the existing compliance row, styled to match the other compliance links already there (`arka-link-underline text-arka-cyan` pattern). It must blend in, not pop out.
3. **Everything else is additive** — new route, new component, new public asset. No new npm dependencies. Use the browser's native PDF rendering via `<object>` with an `<iframe>` fallback. Do not install `react-pdf`, `pdfjs-dist`, or anything similar.
4. Keep the existing color tokens: `arka-navy`, `arka-bg-dark`, `arka-bg-medium`, `arka-text`, `arka-text-muted`, `arka-text-soft`, `arka-cyan`, `arka-teal`, `arka-deep`. Don't introduce new ones.
5. Use TypeScript, the existing import alias `@/...`, and the existing file conventions (look at `app/privacy/page.tsx` and `app/terms/page.tsx` for the simplest existing page pattern to mirror).

## Step 1 — Move the PDF into `public/`

The PDF currently lives at `docs/ARKA_Action_Plan_ver7.pdf`. Next.js can only serve files placed under `public/` at a stable URL. Copy (do not move — keep the original in `docs/`) the file so it is reachable at the URL `/docs/ARKA_Action_Plan_ver7.pdf`:

```bash
mkdir -p public/docs
cp docs/ARKA_Action_Plan_ver7.pdf public/docs/ARKA_Action_Plan_ver7.pdf
```

Verify with `ls -lh public/docs/ARKA_Action_Plan_ver7.pdf` — it should be ~1.9 MB.

## Step 2 — Create a dedicated `/action-plan` route

Create the file `app/action-plan/page.tsx` with the following content. This is a server component (no `"use client"`) and it renders a full-width, full-height embedded PDF viewer. The page uses the same `arka-navy`/`arka-bg-dark` palette as the rest of the site so the global `<Navbar />` and `<Footer />` (rendered in `app/layout.tsx`) flow continuously into it.

```tsx
import type { Metadata } from "next";
import { ActionPlanViewer } from "@/components/action-plan/ActionPlanViewer";

const PDF_PATH = "/docs/ARKA_Action_Plan_ver7.pdf";

export const metadata: Metadata = {
  title: "Action Plan",
  description:
    "ARKA Health Comprehensive Action Plan — strategic ROI analysis, FDA non-device CDS pathway, AIIE methodology, and implementation roadmap.",
  openGraph: {
    title: "ARKA Action Plan",
    description:
      "Comprehensive Action Plan for the ARKA Imaging Intelligence Platform (ARKA-CLIN | ARKA-ED | ARKA-INS).",
  },
};

export default function ActionPlanPage() {
  return (
    <section className="bg-arka-bg-dark">
      {/* Slim header strip — matches privacy/terms aesthetic, does not compete with the document */}
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-arka-cyan/80">
              ARKA Health · Version 6.0 · February 2026
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-arka-text sm:text-3xl">
              Comprehensive Action Plan
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-arka-text-soft">
              Three-Phase Platform — ARKA-CLIN · ARKA-ED · ARKA-INS — powered by the ARKA Imaging
              Intelligence Engine (AIIE).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-arka-cyan/40 bg-arka-cyan/5 px-3 py-1.5 text-sm font-medium text-arka-cyan transition hover:border-arka-cyan/60 hover:bg-arka-cyan/10"
            >
              Open in new tab
            </a>
            <a
              href={PDF_PATH}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-arka-text-muted transition hover:border-white/20 hover:text-arka-text"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>

      {/* PDF viewer */}
      <ActionPlanViewer src={PDF_PATH} />
    </section>
  );
}
```

## Step 3 — Create the embed component

Create the file `components/action-plan/ActionPlanViewer.tsx`. It is a small client component that picks `<object>` (best cross-browser PDF support, gives the user the browser's native zoom/print/search toolbar) and falls back to `<iframe>` plus a download link when the browser refuses to render PDFs inline.

Why these choices:
- `<object>` with `type="application/pdf"` triggers the browser's built-in PDF viewer, which is the most legible and feature-complete option (search, zoom, scroll, fit-to-width). No JS bundle, no font issues.
- The container is `min-h-[calc(100vh-7rem)]` so on desktop the document fills the viewport beneath the fixed Navbar; on tall content the viewer's own scroll handles the rest.
- The wrapper uses the existing `arka-navy` border tokens so it looks intentional, not like a raw iframe.

```tsx
"use client";

type Props = {
  src: string;
};

export function ActionPlanViewer({ src }: Props) {
  // Native PDF viewer params: open at page 1, fit to width, hide PDF toolbar chrome we don't need.
  // These params are advisory — browsers honor them where supported (Chromium, Firefox).
  const viewerSrc = `${src}#view=FitH&pagemode=none&toolbar=1&navpanes=0`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-arka-bg-medium shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        <object
          data={viewerSrc}
          type="application/pdf"
          aria-label="ARKA Action Plan, version 6.0"
          className="block h-[calc(100vh-9rem)] min-h-[680px] w-full bg-neutral-100"
        >
          {/* Fallback for browsers that won't render PDFs inline (some iOS Safari builds, etc.) */}
          <iframe
            src={viewerSrc}
            title="ARKA Action Plan, version 6.0"
            className="block h-[calc(100vh-9rem)] min-h-[680px] w-full bg-neutral-100"
          />
          <div className="p-6 text-center text-sm text-arka-text-soft">
            Your browser can&apos;t display PDFs inline.{" "}
            <a
              href={src}
              className="arka-link-underline font-medium text-arka-cyan hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the Action Plan in a new tab
            </a>
            .
          </div>
        </object>
      </div>
    </div>
  );
}
```

## Step 4 — Add ONE subtle link in the Footer compliance row

Open `components/navigation/Footer.tsx`. Find the compliance row that already contains the `Evidence`, `AIIE Methodology`, `CDS Hooks Discovery`, `Privacy`, and `Terms` links — they're inside the `<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 ...">` block.

Insert a single new link between the `AIIE Methodology` `<button>` and the `CDS Hooks Discovery` `<Link>`. Mirror the exact pattern used by the surrounding links (separator `|` span + `arka-link-underline font-medium text-arka-cyan hover:text-white`). Do not add icons, badges, or any other visual treatment — it must read as just another compliance link.

Add this block immediately after the `AIIE Methodology` button's closing `</button>` and the separator that follows it (or before the `CDS Hooks Discovery` link's preceding separator — either way produces the same result; pick whichever keeps the diff minimal):

```tsx
<Link
  href="/action-plan"
  className="arka-link-underline font-medium text-arka-cyan hover:text-white"
>
  Action Plan
</Link>
<span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
  |
</span>
```

No other change to the Footer. No change to the Navbar. The link is visible to anyone reading the footer, but recedes into the existing compliance row so it doesn't compete with the brand.

## Step 5 — Sanity-check no other files were touched

Run `git status` and confirm the only changes are:

```
new file:   public/docs/ARKA_Action_Plan_ver7.pdf
new file:   app/action-plan/page.tsx
new file:   components/action-plan/ActionPlanViewer.tsx
modified:   components/navigation/Footer.tsx
```

If anything else shows up modified, revert it — the homepage and all demo pages must be byte-identical to before.

## Step 6 — Build & demo

Run, in order:

```bash
npm run type-check
npm run lint
npm run dev
```

`type-check` and `lint` should both pass with zero errors (you are not adding any new types or unsafe casts). Then open the dev server URL it prints (default `http://localhost:3000`).

To show me how it looks, walk me through it like this:

1. Load `http://localhost:3000` — confirm the homepage looks **identical** to before (Hero, WhyArka, PhaseCards, EcosystemDiagram, Testimonials, CTA).
2. Scroll to the footer — point out the new `Action Plan` link sitting subtly in the compliance row next to `AIIE Methodology` and `CDS Hooks Discovery`.
3. Click the `Action Plan` link — confirm it navigates to `http://localhost:3000/action-plan`, the global Navbar and Footer still render, and the embedded PDF loads inside the rounded card with the browser's native viewer (search, zoom, print all work).
4. Click `Open in new tab` and `Download PDF` from the page header strip — confirm both work and resolve to `/docs/ARKA_Action_Plan_ver7.pdf`.
5. Resize the window narrow (mobile width) — confirm the viewer still fills the column and remains readable; the page header strip stacks vertically.

If any of those five checks fail, fix the issue before declaring done. When all five pass, leave `npm run dev` running and tell me which URL to visit.

---

### Notes / rationale (don't include in the code, just keep in mind)

- The PDF is 114 pages and ~1.9 MB. Native browser PDF rendering is the right call here — it streams pages on demand and provides text search, which a `react-pdf` canvas-based renderer would not match without significant extra work and bundle weight.
- Using `#view=FitH` makes the document open fit-to-width by default, which is what most readers want for a portrait-format strategic plan.
- The viewer card uses `bg-neutral-100` so the page edges of the PDF (which are white) don't sit on a dark background with a visible seam.
- The header strip uses the same vertical rhythm and uppercase eyebrow style as the existing demo page headers, so the route feels like part of the site rather than a bolt-on.
