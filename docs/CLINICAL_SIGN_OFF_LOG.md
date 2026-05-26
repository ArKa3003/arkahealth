# ARKA Clinical Sign-Off Log
Each entry records a licensed clinician's review and approval of a change to ARKA's clinical content (rules, citations, feature catalogue, override reasons, card-language style guide). Append-only.

## Open TODOs (pending clinician engagement)

| Item | Owner | Notes |
|---|---|---|
| Initial feature catalogue v1 (23 entries, 6 guideline + 7 context-dependent) | TODO — pending clinician | docs/REGULATORY_BASELINE_AUDIT.md §4 + lib/cds-platform/ml/feature-catalog.ts |
| Citation library v1 (8+ entries) | TODO — pending clinician | lib/cds-platform/citations/index.ts |
| Card language style guide v1 | TODO — pending clinician | docs/CDS_CARD_LANGUAGE_STYLE_GUIDE.md |
| Override reasons (5 entries, neutral-first) | TODO — pending clinician | lib/cds-platform/alerting/override-reasons.ts |
| "context_dependent" weight rationales (7 features) | TODO — pending clinician | feature-catalog.ts entries with authorityClass = 'context_dependent' |
| ml-service MODEL_CARD intended-use language | TODO — pending clinician | ml-service/MODEL_CARD.md |

## Signed entries

| Date | Reviewer (name, credentials, license #) | Scope reviewed | Decision | Code SHA | Notes |
|---|---|---|---|---|---|
| _no entries yet — see Open TODOs above_ | | | | | |

## How to add an entry
When a licensed clinician reviews a clinical-content change, append a row above. Reviewer must include name, credentials (MD/DO/NP/PA/etc.), and active state license number. Code SHA is `git rev-parse HEAD` at the time of review. Decision is one of: Approved, Approved with comments, Returned for revision.

## Why this matters
This log is the primary evidence that ARKA's clinical content has been reviewed by a licensed clinician. Without at least one signed entry covering each open TODO above, ARKA cannot defensibly claim that its rule library and feature catalogue are clinically curated. The log is required reading for any regulatory consultant, payer credentialing review, or FDA Q-Submission.
