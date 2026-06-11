import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this lower-extremity MSK presentation; preferred modalities address the clinical question.";

/** Lower extremity musculoskeletal scenarios for the AIIE Clinical Knowledge Matrix. */
export const MSK_LOWER_SCENARIOS: ClinicalScenario[] = [
  {
    id: "knee-pain",
    region: "msk_lower",
    name: "Knee Pain",
    description: "Knee pain triage including trauma decision rules and chronic OA.",
    presentationKeywords: [
      "knee pain", "knee injury", "knee trauma", "meniscus", "acl",
      "mcl", "knee swelling", "knee osteoarthritis", "oa knee",
    ],
    icd10Prefixes: ["M17", "M23", "S80"],
    variants: [
      {
        id: "acute-trauma-xr-criteria",
        criteria: { redFlags: ["trauma"], trauma: true },
        ratings: buildRatings("msk-lower-knee-pain-acute-trauma-xr-criteria", {
          xr: { rating: 8, rationale: "Knee radiographs are indicated when Ottawa knee rules criteria are met after acute trauma.", isPreferred: true },
          mri: { rating: 5, rationale: "MRI is not first-line before radiographs in acute knee trauma." },
        }, NI),
      },
      {
        id: "acute-trauma-low-risk",
        criteria: { redFlags: ["trauma"], trauma: true, priorConservativeCare: true },
        imagingIndicated: false,
        ratings: buildRatings("msk-lower-knee-pain-acute-trauma-low-risk", {
          xr: { rating: 2, rationale: "Radiographs are usually not appropriate when Ottawa knee rules are negative.", isPreferred: true },
          mri: { rating: 2, rationale: "MRI is not indicated for low-risk acute knee injury meeting decision rule criteria." },
        }, NI),
      },
      {
        id: "meniscal-ligament-post-xr",
        criteria: { redFlags: [], priorImaging: true, priorConservativeCare: true },
        ratings: buildRatings("msk-lower-knee-pain-meniscal-ligament-post-xr", {
          mri: { rating: 8, rationale: "MRI knee is appropriate for suspected meniscal or ligament injury after non-diagnostic radiographs.", isPreferred: true },
          xr: { rating: 3, rationale: "Repeat radiographs add little when internal derangement is suspected post-initial XR." },
        }, NI),
      },
      {
        id: "chronic-oa",
        criteria: { redFlags: [], durationDays: { min: 90 } },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("msk-lower-knee-pain-chronic-oa", {
          xr: { rating: 6, rationale: "Weight-bearing knee radiographs may assess osteoarthritis severity when management changes.", isPreferred: true },
          mri: { rating: 2, rationale: "MRI is usually not appropriate for uncomplicated chronic knee osteoarthritis without mechanical symptoms." },
        }, NI),
      },
    ],
  },
  {
    id: "hip-pain",
    region: "msk_lower",
    name: "Hip Pain",
    description: "Hip pain including occult fracture evaluation.",
    presentationKeywords: [
      "hip pain", "hip fracture", "occult fracture", "groin pain",
      "femoral neck", "hip osteoarthritis", "trochanteric pain",
    ],
    icd10Prefixes: ["M16", "S72"],
    variants: [
      {
        id: "occult-fracture-negative-xr",
        criteria: { redFlags: ["osteoporosis", "trauma"], priorImaging: true },
        ratings: buildRatings("msk-lower-hip-pain-occult-fracture-negative-xr", {
          mri: { rating: 9, rationale: "MRI hip is indicated for suspected occult fracture when radiographs are negative.", isPreferred: true },
          ct: { rating: 6, rationale: "CT may detect fracture but MRI is more sensitive for marrow edema and occult injury." },
          xr: { rating: 3, rationale: "Repeat radiographs have low yield after negative initial films with high suspicion." },
        }, NI),
      },
      {
        id: "acute-trauma",
        criteria: { redFlags: ["trauma"], trauma: true },
        isDefault: true,
        ratings: buildRatings("msk-lower-hip-pain-acute-trauma", {
          xr: { rating: 9, rationale: "Hip radiographs are first-line for acute hip trauma and suspected fracture.", isPreferred: true },
          ct: { rating: 7, rationale: "CT may define fracture comminution when surgical planning requires detail." },
        }, NI),
      },
    ],
  },
  {
    id: "ankle-pain",
    region: "msk_lower",
    name: "Ankle Pain",
    description: "Ankle injury triage using Ottawa ankle rules.",
    presentationKeywords: [
      "ankle pain", "ankle sprain", "ankle injury", "ankle fracture",
      "lateral ankle", "ottawa ankle", "twisted ankle",
    ],
    icd10Prefixes: ["S82", "S93"],
    variants: [
      {
        id: "trauma-meets-criteria",
        criteria: { redFlags: ["trauma"], trauma: true },
        isDefault: true,
        ratings: buildRatings("msk-lower-ankle-pain-trauma-meets-criteria", {
          xr: { rating: 8, rationale: "Ankle radiographs are indicated when Ottawa ankle rules criteria are met.", isPreferred: true },
          ct: { rating: 4, rationale: "CT is not first-line for routine ankle trauma meeting XR indications." },
        }, NI),
      },
      {
        id: "trauma-low-risk",
        criteria: { redFlags: ["trauma"], trauma: true, priorConservativeCare: true },
        imagingIndicated: false,
        ratings: buildRatings("msk-lower-ankle-pain-trauma-low-risk", {
          xr: { rating: 2, rationale: "Radiographs are usually not appropriate when Ottawa ankle rules are negative.", isPreferred: true },
        }, NI),
      },
    ],
  },
];
