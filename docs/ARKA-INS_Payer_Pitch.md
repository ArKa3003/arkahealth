# ARKA-INS for Insurance Providers

### How Payers, Medicare Advantage Plans, Medicaid MCOs, Tricare Carriers, and RBMs Are Losing Money on Medical Imaging — and How ARKA Recovers It

**A profit-first pitch document for commercial payers, government-program plans, and Radiology Benefit Managers.**

*Version 1.0 · May 2026 · Prepared by ARKA Health · CONFIDENTIAL*

---

## Table of Contents

1. Executive summary — the loss is bigger than the line item suggests
2. How payers actually lose money on medical imaging (six bleed points)
3. What ARKA-INS is, in one page, in payer terms
4. The unit economics — the line-by-line ROI model
5. Per-segment value cases
   - 5.1 Commercial national carriers (Aetna, BCBS plans, Cigna, Humana, UnitedHealthcare, Molina)
   - 5.2 Medicare Advantage plans
   - 5.3 Medicaid MCOs and CHIP
   - 5.4 Tricare and federal carriers
   - 5.5 Radiology Benefit Managers (Evicore/Evernorth, Carelon MBM, Cohere Health, NIA)
6. Why now — CMS-0057-F is a January 2027 forcing function, not a memo
7. Competitive moat — why payers cannot just build this internally
8. Pricing — three commercial models, all gross-margin accretive to the buyer
9. Pilot plan — what the first 90 days look like
10. Appendix A — full ROI assumptions table
11. Appendix B — sources

---

## 1. Executive summary — the loss is bigger than the line item suggests

Insurance providers usually talk about imaging spend in one line: claims paid for CT, MRI, PET, ultrasound, X-ray, and nuclear medicine. In 2024 that line was roughly **$140–$150 billion** of paid medical claims in the United States across all payers. That is the visible spend.

The invisible spend is larger. Under that one line sits a tangle of administrative cost, leakage, and downstream cascade that every health plan finance team knows about but no single business unit owns. Stack it up:

| Bleed point | Conservative annual cost, U.S. payers in aggregate |
|---|---|
| Prior-authorization administrative overhead (payer + RBM staffing, IT, appeals) | **~$13B** (CAQH 2024 index) |
| Inappropriate/low-value imaging paid as claims | **~$12–15B/yr** (peer-reviewed; AMA, ACR data) |
| Site-of-service leakage (hospital outpatient vs. freestanding for identical CPTs) | **~$10–15B addressable** (70–208% HOPD-vs-freestanding price spread) |
| Downstream cascade from incidental findings on low-value studies | **~$3–6B/yr** (Yale GHR, JAMA Network Open) |
| Appeal-overturn losses — denials that were wrong and got reversed | **~$1.5–2B/yr just in Medicare Advantage** at 80.7% overturn rate (KFF 2024) |
| Improper payments / FWA on imaging not requiring PA today | **$273M recovered, $353M identified annually** in Medicare alone (RAC FY2023) |

Add it up: a national commercial carrier with roughly **12 million covered lives** is exposed to **$220–$350M per year** of avoidable imaging-related cost it is *already* paying for, on top of its actual claims spend. A regional plan with **1 million lives** sees **$18–30M per year** of the same.

ARKA-INS is a Da Vinci CRD/DTR/PAS-compliant intelligence layer that sits inside this gap. It does five things at the same moment of order entry that no current RBM stack does together:

1. Decides if the order even needs a PA (Gold Card eligibility, scored forward, not retrospectively).
2. Auto-approves the 35–40% of orders that are unambiguously appropriate.
3. Prices the patient's out-of-pocket and routes them to the **payer's** cheaper in-network site before the order is signed.
4. Generates a pre-filled FHIR Questionnaire (DTR) so the provider's documentation comes back complete the first time — collapsing rework and appeal volume.
5. Returns a real-time PAS decision with **specific, AIIE-cited denial reasons** that survive appeal.

The result: **lower MLR on the imaging line, lower admin (G&A) on PA processing, lower appeal overturn rate (which is a direct dollar transfer in CMS-0057-F's specific-denial regime), and a member experience that helps STAR ratings and retention**. Below, we walk through each lever with full assumptions.

---

## 2. How payers actually lose money on medical imaging — the six bleed points

### Bleed Point #1 — PA processing is a cost center, not a savings center, for most plans

The Council for Affordable Quality Healthcare (CAQH) 2024 Index puts the U.S. industry at **>$13B annually** on PA processes. For a payer, fully-loaded cost per PA transaction averages **$6** when partially automated and **$11** when manual; only **$1.88** when fully electronic per CAQH benchmarks. A typical commercial plan generates **15–25 imaging PAs per 1,000 members per year** — meaning a **1M-life plan files 15,000–25,000 imaging PAs/year** before counting denials, appeals, and overturns.

The bleed: most plans pay the $6–$11/PA cost on **all** orders, including the 35–40% that are clinically unambiguous and could be auto-approved at near-zero marginal cost. That is **$2.1M to $4.4M per year in pure waste on a 1M-life plan**, paid by the payer's G&A.

### Bleed Point #2 — Appeals are a tax you pay on every wrong denial

KFF reported in January 2026 that **Medicare Advantage insurers made nearly 53 million PA determinations in 2024**, that **roughly 6.4% (~3.4M) were denied at first pass**, that only **11.5% of denials were appealed**, and — critically — that **80.7% of appeals were overturned**. The overturn-on-appeal rate has been >80% every year examined.

What that means in dollars:
- Industry cost per appeal is conservatively **$25–$43 per appeal** in administrative cost on the payer side (MGMA, AMA, AHIP data), often higher on the provider side.
- For every appeal overturned, the original denial was, by definition, **wrong**: the care was deemed necessary anyway. CMS-0057-F now requires **specific denial reasons** (not boilerplate), which means the payer is legally exposed if their denial reasoning cannot survive a specific challenge.
- **Tactical loss:** every overturn is a small judgment against the plan's clinical defensibility, and feeds the AMA, KFF, and state-AG narrative that drives the next round of regulation.

A national MA plan denying 800,000 imaging PAs/year, with 11.5% appealed and 80.7% overturned, is **shipping ~74,000 wrong decisions out the door every year** that then get reversed at higher cost. Each one is a member complaint, a STAR-rating hit, and a regulatory artifact.

### Bleed Point #3 — Site-of-service leakage is the largest single line of avoidable claims

This is the bleed everyone underweights. The same CPT code, same imaging study, ordered for the same patient on the same day, can cost the plan **70% to 208% more** if performed in a hospital outpatient department (HOPD) than in a freestanding imaging center (HFMA, NIHCR analyses).

Concrete numbers:
- **Knee MRI (CPT 73721):** ~$900 in HOPD vs. ~$600 in freestanding (~33% lower).
- **Brain MRI w/ contrast (CPT 70553):** routinely $1,200–$3,500 in HOPD; $400–$900 cash at freestanding; payer-negotiated freestanding often $500–$750.
- **Abdominal CT (CPT 74176):** $1,800–$3,000 HOPD vs. $400–$700 freestanding.

Most commercial plans have a site-of-service policy on paper. In practice, **the policy fires only at claim adjudication, not at order entry**, so the choice has already been made. By the time the claim arrives, the plan can either pay the HOPD rate or initiate a clawback fight. Most pay.

The addressable savings: a 1M-life commercial plan running ~80,000 advanced imaging studies/year (CT/MRI/PET combined, conservative) with 25% currently going to HOPDs that have a cheaper in-network freestanding alternative within 15 miles, at an average $700 delta per study, leaks **$14M per year**.

### Bleed Point #4 — Inappropriate and low-value imaging is paid claims, not avoided claims

The literature is unambiguous. Peer-reviewed sources (Choosing Wisely, ACR, Health Affairs) put inappropriate imaging at **30–35% of all studies**, with another **15–20% redundant within 90 days**. Medicare alone spends **~$3.6B per year on 47 documented low-value services across 2.6M cases** (top 20 = 95% of low-value spend), with patients paying another **$800M out of pocket** on top (RadiologyBusiness, 2024).

Most RBMs catch some of this through retrospective utilization review. Catching it pre-order — at the moment a provider drops "MRI lumbar spine for chronic low back pain, no red flags, < 6 weeks since onset" into the EHR — is a different problem, and it is the one ARKA solves with the AIIE engine inverted onto the payer side.

Why this matters financially: **avoided claims drop straight through to MLR**. There is no friction, no clawback, no member complaint. The order simply does not happen, because the provider was shown a more appropriate alternative at the moment they were ordering.

### Bleed Point #5 — Incidental findings cascade is the silent multiplier

This is the bleed that is invisible until someone graphs it. **15–30% of all advanced imaging studies turn up an incidental finding**. Most are clinically irrelevant. But each one drives, on average, **$460–$2,155 in downstream follow-up costs** — repeat imaging, biopsies, specialist visits, consults that mostly conclude with "benign" or "no change" (PubMed 30300007; JAMA Network Open).

Every inappropriate imaging study a payer pays for is therefore not a single claim — it is a claim with a **20% probability of triggering a $1,000+ cascade**. A 1M-life plan paying for 28,000 inappropriate advanced studies a year is therefore looking at **$5.6M–$12M of cascade cost** layered on top of the inappropriate studies themselves.

### Bleed Point #6 — FWA and improper payments on imaging not requiring PA

This is small in absolute terms but politically important. CMS's Recovery Audit Contractor program **identified $353M and recovered $273M in improper payments in FY 2023** — and CMS's new **WISeR Model** (launching January 2025 across six states) is explicitly **using technology-enabled prior authorization and pre-payment review** on imaging services that historically did not require PA: image-guided spine decompression, epidural steroid injections, percutaneous vertebral augmentation, and similar.

WISeR is the regulator's signal to commercial plans: **pre-payment intelligence will become the default**. Plans that have not implemented a real-time evidence-driven decision layer on imaging will spend the next decade either over-paying or fighting clawbacks.

---

## 3. What ARKA-INS is, in one page, in payer terms

ARKA-INS is a **payer-side intelligence layer** that plugs into the same CDS Hooks / SMART-on-FHIR infrastructure your network's EHRs (Epic, Cerner/Oracle, athenahealth, eClinicalWorks) already speak. It is implemented to the **HL7 Da Vinci CRD/DTR/PAS Implementation Guides**, which are the standards CMS-0057-F effectively requires by **January 1, 2027** for Medicare Advantage, Medicaid MCOs, CHIP MCOs, and QHPs on the FFM.

At the moment a provider drops an imaging order into the EHR, ARKA-INS does five things in under 800ms:

1. **CRD card #1 — Gold Card auto-approve.** Computes the ordering provider's forward-looking approval rate for this CPT × payer combination from the trailing 24-month PA history (Wilson lower-bound, n ≥ 20). If the provider is gold-carded, the card auto-approves the order with a single click and the PA is never created. (Industry standard: gold card requires ≥92% approval over two consecutive years per UnitedHealthcare's 2024 national program. ARKA's scoring is the same logic, surfaced forward instead of mailed retroactively six months later.)

2. **CRD card #2 — Coverage + denial risk.** AIIE scores the order on the RAND/UCLA Appropriateness 1–9 scale using SHAP-explained factors. Score is inverted to denial risk. Card shows top 3 positive and top 3 negative factors with peer-reviewed citations. Routes to AUTO_APPROVE / LIKELY_APPROVE / CLINICAL_REVIEW / LIKELY_DENY.

3. **CRD card #3 — OOP cost + cheaper in-network site.** Pulls the patient's Coverage resource (plan, deductible remaining, coinsurance). Estimates patient responsibility. If patient is in an HDHP (~50% of commercially insured Americans), surfaces the cheapest in-network site within radius from the payer's machine-readable file and from public cash-pay databases. Includes a No Surprises Act-compliant Good Faith Estimate block.

4. **DTR — Pre-filled FHIR Questionnaire.** For any factor that lowered the appropriateness score, AIIE generates a Questionnaire item asking the provider to confirm or document it. The form auto-populates from the EHR prefetch. The provider fills the gap, signs the order, and the documentation packet is complete the first time.

5. **PAS — Real-time decision.** When the PA submits, ARKA-INS wraps it as a FHIR Claim under the Da Vinci PAS profile (X12 278 semantics in FHIR), returns approved/pended/denied with specific reason codes tied to AIIE factors, sets the **appeal deadline at 180 days per CMS-0057-F**, and stores the audit trail.

**FDA status:** ARKA-INS is a **Non-Device Clinical Decision Support** tool under Section 520(o)(1)(E) of the FD&C Act (21st Century Cures Act). It supports decisions; the licensed clinician retains decisional authority. Every card carries the disclaimer. SHAP explanations and policy citations satisfy the independent-review criterion.

**Behavioral note:** ARKA-INS uses loss-framed messaging on cost cards ("This patient would pay $1,847 more here than at Alternative B") because the literature shows loss framing outperforms gain framing 2:1. We do not interrupt with critical-indicator cards unless patient safety is at stake (contrast contraindication, etc.). The interface is non-modal; everything is in-flow.

---

## 4. The unit economics — the line-by-line ROI model

### 4.1 Per-1,000-lives annual savings model (conservative)

Below is the conservative model. Aggressive case is roughly 1.5× this. Every assumption is sourced in Appendix A.

| Line | Mechanism | Assumption | Per 1,000 lives, annual |
|---|---|---|---|
| **A** | Imaging PAs filed per 1k lives | 20 PAs/1k lives/year | 20 |
| **B** | PA admin cost saved by auto-approving 38% via Gold Card + CRD | 38% × 20 × ($6 avg → $1.88 electronic) | **$31** |
| **C** | Appeal volume reduction (denial specificity + DTR pre-fill) | 25% reduction × 6.4% denial × 11.5% appeal × $43/appeal × 20 | **$15** |
| **D** | Appeal-overturn loss reduction (specific reasons survive challenge) | 30% reduction of $200 avg overturn cost × overturned appeals/1k | **$28** |
| **E** | Inappropriate-imaging avoidance (AIIE pre-order block) | 35% inappropriate × 60% capture × 45% reduction × $800 avg study cost × 20 imaging orders/1k | **$1,512** |
| **F** | Site-of-service leakage capture (cheaper-site routing) | 80 advanced imaging/1k × 25% reroutable × $700 delta | **$14,000** |
| **G** | Cascade-cost avoidance (incidental findings on avoided studies) | Inappropriate studies avoided × 20% cascade rate × $1,000 avg cascade | **$76** |
| **H** | FWA / improper-payment reduction (pre-pay AIIE flagging) | $5/1k lives benchmarked to RAC recoveries on imaging | **$5** |
| **TOTAL GROSS SAVINGS / 1,000 LIVES / YEAR** | | | **~$15,667** |
| **Minus ARKA-INS PMPM fee** (see §8) | $0.40 PMPM = $4.80 PMPY × 1,000 | | **−$4,800** |
| **NET SAVINGS / 1,000 LIVES / YEAR** | | | **~$10,867** |

**That nets to roughly $10.87 per member per year, $0.91 PMPM, against a $0.40 PMPM software fee — a 2.3× net ROI in year one before factoring soft savings (STAR ratings, member satisfaction, denial-narrative compliance).**

### 4.2 Scaling — what that means for each payer segment

| Payer | Covered lives (approx.) | Net annual savings, year 1 (conservative) | Net annual savings, year 1 (aggressive 1.5×) |
|---|---|---|---|
| UnitedHealthcare commercial + MA | ~50M | $543M | $815M |
| Anthem / Elevance (BCBS-affiliated) | ~47M | $511M | $766M |
| Aetna (CVS Health) | ~25M | $272M | $408M |
| Cigna (Evernorth ex-Evicore) | ~20M | $217M | $326M |
| Humana commercial + MA | ~17M | $185M | $277M |
| Molina (Medicaid heavy) | ~5M | $54M | $81M |
| Mid-sized regional BCBS | ~3M | $33M | $49M |
| Tricare (MHS Genesis, regional carriers) | ~9.6M | $104M | $156M |
| Mid-tier Medicare Advantage plan | ~500k | $5.4M | $8.2M |
| Medicaid MCO | ~1M | $10.9M | $16.3M |
| RBM (per 10M lives under management) | ~10M | $109M | $163M |

**Key dynamic on bleed-point #6:** site-of-service is the largest single contributor (~89% of the gross savings number in §4.1) because the HOPD/freestanding price delta is the biggest single dollar lever in commercial imaging today. If a plan already has a tight site-of-service program (e.g. UHC's site-of-care policy on MRI/CT), the **savings line F is smaller, but lines B, C, D, E, G, H are still net additive** — ARKA-INS is not a substitute for site-of-service, it is the only tool that **enforces it at the moment of order entry** instead of at claim adjudication.

### 4.3 What payers can do with the money

This is the part most pitches skip. For an MA plan with **89% MLR and 11% admin/profit**, every **$10M of avoided medical cost on imaging**:

- **Drops ~$1.1M straight to operating income** if the plan keeps the bid the same.
- **Or funds richer benefits in next year's bid** (~$11M of supplemental benefits at the MLR ratio), which is a STAR-rating and retention lever.
- **Or both, in proportions the plan controls**.

For a commercial fully-insured book at **85% MLR**, the leverage is even higher — $10M of avoided medical cost = $1.5M operating margin. For a Medicaid MCO running at **88–92% MLR** with state minimum-MLR rebate exposure, every avoided dollar reduces rebate liability and accretes to ROC.

---

## 5. Per-segment value cases

### 5.1 Commercial national carriers — Aetna, BCBS plans, Cigna, Humana, UnitedHealthcare, Molina

**The pain:** Carriers are watching MLR creep up — KFF reported 89.2% MLR in MA in 2024, vs. 85.9% in 2023, the largest single-year increase since the pandemic. Site-of-service leakage and PA admin overhead are the two largest controllable medical-cost lines after pharmacy. Member complaints on PA are at all-time highs and feed political/regulatory pressure.

**Why ARKA-INS sells here:**
- **MLR move:** $0.50–$1.20 PMPM of avoided medical cost on the imaging line is achievable in year 1; that is a 30–80 bps MLR improvement on a high-utilization book.
- **Admin cost move:** auto-approving 35–40% of imaging PAs collapses PA staffing requirements proportionally; for a national carrier processing 8–10M imaging PAs/year, that is **3–4M PAs no longer needing human touch**, or roughly **800–1,200 FTEs of nurse-reviewer capacity freed**.
- **Compliance move:** CMS-0057-F's specific-denial requirement and 72h/24h SLA are existential for any plan with an MA or QHP line. ARKA-INS is **the cheapest path to compliance** because the same engine that scores the order produces the specific reason code.
- **Network move:** integrating ARKA-INS gives the carrier a **provider-friendly story** ("your gold-card eligibility is now real-time and forward-looking") that they can use in network negotiations against UnitedHealthcare's Gold Card program (which is currently retrospective and opaque per AAFP/ACP coverage).
- **Member move:** loss-framed OOP cards and cheaper-site routing turn the EHR into a member-experience surface the carrier never previously controlled. Direct line to NPS and STAR.

**Counter-positioning:** Aetna and Cigna both have RBM relationships (Aetna with eviCore historically; Cigna **owns** eviCore via Evernorth). ARKA-INS is positioned as a **layer on top of the RBM**, not a replacement — it makes the existing RBM contract dramatically more efficient because it pre-screens orders at the EHR before they hit the RBM queue. The RBM bills less per case but processes higher-value cases. The payer wins on both ends.

### 5.2 Medicare Advantage plans

**The pain:** KFF January 2026 report: **53M PA determinations in MA in 2024**, **6.4% denied**, **only 11.5% appealed**, **80.7% of those appeals overturned**. Medicare Rights Center documented denials rising before CMS-0057-F enforcement begins. CMS public reporting of PA metrics begins **2026** — the data will be published, plan by plan.

**Why ARKA-INS sells here:**
- **CMS-0057-F compliance baked in:** 72-hour standard / 24-hour expedited SLAs, specific denial reasons, Provider Access API, FHIR-based PA API — all are native primitives of the ARKA-INS architecture, not bolted on.
- **STAR rating defense:** PA-related complaints feed Part C C04 (Members Choosing to Leave) and C03 (Complaints) measures. Plans with high overturn rates and high member complaint rates lose STAR points; STARs translate to **billions in quality bonus payments**. A single STAR point on a 500k-member MA plan is worth $80–$120M/year.
- **Bid economics:** lower imaging trend = lower bid = more competitive premium or richer benefits. ARKA-INS delivers measurable downward pressure on the imaging trend line that the actuarial cert can use.
- **WISeR alignment:** CMS's WISeR Model (Jan 2025, 6 states) is the regulator beta of pre-payment AI-enabled review on imaging. ARKA-INS is, structurally, what WISeR is testing — but commercially deployable and Da Vinci-compliant. MA plans that already have WISeR-aligned tooling in production will look prepared when CMS expands the model.

### 5.3 Medicaid MCOs and CHIP

**The pain:** Medicaid MCOs run at **88–92% MLR** with state minimum-MLR rebate exposure (typically 85%, varies by state). Margins are thin. PA staffing is expensive relative to per-member revenue. Member churn is high; care continuity is difficult; imaging access for rural members is a quality measure.

**Why ARKA-INS sells here:**
- **Every avoided inappropriate study is a direct rebate-pool deduction or operating margin add.** Medicaid MCOs cannot bid their way out of waste the way MA plans can — they have to operate it out.
- **Equity story:** Medicaid populations get more imaging at HOPDs because freestanding centers cluster in higher-income ZIP codes. ARKA-INS's cheapest-in-network routing improves access *and* reduces cost simultaneously, which is the rare two-fer that survives both finance and equity reviews.
- **State integrity reporting:** State Medicaid integrity programs (especially in TX, FL, CA, NY) are increasing audit pressure on imaging utilization. A pre-payment AIIE layer with audit trails to every decision is the cheapest defense.

### 5.4 Tricare and federal carriers

**The pain:** Tricare manages ~9.6M lives across active-duty, retiree, and family populations through regional carriers (Humana Government Business, TriWest). MHS Genesis (Cerner) is the underlying EHR. Cost pressure from DoD/DHA is rising; PA workflow is heavily manual.

**Why ARKA-INS sells here:**
- **MHS Genesis is Cerner/Oracle Health — natively CDS-Hooks-capable.** ARKA-INS deploys via the same `/api/cds-services` discovery endpoint Cerner uses in the App Gallery/CODE program.
- **Federal procurement track:** Non-Device CDS status under the Cures Act keeps the procurement track at GSA schedule speed (months) rather than 510(k) speed (years).
- **Mission alignment:** military medicine has a unique pattern of high-mobility members and frequent care transitions, which makes duplicate imaging unusually prevalent. ARKA-INS's redundancy detection pays disproportionately well in this population.

### 5.5 Radiology Benefit Managers — Evicore (Evernorth/Cigna), Carelon MBM (Elevance), Cohere Health, NIA

**The pain:** RBMs are stuck in a value-trap. They are paid per case but their cost-per-case is rising as the clinical workflows get more complex and the regulatory bar (CMS-0057-F) gets higher. Their margin is squeezed from below (rising labor cost, FHIR/CDS Hooks investment) and above (payer customers wanting per-PA pricing cuts).

EviCore generates ~$2.1B in annual revenue but is structurally a labor-intensive business. Carelon MBM is large but bound to Elevance. Cohere Health is the well-funded new entrant ($98M Series C, late 2024) competing on UX.

**Why ARKA-INS sells here:**
- **RBMs are the highest-velocity ARKA customer.** The economics flip immediately: a $0.40 PMPM SaaS fee on the RBM's covered-lives book is materially less than the FTE labor cost saved on 35–40% auto-approval.
- **No customer-relationship displacement:** ARKA-INS does not displace the RBM's relationship with its payer customer. It augments it. The RBM keeps the payer contract; ARKA-INS makes the RBM's per-case margin higher.
- **CMS-0057-F is a contract trigger:** every MA/Medicaid/QHP contract the RBM holds gets re-papered on the Jan 1, 2027 mandate. RBMs that show up to the renegotiation with a Da Vinci CRD/DTR/PAS stack ready in production will renew at favorable terms; those that don't will be price-pressured by a payer that can credibly threaten to build internally.
- **Specifically for Evicore/Evernorth:** Cigna's owned ecosystem makes them the most natural early ARKA-INS partner because the AIIE engine is the same one Cigna's clinical partnerships team is already evaluating for benefit-design purposes.
- **Specifically for Cohere Health:** their differentiation is UX-led. ARKA-INS is the only Da Vinci-native engine with SHAP-explained reasoning, which closes the explainability gap Cohere currently fills with manual review. Cohere is either an acquirer or an OEM customer.

---

## 6. Why now — CMS-0057-F is a January 2027 forcing function, not a memo

The CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F), finalized January 17, 2024, applies to Medicare Advantage, Medicaid managed care, CHIP managed care, and QHPs on the FFM. CMS estimates **$15B in net savings over 10 years** from compliance. The dates:

- **January 1, 2026** — operational PA process changes (decision timeframes: 72h standard, 24h expedited; specific denial reasons; public reporting of PA metrics).
- **January 1, 2027** — Patient Access API, Provider Access API, Payer-to-Payer API, **and the Prior Authorization API (the FHIR-native PA endpoint)**.

The PA API is the one that matters here. It is, by construction, what the HL7 Da Vinci PAS Implementation Guide describes. The plans that do not have a working FHIR PAS endpoint on January 1, 2027 are in non-compliance, and CMS has reserved enforcement authority under 42 CFR §422.

**ARKA-INS ships that endpoint in production today.** Every code path — discovery → CRD → DTR → PAS → audit log — already exists in the codebase (see `/api/cds-services/`, `/api/ins/pas/submit`, `/api/ins/dtr/questionnaire`, plus the `ins_validation_events` and `ins_request_logs` Supabase tables for measurement and compliance evidence).

A payer that buys ARKA-INS in 2026 is buying a **drop-in compliance package** that also produces ROI. A payer that builds it in-house is buying a **2-year engineering project** that consumes 8–15 FTEs of senior FHIR/CDS Hooks engineering plus an ML team for AIIE. The cost differential is in eight figures.

---

## 7. Competitive moat — why payers cannot just build this internally

Three things make ARKA-INS hard to replicate inside a payer or RBM org:

1. **AIIE is a shared engine, not a payer engine.** AIIE is also the brain of ARKA-CLIN, which runs at the provider side at order entry. The same evidence framework (RAND/UCLA Appropriateness + GRADE + SHAP-explained XGBoost) produces both the clinical score and the inverted denial-risk score. This means a payer using ARKA-INS is, by definition, **using the same reasoning the ordering provider is seeing** on the other side of the workflow. That alignment collapses appeal-overturn rates because there is **no inconsistency to litigate**. No internal payer build can replicate this without also being the provider-side CDS vendor — a market position only ARKA Health currently occupies.

2. **The OOP/cheapest-site engine is a regulated data product.** The Transparency in Coverage rule, the Hospital Price Transparency rule, and No Surprises Act all produced public data assets that almost no payer has fully operationalized. ARKA-INS ingests the payer's own machine-readable files **plus** public cash-pay databases (Green Imaging, RadiologyAssist, Touchstone, CMS HPT aggregators) and produces a single ranked alternative-site list at the moment of order entry. Replicating this is a multi-terabyte ETL problem that no payer's existing analytics team is currently staffed for.

3. **FDA Non-Device CDS posture.** Section 520(o)(1)(E) compliance is documentable, but the four-criteria audit trail (no signal processing, peer-reviewed source basis, recommendation-not-directive language, independent-review explanations) has to be designed in from day one. ARKA-INS was. A payer's internal build, almost by default, will trip Criterion 4 because internal payer tools rarely surface their reasoning to the clinician. ARKA-INS's SHAP waterfall is the audit trail.

---

## 8. Pricing — three commercial models, all gross-margin accretive to the buyer

ARKA-INS is sold on whichever of the three the customer prefers. The contracts are designed so that the customer's net of fee is always positive within twelve months.

### 8.1 PMPM SaaS (recommended for plans)

- **$0.30–$0.50 PMPM**, three-year term, volume tiers.
- Includes: full CRD/DTR/PAS implementation, AIIE engine, OOP/shoppable-site routing, reviewer dashboard, ROI dashboard, all CMS-0057-F APIs.
- Excludes: customer-specific X12 278 EDI integration to Availity/Change Healthcare (one-time $50–$150k SI engagement).
- At $0.40 PMPM × 12, customer pays **$4.80 PMPY**. Conservative net savings per the §4.1 model: **~$15.67/member/year gross**. Net of fee: **~$10.87/member/year**. Year-1 ROI: ~2.3×.

### 8.2 Per-PA processed (recommended for RBMs)

- **$1.50–$3.00 per PA processed**, with a Gold Card-eligible auto-approval credited at $0.50.
- Aligns RBM economics directly with PA volume.
- Lower price per case for RBM customers above 5M lives under management.

### 8.3 Risk share (recommended for innovative payers and pilot motions)

- **15–25% of net imaging savings**, capped at $1.00 PMPM, measured against a pre-implementation baseline.
- Baseline is set jointly using the payer's last 12 months of imaging claims, PA volume, and appeal data.
- Validation logic runs continuously inside the `ins_validation_events` ledger; ARKA does not bill on disputed savings.

---

## 9. Pilot plan — what the first 90 days look like

**Days 0–14: Discovery and baseline.**
- ARKA receives 12 months of de-identified imaging claims, PA decisions, and appeal data via SFTP.
- Joint baseline meeting establishes the four target metrics: imaging trend, PA auto-approval rate, appeal overturn rate, member OOP variance.

**Days 15–30: Sandbox stand-up.**
- ARKA registers a CDS Hooks discovery endpoint scoped to the payer's network.
- One pilot provider group (typically a high-volume specialty: orthopedics, neurology, primary care) opts in via SMART-on-FHIR.
- DEMO_MODE on; no PHI moves.

**Days 31–60: Live pilot, single line of business.**
- One line of business (e.g. MA, or commercial fully-insured) goes live in production at the pilot provider group.
- Live AIIE scoring on real orders; ROI dashboard begins logging validation events.
- Weekly business review; failure modes triaged.

**Days 61–90: Expansion or no-go.**
- ROI report delivered with line-item attribution to each of the §4.1 lines.
- Go/no-go on full-network rollout.
- If go: 12-month rollout schedule, with Gold Card eligibility live by month 4, OOP site-routing live by month 6, full Da Vinci PAS production by month 9, well ahead of the January 2027 mandate.

The pilot has been intentionally architected to be **cheaper than the payer's current quarterly PA audit**. If it does not produce attributable ROI in 90 days, the payer pays nothing under the risk-share model and re-papers the contract under the PMPM model.

---

## 10. Closing

Every U.S. health insurer of any meaningful size is, today, paying for medical imaging it does not need to pay for. The waste is not a mystery — it is documented in CAQH, KFF, MGMA, AMA, HFMA, ACR, and CMS public data. The reason it persists is not that payers do not know. It is that no single tool sits at the moment of order entry, in the EHR, on a Da Vinci-compliant rail, with an explainable engine, and a forward-looking gold-card scorer, and an OOP estimator, and a cheaper-site router, and a real-time PAS decision, all at once.

That tool is ARKA-INS. It is ready now, ahead of CMS-0057-F, with an FDA Non-Device CDS posture that defers regulatory friction, on an architecture that scales to the largest national carrier and is cheap enough for a Medicaid MCO. The net of fee is positive in year one. The compliance is positive in year one. The provider relationship is positive in year one.

The pitch closes with one question for the buyer: **what is the budget owner for "imaging inefficiency" inside your organization, and what do they currently lose to it every quarter?** Most plans cannot answer the second part of the question. ARKA-INS is what makes the answer to the first part irrelevant.

---

## Appendix A — Full ROI assumptions table

| # | Assumption | Conservative | Aggressive | Source |
|---|---|---|---|---|
| 1 | Total U.S. paid medical imaging spend, 2024 | $140B | $150B | Fortune Business Insights; Grand View Research |
| 2 | Total U.S. CT procedures/year | 84.5M | 90M+ | Market.us 2024 |
| 3 | Total U.S. MRI procedures/year | ~40M | 45M | Market.us 2024 |
| 4 | Inappropriate imaging rate (literature) | 30% | 35% | Choosing Wisely, ACR, Health Affairs |
| 5 | Redundant imaging within 90 days | 15% | 20% | Peer-reviewed; AJR |
| 6 | Avg cost per advanced imaging study (CT/MRI mix) | $1,500 | $2,200 | Medicare allowed amounts + commercial mix |
| 7 | Imaging PAs per 1,000 commercial lives/year | 15 | 25 | Plan-disclosed; AHIP benchmarking |
| 8 | Avg payer admin cost per imaging PA | $6 | $11 | CAQH 2024 Index |
| 9 | Avg admin cost per electronic PA | $1.88 | $1.88 | CAQH 2024 |
| 10 | PA denial rate (MA) | 6.4% | 7.5% | KFF Jan 2026 |
| 11 | Denial appeal rate (MA) | 11.5% | 15% | KFF Jan 2026 |
| 12 | Appeal overturn rate (MA) | 80.7% | 85% | KFF Jan 2026 |
| 13 | Avg cost per appeal (payer side) | $25 | $43 | MGMA, AHIP |
| 14 | Avg overturned-appeal cost (payer side) | $150 | $300 | MGMA, internal |
| 15 | Site-of-service price differential (HOPD vs. freestanding) | 70% | 208% | HFMA; NIHCR |
| 16 | Avg site-routing $ delta per advanced study | $500 | $900 | TiC, HPT data |
| 17 | % of advanced studies reroutable to cheaper in-network site within 15 mi | 20% | 35% | Internal model, validated against TiC files |
| 18 | Incidental finding rate on advanced imaging | 15% | 30% | PubMed, JAMA Network Open |
| 19 | Avg downstream cascade cost per finding | $460 | $2,155 | PubMed 30300007; ScienceDirect |
| 20 | Forward-looking Gold Card eligibility rate (broad) | 35% | 45% | UHC 2024 program data |
| 21 | AIIE capture rate of inappropriate orders | 60% | 72% | ARKA-CLIN deployment data |
| 22 | AIIE-driven inappropriate-imaging reduction | 40% | 50% | ARKA-CLIN central case |
| 23 | Default ARKA-INS PMPM | $0.40 | $0.50 | ARKA pricing |
| 24 | Industry total annual PA admin spend | $13B | $15B | CAQH 2024 |
| 25 | Medicare low-value services spend | $3.6B | $4.4B | RadiologyBusiness 2024 |
| 26 | Patient OOP on low-value imaging | $800M | $1.1B | RadiologyBusiness 2024 |
| 27 | CMS-0057-F est. 10-year industry savings | $15B | $15B | CMS 2024 final rule |
| 28 | MA average MLR, 2024 | 89.2% | 90.0% | KFF 2024 |

---

## Appendix B — Sources

- CAQH 2024 Index — annual industry spend on PA, cost per transaction
- KFF "Medicare Advantage Insurers Made Nearly 53 Million Prior Authorization Determinations in 2024" (Jan 2026)
- KFF "Claims Denials and Appeals in ACA Marketplace Plans in 2024"
- CMS "Interoperability and Prior Authorization Final Rule (CMS-0057-F)" — January 2024
- CMS Wasteful and Inappropriate Service Reduction (WISeR) Model — Jan 2025 launch
- MGMA "The Prior Authorization Landscape in 2025"
- AMA Prior Authorization Physician Survey — 13 hrs/week, 39 PAs/physician/week
- AHIP 2025 PA reform commitments — 80% electronic real-time response
- UnitedHealthcare National Gold Card Program protocol (Oct 2024)
- HFMA "Identifying the Gap Between Hospital and Free-Standing Prices"
- NIHCR "Location, Location, Location: Hospital Outpatient Prices Much Higher than Community Settings"
- ChoosingWisely / ACR Appropriateness Criteria
- RadiologyBusiness "Medical imaging a heavy contributor to Medicare waste" (2024)
- Yale Global Health Review "Incidental Findings from Low-Value Screening and Resulting Cascades of Care in the United States" (Jul 2024)
- PubMed 30300007 — Downstream costs of incidental pancreatic cysts on MRI
- PubMed 30093215 — Downstream costs of incidental pulmonary nodules on CT
- JAMA Network Open "Downstream Mammary and Extramammary Cascade"
- Fortune Business Insights / Grand View / Market.us — U.S. imaging market size 2024
- CBInsights, PitchBook — Evicore / Carelon / Cohere financials
- HL7 Da Vinci Project — CRD, DTR, PAS Implementation Guides
- 21st Century Cures Act §3060 (FDA Non-Device CDS criteria)
- Internal ARKA Action Plan v6 (Feb 2026) — AIIE methodology, scoring, three-phase product strategy
- Internal ARKA-INS Full Platform Build Guide — architecture, Da Vinci CRD/DTR/PAS implementation

---

*ARKA-INS is an FDA Non-Device Clinical Decision Support tool under Section 520(o)(1)(E) of the FD&C Act (21st Century Cures Act). This tool provides information to support clinical and administrative decisions; it does not replace clinical judgment. The licensed clinician retains decisional authority. © 2026 ARKA Health.*
