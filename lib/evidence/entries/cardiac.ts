/**
 * AIIE evidence registry entries — cardiac scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Cardiac evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const CARDIAC_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "cardiac-new-heart-failure-initial-evaluation",
    region: "cardiac",
    title: "New heart failure — echocardiography is the initial study",
    summary:
      "Transthoracic echocardiography is the cornerstone initial imaging study for newly suspected heart failure, establishing ejection fraction, chamber size, and valvular function that classify the syndrome and direct guideline-based therapy.",
    clinicalBottomLine:
      "Order TTE for every new heart failure diagnosis — EF classification (HFrEF/HFmrEF/HFpEF) determines the entire treatment algorithm.",
    keyPoints: [
      "Natriuretic peptides plus TTE anchor the 2022 AHA/ACC/HFSA diagnostic pathway.",
      "Chest radiography supports the acute workup but cannot classify HF phenotype.",
      "Cardiac MRI is the second-line study for ischemic versus non-ischemic etiology and infiltrative disease.",
    ],
    citations: [CIT.hf2022, CIT.acrAc],
    relatedSlugs: ["cardiac-stable-chest-pain-ccta-pathway", "cardiac-pre-op-clearance-high-risk-surgery-symptoms"],
  }),
  defineEntry({
    slug: "cardiac-pre-op-clearance-high-risk-surgery-symptoms",
    region: "cardiac",
    title: "Pre-operative evaluation with symptoms or high-risk surgery — targeted testing",
    summary:
      "Cardiac imaging before non-cardiac surgery is justified when the patient has active cardiac symptoms, poor or unknown functional capacity, and elevated-risk surgery — and only when results would change management. Stress imaging or TTE is targeted to the specific question.",
    clinicalBottomLine:
      "Pre-op cardiac imaging is appropriate only for symptomatic patients or poor functional capacity before elevated-risk surgery, when results will alter management.",
    keyPoints: [
      "The stepwise 2014 ACC/AHA algorithm gates testing on functional capacity (≥4 METs) and surgical risk.",
      "TTE is indicated for dyspnea of unknown origin or worsening valvular disease before surgery.",
      "Testing that will not change perioperative management should not be ordered.",
    ],
    citations: [CIT.periop2014, CIT.acrAc],
    relatedSlugs: ["cardiac-pre-op-clearance-routine-no-indication", "cardiac-stable-chest-pain-stress-imaging-pathway"],
  }),
  defineEntry({
    slug: "cardiac-pre-op-clearance-routine-no-indication",
    region: "cardiac",
    title: "Routine pre-operative cardiac imaging — low-value without indication",
    summary:
      "Routine pre-operative echocardiography or stress imaging in asymptomatic patients before low- or intermediate-risk surgery does not improve outcomes and is a recognized low-value pattern. Functional capacity assessment substitutes for testing in most patients.",
    clinicalBottomLine:
      "Do not order routine pre-op cardiac imaging for asymptomatic patients with adequate functional capacity — it changes neither management nor outcomes.",
    keyPoints: [
      "Asymptomatic patients who can achieve ≥4 METs proceed to surgery without testing.",
      "Routine testing generates cascades: false positives, delays, and unnecessary catheterization.",
      "Risk calculators (RCRI, NSQIP MICA) stratify without imaging.",
    ],
    citations: [CIT.periop2014, CIT.randUcla],
    relatedSlugs: ["cardiac-pre-op-clearance-high-risk-surgery-symptoms", "conservative-care-before-imaging"],
  }),
  defineEntry({
    slug: "cardiac-stable-chest-pain-ccta-pathway",
    region: "cardiac",
    title: "Stable chest pain — coronary CTA as first-line anatomic test",
    summary:
      "For intermediate-risk stable chest pain, coronary CT angiography is a guideline-endorsed first-line test (2021 AHA/ACC, class 1A for this population). SCOT-HEART demonstrated reduced downstream MI when CCTA guided management.",
    clinicalBottomLine:
      "CCTA is an excellent first test for intermediate-risk stable chest pain — high negative predictive value and outcome-improving plaque visualization.",
    keyPoints: [
      "SCOT-HEART showed a 41% relative reduction in coronary death/MI at 5 years with CCTA-guided care.",
      "CCTA excels at exclusion: a normal study effectively rules out obstructive CAD.",
      "FFR-CT adds functional significance assessment without a second test in selected cases.",
    ],
    citations: [CIT.chestPain2021, CIT.scotHeart, CIT.promise],
    relatedSlugs: ["cardiac-stable-chest-pain-stress-imaging-pathway", "chest-acute-chest-pain-suspected-acs"],
  }),
  defineEntry({
    slug: "cardiac-stable-chest-pain-stress-imaging-pathway",
    region: "cardiac",
    title: "Stable chest pain — functional stress imaging pathway",
    summary:
      "Stress imaging (echo, nuclear MPI, or stress CMR) is the functional alternative for stable chest pain, preferred when ischemic burden quantification will guide revascularization decisions or when CCTA is limited by calcification or rhythm.",
    clinicalBottomLine:
      "Choose stress imaging for stable chest pain when the clinical question is ischemic burden — anatomy and function pathways are both guideline-supported.",
    keyPoints: [
      "PROMISE found comparable outcomes between anatomic and functional strategies.",
      "ISCHEMIA showed that even moderate-severe ischemia does not mandate invasive management without symptoms refractory to therapy.",
      "Prior revascularization and heavy coronary calcium favor functional testing.",
    ],
    citations: [CIT.chestPain2021, CIT.promise, CIT.ischemia],
    relatedSlugs: ["cardiac-stable-chest-pain-ccta-pathway", "cardiac-pre-op-clearance-high-risk-surgery-symptoms"],
  }),
];
