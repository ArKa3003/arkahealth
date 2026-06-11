# ARKA Health — `/security` Trust Center Cursor Prompts (v1, June 2026)

> **How to use this document.** Each numbered step below contains one **Cursor prompt** inside a fenced code block. Open Cursor's chat panel (`Cmd+L`), paste a prompt verbatim, and let it apply the change. Prompts are ordered so dependencies resolve cleanly — run them top to bottom. After each step, save the files Cursor opens and run `npm run dev` to spot regressions before moving on. The final section is a smoke-test checklist.
>
> **Project root:** `/Users/arrikanna/Desktop/arkahealth`
> **Framework:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Framer Motion 12 · Recharts 3 · Radix UI · lucide-react
> **Live URL:** `https://www.getarka.health`
>
> **Design tokens you will reuse (from `styles/globals.css` / `tailwind.config.ts`):**
> `arka-navy / arka-bg-dark` = `#0F172A` · `arka-bg-medium` = `#1E293B` · `arka-teal` (teal-500) = `#14B8A6` · `arka-teal-600` = `#0D9488` · `arka-teal-50` = `#F0FDFA` · `arka-bg-alt` = `#F1F5F9` · `arka-text` = `#FFFFFF` · `arka-text-soft` = `#E2E8F0` · `arka-text-dark` = `#0F172A` · `arka-text-dark-muted` = `#475569` · status colors `--success #059669`, `--warning #d97706`.
>
> **What this builds.** A dedicated **`/security` — "Security & Compliance"** page in the style of a Vanta/Drata trust center: hero with live program-status pills, framework cards (HIPAA · SOC 2 · HITRUST e1 · 2025 Security Rule baseline), six control pillars, a certification timeline visualization, a controlled-document library (the 21-document compliance package in `/compliance`), the downloadable Data Security Overview PDF, a no-PHI demo attestation band, and an FAQ — cross-linked with the existing FDA-focused `/trust` page, navbar, footer, and sitemap.
>
> **Truth-in-claims rule (do not edit away).** Every status label in this page reads **"In force" (HIPAA program), "In progress" (SOC 2), "Roadmap" (HITRUST e1)**. None of the copy says "certified," "attested," or "audited" for SOC 2/HITRUST — hospital diligence teams ask for the report, and the claim must match the artifact. When the SOC 2 Type I report is issued, update `lib/security/compliance-data.ts` (single source of truth) — not the components.

---

## Table of Contents

1. **Prompt 1** — Route key, PDF asset check, page scaffold (`app/security/page.tsx` + client shell)
2. **Prompt 2** — Single source of truth: `lib/security/compliance-data.ts` (all copy, statuses, documents, milestones)
3. **Prompt 3** — Hero: dark navy band, status pills, dual CTAs
4. **Prompt 4** — "Compliance at a glance" framework cards
5. **Prompt 5** — Six control pillars + hard-numbers stat band
6. **Prompt 6** — Certification timeline + document-coverage chart (Recharts)
7. **Prompt 7** — Document library, request-package CTA, no-PHI attestation band, FAQ
8. **Prompt 8** — Site wiring: navbar, footer, `/trust` cross-links, sitemap, OG metadata
9. **Final verification** — smoke test before sharing

---

## Prompt 1 — Route key, PDF asset, page scaffold

**Files created:** `app/security/page.tsx`, `components/security/SecurityPageClient.tsx`
**Files edited:** `lib/constants.ts`

Before running: confirm `public/docs/ARKA_Data_Security_Overview.pdf` exists (it was added alongside the `/compliance` documentation package). If missing, copy it from `compliance/06_Prospect_Facing/ARKA_Data_Security_Overview.pdf`.

```
You are working in the ARKA Health Next.js 16 App Router repo (React 19, Tailwind v4, TypeScript strict).

Goal: scaffold a new top-level marketing/trust page at /security titled "Security & Compliance", following the exact architectural pattern of the existing ROI page (app/roi/page.tsx renders components/roi/RoiPageClient.tsx).

1) In lib/constants.ts, inside the `routes` object (it currently has keys like trust: "/trust" and roi: "/roi"), add:
   security: "/security",
   Keep the object `as const` and alphabetical-ish placement near trust/roi.

2) Create app/security/page.tsx — a SERVER component:
   - import type { Metadata } from "next" and the client component.
   - const SECURITY_DESCRIPTION = "How ARKA Health protects clinical data: HIPAA privacy and security program in force, SOC 2 Type I/II in progress, HITRUST e1 roadmap, encryption everywhere, immutable audit trails, and a 21-document compliance package available for hospital security review."
   - export const metadata: Metadata = { title: "Security & Compliance", description: SECURITY_DESCRIPTION, openGraph: { title: "ARKA — Security & Compliance", description: SECURITY_DESCRIPTION } }
   - default export returns <SecurityPageClient />.

3) Create components/security/SecurityPageClient.tsx — a CLIENT component ("use client"):
   - Default-export-less named export `SecurityPageClient`.
   - Render a <main id="main-content"> wrapper with placeholder <section> stubs in this order, each with an id and a scroll-mt-24 class so anchor navigation clears the sticky navbar: 
     #hero, #frameworks, #controls, #timeline, #documents, #demo-data, #faq.
   - For now each stub renders an <h2> with the section name in text-arka-text-dark so the page compiles and renders.
   - Add a slim sticky in-page nav under the hero (hidden on mobile, flex on lg+): links to Frameworks, Controls, Timeline, Documents, Demo data, FAQ using the anchor ids; style: text-sm text-arka-text-dark-muted hover:text-arka-teal-600, active section underlined with a 2px arka-teal border-bottom (use an IntersectionObserver to set the active id, same approach as components/docs/DocsPageLayout.tsx).

Do not add the page to the navbar/footer/sitemap yet (a later step does the wiring). Run a type check mentally: no unused imports, no `any`.
```

---

## Prompt 2 — Single source of truth: `lib/security/compliance-data.ts`

**File created:** `lib/security/compliance-data.ts`

All page copy, statuses, document lists, and milestone dates live in one typed module so future status changes (e.g., SOC 2 Type I issued) are one-line edits. The copy below is final — paste it exactly; it was drafted to match the adopted compliance package (ARKA-GOV/PRIV/SEC/RDY/DEMO series) and its truth-in-claims standard (ARKA-RDY-004 § 4).

```
Create lib/security/compliance-data.ts in the ARKA repo. TypeScript strict; export const objects with `as const` where possible. Use EXACTLY this data — do not paraphrase, embellish, or upgrade any status wording (legal requirement: no "certified"/"attested" language for SOC 2 or HITRUST until reports are issued).

export type FrameworkStatus = "in-force" | "in-progress" | "roadmap";

1) STATUS_PILLS: Array<{ label: string; status: FrameworkStatus }> =
   [
     { label: "HIPAA program in force", status: "in-force" },
     { label: "SOC 2 Type I/II in progress", status: "in-progress" },
     { label: "HITRUST e1 roadmap", status: "roadmap" },
   ]

2) FRAMEWORKS — array of:
   { id, name, status: FrameworkStatus, statusLabel, summary, detail, docRef }
   - id "hipaa": name "HIPAA — Privacy, Security & Breach Notification Rules", statusLabel "Program in force",
     summary "Full privacy and security policy suite adopted and operating; business associate agreement ready for execution; annual NIST 800-30 risk analysis complete.",
     detail "HIPAA has no government certification. Compliance is demonstrated through adopted policies, implemented safeguards, and a six-year evidence trail — all maintained under ARKA's Information Security & Compliance Program Charter and available for diligence review.",
     docRef "ARKA-GOV-001 · ARKA-PRIV series · ARKA-SEC series"
   - id "soc2": name "SOC 2 — Security, Availability, Confidentiality", statusLabel "In progress",
     summary "Readiness assessment complete against the 2017 Trust Services Criteria (2022 points of focus). Type I examination targeted December 2026; Type II report mid-2027.",
     detail "ARKA does not claim SOC 2 attestation before the auditor's report is issued. On issuance, the report will be available to customers and prospects under NDA.",
     docRef "ARKA-RDY-002"
   - id "hitrust": name "HITRUST e1 — Essentials, 1-Year Validated", statusLabel "Roadmap active",
     summary "44-requirement e1 tier selected as the appropriate entry certification; MyCSF self-assessment Q1 2027, validated assessment H1 2027. ~80–90% control overlap with the SOC 2 program lets one evidence body serve both.",
     detail "ARKA is not HITRUST certified and will not use the phrase or the seal until the validated assessment is issued.",
     docRef "ARKA-RDY-003"
   - id "nprm": name "2025 HIPAA Security Rule NPRM", statusLabel "Adopted as baseline",
     summary "The December 2024 OCR proposal's heightened specifications are ARKA's internal baseline today: mandatory MFA, universal encryption, asset inventory and network map, six-month vulnerability scans, annual penetration testing, segmentation, 72-hour restore capability.",
     detail "Designing to the proposed rule now means no scramble when it is finalized — and answers the question hospital CISOs are already asking vendors.",
     docRef "ARKA-SEC-001 § 5 · ARKA-SEC-007"

3) CONTROL_PILLARS — array of { id, icon, title, points: string[] } with lucide icon name strings:
   - encryption / icon "Lock" / "Encryption everywhere":
     ["AES-256 at rest across databases, object storage, and backups",
      "TLS 1.2+ in transit (1.3 preferred), HSTS on all public endpoints",
      "Keys in managed KMS; rotation and custody documented; no plaintext ePHI anywhere"]
   - access / icon "KeyRound" / "Access control":
     ["MFA on all production, code, and data systems; FIDO2 hardware keys for admins",
      "Role-based least privilege from a documented access matrix; quarterly reviews",
      "24-hour deprovisioning; break-glass access alarmed, logged, and reviewed"]
   - monitoring / icon "FileSearch" / "Audit & monitoring":
     ["Append-only audit trail: record-level access, admin actions, deployments",
      "Security logs retained 6 years; alerting on anomalous access and exports",
      "Weekly security review; monthly sampled access-log review"]
   - resilience / icon "DatabaseBackup" / "Resilience":
     ["Immutable cross-region backups: 35-day point-in-time + 12-month archives",
      "Quarterly restore tests; annual full recovery exercise",
      "72-hour restoration standard for critical systems; 15-minute RPO on the data tier"]
   - vendors / icon "Network" / "Vendor & subcontractor risk":
     ["Tiered vendor register; BAAs executed with every PHI-touching subprocessor",
      "Annual attestation review (SOC 2 / ISO 27001) mapped to shared-responsibility matrix",
      "NIST 800-88 return/destruction on offboarding"]
   - sdlc / icon "GitBranch" / "Secure development":
     ["Protected branches; CI gates: type checks, compliance tests, dependency audit, secret scanning",
      "No production data in dev, test, or demo — synthetic fixtures enforced by CI guards",
      "Independent penetration test annually; criticals fixed in 10 days"]

4) HARD_NUMBERS — array of { value, label }:
   [{ value: "0", label: "PHI records in the demo environment — 100% synthetic data" },
    { value: "21", label: "controlled documents in the compliance package" },
    { value: "6 yr", label: "security-evidence retention (45 C.F.R. § 164.316)" },
    { value: "≤ 10 bd", label: "customer breach notice under our BAA" },
    { value: "72 h", label: "critical-system restore standard" },
    { value: "100%", label: "of workforce trained before production access" }]

5) MILESTONES — array of { quarter, title, detail, state: "done" | "active" | "upcoming" }:
   [{ quarter: "Q2 2026", title: "Policy suite adopted", detail: "21-document HIPAA/SOC 2/HITRUST program in force; initial NIST 800-30 risk analysis complete", state: "done" },
    { quarter: "Q3 2026", title: "Hardening & evidence accrual", detail: "FIDO2 rollout, cloud-posture scanning, cyber insurance, audit-firm engagement", state: "active" },
    { quarter: "Q4 2026", title: "Pen test + SOC 2 Type I", detail: "First independent penetration test; Type I examination as of December 2026", state: "upcoming" },
    { quarter: "Q4 2026 – Q2 2027", title: "Type II observation window", detail: "≥ 3 months of operating evidence; first design-partner BAAs executed", state: "upcoming" },
    { quarter: "H1 2027", title: "SOC 2 Type II report · HITRUST e1", detail: "Type II report issued; e1 validated assessment submitted for certification", state: "upcoming" }]

6) DOCUMENT_LIBRARY — array of { series, items: Array<{ no, title }> } covering:
   Governance: ARKA-GOV-001 Information Security & Compliance Program Charter
   Privacy: ARKA-PRIV-001 HIPAA Privacy Policy; ARKA-PRIV-002 De-Identification & Limited Data Set Policy
   Contracts: ARKA-LGL-001 Business Associate Agreement (Template)
   Security: ARKA-SEC-001 Information Security Policy; ARKA-SEC-002 Risk Analysis & Risk Management; ARKA-SEC-003 Access Control & Identity Management; ARKA-SEC-004 Encryption & Key Management; ARKA-SEC-005 Audit Logging & Monitoring; ARKA-SEC-006 Incident Response & Breach Notification; ARKA-SEC-007 Contingency Plan (Backup, DR & Emergency Mode); ARKA-SEC-008 Workforce Training & Sanctions; ARKA-SEC-009 Vendor & Subcontractor Risk Management; ARKA-SEC-010 Secure SDLC & Change Management; ARKA-SEC-011 Data Classification, Retention & Disposal; ARKA-SEC-012 Acceptable Use, Workstation & Mobile Device
   Readiness: ARKA-RDY-001 HIPAA Security Risk Assessment Report (2026); ARKA-RDY-002 SOC 2 Readiness & Gap Assessment; ARKA-RDY-003 HITRUST e1 Readiness Roadmap; ARKA-RDY-004 Compliance Roadmap & Certification Timeline
   Demo: ARKA-DEMO-001 Demo Environment Synthetic Data Policy & No-PHI Attestation

7) FAQ — array of { q, a } with EXACTLY these pairs:
   - q "Is ARKA 'HIPAA certified'?"
     a "No one is — HIPAA has no certification. What exists is a compliance program: adopted policies, implemented safeguards, risk analyses, training, and evidence. Ours is in force and documented in a 21-document package available under NDA. Vendors who say 'HIPAA certified' are telling you something about their diligence."
   - q "Will ARKA sign a BAA?"
     a "Yes. We maintain an attorney-drafted Business Associate Agreement template (45 C.F.R. §§ 164.314(a), 164.504(e)) with 10-business-day breach notice, subcontractor flow-down, and NIST 800-88 return/destruction terms. We also execute customer paper subject to counsel review."
   - q "Is ARKA SOC 2 or HITRUST certified today?"
     a "Not yet, and we won't claim otherwise. SOC 2 Type I is targeted for December 2026 with the Type II report to follow in mid-2027; HITRUST e1 validated assessment is targeted H1 2027. The full timeline, including what we say publicly at each stage, is documented in ARKA-RDY-004."
   - q "Does the demo contain real patient data?"
     a "No. Every patient, encounter, claim, and scenario in the ARKA demo is synthetic — generated by our synthetic-data tooling and tagged with an [ARKA-DEMO] marker. A quarterly officer-signed attestation (ARKA-DEMO-001) verifies the environment, and submitting PHI into the demo is prohibited by our terms."
   - q "Where is data hosted and who can see it?"
     a "Production runs on U.S. cloud infrastructure (AWS, Vercel, Supabase) under executed BAAs with each provider before any PHI flows. Tenant data is isolated with row-level security; ARKA staff access customer tenants only through a logged, ticketed support workflow."
   - q "Does ARKA train AI models on PHI?"
     a "No. Model training, evaluation, and analytics use synthetic or de-identified data exclusively (ARKA-PRIV-002), with disclosure-risk review on outputs. De-identification of customer PHI happens only where the BAA expressly permits it."

8) CONTACTS: { security: "security@getarka.health", privacy: "privacy@getarka.health", overviewPdf: "/docs/ARKA_Data_Security_Overview.pdf" }

Export everything. Add a top-of-file comment: "Single source of truth for /security. Update statuses HERE when audit artifacts are issued (see ARKA-RDY-004 § 4 claims standard) — components render this data verbatim."
```

---

## Prompt 3 — Hero: navy band, status pills, dual CTAs

**File edited:** `components/security/SecurityPageClient.tsx` (and a new `components/security/SecurityHero.tsx`)

```
In the ARKA repo, build the hero for /security. Create components/security/SecurityHero.tsx (client component) and render it inside the #hero section of components/security/SecurityPageClient.tsx, replacing the stub.

Visual spec — match the ARKA landing aesthetic (see components/landing/Hero.tsx for tone; dark navy with teal accents):
- Full-bleed section: bg-arka-bg-dark (#0F172A) with a subtle radial teal glow (absolute positioned div, bg-arka-teal-500/10, blur-3xl, rounded-full, centered top-right) and pt-28 pb-20 (clears fixed navbar).
- Eyebrow: "TRUST CENTER · SECURITY & COMPLIANCE" — text-xs font-semibold tracking-[0.2em] text-arka-teal-300 uppercase. (Reuse components/landing/LandingEyebrow.tsx if its API fits.)
- H1: "Built for hospital security review." — text-4xl md:text-5xl font-bold text-white, max-w-3xl.
- Subhead (text-lg text-arka-text-soft max-w-2xl mt-4): "ARKA ships with the controls, documentation, and evidence trail your CISO will ask about — adopted now, before our first byte of PHI, not retrofitted after. Synthetic-data demo. Encryption everywhere. A 21-document compliance package ready for diligence."
- Status pills row (mt-8, flex flex-wrap gap-3): render STATUS_PILLS from lib/security/compliance-data. Pill = rounded-full border px-4 py-1.5 text-sm font-medium inline-flex items-center gap-2 with a 8px status dot:
  in-force → border-emerald-400/40 bg-emerald-400/10 text-emerald-300, dot bg-emerald-400
  in-progress → border-amber-400/40 bg-amber-400/10 text-amber-300, dot bg-amber-400
  roadmap → border-slate-400/40 bg-slate-400/10 text-slate-300, dot bg-slate-400
  Add aria-label on the row: "Compliance program status".
- CTA row (mt-10, flex flex-col sm:flex-row gap-4):
  Primary: <a> to CONTACTS.overviewPdf, download attribute, label "Download Data Security Overview (PDF)" with lucide Download icon — bg-arka-teal-500 hover:bg-arka-teal-400 text-arka-slate-950 font-semibold rounded-lg px-6 py-3 transition.
  Secondary: <a> href={`mailto:${CONTACTS.security}?subject=ARKA security diligence package request`} label "Request diligence package" with lucide Mail icon — border border-white/20 text-white hover:border-arka-teal-400 hover:text-arka-teal-300 rounded-lg px-6 py-3 transition.
- Fine print under CTAs (mt-6 text-sm text-arka-text-soft/70 max-w-2xl): "We describe our posture exactly as it is: HIPAA program in force; SOC 2 and HITRUST e1 in progress on a published timeline. No certification claims before the certificate exists."
- Animate the hero content with framer-motion: initial opacity-0 / y-12, animate to visible, 0.5s, stagger children 0.08s; respect prefers-reduced-motion via useReducedMotion (skip transforms when true).

Accessibility: H1 is the only h1 on the page; pills are a <ul> with <li>; icons aria-hidden. Type-safe imports from "@/lib/security/compliance-data".
```

---

## Prompt 4 — "Compliance at a glance" framework cards

**File created:** `components/security/FrameworkCards.tsx`

```
In the ARKA repo, replace the #frameworks stub in components/security/SecurityPageClient.tsx with a new components/security/FrameworkCards.tsx (client component).

Section spec — light surface, consistent with how the ROI page presents content blocks on bg-arka-bg-light:
- Section wrapper: bg-arka-bg-light (#F8FAFC) py-20.
- Header (max-w-3xl): h2 "Compliance at a glance" text-3xl font-bold text-arka-text-dark; lede text-arka-text-dark-muted mt-3: "Four frameworks, one program. Statuses below are kept deliberately exact — they update the day an artifact is issued, and never before."
- Grid: md:grid-cols-2 gap-6 mt-10. One card per FRAMEWORKS entry from lib/security/compliance-data:
  Card = bg-surface (white) rounded-2xl border border-border-subtle p-6 shadow-sm hover:shadow-md transition flex flex-col.
  Row 1: framework name (font-semibold text-arka-text-dark text-lg, pr-4) + status badge right-aligned:
    "Program in force" / "Adopted as baseline" → bg-success-bg text-success
    "In progress" → bg-warning-bg text-warning
    "Roadmap active" → bg-arka-bg-alt text-arka-text-dark-muted
    Badge: rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap self-start.
  Row 2: summary (text-sm text-arka-text-dark-muted leading-relaxed mt-3).
  Row 3: a "What this means" disclosure — native <details> styled with marker:hidden; <summary> as text-sm font-medium text-arka-teal-700 cursor-pointer inline-flex items-center gap-1 with a lucide ChevronDown that rotates when open (group-open:rotate-180). Body = detail text in text-sm text-arka-text-dark-muted mt-2.
  Row 4 (mt-auto pt-4): docRef in font-mono text-xs text-arka-text-dark-soft, prefixed with a lucide FileText icon (h-3.5 w-3.5, aria-hidden).
- Wrap the grid in the existing components/landing/SectionFade.tsx if its API accepts children (scroll-into-view fade); otherwise use a local framer-motion whileInView fade with viewport={{ once: true, margin: "-80px" }}.

No data lives in this component — it renders FRAMEWORKS verbatim. Keep headings in sentence case (ARKA voice).
```

---

## Prompt 5 — Six control pillars + hard-numbers stat band

**File created:** `components/security/ControlPillars.tsx`

```
In the ARKA repo, replace the #controls stub in components/security/SecurityPageClient.tsx with components/security/ControlPillars.tsx (client component). Two stacked sub-sections:

A) Control pillars grid
- Section: bg-surface py-20.
- Header: h2 "The controls behind the claims" text-3xl font-bold text-arka-text-dark; lede: "Every pillar below maps to an adopted policy with a document number — not a slide. Auditors get the policy; you get the summary."
- Grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10, one card per CONTROL_PILLARS entry:
  - Icon chip: h-11 w-11 rounded-xl bg-arka-teal-50 text-arka-teal-700 flex items-center justify-center; resolve the lucide icon by name via a local map { Lock, KeyRound, FileSearch, DatabaseBackup, Network, GitBranch } from "lucide-react" (import them explicitly — no dynamic import).
  - Title: font-semibold text-arka-text-dark mt-4.
  - Points: ul with space-y-2 mt-3; each li = flex gap-2 text-sm text-arka-text-dark-muted with a lucide Check (h-4 w-4 text-arka-teal-600 shrink-0 mt-0.5, aria-hidden).
  - Card: rounded-2xl border border-border-subtle p-6 bg-white hover:border-arka-teal-300 transition.

B) Hard-numbers stat band
- Full-width band directly below: bg-arka-bg-dark py-14.
- Inside max-w-6xl: grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center, one cell per HARD_NUMBERS entry:
  value in text-3xl md:text-4xl font-bold text-arka-teal-400 (use tabular-nums), label in text-xs text-arka-text-soft mt-2 leading-snug max-w-[160px] mx-auto.
- If components/landing/CountUpStat.tsx exposes a count-up animation compatible with string values like "6 yr", reuse it ONLY for the purely numeric values ("0", "21", "100%" → animate 0→21 etc.) and render the rest static; otherwise render all static. Respect prefers-reduced-motion.

Both sub-sections read exclusively from lib/security/compliance-data. Icons aria-hidden; stats live in a <dl> (dt = label, dd = value) for semantics.
```

---

## Prompt 6 — Certification timeline + document-coverage chart

**File created:** `components/security/CertificationTimeline.tsx`

```
In the ARKA repo, replace the #timeline stub in components/security/SecurityPageClient.tsx with components/security/CertificationTimeline.tsx (client component). Two visualizations side by side on lg (stacked on mobile), section bg-arka-bg-light py-20, header h2 "Where we are on the road to certification" + lede "Published timeline, no vague 'coming soon': these are the same dates in our board-approved roadmap (ARKA-RDY-004)."

A) Milestone timeline (left, lg:col-span-3 of a lg:grid-cols-5 grid)
- Vertical timeline rendered from MILESTONES: a left rail (absolute w-px bg-border-strong) with one node per milestone.
- Node disc: h-4 w-4 rounded-full border-2 —
  state "done": bg-arka-teal-500 border-arka-teal-500 with a white lucide Check at h-3 w-3
  state "active": bg-white border-arka-teal-500 with an animate-ping teal halo (disable via prefers-reduced-motion)
  state "upcoming": bg-white border-border-strong
- Each entry: quarter label (font-mono text-xs uppercase tracking-wide text-arka-teal-700), title (font-semibold text-arka-text-dark), detail (text-sm text-arka-text-dark-muted), pl-8 relative, pb-8.
- Mark the list as <ol> with aria-label "Certification milestones".

B) Document-coverage chart (right, lg:col-span-2)
- Card: bg-white rounded-2xl border border-border-subtle p-6.
- Title: "Compliance package coverage" font-semibold text-arka-text-dark; subtitle text-sm text-arka-text-dark-muted: "21 controlled documents by series".
- Recharts horizontal BarChart (use ResponsiveContainer height={260}) over data derived from DOCUMENT_LIBRARY: [{ series: "Security", count: 12 }, { series: "Readiness", count: 4 }, { series: "Privacy", count: 2 }, { series: "Governance", count: 1 }, { series: "Contracts", count: 1 }, { series: "Demo", count: 1 }] — compute counts from DOCUMENT_LIBRARY at module scope, don't hardcode.
  layout="vertical", XAxis type="number" hide, YAxis type="category" dataKey="series" width={86} tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false}, Bar dataKey="count" fill="#14B8A6" radius={[0,6,6,0]} barSize={18} with a LabelList position="right" fill="#0F172A" fontSize={12}.
  Recharts 3 is already a dependency — import from "recharts".
- Under the chart, a one-line caption text-xs text-arka-text-dark-soft: "Index: ARKA-IDX-000 · Package shared under NDA — see Documents below."
- Wrap the chart in a div with role="img" and an aria-label that states the counts in prose for screen readers; render the Recharts <Tooltip> with cursor={{ fill: "rgba(20,184,166,0.06)" }}.

Both components read from lib/security/compliance-data only.
```

---

## Prompt 7 — Document library, request CTA, no-PHI band, FAQ

**Files created:** `components/security/DocumentLibrary.tsx`, `components/security/SecurityFaq.tsx`

```
In the ARKA repo, replace the remaining three stubs (#documents, #demo-data, #faq) in components/security/SecurityPageClient.tsx.

A) components/security/DocumentLibrary.tsx → #documents
- Section bg-surface py-20. Header: h2 "The documentation, itemized" + lede: "Hospital security questionnaires go faster when the answers are already written down. Every document below is version-controlled, officer-approved, and available under NDA."
- Render DOCUMENT_LIBRARY as a responsive layout: one bordered group per series (rounded-2xl border border-border-subtle overflow-hidden mb-4). Group header row: series name font-semibold text-arka-text-dark bg-arka-bg-alt px-5 py-3 with a count chip (text-xs bg-white border border-border-subtle rounded-full px-2 py-0.5 text-arka-text-dark-muted).
- Items: divide-y divide-border-subtle; each row = flex items-baseline gap-4 px-5 py-2.5; doc number in font-mono text-xs text-arka-teal-700 w-32 shrink-0; title in text-sm text-arka-text-dark.
- Above the groups, two highlighted "get it now" cards in a md:grid-cols-2 gap-4 grid:
  1. "Data Security Overview (PDF)" — one-page summary, no NDA needed. Button → CONTACTS.overviewPdf with download attribute. lucide Download icon. bg-arka-teal-50 border border-arka-teal-200 rounded-2xl p-5.
  2. "Compliance & Regulatory Dossier (PDF)" — link to the existing asset /ARKA-Compliance-Dossier.pdf (it already exists in public/). lucide FileText icon. Same card style with bg-arka-bg-alt border-border-subtle.
- Bottom CTA strip (mt-8, rounded-2xl bg-arka-bg-dark p-8, md:flex items-center justify-between): text block — strong "Running vendor security review?" (text-white font-semibold text-lg) + "Request the full package and a completed security questionnaire seed. Typical turnaround: 2 business days." (text-arka-text-soft text-sm mt-1). Button (mt-4 md:mt-0): mailto CONTACTS.security subject "ARKA security diligence package request" — bg-arka-teal-500 hover:bg-arka-teal-400 text-arka-slate-950 font-semibold rounded-lg px-6 py-3.

B) #demo-data band (build inline in SecurityPageClient or a small component)
- Distinct attestation band: bg-arka-teal-50 border-y border-arka-teal-200 py-12.
- Layout max-w-4xl mx-auto text-center: lucide ShieldCheck h-10 w-10 text-arka-teal-600 mx-auto; h2 "Zero PHI in the demo — by design, verified quarterly" text-2xl font-bold text-arka-text-dark mt-4; paragraph text-arka-text-dark-muted mt-3: "Every patient, scenario, and record in the ARKA demonstration environment is synthetic. Seed records carry an [ARKA-DEMO] marker, fixtures come from our synthetic-data generator, CI guards block production data sources from demo code paths, and the officer-signed attestation (ARKA-DEMO-001) is re-verified every quarter. If you spot anything that looks real, tell us: security@getarka.health — it isn't, but we treat reports as incidents anyway."
- Small caption: "Last verification: June 10, 2026" in font-mono text-xs text-arka-text-dark-soft mt-4. Put the date in lib/security/compliance-data as DEMO_LAST_VERIFIED so it updates in one place.

C) components/security/SecurityFaq.tsx → #faq
- Section bg-arka-bg-light py-20, header h2 "Straight answers" + lede "The questions clinicians, CISOs, and investors actually ask — answered the way we answer them in diligence."
- Accordion over FAQ from compliance-data using the project's existing Radix primitives if present in components/ui (check for an accordion; if none, use semantic <details>/<summary> styled consistently: rounded-xl border border-border-subtle bg-white px-5 py-4 mb-3, summary font-medium text-arka-text-dark cursor-pointer list-none flex justify-between items-center with rotating ChevronDown, answer text-sm text-arka-text-dark-muted leading-relaxed pt-3).
- After the FAQ, a quiet cross-link line (text-sm text-arka-text-dark-muted mt-8): "Looking for our FDA regulatory posture (Non-Device CDS analysis, Pre-Sub package)? That lives in the {Trust Center} →" where {Trust Center} is a Next <Link> to routes.trust with text-arka-teal-700 underline-offset-4 hover:underline.

Finally, in SecurityPageClient.tsx remove all remaining placeholder <h2> stubs, confirm section order hero → frameworks → controls → timeline → documents → demo-data → faq, and ensure the sticky in-page nav targets all of them.
```

---

## Prompt 8 — Site wiring: navbar, footer, `/trust` cross-links, sitemap, OG

**Files edited:** `components/navigation/Navbar.tsx`, `components/navigation/MobileNav.tsx` (or `MobileMenuSheet.tsx`), `components/navigation/Footer.tsx`, `app/trust/page.tsx`, `app/sitemap.ts`

```
In the ARKA repo, wire the new /security page into site navigation. routes.security already exists in lib/constants.ts.

1) components/navigation/Navbar.tsx — in the desktop nav, after the existing <NavLink href={routes.roi}>…</NavLink> entry, add:
   <NavLink href={routes.security} inverted={inverted}>Security</NavLink>
   Match the exact NavLink usage pattern already in the file. Add the same entry to the mobile menu component (MobileNav.tsx / MobileMenuSheet.tsx — find where ROI / Feature Catalog links are listed and mirror it).

2) components/navigation/Footer.tsx — in the column that currently links the Trust Center (routes.trust) and Regulatory Rationale, add a link ABOVE the Trust Center entry:
   label "Security & Compliance", href routes.security, same classes as siblings (text-sm text-white/75 transition hover:text-white).

3) app/trust/page.tsx — cross-link the two trust surfaces. Near the top of the page content (immediately after the DocsPageLayout description renders, i.e., as the first child section), add a compact callout:
   a rounded-xl border border-arka-teal-300 bg-arka-teal-50 px-5 py-4 flex items-start gap-3 with a lucide ShieldCheck (text-arka-teal-600); text: "This page covers ARKA's FDA regulatory posture. For HIPAA, SOC 2, HITRUST, and data-security controls, see " + <Link href={routes.security}>Security & Compliance</Link> + "."
   Import routes from "@/lib/constants" if not already imported; keep DocsPageLayout TOC unchanged.

4) app/sitemap.ts — add to staticPages:
   { url: baseUrl + routes.security, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },

5) Open app/security/page.tsx and confirm metadata renders absolute OG correctly given the metadataBase configured in app/layout.tsx (do not redefine metadataBase). If app/layout.tsx maintains a global nav config or CommandMenu route list, add "Security & Compliance" there too following the existing pattern.

Then run: npm run type-check && npm run lint — fix anything introduced by these edits (unused imports, etc.). Do not reformat unrelated files.
```

---

## Final verification — smoke test before sharing

Run `npm run dev` and walk this list:

1. `/security` renders with **no console errors**; all seven sections present in order; sticky section nav highlights as you scroll.
2. Hero pills read exactly: *HIPAA program in force* (green) · *SOC 2 Type I/II in progress* (amber) · *HITRUST e1 roadmap* (slate). **Nowhere on the page does "certified," "attested," or "audited" appear in reference to SOC 2/HITRUST** — grep the rendered copy: `grep -ri "certified" components/security lib/security` should match only the FAQ line explaining *why* we don't say it and the prohibition language itself.
3. "Download Data Security Overview (PDF)" downloads `/docs/ARKA_Data_Security_Overview.pdf` (200, not 404). Dossier card downloads `/ARKA-Compliance-Dossier.pdf`.
4. Mailto CTAs open with subject "ARKA security diligence package request".
5. Document library shows **21** items; bar chart counts sum to 21 (Security 12, Readiness 4, Privacy 2, Governance 1, Contracts 1, Demo 1).
6. Timeline shows Q2 2026 as done (teal check), Q3 2026 pulsing as active.
7. Navbar (desktop + mobile) shows **Security**; footer compliance column links it; `/trust` shows the cross-link callout; `/security` FAQ links back to `/trust`.
8. `app/sitemap.ts` includes `/security`.
9. Lighthouse a11y pass ≥ 95 on `/security` (`npm run test:a11y` against the route): one `h1`, landmark order sane, all icons `aria-hidden`, contrast on teal badges passes (teal-700 on teal-50, white on slate-900).
10. `npm run type-check && npm run lint` clean; mobile at 375 px: pills wrap, grids collapse to one column, stat band 2-up, no horizontal scroll.

---

## Appendix A — Where the page copy comes from (provenance)

Every claim rendered on `/security` traces to an adopted document in `/compliance` (June 10, 2026 package):

| Page element | Source document |
|---|---|
| Status pills, framework cards, claims discipline | `ARKA-RDY-004` Compliance Roadmap & Certification Timeline (§ 1, § 4) |
| Control pillars: encryption, access, logging, resilience, vendors, SDLC | `ARKA-SEC-001` § 5, `ARKA-SEC-003`–`007`, `ARKA-SEC-009`–`010` |
| Hard numbers (6-yr retention, 72-h restore, 10-bd breach notice, 15-min RPO) | `ARKA-SEC-005` § 3, `ARKA-SEC-007` § 2, `ARKA-LGL-001` § 2.4 |
| Timeline milestones | `ARKA-RDY-002` § 2/§ 4, `ARKA-RDY-003` § 3, `ARKA-RDY-004` § 2 |
| Document library (21 items) | `ARKA-IDX-000` Compliance Documentation Index |
| Demo no-PHI band, quarterly verification | `ARKA-DEMO-001` § 2–6 |
| FAQ answers | `ARKA-RDY-004` § 4 (claims), `ARKA-LGL-001` (BAA), `ARKA-PRIV-002` (AI/de-id), `ARKA-SEC-009` (hosting) |

If the package changes, update `lib/security/compliance-data.ts` and this table in the same commit.
