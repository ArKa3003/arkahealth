import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this GU/renal presentation; preferred modalities address the clinical question.";

/** GU and renal clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const GU_RENAL_SCENARIOS: ClinicalScenario[] = [
  {
    id: "renal-colic",
    region: "gu_renal",
    name: "Renal Colic",
    description: "Acute flank pain evaluation for urolithiasis.",
    presentationKeywords: [
      "renal colic", "kidney stone", "nephrolithiasis", "urolithiasis",
      "flank pain", "stone", "ureteral stone", "colic",
    ],
    icd10Prefixes: ["N20", "R10.3"],
    variants: [
      // Pregnancy variant first: it ties the adult default on criteria
      // specificity, and the resolver keeps the earlier variant on ties.
      {
        id: "pregnant-us-first",
        criteria: { redFlags: [], pregnancy: true },
        ratings: buildRatings("gu-renal-renal-colic-pregnant-us-first", {
          us: { rating: 9, rationale: "Ultrasound is first-line for suspected renal colic in pregnancy to avoid ionizing radiation.", isPreferred: true },
          mri: { rating: 7, rationale: "MRI without contrast is appropriate when ultrasound is inconclusive in pregnancy." },
          ct: { rating: 4, rationale: "CT is reserved in pregnancy when US/MRI are non-diagnostic.", contrastIssues: "Fetal radiation risk." },
        }, NI),
      },
      {
        id: "standard-low-dose-ct",
        criteria: { redFlags: [], ageRange: { min: 18 } },
        isDefault: true,
        ratings: buildRatings("gu-renal-renal-colic-standard-low-dose-ct", {
          ct: { rating: 8, rationale: "Low-dose non-contrast CT is appropriate for adult renal colic with high sensitivity for stones.", isPreferred: true },
          us: { rating: 5, rationale: "Ultrasound may detect hydronephrosis but is less sensitive than CT for ureteral stones in adults." },
          xr: { rating: 3, rationale: "Abdominal radiographs detect only radiopaque stones and miss many ureteral calculi." },
        }, NI),
      },
      {
        id: "young-recurrent-us",
        criteria: { redFlags: ["ageUnder18"] },
        ratings: buildRatings("gu-renal-renal-colic-young-recurrent-us", {
          us: { rating: 8, rationale: "Ultrasound is preferred for young patients with recurrent renal colic to limit cumulative radiation.", isPreferred: true },
          ct: { rating: 6, rationale: "CT may be used when ultrasound is non-diagnostic in recurrent pediatric colic." },
        }, NI),
      },
    ],
  },
  {
    id: "hematuria",
    region: "gu_renal",
    name: "Hematuria",
    description: "Microscopic and gross hematuria urologic workup.",
    presentationKeywords: [
      "hematuria", "blood in urine", "gross hematuria", "microscopic hematuria",
      "rbc urine", "urinary bleeding", "hematuria workup",
    ],
    icd10Prefixes: ["R31"],
    variants: [
      {
        id: "microscopic",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("gu-renal-hematuria-microscopic", {
          ct: { rating: 7, rationale: "CT urography or renal CT is appropriate for asymptomatic microscopic hematuria after urologic evaluation.", isPreferred: true },
          us: { rating: 6, rationale: "Renal ultrasound may be initial in younger patients with low malignancy risk." },
          ct_contrast: { rating: 7, rationale: "Contrast CT urography evaluates upper tract in microscopic hematuria workup." },
        }, NI),
      },
      {
        id: "gross",
        criteria: { redFlags: ["suddenOnset"] },
        ratings: buildRatings("gu-renal-hematuria-gross", {
          ct: { rating: 8, rationale: "CT urography is indicated for gross hematuria to evaluate urothelial and renal pathology.", isPreferred: true },
          ct_contrast: { rating: 8, rationale: "Contrast-enhanced CT urography is standard for gross hematuria evaluation." },
          us: { rating: 5, rationale: "Ultrasound alone may miss urothelial malignancy in gross hematuria." },
        }, NI),
      },
    ],
  },
  {
    id: "scrotal-pain",
    region: "gu_renal",
    name: "Scrotal Pain",
    description: "Acute scrotal pain including testicular torsion.",
    presentationKeywords: [
      "scrotal pain", "testicular pain", "testicle pain", "torsion",
      "testicular torsion", "epididymitis", "acute scrotum",
    ],
    icd10Prefixes: ["N50", "N45"],
    variants: [
      {
        id: "standard-doppler",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("gu-renal-scrotal-pain-standard-doppler", {
          us_doppler: { rating: 9, rationale: "Scrotal ultrasound with Doppler is first-line for acute scrotal pain.", isPreferred: true },
          us: { rating: 7, rationale: "Grayscale ultrasound alone is insufficient without Doppler for torsion assessment." },
        }, NI),
      },
      {
        id: "suspected-torsion",
        criteria: { redFlags: ["suddenOnset"] },
        ratings: buildRatings("gu-renal-scrotal-pain-suspected-torsion", {
          us_doppler: { rating: 9, rationale: "Emergent scrotal Doppler ultrasound is required for suspected testicular torsion — expedite to OR if positive.", isPreferred: true },
        }, NI),
      },
    ],
  },
];
