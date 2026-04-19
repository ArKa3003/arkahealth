# ARKA-INS — deployment guide

Step-by-step reference for deploying the ARKA-INS stack (Next.js on Vercel + Supabase + SMART/CDS integrations).

## 1. Vercel environment variables

Set these in the Vercel project (**Settings → Environment Variables**), matching `.env.example` at the repo root:

| Variable | Scope | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | Canonical URL, e.g. `https://arkahealth.com` or the `*.vercel.app` URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Public anon key (browser-safe). |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview (server only) | Required for seeds, `ins_*` writes, and `ins_request_logs`. Never expose to the client. |
| `DEMO_MODE` | Optional | `true` for sandbox demos with offline fallbacks (`NEXT_PUBLIC_DEMO_MODE=true` for the watermark). |
| `NEXT_PUBLIC_DEMO_MODE` | Optional | Mirrors demo UI watermark. |

Optional (documented in code): `ARKA_FHIR_BASE_URL`, `ARKA_GFE_PROVIDER_*` for GFE copy, etc.

After changing env vars, redeploy so serverless functions pick up values.

## 2. Supabase

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies migrations under `supabase/migrations/`, including `ins_*` tables and `ins_request_logs` (API timing; no PHI).

## 3. Seed INS demo data

With `.env.local` (or Vercel env) containing valid `SUPABASE_SERVICE_ROLE_KEY`:

```bash
npm run seed:ins
```

Use `npm run reset:ins` only when you intend to wipe demo INS data (see script).

## 4. DNS (custom domain)

1. In Vercel: **Project → Settings → Domains** — add `arkahealth.com` (and `www` if needed).
2. At your DNS provider, add the records Vercel shows (typically `A`/`CNAME` to `cname.vercel-dns.com` or Vercel’s apex ALIAS).
3. Wait for SSL provisioning; keep `NEXT_PUBLIC_SITE_URL` aligned with the canonical hostname.

## 5. SMART Sandbox registration

1. Use [SMART Health IT Sandbox](https://launch.smarthealthit.org/) or your chosen FHIR sandbox.
2. Register the app with redirect URIs that match your deployment (Vercel URL or custom domain).
3. For CDS Hooks testing, point the sandbox or [sandbox.cds-hooks.org](https://sandbox.cds-hooks.org) at your discovery URL:  
   `https://<your-domain>/.well-known/cds-services` (rewrites to `/api/cds-services` per `vercel.json`).

## 6. Epic App Orchard — Nursery tier

1. Join [Epic App Orchard](https://apporchard.epic.com/) and complete publisher profile steps.
2. Subscribe to **Nursery** tier (nominal annual fee; confirm current pricing on Epic’s site).
3. Register your SMART app and CDS Hooks discovery URL for testing with Epic-compatible sandboxes.

## 7. Oracle Cerner CODE program

1. Apply to the [Cerner Open Developer Experience (CODE)](https://wiki.cerner.com/) program for sandbox FHIR credentials and app registration.
2. Use the issued client IDs and FHIR base URLs in your SMART launch tests against ARKA-INS.

## 8. HL7 FHIR Connectathons (planning)

Use official HL7 listings for current dates (they change year to year):

- **US Realm Connectathon** — often virtual; check [HL7 US Realm events](https://www.hl7.org/events/).
- **International Connectathons** — e.g. **Connectathon 42** (May 2026, Rotterdam) per [HL7 Confluence FHIR calendar](https://confluence.hl7.org/display/FHIR).
- **Working group meetings / Plenary** — sometimes include connectathon tracks; see [HL7 Events](https://www.hl7.org/events/).

Register early; CDS Hooks and Da Vinci tracks are common for payer/imaging workflows.

## 9. Post-deploy checks

- `GET /.well-known/cds-services` returns the same JSON as `GET /api/cds-services`.
- Response headers include security headers from `vercel.json` (CSP, HSTS, frame denial, referrer policy).
- `X-Request-ID` present on API responses (see root `middleware.ts`).

## 10. API timing / p95

Request durations are stored in `ins_request_logs` (hashed IP only). Query `ins_request_logs_p95_24h` for rolling p95 by path. For load testing, use k6 or similar against your deployed origin with realistic CDS payloads.
