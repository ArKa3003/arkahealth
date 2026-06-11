import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this thoracic spine presentation; preferred modalities address the clinical question.";

/** Thoracic spine clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const SPINE_THORACIC_SCENARIOS: ClinicalScenario[] = [
  {
    id: "thoracic-back-pain",
    region: "spine_thoracic",
    name: "Thoracic Back Pain",
    description: "Mid-back pain triage including red flags and trauma.",
    presentationKeywords: [
      "thoracic back pain", "mid back pain", "upper back pain", "tspine",
      "thoracic pain", "midback", "thoracic radiculopathy",
    ],
    icd10Prefixes: ["M54.6", "M51", "S22"],
    variants: [
      {
        id: "uncomplicated",
        criteria: { redFlags: [], trauma: false },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("spine-thoracic-thoracic-back-pain-uncomplicated", {
          xr: { rating: 1, rationale: "Imaging is usually not appropriate for uncomplicated atraumatic thoracic back pain without red flags.", isPreferred: true },
          mri: { rating: 2, rationale: "MRI is not first-line for uncomplicated thoracic mechanical back pain." },
        }, NI),
      },
      {
        id: "red-flags",
        criteria: { redFlags: ["cancerHistory", "fever", "weightLoss"] },
        ratings: buildRatings("spine-thoracic-thoracic-back-pain-red-flags", {
          mri: { rating: 9, rationale: "MRI thoracic spine is indicated for back pain with systemic red flags to exclude malignancy or infection.", isPreferred: true },
          ct: { rating: 7, rationale: "CT may evaluate osseous pathology when MRI is contraindicated." },
        }, NI),
      },
      {
        id: "post-trauma",
        criteria: { redFlags: ["trauma"], trauma: true },
        ratings: buildRatings("spine-thoracic-thoracic-back-pain-post-trauma", {
          ct: { rating: 8, rationale: "CT thoracic spine is appropriate for significant thoracic trauma with pain or neurologic symptoms.", isPreferred: true },
          xr: { rating: 6, rationale: "Thoracic radiographs may screen for fracture but CT is more sensitive." },
        }, NI),
      },
    ],
  },
];
