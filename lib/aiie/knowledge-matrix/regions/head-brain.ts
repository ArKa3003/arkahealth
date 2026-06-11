import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this neurologic presentation; alternative modalities are preferred.";

/** Head and brain clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const HEAD_BRAIN_SCENARIOS: ClinicalScenario[] = [
  {
    id: "acute-headache",
    region: "head_brain",
    name: "Acute Headache",
    description: "New or worsening headache requiring neuroimaging triage.",
    presentationKeywords: [
      "headache", "head ache", "head pain", "cephalgia", "migraine", "ha",
      "worst headache", "thunderclap", "sudden headache", "new headache",
    ],
    icd10Prefixes: ["R51", "G44"],
    variants: [
      {
        id: "thunderclap",
        criteria: { redFlags: ["suddenOnset"] },
        ratings: buildRatings("head-brain-acute-headache-thunderclap", {
          ct: { rating: 9, rationale: "Non-contrast head CT is first-line for thunderclap headache to exclude subarachnoid hemorrhage.", isPreferred: true },
          ct_contrast: { rating: 4, rationale: "Contrast CT adds limited value acutely for SAH detection compared with non-contrast CT." },
          cta: { rating: 7, rationale: "CTA may follow non-contrast CT when aneurysm or vascular cause is suspected." },
          mri: { rating: 5, rationale: "MRI is less available emergently and may miss acute SAH compared with CT." },
          mri_contrast: { rating: 4, rationale: "Contrast MRI is not first-line for acute thunderclap headache workup." },
          mra: { rating: 6, rationale: "MRA can supplement CTA for aneurysm evaluation when CT is inconclusive." },
        }, NI),
      },
      {
        id: "neuro-deficit",
        criteria: { redFlags: ["neurologicalDeficit"] },
        ratings: buildRatings("head-brain-acute-headache-neuro-deficit", {
          mri: { rating: 9, rationale: "MRI brain is preferred for headache with focal neurologic deficit to evaluate stroke, mass, or demyelination.", isPreferred: true },
          ct: { rating: 8, rationale: "Non-contrast CT is appropriate when MRI is unavailable or contraindicated." },
          mra: { rating: 7, rationale: "MRA helps evaluate vascular etiologies when deficit suggests ischemia or dissection." },
          cta: { rating: 7, rationale: "CTA is useful when acute vascular pathology is suspected alongside neurologic deficit." },
        }, NI),
      },
      {
        id: "fever-immunocompromised",
        criteria: { redFlags: ["fever", "immunocompromised"] },
        ratings: buildRatings("head-brain-acute-headache-fever-immunocompromised", {
          mri_contrast: { rating: 9, rationale: "Contrast-enhanced MRI is preferred for headache with fever in immunocompromised hosts to detect CNS infection or abscess.", isPreferred: true },
          ct_contrast: { rating: 7, rationale: "Contrast CT is an alternative when MRI is unavailable in suspected CNS infection." },
          mri: { rating: 6, rationale: "Non-contrast MRI may miss meningeal or parenchymal enhancement in infection." },
        }, NI),
      },
      {
        id: "chronic-stable",
        criteria: { redFlags: [], durationDays: { min: 42 } },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("head-brain-acute-headache-chronic-stable", {
          xr: { rating: 1, rationale: "Skull radiographs do not evaluate intracranial causes of chronic stable headache.", isPreferred: true },
          ct: { rating: 2, rationale: "Routine CT is not indicated for chronic stable headache without red flags per Choosing Wisely." },
          mri: { rating: 3, rationale: "MRI may be considered only if red flags emerge during conservative management." },
        }, NI),
      },
      {
        id: "new-over-50",
        criteria: { redFlags: ["ageOver50"] },
        ratings: buildRatings("head-brain-acute-headache-new-over-50", {
          mri: { rating: 8, rationale: "New headache after age 50 warrants MRI to exclude secondary causes including mass and giant cell arteritis territory disease.", isPreferred: true },
          ct: { rating: 7, rationale: "CT is acceptable when MRI is delayed or contraindicated for new headache over 50." },
        }, NI),
      },
      {
        id: "post-trauma-gcs-under-15",
        criteria: { redFlags: ["trauma"], trauma: true },
        ratings: buildRatings("head-brain-acute-headache-post-trauma-gcs-under-15", {
          ct: { rating: 9, rationale: "Non-contrast head CT is indicated for head trauma with GCS less than 15 per major trauma guidelines.", isPreferred: true },
          mri: { rating: 5, rationale: "MRI is not first-line acutely for moderate-severe traumatic brain injury evaluation." },
        }, NI),
      },
      {
        id: "post-trauma-gcs-15-low-risk",
        criteria: { redFlags: ["trauma"], trauma: true, priorConservativeCare: true },
        imagingIndicated: false,
        ratings: buildRatings("head-brain-acute-headache-post-trauma-gcs-15-low-risk", {
          ct: { rating: 2, rationale: "CT is usually not appropriate for minor head trauma meeting validated low-risk clinical decision rule criteria.", isPreferred: true },
          xr: { rating: 1, rationale: "Skull radiographs do not assess intracranial injury after head trauma." },
        }, NI),
      },
    ],
  },
  {
    id: "suspected-stroke",
    region: "head_brain",
    name: "Suspected Stroke",
    description: "Acute cerebrovascular event evaluation for thrombolysis or intervention.",
    presentationKeywords: [
      "stroke", "cva", "tia", "facial droop", "aphasia", "hemiparesis",
      "weakness", "numbness", "wake up stroke", "lacunar",
    ],
    icd10Prefixes: ["I63", "I64", "G45"],
    variants: [
      {
        id: "acute-under-4-5h",
        criteria: { redFlags: ["suddenOnset"], durationDays: { max: 1 } },
        isDefault: true,
        ratings: buildRatings("head-brain-suspected-stroke-acute-under-4-5h", {
          ct: { rating: 9, rationale: "Non-contrast head CT is mandatory emergently to exclude hemorrhage before thrombolysis.", isPreferred: true },
          cta: { rating: 9, rationale: "CTA head/neck identifies large-vessel occlusion guiding thrombectomy candidacy." },
          mri: { rating: 8, rationale: "MRI with diffusion is highly sensitive for acute ischemia when CT is negative." },
          mra: { rating: 8, rationale: "MRA complements CTA for intracranial vessel assessment in acute stroke." },
        }, NI),
      },
      {
        id: "wake-up-stroke",
        criteria: { redFlags: ["suddenOnset"] },
        ratings: buildRatings("head-brain-suspected-stroke-wake-up", {
          mri: { rating: 9, rationale: "MRI with DWI is preferred for wake-up stroke to define infarct age and eligibility for intervention.", isPreferred: true },
          ct: { rating: 8, rationale: "Non-contrast CT excludes hemorrhage as the initial safety study." },
          cta: { rating: 8, rationale: "CTA evaluates large-vessel occlusion in wake-up stroke protocols." },
        }, NI),
      },
      {
        id: "tia",
        criteria: { redFlags: ["suddenOnset"], durationDays: { max: 1 } },
        ratings: buildRatings("head-brain-suspected-stroke-tia", {
          mri: { rating: 9, rationale: "MRI brain is recommended for TIA to detect acute infarction and guide secondary prevention.", isPreferred: true },
          cta: { rating: 8, rationale: "CTA or MRA of carotids is appropriate in TIA workup for stenosis." },
          mra: { rating: 8, rationale: "MRA neck evaluates carotid disease in TIA patients without immediate CTA need." },
          ct: { rating: 6, rationale: "CT alone may miss small cortical infarcts in TIA." },
        }, NI),
      },
    ],
  },
  {
    id: "seizure",
    region: "head_brain",
    name: "Seizure",
    description: "New or breakthrough seizure requiring neuroimaging triage.",
    presentationKeywords: [
      "seizure", "seizures", "convulsion", "epilepsy", "first seizure",
      "breakthrough seizure", "status epilepticus", "sz",
    ],
    icd10Prefixes: ["R56", "G40"],
    variants: [
      {
        id: "first-seizure",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("head-brain-seizure-first", {
          mri: { rating: 9, rationale: "MRI brain is appropriate for first unprovoked seizure in adults to identify structural lesions.", isPreferred: true },
          ct: { rating: 7, rationale: "CT is acceptable emergently when MRI is unavailable or patient is unstable." },
        }, NI),
      },
      {
        id: "breakthrough",
        criteria: { redFlags: ["progressiveSymptoms"] },
        ratings: buildRatings("head-brain-seizure-breakthrough", {
          mri: { rating: 8, rationale: "Breakthrough seizure with new features warrants repeat MRI to exclude progressive structural disease.", isPreferred: true },
          ct: { rating: 6, rationale: "CT may be used when MRI access is limited in breakthrough seizure evaluation." },
        }, NI),
      },
    ],
  },
  {
    id: "head-trauma",
    region: "head_brain",
    name: "Head Trauma",
    description: "Traumatic head injury stratified by age and clinical decision rules.",
    presentationKeywords: [
      "head trauma", "head injury", "tbi", "concussion", "fall hit head",
      "pediatric head injury", "infant head injury", "loc", "loss of consciousness",
    ],
    icd10Prefixes: ["S06", "S09"],
    variants: [
      {
        id: "adult-high-risk",
        criteria: { redFlags: ["trauma", "neurologicalDeficit"], trauma: true },
        isDefault: true,
        ratings: buildRatings("head-brain-head-trauma-adult-high-risk", {
          ct: { rating: 9, rationale: "CT head is indicated for adult head trauma with high-risk features per validated decision rules.", isPreferred: true },
        }, NI),
      },
      {
        id: "adult-low-risk",
        criteria: { redFlags: ["trauma"], trauma: true, ageRange: { min: 18 } },
        imagingIndicated: false,
        ratings: buildRatings("head-brain-head-trauma-adult-low-risk", {
          ct: { rating: 2, rationale: "CT is usually not appropriate when adult minor head injury meets low-risk clinical criteria.", isPreferred: true },
          xr: { rating: 1, rationale: "Skull radiographs do not assess intracranial traumatic injury." },
        }, NI),
      },
      {
        id: "pediatric-under-2",
        criteria: { redFlags: ["trauma", "ageUnder18"], trauma: true, ageRange: { max: 2 } },
        ratings: buildRatings("head-brain-head-trauma-pediatric-under-2", {
          ct: { rating: 8, rationale: "CT head is often indicated in infants under 2 with head trauma due to limited exam and abuse concern.", isPreferred: true },
        }, NI),
      },
      {
        id: "pediatric-2-to-18",
        criteria: { redFlags: ["trauma", "ageUnder18"], trauma: true, ageRange: { min: 2, max: 18 } },
        ratings: buildRatings("head-brain-head-trauma-pediatric-2-to-18", {
          ct: { rating: 7, rationale: "CT is indicated when pediatric head trauma fails PECARN low-risk criteria.", isPreferred: true },
          xr: { rating: 1, rationale: "Skull films are not appropriate for pediatric intracranial injury assessment." },
        }, NI),
      },
      {
        id: "pediatric-low-risk",
        criteria: { redFlags: ["trauma", "ageUnder18"], trauma: true, ageRange: { min: 2, max: 18 }, priorConservativeCare: true },
        imagingIndicated: false,
        ratings: buildRatings("head-brain-head-trauma-pediatric-low-risk", {
          ct: { rating: 2, rationale: "CT is usually not appropriate when pediatric head trauma meets PECARN low-risk criteria; observation avoids unnecessary radiation.", isPreferred: true },
          xr: { rating: 1, rationale: "Skull radiographs do not assess intracranial injury in pediatric head trauma." },
        }, NI),
      },
    ],
  },
];
