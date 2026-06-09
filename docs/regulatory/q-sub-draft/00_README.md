# ARKA — FDA Pre-Submission (Q-Sub) draft package

**Status:** First drafts — _pending human review before filing._
**Created:** 2026-06 · **Owner:** Arri Kanna
**Companion:** `docs/regulatory/ARKA_FDA_QSub_Playbook.pdf` (the step-by-step guide)

These are working first drafts of the documents you'll assemble into the free FDA Pre-Submission.
They are written in the **corrected framing** decided for this submission:

- **ARKA-CLIN** → Non-Device Clinical Decision Support under **FD&C Act §520(o)(1)(E)** (the four criteria)
- **ARKA-INS** → Administrative-support software under **§520(o)(1)(A)** (eligibility / claims-based functions)
- **Reference DICOM viewer** → a separate display function, **out of scope** for this submission

> ⚠️ Nothing here is legal/regulatory advice. Get a licensed clinician to sign off on clinical
> content, and (ideally) have a regulatory-savvy human red-line `03_intended_use_statement.md`
> and `04_fda_questions.md` before you file. See Part 5 of the playbook for cheap ways to do this.

## Files

| # | File | Maps to playbook | What it is |
|---|------|------------------|------------|
| 01 | `01_cover_letter.md` | Part 4.1 ① | One-page cover letter for the submission |
| 02 | `02_product_description.md` | Part 4.1 ③ | What CLIN + INS do; data flow; what they don't do |
| 03 | `03_intended_use_statement.md` | Part 4.1 ④ | The single most important paragraph — get it reviewed |
| 04 | `04_fda_questions.md` | Part 4.1 ⑤ | Your ≤4 concurrence-style questions |
| 05 | `05_multiple_function_analysis.md` | Part 4.1 ⑥ | CLIN/INS/viewer → regulatory basis map |
| 06 | `06_INS_administrative_support_memo.md` | Part 4.3 ⑬ | Why INS is §520(o)(1)(A), feature by feature |
| 07 | `07_meeting_request.md` | Part 4.1 ⑦ | Meeting type, format, 3+ dates, agenda, attendees |
| 08 | `08_labeling_attestation.md` | Part 4.3 ⑱ | No "FDA-approved/cleared" anywhere; disclosure copy |

## How to use

1. Read the playbook Part 3 first and fix the underlying brief (`ARKA_FDA_CDS_Regulatory_Brief`).
2. Fill every `[FILL: …]` placeholder and resolve every `[DECIDE: …]` note.
3. Get the clinician sign-off moving (longest lead time).
4. Drop these into the free **PreSTAR2 v3.0** template and submit via the CDRH Portal (playbook Part 7).

## Open decisions to resolve before filing

- [ ] **Patient population:** adults only, or adults + pediatrics? Must be consistent across brief, model card, rules, and `03_intended_use_statement.md`.
- [ ] **Evidence-source policy:** ACR or non-ACR? Make cards and the rationale memo agree.
- [ ] **One professional contact** (email + phone) used identically everywhere and on the Portal account.
- [ ] **Confirm every cited exhibit exists** and can be attached (Loom URL, SHAP screenshot, validation report).
