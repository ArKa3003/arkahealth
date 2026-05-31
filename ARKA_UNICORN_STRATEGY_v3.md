# ARKA — The Unicorn Strategy

### The bilateral appropriateness engine nobody else has — now upgraded from a *scoring* engine to a *sequential-decision* engine (ARKA-OPTIMA), the part that turns "best-in-class CDS" into a quant-grade moat clinicians trust and investors cannot replicate

**Version 3.0 — May 29, 2026 — OPTIMA Integration**
**Audience:** Founder / executive team / lead engineer (Cursor seat) / Series B investors
**FDA posture (binding constraint, top of every page):** ARKA is and shall remain a **Non-Device Clinical Decision Support** function under **§520(o)(1)(E) of the FD&C Act (21st Century Cures Act §3060)**, as further clarified in **FDA's revised Clinical Decision Support Software Final Guidance, January 6, 2026.** Every element drawn from the *ARKA-OPTIMA Algorithm Specification* and added to this document has been screened against the four statutory criteria. **OPTIMA "Epoch 2" (autonomous triage → Class II SaMD / 510(k)) is explicitly OUT OF SCOPE and is on the hard NO-list in §6.3.** No feature in this strategy may be implemented in a way that breaks the Non-Device CDS boundary.

---

## What changed in v3.0 (read first)

v3.0 is v2.0 plus a single, decisive upgrade: the **AIIE engine (Pillar 2) is re-architected from a per-order scoring layer into ARKA-OPTIMA — a sequential decision engine under uncertainty (POMDP) that reasons over *pathways* of clinical action**, not single orders. Everything valuable in v2.0 is carried forward unchanged (the bilateral thesis, the four-event regulatory earthquake, the buyer grid, the eighteen differentiators D1–D18, the payer-first GTM, the seven-risk register, the brand section, the website prompts). The substantive additions are:

1. **A verdict section up front (§0.A, new).** A component-by-component ruling on what to take from the OPTIMA document and what to leave. The short version: **take all of OPTIMA Epoch 1; hard-exclude Epoch 2.** Epoch 1 is the engine. Epoch 2 is a different company with a different (and slower, more expensive) regulatory life — it would destroy the exact velocity and Non-Device moat that make ARKA fundable.
2. **Pillar 2 upgraded (§4).** AIIE → **AIIE-OPTIMA**: a Bayesian decision-theoretic kernel, personalized trajectory simulation, Monte Carlo Tree Search over imaging pathways, a constrained contextual bandit, a heterogeneous graph encoder, federated learning with differential privacy, and doubly-robust off-policy evaluation. This is the "Two Sigma–style stack," made literal.
3. **Six new differentiators (D19–D24).** Value-of-Information cards, the Sequential Pathway Co-Pilot, auditable multi-objective weights, the Federated OPTIMA Network, Continuous Value Proof (DR-OPE), and the Cold-Start Warm-Start advantage. Each is screened in the §6.5 regulatory checklist.
4. **NO-list hardened (§6.3).** Two new entries: Epoch-2 autonomous triage, and any use of the trajectory simulator to predict time-critical clinical events. Both are device functions. Neither ships.
5. **Closing argument upgraded (§12).** Fact 3 (the technical moat) is now materially stronger, and a sixth fact is added: **continuous, statistically-defensible proof of value** — the thing that converts a pilot into a renewal and a renewal into a category-defining contract.

The integration invariant, taken directly from the OPTIMA spec and made binding here: **OPTIMA slots behind the existing `scoreOrder(input): Promise<AIIEScore>` interface, emits the same `CdsCard` shape, and rolls out shadow → mirror → A/B → default. No physician ever sees a new screen.** Zero workflow change is not a nicety; it is the reason the upgrade is shippable inside the Non-Device CDS envelope without a new sales motion.

---

## 0.A The OPTIMA verdict — what to take, what to leave, and why (new in v3.0)

You asked the right question: not "is OPTIMA cool?" (it is) but "which parts of it make ARKA the most successful and profitable startup *while staying a Non-Device CDS tool*?" Here is the ruling, component by component. The test applied to every row is the same two-part test: **(1) does it move a buyer or an investor, and (2) does it survive all four §520(o)(1)(E) criteria?**

| OPTIMA component | Take it? | Why it helps ARKA win | Non-Device CDS standing |
|---|---|---|---|
| **§3 Bayesian decision-theoretic kernel — belief state + Value of Information (diagnostic entropy reduction)** | **YES — flagship** | Lets ARKA put an actual *number* on how much diagnostic information each study yields. No deployed CDS does this. It is the single most clinician-credible upgrade in the whole spec. | Safe. Reasons over structured clinical facts, never pixels; surfaces the factors driving the belief; clinician independently reviews. Criteria 1–4 all hold. → **D19** |
| **§5 Monte Carlo Tree Search over imaging *pathways* (PUCT / AlphaZero-style)** | **YES — flagship** | "Ultrasound now → MRI only if indeterminate" is how physicians actually reason; ARKA becomes the only engine that scores the *sequence*, not the single shot. This is the wow demo. | Safe **with fencing**: recommendation framing, ≥2 options surfaced, path rationale exposed, clinician click required, never acts autonomously, never an acute-event prediction. → **D20** |
| **§4 Personalized trajectory simulation (Neural ODE + Structural Causal Model)** | **YES — as the engine under D20, tightly fenced** | It is what makes pathway reasoning personalized rather than generic — the counterfactual "what if we image later" comparison. Powerful for VBC and payer buyers. | **Conditionally safe.** It must only compare the *information/utility of imaging pathways*. It must **never** output "this patient will deteriorate / have an event in N hours" — that is a time-critical prediction and a device function (see §6.3, new NO #7). Bounded, it is decision support. |
| **§6 Constrained contextual bandit (Thompson sampling + constraint projection)** | **YES — internal** | Learns *which* of the safe top-k recommendations to surface per institution/payer, cutting alert fatigue because the surfaced option fits the local reward structure. | Safe. Selection always restricted to the MCTS Pareto-defensible top-k; clinician reviews; off-policy correction keeps it honest. Folds into the engine. |
| **§7 Heterogeneous Graph Neural Network encoder (UMLS/RadLex/ICD-10/CPT)** | **YES — internal** | Richer context vector than hand-crafted factors → better calibration, lower latency than a transformer. Pure plumbing with a strong technical-diligence story. | Safe. Internal feature representation. No clinical recommendation emitted by the encoder itself. Folds into the engine. |
| **§8 Federated learning + differential privacy (FedAvg/FedProx, secure aggregation, ε-budget)** | **YES — extends Pillar 5 / D7** | The data moat: the engine gets better the more institutions it touches, and *no row-level PHI ever moves*. This is the answer to "won't a foundation-model player just out-scale you?" — they cannot buy the labeled, payer-adjudicated, multi-institution dataset. | Safe as **Non-Device training infrastructure**. (Drop OPTIMA's framing that FL docs "accompany the 510(k)" — that belongs to the excluded Epoch 2.) → **D21** |
| **§9 Doubly-Robust off-policy evaluation (DR-OPE) + weekly auto-rollback** | **YES — quietly the most valuable for fundraising** | Proves, continuously and without an RCT every quarter, that the deployed policy beats the prior one on yield/dose/cost. This is what de-risks the investment and converts a pilot into a multi-year renewal. CQOs are *measured* on exactly this. | Safe. Validation/monitoring analytics over logged decisions. No clinical recommendation surface. → **D22** |
| **§1.1 Multi-objective reward decomposition with *learned, per-institution/per-payer, surfaced* weights (diag, dose, cost, time, harm, patient-pref)** | **YES — reinforces the bilateral thesis** | Both the ordering clinician and the payer reviewer see *the same math with the same weights*. That is the v2.0 bilateral wedge, made auditable and quantitative. Sells to payer CMOs and ACO CFOs. | Safe. Transparent, admin-surfaced objective weights; SHAP-style per-factor attribution. Strengthens Criterion 4. → **D23** |
| **§11.3 / §18 Federated warm-start to beat cold-start in a new institution** | **YES — GTM accelerant** | Kills the "we have no local data yet" objection that slows every new-logo deployment. Shortens time-to-value, which shortens sales cycles. | Safe. Priors are data-free epidemiologic tables + condition-expert likelihood modules backed by ACR/specialty-society references. → **D24** |
| **§6 Epoch 2 — autonomous triage of "narrowly-scoped low-risk presentations"** | **NO — hard exclude** | Superficially tempting (full automation sounds like leverage), but it is a trap. | **Breaks the constraint.** OPTIMA itself concedes Epoch 2 "crosses the threshold into Device CDS / SaMD" requiring 510(k), a PCCP, 21 CFR 820 QMS, and IEC 62366-1 human-factors validation. That is the 12–24-month / $250K–$2M-per-indication path the entire v2.0 thesis is built on *avoiding*. → **§6.3 NO #6 (new)** |
| **§8.4 / §14.2 / §15 Phase H — the 510(k) / Class II framing throughout** | **NO — strip from the actionable plan** | Keep only as a footnoted, post-Series-C, separate-legal-entity "someday" option. | Any roadmap, technical file, or marketing surface that positions ARKA as moving to Class II contaminates the Non-Device posture and invites FDA to read the *current* product as a device-in-waiting. Quarantine it. |

**The one-paragraph answer to your question.** Almost all of OPTIMA helps — and the parts that help most (Value of Information, sequential pathway reasoning, continuous DR-OPE proof, the federated data moat) are exactly the parts that sit *comfortably* inside Non-Device CDS, because they reason over structured clinical facts, surface their basis for independent review, recommend rather than direct, and never touch a pixel. The **only** part that does not help — that actively hurts — is **Epoch 2 autonomous triage**, because it converts ARKA from a fast, capital-efficient, Non-Device software company into a slow, capital-intensive SaMD company competing with Aidoc on Aidoc's regulatory turf. Take Epoch 1 in full. Leave Epoch 2 on the page it came from, labeled "not now, not like this."

> **The v3.0 one-sentence pitch:** *ARKA is the only explainable imaging-appropriateness engine that the ordering clinician and the payer reviewer both trust — and it no longer just scores the order, it reasons over the whole pathway, quantifies the value of information of every option, and proves its own value continuously — all without analyzing a single pixel, so it ships as Non-Device CDS into any CDS-Hooks EHR today.*

---

## 0.B What is carried forward unchanged from v2.0

This document is an *upgrade*, not a replacement. To avoid duplicating a 3,500-line strategy verbatim, the following v2.0 sections remain authoritative and are referenced here rather than reprinted; nothing in v3.0 contradicts them:

- **§0 / §1** the bilateral-engine pitch and executive summary
- **§2** the competitive reality check, **§2.4** the four-event Regulatory Earthquake (PAMA AUC dead → CMS-0057-F live → FDA's Jan 2026 Non-Device CDS broadening → AHIP pledge + gold-card laws)
- **§3 / §3.5** the twelve pain points and the buyer-by-buyer pain grid (CFO, CMIO, CMO, Rev Cycle, CQO, ACO CFO, Chief Wellness Officer, payer CMO/CXO/CIO)
- **§5 / D1–D18** the existing eighteen differentiators and **§5.B** the Gungnir brand thesis
- **§7 / §7.W** the existing Cursor prompt library and website-transformation prompts
- **§8** the ROI model + seven-risk register, **§9** payer-first GTM, **§10** the roadmap, **§11** the competitive matrix

v3.0 modifies exactly four things: **Pillar 2 (§4)**, the **differentiator set (adds D19–D24)**, the **FDA NO-list and checklist (§6)**, and the **closing (§12)**. Everything else stands.

---

## 4. ARKA's defensible moat — the five pillars, with Pillar 2 upgraded to AIIE-OPTIMA

Pillars 1, 3, 4, and 5 are unchanged from v2.0 and remain the foundation: a **CDS Hooks platform in production** (Pillar 1), a **documented Non-Device CDS posture under §520(o)(1)(E)** (Pillar 3, *the single most important moat*), a **Da Vinci CRD/DTR/PAS implementation that is CMS-0057-F-ready** (Pillar 4), and **federated privacy primitives** (Pillar 5). Pillar 2 is where OPTIMA lands.

### Pillar 2 — A shared intelligence engine that powers provider-side **and** payer-side simultaneously — now AIIE-OPTIMA

The bilateral property is unchanged and remains the wedge: the *same* engine produces the clinical appropriateness view the ordering provider sees and the inverted denial-risk view the payer uses, so **there is no inconsistency to litigate** and appeal-overturn rates collapse. What v3.0 changes is *what the engine is*. v2.0's AIIE was a four-ingredient **scoring** stack (RAND/UCLA baseline + GRADE evidence + XGBoost patient-specific adaptation + SHAP explainability). That stack stays as the deterministic, always-on fallback (`ARKA_ENGINE="v1"`). On top of it, AIIE-OPTIMA reframes the problem as **sequential decision-making under uncertainty** and adds seven modules — every one chosen for a structural advantage no incumbent rule engine can replicate.

**Why this is the upgrade that matters.** A scoring model outputs `f(x) ∈ [1,9]`. It physically cannot express the core clinical trade-off — *"ultrasound now, escalate to MRI only if indeterminate"* — because it has no notion of "escalate." AIIE-OPTIMA computes expected utility along **paths** through the decision tree, which is how physicians already reason and where the clinical and economic gains actually live. The seven modules:

1. **Bayesian decision-theoretic kernel (the Value-of-Information core).** The engine maintains a *belief* over a curated, clinically-meaningful state space (≈1,500 condition labels mapped to ICD-10-CM), seeded from public epidemiologic priors and updated by Bayes as observations arrive. Its primary reward signal is **diagnostic entropy reduction** — the literal number of bits of diagnostic uncertainty each candidate study would resolve. This is **Value of Information**, the gold-standard decision-theory quantity (Pauker & Kassirer; MacKay), and *no deployed imaging CDS surfaces it.* It is observable at the moment of ordering, when diagnostic "accuracy" (a post-hoc label) is not. → powers **D19**.

2. **Personalized trajectory simulator (Neural ODE + Structural Causal Model).** A small (~10k-parameter) Neural ODE models continuous patient evolution; a Pearl-style SCM wraps it so counterfactuals — *"what would have happened if we imaged later?"* — are well-defined via do-calculus. This is what makes pathway reasoning *personalized* rather than generic. **Regulatory fence (binding):** the simulator is used **only** to compare the information/utility of imaging pathways. It must **never** emit a prediction of a time-critical clinical event (deterioration, acute event in N hours). That fence is what keeps it Non-Device (see §6.3 NO #7).

3. **Monte Carlo Tree Search over imaging pathways (PUCT / AlphaZero-style).** Sequential decisions over a small discrete action set {no-imaging, observation, labs, x-ray, ultrasound, CT(±contrast), MRI(±contrast), nuclear, PET-CT, referral, …} are the native habitat of MCTS — the same family of methods that produced superhuman play in Go and chess. 20–80 simulated roll-outs per decision fit inside the latency budget. The result is a ranked set of **pathways** with value estimates and explicit safety-constraint enforcement (cumulative radiation and cost caps via rejection-with-replacement or Lagrangian relaxation). → powers **D20**.

4. **Constrained contextual bandit (Thompson sampling + constraint projection).** From the MCTS top-k, the bandit chooses which option to surface as primary, learning the local reward structure of each institution and payer. Exploration is always clinically safe — it only ever chooses among the Pareto-defensible top-k, and it converges from ~15% to ~2% exploration after ~5,000 logged encounters. This is the mechanism that **cuts alert fatigue**: the surfaced recommendation is right *for this site and this patient* when it fires.

5. **Heterogeneous Graph Neural Network encoder.** A 2-layer relational GAT over a curated clinical knowledge graph (ICD-10-CM conditions, CPT procedures, RadLex anatomy, SNOMED findings, RxNorm medications, edges from UMLS) produces a dense 128-d context vector — richer than hand-crafted factors, better-calibrated and lower-latency than a transformer. It feeds the belief module, the MCTS policy head, and the bandit.

6. **Federated learning with differential privacy.** FedAvg/FedProx with secure aggregation and a per-institution ε-budget ledger. The engine improves the more diverse data it touches, while **no raw PHI ever leaves an institution** — only a differentially-private gradient aggregate crosses the network. → powers **D21** and extends Pillar 5 / D7.

7. **Doubly-Robust off-policy evaluation.** Because clinicians can always override, the deployment is inherently off-policy. The Dudík et al. doubly-robust estimator (unbiased if *either* the reward model or the propensity model is accurate) re-evaluates every policy version weekly against the trailing 30 days of logged decisions; a >3% drop in estimated value triggers automatic rollback. → powers **D22**.

**The quant-finance pedigree, made literal.** v2.0 described a "Two Sigma–style stack" as positioning. v3.0 makes it the actual architecture: **POMDP formulation, AlphaZero-style MCTS, Bayesian belief tracking, constrained Thompson-sampling bandits, multi-objective Pareto optimization across diagnostic yield / radiation / cost / time / harm, and doubly-robust counterfactual evaluation.** This is the part of the story that makes a technical partner at a top fund lean forward — it is a research-grade decision engine, not a rules table with an AI label. And critically, **every layer remains explainable**: belief updates, VOI numbers, path Q-values, and per-factor SHAP-style attributions are all surfaced, which is precisely what satisfies Criterion 4 and what a black-box neural net or a pure LLM cannot do under Non-Device CDS.

**Why this also blocks the foundation-model competitor — harder than before.** An LLM-based reasoner still cannot produce a deterministic, auditable explanation surface (Criterion 4), still cannot survive regulatory-grade appeal scrutiny, and now also cannot reproduce the **federated, payer-adjudicated, multi-institution outcome dataset** that AIIE-OPTIMA accumulates and that DR-OPE continuously validates. That dataset is not for sale. LLMs remain a *feature* ARKA partners with for the chat layer (the D15 P2P assistant), not the engine.

**Zero-workflow-change guarantee (the reason this is shippable).** OPTIMA lives entirely behind the existing public interface `scoreOrder(input: AIIEInput): Promise<AIIEScore>`. The CDS client sees the same POST endpoint, the same `CdsCard` shape, the same override buttons. New output is **additive only**: a "Path-level rationale" section in `card.detail`, top-3 actions mapped to FHIR `ServiceRequest`s in `card.suggestions` (exactly as today), and a "Why this path?" link opening the existing evidence modal with a new "Path simulation" tab. Roll-out is staged — **shadow → mirror → opt-in A/B → default-with-override** — and at every stage the discovery payload, FHIR prefetch template, and card schema are unchanged. If any module times out or errors, the system falls back to AIIE v1 with a `fallback=true` audit tag. The physician never sees a new screen.

---

## 5.O The six OPTIMA-derived differentiators (D19–D24, new in v3.0)

These extend the eighteen v2.0 differentiators (D1–D18, unchanged). Each follows the v2.0 structure: (a) the pain it removes, (b) the dollar size, (c) what it does, (d) why it stays inside §520(o)(1)(E), and (e) the Cursor prompt pointer in §7.O. Implementing D19–D22 is the technical-moat upgrade that re-rates the company in diligence; D23–D24 are the buyer-facing and GTM accelerants.

### D19. The Value-of-Information Card (OPTIMA §3)

- **Pain it removes:** inappropriate / low-value imaging ($12–30B/yr U.S.) and the cascade from incidental findings ($3–6B/yr). Today a clinician sees a 1–9 appropriateness score with no sense of *how much the study will actually tell them*.
- **What it does:** alongside the existing appropriateness score, the card shows the **expected diagnostic information** each candidate study yields — e.g., *"Ultrasound resolves ~0.82 of current diagnostic uncertainty; MRI resolves ~0.86 but adds 7 days and 4× cost."* Computed as the entropy reduction `H(bₜ) − H(bₜ₊₁)` of the Bayesian belief. Low-VOI studies are flagged so the clinician can defer or down-tier with one click.
- **Dollar size for the buyer:** every avoided low-yield advanced study is $400–$2,155 in direct + cascade cost; at an ACO running 300K studies/yr even a single-digit-percent shift is multi-million-dollar.
- **Non-Device framing:** reasons over structured clinical facts and published priors only (Criterion 1, 2); presents a recommendation the clinician can decline (Criterion 3); the belief factors and citations are exposed for independent review (Criterion 4). No pixels, no acute-event prediction.

### D20. The Sequential Pathway Co-Pilot (OPTIMA §4–§6) — the flagship

- **Pain it removes:** the radiologist-shortage/throughput crisis (+16.9–26.9% utilization by 2055), wrong-modality-first ordering, and the avoidable-escalation tax — all at once.
- **What it does:** instead of scoring a single order, it surfaces the top **pathways** — *"Option A: ultrasound now, escalate to MRI only if indeterminate (Q = 0.82). Option B: MRI now (Q = 0.77) — marginally higher yield, +7 days, +4× cost."* The MCTS plans the sequence; the trajectory simulator personalizes it; the bandit picks the primary surfaced option; radiation and cost caps are enforced as hard constraints. The card looks like today's AIIE card — the novelty is a richer, opt-in "Why this path?" rationale.
- **Dollar size for the buyer:** this is the differentiator that lets ARKA claim, with pre-registered validation (§13 of the OPTIMA spec), **≥15% cumulative radiation reduction and ≥20% cost reduction at non-inferior diagnostic yield**. Those two numbers are the headline of every payer and ACO pitch.
- **Non-Device framing (fenced):** recommendation framing with ≥2 options (or single-option enforcement discretion per the Jan 2026 guidance); clinician click required to act; path rationale and citations exposed (Criterion 4); the simulator compares pathway utility only and **never** predicts a time-critical event (§6.3 NO #7). No pixels.

### D21. The Federated OPTIMA Network (OPTIMA §8) — the data moat

- **Pain it removes:** the cold, structural problem that the engine needs diverse data to improve but no institution will share PHI, and the foundation-model threat.
- **What it does:** extends D7 from federated *denial-pattern* learning to federated learning of the full OPTIMA belief/value models — FedAvg/FedProx, secure aggregation, per-institution ε-budget ledger (default ε = 1.0, δ = 1e-6/week), trimmed-mean aggregation against gradient poisoning. Each site keeps a private fine-tuning head it never shares.
- **Dollar / strategic size:** this is the compounding moat. Every new ARKA-CLIN site and every ARKA-INS payer deployment makes the engine better for all sites **without anyone shipping a patient record** — a labeled, payer-adjudicated, multi-institution dataset that money cannot buy and an LLM cannot synthesize.
- **Non-Device framing:** pure training infrastructure; the runtime card is unchanged. (Note: strip OPTIMA §8.4's "accompanies the 510(k)" language — that belongs to the excluded Epoch 2.)

### D22. Continuous Value Proof — DR-OPE (OPTIMA §9) — the fundraising and renewal weapon

- **Pain it removes:** the "does this actually work / will it keep working?" question that stalls pilots, blocks renewals, and makes investors discount the model.
- **What it does:** every deployed policy version is re-scored weekly against the trailing 30 days of real decisions using the doubly-robust estimator; a >3% value drop auto-rolls-back to the prior version. The result is a living, auditable dashboard (under the existing `/ins/dashboard`) showing yield, radiation, cost, appeals, and override rate over time — per institution and per payer.
- **Dollar size for the buyer:** a single MA STAR-rating point on a 500K-life plan is worth $80–120M/yr in quality bonus; CQOs are measured on exactly the variance-reduction this dashboard quantifies. For investors, continuous statistically-defensible proof of value is the difference between a story and a de-risked compounding asset.
- **Non-Device framing:** descriptive/validation analytics over logged decisions; no clinical recommendation surface; every metric drills to source records (Criterion 4 spirit).

### D23. Auditable Multi-Objective Weights (OPTIMA §1.1) — reinforces the bilateral thesis

- **Pain it removes:** the provider–payer disagreement loop ($40B/yr) survives partly because the two sides argue over *unstated* trade-offs.
- **What it does:** the engine's objective — `α·ΔInfo − β·dose − γ·cost − δ·time − ε·harm + ζ·patientPref` — uses **learned, per-institution and per-payer weights that are surfaced in the admin UI**. The ordering clinician and the payer reviewer literally see the same objective with the same weights. "Optimal" stops being a black box and becomes a negotiated, transparent contract term.
- **Dollar size for the buyer:** sells directly to payer CMOs and ACO CFOs, who can set and audit the cost/dose/yield trade-off they are accountable for — and it is what makes a shared engine *credible* to both sides of the table.
- **Non-Device framing:** transparent objective weights + per-factor attribution strengthen Criterion 4; no image/signal analysis.

### D24. Cold-Start Warm-Start (OPTIMA §11.3, §18) — the GTM accelerant

- **Pain it removes:** the "we have no local data yet" objection that lengthens every new-logo sales cycle and delays time-to-value.
- **What it does:** a new institution boots on the federated warm-start plus data-free epidemiologic priors and ACR/specialty-society-backed condition-expert likelihood modules, then runs a 30-day shadow mode before surfacing anything. The site gets a credible engine on day one and a locally-tuned one within weeks.
- **Dollar / strategic size:** shorter sales cycles and faster pilot-to-paid conversion directly raise net-new ARR velocity — the metric that most moves a Series B valuation.
- **Non-Device framing:** priors and reference modules are published-evidence-based (Criterion 2); shadow mode means nothing is surfaced to a clinician until calibrated.

---

## 6. The FDA Non-Device CDS guardrail — OPTIMA additions

§6.1 (the four §520(o)(1)(E) criteria) and §6.2 (the Jan 6, 2026 final-guidance changes) are unchanged from v2.0 and remain binding. v3.0 hardens the NO-list and extends the per-differentiator checklist. **This section is binding on every Cursor prompt in §7.O. Have it open during code review.**

### 6.3 The hard NO-list — two OPTIMA-specific entries added

The v2.0 NO-list stands in full (no pixel-level image analysis; no IVD signal processing; no time-critical alerting acted on before clinician review; no autonomous order placement; no pediatric-dosing / oncology-regimen SaMD categories; no patient-direct diagnostic outputs). v3.0 adds two entries drawn directly from the OPTIMA spec:

7. **No use of the trajectory simulator (Neural ODE + SCM) to predict a time-critical clinical event.** The simulator exists *only* to compare the information/utility of imaging pathways. It must **never** emit, surface, or log as a recommendation any statement of the form "this patient will deteriorate / have an acute event in the next N hours." Per the Jan 6, 2026 guidance, software predicting time-critical events is a device. The 72-hour horizon is an internal utility-comparison construct, not a clinical-deterioration forecast, and no card, modal, or API field may present it as one. A CI lint must reject any OPTIMA output field whose semantics imply acute-event prediction.

8. **No OPTIMA "Epoch 2" autonomous triage — do not implement, do not prototype, do not market.** OPTIMA's own §6/§14.2/§15-Phase-H proposes autonomous triage of "narrowly-scoped low-risk presentations," which it concedes "crosses the threshold into Device CDS / SaMD" requiring 510(k) clearance, a Predetermined Change Control Plan, 21 CFR 820 QMS, and IEC 62366-1 human-factors validation. That is precisely the 12–24-month, $250K–$2M-per-indication, velocity-killing path the entire strategy is built to avoid. **Every OPTIMA recommendation requires an affirmative clinician click; the engine never auto-selects and submits an order.** Any 510(k) / Class II framing is removed from all roadmaps, technical files, and marketing surfaces. If a customer or investor asks for autonomy, the answer is: "that is a separate, later, separately-capitalized regulatory program — not this product."

### 6.4 The hard YES-list — unchanged, with one OPTIMA addition

All five v2.0 YES-list items stand (FDA Non-Device banner on every page; standard CDS card footer; evidence citation on every recommendation; SHAP/per-feature explanation on demand; `SCOPE_BOUNDARY.md` updated for every new in-scope directory). Added:

6. **Every OPTIMA path-level output must carry path rationale + Q-value provenance + the per-objective weight vector used,** so the clinician can independently review not just the score but the *sequence logic* and the *trade-off weights* behind it. This is the Criterion-4 surface for sequential recommendations.

### 6.5 Per-differentiator regulatory checklist — D19–D24

Extends the v2.0 D1–D18 checklist. Every cell must remain true through implementation; the §7.O Cursor prompts require the prompt-receiver to verify the cell before committing.

| # | Differentiator | Criterion 1 (no image/signal) | Criterion 2 (evidence) | Criterion 3 (recommendation) | Criterion 4 (independent review) |
|---|---|---|---|---|---|
| D19 | Value-of-Information Card | Structured facts + priors only; no pixels | Epidemiologic priors + ACR/specialty refs per likelihood module | VOI presented alongside options; clinician decides | Belief factors + entropy math + citations exposed |
| D20 | Sequential Pathway Co-Pilot | No pixels; structured context only | ACR Appropriateness Criteria + GRADE evidence layer | ≥2 pathways ranked (or single-option discretion); clinician click to act | Path Q-values, ΔH, per-step rationale + citations in "Why this path?" |
| D21 | Federated OPTIMA Network | Training pipeline; runtime card unchanged | Catalogue-drift + calibration guards | N/A (training-time) | Model card + FL round audit log versioned per retrain |
| D22 | Continuous Value Proof (DR-OPE) | Analytics over logged decisions; no signal | DR-OPE methodology documented in dashboard | N/A (descriptive/validation analytics) | Every metric drills to source records |
| D23 | Auditable Multi-Objective Weights | Objective-weight surfacing; no image/signal | Weights learned from outcomes; methodology documented | N/A (transparency surface on existing recommendations) | Admin UI shows per-institution/per-payer weights + per-factor attribution |
| D24 | Cold-Start Warm-Start | Priors/reference modules only; no pixels | Data-free epidemiologic priors + ACR/society-backed likelihoods | Nothing surfaced until 30-day shadow calibration | Calibration curves + source references visible |

**Boundary lint requirement (binding):** the existing CI scope-boundary lint must be extended so that no file under `lib/aiie/optima/` imports from any out-of-scope path, and so that any new card/API field is rejected if its name or schema implies pixel analysis, acute-event prediction, or autonomous submission.

---

## 7.O OPTIMA Cursor Prompt Library (D19–D24)

These mirror the exact format of the existing `CURSOR_PROMPT_action_plan.md` and the §7 prompts: hard constraints up top, minimal-change discipline, explicit file paths, scope-boundary obedience, FDA Non-Device CDS language baked into every user-facing surface, and a verification step at the end. They assume the OPTIMA scaffold from the spec's §16 (`lib/aiie/optima/*`, the `ARKA_ENGINE` dispatcher in `scoring-engine.ts`). Run them in order; each is additive.

### 7.O.0 Cursor Prompt — Scaffold the OPTIMA dispatcher (do this first)

```
You are working in the existing Next.js 16 / React 19 / Tailwind v4 ARKA Health codebase. Repo root is the open folder.

## Hard constraints — read before doing anything
1. ADDITIVE ONLY. Do NOT change the behavior of the shipped v1 engine. The public interface
   `scoreOrder(input: AIIEInput): Promise<AIIEScore>` MUST keep returning identical output when
   `process.env.ARKA_ENGINE !== "optima"`. This is a regression-test gate, not a guideline.
2. The CDS Hooks discovery payload, FHIR prefetch templates, and the CdsCard schema MUST NOT change.
   All OPTIMA output is mapped onto the EXISTING CdsCard shape (additive fields only).
3. FDA Non-Device CDS posture is binding (docs/REGULATORY_RATIONALE_MEMO.md, §520(o)(1)(E)). No pixel
   analysis, no IVD signals, no time-critical event prediction, no autonomous submission. Every
   recommendation requires an affirmative clinician click.
4. TypeScript strict, JSDoc on every export, `@/...` alias, no `any`, shadcn + Tailwind only.
   Inference must be CPU-only and stay under the existing p95 latency budget; if a module exceeds
   budget, fall back to v1 with a `fallback=true` validation event.

## Step 1 — Scope boundary
Open docs/SCOPE_BOUNDARY.md. Add to "In-scope": all code under `lib/aiie/optima/`, the admin routes
`app/api/ins/optima/evaluate/route.ts` and `app/api/ins/optima/fl/round/route.ts`. Note explicitly
that `lib/aiie/optima/simulator.ts` is restricted to pathway-utility comparison and MUST NOT expose
acute-event prediction.

## Step 2 — Dispatcher
In `lib/aiie/scoring-engine.ts`, make `scoreOrder` a dispatcher: if `ARKA_ENGINE === "optima"`
delegate to `lib/aiie/optima/kernel.ts`; otherwise call the existing v1 kernel unchanged. Create the
`lib/aiie/optima/` folder with stubs: kernel.ts, belief.ts, simulator.ts, mcts.ts, bandit.ts,
hgnn.ts, ope.ts, constraints.ts, federated/{client.ts,aggregator.ts}. Add `lib/types/optima.ts`
(BeliefState, RolloutPath, CandidateAction, ObjectiveWeights).

## Step 3 — Fallback + compliance one-liner
Ensure kernel.ts wraps every module call in try/catch that returns the v1 result tagged
`fallback=true`. Reuse the existing FDA Non-Device disclosure constant from lib/cards/card-shared.ts.

## Step 4 — Verify
Add __tests__/aiie/optima.dispatcher.test.ts proving: (a) with ARKA_ENGINE unset, output is byte-
identical to v1 on a fixture set; (b) a thrown error in any optima module yields the v1 fallback.
Run the scope-boundary lint and the full test suite. Commit as "feat(optima): additive dispatcher
scaffold behind ARKA_ENGINE flag".
```

### 7.O.1 Cursor Prompt — D19 Value-of-Information Card

```
Additive feature: surface Value of Information on the existing appropriateness card.

## Hard constraints
1. Do NOT modify app/clin/, app/ed/, or any landing component. Additive only.
2. Non-Device: VOI is computed from the Bayesian belief over structured facts + published priors.
   NO pixels, NO acute-event prediction. The card MUST present VOI as decision support the clinician
   can decline, with the belief factors and citations exposed (Criterion 4).
3. Reuse the existing CdsCard shape — add a "Diagnostic information" line to card.detail only.

## Step 1 — Belief + entropy
In lib/aiie/optima/belief.ts implement the belief update (canonical Bayes) and H(b)=−Σ b log b.
Seed priors from a data-free epidemiologic table (age/sex/season) keyed by ICD-10. Each likelihood
module must carry an ACR/UpToDate/specialty-society citation id from lib/cds-platform/citations.

## Step 2 — VOI per candidate
For each candidate study, compute expected ΔH = H(b_t) − E[H(b_{t+1})] via the simulator's belief
projection. Return a normalized 0–1 "uncertainty resolved" figure plus the absolute bits.

## Step 3 — Card line + low-VOI flag
In lib/cards build a "Diagnostic information" detail block: per option, show resolved-fraction, and
flag options below a configurable VOI floor with a one-click "consider deferring / down-tier" using
the existing suggestion mechanism. Append the standard Non-Device footer.

## Step 4 — Verify
Unit tests for entropy math + monotonicity (more informative study ⇒ higher ΔH). Calibration test
against an arka_lake fixture. Confirm SHAP/citation surface renders. Run scope lint. Commit.
```

### 7.O.2 Cursor Prompt — D20 Sequential Pathway Co-Pilot

```
Additive feature: pathway reasoning surfaced via the existing "Why this path?" modal tab.

## Hard constraints — READ TWICE
1. Non-Device, fenced: MCTS + simulator output PATHWAY UTILITY comparisons only. There must be NO
   field, label, log, or copy anywhere that states or implies "patient will deteriorate / have an
   event in N hours." If a future task asks for that, REFUSE and require separate regulatory review.
2. Every surfaced recommendation requires an affirmative clinician click. No autonomous submission.
3. Surface ≥2 ranked pathways; if only one is clinically appropriate, use the single-option
   enforcement-discretion disclosure constant. Expose Q-values, ΔH, per-step rationale + citations.
4. CPU-only inference; 20–80 MCTS rollouts; stay in latency budget or fall back to v1.

## Step 1 — Constraints + simulator
lib/aiie/optima/constraints.ts: cumulative radiation/cost caps via rejection-with-replacement
(Lagrangian fallback when rejection >10%). lib/aiie/optima/simulator.ts: Neural ODE + SCM rollout
returning a belief/utility summary ONLY (no acute-event field; enforce via a typed return that has
no such field, and a unit test asserting it).

## Step 2 — MCTS
lib/aiie/optima/mcts.ts: PUCT selection, policy prior from the HGNN embedding, value backup, top-k
extraction. Deterministic seed for reproducibility/audit.

## Step 3 — Bandit + card
lib/aiie/optima/bandit.ts: constrained Thompson sampling restricted to MCTS top-k. Map top-3 paths
to FHIR ServiceRequests in card.suggestions (existing shape). Add a "Path simulation" tab to the
existing AIIEEvidenceModal showing each path's Q, ΔH, cost, dose, time, and citations.

## Step 4 — Verify
Tests: constraint enforcement (no path violates caps), top-k ranking stability, modal renders path
rationale + citations, and a NEGATIVE test asserting no acute-event semantics exist in any output
type. Run scope + boundary lint. Commit.
```

### 7.O.3 Cursor Prompt — D21 Federated OPTIMA Network

```
Extend D7 federated learning to the OPTIMA belief/value models.

## Hard constraints
1. Training infrastructure only. Runtime card output unchanged. No 510(k)/Class II language anywhere
   (that is excluded Epoch 2). No raw PHI crosses the network — only DP gradient aggregates.
2. Per-institution ε-budget ledger (default ε=1.0, δ=1e-6/week), enforced at the aggregator with a
   429 on overflow. Trimmed-mean aggregation + signed per-institution attestations.

## Step 1 — Client
lib/aiie/optima/federated/client.ts: local one-epoch train, gradient clip, additive secret-share
mask, DP noise. FedProx proximal term for heterogeneity. Per-institution fine-tuning head never
shared.

## Step 2 — Aggregator
lib/aiie/optima/federated/aggregator.ts + app/api/ins/optima/fl/round/route.ts (admin-only): secure
sum, trimmed mean, ε-ledger debit, audit row to supabase migration 041_arka_lake_fl_rounds.sql.

## Step 3 — Verify
Tests: aggregator never sees an unmasked update; ε overflow returns 429; poisoned-gradient is
trimmed. Run scope lint. Commit.
```

### 7.O.4 Cursor Prompt — D22 Continuous Value Proof (DR-OPE)

```
Additive admin/analytics surface. No clinician-facing recommendation change.

## Hard constraints
1. Descriptive/validation analytics only — NOT a clinical recommendation surface (no Criterion-3
   output). Lives under the existing /ins/dashboard.
2. Every metric must drill to source logged decisions.

## Step 1 — Estimator
lib/aiie/optima/ope.ts: Dudík et al. doubly-robust estimator with IPS clipping. Weekly job
re-evaluates each deployed policy version against trailing 30 days from arka_lake.evaluations
(migration 040). >3% value drop writes a rollback recommendation event.

## Step 2 — Dashboard
Add a "Value Proof" panel to /ins/dashboard: yield, radiation, cost, appeals, override-rate trends
by institution and payer, each with a drill-through to source records. Document the DR-OPE method
inline.

## Step 3 — Verify
Tests: DR estimator unbiased on a synthetic logged dataset where either Q̂ or p̂ is correct; rollback
event fires on a >3% drop fixture. Run scope lint. Commit.
```

### 7.O.5 Cursor Prompt — D23 Auditable Multi-Objective Weights

```
Additive transparency surface for the OPTIMA objective weights.

## Hard constraints
1. No image/signal analysis. Surfacing learned weights strengthens Criterion 4; it does not create a
   new recommendation type.
2. Weights are per-institution and per-payer, learned from outcomes, and read-only in clinician views
   (editable only by an authorized payer/institution admin within bounded ranges).

## Step 1 — Type + store
lib/types/optima.ts ObjectiveWeights {alphaInfo,betaDose,gammaCost,deltaTime,epsilonHarm,zetaPref}.
Persist per-institution/per-payer with effective dates.

## Step 2 — Admin UI + card provenance
Admin UI panel showing current weights + per-factor attribution for a sample order. Add the active
weight vector + version to the D20 "Why this path?" provenance block.

## Step 3 — Verify
Tests: weights surfaced match weights used in scoring; admin edits are range-bounded and audited.
Run scope lint. Commit.
```

### 7.O.6 Cursor Prompt — D24 Cold-Start Warm-Start

```
Additive deployment-bootstrap path for new institutions.

## Hard constraints
1. Nothing is surfaced to a clinician until a 30-day shadow-mode calibration completes for the site.
2. Priors and condition-expert likelihood modules are data-free and published-evidence-backed
   (Criterion 2). No PHI required to bootstrap.

## Step 1 — Warm-start loader
On first deploy, initialize belief priors from the epidemiologic tables + federated warm-start
weights (D21). Mark the site `shadow=true`.

## Step 2 — Shadow gate
Block any clinician-facing OPTIMA card while `shadow=true`; log what OPTIMA would have said to
arka_lake.evaluations. Auto-flip to mirror mode after 30 days IF calibration Brier drift < 5%.

## Step 3 — Verify
Tests: no OPTIMA card renders while shadow=true; auto-flip respects the Brier gate. Run scope lint.
Commit.
```

---

## 10.O Execution sequencing for the OPTIMA upgrade

This slots into the v2.0 §10 roadmap without disturbing the payer-first GTM. The discipline is OPTIMA's own staged roll-out — the regulatory safety of the whole upgrade depends on it.

| Phase | Deliverable | Gate before advancing | Regulatory |
|---|---|---|---|
| O-0 | Dispatcher scaffold behind `ARKA_ENGINE` flag (7.O.0) | v1 output byte-identical; fallback proven | No change |
| O-1 | Belief + VOI (D19) and HGNN encoder | Calibration Brier within target on retro lake | No change |
| O-2 | Simulator + MCTS + bandit (D20), constraints | Negative test: no acute-event semantics anywhere | No change |
| O-3 | Federated network (D21) + DR-OPE (D22) | ε-ledger enforced; DR estimator validated | No change |
| O-4 | Shadow mode at 3 sites (D24) | 30-day shadow, Brier drift < 5% | No change |
| O-5 | Mirror → opt-in A/B → default-with-override | Pre-registered ≥15% dose / ≥20% cost at non-inferior yield | No change (still Non-Device) |
| ~~O-6~~ | ~~Epoch 2 autonomous triage~~ | **EXCLUDED — see §6.3 NO #8** | Would require 510(k) — not pursued |

The pre-registered O-5 endpoints are the deliverable that converts the engineering into the investor headline and the payer contract: **statistically-defensible reductions in radiation and cost at non-inferior diagnostic yield, proven continuously by DR-OPE.**

---

## 12. Closing argument — the five facts become six

The v2.0 five-fact case stands. OPTIMA changes two of them.

**Fact 3, strengthened — the technical moat is now a research-grade decision engine, not a scoring table.** The engine is no longer "RAND/UCLA + GRADE + XGBoost + SHAP." It is a **POMDP solved with a Bayesian belief kernel, AlphaZero-style MCTS over imaging pathways, Neural-ODE/SCM counterfactual simulation, a constrained Thompson-sampling bandit, an HGNN clinical-knowledge encoder, federated learning under differential privacy, and doubly-robust off-policy evaluation** — every layer explainable, every layer Non-Device. This is the genuinely defensible "Two Sigma–style stack," and it is unreplicable by a rule-engine incumbent on any near-term horizon and by a foundation-model entrant on any horizon (they cannot satisfy Criterion 4, and they cannot buy the federated outcome dataset).

**Fact 6, new — ARKA proves its own value continuously, and statistically.** Doubly-robust off-policy evaluation means every deployed policy is re-validated weekly against real decisions, with automatic rollback on regression. ARKA does not *claim* it reduces radiation and cost at non-inferior yield — it *measures* it, per institution and per payer, on a live auditable dashboard. For a CQO accountable for STAR variance, for a payer CMO accountable for MLR, and for an investor pricing durability, continuous proof of value is the difference between a pitch and a compounding, de-risked asset. It is also the single best defense against churn: a renewal conversation where the dashboard already shows the dollars saved is not a competitive evaluation.

**The boundary that makes all of this fundable.** Every gain above is achieved without analyzing a pixel, without predicting a time-critical event, without an autonomous action, and without a 510(k). OPTIMA Epoch 1 *is* the unicorn engine. OPTIMA Epoch 2 is explicitly excluded precisely because the Non-Device CDS posture — the velocity, the capital efficiency, the regulatory clearance to ship into any CDS-Hooks EHR today — is the moat that the SaMD path would trade away. **The discipline of staying Non-Device is not a limitation on the strategy. It is the strategy.**

**And imaging is still just the wedge.** The same sequential-decision engine that reasons "ultrasound now → MRI only if indeterminate" is the architecture that, in three to five years, reasons over a specialty-drug step-therapy pathway, an elective-surgery decision against a recovery-likelihood benchmark, any expensive medical decision against the evidence — the $10B+ appropriateness layer of American medicine. AIIE-OPTIMA is the most defensible reason to believe ARKA is the company that consolidates it.

> *remARKAbly precise* — at the math (a POMDP that quantifies the value of information), at the architecture (explainable, federated, continuously validated), at the regulatory posture (Non-Device by design, Epoch 2 deliberately left on the shelf), and at the speed of execution. That combination is what unicorns are made of.

---

## Appendix C — Verification: every included OPTIMA component vs. the four §520(o)(1)(E) criteria

A final audit. Each *included* (Epoch 1) component is checked against all four criteria; the *excluded* item is shown failing the test that disqualifies it.

| Component (→ differentiator) | C1: no image/signal | C2: published-evidence basis | C3: recommendation, not directive | C4: independent review of basis | Verdict |
|---|---|---|---|---|---|
| Bayesian VOI kernel (→D19) | ✅ structured facts only | ✅ epidemiologic priors + ACR/society refs | ✅ clinician may decline | ✅ belief factors + entropy + citations shown | **Non-Device — ship** |
| Trajectory simulator (engine for D20) | ✅ no pixels | ✅ MIMIC-derived + causal refs | ✅ comparison, not order | ✅ path utility exposed | **Non-Device — ship, fenced (no acute-event output)** |
| MCTS pathway planner (→D20) | ✅ no pixels | ✅ ACR + GRADE | ✅ ≥2 options / single-option discretion; click to act | ✅ Q-values + per-step rationale + citations | **Non-Device — ship** |
| Contextual bandit (engine) | ✅ selection logic | ✅ restricted to evidence-backed top-k | ✅ surfaces, never submits | ✅ off-policy correction auditable | **Non-Device — ship** |
| HGNN encoder (engine) | ✅ feature representation | ✅ curated UMLS/RadLex graph | n/a (no recommendation) | ✅ embeddings feed explainable heads | **Non-Device — ship** |
| Federated learning + DP (→D21) | ✅ training-time | ✅ drift/calibration guards | n/a (training-time) | ✅ FL round audit log | **Non-Device — ship (drop 510(k) framing)** |
| DR-OPE value proof (→D22) | ✅ analytics on logs | ✅ method documented | n/a (descriptive) | ✅ drills to source records | **Non-Device — ship** |
| Auditable objective weights (→D23) | ✅ no image/signal | ✅ learned + documented | n/a (transparency surface) | ✅ admin UI + per-factor attribution | **Non-Device — ship** |
| Warm-start bootstrap (→D24) | ✅ priors only | ✅ data-free epidemiologic + society refs | ✅ nothing surfaced pre-calibration | ✅ calibration curves visible | **Non-Device — ship** |
| **Epoch 2 autonomous triage** | ✅ (no pixels) | ✅ | ❌ **autonomous selection/submission — the clinician is no longer the decider** | ❌ **reliance is the intent** | **DEVICE / SaMD — EXCLUDE (NO #8)** |

Epoch 2 fails Criteria 3 and 4 by design: autonomy means the clinician is intended to rely on the output to make the decision, which is the precise statutory line between Non-Device CDS and a device. That is why it is excluded — not as a matter of caution, but as a matter of law.

---

*ARKA is an FDA Non-Device Clinical Decision Support tool under Section 520(o)(1)(E) of the FD&C Act (21st Century Cures Act §3060), as further clarified in FDA's Clinical Decision Support Software Final Guidance issued January 6, 2026. AIIE-OPTIMA reasons over structured clinical data and published evidence; it does not analyze medical images or signals, does not predict time-critical clinical events, and does not place orders autonomously. The ordering clinician retains full responsibility for the final decision. © 2026 ARKA Health.*

*Version 3.0 — May 29, 2026. Integrates ARKA-OPTIMA Epoch 1 into the v2.0 Unicorn Strategy; Epoch 2 (autonomous triage / Class II SaMD) is explicitly out of scope. The bilateral engine is the wedge; the sequential-decision engine is the moat; staying Non-Device is the strategy. remARKAbly precise.*
