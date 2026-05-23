# CI known issues

- **`cds-sandbox` (ARKA go-live checks)** — Soft-failing (`continue-on-error: true`) because GitHub Actions does not supply Supabase credentials or seeded `ins_*` fixtures required by scenarios 1–2 in `scripts/test-cds-sandbox.ts`. Will be re-blocked after Phase 9 of the ARKA CDS Hooks unified playbook fixes INS sandbox fixtures in CI.
