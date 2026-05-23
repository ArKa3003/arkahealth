# Federated Analytics Privacy Governance

ARKA federated analytics lets a **coordinator** pose aggregate queries across imaging institutions without receiving row-level lake data. Pixel-level federated learning is out of scope; this document covers **metadata aggregates** only.

## Threat model

We assume an **honest-but-curious coordinator**: it follows the protocol but may attempt to infer institution-level contributions from messages. Institutions are trusted to execute local aggregation correctly; the coordinator never sees unmasked local sums for mean queries.

| Asset | Protection |
| --- | --- |
| Row-level lake rows | Never leave the institution; agg API returns masked partials only |
| Institution identity in means | Additive masks sum to zero before the coordinator computes the global mean |
| Counts / rates | Laplace mechanism with scale `1/ε` |
| Query patterns | Append-only `arka_lake.federated_query_log` |

## Mechanisms

- **Mean** — Additive secret-sharing: the coordinator sends each site a masked seed; each site adds its local sum/count and returns masked partials; the coordinator sums and divides. HTTP: `POST /api/federated/agg` with a signed institution JWT.
- **Count / rate** — Institutions contribute local counts (or rates); the coordinator sums and applies **Laplace noise** with scale `1/ε`.

## Epsilon budget policy

- Maximum **ε = 5 per CPT code per rolling 7-day window** (enforced in `lib/federated/epsilon-ledger.ts`).
- Every query must include `filter.cpt` for ledger accounting.
- Exceeding the budget returns **HTTP 429** with code `EPSILON_BUDGET_EXCEEDED`.

## Auditability

Every federated query is stored in **`arka_lake.federated_query_log`** with:

- `query_id`, `kind`, `column_name`, `cpt`, `epsilon`
- `institutions`, `result_value`, `noise_std_dev`, `created_at`

Retention and access follow the imaging datalake RLS model (service role for coordinator writes; no PHI in log rows).

## Configuration

| Variable | Purpose |
| --- | --- |
| `ARKA_FEDERATED_JWT_SECRET` | HS256 secret for institution agg tokens (≥ 16 chars) |
| `FEDERATED_INSTITUTION_URLS` | JSON map `institutionId → baseUrl` for production coordinator |

## Regulatory note

This scaffolding supports **governance primitives** for future cross-site analytics. Production deployment requires institutional DPAs, coordinator agreements, and formal privacy accounting beyond this document.
