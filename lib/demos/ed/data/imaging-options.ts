// @ts-nocheck
/**
 * Imaging Options Database
 *
 * Comprehensive database of all imaging modalities available in ARKA-ED.
 * Includes cost, radiation, indications, and contraindications for each option.
 *
 * Data sources:
 * - ACR Appropriateness Criteria
 * - Medicare fee schedules (approximate costs)
 * - ACR-AAPM radiation dose guidelines
 */

import type { ImagingOption, Modality } from "@/lib/demos/ed/types";

// ============================================================================
// Imaging Options Database
// ============================================================================

export const imagingOptions: ImagingOption[] = [
  // ==========================================================================
  // X-RAY OPTIONS (6)
  // ==========================================================================
  {
    id: "xray-chest",
    name: "Chest X-ray (PA and Lateral)",
    short_name: "CXR",
    modality: "xray",
    body_region: "chest",
    with_contrast: false,
    typical_cost_usd: 100,
    radiation_msv: 0.1,
    description:
      "Standard two-view chest radiograph providing frontal and lateral views of the thorax. First-line imaging for evaluation of chest pathology.",
    common_indications: [
      "Chest pain",
      "Shortness of breath",
      "Cough",
      "Fever with respiratory symptoms",
      "Pre-operative evaluation",
      "Pneumonia",
      "Heart failure",
    ],
    contraindications: ["Pregnancy (relative - shield abdomen if necessary)"],
    duration: "5-10 minutes",
    is_active: true,
  },
  {
    id: "xray-lumbar",
    name: "X-ray Lumbar Spine (AP and Lateral)",
    short_name: "XR L-Spine",
    modality: "xray",
    body_region: "spine",
    with_contrast: false,
    typical_cost_usd: 150,
    radiation_msv: 1.5,
    description:
      "Standard radiographic evaluation of the lumbar spine. Useful for evaluating bony alignment, degenerative changes, and fractures.",
    common_indications: [
      "Low back pain with red flags",
      "Trauma",
      "Suspected compression fracture",
      "Scoliosis evaluation",
      "Post-surgical follow-up",
    ],
    contraindications: ["Pregnancy (relative)"],
    duration: "10-15 minutes",
    is_active: true,
  },
  {
    id: "xray-cervical",
    name: "X-ray Cervical Spine (AP, Lateral, Odontoid)",
    short_name: "XR C-Spine",
    modality: "xray",
    body_region: "spine",
    with_contrast: false,
    typical_cost_usd: 150,
    radiation_msv: 0.2,
    description:
      "Three-view cervical spine radiograph series for evaluation of cervical spine alignment and bony structures.",
    common_indications: [
      "Neck pain",
      "Minor trauma (low-risk by NEXUS/Canadian C-Spine Rule)",
      "Degenerative changes",
      "Range of motion evaluation",
    ],
    contraindications: ["Pregnancy (relative)", "High-risk trauma (use CT)"],
    duration: "10-15 minutes",
    is_active: true,
  },
  {
    id: "xray-ankle",
    name: "X-ray Ankle (AP, Lateral, Mortise)",
    short_name: "XR Ankle",
    modality: "xray",
    body_region: "extremity",
    with_contrast: false,
    typical_cost_usd: 80,
    radiation_msv: 0.001,
    description:
      "Three-view ankle radiograph series for evaluation of ankle injuries, particularly fractures.",
    common_indications: [
      "Ankle injury meeting Ottawa Ankle Rules",
      "Suspected fracture",
      "Post-injury evaluation",
      "Chronic ankle instability",
    ],
    contraindications: [],
    duration: "5-10 minutes",
    is_active: true,
  },
  {
    id: "xray-hip",
    name: "X-ray Hip (AP Pelvis and Lateral Hip)",
    short_name: "XR Hip",
    modality: "xray",
    body_region: "extremity",
    with_contrast: false,
    typical_cost_usd: 120,
    radiation_msv: 0.7,
    description:
      "Standard hip radiographs including AP pelvis and lateral view of affected hip for evaluation of hip pathology.",
    common_indications: [
      "Hip pain",
      "Fall in elderly",
      "Suspected hip fracture",
      "Osteoarthritis evaluation",
      "Avascular necrosis screening",
    ],
    contraindications: ["Pregnancy (relative)"],
    duration: "10-15 minutes",
    is_active: true,
  },
  {
    id: "xray-abdomen",
    name: "X-ray Abdomen (Supine and Upright)",
    short_name: "KUB",
    modality: "xray",
    body_region: "abdomen",
    with_contrast: false,
    typical_cost_usd: 100,
    radiation_msv: 0.7,
    description:
      "Abdominal radiograph series for evaluation of bowel gas pattern, calcifications, and foreign bodies.",
    common_indications: [
      "Suspected bowel obstruction",
      "Foreign body ingestion",
      "Renal calculi (limited)",
      "Constipation",
      "Post-procedure evaluation",
    ],
    contraindications: ["Pregnancy (relative)"],
    duration: "10 minutes",
    is_active: true,
  },

  // ==========================================================================
  // CT OPTIONS (8)
  // ==========================================================================
  {
    id: "ct-head-nc",
    name: "CT Head without Contrast",
    short_name: "CT Head",
    modality: "ct",
    body_region: "head",
    with_contrast: false,
    typical_cost_usd: 500,
    radiation_msv: 2.0,
    description:
      "Non-contrast computed tomography of the brain. Excellent for detecting acute hemorrhage, mass effect, hydrocephalus, and skull fractures.",
    common_indications: [
      "Acute headache",
      "Head trauma",
      "Altered mental status",
      "Suspected stroke",
      "Seizure workup",
      "Pre-lumbar puncture",
    ],
    contraindications: ["Pregnancy (relative - benefit must outweigh risk)"],
    duration: "5-10 minutes",
    is_active: true,
  },
  {
    id: "ct-head-c",
    name: "CT Head with Contrast",
    short_name: "CT Head w/C",
    modality: "ct",
    body_region: "head",
    with_contrast: true,
    typical_cost_usd: 700,
    radiation_msv: 2.0,
    description:
      "Contrast-enhanced CT of the brain. Useful for evaluation of tumors, infections, and vascular abnormalities.",
    common_indications: [
      "Known or suspected brain tumor",
      "Brain abscess",
      "Meningitis workup",
      "Post-contrast enhancement evaluation",
    ],
    contraindications: [
      "Contrast allergy",
      "Renal insufficiency (eGFR < 30)",
      "Pregnancy",
    ],
    duration: "10-15 minutes",
    is_active: true,
  },
  {
    id: "ct-cervical",
    name: "CT Cervical Spine without Contrast",
    short_name: "CT C-Spine",
    modality: "ct",
    body_region: "spine",
    with_contrast: false,
    typical_cost_usd: 600,
    radiation_msv: 3.0,
    description:
      "High-resolution CT of the cervical spine for detailed evaluation of bony structures. Superior to X-ray for fracture detection.",
    common_indications: [
      "Trauma (high-risk by clinical criteria)",
      "Suspected cervical fracture",
      "Failed X-ray evaluation",
      "Degenerative stenosis",
    ],
    contraindications: ["Pregnancy (relative)"],
    duration: "5-10 minutes",
    is_active: true,
  },
  {
    id: "ct-chest-nc",
    name: "CT Chest without Contrast",
    short_name: "CT Chest",
    modality: "ct",
    body_region: "chest",
    with_contrast: false,
    typical_cost_usd: 600,
    radiation_msv: 7.0,
    description:
      "Non-contrast CT of the chest for evaluation of lung parenchyma, mediastinum, and chest wall.",
    common_indications: [
      "Lung nodule characterization",
      "Interstitial lung disease",
      "Pneumonia complications",
      "Lung cancer screening",
      "COVID-19 evaluation",
    ],
    contraindications: ["Pregnancy (relative)"],
    duration: "5-10 minutes",
    is_active: true,
  },
  {
    id: "ct-chest-c",
    name: "CT Chest with Contrast",
    short_name: "CT Chest w/C",
    modality: "ct",
    body_region: "chest",
    with_contrast: true,
    typical_cost_usd: 800,
    radiation_msv: 7.0,
    description:
      "Contrast-enhanced CT of the chest for evaluation of mediastinal structures, lymphadenopathy, and vascular abnormalities.",
    common_indications: [
      "Mediastinal mass",
      "Lymphadenopathy",
      "Staging malignancy",
      "Aortic evaluation (non-CTA)",
      "Empyema",
    ],
    contraindications: [
      "Contrast allergy",
      "Renal insufficiency",
      "Pregnancy",
    ],
    duration: "10-15 minutes",
    is_active: true,
  },
  {
    id: "ct-abd-pelvis-nc",
    name: "CT Abdomen/Pelvis without Contrast",
    short_name: "CT A/P",
    modality: "ct",
    body_region: "abdomen",
    with_contrast: false,
    typical_cost_usd: 700,
    radiation_msv: 10.0,
    description:
      "Non-contrast CT of the abdomen and pelvis. Primary imaging for renal colic and useful when contrast is contraindicated.",
    common_indications: [
      "Renal colic / kidney stones",
      "Appendicitis (limited)",
      "Contrast contraindicated",
      "Follow-up known findings",
    ],
    contraindications: ["Pregnancy (relative)"],
    duration: "5-10 minutes",
    is_active: true,
  },
  {
    id: "ct-abd-pelvis-c",
    name: "CT Abdomen/Pelvis with Contrast",
    short_name: "CT A/P w/C",
    modality: "ct",
    body_region: "abdomen",
    with_contrast: true,
    typical_cost_usd: 900,
    radiation_msv: 10.0,
    description:
      "Contrast-enhanced CT of the abdomen and pelvis. Gold standard for evaluation of most acute abdominal pathology.",
    common_indications: [
      "Abdominal pain",
      "Appendicitis",
      "Diverticulitis",
      "Bowel obstruction",
      "Abscess",
      "Malignancy staging",
    ],
    contraindications: [
      "Contrast allergy",
      "Renal insufficiency",
      "Pregnancy",
    ],
    duration: "10-15 minutes",
    is_active: true,
  },
  {
    id: "cta-chest-pe",
    name: "CT Angiography Chest (PE Protocol)",
    short_name: "CTA PE",
    modality: "ct",
    body_region: "chest",
    with_contrast: true,
    typical_cost_usd: 1000,
    radiation_msv: 8.0,
    description:
      "CT angiography optimized for pulmonary embolism detection. Uses bolus-tracking for optimal pulmonary arterial opacification.",
    common_indications: [
      "Suspected pulmonary embolism",
      "High Wells score or elevated D-dimer",
      "Unexplained hypoxia",
      "Chest pain with PE risk factors",
    ],
    contraindications: [
      "Contrast allergy",
      "Renal insufficiency",
      "Pregnancy (consider V/Q scan)",
    ],
    duration: "10-15 minutes",
    is_active: true,
  },

  // ==========================================================================
  // MRI OPTIONS (6)
  // ==========================================================================
  {
    id: "mri-brain-nc",
    name: "MRI Brain without Contrast",
    short_name: "MRI Brain",
    modality: "mri",
    body_region: "head",
    with_contrast: false,
    typical_cost_usd: 1500,
    radiation_msv: 0,
    description:
      "Non-contrast MRI of the brain providing excellent soft tissue contrast. Superior to CT for most non-acute intracranial pathology.",
    common_indications: [
      "Subacute/chronic headache",
      "Seizure workup",
      "Multiple sclerosis",
      "Stroke (subacute)",
      "Dementia evaluation",
      "Pituitary evaluation",
    ],
    contraindications: [
      "Pacemaker/defibrillator (most)",
      "Cochlear implants",
      "Metallic foreign body near vital structures",
      "Severe claustrophobia",
    ],
    duration: "30-45 minutes",
    is_active: true,
  },
  {
    id: "mri-brain-c",
    name: "MRI Brain with and without Contrast",
    short_name: "MRI Brain w/C",
    modality: "mri",
    body_region: "head",
    with_contrast: true,
    typical_cost_usd: 2000,
    radiation_msv: 0,
    description:
      "Contrast-enhanced MRI of the brain. Essential for tumor characterization, infection evaluation, and inflammatory conditions.",
    common_indications: [
      "Brain tumor (primary or metastatic)",
      "Brain abscess",
      "Meningitis/encephalitis",
      "Multiple sclerosis active disease",
      "Post-surgical evaluation",
    ],
    contraindications: [
      "Pacemaker/defibrillator",
      "Gadolinium allergy",
      "Severe renal insufficiency (NSF risk)",
      "Pregnancy (relative)",
    ],
    duration: "45-60 minutes",
    is_active: true,
  },
  {
    id: "mri-lumbar-nc",
    name: "MRI Lumbar Spine without Contrast",
    short_name: "MRI L-Spine",
    modality: "mri",
    body_region: "spine",
    with_contrast: false,
    typical_cost_usd: 1400,
    radiation_msv: 0,
    description:
      "Non-contrast MRI of the lumbar spine. Gold standard for evaluation of disc disease, spinal stenosis, and neural compression.",
    common_indications: [
      "Low back pain with red flags",
      "Radiculopathy > 6 weeks",
      "Cauda equina syndrome",
      "Spinal stenosis",
      "Failed conservative therapy",
    ],
    contraindications: [
      "Pacemaker/defibrillator",
      "Metallic implants (check compatibility)",
      "Severe claustrophobia",
    ],
    duration: "30-45 minutes",
    is_active: true,
  },
  {
    id: "mri-lumbar-c",
    name: "MRI Lumbar Spine with and without Contrast",
    short_name: "MRI L-Spine w/C",
    modality: "mri",
    body_region: "spine",
    with_contrast: true,
    typical_cost_usd: 1800,
    radiation_msv: 0,
    description:
      "Contrast-enhanced MRI of the lumbar spine. Indicated for post-operative evaluation, infection, and tumor assessment.",
    common_indications: [
      "Post-operative spine (scar vs recurrent disc)",
      "Suspected spinal infection",
      "Spinal metastases",
      "Epidural abscess",
    ],
    contraindications: [
      "Pacemaker/defibrillator",
      "Gadolinium allergy",
      "Severe renal insufficiency",
    ],
    duration: "45-60 minutes",
    is_active: true,
  },
  {
    id: "mri-cervical-nc",
    name: "MRI Cervical Spine without Contrast",
    short_name: "MRI C-Spine",
    modality: "mri",
    body_region: "spine",
    with_contrast: false,
    typical_cost_usd: 1400,
    radiation_msv: 0,
    description:
      "Non-contrast MRI of the cervical spine for evaluation of disc disease, cord compression, and cervical pathology.",
    common_indications: [
      "Cervical radiculopathy",
      "Myelopathy symptoms",
      "Cervical stenosis",
      "Cord compression evaluation",
      "Ligamentous injury (trauma)",
    ],
    contraindications: [
      "Pacemaker/defibrillator",
      "Metallic implants (check compatibility)",
      "Severe claustrophobia",
    ],
    duration: "30-45 minutes",
    is_active: true,
  },
  {
    id: "mri-knee",
    name: "MRI Knee without Contrast",
    short_name: "MRI Knee",
    modality: "mri",
    body_region: "extremity",
    with_contrast: false,
    typical_cost_usd: 1200,
    radiation_msv: 0,
    description:
      "Non-contrast MRI of the knee. Excellent for evaluation of soft tissue structures including menisci, ligaments, and cartilage.",
    common_indications: [
      "Suspected meniscal tear",
      "ACL/PCL injury",
      "Collateral ligament injury",
      "Internal derangement",
      "Osteochondral lesions",
    ],
    contraindications: [
      "Pacemaker/defibrillator",
      "Metallic implants (check compatibility)",
      "Severe claustrophobia",
    ],
    duration: "30-45 minutes",
    is_active: true,
  },

  // ==========================================================================
  // ULTRASOUND OPTIONS (4)
  // ==========================================================================
  {
    id: "us-abdomen",
    name: "Ultrasound Abdomen Complete",
    short_name: "US Abd",
    modality: "ultrasound",
    body_region: "abdomen",
    with_contrast: false,
    typical_cost_usd: 300,
    radiation_msv: 0,
    description:
      "Complete abdominal ultrasound evaluating liver, gallbladder, pancreas, spleen, and kidneys. No radiation exposure.",
    common_indications: [
      "Right upper quadrant pain",
      "Gallbladder disease",
      "Liver evaluation",
      "Kidney evaluation",
      "Ascites",
      "Abdominal aortic aneurysm screening",
    ],
    contraindications: ["Recent barium study (limited visualization)"],
    duration: "20-30 minutes",
    is_active: true,
  },
  {
    id: "us-pelvis",
    name: "Ultrasound Pelvis (Transabdominal ± Transvaginal)",
    short_name: "US Pelvis",
    modality: "ultrasound",
    body_region: "pelvis",
    with_contrast: false,
    typical_cost_usd: 350,
    radiation_msv: 0,
    description:
      "Pelvic ultrasound for evaluation of uterus, ovaries, and adnexa. Includes transabdominal and transvaginal components.",
    common_indications: [
      "Pelvic pain",
      "Abnormal uterine bleeding",
      "Ovarian cyst evaluation",
      "First trimester pregnancy",
      "Ectopic pregnancy",
      "Fibroid evaluation",
    ],
    contraindications: ["Patient refusal of transvaginal component"],
    duration: "20-30 minutes",
    is_active: true,
  },
  {
    id: "us-le-venous",
    name: "Ultrasound Lower Extremity Venous Duplex",
    short_name: "US LE Venous",
    modality: "ultrasound",
    body_region: "extremity",
    with_contrast: false,
    typical_cost_usd: 400,
    radiation_msv: 0,
    description:
      "Venous duplex ultrasound of the lower extremity for evaluation of deep vein thrombosis. Includes compression and Doppler assessment.",
    common_indications: [
      "Suspected DVT",
      "Leg swelling",
      "Leg pain with DVT risk factors",
      "Elevated D-dimer",
      "PE workup",
    ],
    contraindications: ["Severe leg trauma (limited exam)"],
    duration: "30-45 minutes",
    is_active: true,
  },
  {
    id: "echo-tte",
    name: "Echocardiogram (Transthoracic)",
    short_name: "TTE",
    modality: "ultrasound",
    body_region: "chest",
    with_contrast: false,
    typical_cost_usd: 500,
    radiation_msv: 0,
    description:
      "Transthoracic echocardiogram for evaluation of cardiac structure and function. Includes 2D imaging, Doppler, and color flow.",
    common_indications: [
      "Heart failure evaluation",
      "Valve disease",
      "Cardiomyopathy",
      "Pericardial effusion",
      "Chest pain (cardiac function)",
      "Murmur evaluation",
    ],
    contraindications: ["Poor acoustic windows (consider TEE)"],
    duration: "30-45 minutes",
    is_active: true,
  },

  // ==========================================================================
  // NUCLEAR MEDICINE OPTIONS (3)
  // ==========================================================================
  {
    id: "nm-vq-scan",
    name: "V/Q Scan (Ventilation/Perfusion)",
    short_name: "V/Q Scan",
    modality: "nuclear",
    body_region: "chest",
    with_contrast: false,
    typical_cost_usd: 800,
    radiation_msv: 2.0,
    description:
      "Nuclear medicine study evaluating pulmonary ventilation and perfusion. Alternative to CTA for PE evaluation, especially in pregnancy.",
    common_indications: [
      "Suspected PE with CTA contraindication",
      "PE evaluation in pregnancy",
      "Renal insufficiency",
      "Contrast allergy",
      "Chronic PE evaluation",
    ],
    contraindications: [
      "Severe pulmonary disease (difficult interpretation)",
      "Active COVID-19 (ventilation contraindicated)",
    ],
    duration: "45-60 minutes",
    is_active: true,
  },
  {
    id: "nm-bone-scan",
    name: "Bone Scan (Whole Body)",
    short_name: "Bone Scan",
    modality: "nuclear",
    body_region: "whole-body",
    with_contrast: false,
    typical_cost_usd: 700,
    radiation_msv: 6.0,
    description:
      "Whole body nuclear medicine bone scan using technetium-99m for detection of osseous abnormalities.",
    common_indications: [
      "Metastatic bone disease",
      "Osteomyelitis",
      "Occult fracture",
      "Paget's disease",
      "Primary bone tumor",
      "Arthritis evaluation",
    ],
    contraindications: ["Pregnancy", "Breastfeeding (temporary cessation)"],
    duration: "2-4 hours (includes uptake time)",
    is_active: true,
  },
  {
    id: "nm-myocardial-perfusion",
    name: "Myocardial Perfusion Imaging (Stress/Rest)",
    short_name: "MPI",
    modality: "nuclear",
    body_region: "chest",
    with_contrast: false,
    typical_cost_usd: 1500,
    radiation_msv: 12.0,
    description:
      "Nuclear cardiology study evaluating myocardial perfusion at rest and during stress. Uses technetium-99m or thallium-201.",
    common_indications: [
      "Chest pain evaluation",
      "Known CAD risk stratification",
      "Pre-operative cardiac evaluation",
      "Post-revascularization assessment",
      "Abnormal stress ECG",
    ],
    contraindications: [
      "Acute MI",
      "Unstable angina",
      "Severe aortic stenosis",
      "Uncontrolled hypertension",
    ],
    duration: "3-4 hours",
    is_active: true,
  },

  // ==========================================================================
  // SPECIAL OPTIONS (1)
  // ==========================================================================
  {
    id: "no-imaging",
    name: "No Imaging Indicated",
    short_name: "None",
    modality: "none",
    body_region: "none",
    with_contrast: false,
    typical_cost_usd: 0,
    radiation_msv: 0,
    description:
      "Conservative management without imaging. Appropriate when clinical criteria do not support imaging and watchful waiting is indicated.",
    common_indications: [
      "Self-limited conditions",
      "Red flags absent",
      "Clinical criteria not met (e.g., Ottawa rules negative)",
      "Patient preference after informed discussion",
      "Watchful waiting appropriate",
    ],
    contraindications: ["Red flag symptoms present", "Clinical concern for serious pathology"],
    duration: "N/A",
    is_active: true,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get imaging options by modality
 */
export function getImagingByModality(modality: Modality): ImagingOption[] {
  return imagingOptions.filter(
    (option) => option.modality === modality && option.is_active
  );
}

/**
 * Get imaging options by body region
 */
export function getImagingByBodyRegion(region: string): ImagingOption[] {
  return imagingOptions.filter(
    (option) => option.body_region === region && option.is_active
  );
}

/**
 * Get a single imaging option by ID
 */
export function getImagingById(id: string): ImagingOption | undefined {
  return imagingOptions.find((option) => option.id === id);
}

/**
 * Get multiple imaging options by IDs
 */
export function getImagingByIds(ids: string[]): ImagingOption[] {
  return ids
    .map((id) => getImagingById(id))
    .filter((option): option is ImagingOption => option !== undefined);
}

/**
 * Calculate total cost for selected imaging options
 */
export function calculateTotalCost(ids: string[]): number {
  return getImagingByIds(ids).reduce(
    (total, option) => total + option.typical_cost_usd,
    0
  );
}

/**
 * Calculate total radiation for selected imaging options
 */
export function calculateTotalRadiation(ids: string[]): number {
  return getImagingByIds(ids).reduce(
    (total, option) => total + option.radiation_msv,
    0
  );
}

/**
 * Get radiation category based on mSv value
 * Based on ACR guidelines for radiation dose categories
 */
export function getRadiationCategory(
  mSv: number
): "none" | "minimal" | "low" | "moderate" | "high" {
  if (mSv === 0) return "none";
  if (mSv < 0.1) return "minimal";
  if (mSv <= 1) return "low";
  if (mSv <= 10) return "moderate";
  return "high";
}

/**
 * Get radiation category label
 */
export function getRadiationLabel(mSv: number): string {
  const category = getRadiationCategory(mSv);
  const labels = {
    none: "No Radiation",
    minimal: "Minimal Radiation",
    low: "Low Radiation",
    moderate: "Moderate Radiation",
    high: "High Radiation",
  };
  return labels[category];
}

/**
 * Get radiation equivalent in chest X-rays
 * (1 CXR ≈ 0.1 mSv)
 */
export function getRadiationEquivalent(mSv: number): string {
  if (mSv === 0) return "No radiation exposure";
  const cxrEquivalent = Math.round(mSv / 0.1);
  if (cxrEquivalent < 1) return "Less than 1 chest X-ray";
  if (cxrEquivalent === 1) return "Equivalent to 1 chest X-ray";
  return `Equivalent to ~${cxrEquivalent} chest X-rays`;
}

/**
 * Get cost category
 */
export function getCostCategory(
  costUsd: number
): "free" | "low" | "moderate" | "high" | "very-high" {
  if (costUsd === 0) return "free";
  if (costUsd < 200) return "low";
  if (costUsd < 700) return "moderate";
  if (costUsd < 1500) return "high";
  return "very-high";
}

/**
 * Get all unique modalities
 */
export function getAllModalities(): Modality[] {
  const modalities = new Set(imagingOptions.map((option) => option.modality));
  return Array.from(modalities);
}

/**
 * Get all unique body regions
 */
export function getAllBodyRegions(): string[] {
  const regions = new Set(imagingOptions.map((option) => option.body_region));
  return Array.from(regions);
}

/**
 * Search imaging options by name or description
 */
export function searchImagingOptions(query: string): ImagingOption[] {
  const lowerQuery = query.toLowerCase();
  return imagingOptions.filter(
    (option) =>
      option.is_active &&
      (option.name.toLowerCase().includes(lowerQuery) ||
        option.short_name.toLowerCase().includes(lowerQuery) ||
        option.description.toLowerCase().includes(lowerQuery) ||
        option.common_indications.some((ind) =>
          ind.toLowerCase().includes(lowerQuery)
        ))
  );
}

/**
 * Get imaging options sorted by cost (ascending)
 */
export function getImagingSortedByCost(): ImagingOption[] {
  return [...imagingOptions]
    .filter((option) => option.is_active)
    .sort((a, b) => a.typical_cost_usd - b.typical_cost_usd);
}

/**
 * Get imaging options sorted by radiation (ascending)
 */
export function getImagingSortedByRadiation(): ImagingOption[] {
  return [...imagingOptions]
    .filter((option) => option.is_active)
    .sort((a, b) => a.radiation_msv - b.radiation_msv);
}

// ============================================================================
// Modality Metadata
// ============================================================================

export const modalityInfo: Record<
  Modality,
  { label: string; icon: string; color: string; description: string }
> = {
  xray: {
    label: "X-ray",
    icon: "Scan",
    color: "blue",
    description: "Quick, low-cost imaging using ionizing radiation",
  },
  ct: {
    label: "CT Scan",
    icon: "Circle",
    color: "amber",
    description: "Detailed cross-sectional imaging with higher radiation",
  },
  mri: {
    label: "MRI",
    icon: "Magnet",
    color: "violet",
    description: "Excellent soft tissue detail without radiation",
  },
  ultrasound: {
    label: "Ultrasound",
    icon: "Waves",
    color: "emerald",
    description: "Real-time imaging without radiation exposure",
  },
  nuclear: {
    label: "Nuclear Medicine",
    icon: "Atom",
    color: "rose",
    description: "Functional imaging using radioactive tracers",
  },
  fluoroscopy: {
    label: "Fluoroscopy",
    icon: "Film",
    color: "cyan",
    description: "Real-time X-ray imaging for dynamic evaluation",
  },
  none: {
    label: "No Imaging",
    icon: "X",
    color: "slate",
    description: "Conservative management without imaging",
  },
};
