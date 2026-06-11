# ARKA Platform Revamp — Release Notes (Engineering)

Release target: unified-2.0 (`data-arka-platform-version`).

## Design system

- Tailwind v4 tokens in `tailwind.config.ts`: `arka-teal` / `arka-slate` ramps, semantic `surface`/`border-*`, clinical status colors, elevation shadows, preserved `fadeIn`/`slideUp`/`pulseGlow` at 300ms default transition.
- Documented in `docs/DESIGN_SYSTEM.md`.
- Shared chrome: `SiteChrome`, `Navbar`, `PhasesMegaMenu`, `CommandMenu`, `ScrollProgressBar`, `ComplianceBar` / `PhaseComplianceBar`.
- `components/ArkaAnimatedLogo/` unchanged in this revamp (zero `git diff`).

## Phase UIs (four pillars)

| Phase | Route(s) | Implementation |
|-------|----------|----------------|
| ARKA-CLIN | `/clin`, `/clin-suite` | Cockpit demo (`ClinDemoContent`, order composer, results rail, patient context); CDS Hooks sandbox linkage |
| ARKA-ED | `/ed` | ED cockpit (`EdDemoContent`, incoming cases board, precomputed AIIE evaluations) |
| ARKA-INS | `/ins`, `/ins/dashboard`, `/ins/provider`, `/ins/reviewer` | Payer dashboard (Recharts funnel/Pareto), provider gold-card, reviewer queue/HITL |
| ARKA-RURAL | `/rural/*` | Hub map, CDS, tele, training, reimbursement, network sub-phases |

## AIIE Clinical Knowledge Matrix

Coverage report (`npm run matrix:coverage`, v1.0.0):

| Metric | Count |
|--------|------:|
| Scenarios | 36 |
| Variants | 93 |
| Ratings | 1,302 |
| Keywords | 279 |
| Evidence registry slugs | 113 |

Keyword-driven resolver sweep: 59.5% exact variant, 40.5% scenario default, 0% region/conservative fallback. Tier-3/4 share 0.0% (budget 15%) — PASS.

14 body regions populated; `whole_body` intentionally empty (0/0/0).

## Evidence system

- First-party registry: `lib/evidence/registry.ts` → static `/evidence/[slug]` (113 SSG pages).
- Index UI: `/evidence` with region grouping and client search (`EvidenceIndexClient`).
- Matrix slug parity enforced by `npm run evidence:stubs` and `__tests__/evidence-links.test.ts`.
- External citation check: `npm run evidence:check` — 74/74 URLs alive (doi.org bot-gates treated as alive).

## Epic / EHR integration

- SMART-on-FHIR launch: `/ehr/launch`, `/ehr/callback`, embedded rail `/ehr/app`.
- Sandbox fixture mode: `/ehr/sandbox` with `sandbox-fixtures/ehr/`.
- Write-back + rail telemetry: `lib/ehr/writeback.ts`, `lib/ehr/rail-telemetry.ts`, `GET /api/ehr/events`.
- CDS Hooks discovery rewrite: `/.well-known/cds-services` → `/api/cds-services` (`vercel.json`).
- Deployment notes: `docs/integrations/epic-deployment.md`, `/docs/integrations`.

## QA gates (revamp)

| Gate | Status |
|------|--------|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm test` (426 tests) | PASS |
| `npm run matrix:coverage` | PASS |
| `npm run evidence:check` | PASS (74/74; bot-gated DOIs triaged) |
| `npm run links:check` | PASS (0 broken internal hrefs) |
| `npm run lint:cards` | PASS |
| `npm run lint:regulatory` | PASS |
| FDA footer on CDS card `detail` | PASS (`lib/compliance/fda-disclosure.ts`) |
| `ins_` table prefix contract | PASS (no CLIN/ED table mutations) |
| API p95 ≤800ms (CDS timing logs) | PASS in vitest CDS e2e (max 32ms observed) |

## Performance / accessibility (local Lighthouse, production build, headless Chrome)

| Route | Performance | Accessibility |
|-------|:-----------:|:-------------:|
| `/` | 84 | 96 |
| `/clin` | 78 | 96 |
| `/ed` | 79 | 97 |
| `/ins/dashboard` | 70 | 96 |
| `/rural` | 78 | 96 |
| `/evidence/[slug]` (sample) | 89 | 96 |

Accessibility ≥90 on all audited routes. Performance on interactive demo routes remains below the 90 target on local headless runs due to shared chrome JS (Framer Motion navbar) and deferred demo bundles; evidence SSG route is at 89. Vercel edge CDN + code-splitting (`PayerDashboardCharts`, lazy phase demos) applied in this pass.
