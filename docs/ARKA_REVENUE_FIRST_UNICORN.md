# ARKA — The Unicorn Exception (Master Strategy, Revenue-First)

### The one document: why ARKA survives the health-tech graveyard — it gets hospitals paid, passes every regulation by design, never touches the doctor's workflow — and the full engine, moat, differentiators, regulation, roadmap, and brand behind it

**Version 2.0 (superset) · May 29, 2026 · Prepared by ARKA Health**
**Audience:** Founder / exec team / CFO buyers / payer buyers / Series B investors / the engineer on the Cursor seat
**This document is a superset of `ARKA_UNICORN_STRATEGY_v3.md`.** It keeps that document's entire thesis, engine, differentiator set, regulatory guardrail, roadmap, and brand, and reframes the whole thing revenue-first with the three front-facing pillars the business is sold on: **claim-denial recovery, regulatory pass-through, and zero workflow change.**

> **FDA posture (binding, top of every page):** ARKA is and remains a **Non-Device Clinical Decision Support** function under **§520(o)(1)(E) of the FD&C Act (21st Century Cures Act §3060)**, as clarified in FDA's CDS Software Final Guidance (Jan 6, 2026). Every feature in this document has been screened against the four statutory criteria. **OPTIMA "Epoch 2" (autonomous triage → Class II SaMD / 510(k)) is explicitly OUT OF SCOPE (Part IV §13).** No feature may be implemented in a way that breaks the Non-Device boundary. The regulatory posture is not a constraint on the business model — it *is* the business model.

### Sourcing & provenance note (read once)

This master doc draws on four repo sources: `ARKA_UNICORN_STRATEGY_v3.md` (the engine, OPTIMA verdict, D19–D24, FDA guardrail, roadmap, brand — reproduced faithfully), `docs/ARKA-INS_Payer_Pitch.md` (denial/ROI economics, pricing, GTM, pilot), `docs/REGULATORY_RATIONALE_MEMO.md` (the §520(o)(1)(E) audit), and `ARKA-ED_MOBILE_MASTER_PLAYBOOK.md` (the PAMA AUC repeal). **v3 references a "v2.0" for D1–D18, the four-event Regulatory Earthquake, the buyer grid, the seven-risk register, and the competitive matrix, but that v2.0 is not a file in this repo.** Where this document reproduces those items it **reconstructs them from the sources above and labels them "[reconstructed]"** — the D19–D24 differentiators, the OPTIMA verdict, the FDA lists, and the roadmap are reproduced directly from v3 and are not reconstructions. A full v3 → this-document crosswalk is in **Appendix D** so you can confirm nothing in v3 was dropped.

---

## Table of contents

**PART I — THE REVENUE THESIS**
0. The bottom line, in one paragraph a CFO will read
1. The graveyard — the failure cycle and the line ARKA crosses
2. The nine ways health-tech dies — and why ARKA is the exception

**PART II — THE THREE FRONT-FACING PILLARS**
3. Pillar one — claim denial: how ARKA gets the hospital paid
4. Pillar two — passing every regulation by design
5. Pillar three — staying out of the doctor's way
6. The front page, distilled — website copy seeds

**PART III — WHY IT'S A UNICORN, NOT A FEATURE**
7. Not a "fancy calculator" — the engine and the trust
8. The moat — six reasons it can't be copied

**PART IV — THE FULL v3 STRATEGY, INTEGRATED**
9. The OPTIMA verdict — take Epoch 1, exclude Epoch 2
10. The five pillars of the moat (with AIIE-OPTIMA's seven modules)
11. The complete differentiator catalog — D1–D24, with dollar sizes
12. The four-event Regulatory Earthquake
13. The FDA Non-Device guardrail — criteria, NO-list, YES-list, checklist, lint
14. The twelve pain points and the buyer-by-buyer grid
15. Payer-first GTM and the 90-day pilot
16. The execution roadmap, including OPTIMA O-0 → O-5
17. The seven-risk register
18. The competitive matrix
19. Pricing — three models, all accretive to the buyer
20. Brand — Gungnir and "remARKAbly precise"
21. Closing argument — the six facts

**APPENDICES**
- A. Assumptions & sources for every number
- B. The ROI model, line by line (provider + payer)
- C. OPTIMA components vs. the four §520(o)(1)(E) criteria
- D. v3 → this-document crosswalk (nothing dropped)

---
---

# PART I — THE REVENUE THESIS

## 0. The bottom line, in one paragraph a CFO will read

There are exactly two things that reliably get a piece of software bought in a hospital: **it increases billing, or it reduces headcount.** Everything else is a hard sell. ARKA does both, on the highest-margin service line in the building, without asking a single physician to change how they order. It documents the clinical justification for an imaging study *at the moment the order is placed*, so the claim goes out clean the first time. Prior-authorization denial rates on advanced imaging run **20–40%** at many institutions; the industry consensus is that **~86% of those denials were avoidable** and roughly **half are never reworked** — that is pure earned revenue walking out the door. ARKA recovers it. It also auto-approves the 35–40% of orders that are unambiguously appropriate, which is where the nurse-hours go. The one-line pitch: **"ARKA recovers revenue you're already losing to denials, speeds up your highest-margin service line, and cuts the admin burden doing it."** The rest of this document proves each clause, shows the engine and moat behind it, and demonstrates why no competitor and no in-house build can copy it.

---

## 1. The graveyard — the failure cycle, and the exact line ARKA crosses that others don't

Here is the cycle that kills health-tech startups, the one every operator who has spent a decade in this space recognizes on sight:

> An innovator spots a problem that better technology could fix. They notice how far behind healthcare is. They assume nobody has built the tech, so once they build it, adoption will be easy. They find a few excited health systems, make a few sales, get press, raise a round. Then implementation hits: clinical workflows are tangled, incentives are misaligned, integrations won't clear IT, and they're learning change management for the first time. The tech *works* — but adoption is low and the outcomes data is thin. The company shuts down, gets acqui-hired, or is sold for parts (with a press release that makes the funeral sound like a wedding).

**The original sin is the order of operations.** The doomed founder builds the tech *first*, then goes looking for the stakeholders, the workflows, and the money. The correct order is the inverse:

1. Understand the problem to be solved.
2. Map every stakeholder the program touches and their existing clinical workflow.
3. Determine the ideal way to solve it — *regardless of whether technology is involved.*
4. Only if tech is genuinely advantageous, design it in consultation with clinical stakeholders so it fits the workflow, and validate the trade-offs are acceptable.
5. Build the tech **last**, and iterate it with the clinicians.

ARKA was built in that order, and the proof is structural, not aspirational:

| The right step | How ARKA did it (not "plans to") |
|---|---|
| Understand the problem | The problem isn't "doctors lack a dashboard." It's **a hospital is paid less than it earned because imaging orders go out without the documentation a payer requires to pay them.** That is a money problem, framed in money. |
| Map every stakeholder | ARKA is **bilateral by architecture**: the same engine serves the ordering clinician *and* the payer reviewer. The CFO, rev-cycle director, CMIO, ordering physician, prior-auth nurse, and payer medical director are explicit users with explicit surfaces (Part IV §14). |
| Solve it ideally, tech-agnostic | The ideal solution is "capture the clinical justification once, at the source, in a form both the doctor and the payer trust." That is a *workflow* insight, not a tech insight. The tech exists only because CDS Hooks makes that capture invisible. |
| Validate trade-offs with clinicians | ARKA is **non-blocking by design** — it cannot stop an order, only inform one. The override leads with "Clinical judgment based on findings not captured in chart." The trade-off offered to physicians is *zero*: no clicks added, no screens added, full authority retained. |
| Build the tech last | The engine (AIIE → AIIE-OPTIMA) is the *last* layer, riding on standards — HL7 CDS Hooks, SMART-on-FHIR, Da Vinci CRD/DTR/PAS — that Epic and Cerner already speak. The tech is the easy part precisely because the hard parts were solved first. |

**The line ARKA crosses that the graveyard never reaches:** ARKA's first sentence to a buyer is about *their money*, and its first promise to a physician is *we will not touch your workflow.* The failed startup's first sentence is about *its technology*, and its first ask of a physician is *change how you work.* That inversion is the whole difference.

---

## 2. The nine ways health-tech dies — and why ARKA is the exception to each

| # | The failure mode that kills startups | Why it kills them | Why ARKA is the exception |
|---|---|---|---|
| **1** | **The Reimbursement Disconnect** — the buyer is not the user; if it doesn't map to a billing/CPT event, it can't be reimbursed, so it's unviable. | Founders build for the doctor's *experience* and forget the doctor gets paid by *codes*. | ARKA is built around the billable event — it protects the reimbursement of a high-margin imaging CPT line by making the claim defensible at order. Buyer (CFO/rev-cycle) and beneficiary (the P&L) are the same. **§3.** |
| **2** | **Claim Denial / "saving billing codes, not lives"** — tools build dashboards while ignoring that doctors buy software to get *paid*. | Denials are where hospital revenue silently evaporates. | Denial recovery is ARKA's *core revenue engine*. 20–40% imaging denial rates; ~86% avoidable; ARKA documents the justification up front so claims go out clean. **§3.** |
| **3** | **The Regulatory Minefield** — HIPAA, data localization, FDA clearance; ignoring it forces late overhauls. | A 510(k) is a 12–24-month, $250K–$2M-per-indication detour that burns runway. | ARKA was architected *inside* the Non-Device CDS exclusion from day one. No 510(k). HIPAA handled by never moving raw PHI (federated). CMS-0057-F is a tailwind. **§4, §12, §13.** |
| **4** | **Integration Nightmares** — hospitals run on Epic/Cerner; non-interoperable software gets rejected by IT. | A proprietary integration is a multi-quarter security review most startups never clear. | ARKA ships on the rails Epic and Cerner already run: **HL7 CDS Hooks + SMART-on-FHIR**, standard discovery endpoint. No proprietary integration to reject. **§5, §10.** |
| **5** | **Lack of Unmet Clinical Need / "Mansion MVP"** — a flawless stack built without validating a real workflow problem. | Beautiful tech, no pain solved, no adoption. | The pain is documented in CAQH, KFF, AMA, ACR, CMS data — one of the most-quantified problems in U.S. healthcare. ARKA solves it *at the existing point of work*. **§3, §14.** |
| **6** | **The "Fancy Calculator" Trap** — wrapping an LLM to do a shallow task; churns on alert fatigue and security fears. | No trust, no accuracy, no security story → fast churn. | Not an LLM wrapper: an explainable rules-first engine upgrading to a research-grade sequential-decision engine (AIIE-OPTIMA). Every output cites a guideline and exposes its math. **§7, §10, §11.** |
| **7** | **Baseline Drift / Alert Fatigue** — flag every deviation and the doctor deletes you in a week. | One-size alerting destroys trust on first contact. | ARKA returns **empty cards** when no guideline-anchored rule fires ("silence is regulatory-safe"); a contextual bandit learns each site and converges from ~15% → ~2% exploration. **§5, §7.** |
| **8** | **Stagnant Sales Cycles** — chasing massive systems into 12–24-month cycles that bleed cash. | The enterprise whale eats the runway before the deal closes. | Wedge is the **regional/mid-sized** group desperate for revenue, plus a **payer-first** motion where CMS-0057-F is a Jan 1, 2027 forcing function. Non-Device keeps procurement at SaaS speed. **§8, §15.** |
| **9** | **The Incumbent Blockade & Burn-Rate Burnout** — RBMs/EHRs own the turf; cash runs out fighting them. | You can't outspend Epic or out-staff eviCore. | ARKA sits *on top* of incumbents — a layer over the RBM (raises their per-case margin) and a CDS-Hooks app inside the EHR (not a rival to it). Capital efficiency comes from shipping software, not clearing devices. **§8, §18.** |

The three the user singled out as **front-facing** — claim denial, regulation, and workflow — get full treatment now in Part II.

---
---

# PART II — THE THREE FRONT-FACING PILLARS

## 3. FRONT-FACING PILLAR ONE — Healthcare claim denial: how ARKA gets the hospital paid

> *The clinical worker's groan:* "We did the scan. The patient needed it. And we're not getting paid for it because the auth was missing one line of documentation nobody asked for until the denial letter showed up six weeks later — and now a nurse who should be with patients is on hold with the payer."

### 3.1 Where the money actually leaks

A hospital loses imaging revenue at four points, and a physician feels all four:

1. **Front-end denials.** Prior authorization for advanced imaging (CT/MRI/PET/nuclear) is denied **20–40%** of the time at many institutions. The dominant root cause is not clinical — it is **documentation**: the medical necessity the physician *knew* was never written down in the form the payer's reviewer needed.
2. **Avoidable denials.** Industry analysis (Change Healthcare Revenue Cycle Denials Index) found **~86% of denials are potentially avoidable** — the work was justified; the *paperwork* failed.
3. **Never-reworked denials.** Roughly **half of denied claims are never resubmitted** — the appeal costs more staff time than the claim is worth. Each rework costs **~$25–$118** (MGMA), and the appeal is nurse-hours that should be clinical.
4. **Throughput loss on a high-margin line.** Every order stuck in an auth backlog is a scan not completed this month on the **highest-margin service line in the hospital.** Slow approvals are slow revenue.

### 3.2 What ARKA does about it — at the moment of the order, invisibly

ARKA runs inside the EHR via CDS Hooks the instant a clinician selects an imaging order, and in **under 800 ms**:

- **Scores appropriateness against published guidelines** (RAND/UCLA 1–9, GRADE), and **inverts that score into denial risk**, routing the order `AUTO_APPROVE / LIKELY_APPROVE / CLINICAL_REVIEW / LIKELY_DENY` *before it is signed.*
- **Generates the documentation the payer will demand** — a pre-filled FHIR Questionnaire (Da Vinci DTR) asking the physician to confirm only the factor that lowered the score, auto-populated from the chart. One gap filled, sign, **packet complete the first time.**
- **Returns a real-time PAS decision** (Da Vinci PAS) with **specific, guideline-cited reasons** — the kind that survive an appeal instead of triggering one.
- **Auto-approves the 35–40%** of unambiguously appropriate orders (forward-looking Gold-Card logic) so they never enter a queue.

Because the **same engine** runs on the payer side (ARKA-INS), the provider's appropriateness view and the payer's denial-risk view are computed from **identical math with identical citations**. There is *no inconsistency to litigate* — which is why appeal-overturn rates collapse: when ~80.7% of appealed MA denials are overturned (KFF 2024), every overturn was a *wrong denial* that cost both sides money. ARKA stops the wrong denial from being issued at all.

### 3.3 The recovered-revenue math (provider side, conservative)

Modeled for a **regional hospital group running 120,000 advanced imaging studies/year** — the mid-sized buyer most desperate for new revenue. Full line items in Appendix B; conservative column throughout.

| Lever | Mechanism | Conservative assumption | Annual impact |
|---|---|---|---|
| **A. Denial recovery** | Clean documentation at order converts would-be denials to clean pays | 120,000 × 25% PA-required × 25% denied × 86% avoidable × 60% ARKA-captured × $900 net reimbursement | **≈ $3.5M recovered** |
| **B. Rework labor avoided** | Fewer denials → fewer appeals to staff | ~3,870 denials avoided × $50 blended rework cost | **≈ $193K** |
| **C. Throughput / volume defense** | Faster approvals shorten backlog on a high-margin line | +2% completed advanced studies × $900 margin × 120,000 × 25% PA-gated | **≈ $540K** |
| **D. Admin headcount redirected** | 35–40% auto-approval removes human touch from clean orders | ~2–3 prior-auth FTEs redirected/not backfilled × $75K loaded | **≈ $150K–$225K** |
| **Gross annual benefit (conservative)** | | | **≈ $4.4M** |
| **Less ARKA fee** | | | **− ~$0.4–0.7M** |
| **Net year-one benefit** | | | **≈ $3.7M–$4.0M** |

> **The reframe that wins the room:** ARKA is not a cost. It is **recovered revenue with a software invoice attached.** No new patients required. No outcomes RCT required to start. The hospital is paid for work it already performed.

---

## 4. FRONT-FACING PILLAR TWO — How ARKA passes through every regulation, by design

> *The clinical worker's groan:* "Every promising tool we've tried got stuck in a two-year FDA or security review, or got pulled when legal found a HIPAA problem nobody flagged early."

ARKA's regulatory posture is the chassis the product was built on, not a hurdle it cleared. Four bodies of regulation matter; ARKA is on the right side of all four. (Full treatment — criteria, NO-list, YES-list, lint — in §13.)

### 4.1 FDA — Non-Device CDS, not a regulated device (no 510(k))

ARKA sits inside the **Non-Device CDS exclusion** of **FD&C Act §520(o)(1)(E)**, clarified by FDA's Jan 6, 2026 final guidance, satisfying each of four criteria *structurally* (verified in `docs/REGULATORY_RATIONALE_MEMO.md`):

| Criterion | Requirement | How ARKA satisfies it (code-level) |
|---|---|---|
| **1 — Not device data** | No analysis of images / IVD signals / waveforms | Consumes **only structured FHIR**; CI guard blocks image/signal libs from CDS scope; DICOM viewer scoped *out* (`SCOPE_BOUNDARY.md`). |
| **2 — Basis in published evidence** | Grounded in published/regulatory sources | Every card carries a structured `medicalBasis`; cards can't ship without it (`assertMedicalBasis`). |
| **3 — Recommendation, not directive** | Supports a decision; doesn't replace judgment | Non-blocking CDS Hooks; override leads with "Clinical judgment based on findings not captured in chart." |
| **4 — Independent review** | Clinician can review the basis | SHAP attributions + citations surfaced on demand; rules-only fallback when ML is offline, by design. |

A 510(k) / Class II path is the **12–24-month, $250K–$2M-per-indication** detour that kills runway and forces a slower sales motion. ARKA never takes it. **Staying Non-Device is not a limitation on the strategy; it is the strategy.**

### 4.2 HIPAA & privacy — no raw PHI ever moves

The engine improves across institutions via **federated learning with differential privacy** (FedAvg/FedProx, secure aggregation, per-institution ε-budget ledger). **Only DP gradient aggregates cross the network — never a patient record.** Logs are redacted to hashed identifiers and age buckets (`docs/PHI_REDACTION.md`).

### 4.3 CMS-0057-F — a forcing function in ARKA's favor

CMS-0057-F requires, by **Jan 1, 2026**, specific (non-boilerplate) denial reasons and 72h/24h SLAs, and by **Jan 1, 2027**, a **FHIR-native Prior Authorization API** — by construction the HL7 Da Vinci PAS Implementation Guide. **ARKA ships that endpoint in production today.** A buyer who adopts ARKA gets a **drop-in compliance package that also produces ROI**; a buyer who builds in-house faces an 8-figure, multi-year FHIR project.

### 4.4 State gold-card & appeal law

CMS-0057-F's specific-denial regime plus state gold-card laws make **defensible, cited denial reasons** a legal necessity. ARKA produces the specific reason code *as a byproduct of scoring the order* — the same artifact that prevents the denial satisfies the statute.

---

## 5. FRONT-FACING PILLAR THREE — How ARKA stays out of the doctor's way

> *The clinical worker's groan:* "Here comes another pop-up. Another login. Another five clicks between me and signing this order. I'll click whatever makes it go away."

ARKA's design contract is **zero workflow change**, enforced, not promised:

- **Inside the EHR they already use.** Native CDS card in Epic/Cerner via CDS Hooks + SMART-on-FHIR. No new app, no second login, no context switch, nothing to learn.
- **Non-blocking.** ARKA *cannot* stop an order — the CDS Hooks spec has no block primitive and ARKA adds none. Critical-tier cards are styling cues. Authority is absolute; override is one neutral click.
- **In-flow and fast.** Everything returns in **< 800 ms**, non-modal. If a model times out, it **falls back to rules-only output** rather than stalling the order.
- **Silent unless cited.** When no guideline-anchored rule fires, ARKA returns **empty cards.** The bandit learns each site's baseline (~15% → ~2% exploration); a Value-of-Information floor suppresses low-yield prompts. This is the direct antidote to the "delete-the-app-in-a-week" alert-fatigue death (the COPD-patient-vs-marathoner problem).
- **Invisible upgrades.** Even the OPTIMA engine slots *behind the existing interface* — same endpoint, same card shape, same buttons. "No physician ever sees a new screen" is a literal architectural invariant.

**The trade-off offered to the physician is zero** — and in exchange, the auth that used to bounce back as a denial now clears the first time. ARKA *removes* friction (the denial, the appeal, the peer-to-peer call) instead of adding it.

---

## 6. The front page, distilled — copy seeds for the website

**Hero headline (revenue-first):** *"You did the scan. Now get paid for it."*

**Hero subhead:** ARKA documents the clinical justification for every imaging order at the moment it's placed — inside Epic and Cerner, in under 800ms, without adding a single click. Denials drop. Clean pays rise. Your physicians never see a new screen.

**Three proof bars (with numbers):**
- **Recover ~$3.5M/yr** in avoidable imaging denials at a mid-sized system — 86% of denials are preventable; ARKA prevents them at the source.
- **Pass every regulation by design** — Non-Device CDS (no FDA 510(k)), HIPAA-safe federated learning, CMS-0057-F-ready Da Vinci PAS shipping today.
- **Zero workflow change** — non-blocking, in-flow, &lt;800ms, silent unless a guideline fires. 35–40% of orders auto-approve and never hit a queue.

**Closing CFO line:** *ARKA recovers revenue you're already losing to denials, speeds up your highest-margin service line, and reduces the admin burden doing it.*

> The ready-to-paste Cursor prompts that build this page live in the companion file `ARKA_FRONTPAGE_REVENUE_CURSOR_PROMPTS.md`.

---
---

# PART III — WHY IT'S A UNICORN, NOT A FEATURE

## 7. Not a "fancy calculator" — the engine and the trust

- **Explainable, not a black box.** Rules-first: every recommendation's primary basis is a *published guideline*, cited above any ARKA score, in both wire format and UI. ML only *refines* a recommendation a guideline already supports — it never originates one.
- **Research-grade, not a prompt.** The roadmap engine, AIIE-OPTIMA, is a POMDP solved with a Bayesian Value-of-Information kernel, AlphaZero-style MCTS over imaging *pathways*, a constrained Thompson-sampling bandit, an HGNN clinical-knowledge encoder, federated learning, and doubly-robust off-policy evaluation — every layer explainable. It reasons "ultrasound now → MRI only if indeterminate," how physicians actually think (full detail §10).
- **It proves its own value, continuously.** DR-OPE re-scores the deployed policy weekly against real decisions and auto-rolls-back on a >3% regression. ARKA doesn't *claim* it reduces cost and denials — it *measures* it on a live dashboard, per institution.
- **Alert fatigue is engineered out.** Silence when nothing fires; per-site learning; a VOI floor. The card earns the interruption before it makes one.

## 8. The moat — six reasons it can't be copied

1. **The bilateral engine.** The only engine running on *both* sides of the prior-auth wall, from the same math. No payer can build it without being the provider-side CDS vendor; no provider tool without being the payer-side engine. ARKA occupies both.
2. **The federated data moat.** Every new site improves the engine for all sites — without anyone shipping a patient record. A labeled, payer-adjudicated, multi-institution outcome dataset **money cannot buy and an LLM cannot synthesize.**
3. **Non-Device clearance to ship today.** While a SaMD competitor spends two years and seven figures per indication on 510(k)s, ARKA deploys into any CDS-Hooks EHR now. Speed and capital efficiency *are* the moat.
4. **Standards-native integration.** CDS Hooks + SMART-on-FHIR + Da Vinci clears IT review as a standard app, not a proprietary risk.
5. **Continuous statistical proof of value (DR-OPE).** A renewal conversation where the dashboard already shows dollars recovered is not a competitive evaluation. The anti-churn weapon and the fundraising weapon at once.
6. **Imaging is just the wedge.** The same sequential-decision engine will, in 3–5 years, reason over specialty-drug step therapy, elective-surgery appropriateness, any expensive medical decision against the evidence — the **$10B+ appropriateness layer of American medicine.**

GTM avoids the two classic traps directly: **sell to regional/mid-sized groups first** (short cycles) and run a **payer-first motion** where CMS-0057-F's Jan 2027 mandate is closing the deal for you (§15).

---
---

# PART IV — THE FULL v3 STRATEGY, INTEGRATED

> Parts I–III are the revenue lens. Part IV is the complete `ARKA_UNICORN_STRATEGY_v3.md` content — engine, differentiators, regulatory guardrail, roadmap, brand — reproduced and integrated so this is the single master document. Items reconstructed from companion docs (rather than reproduced from v3) are marked **[reconstructed]**.

## 9. The OPTIMA verdict — take Epoch 1, exclude Epoch 2

The question is not "is OPTIMA cool?" but "which parts make ARKA the most profitable startup *while staying Non-Device CDS*?" Every row is tested twice: (1) does it move a buyer or investor, and (2) does it survive all four §520(o)(1)(E) criteria?

| OPTIMA component | Take it? | Why it helps ARKA win | Non-Device standing |
|---|---|---|---|
| **Bayesian decision-theoretic kernel — belief state + Value of Information** | **YES — flagship** | Puts an actual *number* on diagnostic information each study yields. No deployed CDS does this. | Safe; reasons over structured facts, never pixels; clinician reviews. → **D19** |
| **MCTS over imaging *pathways* (PUCT / AlphaZero-style)** | **YES — flagship** | Scores the *sequence* ("US now → MRI only if indeterminate"), not the single shot. The wow demo. | Safe with fencing: ≥2 options, rationale exposed, click required, never autonomous. → **D20** |
| **Personalized trajectory simulation (Neural ODE + SCM)** | **YES — engine for D20, fenced** | Makes pathway reasoning personalized; the counterfactual "what if we image later." | Conditionally safe: compares imaging-pathway utility only; **never** predicts a time-critical event (NO #7). |
| **Constrained contextual bandit (Thompson + projection)** | **YES — internal** | Learns which safe top-k option to surface per site/payer; cuts alert fatigue. | Safe; restricted to MCTS Pareto top-k; clinician reviews. |
| **Heterogeneous GNN encoder (UMLS/RadLex/ICD-10/CPT)** | **YES — internal** | Richer context vector → better calibration, lower latency than a transformer. | Safe; internal feature representation. |
| **Federated learning + differential privacy** | **YES — extends Pillar 5** | The data moat; the engine improves the more institutions it touches, no row-level PHI moves. | Safe Non-Device training infra (drop v3's "accompanies the 510(k)" framing). → **D21** |
| **Doubly-Robust off-policy evaluation (DR-OPE)** | **YES — fundraising/renewal weapon** | Proves continuously the deployed policy beats the prior one on yield/dose/cost. | Safe; validation analytics over logged decisions. → **D22** |
| **Multi-objective reward with surfaced per-institution/per-payer weights** | **YES — reinforces bilateral thesis** | Clinician and payer reviewer see the same math with the same weights. | Safe; transparent objective weights + SHAP attribution. → **D23** |
| **Federated warm-start to beat cold-start** | **YES — GTM accelerant** | Kills "we have no local data yet"; shortens time-to-value and sales cycles. | Safe; data-free epidemiologic priors + society-backed likelihoods. → **D24** |
| **Epoch 2 — autonomous triage of "low-risk presentations"** | **NO — hard exclude** | Superficially tempting; actually a trap. | **Breaks the constraint** — crosses into Device CDS / SaMD: 510(k), PCCP, 21 CFR 820 QMS, IEC 62366-1. → NO #8. |
| **510(k) / Class II framing throughout** | **NO — strip** | Keep only as a post-Series-C, separate-entity "someday." | Positioning ARKA as moving to Class II contaminates the Non-Device posture. Quarantine it. |

**One-paragraph answer:** almost all of OPTIMA helps — and the parts that help most (VOI, sequential pathway reasoning, continuous DR-OPE proof, the federated moat) sit *comfortably* inside Non-Device CDS because they reason over structured facts, surface their basis, recommend rather than direct, and never touch a pixel. The **only** part that hurts is **Epoch 2 autonomous triage**, because it converts ARKA from a fast, capital-efficient Non-Device company into a slow, capital-intensive SaMD company competing with Aidoc on Aidoc's regulatory turf. **Take Epoch 1 in full. Leave Epoch 2 on the page it came from.**

## 10. The five pillars of the moat (with AIIE-OPTIMA's seven modules)

| Pillar | What it is | Status |
|---|---|---|
| **1. CDS Hooks platform in production** | Discovery → CRD → DTR → PAS → audit, on the rails Epic/Cerner speak | Live |
| **2. A shared bilateral intelligence engine** | The *same* engine produces the provider appropriateness view and the inverted payer denial-risk view — now AIIE-OPTIMA | Upgrading |
| **3. Documented Non-Device CDS posture (§520(o)(1)(E))** | *The single most important moat* — the right to ship without a 510(k) | Live |
| **4. Da Vinci CRD/DTR/PAS, CMS-0057-F-ready** | The Jan 2027 FHIR PA API, shipping today | Live |
| **5. Federated privacy primitives** | DP gradient aggregation; no raw PHI moves | Live |

**AIIE-OPTIMA's seven modules** (Pillar 2), each chosen for a structural advantage no incumbent rule engine can replicate. The deterministic v1 stack (RAND/UCLA + GRADE + XGBoost + SHAP) remains the always-on fallback (`ARKA_ENGINE="v1"`):

1. **Bayesian VOI kernel** — maintains a belief over ~1,500 ICD-10-mapped condition labels; primary reward is **diagnostic entropy reduction** (Value of Information), observable at order time. → D19
2. **Personalized trajectory simulator (Neural ODE + SCM)** — well-defined counterfactuals via do-calculus; **fenced** to imaging-pathway utility only, never a time-critical event prediction (NO #7).
3. **MCTS over pathways (PUCT)** — 20–80 roll-outs per decision inside the latency budget; ranked pathways with safety-constraint enforcement (radiation/cost caps). → D20
4. **Constrained contextual bandit (Thompson sampling)** — chooses which MCTS top-k option to surface; converges ~15% → ~2% exploration after ~5,000 encounters; **cuts alert fatigue.**
5. **Heterogeneous GNN encoder** — 2-layer relational GAT over a curated clinical knowledge graph → 128-d context vector.
6. **Federated learning + differential privacy** — FedAvg/FedProx, secure aggregation, per-institution ε-budget ledger. → D21
7. **Doubly-Robust off-policy evaluation** — Dudík et al. estimator re-evaluates each policy weekly vs. trailing 30 days; >3% drop auto-rolls-back. → D22

**The quant-finance pedigree, made literal:** a POMDP, AlphaZero-style MCTS, Bayesian belief tracking, constrained Thompson bandits, multi-objective Pareto optimization across diagnostic yield / radiation / cost / time / harm, and doubly-robust counterfactual evaluation — every layer explainable. **Zero-workflow-change guarantee:** OPTIMA lives entirely behind `scoreOrder(input): Promise<AIIEScore>`; output is additive only; roll-out is shadow → mirror → opt-in A/B → default-with-override; any timeout falls back to v1 with a `fallback=true` tag.

## 11. The complete differentiator catalog — D1–D24, with dollar sizes

**D1–D18 [reconstructed** from `docs/ARKA-INS_Payer_Pitch.md` and the regulatory memo, because v3 references but does not reprint them; numbering is this document's synthesis and may differ from the canonical v2.0]:

| # | Differentiator | What it does | Dollar / strategic size |
|---|---|---|---|
| D1 | Point-of-order appropriateness scoring | RAND/UCLA 1–9 at order-select inside the EHR | Anchors the 30–35% inappropriate-imaging problem |
| D2 | Inverted denial-risk scoring | Same score flipped to LIKELY_DENY/APPROVE before signing | Stops wrong denials at the source |
| D3 | Forward-looking Gold-Card auto-approve | Provider's forward approval rate per CPT×payer; auto-approves 35–40% | Removes human touch from clean orders |
| D4 | DTR pre-filled FHIR Questionnaire | Asks only the factor that lowered the score; auto-populated | Documentation complete first time |
| D5 | Real-time PAS decision with specific reasons | Da Vinci PAS, X12 278 semantics; reasons survive appeal | Collapses appeal volume |
| D6 | OOP cost + cheaper in-network site routing | Surfaces the payer's cheaper site before the order is signed | ~$14M/yr site-of-service leakage per 1M lives |
| D7 | Federated denial-pattern learning | Learns denial patterns across sites without moving PHI | Compounding accuracy; extended by D21 |
| D8 | Duplicate / redundant-order detection | Flags studies redundant within 90 days | 15–20% of imaging is redundant |
| D9 | Incidental-findings follow-up control | Reduces cascade from low-value studies | $460–$2,155 per finding cascade |
| D10 | SHAP explainability surface | Top positive/negative factors + citations per card | Satisfies Criterion 4; builds trust |
| D11 | Citation-first medical basis | Every card cites a published guideline above any score | Criterion 2; anti-"fancy calculator" |
| D12 | Non-blocking tiered alerting | Critical cards are styling cues, never blocks | Criterion 3; zero workflow coercion |
| D13 | Loss-framed cost messaging | "This patient would pay $1,847 more here" | Loss framing outperforms gain 2:1 |
| D14 | Rural / resource-aware CDS (RaaS) | Resource-aware recommendations for low-capacity sites | Expands TAM to rural access |
| D15 | Peer-to-peer LLM assistant (chat layer) | LLM as a *feature* for P2P, not the engine | UX without the LLM-wrapper risk |
| D16 | ROI / validation dashboard | Live yield, denial, cost, override metrics | Converts pilots to renewals |
| D17 | ARKA-ED education layer | Trains residents on appropriateness (post-PAMA-AUC gap) | Culture/adoption flywheel |
| D18 | Da Vinci CRD/DTR/PAS compliance package | The CMS-0057-F endpoints shipping today | 8-figure in-house build avoided |

**D19–D24 [reproduced directly from v3 §5.O]:**

- **D19 — The Value-of-Information Card.** Removes: low-value imaging ($12–30B/yr) + incidental-finding cascade ($3–6B/yr). Shows the expected diagnostic information each study yields ("US resolves ~0.82 of uncertainty; MRI ~0.86 but +7 days, +4× cost"). Every avoided low-yield study is $400–$2,155; at an ACO running 300K studies/yr a single-digit-% shift is multi-million-dollar. Non-Device: structured facts + priors only.
- **D20 — The Sequential Pathway Co-Pilot (flagship).** Removes: radiologist-shortage/throughput crisis (+16.9–26.9% utilization by 2055), wrong-modality-first ordering, the avoidable-escalation tax. Surfaces ranked *pathways* with Q-values. **The number that headlines every payer/ACO pitch: ≥15% cumulative radiation reduction and ≥20% cost reduction at non-inferior diagnostic yield** (pre-registered validation). Non-Device, fenced: ≥2 options, click to act, never a time-critical prediction.
- **D21 — The Federated OPTIMA Network (data moat).** Federated learning of the full belief/value models; per-institution ε-budget ledger (ε=1.0, δ=1e-6/week), trimmed-mean aggregation. Every new site improves all sites without shipping a record. Non-Device training infra.
- **D22 — Continuous Value Proof / DR-OPE (fundraising + renewal weapon).** Weekly re-scoring vs. trailing 30 days; >3% drop auto-rolls-back. A single MA STAR point on a 500K-life plan is worth **$80–120M/yr**; CQOs are measured on exactly this variance reduction. Non-Device validation analytics.
- **D23 — Auditable Multi-Objective Weights.** Objective `α·ΔInfo − β·dose − γ·cost − δ·time − ε·harm + ζ·patientPref` with learned, surfaced per-institution/per-payer weights. Attacks the provider–payer disagreement loop (**$40B/yr**). Both sides see the same weights. Non-Device transparency surface.
- **D24 — Cold-Start Warm-Start (GTM accelerant).** New site boots on federated warm-start + data-free epidemiologic priors, runs 30-day shadow before surfacing anything. Shorter sales cycles → higher net-new ARR velocity. Non-Device; nothing surfaced pre-calibration.

## 12. The four-event Regulatory Earthquake

The regulatory ground shifted four times, and every shift favors ARKA:

1. **PAMA Appropriate Use Criteria — dead.** The program that would have *forced* clinicians to consult imaging decision support (42 CFR 414.94) was **rescinded by CMS in the CY2024 rule**. The regulatory *stick* is gone — so adoption now rides on *value and culture*, which is exactly the revenue-and-education space ARKA fills (and ARKA-ED addresses). *(Source: ED playbook; Reed Smith analysis.)*
2. **CMS-0057-F — live.** Specific denial reasons + 72h/24h SLAs (Jan 2026) and a FHIR-native PA API = Da Vinci PAS (Jan 2027). ARKA ships it today. The forcing function for the payer-first motion.
3. **FDA's Jan 6, 2026 Non-Device CDS final guidance — broadening.** Clarified the §520(o)(1)(E) boundary ARKA was built inside, confirming the no-510(k) path for explainable, recommendation-framed, structured-data CDS.
4. **AHIP pledge + state gold-card laws.** AHIP's 2025 commitment to 80% electronic real-time PA responses, plus proliferating state gold-card statutes, make ARKA's forward-looking gold-card scorer and specific cited reasons a compliance necessity, not a nicety.

## 13. The FDA Non-Device guardrail — criteria, NO-list, YES-list, checklist, lint

**The four §520(o)(1)(E) criteria** are in §4.1. This section is **binding on every Cursor prompt and code review.**

**The hard NO-list:**
1. No pixel-level image analysis.
2. No IVD signal processing.
3. No time-critical alerting acted on before clinician review.
4. No autonomous order placement.
5. No pediatric-dosing / oncology-regimen SaMD categories.
6. No patient-direct diagnostic outputs.
7. **No use of the trajectory simulator to predict a time-critical clinical event** ("patient will deteriorate in N hours") — that is a device function. The 72-hour horizon is an internal utility-comparison construct only; a CI lint rejects any output field implying acute-event prediction.
8. **No OPTIMA "Epoch 2" autonomous triage** — do not implement, prototype, or market. Every recommendation requires an affirmative clinician click. Any 510(k)/Class II framing is removed from all roadmaps, technical files, and marketing surfaces.

**The hard YES-list:**
1. FDA Non-Device banner on every page.
2. Standard CDS card footer.
3. Evidence citation on every recommendation.
4. SHAP / per-feature explanation on demand.
5. `SCOPE_BOUNDARY.md` updated for every new in-scope directory.
6. Every OPTIMA path-level output carries path rationale + Q-value provenance + the per-objective weight vector used.

**Per-differentiator regulatory checklist (D19–D24):**

| # | Differentiator | C1 (no image/signal) | C2 (evidence) | C3 (recommendation) | C4 (independent review) |
|---|---|---|---|---|---|
| D19 | VOI Card | Structured facts + priors | Epidemiologic priors + ACR/society refs | VOI alongside options; clinician decides | Belief factors + entropy + citations |
| D20 | Pathway Co-Pilot | No pixels | ACR Appropriateness + GRADE | ≥2 pathways; click to act | Q-values, ΔH, per-step rationale |
| D21 | Federated Network | Training pipeline | Drift/calibration guards | N/A (training-time) | Model card + FL round audit log |
| D22 | DR-OPE | Analytics over logs | Method documented | N/A (descriptive) | Every metric drills to source |
| D23 | Objective Weights | No image/signal | Learned + documented | N/A (transparency surface) | Admin UI + per-factor attribution |
| D24 | Warm-Start | Priors only | Data-free + society refs | Nothing surfaced pre-calibration | Calibration curves + refs |

**Boundary lint (binding):** no file under `lib/aiie/optima/` may import an out-of-scope path; any new card/API field is rejected if its name or schema implies pixel analysis, acute-event prediction, or autonomous submission.

## 14. The twelve pain points and the buyer-by-buyer grid

**The twelve pain points** [reconstructed from the payer pitch's six bleed points + the provider-side leaks in §3]: (1) PA admin overhead (~$13B/yr industry), (2) wrong denials & the appeals tax (80.7% MA overturn), (3) site-of-service leakage (~$14M/yr per 1M lives), (4) inappropriate/low-value imaging (30–35%), (5) incidental-findings cascade ($460–$2,155/finding), (6) FWA / improper payments, (7) front-end imaging denials (20–40%), (8) never-reworked write-offs (~half of denials), (9) throughput backlog on a high-margin line, (10) prior-auth nurse burnout (AMA: ~39 PAs & ~13 hrs/physician/week), (11) provider–payer disagreement loop ($40B/yr), (12) CMS-0057-F non-compliance exposure.

**The buyer grid** [reconstructed]:

| Buyer | Pain they own | ARKA surface | Dollar lever |
|---|---|---|---|
| Hospital CFO | Imaging revenue leakage | Denial recovery + ROI dashboard | ~$3.5M/yr recovered (mid-sized) |
| Rev-Cycle Director | Denials, appeals, write-offs | Clean claim at order + specific PAS reasons | Rework labor + overturn reduction |
| CMIO | EHR integration risk | CDS Hooks / SMART-on-FHIR app | No proprietary integration |
| CMO | Appropriateness & quality | Guideline-cited recommendations | Defensible utilization |
| CQO | STAR / quality variance | DR-OPE value-proof dashboard | $80–120M per STAR point (payer) |
| ACO CFO | Total cost of care | VOI + pathway cost reduction | ≥20% cost at non-inferior yield |
| Chief Wellness Officer | Clinician burnout | Non-blocking, silent-unless-cited | Reduced PA burden |
| Payer CMO | Medical loss ratio | Inverted denial-risk engine | MLR bps improvement |
| Payer CXO/COO | PA admin G&A | 35–40% auto-approval | FTE reduction (800–1,200 for a national carrier) |
| Payer CIO | CMS-0057-F compliance | Da Vinci PAS endpoint today | 8-figure build avoided |

## 15. Payer-first GTM and the 90-day pilot

**Why payer-first:** CMS-0057-F is a Jan 1, 2027 forcing function; payers must adopt a FHIR PA rail regardless. ARKA is the cheapest path to compliance *and* produces ROI. RBMs are the highest-velocity customer (per-PA economics invert once 35–40% auto-approve). Regional/mid-sized groups close fastest on the provider side.

**The 90-day pilot** [from payer pitch §9]:
- **Days 0–14 — Discovery & baseline.** 12 months of de-identified claims/PA/appeal data; agree four metrics (imaging trend, auto-approval rate, overturn rate, member OOP variance).
- **Days 15–30 — Sandbox.** CDS Hooks discovery endpoint scoped to the network; one high-volume specialty opts in via SMART-on-FHIR; DEMO_MODE, no PHI moves.
- **Days 31–60 — Live pilot, single line of business.** Live scoring on real orders; ROI dashboard logs validation events; weekly business review.
- **Days 61–90 — Expand or no-go.** Line-item ROI report; go/no-go; if go, a 12-month rollout (Gold Card by month 4, OOP routing by month 6, full PAS by month 9 — ahead of the mandate). Architected to be cheaper than the buyer's current quarterly PA audit.

## 16. The execution roadmap, including OPTIMA O-0 → O-5

| Phase | Deliverable | Gate before advancing | Regulatory |
|---|---|---|---|
| O-0 | Dispatcher scaffold behind `ARKA_ENGINE` flag | v1 output byte-identical; fallback proven | No change |
| O-1 | Belief + VOI (D19) and HGNN encoder | Calibration Brier within target on retro lake | No change |
| O-2 | Simulator + MCTS + bandit (D20), constraints | Negative test: no acute-event semantics anywhere | No change |
| O-3 | Federated network (D21) + DR-OPE (D22) | ε-ledger enforced; DR estimator validated | No change |
| O-4 | Shadow mode at 3 sites (D24) | 30-day shadow, Brier drift < 5% | No change |
| O-5 | Mirror → opt-in A/B → default-with-override | **Pre-registered ≥15% dose / ≥20% cost at non-inferior yield** | No change (still Non-Device) |
| ~~O-6~~ | ~~Epoch 2 autonomous triage~~ | **EXCLUDED — §13 NO #8** | Would require 510(k) — not pursued |

The full OPTIMA Cursor prompt library (scaffold dispatcher + D19–D24 prompts, each with hard constraints, minimal-change discipline, explicit file paths, and a verification step) lives in `ARKA_UNICORN_STRATEGY_v3.md` §7.O and is run in this order. *(Reproduced by pointer to avoid duplicating ~200 lines of identical prompts in the same repo; the front-page revenue prompts are separate, in `ARKA_FRONTPAGE_REVENUE_CURSOR_PROMPTS.md`.)*

## 17. The seven-risk register [reconstructed]

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| 1 | **FDA reclassifies a feature as a device** | Low-Med | Hard NO-list + boundary lint; planned Q-Sub pre-submission; Epoch 2 quarantined |
| 2 | **Clinical validation thin (synthetic training data)** | Med | Rules-first/citation-first so guidelines carry the basis; retrospective validation + DR-OPE; clinical sign-off log |
| 3 | **EHR integration / Epic dependency** | Med | Standards-native (CDS Hooks/SMART/Da Vinci); no proprietary hooks; multi-EHR by design |
| 4 | **Incumbent retaliation (Epic native CDS, eviCore)** | Med | Layer *on top* of incumbents, not a rival; bilateral position none of them hold |
| 5 | **Long payer sales cycle burns runway** | Med-High | Regional/RBM wedge; CMS-0057-F forcing function; 90-day self-funding pilot |
| 6 | **Data/privacy breach or HIPAA finding** | Low | Federated DP; no raw PHI moves; redacted logs; ε-budget ledger |
| 7 | **Model drift / alert fatigue erodes trust** | Med | Empty-cards-when-silent; per-site bandit; VOI floor; weekly DR-OPE auto-rollback |

## 18. The competitive matrix [reconstructed]

| Competitor class | Example | Their position | Why ARKA wins |
|---|---|---|---|
| Imaging-AI SaMD | Aidoc, Viz.ai | Pixel-level Class II devices; 510(k); slow, capital-intensive | ARKA is Non-Device, ships today, never analyzes pixels |
| RBM | eviCore (Evernorth), Carelon MBM | Labor-intensive retrospective review | ARKA is a *layer on top* that raises their per-case margin |
| PA-UX startup | Cohere Health | UX-led, manual clinical review | ARKA is the only Da Vinci-native engine with SHAP-explained reasoning; Cohere is an acquirer or OEM customer |
| EHR-native CDS | Epic best-practice alerts | Generic, not appropriateness-grade, payer-blind | ARKA is bilateral (provider + payer), guideline-cited, explainable |
| Foundation-model entrant | Generic LLM "health copilot" | Cannot satisfy Criterion 4; cannot buy the federated dataset | ARKA's explainability + federated outcome data are unreplicable |

## 19. Pricing — three models, all accretive to the buyer

- **PMPM SaaS (plans):** $0.30–$0.50 PMPM, 3-yr term, volume tiers. Full CRD/DTR/PAS, AIIE engine, OOP routing, dashboards, all CMS-0057-F APIs. At $0.40 PMPM ($4.80 PMPY) vs. ~$15.67/member/yr gross savings → ~2.3× year-1 ROI.
- **Per-PA processed (RBMs):** $1.50–$3.00 per PA, Gold-Card auto-approval credited at $0.50; lower above 5M lives.
- **Risk share (innovative payers / pilots):** 15–25% of net imaging savings, capped at $1.00 PMPM, measured against a jointly-set baseline; ARKA does not bill on disputed savings.

## 20. Brand — Gungnir and "remARKAbly precise"

The brand thesis is **Gungnir — Odin's spear that never misses.** One platform, one standard of care, precision you can trust. The tagline **"remARKAbly precise"** carries four meanings at once: precise at the *math* (a POMDP that quantifies the value of information), the *architecture* (explainable, federated, continuously validated), the *regulatory posture* (Non-Device by design, Epoch 2 left on the shelf), and the *execution* (fast, capital-efficient). The revenue-first front page (Part II §6) leads with money — "You did the scan. Now get paid for it." — and uses the precision/Gungnir thesis as the *proof* beneath the dollar claim, not as the headline. Precision is why the claim clears; getting paid is why the CFO signs.

## 21. Closing argument — the six facts

The v2.0 five-fact case stands; OPTIMA changes two and adds a sixth.

1. **[reconstructed] The market is the appropriateness layer of U.S. medicine.** Imaging is a $140–150B paid line with $30–40B+ of documented avoidable cost stacked beneath it — and imaging is only the wedge into a $10B+ appropriateness category.
2. **[reconstructed] The timing is a regulatory earthquake in ARKA's favor.** PAMA AUC dead, CMS-0057-F live, FDA Non-Device broadened, AHIP/gold-card pressure rising (§12).
3. **Strengthened — the technical moat is a research-grade decision engine,** not a scoring table: a POMDP with a Bayesian belief kernel, AlphaZero-style MCTS, Neural-ODE/SCM counterfactual simulation, a constrained bandit, an HGNN encoder, federated DP learning, and DR-OPE — every layer explainable, every layer Non-Device. Unreplicable by a rule-engine incumbent on any near-term horizon and by a foundation-model entrant on any horizon.
4. **[reconstructed] The GTM is capital-efficient and de-risked.** Regional/RBM wedge + payer-first forcing function + a self-funding 90-day pilot; Non-Device keeps procurement at SaaS speed, not 510(k) speed.
5. **[reconstructed] The bilateral engine is a position no one else holds** — the same math on both sides of the prior-auth wall, which is what makes appeals evaporate and what no payer or provider tool can copy alone.
6. **New — ARKA proves its own value continuously, and statistically.** DR-OPE re-validates every deployed policy weekly with automatic rollback. ARKA does not *claim* it reduces radiation and cost at non-inferior yield — it *measures* it, per institution and per payer, on a live dashboard. For a CQO accountable for STAR variance, a payer CMO accountable for MLR, and an investor pricing durability, continuous proof of value is the difference between a pitch and a compounding, de-risked asset.

**The boundary that makes all of this fundable:** every gain above is achieved without analyzing a pixel, predicting a time-critical event, taking an autonomous action, or filing a 510(k). OPTIMA Epoch 1 *is* the unicorn engine; Epoch 2 is deliberately excluded because the Non-Device posture is the moat the SaMD path would trade away. **The discipline of staying Non-Device is not a limitation on the strategy. It is the strategy.**

> *remARKAbly precise* — at the math, the architecture, the regulatory posture, and the speed of execution. That combination is what unicorns are made of.

---
---

# APPENDICES

## Appendix A — Assumptions & sources for every number used

| Figure | Value | Source |
|---|---|---|
| Imaging prior-auth denial rate (many institutions) | 20–40% | Provider-reported; rising payer denial trends (AHA/Premier 2024) |
| Share of denials avoidable | ~86% | Change Healthcare Revenue Cycle Denials Index |
| Share of denied claims never reworked | ~50% | MGMA / rev-cycle reporting |
| Cost to rework a denied claim | $25–$118 | MGMA |
| Appeal overturn rate (MA, 2024) | 80.7% | KFF (Jan 2026) |
| MA PA determinations / denial / appeal rate (2024) | 53M / 6.4% / 11.5% | KFF (Jan 2026) |
| U.S. PA administrative spend | ~$13B/yr | CAQH 2024 Index |
| Cost per PA (manual / partial / electronic) | $11 / $6 / $1.88 | CAQH 2024 Index |
| Inappropriate imaging rate | 30–35% | Choosing Wisely, ACR, Health Affairs |
| Redundant imaging within 90 days | 15–20% | Peer-reviewed; AJR |
| Avg net reimbursement, advanced study | ~$900 ($450–$2,155 range) | Medicare allowed + commercial mix; HFMA |
| Incidental-finding cascade per finding | $460–$2,155 | PubMed 30300007; JAMA Network Open |
| Low-value imaging / cascade (national) | $12–30B / $3–6B per yr | v3 §5.O; ACR; Yale GHR |
| Provider–payer disagreement | $40B/yr | v3 §5.O (D23) |
| Site-of-service leakage | ~$14M/yr per 1M lives | HFMA; NIHCR; payer pitch §2 |
| STAR point value (500K-life plan) | $80–120M/yr | KFF; payer pitch §5.2 |
| Radiologist utilization growth by 2055 | +16.9–26.9% | v3 §5.O (D20) |
| OPTIMA validation target | ≥15% radiation, ≥20% cost at non-inferior yield | v3 §5.O / §10.O |
| Gold-Card / auto-approve eligibility | 35–45% | UnitedHealthcare 2024 program data |
| AIIE capture rate of at-risk orders | 60–72% | ARKA-CLIN deployment data (internal) |
| Physician PA burden | ~39 PAs & ~13 hrs/week | AMA Prior Authorization Survey |
| FTEs freed (national carrier) | 800–1,200 | Payer pitch §5.1 |
| CMS-0057-F est. 10-yr industry savings | $15B | CMS 2024 Final Rule |
| PAMA AUC program | Rescinded (42 CFR 414.94, CY2024) | CMS; Reed Smith (ED playbook) |
| ARKA fee | $0.30–$0.50 PMPM / $1.50–$3.00 per PA | ARKA pricing (payer pitch §8) |

> **Modeling note.** The §3.3 provider model uses the conservative column throughout and is aligned to the methodology in `docs/ARKA-INS_Payer_Pitch.md` §4. Every figure is a sourced range, not a point claim; the aggressive case is ~1.5×. These are decision-support economics, not a guarantee of outcomes.

## Appendix B — The ROI model, line by line

**Provider side (per regional hospital group, 120,000 advanced studies/yr)** — see §3.3 table. Derivation of Lever A: 120,000 × 0.25 (PA-required) = 30,000 PAs → × 0.25 (denied) = 7,500 denials → × 0.86 (avoidable) = 6,450 → × 0.60 (ARKA-captured) = 3,870 recovered claims → × $900 = **$3.48M.**

**Payer side (per 1,000 lives/yr, conservative)** [from payer pitch §4.1]:

| Line | Mechanism | Per 1,000 lives |
|---|---|---|
| B | PA admin saved (auto-approve 38%) | $31 |
| C | Appeal volume reduction | $15 |
| D | Appeal-overturn loss reduction | $28 |
| E | Inappropriate-imaging avoidance | $1,512 |
| F | Site-of-service leakage capture | $14,000 |
| G | Cascade-cost avoidance | $76 |
| H | FWA / improper-payment reduction | $5 |
| **Gross / 1,000 lives** | | **~$15,667** |
| Less ARKA fee ($0.40 PMPM) | | −$4,800 |
| **Net / 1,000 lives** | | **~$10,867** |

→ ~$0.91 PMPM net against a $0.40 PMPM fee = **~2.3× year-1 ROI** before soft savings (STAR, member satisfaction, compliance). Scales to **$543M** net year-1 for a ~50M-life national carrier (conservative), $815M aggressive.

## Appendix C — OPTIMA components vs. the four §520(o)(1)(E) criteria [reproduced from v3 Appendix C]

| Component (→ differentiator) | C1 no image/signal | C2 evidence basis | C3 recommendation not directive | C4 independent review | Verdict |
|---|---|---|---|---|---|
| Bayesian VOI kernel (→D19) | ✅ | ✅ priors + ACR/society | ✅ may decline | ✅ belief + entropy + citations | **Non-Device — ship** |
| Trajectory simulator (engine for D20) | ✅ | ✅ MIMIC-derived + causal | ✅ comparison, not order | ✅ path utility exposed | **Ship, fenced (no acute-event output)** |
| MCTS pathway planner (→D20) | ✅ | ✅ ACR + GRADE | ✅ ≥2 options; click to act | ✅ Q-values + rationale + citations | **Non-Device — ship** |
| Contextual bandit (engine) | ✅ | ✅ evidence-backed top-k | ✅ surfaces, never submits | ✅ off-policy correction auditable | **Non-Device — ship** |
| HGNN encoder (engine) | ✅ | ✅ curated UMLS/RadLex | n/a | ✅ feeds explainable heads | **Non-Device — ship** |
| Federated learning + DP (→D21) | ✅ training-time | ✅ drift/calibration guards | n/a | ✅ FL round audit log | **Ship (drop 510(k) framing)** |
| DR-OPE value proof (→D22) | ✅ analytics on logs | ✅ method documented | n/a | ✅ drills to source records | **Non-Device — ship** |
| Auditable objective weights (→D23) | ✅ | ✅ learned + documented | n/a | ✅ admin UI + attribution | **Non-Device — ship** |
| Warm-start bootstrap (→D24) | ✅ | ✅ data-free + society refs | ✅ nothing pre-calibration | ✅ calibration curves | **Non-Device — ship** |
| **Epoch 2 autonomous triage** | ✅ | ✅ | ❌ autonomous selection | ❌ reliance is the intent | **DEVICE / SaMD — EXCLUDE (NO #8)** |

## Appendix D — v3 → this-document crosswalk (nothing dropped)

| v3 element | Where in this document |
|---|---|
| §0.A OPTIMA verdict (take Epoch 1, exclude Epoch 2) | §9 |
| §0.B v2.0 carry-forward list | Reconstructed across §11–§18, §21 |
| §4 Five pillars + AIIE-OPTIMA seven modules | §10 |
| §5.O D19–D24 differentiators + dollar sizes | §11 (reproduced) |
| D1–D18 (referenced in v3, not printed) | §11 [reconstructed] |
| §2.4 Four-event Regulatory Earthquake | §12 |
| §3 / §3.5 Twelve pain points + buyer grid | §14 [reconstructed] |
| §6 FDA criteria / NO-list / YES-list / checklist / lint | §13 |
| §7.O OPTIMA Cursor prompt library | §16 (pointer to v3 §7.O) |
| §9 Payer-first GTM + pilot | §15 |
| §10.O Execution sequencing O-0 → O-5 | §16 |
| §8 ROI model + seven-risk register | §3.3, §15, §17, Appendix B |
| §11 Competitive matrix | §18 |
| §5.B Gungnir brand thesis / "remARKAbly precise" | §20 |
| §12 Closing — five facts → six | §21 |
| Appendix C verification table | Appendix C |
| Pricing (3 models) | §19 |

---

*ARKA is an FDA Non-Device Clinical Decision Support tool under §520(o)(1)(E) of the FD&C Act (21st Century Cures Act §3060), as clarified in FDA's CDS Software Final Guidance (Jan 6, 2026). ARKA reasons over structured clinical data and published evidence; it does not analyze medical images or signals, does not predict time-critical clinical events, and does not place orders autonomously. The ordering clinician retains full responsibility for the final decision. Dollar figures are modeled, sourced ranges (Appendix A) — decision-support economics, not a guarantee of outcomes. © 2026 ARKA Health.*

*Version 2.0 (superset) — May 29, 2026. Integrates the full ARKA_UNICORN_STRATEGY_v3.md (engine, OPTIMA Epoch 1, differentiators, regulatory guardrail, roadmap, brand) under a revenue-first frame; Epoch 2 (autonomous triage / Class II SaMD) is explicitly out of scope. The bilateral engine is the wedge; the sequential-decision engine is the moat; staying Non-Device is the strategy; getting the hospital paid is the pitch. remARKAbly precise.*
