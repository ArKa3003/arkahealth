import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this upper-extremity MSK presentation; preferred modalities address the clinical question.";

/** Upper extremity musculoskeletal scenarios for the AIIE Clinical Knowledge Matrix. */
export const MSK_UPPER_SCENARIOS: ClinicalScenario[] = [
  {
    id: "shoulder-pain",
    region: "msk_upper",
    name: "Shoulder Pain",
    description: "Shoulder pain including rotator cuff and acute trauma pathways.",
    presentationKeywords: [
      "shoulder pain", "rotator cuff", "shoulder injury", "shoulder trauma",
      "impingement", "frozen shoulder", "adhesive capsulitis", "labrum",
    ],
    icd10Prefixes: ["M75", "S43"],
    variants: [
      {
        id: "chronic-rotator-cuff-mri",
        criteria: { redFlags: [], durationDays: { min: 42 }, priorConservativeCare: true },
        isDefault: true,
        ratings: buildRatings("msk-upper-shoulder-pain-chronic-rotator-cuff-mri", {
          mri: { rating: 8, rationale: "MRI shoulder is appropriate for chronic rotator cuff symptoms after failed conservative care.", isPreferred: true },
          us: { rating: 7, rationale: "Shoulder ultrasound is an acceptable alternative for rotator cuff tear assessment." },
          xr: { rating: 5, rationale: "Radiographs evaluate arthritis and calcific tendinopathy but not cuff tear detail." },
        }, NI),
      },
      {
        id: "chronic-rotator-cuff-us",
        criteria: { redFlags: [], durationDays: { min: 42 } },
        ratings: buildRatings("msk-upper-shoulder-pain-chronic-rotator-cuff-us", {
          us: { rating: 8, rationale: "Shoulder ultrasound is appropriate for chronic rotator cuff evaluation as a cost-effective alternative to MRI.", isPreferred: true },
          mri: { rating: 8, rationale: "MRI remains gold standard when ultrasound operator expertise is limited." },
        }, NI),
      },
      {
        id: "acute-trauma-xr-first",
        criteria: { redFlags: ["trauma"], trauma: true },
        ratings: buildRatings("msk-upper-shoulder-pain-acute-trauma-xr-first", {
          xr: { rating: 9, rationale: "Shoulder radiographs are first-line for acute shoulder trauma to assess dislocation and fracture.", isPreferred: true },
          ct: { rating: 6, rationale: "CT may follow radiographs for complex fracture characterization." },
          mri: { rating: 5, rationale: "MRI is not first-line before radiographs in acute shoulder trauma." },
        }, NI),
      },
    ],
  },
];
