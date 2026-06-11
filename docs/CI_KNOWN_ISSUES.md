# CI Known Issues

Quirks in the `ARKA go-live checks` workflow (`.github/workflows/go-live.yml`) that are
expected and intentionally non-blocking.

## `evidence-links` job — network-dependent, non-blocking by design

`npm run evidence:check` (`scripts/check-evidence-links.ts`) HTTP-HEADs every unique
external citation URL in the AIIE evidence registry (`lib/evidence/registry.ts`) and
reports dead links.

Why it is a warning job rather than a gate:

- **Network-dependent.** Results vary with publisher uptime, CDN behavior, and GitHub
  runner egress. A transient 5xx from a journal platform is not a regression in this repo.
- **Bot-gating.** doi.org resolves to journal platforms (Elsevier, Wolters Kluwer, AHA,
  Cochrane) that intermittently answer HEAD/GET from CI with 403/405/412/429. The script
  retries HEAD failures with GET and treats 403/412/429 as "alive but bot-gated", but
  heuristics cannot be perfect.
- **The blocking guarantees live elsewhere.** What must never break is enforced by
  blocking checks:
  - `npm run evidence:stubs` (quality job) fails when any Knowledge Matrix
    `evidenceSlug` is missing from the registry.
  - `__tests__/evidence-links.test.ts` (vitest, quality job) verifies every matrix slug
    resolves, every citation URL is well-formed https, and `evidenceUrl()` output matches
    `/^https?:\/\/.+\/evidence\/[a-z0-9-]+$/`.

Triage: when `evidence-links` reports a dead URL across multiple consecutive runs,
replace the citation in `lib/evidence/entries/citations.ts` with a stable equivalent
(prefer doi.org, USPSTF recommendation pages, and society guideline portals).

## `cds-sandbox` job — non-blocking pending INS fixture fix

Pre-existing INS fixture issue; re-enable as blocking after Phase 9 of
`ARKA_CDS_HOOKS_UNIFIED_PLAYBOOK.md` fixes the Supabase fixtures. Step-level
`continue-on-error` is used because job-level `continue-on-error` still renders the job
red in the GitHub UI (actions/runner#2347).
