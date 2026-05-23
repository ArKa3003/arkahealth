# ARKA-INS go-live checklist (Part F)

Run locally before release:

| # | Check | Command |
| --- | --- | --- |
| 1 | TypeScript | `npm run type-check` |
| 2 | ESLint (INS scope, errors only) | `npm run lint` |
| 3 | Vitest + ≥85% coverage on gated new `lib/` modules | `npm run test` then `npm run test:coverage` (see `vitest.config.ts` `NEW_LIB_COVERAGE_GLOBS`) |
| 4 | Lighthouse ≥90 a11y + performance on demo pages | Start `npm run dev`, then audit `/ins`, `/clin`, `/ed`, `/rural` (see below) |
| 5 | CDS-Hooks sandbox | `npm run dev` (or deploy), then `npm run test:sandbox` |
| 6 | Federated ε budget → 429 | Covered by `__tests__/federated/query-gateway.test.ts` |
| 7 | FDA disclosure on new cards | `npm run test:compliance` + CI `fda-disclosure-grep` job |
| 8 | Supabase RLS + service_role policy | `npm run test:compliance` (`supabase-rls.test.ts`) |

## Canonical FDA disclosure (grep / tests)

```
This recommendation is provided by ARKA Imaging Intelligence Engine, an FDA Non-Device Clinical Decision Support tool under the 21st Century Cures Act. The ordering clinician retains full responsibility for the final decision.
```

Source of truth: `lib/compliance/fda-disclosure.ts`. CDS card builders must use `appendFdaDetailDisclaimer` from `lib/cards/card-shared.ts`.

## CDS sandbox (`npm run test:sandbox`)

Prerequisites:

- `npm run dev` or set `CDS_SANDBOX_BASE_URL` to a deployed origin
- Supabase service role + migrations `010` + shoppable seed for scenario 2

Exercises:

- **Coverage** (`arka-ins-coverage`): scenarios 1–3 (gold, HDHP brain MRI, high denial CT)
- **Final-check** (`arka-ins-final-check`, `order-sign` hook)
- **Appointment-book** (`arka-ins-appointment`)
- **Offline cards**: STAT reclass, duplicate-order, overuse soft-block, swallow-triage (VFSS + CLIN FDA copy)

## Lighthouse (manual / scheduled)

With the dev server running:

```bash
npx lighthouse http://localhost:3000/ins --only-categories=accessibility,performance --chrome-flags='--headless' --output=json --output-path=./.lighthouse/ins.json
```

Repeat for `/clin`, `/ed`, and `/rural`. Target scores ≥ 90 for both categories on each demo page.

## CI

`.github/workflows/go-live.yml` runs type-check, lint, tests, coverage thresholds, compliance tests, FDA grep, and CDS sandbox against a production build.
