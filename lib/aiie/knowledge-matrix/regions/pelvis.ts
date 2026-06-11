import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this pelvic presentation; preferred modalities address the clinical question.";

/** Pelvic clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const PELVIS_SCENARIOS: ClinicalScenario[] = [
  {
    id: "pelvic-pain-female",
    region: "pelvis",
    name: "Pelvic Pain (Female)",
    description: "Non-pregnant and pregnant female pelvic pain including ectopic workup.",
    presentationKeywords: [
      "pelvic pain", "adnexal pain", "ovarian cyst", "ovary pain",
      "pelvic pain female", "dysmenorrhea", "ectopic", "ectopic pregnancy",
      "beta hcg", "pregnancy pelvic pain",
    ],
    icd10Prefixes: ["R10.2", "N94", "O00"],
    variants: [
      {
        id: "us-first",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("pelvis-pelvic-pain-female-us-first", {
          us: { rating: 9, rationale: "Transvaginal pelvic ultrasound is first-line for female pelvic pain evaluation.", isPreferred: true },
          mri: { rating: 6, rationale: "Pelvic MRI is secondary when ultrasound is inconclusive for adnexal pathology." },
          ct: { rating: 4, rationale: "CT exposes gonadal tissue to radiation and is not first-line for routine pelvic pain." },
        }, NI),
      },
      {
        id: "ectopic-workup",
        criteria: { redFlags: ["suddenOnset"], pregnancy: true },
        ratings: buildRatings("pelvis-pelvic-pain-female-ectopic-workup", {
          us: { rating: 9, rationale: "Transvaginal ultrasound is first-line for suspected ectopic pregnancy — expedite when unstable.", isPreferred: true },
          mri: { rating: 4, rationale: "MRI is not standard for emergent ectopic pregnancy evaluation." },
          ct: { rating: 3, rationale: "CT is avoided in early pregnancy unless ultrasound is non-diagnostic and patient is stable." },
        }, NI),
      },
      {
        id: "post-menopausal-bleeding",
        criteria: { redFlags: ["ageOver50"] },
        ratings: buildRatings("pelvis-pelvic-pain-female-post-menopausal-bleeding", {
          us: { rating: 8, rationale: "Pelvic ultrasound evaluates endometrial thickness and adnexal masses in postmenopausal bleeding.", isPreferred: true },
          mri: { rating: 7, rationale: "MRI may characterize endometrial and cervical pathology when US is inconclusive." },
        }, NI),
      },
    ],
  },
];
