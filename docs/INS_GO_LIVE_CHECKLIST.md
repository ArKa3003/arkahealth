# ARKA-INS — go-live checklist

Use this before declaring ARKA-INS production-ready for payers, investors, or regulatory demos.

## Program readiness

- [ ] All 23 prompts completed
- [ ] `npm run build` passes with zero warnings (resolve chart/layout warnings if policy requires a clean build)
- [ ] `npm run type-check` reports zero errors
- [ ] Test harness (Prompt 18) passes all 3 scenarios (`npm run test:sandbox` or documented harness)
- [ ] SMART Sandbox registration verified for the deployment URL
- [ ] 3 test orders produce expected cards in [sandbox.cds-hooks.org](https://sandbox.cds-hooks.org) (or equivalent CDS Hooks client)
- [ ] ROI dashboard displays realistic seeded metrics (`/ins/dashboard/roi` + `/api/ins/validation/metrics`)
- [ ] FDA Non-Device CDS banner on every `/ins/*` page
- [ ] Evidence Modal all 6 tabs render (`components/shared/compliance` / INS wrappers)
- [ ] Good Faith Estimate PDF/block generates correctly (`lib/ins/gfe.ts`, `/api/ins/oop/estimate`)
- [ ] Gold Card scorer handles zero-history edge case (`lib/aiie/gold-card.ts`)
- [ ] OOP estimator handles missing coverage fields (`lib/aiie/oop-estimator.ts`)
- [ ] All API p95 &lt; 800ms (measure with k6 against production; see `ins_request_logs_p95_24h`)
- [ ] No PHI in logs, no PHI in Supabase (only hashed identifiers where required)
- [ ] `DEMO_MODE` works with Supabase offline (`lib/demo/demo-mode.ts`)
- [ ] CORS configured for `sandbox.cds-hooks.org` (CDS route headers + Vercel origin policy as needed)
- [ ] CMS-0057-F ready badge in footer (`components/navigation/Footer.tsx`)
- [ ] Privacy policy and Terms of Service pages exist (`/privacy`, `/terms` — placeholders OK until legal review)
- [ ] ARKA-CLIN and ARKA-ED sections still work (no regressions; do not break `app/clin/*`, `app/ed/*` per repo rules)

## Infrastructure (Prompt 21)

- [ ] `vercel.json` deployed: CDS/INS function timeouts, regions, security headers, `/.well-known/cds-services` rewrite
- [ ] `middleware.ts`: `X-Request-ID`, rate limits, CDS POST validation, no interference with `/clin/*` `/ed/*`
- [ ] Supabase migration `012_ins_request_logs.sql` applied
- [ ] `docs/INS_DEPLOYMENT.md` reviewed for your org’s URLs and keys
