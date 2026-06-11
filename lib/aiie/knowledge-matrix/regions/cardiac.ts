import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this cardiac presentation; preferred modalities address the clinical question.";

/** Cardiac clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const CARDIAC_SCENARIOS: ClinicalScenario[] = [
  {
    id: "stable-chest-pain",
    region: "cardiac",
    name: "Stable Chest Pain",
    description: "Chronic stable angina and outpatient coronary artery disease evaluation.",
    presentationKeywords: [
      "stable angina", "stable chest pain", "cad", "coronary disease",
      "chest pain exertional", "atypical chest pain", "ccta", "stress test",
    ],
    icd10Prefixes: ["I20", "I25"],
    variants: [
      {
        id: "ccta-pathway",
        criteria: { redFlags: [], ageRange: { min: 18, max: 65 } },
        isDefault: true,
        ratings: buildRatings("cardiac-stable-chest-pain-ccta-pathway", {
          cta: { rating: 8, rationale: "Coronary CTA is appropriate for stable chest pain in low-intermediate pretest probability patients.", isPreferred: true },
          nm: { rating: 7, rationale: "Nuclear stress imaging is an alternative when CCTA is contraindicated or calcium score is very high." },
          us: { rating: 3, rationale: "Echocardiography evaluates function but does not replace anatomic coronary assessment." },
          ct: { rating: 4, rationale: "Non-coronary chest CT does not assess coronary stenosis in stable angina." },
        }, NI),
      },
      {
        id: "stress-imaging-pathway",
        criteria: { redFlags: ["ageOver50"] },
        ratings: buildRatings("cardiac-stable-chest-pain-stress-imaging-pathway", {
          nm: { rating: 8, rationale: "Stress myocardial perfusion imaging is appropriate for stable chest pain with intermediate pretest probability.", isPreferred: true },
          cta: { rating: 7, rationale: "CCTA remains appropriate in selected patients but stress imaging is common when functional ischemia is the question." },
          us: { rating: 6, rationale: "Stress echocardiography is an alternative functional test for stable chest pain." },
        }, NI),
      },
    ],
  },
  {
    id: "new-heart-failure",
    region: "cardiac",
    name: "New Heart Failure",
    description: "Newly diagnosed or decompensated heart failure imaging workup.",
    presentationKeywords: [
      "heart failure", "chf", "hf", "new heart failure", "dyspnea chf",
      "volume overload", "bnp elevated", "systolic dysfunction",
    ],
    icd10Prefixes: ["I50"],
    variants: [
      {
        id: "initial-evaluation",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("cardiac-new-heart-failure-initial-evaluation", {
          us: { rating: 9, rationale: "Echocardiography is first-line for new heart failure to assess ejection fraction and valvular disease.", isPreferred: true },
          xr: { rating: 6, rationale: "Chest radiograph assesses pulmonary edema but does not define cardiomyopathy etiology." },
          mri: { rating: 7, rationale: "Cardiac MRI characterizes cardiomyopathy and viability when echo is inconclusive." },
          nm: { rating: 5, rationale: "Nuclear ventriculography is secondary to echocardiography for initial HF evaluation." },
        }, NI),
      },
    ],
  },
  {
    id: "pre-op-clearance",
    region: "cardiac",
    name: "Preoperative Cardiac Clearance",
    description: "Routine preoperative cardiac imaging without specific indication.",
    presentationKeywords: [
      "pre op", "preop", "pre-operative", "surgical clearance",
      "cardiac clearance", "pre surgery imaging", "preop stress test",
    ],
    icd10Prefixes: ["Z01.810", "Z01.818"],
    variants: [
      {
        id: "routine-no-indication",
        criteria: { redFlags: [] },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("cardiac-pre-op-clearance-routine-no-indication", {
          nm: { rating: 1, rationale: "Routine preoperative cardiac imaging is usually not appropriate without symptoms or high-risk surgery criteria.", isPreferred: true },
          cta: { rating: 1, rationale: "Coronary CTA is not indicated for routine preoperative clearance without cardiac symptoms." },
          us: { rating: 2, rationale: "Echocardiography is reserved for patients with murmur, heart failure, or concerning history — not routine clearance." },
        }, NI),
      },
      {
        id: "high-risk-surgery-symptoms",
        criteria: { redFlags: ["progressiveSymptoms", "ageOver50"] },
        ratings: buildRatings("cardiac-pre-op-clearance-high-risk-surgery-symptoms", {
          us: { rating: 8, rationale: "Echocardiography is appropriate before high-risk surgery when heart failure or valvular disease is suspected.", isPreferred: true },
          nm: { rating: 7, rationale: "Stress imaging may be indicated for high-risk surgery with poor functional capacity." },
        }, NI),
      },
    ],
  },
];
