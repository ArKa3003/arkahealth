import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this cervical spine presentation; preferred modalities address the clinical question.";

/** Cervical spine clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const SPINE_CERVICAL_SCENARIOS: ClinicalScenario[] = [
  {
    id: "neck-pain",
    region: "spine_cervical",
    name: "Neck Pain",
    description: "Cervical spine pain including myelopathy and trauma triage.",
    presentationKeywords: [
      "neck pain", "cervical pain", "cervicalgia", "neck ache", "stiff neck",
      "cervical radiculopathy", "myelopathy", "whiplash", "neck strain",
    ],
    icd10Prefixes: ["M54.2", "M50", "S13"],
    variants: [
      {
        id: "uncomplicated",
        criteria: { redFlags: [], trauma: false },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("spine-cervical-neck-pain-uncomplicated", {
          xr: { rating: 1, rationale: "Imaging is usually not appropriate for uncomplicated atraumatic neck pain without neurologic deficit.", isPreferred: true },
          mri: { rating: 2, rationale: "MRI is not indicated for uncomplicated neck pain without red flags or persistent symptoms." },
          ct: { rating: 1, rationale: "CT cervical spine is not appropriate for uncomplicated mechanical neck pain." },
        }, NI),
      },
      {
        id: "myelopathy-signs",
        criteria: { redFlags: ["neurologicalDeficit", "progressiveSymptoms"] },
        ratings: buildRatings("spine-cervical-neck-pain-myelopathy-signs", {
          mri: { rating: 9, rationale: "MRI cervical spine is indicated for suspected myelopathy to evaluate cord compression.", isPreferred: true },
          ct: { rating: 4, rationale: "CT does not adequately assess spinal cord or disc herniation causing myelopathy." },
        }, NI),
      },
      {
        id: "trauma-high-risk",
        criteria: { redFlags: ["trauma"], trauma: true },
        ratings: buildRatings("spine-cervical-neck-pain-trauma-high-risk", {
          ct: { rating: 9, rationale: "CT cervical spine is indicated when cervical trauma fails NEXUS or Canadian C-spine low-risk criteria.", isPreferred: true },
          xr: { rating: 5, rationale: "Radiographs may be used in very low-risk trauma but CT is preferred when criteria are not met." },
        }, NI),
      },
      {
        id: "trauma-low-risk",
        criteria: { redFlags: ["trauma"], trauma: true, priorConservativeCare: true },
        imagingIndicated: false,
        ratings: buildRatings("spine-cervical-neck-pain-trauma-low-risk", {
          ct: { rating: 2, rationale: "CT is usually not appropriate when blunt cervical trauma meets validated low-risk clinical decision criteria.", isPreferred: true },
          xr: { rating: 2, rationale: "Cervical radiographs are usually not needed when clinical clearance criteria are satisfied." },
        }, NI),
      },
    ],
  },
];
