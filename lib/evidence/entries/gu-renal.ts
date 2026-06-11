/**
 * AIIE evidence registry entries — GU / renal scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** GU / renal evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const GU_RENAL_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "gu-renal-hematuria-gross",
    region: "gu_renal",
    title: "Gross hematuria — full urologic evaluation with CT urography",
    summary:
      "Visible hematuria carries a substantial malignancy risk in adults and warrants complete evaluation: CT urography for the upper tracts plus cystoscopy for the bladder, regardless of anticoagulation status.",
    clinicalBottomLine:
      "Gross hematuria in adults requires CT urography plus cystoscopy — anticoagulation never explains away visible blood.",
    keyPoints: [
      "Urothelial and renal malignancy risk is highest with gross hematuria, particularly in older smokers.",
      "CT urography evaluates renal parenchyma and the collecting systems in one study.",
      "Cystoscopy remains necessary — imaging cannot exclude bladder lesions.",
    ],
    citations: [CIT.auaHematuria, CIT.acrAc],
    relatedSlugs: ["gu-renal-hematuria-microscopic", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "gu-renal-hematuria-microscopic",
    region: "gu_renal",
    title: "Microscopic hematuria — risk-stratified imaging",
    summary:
      "The 2020 AUA microhematuria guideline replaced one-size-fits-all CT urography with risk stratification: low-risk patients may repeat urinalysis or have renal ultrasound, while high-risk patients get CT urography and cystoscopy.",
    clinicalBottomLine:
      "Stratify microhematuria by AUA risk tier — ultrasound suffices for low/intermediate risk; reserve CT urography for high-risk patients.",
    keyPoints: [
      "Risk tiers weigh age, smoking, degree of hematuria, and other urothelial risk factors.",
      "Universal CT urography over-images low-risk patients (radiation, contrast, incidentalomas).",
      "Gynecologic and infectious mimics should be addressed before urologic workup.",
    ],
    citations: [CIT.auaHematuria, CIT.acrAc],
    relatedSlugs: ["gu-renal-hematuria-gross"],
  }),
  defineEntry({
    slug: "gu-renal-renal-colic-pregnant-us-first",
    region: "gu_renal",
    title: "Renal colic in pregnancy — ultrasound first",
    summary:
      "Suspected renal colic in pregnancy is imaged with renal and pelvic ultrasound first, accepting moderate sensitivity to avoid fetal radiation. Non-contrast MRI is the second-line study; low-dose CT is a last resort late in workup.",
    clinicalBottomLine:
      "Ultrasound first for renal colic in pregnancy; escalate to MR urography when management hinges on an unconfirmed diagnosis.",
    keyPoints: [
      "Physiologic hydronephrosis of pregnancy complicates ultrasound interpretation — compare sides and use resistive indices.",
      "Most pregnancy-associated stones pass with conservative management.",
      "Ionizing studies are reserved for refractory cases where intervention is planned.",
    ],
    citations: [CIT.acogPregImaging, CIT.smithBindman, CIT.acrAc],
    relatedSlugs: ["gu-renal-renal-colic-standard-low-dose-ct", "imaging-in-pregnancy"],
  }),
  defineEntry({
    slug: "gu-renal-renal-colic-standard-low-dose-ct",
    region: "gu_renal",
    title: "Suspected renal colic — low-dose non-contrast CT",
    summary:
      "Low-dose non-contrast CT is the definitive study for suspected nephrolithiasis, but the landmark Smith-Bindman trial showed ultrasound-first strategies achieve equivalent outcomes with less radiation — CT can follow selectively.",
    clinicalBottomLine:
      "Low-dose non-contrast CT confirms renal colic; an ultrasound-first strategy is a guideline-supported alternative for typical presentations.",
    keyPoints: [
      "US-first randomized care produced no difference in serious missed diagnoses versus CT-first.",
      "Low-dose CT protocols maintain stone sensitivity at a fraction of standard dose.",
      "Stone size and location on CT drive intervention decisions per AUA guidance.",
    ],
    citations: [CIT.smithBindman, CIT.auaStones, CIT.acrAc],
    relatedSlugs: ["gu-renal-renal-colic-young-recurrent-us", "gu-renal-renal-colic-pregnant-us-first"],
  }),
  defineEntry({
    slug: "gu-renal-renal-colic-young-recurrent-us",
    region: "gu_renal",
    title: "Recurrent renal colic in young patients — ultrasound to limit cumulative dose",
    summary:
      "Young patients with recurrent, typical stone episodes accumulate significant radiation from repeat CT. Ultrasound (with KUB radiography as needed) is the preferred repeat-episode strategy, reserving CT for atypical features or planned intervention.",
    clinicalBottomLine:
      "Use ultrasound for recurrent typical stone episodes in young patients — repeat CT for every episode is a cumulative-dose hazard.",
    keyPoints: [
      "Stone formers can undergo many imaging episodes over a lifetime; dose stewardship matters.",
      "Known stone disease with typical symptoms rarely requires re-confirmation by CT.",
      "CT is appropriate when fever, refractory pain, or surgical planning enters the picture.",
    ],
    citations: [CIT.smithBindman, CIT.auaStones],
    relatedSlugs: ["gu-renal-renal-colic-standard-low-dose-ct", "pediatric-imaging-radiation-safety"],
  }),
  defineEntry({
    slug: "gu-renal-scrotal-pain-standard-doppler",
    region: "gu_renal",
    title: "Acute scrotal pain — Doppler ultrasound",
    summary:
      "Scrotal ultrasound with Doppler is the universal first study for acute scrotal pain, differentiating torsion, epididymo-orchitis, hernia, and tumor-related presentations with high accuracy and no radiation.",
    clinicalBottomLine:
      "Doppler ultrasound is the study for acute scrotal pain — order it urgently and interpret perfusion in clinical context.",
    keyPoints: [
      "Doppler assesses both anatomy and perfusion in a single bedside-available study.",
      "Epididymitis shows increased flow; torsion shows absent or asymmetric flow.",
      "No role for CT or MRI in the initial workup of acute scrotal pain.",
    ],
    citations: [CIT.acrAc, CIT.twist],
    relatedSlugs: ["gu-renal-scrotal-pain-suspected-torsion"],
  }),
  defineEntry({
    slug: "gu-renal-scrotal-pain-suspected-torsion",
    region: "gu_renal",
    title: "Suspected testicular torsion — do not let imaging delay surgery",
    summary:
      "Testicular salvage falls steeply after six hours of torsion. High-suspicion presentations (TWIST high score) go directly to surgical exploration; Doppler ultrasound serves intermediate-suspicion cases and must be obtained emergently.",
    clinicalBottomLine:
      "EXPEDITE: high clinical suspicion of torsion → immediate urology consult and exploration; Doppler US only when it will not delay detorsion.",
    keyPoints: [
      "Salvage approaches 90% within 6 hours and falls below 10% beyond 24 hours.",
      "The TWIST score stratifies which patients can skip imaging entirely.",
      "Absent flow on Doppler confirms, but normal flow does not fully exclude, intermittent torsion.",
    ],
    citations: [CIT.twist, CIT.acrAc],
    relatedSlugs: ["gu-renal-scrotal-pain-standard-doppler", "red-flag-symptoms"],
  }),
];
