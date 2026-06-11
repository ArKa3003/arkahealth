/**
 * AIIE evidence registry entries — chest scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Chest evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const CHEST_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "chest-acute-chest-pain-aortic-dissection",
    region: "chest",
    title: "Suspected acute aortic dissection — emergent CTA",
    summary:
      "Tearing chest or back pain, pulse deficits, or marked blood pressure differentials raise acute aortic syndrome, where mortality rises by the hour. ECG-gated CT angiography of the chest (often chest-abdomen-pelvis) is the definitive emergent study.",
    clinicalBottomLine:
      "EXPEDITE: suspected aortic dissection requires immediate CTA — do not stage workup with D-dimer or radiographs in high-suspicion patients.",
    keyPoints: [
      "Untreated type A dissection mortality increases roughly 1–2% per hour after onset.",
      "CTA sensitivity and specificity both exceed 95% and define the treatment-relevant anatomy.",
      "TEE is the bedside alternative for unstable patients who cannot travel to CT.",
    ],
    citations: [CIT.aortic2022, CIT.chestPain2021, CIT.acrAc],
    relatedSlugs: ["chest-acute-chest-pain-suspected-acs", "chest-acute-chest-pain-pe-high-pretest"],
  }),
  defineEntry({
    slug: "chest-acute-chest-pain-pe-high-pretest",
    region: "chest",
    title: "Suspected PE, high pretest probability — CTPA directly",
    summary:
      "Patients with a high clinical probability of pulmonary embolism (Wells or Geneva high tier) proceed directly to CT pulmonary angiography without D-dimer testing, since a negative D-dimer cannot safely exclude PE at high pretest odds.",
    clinicalBottomLine:
      "High pretest probability of PE → CTPA without D-dimer; start anticoagulation while awaiting imaging when bleeding risk allows.",
    keyPoints: [
      "D-dimer's negative predictive value collapses at high pretest probability.",
      "CTPA is the reference standard for diagnosis and clot burden assessment (PIOPED II).",
      "V/Q scanning is the alternative for contrast contraindication or pregnancy considerations.",
    ],
    citations: [CIT.escPe, CIT.piopedii, CIT.christopherPe],
    relatedSlugs: ["chest-acute-chest-pain-pe-intermediate-pretest", "chest-acute-chest-pain-pe-low-pretest-d-dimer"],
  }),
  defineEntry({
    slug: "chest-acute-chest-pain-pe-intermediate-pretest",
    region: "chest",
    title: "Suspected PE, intermediate pretest probability — D-dimer gate",
    summary:
      "At intermediate clinical probability, a high-sensitivity D-dimer safely rules out pulmonary embolism when negative, reserving CTPA for positive results. Age-adjusted thresholds and YEARS-style algorithms further reduce imaging without missed events.",
    clinicalBottomLine:
      "Intermediate-probability PE: negative high-sensitivity D-dimer rules out; CTPA only when D-dimer is positive.",
    keyPoints: [
      "The Christopher study validated dichotomized Wells + D-dimer triage to CTPA at scale.",
      "Age-adjusted D-dimer cutoffs increase specificity in older patients without losing safety.",
      "YEARS demonstrated a further 14% absolute reduction in CTPA use.",
    ],
    citations: [CIT.christopherPe, CIT.years, CIT.escPe],
    relatedSlugs: ["chest-acute-chest-pain-pe-low-pretest-d-dimer", "chest-acute-chest-pain-pe-high-pretest"],
  }),
  defineEntry({
    slug: "chest-acute-chest-pain-pe-low-pretest-d-dimer",
    region: "chest",
    title: "Suspected PE, low pretest probability — PERC and D-dimer before any CT",
    summary:
      "Low-probability patients who satisfy all PERC criteria need no testing at all; those who are PERC-positive get a D-dimer, and imaging follows only a positive result. Direct-to-CTPA ordering in this population is a canonical low-value pattern.",
    clinicalBottomLine:
      "Low-probability PE: PERC-negative → stop; otherwise D-dimer, and CTPA only when positive.",
    keyPoints: [
      "PERC-negative, low-probability patients have a missed-PE rate below the testing threshold (<2%).",
      "Unselected CTPA yields more incidental findings and contrast exposure than diagnoses in this group.",
      "Structured pretest scoring (Wells/Geneva) should be documented before any PE imaging order.",
    ],
    citations: [CIT.perc, CIT.christopherPe, CIT.escPe],
    relatedSlugs: ["chest-acute-chest-pain-pe-intermediate-pretest", "conservative-care-before-imaging"],
  }),
  defineEntry({
    slug: "chest-acute-chest-pain-suspected-acs",
    region: "chest",
    title: "Suspected acute coronary syndrome — ECG and troponin lead, imaging supports",
    summary:
      "Suspected ACS is triaged with serial ECGs and high-sensitivity troponin, not anatomic imaging. Chest radiography evaluates alternatives; coronary CTA has a role in low-to-intermediate risk patients with non-diagnostic initial workup per the 2021 AHA/ACC chest pain guideline.",
    clinicalBottomLine:
      "Lead with ECG and hs-troponin for suspected ACS; chest X-ray for alternatives, and CCTA selectively in low–intermediate risk non-diagnostic cases.",
    keyPoints: [
      "The 2021 guideline centers hs-troponin pathways and clinical decision pathways for disposition.",
      "CCTA's strength is rapid exclusion of CAD in troponin-negative low/intermediate-risk patients.",
      "Routine advanced imaging for clearly positive ACS delays definitive cath-lab care.",
    ],
    citations: [CIT.chestPain2021, CIT.acrAc],
    relatedSlugs: ["cardiac-stable-chest-pain-ccta-pathway", "chest-acute-chest-pain-aortic-dissection"],
  }),
  defineEntry({
    slug: "chest-chronic-cough-standard-workup",
    region: "chest",
    title: "Chronic cough — chest radiograph first, then targeted workup",
    summary:
      "Chronic cough (>8 weeks) starts with a chest radiograph and systematic evaluation of the common causes: upper airway cough syndrome, asthma, and reflux. CT is reserved for abnormal radiographs, red flags, or refractory cough after empiric therapy.",
    clinicalBottomLine:
      "Chest X-ray plus sequential empiric treatment of common causes is the chronic cough pathway — CT only for abnormal films, red flags, or treatment failure.",
    keyPoints: [
      "UACS, asthma, and GERD explain the large majority of chronic cough with a normal radiograph.",
      "ACCP guidelines recommend protocolized sequential empiric therapy before advanced imaging.",
      "Smokers and ex-smokers meeting criteria should be channeled to lung cancer screening separately.",
    ],
    citations: [CIT.accpCough, CIT.acrAc],
    relatedSlugs: ["chest-chronic-cough-with-hemoptysis-weight-loss", "chest-lung-cancer-screening-eligible-50-80-20-pack-years"],
  }),
  defineEntry({
    slug: "chest-chronic-cough-with-hemoptysis-weight-loss",
    region: "chest",
    title: "Chronic cough with hemoptysis or weight loss — CT chest indicated",
    summary:
      "Hemoptysis, weight loss, or other constitutional symptoms convert chronic cough from an empiric-treatment problem to a malignancy/TB workup. Contrast-enhanced chest CT is indicated even with a normal radiograph.",
    clinicalBottomLine:
      "Chronic cough plus hemoptysis or weight loss warrants chest CT — a normal radiograph does not exclude central malignancy.",
    keyPoints: [
      "Radiographs miss a meaningful fraction of central and small endobronchial tumors.",
      "CT findings direct bronchoscopy and tissue sampling.",
      "Concurrent evaluation for tuberculosis is indicated in at-risk populations.",
    ],
    citations: [CIT.accpCough, CIT.acrAc, CIT.cochraneRedFlags],
    relatedSlugs: ["chest-hemoptysis-minor", "chest-chronic-cough-standard-workup", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "chest-hemoptysis-massive",
    region: "chest",
    title: "Massive hemoptysis — emergent CTA and airway protection",
    summary:
      "Massive (life-threatening) hemoptysis kills by asphyxiation, not exsanguination. After airway control, emergent CT angiography localizes the bleeding source and maps bronchial arterial anatomy for embolization.",
    clinicalBottomLine:
      "EXPEDITE: secure the airway, then emergent CTA chest to localize bleeding and plan bronchial artery embolization.",
    keyPoints: [
      "Positioning bleeding-side-down and early airway control precede all imaging.",
      "CTA identifies the bleeding lobe and culprit vessels in the large majority of cases.",
      "Bronchial artery embolization is first-line definitive therapy for most etiologies.",
    ],
    citations: [CIT.acrAc, CIT.accpCough],
    relatedSlugs: ["chest-hemoptysis-minor", "chest-acute-chest-pain-aortic-dissection"],
  }),
  defineEntry({
    slug: "chest-hemoptysis-minor",
    region: "chest",
    title: "Minor hemoptysis — radiograph then CT for risk factors",
    summary:
      "Small-volume hemoptysis starts with a chest radiograph. CT chest is added for smokers over 40, recurrent episodes, or an abnormal film, primarily to evaluate for occult malignancy and bronchiectasis.",
    clinicalBottomLine:
      "Minor hemoptysis: chest X-ray first; add CT for age >40 with smoking history, recurrence, or radiographic abnormality.",
    keyPoints: [
      "Most minor hemoptysis is bronchitis-related and self-limited.",
      "Malignancy risk concentrates in older smokers — image this group even with normal films.",
      "Bronchoscopy and CT are complementary when initial workup is unrevealing.",
    ],
    citations: [CIT.acrAc, CIT.accpCough],
    relatedSlugs: ["chest-hemoptysis-massive", "chest-chronic-cough-with-hemoptysis-weight-loss"],
  }),
  defineEntry({
    slug: "chest-lung-cancer-screening-eligible-50-80-20-pack-years",
    region: "chest",
    title: "Lung cancer screening — annual low-dose CT for eligible adults",
    summary:
      "Adults aged 50–80 with at least 20 pack-years who currently smoke or quit within 15 years benefit from annual low-dose CT screening, which reduced lung-cancer mortality by 20% versus radiography in the NLST. Shared decision-making and smoking cessation counseling are integral.",
    clinicalBottomLine:
      "Annual low-dose chest CT is recommended for adults 50–80 with ≥20 pack-years smoking history (current or quit <15 years).",
    keyPoints: [
      "USPSTF 2021 lowered thresholds to age 50 and 20 pack-years, broadening eligibility.",
      "Lung-RADS structures nodule management and keeps false-positive workups contained.",
      "Screening pairs with, never replaces, smoking cessation support.",
    ],
    citations: [CIT.uspstfLung, CIT.nlst],
    relatedSlugs: ["chest-lung-cancer-screening-not-eligible", "chest-chronic-cough-standard-workup"],
  }),
  defineEntry({
    slug: "chest-lung-cancer-screening-not-eligible",
    region: "chest",
    title: "Lung cancer screening outside criteria — not recommended",
    summary:
      "Low-dose CT screening outside USPSTF eligibility (never/light smokers, age outside 50–80, quit >15 years) has an unfavorable benefit–harm balance: false positives, incidental findings, and radiation accrue without the mortality benefit demonstrated in trial populations.",
    clinicalBottomLine:
      "Do not order screening chest CT for patients outside USPSTF eligibility — harms outweigh benefits in low-risk groups.",
    keyPoints: [
      "Trial mortality benefit was demonstrated only in high-risk cohorts.",
      "False-positive rates drive invasive workups in screened low-risk patients.",
      "Symptomatic patients are diagnostic, not screening, candidates — different pathway.",
    ],
    citations: [CIT.uspstfLung, CIT.nlst],
    relatedSlugs: ["chest-lung-cancer-screening-eligible-50-80-20-pack-years"],
  }),
];
