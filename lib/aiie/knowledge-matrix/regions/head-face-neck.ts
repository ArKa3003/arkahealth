import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this head, face, or neck presentation; preferred modalities address the clinical question.";

/** Head, face, and neck clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const HEAD_FACE_NECK_SCENARIOS: ClinicalScenario[] = [
  {
    id: "sinusitis",
    region: "head_face_neck",
    name: "Sinusitis",
    description: "Acute and complicated sinusitis imaging triage.",
    presentationKeywords: [
      "sinusitis", "sinus infection", "rhinosinusitis", "facial pain sinus",
      "sinus congestion", "sinus headache", "maxillary sinus",
    ],
    icd10Prefixes: ["J01", "J32"],
    variants: [
      {
        id: "uncomplicated",
        criteria: { redFlags: [] },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("head-face-neck-sinusitis-uncomplicated", {
          ct: { rating: 1, rationale: "Imaging is usually not appropriate for uncomplicated acute sinusitis diagnosed clinically.", isPreferred: true },
          xr: { rating: 1, rationale: "Sinus radiographs do not change management of uncomplicated acute sinusitis." },
          mri: { rating: 1, rationale: "MRI is not indicated for routine uncomplicated sinusitis." },
        }, NI),
      },
      {
        id: "complicated-orbital",
        criteria: { redFlags: ["fever", "neurologicalDeficit"] },
        ratings: buildRatings("head-face-neck-sinusitis-complicated-orbital", {
          ct: { rating: 8, rationale: "CT sinuses with contrast is appropriate for complicated sinusitis with orbital or intracranial extension concern.", isPreferred: true },
          ct_contrast: { rating: 8, rationale: "Contrast CT evaluates orbital cellulitis, abscess, and cavernous sinus involvement." },
          mri: { rating: 7, rationale: "MRI supplements CT for intracranial complications of sinusitis." },
        }, NI),
      },
    ],
  },
  {
    id: "thyroid-nodule",
    region: "head_face_neck",
    name: "Thyroid Nodule",
    description: "Thyroid nodule characterization and FNA triage.",
    presentationKeywords: [
      "thyroid nodule", "thyroid mass", "goiter nodule", "thyroid lump",
      "cold nodule", "thyroid ultrasound", "tsh nodule",
    ],
    icd10Prefixes: ["E04", "D34"],
    variants: [
      {
        id: "initial-characterization",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("head-face-neck-thyroid-nodule-initial-characterization", {
          us: { rating: 9, rationale: "Thyroid ultrasound is first-line for nodule characterization and TI-RADS assessment.", isPreferred: true },
          ct: { rating: 3, rationale: "CT is not first-line for thyroid nodule evaluation and delivers neck radiation." },
          nm: { rating: 5, rationale: "Thyroid scintigraphy is for hyperfunctioning nodule assessment, not all nodules." },
        }, NI),
      },
    ],
  },
  {
    id: "neck-mass-adult",
    region: "head_face_neck",
    name: "Neck Mass (Adult)",
    description: "Adult neck mass evaluation including malignancy workup.",
    presentationKeywords: [
      "neck mass", "neck lump", "cervical mass", "lymphadenopathy",
      "enlarged lymph node", "neck swelling adult", "supraclavicular mass",
    ],
    icd10Prefixes: ["R22", "R59"],
    variants: [
      {
        id: "persistent-adult",
        criteria: { redFlags: [], ageRange: { min: 18 }, durationDays: { min: 14 } },
        isDefault: true,
        ratings: buildRatings("head-face-neck-neck-mass-adult-persistent", {
          ct: { rating: 8, rationale: "Contrast CT neck is appropriate for persistent adult neck mass to evaluate nodal and primary sites.", isPreferred: true },
          ct_contrast: { rating: 8, rationale: "Contrast-enhanced CT defines neck mass extent and vascular involvement." },
          us: { rating: 6, rationale: "Ultrasound may characterize superficial nodes but CT/MRI evaluates deep spaces." },
          mri: { rating: 7, rationale: "MRI neck is an alternative for soft-tissue characterization without radiation." },
          pet_ct: { rating: 6, rationale: "PET-CT may stage known malignancy but is not first-line for initial neck mass." },
        }, NI),
      },
      {
        id: "with-red-flags",
        criteria: { redFlags: ["weightLoss", "cancerHistory", "fever"] },
        ratings: buildRatings("head-face-neck-neck-mass-adult-with-red-flags", {
          ct_contrast: { rating: 9, rationale: "Contrast CT neck is indicated for neck mass with systemic red flags to exclude malignancy or abscess.", isPreferred: true },
          pet_ct: { rating: 7, rationale: "PET-CT may aid oncologic staging when malignancy is confirmed." },
        }, NI),
      },
    ],
  },
];
