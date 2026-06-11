import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this vascular presentation; preferred modalities address the clinical question.";

/** Vascular clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const VASCULAR_SCENARIOS: ClinicalScenario[] = [
  {
    id: "suspected-dvt",
    region: "vascular",
    name: "Suspected DVT",
    description: "Lower extremity deep venous thrombosis evaluation.",
    presentationKeywords: [
      "dvt", "deep vein thrombosis", "leg swelling", "calf pain",
      "venous thrombosis", "leg clot", "unilateral leg swelling",
    ],
    icd10Prefixes: ["I82", "R60"],
    variants: [
      {
        id: "standard-doppler",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("vascular-suspected-dvt-standard-doppler", {
          us_doppler: { rating: 9, rationale: "Lower extremity venous duplex ultrasound is first-line for suspected DVT.", isPreferred: true },
          cta: { rating: 4, rationale: "CT venography is reserved when ultrasound is inconclusive or central clot is suspected." },
          mra: { rating: 4, rationale: "MRV is secondary to duplex ultrasound for routine DVT diagnosis." },
        }, NI),
      },
    ],
  },
  {
    id: "carotid-stenosis",
    region: "vascular",
    name: "Carotid Stenosis Workup",
    description: "Symptomatic and asymptomatic carotid artery stenosis evaluation.",
    presentationKeywords: [
      "carotid stenosis", "carotid bruit", "carotid duplex", "tia carotid",
      "carotid artery disease", "cea workup", "stroke carotid",
    ],
    icd10Prefixes: ["I65", "I63"],
    variants: [
      {
        id: "symptomatic",
        criteria: { redFlags: ["suddenOnset"] },
        isDefault: true,
        ratings: buildRatings("vascular-carotid-stenosis-symptomatic", {
          us_doppler: { rating: 9, rationale: "Carotid duplex ultrasound is first-line for symptomatic carotid stenosis workup.", isPreferred: true },
          cta: { rating: 8, rationale: "CTA neck confirms stenosis degree when ultrasound is limited or preoperative planning requires detail." },
          mra: { rating: 8, rationale: "MRA neck is an alternative when CTA contrast is contraindicated." },
        }, NI),
      },
      {
        id: "asymptomatic-screening",
        criteria: { redFlags: [] },
        ratings: buildRatings("vascular-carotid-stenosis-asymptomatic-screening", {
          us_doppler: { rating: 7, rationale: "Carotid duplex is appropriate for asymptomatic bruit or high-risk screening when criteria are met.", isPreferred: true },
          cta: { rating: 5, rationale: "CTA is secondary to duplex for asymptomatic carotid screening." },
        }, NI),
      },
    ],
  },
  {
    id: "aaa-screening",
    region: "vascular",
    name: "AAA Screening / Surveillance",
    description: "Abdominal aortic aneurysm screening and surveillance imaging.",
    presentationKeywords: [
      "aaa", "abdominal aortic aneurysm", "aortic aneurysm", "aneurysm screening",
      "aaa surveillance", "ultrasound aaa",
    ],
    icd10Prefixes: ["I71", "Z13.6"],
    variants: [
      {
        id: "screening-eligible",
        criteria: { redFlags: [], ageRange: { min: 65, max: 75 } },
        isDefault: true,
        ratings: buildRatings("vascular-aaa-screening-screening-eligible", {
          us: { rating: 9, rationale: "One-time abdominal ultrasound is appropriate AAA screening for eligible male ever-smokers age 65–75.", isPreferred: true },
          ct: { rating: 5, rationale: "CT is not first-line for AAA screening due to radiation; used when US is inconclusive." },
          cta: { rating: 4, rationale: "CTA is for aneurysm characterization pre-repair, not population screening." },
        }, NI),
      },
      {
        id: "surveillance-known-aaa",
        criteria: { redFlags: [], priorImaging: true },
        ratings: buildRatings("vascular-aaa-screening-surveillance-known-aaa", {
          us: { rating: 9, rationale: "Ultrasound surveillance is standard for known small AAA per size-based intervals.", isPreferred: true },
          ct: { rating: 6, rationale: "CT may define aneurysm morphology when repair planning requires detail." },
          cta: { rating: 7, rationale: "CTA is appropriate pre-endovascular or open repair planning for enlarging AAA." },
        }, NI),
      },
    ],
  },
];
