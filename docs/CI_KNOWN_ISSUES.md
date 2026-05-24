# Known issues to fix later (do not let these slip)

## Banned-verb hits (fix in Phase 11.1)

- `lib/cards/coverage-card.ts:102` — `label: "Cancel order"` → "Review order with alternative" (or similar non-directive)
- `components/demos/clin/ClinResultsView.tsx:339` — `"Switch to this order"` → "Review this alternative order"
- `lib/demos/rural/scoring/raas-engine.ts:300` — `"Initiate transfer immediately"` → "Consider transfer; review urgency criteria"
- `docs/INS_SANDBOX_TESTING.md:69` — `"you should see"` → "you will see" (docs polish)
- `docs/ARKA-INS_Payer_Pitch.md:239` — `"economics flip immediately"` → marketing rewrite

## Coercive language in soft-block cards (fix in Phase 11.1)

- `lib/cards/overuse-soft-block-card.ts:70` — "override reason ... is required to proceed" → "if proceeding, please document the clinical reasoning"
- `lib/cards/duplicate-order-card.ts:74` — same pattern
- `lib/davinci/crd.ts:241` — "signature requires override or DTR completion" — review whether DaVinci CRD pattern is genuinely a payer workflow (acceptable) or a CDS coercion (not acceptable); decide in Phase 11

## Banner + disclosure copy mismatches (fix in Phase 11.1)

- `components/shared/compliance/FDANonDeviceBanner.tsx:64-65` — update to Phase 11.1 exact copy
- `lib/compliance/fda-disclosure.ts:5-6` — update FDA_NON_DEVICE_CDS_DISCLOSURE to Phase 11.1 exact copy; add FDA_DISCLOSURE_VERSION = '1.1.0' constant
- Duplicated disclosure to update at: `lib/coding/mnai.ts:80`, `lib/davinci/dtr.ts:34`, `components/shared/IncidentalFollowupCard.tsx:23`

## SHAP without rationale pairing (fix in Phase 6)

- `components/demos/rural/cds/DualScoreDisplay.tsx:125-177` — render `ResourceFactor.explanation` and add citation field

## Scope-boundary follow-ups (track until counsel signs off)

- `docs/SCOPE_BOUNDARY.md` Counsel sign-off section
- Phase 11.1 includes scope boundary statement in the rationale memo

## CI

- **`cds-sandbox` (ARKA go-live checks)** — Soft-failing (`continue-on-error: true`) because GitHub Actions does not supply Supabase credentials or seeded `ins_*` fixtures required by scenarios 1–2 in `scripts/test-cds-sandbox.ts`. Will be re-blocked after Phase 9 of the ARKA CDS Hooks unified playbook fixes INS sandbox fixtures in CI.
