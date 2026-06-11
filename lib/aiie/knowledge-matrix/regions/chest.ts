import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this chest presentation; preferred modalities address the clinical question.";

/** Chest clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const CHEST_SCENARIOS: ClinicalScenario[] = [
  {
    id: "acute-chest-pain",
    region: "chest",
    name: "Acute Chest Pain",
    description: "Emergency chest pain triage for ACS, PE, and aortic pathology.",
    presentationKeywords: [
      "chest pain", "cp", "acs", "mi", "heart attack", "angina",
      "pe", "pulmonary embolism", "pleuritic", "sob", "shortness of breath",
      "dyspnea", "dissection", "aortic dissection", "tearing chest pain",
    ],
    icd10Prefixes: ["R07", "I20", "I26", "I71"],
    variants: [
      {
        id: "suspected-acs",
        criteria: { redFlags: ["suddenOnset"] },
        isDefault: true,
        ratings: buildRatings("chest-acute-chest-pain-suspected-acs", {
          cta: { rating: 8, rationale: "Coronary CTA is appropriate for low-intermediate risk chest pain in selected ACS rule-out pathways.", isPreferred: true },
          ct: { rating: 7, rationale: "Chest CT may evaluate alternate diagnoses when ACS is not the sole concern." },
          nm: { rating: 8, rationale: "Nuclear stress imaging is appropriate for intermediate-risk chest pain when CCTA is not suitable." },
          xr: { rating: 4, rationale: "Chest radiograph alone is insufficient for ACS evaluation." },
        }, NI),
      },
      {
        id: "pe-low-pretest-d-dimer",
        criteria: { redFlags: [], priorConservativeCare: true },
        imagingIndicated: false,
        ratings: buildRatings("chest-acute-chest-pain-pe-low-pretest-d-dimer", {
          ct: { rating: 2, rationale: "CT pulmonary angiography is usually not appropriate when PE pretest probability is low and D-dimer is negative.", isPreferred: true },
          cta: { rating: 2, rationale: "CTA is not indicated for PE when clinical probability is low with negative D-dimer." },
        }, NI),
      },
      {
        id: "pe-intermediate-pretest",
        criteria: { redFlags: ["suddenOnset"] },
        ratings: buildRatings("chest-acute-chest-pain-pe-intermediate-pretest", {
          cta: { rating: 8, rationale: "CT pulmonary angiography is appropriate for intermediate pretest probability PE when D-dimer is elevated.", isPreferred: true },
          ct: { rating: 8, rationale: "CTPA is the standard for PE diagnosis with intermediate clinical suspicion." },
          us_doppler: { rating: 5, rationale: "Lower-extremity Doppler may support PE diagnosis but does not replace CTPA." },
        }, NI),
      },
      {
        id: "pe-high-pretest",
        criteria: { redFlags: ["suddenOnset", "neurologicalDeficit"] },
        ratings: buildRatings("chest-acute-chest-pain-pe-high-pretest", {
          cta: { rating: 9, rationale: "CTPA is indicated for high pretest probability pulmonary embolism — expedite when hemodynamically unstable.", isPreferred: true },
          ct: { rating: 9, rationale: "CT pulmonary angiography is first-line for high-probability PE." },
        }, NI),
      },
      {
        id: "aortic-dissection",
        criteria: { redFlags: ["suddenOnset", "neurologicalDeficit"] },
        ratings: buildRatings("chest-acute-chest-pain-aortic-dissection", {
          cta: { rating: 9, rationale: "CTA chest/abdomen/pelvis is first-line for suspected acute aortic dissection.", isPreferred: true },
          mra: { rating: 8, rationale: "MRA is an alternative when iodinated contrast is contraindicated in dissection workup." },
          ct_contrast: { rating: 9, rationale: "Contrast-enhanced CT angiography defines dissection flap and branch involvement." },
        }, NI),
      },
    ],
  },
  {
    id: "chronic-cough",
    region: "chest",
    name: "Chronic Cough",
    description: "Persistent cough beyond 8 weeks requiring chest imaging triage.",
    presentationKeywords: [
      "chronic cough", "persistent cough", "cough", "productive cough",
      "dry cough", "night cough", "smoker cough",
    ],
    icd10Prefixes: ["R05"],
    variants: [
      {
        id: "standard-workup",
        criteria: { redFlags: [], durationDays: { min: 56 } },
        isDefault: true,
        ratings: buildRatings("chest-chronic-cough-standard-workup", {
          xr: { rating: 7, rationale: "Chest radiograph is appropriate initial imaging for chronic cough after clinical evaluation.", isPreferred: true },
          ct: { rating: 6, rationale: "Chest CT may follow non-diagnostic radiograph or when malignancy risk is elevated." },
        }, NI),
      },
      {
        id: "with-hemoptysis-weight-loss",
        criteria: { redFlags: ["weightLoss"] },
        ratings: buildRatings("chest-chronic-cough-with-hemoptysis-weight-loss", {
          ct: { rating: 8, rationale: "Chest CT is indicated for chronic cough with weight loss or concerning features for malignancy.", isPreferred: true },
          xr: { rating: 6, rationale: "Radiograph may be initial but CT is preferred when malignancy is suspected." },
          pet_ct: { rating: 5, rationale: "PET-CT is for staging known malignancy, not initial chronic cough workup." },
        }, NI),
      },
    ],
  },
  {
    id: "hemoptysis",
    region: "chest",
    name: "Hemoptysis",
    description: "Coughing blood requiring airway and parenchymal evaluation.",
    presentationKeywords: [
      "hemoptysis", "coughing blood", "blood in sputum", "bloody sputum",
      "hemoptysis workup", "massive hemoptysis",
    ],
    icd10Prefixes: ["R04.2"],
    variants: [
      {
        id: "minor",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("chest-hemoptysis-minor", {
          ct: { rating: 8, rationale: "Chest CT is appropriate for hemoptysis to identify bronchial and parenchymal sources.", isPreferred: true },
          xr: { rating: 6, rationale: "Chest radiograph may be initial but CT is more sensitive for hemoptysis etiology." },
          cta: { rating: 7, rationale: "CTA may evaluate vascular causes when CT suggests bronchial artery pathology." },
        }, NI),
      },
      {
        id: "massive",
        criteria: { redFlags: ["suddenOnset"] },
        ratings: buildRatings("chest-hemoptysis-massive", {
          cta: { rating: 9, rationale: "CTA chest is indicated for massive hemoptysis to localize bleeding source before intervention.", isPreferred: true },
          ct: { rating: 8, rationale: "Chest CT with angiographic technique guides bronchial artery embolization planning." },
        }, NI),
      },
    ],
  },
  {
    id: "lung-cancer-screening",
    region: "chest",
    name: "Lung Cancer Screening",
    description: "Low-dose CT screening for high-risk asymptomatic adults.",
    presentationKeywords: [
      "lung cancer screening", "ldct", "low dose ct", "pack years",
      "smoking screening", "lung screen", "ldct screening",
    ],
    icd10Prefixes: ["Z12.2", "Z87.891"],
    variants: [
      {
        id: "eligible-50-80-20-pack-years",
        criteria: { redFlags: [], ageRange: { min: 50, max: 80 } },
        isDefault: true,
        ratings: buildRatings("chest-lung-cancer-screening-eligible-50-80-20-pack-years", {
          ct: { rating: 9, rationale: "Annual low-dose chest CT is appropriate for eligible adults age 50–80 with ≥20 pack-year smoking history.", isPreferred: true },
          xr: { rating: 3, rationale: "Chest radiograph is insufficient for lung cancer screening per USPSTF and ACR guidance." },
          pet_ct: { rating: 2, rationale: "PET-CT is not a screening modality for average-risk lung cancer screening." },
        }, NI),
      },
      {
        id: "not-eligible",
        criteria: { redFlags: [], ageRange: { min: 18, max: 49 } },
        imagingIndicated: false,
        ratings: buildRatings("chest-lung-cancer-screening-not-eligible", {
          ct: { rating: 2, rationale: "Low-dose CT screening is usually not appropriate outside USPSTF age and smoking criteria.", isPreferred: true },
          xr: { rating: 1, rationale: "Chest radiograph is not indicated for lung cancer screening in ineligible patients." },
        }, NI),
      },
    ],
  },
];
