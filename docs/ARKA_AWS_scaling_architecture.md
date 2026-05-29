# ARKA Health — Infrastructure Scaling Architecture

**From MVP to 100 Health Systems**

| | |
|---|---|
| **Version** | v1.0 |
| **Date** | May 2026 |
| **Company** | ARKA Health, Inc. |
| **Domain** | [getarka.health](https://getarka.health) |

> **Investor PDF (one US-Letter landscape page, ARKA logo):** [`pitch-artefacts/ARKA_AWS_scaling_architecture.pdf`](pitch-artefacts/ARKA_AWS_scaling_architecture.pdf)  
> **Source layout:** [`pitch-artefacts/ARKA_AWS_scaling_architecture.html`](pitch-artefacts/ARKA_AWS_scaling_architecture.html) — open in Chrome at 100% zoom, then Print → Landscape → Letter → Background graphics **On**. If content spans two pages, set print scale to **88%**.  
> **Regenerate PDF:** from `docs/pitch-artefacts/`, run `npm install puppeteer --no-save && node _print-pdf.mjs` (uses scale 0.88 for exact one-page fit).

---

## Scaling progression

| | Demo | Pilot | Scale | Enterprise |
|---|:---:|:---:|:---:|:---:|
| **Monthly cost** | $0 | $80–150 | $400–800 | $2,500–5,000 |

---

## Stage 1 — MVP TODAY

**Customers:** 0 paying customers · live demo in production

| Component | Stack |
|-----------|--------|
| Frontend | Vercel Hobby (Next.js) |
| ML | Render Free (FastAPI + XGBoost ML service) |
| Source | GitHub Free (source + CI) |
| EHR | Sandbox.cds-hooks.org (HL7 reference EHR — live) |
| Data | Synthetic ACR-aligned training data |

**Cost:** **$0/month**

*Demo-grade. Free tier. Cold starts on ML. No PHI. Investor-ready.*

---

## Stage 2 — FIRST PAID PILOT

**Customers:** 1 health system or payer · BAA executed

| Component | Stack |
|-----------|--------|
| Frontend | Vercel Pro + BAA ($20) |
| ML | AWS Lambda (Python ML inference, ~$10–30) |
| Storage | AWS S3 + KMS (encrypted PHI, ~$5–10) |
| Database | AWS RDS Postgres t4g.micro (~$15–30) |
| Observability | Sentry + AWS CloudWatch (~$25) |
| Compliance | AWS BAA signed (free) |

**Cost:** **$80–150/month**

*HIPAA-compliant. Sub-second SHAP inference. Encrypted at rest + in transit. Audit log for every decision.*

---

## Stage 3 — 10 PILOTS LIVE

**Customers:** 10 health systems · ~50K imaging orders/month

| Component | Stack |
|-----------|--------|
| Frontend | Vercel Pro ($20) |
| ML | AWS Lambda (multi-tenant inference, ~$80) |
| Database | AWS RDS Postgres Multi-AZ (~$150) |
| CDN | AWS CloudFront (CDN for sandbox + assets, ~$60) |
| Security | AWS WAF (DDoS + bot filtering, ~$30) |
| Storage | AWS S3 + KMS + lifecycle policies (~$30) |
| Monitoring | Datadog or AWS native monitoring (~$80) |

**Cost:** **$400–800/month**

*Multi-region failover. SLA-grade uptime. Compliance audit-ready. Per-tenant data isolation.*

---

## Stage 4 — 100 HEALTH SYSTEMS

**Customers:** 100+ enterprise customers · 16M+ orders/month

| Component | Stack |
|-----------|--------|
| Frontend | Vercel Enterprise ($200) |
| ML | AWS ECS Fargate (containerized ML, ~$500) |
| Database | AWS RDS Aurora Postgres Global ($700) |
| CDN | AWS CloudFront global edge ($300) |
| Security | AWS WAF + Shield Advanced ($150) |
| MLOps | AWS SageMaker (model versioning + monitoring, $400) |
| FHIR | AWS HealthLake (optional FHIR ingestion, $400) |
| Observability | Full observability stack ($350) |

**Cost:** **$2,500–5,000/month**

*Enterprise-grade. Multi-region active-active. Continuous ML retraining. Real-time fairness monitoring. FHIR R4 ingestion at scale.*

---

## Unit Economics at Scale

| Metric | Value |
|--------|------:|
| Infrastructure cost per imaging order at 100-system scale | **$0.0003** |
| Value created per averted inappropriate imaging order | **$1,180** |
| Ratio of value created to infrastructure cost | **~4M×** |

*Cost projections assume mid-sized health system orders (~50K imaging studies/month). Lambda + RDS Aurora pricing per AWS public pricing as of May 2026. Value per averted order is the ACR Appropriateness Criteria-derived savings demonstrated in the ARKA-CLIN production demo at getarka.health/cds-hooks-demo.*

---

*ARKA Health, Inc. · Delaware C-Corp · Clinical decision support for medical imaging · HL7 CDS Hooks · FDA Non-Device CDS*
