// @ts-nocheck
/**
 * Abdominal Pain Seed Cases
 *
 * Four clinical cases covering common abdominal pain presentations
 * including appendicitis, biliary disease, pancreatitis, and obstruction.
 *
 * Based on ACR Appropriateness Criteria for Abdominal Pain.
 */

import type {
  Case,
  VitalSigns,
  LabResult,
  ClinicalPearl,
  Reference,
  CaseCategory,
  DifficultyLevel,
  SpecialtyTrack,
} from "@/lib/demos/ed/types";

// ============================================================================
// Case 1: RLQ Pain - Appendicitis (Intermediate)
// ============================================================================

export const appendicitisSuspected: Case = {
  id: "abd-pain-appendicitis",
  slug: "right-lower-quadrant-pain-appendicitis",
  title: "Right Lower Quadrant Pain - Suspected Appendicitis",
  chief_complaint: "Abdominal pain that moved to my right side",
  clinical_vignette: `A 22-year-old male college student presents to the emergency department with 18 hours of abdominal pain. The pain initially started as a vague discomfort around his umbilicus. Over the past 8 hours, the pain has migrated to his right lower quadrant and has become sharper and more localized. He rates the pain 7/10.

He has associated nausea and had one episode of vomiting. He has had no appetite since the pain started. He reports a low-grade fever. He denies diarrhea or constipation, urinary symptoms, or recent illness. He has no history of similar pain.

He has no significant medical or surgical history. He takes no medications and has no known allergies.`,
  patient_age: 22,
  patient_sex: "male",
  patient_history: [
    "No significant medical history",
    "No prior surgeries",
    "No known drug allergies",
    "College student",
  ],
  vital_signs: {
    heart_rate: 98,
    blood_pressure_systolic: 124,
    blood_pressure_diastolic: 78,
    respiratory_rate: 18,
    temperature: 38.1,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Young male lying still on stretcher, appears uncomfortable
Abdomen: 
  - Inspection: Flat, no distension
  - Auscultation: Hypoactive bowel sounds
  - Palpation: MAXIMAL TENDERNESS at McBurney's point (RLQ). Voluntary guarding present. 
  - POSITIVE Rovsing's sign (pain in RLQ with palpation of LLQ)
  - POSITIVE Psoas sign (pain with right hip extension)
  - No rebound tenderness (though exam limited by guarding)
Rectal: Deferred
GU: No costovertebral angle tenderness`,
  lab_results: [
    {
      name: "WBC",
      value: "14.2",
      unit: "x10^9/L",
      reference_range: "4.5-11.0",
      is_abnormal: true,
    },
    {
      name: "Neutrophils",
      value: "82",
      unit: "%",
      reference_range: "40-70",
      is_abnormal: true,
    },
    {
      name: "CRP",
      value: "45",
      unit: "mg/L",
      reference_range: "<10",
      is_abnormal: true,
    },
    {
      name: "Urinalysis",
      value: "Normal",
      unit: "",
      reference_range: "Normal",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "abdominal-pain" as CaseCategory,
  specialty_tags: ["em", "surgery", "fm"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Right Lower Quadrant Pain",
  optimal_imaging: ["ct-abd-pelvis-c"],
  explanation: `This case represents suspected acute appendicitis with classic presentation. CT Abdomen/Pelvis WITH contrast is the optimal imaging.

**Classic Appendicitis Presentation:**
1. **Migratory pain** - Periumbilical → RLQ (classic pattern as inflammation localizes)
2. **McBurney's point tenderness** - 1/3 distance from ASIS to umbilicus
3. **Positive Rovsing's sign** - RLQ pain with LLQ palpation (peritoneal irritation)
4. **Positive Psoas sign** - Pain with hip extension (retrocecal appendix)
5. **Anorexia, nausea, vomiting** - Autonomic response to visceral inflammation
6. **Low-grade fever** - Inflammatory response
7. **Leukocytosis with left shift** - Neutrophilia supports infection

**Alvarado Score (MANTRELS):**
- Migration of pain: +1
- Anorexia: +1
- Nausea/vomiting: +1
- Tenderness RLQ: +2
- Rebound tenderness: +1
- Elevated temperature: +1
- Leukocytosis: +2
- Shift to left: +1
- This patient scores ~8 = HIGH probability

**Why CT with Contrast is Optimal:**
- Sensitivity 94-98%, Specificity 95-98% for appendicitis
- Visualizes appendix diameter, wall thickening, periappendiceal inflammation
- Identifies complications (perforation, abscess, phlegmon)
- Rules out alternative diagnoses (Meckel's, mesenteric adenitis, Crohn's)

**Why NOT Ultrasound First in Adult Male?**
- Ultrasound is appropriate in children and reproductive-age females
- In adult males, CT is preferred due to higher sensitivity
- Ultrasound has operator-dependent sensitivity (78-94%)

**Why Contrast?**
- IV contrast improves visualization of appendix and inflammation
- Helps identify abscess and phlegmon
- Better evaluation of alternative diagnoses`,
  teaching_points: [
    "The classic appendicitis presentation is migratory pain (periumbilical → RLQ) with anorexia, nausea, and fever - this pattern has high specificity",
    "CT Abdomen/Pelvis WITH contrast is the imaging of choice in adults with suspected appendicitis (sensitivity 94-98%)",
    "Ultrasound is appropriate FIRST-LINE in children and reproductive-age females to avoid radiation",
    "The Alvarado (MANTRELS) score can help stratify probability: 1-4 low, 5-6 intermediate, 7-10 high",
  ],
  clinical_pearls: [
    {
      content:
        "McBurney's point is located 1/3 the distance from the ASIS to the umbilicus - tenderness here is 50-94% sensitive for appendicitis",
      category: "high-yield",
    },
    {
      content:
        "A normal WBC does not rule out appendicitis - up to 10% of appendicitis patients have normal WBC, especially early",
      category: "clinical-pearl",
    },
    {
      content:
        "Don't skip imaging because 'it's classic appendicitis' - CT confirms diagnosis, rules out alternatives, and identifies perforation which changes surgical approach",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "What is the classic pain migration pattern of appendicitis?",
    "Calculate the Alvarado score for this patient",
    "What is the preferred imaging modality for suspected appendicitis in adults?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Right Lower Quadrant Pain",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69357/Narrative/",
    },
    {
      title: "Meta-analysis: CT for Appendicitis",
      source: "Annals of Emergency Medicine",
      year: 2010,
    },
    {
      title: "Alvarado Score for Acute Appendicitis",
      source: "Annals of Emergency Medicine",
      year: 1986,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 2: RUQ Pain - Biliary Colic (Intermediate)
// ============================================================================

export const biliaryDisease: Case = {
  id: "abd-pain-biliary",
  slug: "right-upper-quadrant-pain-biliary-colic",
  title: "Right Upper Quadrant Pain - Suspected Biliary Disease",
  chief_complaint: "Sharp pain under my right ribs after eating",
  clinical_vignette: `A 45-year-old Hispanic female presents with right upper quadrant abdominal pain that started 3 hours ago after eating a large meal. She describes the pain as sharp and crampy, radiating to her right scapular region. The pain is constant, rated 8/10, and she cannot find a comfortable position. She has had similar but milder episodes after fatty meals over the past few months.

She has associated nausea but no vomiting. She denies fever, jaundice, or changes in stool or urine color. She has no history of gallbladder problems or liver disease. She denies alcohol use.

Her medical history includes obesity (BMI 34), type 2 diabetes, and hypertension. She has had two pregnancies. She takes metformin and lisinopril.`,
  patient_age: 45,
  patient_sex: "female",
  patient_history: [
    "Obesity - BMI 34",
    "Type 2 Diabetes Mellitus",
    "Hypertension",
    "G2P2 (two pregnancies)",
    "Medications: metformin, lisinopril",
    "No prior gallbladder history",
  ],
  vital_signs: {
    heart_rate: 88,
    blood_pressure_systolic: 142,
    blood_pressure_diastolic: 88,
    respiratory_rate: 16,
    temperature: 37.0,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Obese female, uncomfortable but not in acute distress
Abdomen: 
  - Soft, obese
  - Tenderness to palpation in RUQ
  - EQUIVOCAL Murphy's sign (exam limited by body habitus)
  - No rebound or guarding
  - No palpable masses
Skin: No jaundice or scleral icterus
Cardiopulmonary: Normal`,
  lab_results: [
    {
      name: "WBC",
      value: "8.2",
      unit: "x10^9/L",
      reference_range: "4.5-11.0",
      is_abnormal: false,
    },
    {
      name: "Total Bilirubin",
      value: "0.9",
      unit: "mg/dL",
      reference_range: "0.1-1.2",
      is_abnormal: false,
    },
    {
      name: "ALT",
      value: "32",
      unit: "U/L",
      reference_range: "7-56",
      is_abnormal: false,
    },
    {
      name: "AST",
      value: "28",
      unit: "U/L",
      reference_range: "10-40",
      is_abnormal: false,
    },
    {
      name: "Alkaline Phosphatase",
      value: "85",
      unit: "U/L",
      reference_range: "44-147",
      is_abnormal: false,
    },
    {
      name: "Lipase",
      value: "42",
      unit: "U/L",
      reference_range: "0-160",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "abdominal-pain" as CaseCategory,
  specialty_tags: ["fm", "im", "em", "surgery"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Right Upper Quadrant Pain",
  optimal_imaging: ["us-abdomen"],
  explanation: `This case represents suspected biliary colic/cholelithiasis. Ultrasound is the optimal first-line imaging.

**Classic "4 F's" Risk Factors Present:**
- **F**emale
- **F**orty (age >40)
- **F**ertile (multiparous)
- **F**at (obese)
- (Also: Hispanic ethnicity is additional risk factor)

**Why This is Likely Biliary Colic:**
1. **Postprandial pain** - Fatty meal triggers gallbladder contraction
2. **RUQ location with scapular radiation** - Classic biliary pain pattern
3. **Constant crampy quality** - Biliary colic is actually constant (not colicky)
4. **Duration 3 hours** - Biliary colic typically lasts 30 min - 6 hours
5. **Prior similar episodes** - Recurrent pattern
6. **Normal labs** - Suggests uncomplicated cholelithiasis (not cholecystitis, choledocholithiasis)
7. **No fever** - Argues against acute cholecystitis

**Why Ultrasound is Optimal:**
- Sensitivity 95-98% for gallstones
- No radiation exposure
- Evaluates gallbladder wall thickness (cholecystitis)
- Assesses for pericholecystic fluid
- Can see CBD dilation
- Low cost, widely available
- No contrast needed

**Why NOT CT?**
- CT has only 75-80% sensitivity for gallstones (many stones are isodense to bile)
- Involves radiation
- More expensive
- Reserve CT for suspected complications or alternative diagnoses

**Normal Labs Significance:**
- Normal WBC: Argues against acute cholecystitis
- Normal bilirubin/LFTs: Argues against CBD obstruction
- Normal lipase: Rules out pancreatitis`,
  teaching_points: [
    "Ultrasound is FIRST-LINE imaging for suspected biliary disease - sensitivity 95-98% for gallstones, no radiation",
    "CT has poor sensitivity for gallstones (75-80%) because many stones are isodense to bile - don't rely on CT to rule out cholelithiasis",
    "Biliary 'colic' is actually constant pain lasting 30 min - 6 hours (true colic is intermittent) - it's a misnomer",
    "Normal WBC, bilirubin, and LFTs suggest uncomplicated cholelithiasis rather than cholecystitis or CBD obstruction",
  ],
  clinical_pearls: [
    {
      content:
        "Murphy's sign (inspiratory arrest during RUQ palpation) has 65% sensitivity for acute cholecystitis - a negative Murphy's doesn't rule it out",
      category: "clinical-pearl",
    },
    {
      content:
        "Sonographic Murphy's sign (tenderness when the ultrasound probe compresses the gallbladder) is MORE sensitive than physical exam Murphy's sign",
      category: "high-yield",
    },
    {
      content:
        "Ordering CT for 'RUQ pain' when biliary disease is suspected wastes resources and may miss stones - always start with ultrasound",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "What is the first-line imaging for suspected gallbladder disease?",
    "Why is CT not optimal for detecting gallstones?",
    "What do normal labs suggest about the severity of biliary disease?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Right Upper Quadrant Pain",
      source: "American College of Radiology",
      year: 2020,
      url: "https://acsearch.acr.org/docs/69474/Narrative/",
    },
    {
      title: "Ultrasonography for Gallstones",
      source: "Cochrane Database of Systematic Reviews",
      year: 2014,
    },
    {
      title: "Diagnosis of Biliary Colic",
      source: "American Family Physician",
      year: 2019,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 3: Epigastric Pain - Pancreatitis (Intermediate)
// ============================================================================

export const pancreatitis: Case = {
  id: "abd-pain-pancreatitis",
  slug: "epigastric-pain-acute-pancreatitis",
  title: "Epigastric Pain - Acute Pancreatitis",
  chief_complaint: "Severe pain in my upper abdomen going to my back",
  clinical_vignette: `A 55-year-old male presents to the emergency department with severe epigastric abdominal pain that began 10 hours ago. The pain is constant, rated 9/10, and radiates straight through to his back. He describes it as "boring" in quality. The pain is worse when lying flat and slightly better when sitting forward.

He has had multiple episodes of vomiting. He has no appetite. He denies fever, diarrhea, or blood in his stool. He has not had similar episodes before.

He admits to heavy alcohol use - approximately 6-8 beers daily for the past 20 years, with a binge of 12+ beers at a party 2 days ago. He has no history of gallstones or previous pancreatic problems. His medical history includes hypertension.`,
  patient_age: 55,
  patient_sex: "male",
  patient_history: [
    "Heavy alcohol use - 6-8 beers daily x 20 years",
    "Recent alcohol binge - 12+ beers 2 days ago",
    "Hypertension",
    "No history of gallstones",
    "No prior pancreatitis",
  ],
  vital_signs: {
    heart_rate: 108,
    blood_pressure_systolic: 98,
    blood_pressure_diastolic: 62,
    respiratory_rate: 22,
    temperature: 37.6,
    temperature_unit: "celsius",
    oxygen_saturation: 95,
  } as VitalSigns,
  physical_exam: `General: Middle-aged male, appears ill, diaphoretic, knees drawn up
Abdomen: 
  - Distended, diminished bowel sounds
  - Severe tenderness in epigastrium
  - Voluntary guarding, no rebound
  - No Grey-Turner or Cullen signs
Cardiovascular: Tachycardic, thready peripheral pulses
Lungs: Decreased breath sounds at left base`,
  lab_results: [
    {
      name: "Lipase",
      value: "1,842",
      unit: "U/L",
      reference_range: "0-160",
      is_abnormal: true,
    },
    {
      name: "Amylase",
      value: "986",
      unit: "U/L",
      reference_range: "28-100",
      is_abnormal: true,
    },
    {
      name: "WBC",
      value: "16.8",
      unit: "x10^9/L",
      reference_range: "4.5-11.0",
      is_abnormal: true,
    },
    {
      name: "Glucose",
      value: "245",
      unit: "mg/dL",
      reference_range: "70-100",
      is_abnormal: true,
    },
    {
      name: "Calcium",
      value: "7.8",
      unit: "mg/dL",
      reference_range: "8.5-10.5",
      is_abnormal: true,
    },
    {
      name: "Creatinine",
      value: "1.8",
      unit: "mg/dL",
      reference_range: "0.7-1.3",
      is_abnormal: true,
    },
    {
      name: "BUN",
      value: "42",
      unit: "mg/dL",
      reference_range: "7-20",
      is_abnormal: true,
    },
    {
      name: "LDH",
      value: "420",
      unit: "U/L",
      reference_range: "140-280",
      is_abnormal: true,
    },
    {
      name: "AST",
      value: "185",
      unit: "U/L",
      reference_range: "10-40",
      is_abnormal: true,
    },
  ] as LabResult[],
  category: "abdominal-pain" as CaseCategory,
  specialty_tags: ["em", "im", "surgery"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Acute Pancreatitis",
  optimal_imaging: ["ct-abd-pelvis-c"],
  explanation: `This case represents acute pancreatitis with likely SEVERE disease. While the diagnosis is made clinically and with labs, CT is indicated to assess severity and complications.

**Diagnosis of Acute Pancreatitis:**
Requires 2 of 3 criteria:
1. ✓ Characteristic abdominal pain (epigastric, radiating to back)
2. ✓ Lipase >3x upper limit of normal (1,842 = 11.5x ULN)
3. ? Imaging findings of pancreatitis

**This Patient Has CONFIRMED Pancreatitis** - criteria 1 and 2 are met. The question is whether imaging is needed.

**When to Image in Pancreatitis:**
- **Diagnosis uncertain** - Imaging can confirm
- **Severe pancreatitis** - Assess necrosis, complications
- **Failure to improve** - Look for complications (pseudocyst, abscess)
- **Suspected alternative diagnosis**

**Why CT is Indicated Here:**
This patient has SEVERE pancreatitis based on:
- Hypotension (BP 98/62)
- Tachycardia
- Hypoxemia (SpO2 95%)
- Elevated creatinine (AKI)
- Hyperglycemia
- Hypocalcemia
- Pleural effusion (decreased L breath sounds)
- BISAP score likely ≥3 = high mortality risk

CT with contrast will:
- Confirm diagnosis
- Assess for pancreatic necrosis (enhancing vs non-enhancing parenchyma)
- Identify complications (pseudocyst, peripancreatic collections, vascular complications)
- Evaluate alternative diagnoses

**Timing Consideration:**
Early CT (<72 hours) may underestimate necrosis. However, in severe presentations, early CT helps guide management. Repeat CT may be needed in 5-7 days if not improving.`,
  teaching_points: [
    "Acute pancreatitis diagnosis requires 2 of 3: characteristic pain, lipase >3x ULN, and/or imaging findings - you don't NEED imaging if clinical and labs are diagnostic",
    "CT is indicated in severe pancreatitis to assess necrosis and complications - severity markers include hypotension, hypoxia, renal failure, hypocalcemia",
    "Early CT (<72 hours) may underestimate necrosis, but is still valuable for guiding management in severe cases",
    "The two most common causes of acute pancreatitis are gallstones and alcohol - always look for both",
  ],
  clinical_pearls: [
    {
      content:
        "Lipase is preferred over amylase for pancreatitis diagnosis because it is more specific and stays elevated longer (up to 14 days vs 3-5 for amylase)",
      category: "high-yield",
    },
    {
      content:
        "Ranson's criteria and BISAP score predict severity - BISAP ≥3 has 7-12% mortality vs <1% if BISAP 0-2",
      category: "clinical-pearl",
    },
    {
      content:
        "Don't reflexively order CT for every pancreatitis patient - mild uncomplicated pancreatitis confirmed by clinical + labs may not need imaging",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "Does this patient meet criteria for acute pancreatitis diagnosis?",
    "What features suggest this is SEVERE pancreatitis?",
    "When is imaging indicated in acute pancreatitis?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Acute Pancreatitis",
      source: "American College of Radiology",
      year: 2020,
      url: "https://acsearch.acr.org/docs/69468/Narrative/",
    },
    {
      title: "American College of Gastroenterology Guidelines: Management of Acute Pancreatitis",
      source: "American Journal of Gastroenterology",
      year: 2013,
    },
    {
      title: "BISAP Score for Pancreatitis Mortality",
      source: "Gut",
      year: 2008,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 4: Diffuse Abdominal Pain - Obstruction (Advanced)
// ============================================================================

export const bowelObstruction: Case = {
  id: "abd-pain-obstruction",
  slug: "diffuse-abdominal-pain-bowel-obstruction",
  title: "Diffuse Abdominal Pain - Suspected Bowel Obstruction",
  chief_complaint: "Belly pain, vomiting, and I haven't had a bowel movement in 3 days",
  clinical_vignette: `A 68-year-old male presents to the emergency department with 2 days of progressively worsening abdominal pain, distension, and vomiting. The pain is crampy, diffuse, and comes in waves. He has been vomiting greenish-yellow fluid for the past day. He has not passed gas or had a bowel movement in 3 days.

He has a history of two prior abdominal surgeries: appendectomy at age 25 and repair of perforated ulcer at age 50. He denies any recent change in bowel habits, blood in stool, or weight loss before this episode. He has no history of inflammatory bowel disease or abdominal malignancy.

He has been unable to tolerate any oral intake. He appears dehydrated. His other medical history includes hypertension, atrial fibrillation (on apixaban), and osteoarthritis.`,
  patient_age: 68,
  patient_sex: "male",
  patient_history: [
    "Prior appendectomy (age 25)",
    "Prior repair of perforated ulcer (age 50)",
    "Hypertension",
    "Atrial fibrillation - on apixaban",
    "Osteoarthritis",
    "No history of malignancy or IBD",
  ],
  vital_signs: {
    heart_rate: 102,
    blood_pressure_systolic: 108,
    blood_pressure_diastolic: 68,
    respiratory_rate: 20,
    temperature: 37.4,
    temperature_unit: "celsius",
    oxygen_saturation: 96,
  } as VitalSigns,
  physical_exam: `General: Elderly male, appears uncomfortable, dry mucous membranes
Abdomen: 
  - Markedly DISTENDED
  - Tympanic to percussion
  - Diffuse tenderness, no focal peritoneal signs
  - HIGH-PITCHED, tinkling bowel sounds
  - Multiple well-healed surgical scars
  - No hernias palpable at groin or umbilicus
Rectal: Empty rectal vault, no masses, guaiac negative`,
  lab_results: [
    {
      name: "WBC",
      value: "11.8",
      unit: "x10^9/L",
      reference_range: "4.5-11.0",
      is_abnormal: true,
    },
    {
      name: "BUN",
      value: "38",
      unit: "mg/dL",
      reference_range: "7-20",
      is_abnormal: true,
    },
    {
      name: "Creatinine",
      value: "1.6",
      unit: "mg/dL",
      reference_range: "0.7-1.3",
      is_abnormal: true,
    },
    {
      name: "Lactate",
      value: "1.8",
      unit: "mmol/L",
      reference_range: "0.5-2.0",
      is_abnormal: false,
    },
    {
      name: "Potassium",
      value: "3.2",
      unit: "mEq/L",
      reference_range: "3.5-5.0",
      is_abnormal: true,
    },
    {
      name: "Chloride",
      value: "92",
      unit: "mEq/L",
      reference_range: "98-106",
      is_abnormal: true,
    },
  ] as LabResult[],
  category: "abdominal-pain" as CaseCategory,
  specialty_tags: ["em", "surgery", "im"] as SpecialtyTrack[],
  difficulty: "advanced" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Suspected Small Bowel Obstruction",
  optimal_imaging: ["ct-abd-pelvis-c"],
  explanation: `This case represents suspected small bowel obstruction (SBO) in a patient with prior abdominal surgeries. CT Abdomen/Pelvis WITH contrast is the optimal imaging.

**Clinical Features of Small Bowel Obstruction:**
1. **Cardinal symptoms:** Crampy abdominal pain, vomiting, distension, obstipation (no stool/flatus)
2. **Vomiting character** - Bilious (green-yellow) suggests proximal SBO
3. **High-pitched bowel sounds** - Classic auscultatory finding
4. **Prior abdominal surgery** - #1 cause of SBO is adhesions (70-80%)
5. **Dehydration** - From vomiting and third-spacing
6. **Metabolic abnormalities** - Hypokalemic, hypochloremic metabolic alkalosis from vomiting

**Why CT with Contrast is Optimal:**
- **Gold standard** for SBO - sensitivity 93%, specificity 100%
- Determines:
  - Presence and level of obstruction (transition point)
  - Cause of obstruction (adhesion, hernia, tumor, stricture)
  - Complete vs partial obstruction
  - **Closed-loop obstruction** (surgical emergency)
  - **Strangulation** (compromised bowel viability)
- IV contrast helps identify:
  - Bowel wall ischemia (lack of enhancement)
  - Mesenteric vascular compromise

**Why NOT Abdominal X-ray Alone?**
- X-ray has sensitivity only 59-77% for SBO
- Cannot identify transition point or cause
- Cannot assess for strangulation or closed-loop
- May delay definitive imaging and treatment

**Normal Lactate - Reassuring but Not Definitive:**
- Elevated lactate suggests ischemia, but normal lactate doesn't rule it out
- CT findings of ischemia are more reliable`,
  teaching_points: [
    "Adhesions from prior surgery are the #1 cause of SBO (70-80%) - ALWAYS ask about surgical history in abdominal pain",
    "CT Abdomen/Pelvis with contrast is the gold standard for SBO - identifies transition point, cause, and complications (strangulation, closed-loop)",
    "Plain abdominal X-ray has limited sensitivity (59-77%) and cannot identify strangulation - don't rely on it as the definitive test",
    "Closed-loop obstruction and strangulation are SURGICAL EMERGENCIES - CT findings of bowel wall edema, lack of enhancement, or mesenteric haziness suggest compromised bowel",
  ],
  clinical_pearls: [
    {
      content:
        "The 'small bowel feces sign' on CT (particulate matter in dilated small bowel) indicates prolonged obstruction and bacterial overgrowth",
      category: "clinical-pearl",
    },
    {
      content:
        "High-pitched tinkling bowel sounds are heard EARLY in obstruction; as it progresses, bowel sounds become hypoactive or absent",
      category: "high-yield",
    },
    {
      content:
        "Don't delay CT for abdominal X-rays in suspected SBO - X-ray may be falsely negative or nonspecific, delaying definitive diagnosis",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "What is the most common cause of small bowel obstruction?",
    "What information does CT provide that X-ray cannot?",
    "What complications of SBO require emergent surgery?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Suspected Small Bowel Obstruction",
      source: "American College of Radiology",
      year: 2020,
      url: "https://acsearch.acr.org/docs/69476/Narrative/",
    },
    {
      title: "CT of Small Bowel Obstruction",
      source: "RadioGraphics",
      year: 2006,
    },
    {
      title: "Management of Small Bowel Obstruction",
      source: "American College of Surgeons",
      year: 2017,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Export All Abdominal Pain Cases
// ============================================================================

export const abdominalPainCases: Case[] = [
  appendicitisSuspected,
  biliaryDisease,
  pancreatitis,
  bowelObstruction,
];

/**
 * Imaging ratings for Abdominal Pain cases
 */
export const abdominalPainImagingRatings = {
  // Case 1: Appendicitis
  "abd-pain-appendicitis": [
    {
      imaging_option_id: "ct-abd-pelvis-c",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "CT with IV contrast is the gold standard for adult appendicitis with 94-98% sensitivity and specificity. Identifies complications and alternative diagnoses.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 6,
      rating_category: "may-be-appropriate",
      rationale:
        "Non-contrast CT is acceptable if contrast contraindicated but has slightly lower sensitivity for appendicitis and complications.",
    },
    {
      imaging_option_id: "us-abdomen",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "Ultrasound is first-line in children and reproductive-age females to avoid radiation. In adult males, CT is preferred.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "While clinical diagnosis is possible, imaging confirms diagnosis, identifies complications, and rules out alternatives.",
    },
  ],

  // Case 2: Biliary Disease
  "abd-pain-biliary": [
    {
      imaging_option_id: "us-abdomen",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Ultrasound is first-line for suspected biliary disease with 95-98% sensitivity for gallstones, no radiation, and can assess for cholecystitis.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-c",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "CT has only 75-80% sensitivity for gallstones and involves radiation. Reserve for complications or alternative diagnoses.",
    },
    {
      imaging_option_id: "mri-lumbar-nc",
      acr_rating: 3,
      rating_category: "usually-not-appropriate",
      rationale:
        "MRCP is appropriate for suspected CBD stones but not first-line for typical biliary colic.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "Imaging is needed to confirm cholelithiasis and assess for cholecystitis before management decisions.",
    },
  ],

  // Case 3: Pancreatitis
  "abd-pain-pancreatitis": [
    {
      imaging_option_id: "ct-abd-pelvis-c",
      acr_rating: 8,
      rating_category: "usually-appropriate",
      rationale:
        "CT with contrast is indicated in SEVERE pancreatitis to assess necrosis, complications, and guide management. Not needed for mild uncomplicated cases.",
    },
    {
      imaging_option_id: "us-abdomen",
      acr_rating: 7,
      rating_category: "usually-appropriate",
      rationale:
        "Ultrasound is appropriate to evaluate for gallstones as etiology but cannot assess pancreatic necrosis or complications.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "Non-contrast CT is inferior for assessing pancreatic necrosis (requires contrast to see non-enhancing tissue).",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "In mild pancreatitis with clear diagnosis (clinical + labs), imaging may not be needed unless not improving.",
    },
  ],

  // Case 4: Bowel Obstruction
  "abd-pain-obstruction": [
    {
      imaging_option_id: "ct-abd-pelvis-c",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "CT with contrast is the gold standard for SBO - identifies transition point, cause, and critical complications (strangulation, closed-loop).",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 7,
      rating_category: "usually-appropriate",
      rationale:
        "Non-contrast CT can diagnose SBO but is less sensitive for subtle bowel ischemia and mural abnormalities.",
    },
    {
      imaging_option_id: "xray-abdomen",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "X-ray has limited sensitivity (59-77%) and cannot identify transition point, cause, or strangulation. Should not delay CT.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Suspected SBO requires imaging to confirm diagnosis and rule out surgical emergencies (strangulation, closed-loop).",
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getAbdominalPainCaseById(id: string): Case | undefined {
  return abdominalPainCases.find((c) => c.id === id);
}

export function getAbdominalPainCaseBySlug(slug: string): Case | undefined {
  return abdominalPainCases.find((c) => c.slug === slug);
}

export function getAbdominalPainImagingRatings(
  caseId: string
): typeof abdominalPainImagingRatings[keyof typeof abdominalPainImagingRatings] | undefined {
  return abdominalPainImagingRatings[caseId as keyof typeof abdominalPainImagingRatings];
}
