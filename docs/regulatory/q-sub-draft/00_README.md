# ARKA Health — FDA Pre-Submission (Q-Sub) Package Manifest

**Package version:** 1.0 (Final) · **Date:** June 9, 2026
**Sponsor:** ARKA Health, Inc. · **Contact:** Arri Kanna, Founder — arrihantk@gmail.com
**Submission type:** Pre-Submission (Q-Submission) — request for written feedback and teleconference
**Channel:** CDRH Customer Collaboration Portal, via PreSTAR2 v3.0

This package requests FDA's written feedback on the regulatory status of two software functions of the ARKA platform: **ARKA-CLIN**, designed to meet the four Non-Device Clinical Decision Support criteria under FD&C Act §520(o)(1)(E), and **ARKA-INS**, administrative-support software under §520(o)(1)(A). A reference-image viewer is a separate display function outside the scope of this submission.

## Package contents

| # | Document (this folder) | Final PDF (`../q-sub-final/`) | Purpose |
|---|---|---|---|
| 01 | `01_cover_letter.md` | `ARKA_QSub_01_Cover_Letter.pdf` | One-page cover letter and statement of request |
| 02 | `02_product_description.md` | `ARKA_QSub_02_Product_and_Function_Description.pdf` | What each function does, data flow, and design boundaries |
| 03 | `03_intended_use_statement.md` | `ARKA_QSub_03_Intended_Use_Statement.pdf` | Intended use and indications for ARKA-CLIN and ARKA-INS |
| 04 | `04_fda_questions.md` | `ARKA_QSub_04_Questions_for_FDA.pdf` | Four concurrence-style questions (FDA's recommended ceiling) |
| 05 | `05_multiple_function_analysis.md` | `ARKA_QSub_05_Multiple_Function_Analysis.pdf` | Function-by-function regulatory map per FDA's multiple-function framework |
| 06 | `06_INS_administrative_support_memo.md` | `ARKA_QSub_06_ARKA-INS_Administrative_Support_Memo.pdf` | Feature-level support for the §520(o)(1)(A) position |
| 07 | `07_meeting_request.md` | `ARKA_QSub_07_Meeting_Request.pdf` | Meeting type, format, preferred dates, agenda, attendees |
| 08 | `08_labeling_attestation.md` | `ARKA_QSub_08_Labeling_Attestation.pdf` | No-misbranding attestation with dated repository evidence |

## Supporting evidence (attach from the repository)

| Evidence | Location | Supports |
|---|---|---|
| Model card (XGBoost refinement model) | `ml-service/MODEL_CARD.md` | Criteria 2 and 4; Question 4 |
| Scope boundary (viewer fenced out of CDS) | `docs/SCOPE_BOUNDARY.md` | Criterion 1; multiple-function analysis |
| CI enforcement configuration | `.github/workflows/go-live.yml` + `scripts/regulatory-checks.ts`, `scripts/lint-scope-boundary.ts`, `scripts/lint-cards.ts` | Criterion 1 firewall; change control |
| Sandbox screenshots (5) | `docs/regulatory-evidence/sandbox-screenshots/` | Criterion 4 transparency; product description |
| Clinical sign-off log and change-control procedure | `docs/CLINICAL_SIGN_OFF_LOG.md` | Question 3 |
| On-card FDA disclosure (v1.2.0) | `lib/compliance/fda-disclosure.ts` | Labeling attestation |

## Pre-filing gates (complete before submitting)

1. **Clinician sign-off — IN PROGRESS.** At least one licensed clinician must review the rule library, citations, feature catalogue, and card language and sign a dated entry in `docs/CLINICAL_SIGN_OFF_LOG.md`. Do not file before this gate closes.
2. **CDRH Portal account** registered under the same name, organization, and email used in this package (arrihantk@gmail.com).
3. **PreSTAR2 v3.0** downloaded locally and completed; the status banner must read "eSTAR COMPLETE" before upload.
4. *Recommended:* run FDA's Digital Health Policy Navigator for ARKA-CLIN and ARKA-INS separately and retain screenshots; send a short informal note to DigitalHealth@fda.hhs.gov before filing.

## Assembly order (PreSTAR)

Attach PDFs in numerical order under the prompts for cover letter, product description, intended use, questions, and meeting request; attach documents 05, 06, and 08 plus the repository evidence under supporting information. Keep all attachments on a local drive while editing PreSTAR, and sign the Truthful & Accurate statement last.

---

*This package requests FDA feedback; it does not represent and must never be described as FDA approval, clearance, registration, or endorsement.*
