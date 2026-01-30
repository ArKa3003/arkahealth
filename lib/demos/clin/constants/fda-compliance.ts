export const FDA_COMPLIANCE = {
  FULL_DISCLAIMER: `IMPORTANT REGULATORY NOTICE: ARKA Imaging Intelligence Engine (AIIE) qualifies as Non-Device Clinical Decision Support software under FDA guidance pursuant to the 21st Century Cures Act, Section 3060 (FD&C Act § 520(o)(1)(E), January 2026 guidance).

This software meets ALL FOUR mandatory criteria for non-device CDS:

CRITERION 1 - DATA INPUT: This software does NOT acquire, process, or analyze medical images, diagnostic device signals, or signal patterns. It analyzes structured clinical information only (patient history, symptoms, indications).

CRITERION 2 - MEDICAL INFORMATION: This software displays and analyzes medical information from well-understood, independently verified sources including peer-reviewed literature, clinical practice guidelines, and evidence-based methodologies (RAND/UCLA Appropriateness Method, GRADE framework).

CRITERION 3 - HCP RECOMMENDATIONS: This software provides recommendations to qualified healthcare professionals (HCPs) for prevention, diagnosis, or treatment decisions. It does NOT provide directives, does NOT make autonomous decisions, and is NOT intended for patients or caregivers.

CRITERION 4 - INDEPENDENT REVIEW: This software enables healthcare professionals to independently review the basis for all recommendations through transparent algorithm explanations, evidence citations, and SHAP-based feature contribution displays. Clinicians are NOT intended to rely primarily on the software recommendation.

This tool SUPPORTS but does NOT replace clinical judgment. The final decision regarding patient care rests solely with the qualified healthcare provider.`,

  BANNER_TEXT:
    "FDA Non-Device CDS | 21st Century Cures Act § 3060 Compliant | For HCP Use Only",

  CRITERIA: {
    criterion1: {
      title: "Data Input Criterion",
      status: "COMPLIANT",
      description:
        "Analyzes clinical indications, NOT medical images or device signals",
    },
    criterion2: {
      title: "Medical Information Criterion",
      status: "COMPLIANT",
      description:
        "Uses peer-reviewed literature and validated clinical guidelines",
    },
    criterion3: {
      title: "HCP Recommendations Criterion",
      status: "COMPLIANT",
      description:
        "Provides recommendations to healthcare professionals, not directives",
    },
    criterion4: {
      title: "Independent Review Criterion",
      status: "COMPLIANT",
      description:
        "Full algorithm transparency with SHAP explanations and evidence citations",
    },
  },

  EXCLUSIONS: [
    "Does NOT analyze medical images (CT, MRI, X-ray, ultrasound)",
    "Does NOT process ECG waveforms or physiological signals",
    "Does NOT make autonomous clinical decisions",
    "Does NOT provide time-critical emergency alerts",
    "Does NOT replace physician clinical judgment",
    "Is NOT intended for patient or caregiver use",
  ],

  PRINT_AND_COPY_DISCLAIMER:
    "FDA Non-Device CDS | 21st Century Cures Act § 3060. This guidance supports clinical decision-making. It does not constitute medical advice or replace physician judgment.",

  VERSION: {
    aiie: "2.0.0",
    methodology: "RAND/UCLA + GRADE v2024",
    evidenceUpdate: "January 2026",
    fdaGuidanceRef: "FDA-2017-D-6569 (January 6, 2026 revision)",
  },
};

export const PROPRIETARY_FRAMEWORK = {
  name: "ARKA Imaging Intelligence Engine",
  acronym: "AIIE",
  tagline: "Evidence-Based Imaging Appropriateness Through Transparent AI",
  innovations: [
    "Knowledge Graph Clinical Reasoning",
    "XGBoost + SHAP Explainable AI",
    "Tiered Behavioral Alerting",
    "Cumulative Radiation Tracking",
    "Real-time Evidence Synthesis",
  ],
  scoring: {
    scale: { min: 1, max: 9 },
    categories: {
      appropriate: { range: [7, 9], color: "#22c55e", label: "Usually Appropriate" },
      uncertain: { range: [4, 6], color: "#f59e0b", label: "May Be Appropriate" },
      inappropriate: { range: [1, 3], color: "#ef4444", label: "Usually Not Appropriate" },
    },
  },
};
