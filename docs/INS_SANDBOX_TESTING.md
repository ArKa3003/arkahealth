# ARKA-INS — SMART Sandbox & local CDS testing

This guide covers end-to-end validation using the public [CDS Hooks SMART Sandbox](https://sandbox.cds-hooks.org) against a deployed ARKA site, plus the local harness in `scripts/test-cds-sandbox.ts`.

## Local automated harness

From the repo root (with the Next.js app reachable and Supabase configured):

```bash
npm run dev
# another terminal
CDS_SANDBOX_BASE_URL=http://127.0.0.1:3000 npm run test:sandbox
```

The script posts three realistic `order-select` payloads to `/api/cds-services/arka-ins-coverage`, validates the JSON against CDS Hooks 2.0–shaped Zod schemas (`lib/validation/cds-hooks-response.ts`), checks scenario-specific behavior, and asserts **p95 latency &lt; 800ms** over 20 timed requests per scenario.

**Data prerequisites**

1. Apply `supabase/migrations/010_cds_sandbox_fixtures.sql` so scenario 1 has a Gold Card–eligible provider (`NPI` **1003000126**) for CPT **72148** × payer **aetna**.
2. Run `npx tsx scripts/seed-shoppable-sites.ts` (with service role env) so CPT **70553** has shoppable rows for scenario 2 (OOP + alternative site comparators).

Optional environment variables:

| Variable | Purpose |
| --- | --- |
| `CDS_SANDBOX_BASE_URL` | Base URL (default `http://127.0.0.1:3000`) |
| `ARKA_SANDBOX_GOLD_NPI` | Override Gold provider NPI (default `1003000126`) |
| `ARKA_SANDBOX_NON_GOLD_NPI` | Override non–Gold NPI (default `1003000127`; should **not** exist in `ins_providers` for scenarios 2–3) |

---

## SMART Sandbox (sandbox.cds-hooks.org) — step by step

### 1. Deploy arkahealth to Vercel

Push the repo and connect it in Vercel. Note the production URL, for example `https://arkahealth.vercel.app`.

Configure Supabase production secrets (`SUPABASE_SERVICE_ROLE_KEY`, URL, etc.) in Vercel so CDS routes can read `ins_*` tables.

### 2. Register CDS discovery

1. Open [sandbox.cds-hooks.org](https://sandbox.cds-hooks.org).
2. Go to **Settings → CDS Services**.
3. Add a service with **Discovery URL** = `https://[your-vercel-host]/api/cds-services` (no trailing slash required if the sandbox accepts either form).

### 3. Confirm four services

The sandbox fetches discovery and should list:

1. **ARKA-CLIN Imaging Appropriateness** (`order-select`, `arka-clin-appropriateness`)
2. **ARKA-INS Coverage & Cost Intelligence** (`order-select`, `arka-ins-coverage`)
3. **ARKA-INS Final Coverage Check** (`order-sign`, `arka-ins-final-check`)
4. **ARKA-INS Site Optimizer** (`appointment-book`, `arka-ins-appointment`)

### 4. Select a test patient

Choose **Daniel X. Adams** (or another patient the sandbox exposes for ordering workflows).

### 5. Orders workspace

Navigate to the **Orders** (or equivalent) workspace where `order-select` hooks fire when imaging orders are drafted or selected.

### 6. Add an imaging order

Create an order such as **MRI Lumbar Spine** with CPT **72148** so ARKA-CLIN and ARKA-INS cards can both render.

### 7. `order-select` — mixed cards

When the hook fires, you will see CDS cards from **ARKA-CLIN** and **ARKA-INS** together (different `source` labels).

### 8. DTR SMART launch

Open a card that offers **Launch DTR questionnaire (SMART)** and complete the SMART app launch flow to confirm redirect and context (`appContext`) handling.

### 9. Sign the order — `order-sign`

Sign the order so the **`order-sign`** hook invokes **ARKA-INS Final Coverage Check** (`arka-ins-final-check`). Verify final-check cards (risk band, DTR completion, override reasons as applicable).

---

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| **CORS errors** in the browser or sandbox | Confirm CDS routes send `Access-Control-Allow-Origin` and handle `OPTIONS` (see unified discovery and per-service routes under `app/api/cds-services/`). |
| **Timeouts** / 504 from Vercel | Increase or confirm `maxDuration` on CDS route handlers and Vercel function limits in `vercel.json`. |
| **Missing prefetch** / “Coverage unavailable” cards | Ensure the EHR supplies prefetch matching `COVERAGE_PREFETCH` in `lib/fhir/prefetch.ts` (`patient`, `coverage`, `serviceRequest`, `practitioner`, `insurancePlan` template). |
| **Invalid card shape** / sandbox rejects cards | Validate responses against `lib/validation/cds-hooks-response.ts` (Zod) and the CDS Hooks 2.0 card model (`summary`, `indicator`, `source`, optional `suggestions`, `links`). |

---

## Pre–investor-demo checklist

- [ ] All 3 test scenarios pass via `npm run test:sandbox` against the demo environment.
- [ ] All cards show **ARKA-INS (AIIE v2.0)** (or the ARKA-CLIN source where appropriate) in `source.label`.
- [ ] All ARKA-INS cards include the **FDA Non-Device CDS** disclaimer in `detail` (footer text referencing the 21st Century Cures Act).
- [ ] **Gold Card**, **OOP**, and **Alternative Site** cards each render at least once across the three scripted scenarios (see `scripts/test-cds-sandbox.ts`).
