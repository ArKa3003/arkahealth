import type { AIAlgorithm } from "../types";

export const AI_ALGORITHMS: AIAlgorithm[] = [
  {
    id: "ai-001",
    name: "INSIGHT CXR",
    vendor: "Lunit",
    fdaClearanceNumber: "K220272",
    fdaClearanceDate: "2022-08-15",
    category: "chest-xray-triage",
    supportedModalities: ["X-ray"],
    description:
      "AI-powered chest X-ray analysis detecting 10 major thoracic abnormalities including nodules, consolidation, pneumothorax, and cardiomegaly.",
    clinicalUse:
      "Triage chest X-rays by flagging abnormal findings for priority radiologist review. Particularly valuable as a second reader in settings without on-site radiologists.",
    ruralValueScore: 10,
    ruralValueReason:
      "X-ray is available at virtually every rural facility. This algorithm provides immediate triage without waiting for teleradiology reads, potentially catching critical findings hours earlier.",
    costPerStudy: 4.5,
    averageProcessingTimeSeconds: 3,
    sensitivity: 0.97,
    specificity: 0.92,
    integrationStatus: "available",
    requiredEquipment: ["Digital X-ray with DICOM output"],
    peerReviewedStudies: 45,
  },
  {
    id: "ai-002",
    name: "BoneView",
    vendor: "Gleamer",
    fdaClearanceNumber: "K213568",
    fdaClearanceDate: "2022-03-10",
    category: "fracture-detection",
    supportedModalities: ["X-ray"],
    description:
      "AI fracture detection for extremity, spine, and hip radiographs. Detects fractures with high sensitivity, including subtle findings often missed on initial read.",
    clinicalUse:
      "Assists emergency physicians and rural providers in fracture detection, reducing missed fracture rates from ~3.5% to <0.5%.",
    ruralValueScore: 9,
    ruralValueReason:
      "Orthopedic emergencies are common in rural settings. Without on-site radiologists, subtle fractures are frequently missed. This AI serves as a critical safety net.",
    costPerStudy: 5.0,
    averageProcessingTimeSeconds: 5,
    sensitivity: 0.95,
    specificity: 0.9,
    integrationStatus: "available",
    requiredEquipment: ["Digital X-ray with DICOM output"],
    peerReviewedStudies: 28,
  },
  {
    id: "ai-003",
    name: "Viz LVO",
    vendor: "Viz.ai",
    fdaClearanceNumber: "K182177",
    fdaClearanceDate: "2018-02-13",
    category: "stroke-triage",
    supportedModalities: ["CT"],
    description:
      "Automated detection of large vessel occlusion (LVO) on CT angiography with real-time notification to stroke teams. Demonstrated 66-minute reduction in treatment times.",
    clinicalUse:
      "Detects LVO strokes and immediately notifies the stroke team at the receiving facility, enabling faster transfer decisions and treatment initiation.",
    ruralValueScore: 9,
    ruralValueReason:
      "For rural facilities that must transfer stroke patients, the 66-minute time savings from AI-assisted triage can be the difference between good and poor neurological outcomes.",
    costPerStudy: 50.0,
    averageProcessingTimeSeconds: 120,
    sensitivity: 0.93,
    specificity: 0.93,
    integrationStatus: "available",
    requiredEquipment: ["CT scanner with CTA capability", "DICOM connectivity"],
    peerReviewedStudies: 35,
  },
  {
    id: "ai-004",
    name: "Lung Cancer Screening AI",
    vendor: "Optellum",
    fdaClearanceNumber: "K221882",
    fdaClearanceDate: "2023-04-20",
    category: "lung-nodule-tracking",
    supportedModalities: ["CT"],
    description:
      "AI analysis of lung CT screening exams that detects, measures, and risk-stratifies pulmonary nodules. Automates Lung-RADS categorization and follow-up scheduling.",
    clinicalUse:
      "Manages lung cancer screening programs with automated nodule detection, measurement, and risk scoring, ensuring no nodules are lost to follow-up.",
    ruralValueScore: 8,
    ruralValueReason:
      "Rural populations have disproportionately high smoking rates. Lung cancer screening is underutilized but lifesaving. AI automation makes screening programs viable at facilities with limited radiology staffing.",
    costPerStudy: 25.0,
    averageProcessingTimeSeconds: 45,
    sensitivity: 0.94,
    specificity: 0.88,
    integrationStatus: "coming-soon",
    requiredEquipment: ["CT scanner (LDCT protocol capable)", "DICOM connectivity"],
    peerReviewedStudies: 18,
  },
  {
    id: "ai-005",
    name: "AEQD Dose Monitor",
    vendor: "Qaelum",
    fdaClearanceNumber: "K211456",
    fdaClearanceDate: "2021-11-30",
    category: "general-triage",
    supportedModalities: ["CT", "X-ray", "Fluoroscopy"],
    description:
      "Automated radiation dose monitoring and optimization across all imaging modalities. Tracks patient cumulative dose and flags protocols exceeding reference levels.",
    clinicalUse:
      "Ensures radiation safety compliance and identifies opportunities for dose reduction, particularly valuable with aging equipment that may deliver higher-than-necessary doses.",
    ruralValueScore: 7,
    ruralValueReason:
      "Many rural facilities operate aging CT scanners without modern dose-reduction features. Dose monitoring ensures patient safety and helps make the case for equipment upgrades through documented dose data.",
    costPerStudy: 1.5,
    averageProcessingTimeSeconds: 1,
    sensitivity: 0.99,
    specificity: 0.99,
    integrationStatus: "available",
    requiredEquipment: ["Any DICOM-connected imaging equipment"],
    peerReviewedStudies: 12,
  },
];
