# ARKA Health, Inc. — Compliance Documentation Package

**Version 1.0 · Effective June 10, 2026 · 21 controlled documents + 1 prospect-facing one-pager**

This folder contains the complete HIPAA / SOC 2 / HITRUST documentation package for ARKA Health, Inc. Word files (`.docx`) are the editable masters for attorney review; `99_PDF_Versions/` holds identical PDF renders for distribution. The package index and reading guide is `00_Index/ARKA-IDX-000` — start there.

## Layout

| Folder | Contents |
|---|---|
| `00_Index` | ARKA-IDX-000 — master index, reading guide, status legend |
| `01_Governance` | ARKA-GOV-001 — Program Charter (officer designations, policy lifecycle) |
| `02_HIPAA_Privacy` | ARKA-PRIV-001 — HIPAA Privacy Policy · ARKA-PRIV-002 — De-Identification & Limited Data Sets |
| `03_Agreements` | ARKA-LGL-001 — Business Associate Agreement template (+ subcontractor flow-down exhibit) |
| `04_Security_Policies` | ARKA-SEC-001…012 — full Security Rule / SOC 2 policy suite |
| `05_Readiness_Assessments` | ARKA-RDY-001 (risk assessment) · 002 (SOC 2 gap) · 003 (HITRUST e1) · 004 (roadmap & claims standard) |
| `06_Prospect_Facing` | **ARKA_Data_Security_Overview.pdf** — 1-page summary, freely shareable (also at `public/docs/` for the website) |
| `07_Demo_Environment` | ARKA-DEMO-001 — Synthetic-data policy & quarterly no-PHI attestation |
| `99_PDF_Versions` | PDF renders of every document above |

## Three rules that keep this package credible

1. **Never say "certified."** HIPAA has no certification; SOC 2 and HITRUST claims wait for the issued report/assessment. The exact permitted phrasing at each stage is in ARKA-RDY-004 § 4.
2. **Attorney review before reliance.** These documents were drafted for adoption and are written to attorney standards, but they are not legal advice. Have healthcare regulatory counsel review the package — the BAA (ARKA-LGL-001) especially — before executing with a covered entity.
3. **Evidence or it didn't happen.** Each policy commits to dated artifacts (access reviews, restore tests, training records). Calendar them now; auditors ask for the trail, not the policy.

## Operational to-dos this package assumes

- Create the `privacy@getarka.health` and `security@getarka.health` aliases referenced throughout.
- Sign the adoption block in each policy (signature lines are ready).
- Execute provider BAAs (AWS / Supabase / Vercel HIPAA offerings) **before** any production PHI.
- Website build-out: run `docs/ARKA_SECURITY_PAGE_CURSOR_PROMPTS.md` in Cursor to create the `/security` trust-center page.
