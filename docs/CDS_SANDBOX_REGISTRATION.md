# ARKA CDS Hooks Sandbox Registration

**Registered on:** 2026-05-24
**Sandbox:** https://sandbox.cds-hooks.org
**Discovery URL (preferred):** https://arkahealth.vercel.app/.well-known/cds-services
**Discovery URL (alt):** https://arkahealth.vercel.app/api/cds-services

## Services advertised
- arka-clin-appropriateness (order-select)
- arka-clin-appropriateness-sign (order-sign)
- arka-ins-coverage (order-select)
- arka-ins-final-check (order-sign)
- arka-ins-appointment (appointment-book)

## Re-registration if sandbox localStorage clears
1. Open sandbox.cds-hooks.org → gear icon → CDS Services
2. Click Add CDS Service → paste the Discovery URL above
3. Refresh; all five services appear in the "Select a Service" dropdown

## Notes
- The PAMA Imaging tab fires order-select for ARKA-CLIN.
- The sandbox does not expose an order-sign workflow for imaging orders; for order-sign evidence, see lbp-1-order-sign-local-demo screenshot (captured from /cds-hooks-demo).
- INS routes return fallback messages pending Supabase fixture seeding (deferred to post-Phase-10).
