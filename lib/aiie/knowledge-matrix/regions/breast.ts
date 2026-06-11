import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this breast presentation; preferred modalities address the clinical question.";

/** Breast clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const BREAST_SCENARIOS: ClinicalScenario[] = [
  {
    id: "breast-screening",
    region: "breast",
    name: "Breast Cancer Screening",
    description: "Population screening mammography by age and risk tier.",
    presentationKeywords: [
      "mammogram", "screening mammo", "breast screening", "mammography",
      "breast cancer screening", "annual mammogram",
    ],
    icd10Prefixes: ["Z12.3"],
    variants: [
      {
        id: "average-risk-40-plus",
        criteria: { redFlags: [], ageRange: { min: 40, max: 74 } },
        isDefault: true,
        ratings: buildRatings("breast-breast-screening-average-risk-40-plus", {
          mammo: { rating: 9, rationale: "Screening mammography is appropriate for average-risk women starting at age 40 per society guidelines.", isPreferred: true },
          us: { rating: 3, rationale: "Ultrasound is not a replacement for screening mammography in average-risk women." },
          mri: { rating: 2, rationale: "Breast MRI screening is reserved for high-risk populations, not average risk." },
        }, NI),
      },
      {
        id: "high-risk-mri-supplement",
        criteria: { redFlags: ["cancerHistory", "immunocompromised"] },
        ratings: buildRatings("breast-breast-screening-high-risk-mri-supplement", {
          mri: { rating: 8, rationale: "Supplemental breast MRI is appropriate for high-risk women per ACS guidelines.", isPreferred: true },
          mammo: { rating: 9, rationale: "Mammography remains the foundation even in high-risk screening protocols." },
        }, NI),
      },
    ],
  },
  {
    id: "palpable-lump",
    region: "breast",
    name: "Palpable Breast Lump",
    description: "Clinical breast lump evaluation stratified by age.",
    presentationKeywords: [
      "breast lump", "palpable mass", "breast mass", "lump breast",
      "breast nodule", "dominant mass",
    ],
    icd10Prefixes: ["N63", "R22"],
    variants: [
      {
        id: "under-30-us-first",
        criteria: { redFlags: [], ageRange: { max: 29 } },
        ratings: buildRatings("breast-palpable-lump-under-30-us-first", {
          us: { rating: 9, rationale: "Ultrasound is first-line for palpable breast lump in women under 30.", isPreferred: true },
          mammo: { rating: 5, rationale: "Diagnostic mammography may supplement ultrasound in selected young patients." },
        }, NI),
      },
      {
        id: "30-plus-mammo-us",
        criteria: { redFlags: [], ageRange: { min: 30 } },
        isDefault: true,
        ratings: buildRatings("breast-palpable-lump-30-plus-mammo-us", {
          mammo: { rating: 9, rationale: "Diagnostic mammography plus targeted ultrasound is appropriate for palpable lump age 30 and older.", isPreferred: true },
          us: { rating: 9, rationale: "Targeted breast ultrasound complements mammography for palpable masses age 30+." },
          mri: { rating: 6, rationale: "Breast MRI is secondary for problem-solving when mammo/US are inconclusive." },
        }, NI),
      },
    ],
  },
];
