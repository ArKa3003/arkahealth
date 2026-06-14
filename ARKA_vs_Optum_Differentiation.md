# ARKA vs. Optum — Differentiation Brief

**Date:** 2026-06-13
**Question:** Is ARKA too much like Optum? Where is ARKA genuinely different — and better?

---

## The honest starting point

Your worry is well-founded. Optum is not adjacent to ARKA — it operates directly in all three of ARKA's lanes:

| ARKA product | Optum's competing product |
|---|---|
| ARKA-CLIN (imaging CDS at point of order) | **CareSelect® Imaging** |
| ARKA provider denial-risk / clean-claim | **Digital Auth Complete** (powered by Humata Health) |
| ARKA-INS (payer-side appropriateness / PAS) | **InterQual® Auth Accelerator** |

And Optum closed much of the obvious gap in early 2026: Digital Auth Complete and InterQual Auth Accelerator both launched with "AI-powered," "EHR-embedded," "CMS-0057-ready," "human-in-the-loop" messaging — the same words on ARKA's homepage. So "we use AI for prior auth" is **no longer** a differentiator. ARKA cannot win on that claim.

What ARKA *can* win on is structural — things Optum either hasn't built or, more importantly, **cannot build without contradicting what it is.** Those are below.

---

## The seven real differences

### 1. ARKA scores the *patient*. CareSelect scores the *order against a table.*
Optum's imaging engine, CareSelect Imaging, is a digitized lookup of the **ACR Appropriateness Criteria** — a 1-to-9 score from Boolean rules tied to a few structured fields. It originated as ACR Select (ACR + National Decision Support Company) and is still rules-based, not learned. ARKA's AIIE applies **patient-specific ML scoring on live FHIR context** (published AUC 0.876–0.942). Two patients with the same indication get the same CareSelect score; ARKA can separate them by age, comorbidity, prior imaging, and local risk. **Better because:** appropriateness is patient-level, not category-level.

### 2. ARKA explains every score. CareSelect hands back a number.
ARKA attaches **SHAP-transparent reasoning** — each factor in each score is attributed and auditable — and links every output to the **Evidence Library** (first-party citations). CareSelect returns a 1–9 with the ACR criterion behind it; there is no patient-level "why this score." **Better because:** a clinician (and an auditor, and a regulator) can independently verify the basis of every recommendation. This is also what keeps ARKA cleanly inside Non-Device CDS (§520(o)(1)(E), no 510(k)) even though it uses ML.

### 3. One engine on both sides — the thing no one else has.
This is ARKA's defensible "no other company does this." Optum uses **two different products built on two different technologies** for the two sides of the same decision: Digital Auth Complete (Humata Health) for providers, InterQual Auth Accelerator for payers. They are not the same model, so the provider and the payer are still grading against different rulers — which is exactly how a justified scan gets denied six weeks later. ARKA runs the **same patient-specific appropriateness model on both sides.** Provider and payer see the identical answer at the moment of order. That symmetry — not "AI PA" — is the genuinely novel architecture.

### 4. Independence. Optum *is* the payer.
Optum is a UnitedHealth Group subsidiary — the largest U.S. insurer. Its utilization tools ultimately serve payer cost-control, and that conflict is heavily documented (above-market self-payments to Optum-owned groups, 40+ provider contract disputes in 2025, FTC scrutiny of OptumRx markups, the historic Ingenix out-of-network settlement). Providers experience CareSelect/InterQual as **the payer's gatekeeper.** ARKA is independent: aligned with the provider getting paid *and* the patient getting the right scan, not with one party's denial rate. **Better because:** ARKA can credibly sit on both sides precisely because it doesn't own either — Optum structurally cannot make that claim.

### 5. Data never moves. Optum's whole model is data gravity.
ARKA uses **HIPAA-safe federated learning — no raw PHI leaves the institution.** UnitedHealth/Optum's strategic advantage is the opposite: aggregating the nation's claims and clinical data centrally. A health system that distrusts handing imaging data to its insurer's analytics arm has a real reason to choose ARKA. **Better because:** it removes the single biggest objection providers have to payer-owned tooling.

### 6. ARKA trains the next ordering clinician. Optum has no education layer.
**ARKA-ED** is an interactive platform teaching residents and students imaging appropriateness — filling the gap left by the repealed PAMA AUC mandate. Optum has no equivalent; CareSelect benchmarks ordering behavior after the fact, but doesn't teach. **Better because:** ARKA improves ordering upstream, not just intercepts it.

### 7. ARKA serves rural / low-capacity sites. Optum optimizes for scale.
**ARKA-RURAL** is resource-aware decision support for sites Optum's enterprise model doesn't prioritize. No Optum product targets this. **Better because:** it reaches a chronically underserved segment with a tailored product.

---

## The one-line positioning

> Optum sells the payer's appropriateness engine to providers. ARKA is the **independent, patient-specific, explainable imaging-appropriateness engine that scores the same way for the doctor and the payer** — so the right scan is ordered, justified, and paid, with the data never leaving the building.

---

## What to defend hard (because Optum is closing in)

- **Don't lead with "AI prior auth"** — Optum now says the same. Lead with *patient-specific imaging appropriateness + symmetric engine + independence.*
- **Keep the ML→Non-Device-CDS story airtight.** It's a differentiator *and* a moat; CareSelect stays rules-based partly to avoid device risk. ARKA's transparency architecture (SHAP + Evidence Library) is what lets it use ML and still avoid 510(k). Protect that.
- **Own the conflict-of-interest narrative.** It is ARKA's most durable advantage and the one Optum can never neutralize.

---

### Sources
- [Optum — AI-powered digital prior authorization](https://www.optum.com/en/newsroom/health-tech/optum-is-advancing-ai-powered-digital-prior-authorization.html)
- [Optum unveils 2 new AI prior auth tools (Fierce Healthcare)](https://www.fiercehealthcare.com/payers/optum-unveils-2-new-ai-powered-tools-digital-prior-authorization)
- [Optum rolls out AI prior auth tools — Digital Auth Complete & InterQual Auth Accelerator (Becker's)](https://www.beckershospitalreview.com/healthcare-information-technology/optum-rolls-out-ai-powered-prior-authorization-tools-for-payers-providers/)
- [CareSelect® Imaging (Optum Business)](https://business.optum.com/en/operations-technology/clinical-decision-support/careselect/imaging.html)
- [CareSelect / ACR Select origin — National Decision Support Company](https://nationaldecisionsupport.com/tag/acr/)
- [ACR Appropriateness Criteria](https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Appropriateness-Criteria)
- [UnitedHealth pays its Optum providers above-market rates (STAT)](https://www.statnews.com/2024/11/25/unitedhealth-higher-payments-optum-providers-converts-expenses-to-profits/)
- [We Are Living in the UnitedHealth Group System (The Sling)](https://www.thesling.org/we-are-living-in-the-unitedhealth-group-system-and-thats-a-bad-thing/)
