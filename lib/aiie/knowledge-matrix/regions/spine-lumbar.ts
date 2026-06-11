import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this lumbar spine presentation; preferred modalities address the clinical question.";

/** Lumbar spine clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const SPINE_LUMBAR_SCENARIOS: ClinicalScenario[] = [
  {
    id: "low-back-pain",
    region: "spine_lumbar",
    name: "Low Back Pain",
    description: "Lumbar spine pain triage including red flags and duration-based imaging.",
    presentationKeywords: [
      "lbp", "low back", "low back pain", "back pain", "lumbago", "lumbar pain",
      "sciatica", "radiculopathy", "back ache", "lumbar strain", "cauda equina",
    ],
    icd10Prefixes: ["M54", "M51", "M48"],
    variants: [
      {
        id: "uncomplicated-under-6wk",
        criteria: { redFlags: [], durationDays: { max: 42 }, priorConservativeCare: false },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("spine-lumbar-low-back-pain-uncomplicated-under-6wk", {
          xr: { rating: 1, rationale: "Imaging is usually not appropriate for uncomplicated acute low back pain under 6 weeks without red flags.", isPreferred: true },
          ct: { rating: 1, rationale: "CT lumbar spine is not indicated for uncomplicated acute low back pain without red flags." },
          mri: { rating: 1, rationale: "MRI is usually not appropriate for uncomplicated acute low back pain under 6 weeks per ACR Appropriateness Criteria." },
        }, NI),
      },
      {
        id: "radiculopathy-over-6wk",
        criteria: { redFlags: [], durationDays: { min: 42 }, priorConservativeCare: true },
        ratings: buildRatings("spine-lumbar-low-back-pain-radiculopathy-over-6wk", {
          mri: { rating: 8, rationale: "MRI lumbar spine is appropriate for persistent radiculopathy after 6 weeks of conservative care.", isPreferred: true },
          ct: { rating: 4, rationale: "CT is a secondary option when MRI is contraindicated for radiculopathy evaluation." },
          xr: { rating: 3, rationale: "Lumbar radiographs have limited value for radiculopathy after failed conservative therapy." },
        }, NI),
      },
      {
        id: "cauda-equina",
        criteria: { redFlags: ["bladderBowelDysfunction", "neurologicalDeficit"] },
        ratings: buildRatings("spine-lumbar-low-back-pain-cauda-equina", {
          mri: { rating: 9, rationale: "Emergent MRI lumbar spine is indicated for suspected cauda equina syndrome — expedite.", isPreferred: true },
          ct: { rating: 5, rationale: "CT may be used only when MRI is unavailable in cauda equina suspicion." },
        }, NI),
      },
      {
        id: "cancer-history",
        criteria: { redFlags: ["cancerHistory"] },
        ratings: buildRatings("spine-lumbar-low-back-pain-cancer-history", {
          mri: { rating: 9, rationale: "MRI is indicated for back pain with cancer history to evaluate metastatic or epidural disease.", isPreferred: true },
          ct: { rating: 7, rationale: "CT may supplement MRI for osseous metastatic assessment when MRI is limited." },
          pet_ct: { rating: 6, rationale: "PET-CT may stage known malignancy but is not first-line for focal back pain workup." },
        }, NI),
      },
      {
        id: "infection-ivdu",
        criteria: { redFlags: ["fever", "ivDrugUse"] },
        ratings: buildRatings("spine-lumbar-low-back-pain-infection-ivdu", {
          mri_contrast: { rating: 9, rationale: "Contrast-enhanced MRI is preferred for suspected spinal infection or epidural abscess, especially with IVDU.", isPreferred: true },
          ct_contrast: { rating: 6, rationale: "Contrast CT is inferior to MRI for early discitis and epidural infection." },
        }, NI),
      },
      {
        id: "osteoporosis-fragility",
        criteria: { redFlags: ["osteoporosis", "trauma"] },
        ratings: buildRatings("spine-lumbar-low-back-pain-osteoporosis-fragility", {
          mri: { rating: 9, rationale: "MRI detects occult osteoporotic compression fractures and cord compromise not seen on radiographs.", isPreferred: true },
          xr: { rating: 6, rationale: "Lumbar radiographs may show compression fracture but miss early marrow edema." },
          dexa: { rating: 7, rationale: "DEXA assesses bone density after fragility fracture but does not localize acute injury." },
        }, NI),
      },
      {
        id: "post-trauma",
        criteria: { redFlags: ["trauma"], trauma: true },
        ratings: buildRatings("spine-lumbar-low-back-pain-post-trauma", {
          ct: { rating: 8, rationale: "CT lumbar spine is appropriate for significant trauma when fracture is suspected.", isPreferred: true },
          mri: { rating: 8, rationale: "MRI is indicated when neurologic deficit or ligamentous injury is suspected after trauma." },
          xr: { rating: 6, rationale: "Radiographs may screen for fracture but CT or MRI is preferred for high-energy trauma." },
        }, NI),
      },
    ],
  },
];
