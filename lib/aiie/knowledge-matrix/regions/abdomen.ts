import type { ClinicalScenario } from "../types";
import { buildRatings } from "./_rating-builder";

const NI = "Not indicated for this abdominal presentation; preferred modalities address the clinical question.";

/** Abdominal clinical scenarios for the AIIE Clinical Knowledge Matrix. */
export const ABDOMEN_SCENARIOS: ClinicalScenario[] = [
  {
    id: "rlq-appendicitis",
    region: "abdomen",
    name: "RLQ Pain / Suspected Appendicitis",
    description: "Right lower quadrant pain evaluation for appendicitis across age groups.",
    presentationKeywords: [
      "appendicitis", "rlq pain", "right lower quadrant", "rlq", "mcburney",
      "abdominal pain right", "acute abdomen rlq",
    ],
    icd10Prefixes: ["K35", "R10.3"],
    variants: [
      // Pregnancy variant first: it ties the adult default on criteria
      // specificity, and the resolver keeps the earlier variant on ties.
      {
        id: "pregnant-us-mri",
        criteria: { redFlags: [], pregnancy: true },
        ratings: buildRatings("abdomen-rlq-appendicitis-pregnant-us-mri", {
          us: { rating: 9, rationale: "Ultrasound is first-line for pregnant patients with suspected appendicitis.", isPreferred: true },
          mri: { rating: 8, rationale: "MRI without contrast is appropriate when ultrasound is inconclusive in pregnancy." },
          ct: { rating: 4, rationale: "CT is generally avoided in pregnancy unless alternative imaging is non-diagnostic.", contrastIssues: "Fetal radiation risk — use only when necessary." },
        }, NI),
      },
      {
        id: "adult-ct",
        criteria: { redFlags: [], ageRange: { min: 18 } },
        isDefault: true,
        ratings: buildRatings("abdomen-rlq-appendicitis-adult-ct", {
          ct: { rating: 9, rationale: "CT abdomen/pelvis with IV contrast is first-line for adult suspected appendicitis.", isPreferred: true },
          ct_contrast: { rating: 9, rationale: "Contrast-enhanced CT is the standard for adult appendicitis diagnosis." },
          us: { rating: 5, rationale: "Ultrasound is less sensitive than CT in non-pregnant adults for appendicitis." },
        }, NI),
      },
      {
        id: "pediatric-us-first",
        criteria: { redFlags: ["ageUnder18"], ageRange: { max: 18 } },
        ratings: buildRatings("abdomen-rlq-appendicitis-pediatric-us-first", {
          us: { rating: 9, rationale: "Ultrasound is first-line for pediatric suspected appendicitis to minimize radiation.", isPreferred: true },
          mri: { rating: 8, rationale: "MRI is appropriate when ultrasound is inconclusive in pediatric appendicitis." },
          ct: { rating: 6, rationale: "CT is reserved when US and MRI are unavailable or non-diagnostic in children." },
        }, NI),
      },
    ],
  },
  {
    id: "ruq-cholecystitis",
    region: "abdomen",
    name: "RUQ Pain / Suspected Cholecystitis",
    description: "Right upper quadrant pain evaluation for biliary disease.",
    presentationKeywords: [
      "cholecystitis", "ruq pain", "right upper quadrant", "ruq", "gallbladder",
      "biliary colic", "gallstones", "murphy sign",
    ],
    icd10Prefixes: ["K81", "K80", "R10.1"],
    variants: [
      {
        id: "us-first",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("abdomen-ruq-cholecystitis-us-first", {
          us: { rating: 9, rationale: "Right upper quadrant ultrasound is first-line for suspected cholecystitis and cholelithiasis.", isPreferred: true },
          ct: { rating: 4, rationale: "CT is secondary when ultrasound is inconclusive or complications are suspected." },
          mri: { rating: 5, rationale: "MRCP may evaluate biliary ductal disease when US is limited." },
        }, NI),
      },
    ],
  },
  {
    id: "epigastric-pancreatitis",
    region: "abdomen",
    name: "Epigastric Pain / Pancreatitis",
    description: "Epigastric pain with suspected acute pancreatitis or complications.",
    presentationKeywords: [
      "pancreatitis", "epigastric pain", "epigastrium", "lipase elevated",
      "acute pancreatitis", "epigastric",
    ],
    icd10Prefixes: ["K85", "R10.1"],
    variants: [
      {
        id: "uncomplicated",
        criteria: { redFlags: [] },
        imagingIndicated: false,
        isDefault: true,
        ratings: buildRatings("abdomen-epigastric-pancreatitis-uncomplicated", {
          ct: { rating: 2, rationale: "CT is usually not appropriate for uncomplicated acute pancreatitis diagnosed clinically and by lipase.", isPreferred: true },
          us: { rating: 3, rationale: "Ultrasound may assess gallstones as etiology but is not required for uncomplicated pancreatitis." },
        }, NI),
      },
      {
        id: "severe-or-suspected-complication",
        criteria: { redFlags: ["fever", "progressiveSymptoms"] },
        ratings: buildRatings("abdomen-epigastric-pancreatitis-severe-or-suspected-complication", {
          ct_contrast: { rating: 8, rationale: "Contrast-enhanced CT is appropriate for severe pancreatitis or suspected necrosis and complications.", isPreferred: true },
          ct: { rating: 7, rationale: "CT evaluates pancreatic necrosis, fluid collections, and vascular complications." },
        }, NI),
      },
    ],
  },
  {
    id: "suspected-sbo",
    region: "abdomen",
    name: "Suspected Small Bowel Obstruction",
    description: "Bowel obstruction evaluation with CT as standard.",
    presentationKeywords: [
      "sbo", "small bowel obstruction", "bowel obstruction", "obstruction",
      "distended abdomen", "no flatus", "vomiting obstruction",
    ],
    icd10Prefixes: ["K56"],
    variants: [
      {
        id: "standard",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("abdomen-suspected-sbo-standard", {
          ct: { rating: 9, rationale: "CT abdomen/pelvis with contrast is first-line for suspected small bowel obstruction.", isPreferred: true },
          ct_contrast: { rating: 9, rationale: "CT with oral/IV contrast defines obstruction level, transition point, and ischemia." },
          xr: { rating: 5, rationale: "Abdominal radiographs may suggest SBO but CT is definitive." },
          us: { rating: 3, rationale: "Ultrasound has limited role for adult SBO diagnosis." },
        }, NI),
      },
    ],
  },
  {
    id: "diverticulitis",
    region: "abdomen",
    name: "Suspected Diverticulitis",
    description: "Left lower quadrant pain evaluation for acute diverticulitis.",
    presentationKeywords: [
      "diverticulitis", "llq pain", "left lower quadrant", "diverticular",
      "sigmoid diverticulitis", "llq",
    ],
    icd10Prefixes: ["K57"],
    variants: [
      {
        id: "uncomplicated",
        criteria: { redFlags: [] },
        isDefault: true,
        ratings: buildRatings("abdomen-diverticulitis-uncomplicated", {
          ct: { rating: 8, rationale: "CT abdomen/pelvis with contrast is appropriate for suspected uncomplicated diverticulitis.", isPreferred: true },
          ct_contrast: { rating: 8, rationale: "Contrast CT confirms diverticulitis and excludes abscess or perforation." },
          us: { rating: 3, rationale: "Ultrasound is not standard for diverticulitis in adults." },
        }, NI),
      },
      {
        id: "complicated",
        criteria: { redFlags: ["fever", "immunocompromised"] },
        ratings: buildRatings("abdomen-diverticulitis-complicated", {
          ct_contrast: { rating: 9, rationale: "Contrast CT is indicated for complicated diverticulitis to assess abscess, perforation, and fistula.", isPreferred: true },
        }, NI),
      },
    ],
  },
  {
    id: "blunt-abdominal-trauma",
    region: "abdomen",
    name: "Blunt Abdominal Trauma",
    description: "Traumatic abdominal injury stratified by hemodynamic stability.",
    presentationKeywords: [
      "blunt abdominal trauma", "bat", "abdominal trauma", "seatbelt sign",
      "handlebar injury", "splenic injury", "liver laceration",
    ],
    icd10Prefixes: ["S36", "S37"],
    variants: [
      {
        id: "hemodynamically-stable",
        criteria: { redFlags: ["trauma"], trauma: true },
        isDefault: true,
        ratings: buildRatings("abdomen-blunt-abdominal-trauma-hemodynamically-stable", {
          ct: { rating: 9, rationale: "CT abdomen/pelvis with IV contrast is indicated for stable blunt abdominal trauma with concerning mechanism.", isPreferred: true },
          ct_contrast: { rating: 9, rationale: "Contrast CT grades solid organ injury and active bleeding in stable trauma." },
          us: { rating: 7, rationale: "FAST ultrasound screens for free fluid but CT defines injury grade when stable." },
          us_doppler: { rating: 6, rationale: "Doppler may assess vascular injury but CT is primary in stable BAT." },
        }, NI),
      },
      {
        id: "hemodynamically-unstable",
        criteria: { redFlags: ["trauma", "suddenOnset"], trauma: true },
        ratings: buildRatings("abdomen-blunt-abdominal-trauma-hemodynamically-unstable", {
          us: { rating: 9, rationale: "FAST exam is first-line in unstable blunt trauma before OR — expedite.", isPreferred: true },
          ct: { rating: 5, rationale: "CT is deferred in unstable patients who proceed directly to operative intervention." },
        }, NI),
      },
    ],
  },
];
