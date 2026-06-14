# ARKA Data Strategy — MIMIC Assessment & the Open-Database Path to a Defensible Training Corpus

**Version 1.0 — June 13, 2026**
**Audience:** Founder / executive team / lead ML engineer / data-diligence reviewers
**Question answered:** (1) What is ARKA and what does it solve? (2) Is MIT's MIMIC database useful enough to train ARKA to be *better*? (3) If not — or not on its own — what open medical data *can* train ARKA into a unicorn-grade, clinician- and hospital-attractive product?

**FDA posture (binding, carried from `ARKA_UNICORN_STRATEGY_v3.md`):** Every data recommendation below is screened to keep ARKA a **Non-Device Clinical Decision Support** function under **§520(o)(1)(E)** — structured facts only, no pixel/signal analysis, no time-critical event prediction, no autonomous ordering. Nothing here requires training on medical images.

---

## 1. What ARKA is, and what it solves (grounded in this repo)

ARKA is an **evidence-based imaging-appropriateness clinical decision support engine** that fires at order-entry inside any CDS-Hooks EHR. Its defining property — the "bilateral" thesis — is that **one engine produces both the clinician's appropriateness view and the payer's denial-risk view from the same math**, so there is no inconsistency to litigate and appeal-overturn friction collapses (`lib/aiie/scoring-engine.ts` is explicitly *"the shared brain between ARKA-CLIN and ARKA-INS"*).

The product surfaces are **ARKA-CLIN** (clinician order entry), **ARKA-ED** (emergency-department mobile), **ARKA-INS** (payer / prior-auth, CMS-0057-F-ready via Da Vinci CRD/DTR/PAS), and **ARKA-RURAL**. The problems it targets, per the strategy docs:

- **Inappropriate / low-value imaging** — $12–30B/yr in the U.S., plus $3–6B/yr in incidental-finding cascades.
- **Provider–payer disagreement and prior-auth friction** — ~$40B/yr, slow approvals, denials, appeals.
- **Radiologist-shortage / throughput** pressure and wrong-modality-first ordering.

The engine today is the deterministic **AIIE v1** stack (RAND/UCLA appropriateness framing + GRADE evidence + an XGBoost regressor + SHAP-style explanations). The roadmap upgrade is **AIIE-OPTIMA**: a sequential-decision (POMDP) engine — Bayesian Value-of-Information belief kernel, Neural-ODE/SCM trajectory simulator, MCTS over imaging *pathways*, a constrained contextual bandit, an HGNN clinical-knowledge encoder, **federated learning with differential privacy**, and **doubly-robust off-policy evaluation** for continuous proof-of-value.

### The single most important fact for this report

**ARKA's model is currently trained on 100% synthetic data.** The model card (`ml-service/MODEL_CARD.md`) is explicit: *Source = "Synthetic data generated in `ml-service/model/train.py`"; Sample size = 5,000 labeled examples; PHI = None; Real-world data = Not used for initial model weights.* Its own listed limitation: *"Trained on synthetic labels, not adjudicated real-world outcomes; generalization to live EHR documentation quality is uncertain."*

That is the gap between where ARKA is and "unicorn-level." Synthetic data is fine for shipping a Non-Device demo and for CI — it is **not** what convinces a CMIO, a CQO, or a payer CMO to sign. Those buyers want evidence the engine behaves correctly on *real* patients drawn from *real* ordering populations, validated on *real* outcomes. So the right test for any database is not "is it big and famous?" but **"does it close the synthetic-to-real gap for imaging-appropriateness decisions and their downstream adjudication?"**

---

## 2. What "better" actually requires — the data ARKA needs, by component

| ARKA need | What the data must contain | Why it matters to the buyer |
|---|---|---|
| **Real ordering context** | Outpatient/ED encounters with reason-for-visit + indication + the imaging study actually ordered (modality, CPT) | Calibrate appropriateness on real indication→study patterns, not synthetic priors |
| **Payer-adjudication signal** | Claims with allowed/denied/paid status, payer, cost | The *INS* / bilateral side — denial-risk model, gold-card logic, ROI proof |
| **Longitudinal physiology / trajectory** | Vitals, labs, time-series patient evolution | Feeds the OPTIMA belief kernel + Neural-ODE/SCM simulator (D19/D20) |
| **Multi-institution diversity** | Many hospitals / payers / regions | Generalization + the federated-learning story (D21); fairness/subgroup (model card) |
| **Outcomes** | Did the study change management? downstream events? cost cascade? | Doubly-robust value proof (D22); the "we *measure* the savings" pitch |
| **Cost / out-of-pocket** | Charges, allowed amounts, payer mix, OOP | `oop-estimator.ts`, cascade-cost claims, ACO/CFO ROI |

No single open dataset supplies all six. The strategy below assembles them, and is honest about the one thing **no open dataset has**: a real-world corpus of imaging orders *labeled appropriate/inappropriate and adjudicated by a payer*. That exact asset is ARKA's intended moat (the federated, payer-adjudicated dataset "money cannot buy"), so open data's job is to **bootstrap, validate, and de-risk** — not to *be* the moat.

---

## 3. The MIMIC verdict

**Short answer: MIMIC is genuinely useful for *one* part of ARKA — and a poor fit for the core. Use it; do not build the company's training story on it.**

### What MIMIC actually is

MIMIC-IV (MIT Laboratory for Computational Physiology, on PhysioNet) is a freely accessible, de-identified EHR dataset of patients seen in the **emergency department or ICU at a single hospital — Beth Israel Deaconess Medical Center, Boston — covering 2008–2022** (~65k ICU, ~200k+ ED patients). It is modular (`hosp`, `icu`), with ICD diagnoses, procedures, medications, labs, vitals, and clinical events. Critically for ARKA, the companion **radiology module carries radiologist reports for X-ray, CT, MRI, and ultrasound with structured sections (indication/comparison/findings/impression) and a `radiology_detail` table giving a coded ontology + CPT codes per study.** There is also a dedicated **MIMIC-IV-ED** module. Access is free but **credentialed**: PhysioNet registration, human-subjects (CITI) training, and a signed data-use agreement.

### Where MIMIC helps ARKA (real value)

- **The OPTIMA trajectory simulator (D20 engine).** MIMIC's dense longitudinal physiology (labs, vitals over time) is close to ideal for fitting/validating the **Neural-ODE + Structural Causal Model** that personalizes pathway reasoning. The strategy already lists this component's evidence basis as *"MIMIC-derived + causal refs"* — so this is consistent with the existing plan, not a new bet.
- **The Bayesian belief kernel (D19).** Real indication→finding distributions and the CPT-coded radiology reports give a real-world prior/likelihood check for the belief-state and Value-of-Information math.
- **ARKA-ED specifically.** MIMIC-IV-ED is *the* matching setting for the emergency-department product — real ED imaging ordering, triage acuity, and disposition.
- **A credible "validated on real EHR data" line** for the model card and diligence, replacing the all-synthetic footing.

### Where MIMIC fails ARKA (why it is not sufficient)

- **Wrong care setting.** ARKA's primary scope (per the model card) is **elective *outpatient* imaging appropriateness**. MIMIC is **ICU + ED only** — acute/inpatient. The bulk of ARKA's economic thesis (elective MRI/CT overuse) is barely represented.
- **Single institution.** One hospital (BIDMC) cannot support the multi-institution generalization or the federated-network story; a model tuned on it will carry Boston/academic-center bias.
- **No payer adjudication.** MIMIC has *no claims, no denials, no allowed amounts, no payer*. It cannot train or validate the **INS / denial-risk / bilateral** half of ARKA at all — and that half is the differentiated, revenue-bearing one.
- **No appropriateness labels.** Nothing in MIMIC says an order was appropriate or not; you would have to *impute* labels from ACR criteria, which just re-imports your synthetic assumptions onto real records.
- **Aging, US-academic, English-only.**

**Verdict:** MIMIC is a **"yes, for the simulator and ED — necessary but not sufficient."** It moves ARKA from "100% synthetic" to "validated on real acute-care physiology," which is real progress. It does **nothing** for the outpatient-appropriateness core or the payer side, which is where the unicorn economics live. Treat MIMIC as one ingredient, not the recipe.

---

## 4. The open-database catalog — ranked by fit to ARKA

Fit score reflects alignment to ARKA's *specific* need (imaging-appropriateness + bilateral payer view + Non-Device), not general prestige. Cost/effort reflects time-to-first-use.

| # | Dataset (owner) | What it gives ARKA | Access / cost | Fit |
|---|---|---|---|---|
| 1 | **NHAMCS / NAMCS** (CDC/NCHS) | Nationally representative **ambulatory + ED visits** with reason-for-visit, diagnoses, and **imaging ordered (X-ray/CT/MRI/US)** — ARKA's exact ordering context | **Free** public-use files (SAS/Stata/R/CSV), no DUA | ★★★★★ |
| 2 | **HCUP NEDS / SEDD / SID** (AHRQ) | Largest **all-payer** ED (~30M visits/yr) + inpatient encounters; CPT/ICD procedures, **charges, payer** | Purchase via HCUP Central Distributor (~$50–$3,100/state-yr; nationwide files + online DUA training) | ★★★★☆ |
| 3 | **CMS Medicare claims** — DE-SynPUF → LDS/RIF (CMS / ResDAC) | **Payer-adjudicated claims** = the INS/bilateral side; outpatient + carrier + inpatient lines, imaging HCPCS, paid/denied | DE-SynPUF **free & open** (OMOP-ready, 1k/100k/2.3M); real LDS/RIF via ResDAC application + fee | ★★★★★ |
| 4 | **MEPS** (AHRQ) | Nationally representative **utilization + payment source + cost + out-of-pocket**, payer mix | **Free** public-use files | ★★★☆☆ |
| 5 | **MIMIC-IV / -ED / radiology** (MIT LCP) | Real ICU/ED **physiology + labs + CPT-coded radiology reports** → trajectory simulator (D20), belief kernel (D19), ARKA-ED | **Free, credentialed** (PhysioNet + CITI + DUA) | ★★★★☆ (simulator/ED) / ★★☆☆☆ (core) |
| 6 | **eICU-CRD** (Philips eICU + MIT) | **Multi-center ICU** (200k+ admissions, many U.S. hospitals) → generalization + realistic **federated-learning** substrate (D21) | **Free, credentialed** (PhysioNet) | ★★★☆☆ |
| 7 | **All of Us** (NIH) | 700k+ **diverse** participants; EHR + surveys + **claims linkage** + genomics; longitudinal | **Free, registered/credentialed**; analysis in cloud Researcher Workbench | ★★★☆☆ |
| 8 | **SEER-Medicare** (NCI + CMS) | Cancer registry **linked to Medicare claims** — imaging utilization + **outcomes + cost**, population-based | Application + fee; moving to secure enclave (~2027) | ★★★☆☆ (oncology expansion) |
| 9 | **Synthea** (MITRE) | Open **synthetic** patients in FHIR + OMOP (+ optional DICOM); unlimited, no restrictions | **Free, open**, no DUA | ★★★☆☆ (replaces/augments your in-house synth) |
| 10 | **CMS Medicare Physician & Other Practitioners + Provider Utilization** (data.cms.gov) | Open **imaging procedure volumes by provider/HCPCS/geography** | **Free, open**, no DUA | ★★★☆☆ (overuse benchmarking / GTM targeting) |

### Why each one earns its place

**1. NHAMCS / NAMCS (CDC) — the best single open fit for ARKA's *ordering* problem.** These are the national surveys of office-based (NAMCS) and hospital outpatient + emergency (NHAMCS) visits, and they record whether imaging (X-ray, CT, MRI, ultrasound) was ordered against the visit's reason and diagnoses. That is precisely the indication→study decision ARKA scores, at national scale, for free, with no DUA. Use it to (a) replace synthetic indication weights with *real* national distributions in `synthetic-data-generator.ts` and the knowledge matrix, and (b) sanity-check appropriateness rates by indication. Caveats: it is a sampled cross-sectional survey (no patient-level longitudinal follow-up, no adjudication), and **NHAMCS ended after 2022** — so it is a calibration/validation backbone, not a live feed.

**2. HCUP NEDS/SEDD/SID (AHRQ) — the all-payer ED/inpatient volume + cost backbone.** All-payer means it captures commercial, Medicaid, Medicare, and uninsured — unlike Medicare-only files — so it is the most representative open source for ED imaging utilization, charges, and payer mix. Strong for ARKA-ED economics and for national overuse/variation baselines. Caveats: administrative (no labs/vitals/notes), no appropriateness labels, modest per-state-year purchase + a short online DUA course.

**3. CMS Medicare claims (DE-SynPUF → real LDS) — the only open path to the *payer* side.** ARKA-INS/the bilateral engine needs adjudicated claims, and this is the open route. **DE-SynPUF is free, public, structured exactly like the real CMS Limited Data Sets, and ships in OMOP** — so you can build the denial-risk/gold-card pipeline on SynPUF today, then point the identical code at real Medicare LDS/RIF (via a ResDAC application) for production. This is the highest-leverage item for the differentiated half of the product. Caveats: SynPUF is itself synthetic (prototyping only); real Medicare is fee-for-service (no Medicare Advantage), and the application has cost and lead time.

**4. MEPS (AHRQ) — payer-mix, cost, and out-of-pocket truth.** Free, nationally representative expenditure data with payments split across private insurance, Medicare, Medicaid, and OOP. Directly feeds `oop-estimator.ts`, the incidental-cascade cost claims, and ACO/CFO ROI modeling. Caveat: survey-scale, so imaging cell sizes are small — use for cost/payer parameters, not order-level training.

**5. MIMIC-IV (MIT) — the simulator and ARKA-ED ingredient.** Covered in §3. The CPT-coded radiology module plus dense physiology is the right substrate for D19/D20 and for ARKA-ED, and it is already in the plan ("MIMIC-derived"). Free but credentialed.

**6. eICU-CRD (Philips/MIT) — multi-center realism + a federated sandbox.** Because it spans many U.S. hospitals, it is the open dataset best suited to (a) test that models generalize across sites and (b) prototype the **FedAvg/FedProx + differential-privacy** federated network (D21) on genuinely site-partitioned data before any real institution joins. Caveats: ICU-only, 2014–2015, lighter imaging detail than MIMIC.

**7. All of Us (NIH) — diversity, fairness, and longitudinal breadth.** 700k+ deliberately diverse participants with EHR + surveys + claims linkage. Its value to ARKA is the **fairness/subgroup story** the model card explicitly needs (age/sex/modality and beyond) and broad real-world longitudinal context. Caveats: not imaging-ordering-specific; compute is confined to the in-cloud Researcher Workbench enclave; no appropriateness labels.

**8. SEER-Medicare (NCI/CMS) — the oncology expansion + real outcomes.** Cancer registry linked to Medicare claims gives imaging utilization tied to **stage, treatment, outcomes, and cost** — exactly the "expensive medical decision against a benchmark" that the closing argument names as ARKA's $10B+ expansion beyond imaging. Caveats: cancer-only, Medicare FFS, application/fee and a 2027 enclave transition.

**9. Synthea (MITRE) — a better synthetic engine than the one you have.** ARKA already depends on synthetic data; Synthea is the open, standards-native (FHIR + OMOP, optional DICOM), unrestricted way to generate far larger, more realistic cohorts for CDS-Hooks integration testing, cold-start priors (D24), and shadow-mode load. It does not solve the real-outcome gap (still synthetic) — but it upgrades the floor and de-risks engineering.

**10. CMS Medicare Physician & Other Practitioners / Provider Utilization (data.cms.gov) — overuse benchmarking + GTM targeting.** Fully open (no DUA) imaging procedure **volumes by provider, HCPCS, and geography**. Feeds `overuse-patterns.ts` and Dartmouth-style variation analytics, and doubles as a **sales-targeting** layer (which systems over-order which studies). Caveat: aggregate, FFS-only, no patient detail.

### Honorable mentions (not open, but the real moat path)

- **Commercial multi-payer claims** — *Merative/IBM MarketScan*, *Optum Clinformatics*, *Premier Healthcare Database*. These are **payer-adjudicated across commercial + Medicare Advantage** — the closest purchasable analog to ARKA's intended dataset. Licensable (six figures), not open, but the bridge between open-data prototyping and the federated moat.
- **ACR Appropriateness Criteria** — the appropriateness *label source of truth* (a reference standard, licensable from the ACR), not a dataset. ARKA already aligns to it.
- **The now-paused CMS AUC / qualified-CDSM program (PAMA).** Worth tracking: CMS *rescinded* the AUC reporting regulation effective Jan 1, 2024 (capacity reasons) but did **not** repeal the program, and ACR urges continued CDS use. If/when a successor or gold-card regime returns, the consultation data it generates is the closest thing to a national appropriateness-label feed — and ARKA's bilateral, Non-Device posture is positioned to ride exactly that wave.

---

## 5. The honest gap — and why it is ARKA's moat, not its problem

**No open dataset contains real imaging orders labeled appropriate/inappropriate *and* adjudicated by a payer.** That asset does not exist in the public domain. Every open source above is missing at least one of {real outpatient ordering, payer adjudication, appropriateness labels, outcomes}.

This is not a flaw in the plan — it *is* the plan. The thing that makes ARKA defensible against both rule-engine incumbents and foundation-model entrants is precisely the **federated, payer-adjudicated, multi-institution outcome dataset that accumulates from live ARKA-CLIN + ARKA-INS deployments and is continuously validated by DR-OPE.** Open data cannot reproduce it, and an LLM cannot synthesize it. So the correct role of every dataset in §4 is to **bootstrap and de-risk** the engine well enough to win the first design-partner pilots — and those pilots are what generate the proprietary moat.

---

## 6. Recommended data-acquisition roadmap (tiered by leverage and effort)

**Tier 0 — Now, free, no gatekeeping (weeks).** Replace synthetic indication weights with **NHAMCS/NAMCS** real distributions; stand up the denial-risk/gold-card pipeline on **DE-SynPUF** (OMOP); upgrade the synthetic generator to **Synthea**; wire **CMS Provider Utilization** into overuse analytics + GTM targeting; pull **MEPS** cost/OOP parameters. *Outcome: every "synthetic" claim in the model card becomes "calibrated to national real-world distributions."*

**Tier 1 — This quarter, credentialed but free (1–2 months).** Complete PhysioNet/CITI credentialing; validate the **OPTIMA trajectory simulator + belief kernel on MIMIC-IV**, and ARKA-ED on **MIMIC-IV-ED**; prototype the **federated network on eICU-CRD's** multi-site partition. *Outcome: "validated on real ICU/ED physiology across multiple hospitals," plus a working federated prototype.*

**Tier 2 — Purchase / apply (1–2 quarters).** Buy **HCUP NEDS/SEDD** for all-payer ED imaging economics; apply for **Medicare LDS/RIF** via ResDAC to run the *real* payer-adjudication model; scope **SEER-Medicare** for the oncology expansion. *Outcome: real all-payer + adjudicated-claims validation — the diligence-grade evidence base.*

**Tier 3 — License + build the moat (ongoing).** License **MarketScan/Optum** for multi-payer (incl. MA) realism; license **ACR Appropriateness Criteria** as the formal label standard; then **convert pilots into the federated, payer-adjudicated proprietary corpus** that DR-OPE continuously proves. *Outcome: the dataset money can't buy — the actual unicorn moat.*

---

## 7. Bottom line

ARKA is a bilateral, Non-Device imaging-appropriateness engine whose biggest current liability is that it is **trained entirely on synthetic data.** **MIMIC alone does not fix that** — it is single-center ICU/ED with no payer or appropriateness signal, useful chiefly for the OPTIMA trajectory simulator and ARKA-ED. The way to make ARKA measurably better and credible to clinicians and hospitals is a **layered open-data corpus**: NHAMCS/NAMCS for real ordering behavior, DE-SynPUF→Medicare claims for the payer side, HCUP for all-payer ED economics, MEPS for cost, MIMIC/eICU for physiology and federation, All of Us for fairness, SEER-Medicare for the oncology expansion, Synthea to upgrade the synthetic floor — used to **bootstrap and validate** the engine into its first paid pilots, which then generate the **federated, payer-adjudicated dataset that is the only true moat.** Open data gets ARKA to credible; the proprietary federated corpus it unlocks is what gets ARKA to unicorn.

---

## Sources

- MIMIC-IV (PhysioNet v3.1): https://physionet.org/content/mimiciv/3.1/
- MIMIC-IV, *Scientific Data* (Nature): https://www.nature.com/articles/s41597-022-01899-x
- MIMIC-IV-Note (radiology reports module): https://physionet.org/content/mimic-iv-note/2.2/
- eICU Collaborative Research Database (PhysioNet): https://physionet.org/content/eicu-crd/2.0/
- eICU, *Scientific Data* (Nature): https://www.nature.com/articles/sdata2018178
- NHAMCS (CDC/NCHS): https://www.cdc.gov/nchs/nhamcs/about/index.html
- NAMCS (CDC/NCHS): https://www.cdc.gov/nchs/namcs/about/index.html
- NHAMCS datasets & documentation: https://www.cdc.gov/nchs/nhamcs/documentation/index.html
- HCUP overview (AHRQ): https://www.ahrq.gov/data/hcup/index.html
- HCUP NEDS introduction (AHRQ): https://hcup-us.ahrq.gov/db/nation/neds/NEDS_Introduction_2020.jsp
- CMS DE-SynPUF: https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-claims-synthetic-public-use-files/cms-2008-2010-data-entrepreneurs-synthetic-public-use-file-de-synpuf
- DE-SynPUF in OMOP (AWS Open Data): https://registry.opendata.aws/cmsdesynpuf-omop/
- CMS Public Use Files / ResDAC: https://resdac.org/cms-public-use-files-for-researcher-use
- MEPS (AHRQ): https://www.ahrq.gov/data/meps.html
- All of Us Research Program (data quality/utility): https://www.sciencedirect.com/science/article/pii/S2666389922001817
- All of Us EHR–claims linkage (PLOS One): https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0336967
- SEER-Medicare (NCI): https://healthcaredelivery.cancer.gov/seermedicare/
- Synthea (MITRE): https://synthetichealth.github.io/synthea/
- Synthea in OMOP (AWS Open Data): https://registry.opendata.aws/synthea-omop/
- CMS Medicare Physician & Other Practitioners: https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners
- ACR Appropriateness Criteria: https://cs.acr.org/Clinical-Resources/ACR-Appropriateness-Criteria
- CMS Appropriate Use Criteria Program (paused 2024): https://www.cms.gov/medicare/quality/appropriate-use-criteria-program
- CMS AUC program pause analysis (Reed Smith): https://www.reedsmith.com/our-insights/blogs/viewpoints/102j0h8/cms-puts-final-nail-in-the-coffin-of-medicare-advanced-diagnostic-imaging-auc-pro/

*Internal references: `ml-service/MODEL_CARD.md` (synthetic training data), `docs/ARKA_UNICORN_STRATEGY_v3.md` (bilateral thesis, AIIE-OPTIMA, "MIMIC-derived" simulator), `lib/aiie/scoring-engine.ts` (shared CLIN/INS brain).*
