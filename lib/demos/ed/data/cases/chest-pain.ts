// @ts-nocheck
/**
 * Chest Pain Seed Cases
 *
 * Four clinical cases covering chest pain presentations
 * from low-risk musculoskeletal to emergent aortic dissection.
 *
 * Based on ACR Appropriateness Criteria for Chest Pain.
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
// Case 1: Typical Angina (Intermediate)
// ============================================================================

export const typicalAngina: Case = {
  id: "chest-pain-typical-angina",
  slug: "typical-angina-intermediate-risk",
  title: "Typical Angina with Cardiovascular Risk Factors",
  chief_complaint: "Chest pressure with exertion for the past 2 months",
  clinical_vignette: `A 62-year-old male retired accountant presents with a 2-month history of chest discomfort that occurs with physical exertion. He describes the sensation as a "pressure" or "tightness" in the center of his chest, sometimes radiating to his left arm. The discomfort typically begins after walking 2-3 blocks or climbing a flight of stairs and resolves within 5-10 minutes of rest.

He has never experienced this discomfort at rest. He denies shortness of breath at rest, orthopnea, or leg swelling. He has no palpitations, syncope, or near-syncope. The symptoms have been stable in frequency and intensity over the 2 months.

His medical history includes type 2 diabetes mellitus for 10 years, hypertension for 15 years, and hyperlipidemia. He is a former smoker who quit 5 years ago (30 pack-year history). His father had a heart attack at age 58. He takes metformin, lisinopril, and atorvastatin.`,
  patient_age: 62,
  patient_sex: "male",
  patient_history: [
    "Type 2 Diabetes Mellitus - 10 years",
    "Hypertension - 15 years",
    "Hyperlipidemia",
    "Former smoker - quit 5 years ago (30 pack-years)",
    "Family history: father MI at age 58",
    "Medications: metformin, lisinopril, atorvastatin",
  ],
  vital_signs: {
    heart_rate: 76,
    blood_pressure_systolic: 142,
    blood_pressure_diastolic: 88,
    respiratory_rate: 14,
    temperature: 36.7,
    temperature_unit: "celsius",
    oxygen_saturation: 98,
  } as VitalSigns,
  physical_exam: `General: Overweight male, no acute distress
Cardiovascular: Regular rate and rhythm. Normal S1, S2. No S3, S4, or murmurs. No JVD.
Lungs: Clear to auscultation bilaterally. No wheezes, rales, or rhonchi.
Abdomen: Soft, non-tender. No hepatomegaly.
Extremities: No peripheral edema. 2+ dorsalis pedis pulses bilaterally.
Skin: No xanthomas`,
  lab_results: [
    {
      name: "Troponin I",
      value: "<0.01",
      unit: "ng/mL",
      reference_range: "<0.04",
      is_abnormal: false,
    },
    {
      name: "BNP",
      value: "45",
      unit: "pg/mL",
      reference_range: "<100",
      is_abnormal: false,
    },
    {
      name: "HbA1c",
      value: "7.2",
      unit: "%",
      reference_range: "<5.7",
      is_abnormal: true,
    },
    {
      name: "LDL Cholesterol",
      value: "98",
      unit: "mg/dL",
      reference_range: "<100",
      is_abnormal: false,
    },
    {
      name: "Creatinine",
      value: "1.2",
      unit: "mg/dL",
      reference_range: "0.7-1.3",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "chest-pain" as CaseCategory,
  specialty_tags: ["fm", "im", "em"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Chest Pain - Suspected Cardiac Cause",
  optimal_imaging: ["nm-myocardial-perfusion"],
  explanation: `This case represents stable angina pectoris with INTERMEDIATE pretest probability for coronary artery disease (CAD). Functional (stress) testing is appropriate.

**Clinical Assessment:**
This patient has TYPICAL ANGINA defined by three characteristics:
1. Substernal chest discomfort
2. Provoked by exertion or emotional stress
3. Relieved by rest or nitroglycerin within minutes

**Pre-Test Probability Assessment:**
Using Diamond-Forrester criteria (age, sex, symptoms):
- 62-year-old male with typical angina = ~90% pre-test probability for CAD
- Multiple risk factors (DM, HTN, HLD, smoking history, family history) further increase likelihood

**Why Stress Testing is Optimal:**
For patients with INTERMEDIATE pre-test probability and interpretable ECG who can exercise:
- Functional testing (stress test with imaging) is the appropriate first-line evaluation
- Stress myocardial perfusion imaging (MPI) evaluates for:
  - Inducible ischemia
  - Location and extent of ischemia
  - Prognosis stratification

**Options for Functional Testing:**
- Exercise stress echocardiography (ACR 8)
- Stress myocardial perfusion imaging (ACR 8)
- Stress cardiac MRI (ACR 7)

**Why NOT Coronary CTA?**
- CTA is better for LOW-to-intermediate risk patients
- This high-risk patient likely has significant CAD - functional significance matters more than anatomy
- CTA cannot determine if stenoses are causing ischemia

**Why NOT Invasive Angiography?**
- Not first-line - reserved for patients with positive stress test or high-risk features`,
  teaching_points: [
    "Typical angina has THREE characteristics: substernal discomfort, provoked by exertion/stress, relieved by rest/NTG. Meeting 2/3 = atypical, 0-1 = non-cardiac.",
    "For intermediate pretest probability patients, FUNCTIONAL testing (stress test) is preferred to determine if stenoses cause ischemia",
    "Coronary CTA is better suited for LOW-to-intermediate risk patients where anatomy alone is informative (ruling out CAD)",
    "Exercise stress with imaging (echo or nuclear) provides both diagnostic and prognostic information",
  ],
  clinical_pearls: [
    {
      content:
        "The Diamond-Forrester criteria use age, sex, and symptom type to estimate CAD pretest probability - older males with typical symptoms have the highest probability",
      category: "high-yield",
    },
    {
      content:
        "A patient who can exercise adequately should have exercise (not pharmacologic) stress testing - exercise capacity itself provides important prognostic information",
      category: "clinical-pearl",
    },
    {
      content:
        "Don't order coronary CTA in high pretest probability patients - they likely have disease, and you need functional significance (is it causing ischemia?), not just anatomy",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "What type of chest pain does this patient have (typical, atypical, non-cardiac)?",
    "What is his pre-test probability for CAD?",
    "For intermediate-to-high risk patients, what type of testing is most appropriate?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Chest Pain - Suspected Cardiac Etiology",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69401/Narrative/",
    },
    {
      title: "2021 AHA/ACC Chest Pain Guidelines",
      source: "Circulation",
      year: 2021,
    },
    {
      title: "Appropriate Use Criteria for Cardiac Imaging",
      source: "JACC",
      year: 2019,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 2: Low-Risk Chest Pain (Beginner)
// ============================================================================

export const lowRiskChestPain: Case = {
  id: "chest-pain-msk-low-risk",
  slug: "low-risk-musculoskeletal-chest-pain",
  title: "Low-Risk Chest Pain in Young Woman",
  chief_complaint: "Sharp chest pain for 2 days",
  clinical_vignette: `A 25-year-old female graduate student presents with 2 days of left-sided chest pain. She describes the pain as sharp, well-localized to a small area below her left breast, and rated 4/10. The pain is worse with deep inspiration and when she presses on the area. It does not radiate. She first noticed it after helping a friend move furniture over the weekend.

She denies shortness of breath, palpitations, syncope, fever, or cough. She has no swelling in her legs and has not been immobile. She takes oral contraceptives but has no other risk factors for blood clots. She has no cardiac risk factors and no family history of premature coronary disease.

She is otherwise healthy, exercises regularly, does not smoke, and rarely drinks alcohol. She is anxious about the pain and requested to be "checked out."`,
  patient_age: 25,
  patient_sex: "female",
  patient_history: [
    "No significant medical history",
    "Oral contraceptive use",
    "Non-smoker",
    "No family history of cardiac disease",
    "Recent physical exertion (moving furniture)",
  ],
  vital_signs: {
    heart_rate: 72,
    blood_pressure_systolic: 110,
    blood_pressure_diastolic: 68,
    respiratory_rate: 14,
    temperature: 36.6,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Healthy-appearing young woman, mildly anxious but no distress
Cardiovascular: Regular rate and rhythm. Normal S1, S2. No murmurs, rubs, or gallops.
Lungs: Clear to auscultation bilaterally. No wheezes or crackles.
Chest Wall: REPRODUCIBLE TENDERNESS to palpation at the left 4th-5th costochondral junction. No swelling or erythema.
Extremities: No leg swelling, no calf tenderness.`,
  lab_results: [
    {
      name: "ECG",
      value: "Normal sinus rhythm",
      unit: "",
      reference_range: "Normal",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "chest-pain" as CaseCategory,
  specialty_tags: ["fm", "im", "em"] as SpecialtyTrack[],
  difficulty: "beginner" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Chest Pain - Low Risk",
  optimal_imaging: ["no-imaging"],
  explanation: `This case represents musculoskeletal (MSK) chest pain, the most common cause of chest pain in the outpatient setting. NO imaging is needed.

**Why This is Likely Musculoskeletal:**
1. **Reproducible chest wall tenderness** - The single most helpful finding for MSK pain
2. **Sharp, well-localized pain** - Unlike visceral cardiac pain which is diffuse
3. **Pleuritic component** - Pain worse with inspiration (chest wall moves)
4. **Positional component** - Pain with pressing on area
5. **Clear precipitant** - Heavy lifting/moving
6. **Low pre-test probability** - 25-year-old female, no risk factors

**Why NO Imaging is Appropriate:**
- Clinical picture is classic for costochondritis/chest wall strain
- Normal ECG rules out acute cardiac pathology
- HEART score is 0-1 (very low risk)
- No features of PE (no dyspnea, no risk factors beyond OCPs, no leg symptoms)
- Wells score for PE is low (<2)
- Imaging would not change management

**Key Clinical Feature:**
REPRODUCIBLE chest wall tenderness has a positive likelihood ratio of 2.7-3.0 for musculoskeletal etiology and strongly argues against cardiac cause.

**Appropriate Management:**
- Reassurance
- NSAIDs for pain
- Activity modification
- Return precautions if symptoms worsen or new symptoms develop`,
  teaching_points: [
    "Reproducible chest wall tenderness is the most useful finding suggesting musculoskeletal etiology and argues strongly against ACS",
    "In low-risk patients with classic MSK features and normal ECG, additional testing is not indicated",
    "The HEART score helps risk-stratify chest pain: 0-3 = low risk (0.9-1.7% MACE at 6 weeks)",
    "Young patients (<40) without cardiac risk factors have very low probability of ACS - even with chest pain, most have benign etiologies",
  ],
  clinical_pearls: [
    {
      content:
        "While reproducible tenderness suggests MSK pain, remember that 15% of patients with ACS ALSO have chest wall tenderness - never use this as the ONLY reason to rule out ACS in high-risk patients",
      category: "clinical-pearl",
    },
    {
      content:
        "Costochondritis (Tietze syndrome) causes localized swelling at costochondral junctions; costochondral strain does not. Both are clinical diagnoses.",
      category: "high-yield",
    },
    {
      content:
        "Ordering a 'rule-out MI' workup for classic MSK pain in low-risk patients leads to unnecessary testing, incidental findings, and increased healthcare costs",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "What is significant about the chest wall examination finding?",
    "What is this patient's pre-test probability for cardiac disease?",
    "Would imaging change management in this case?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Chest Pain",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69401/Narrative/",
    },
    {
      title: "HEART Score for Major Cardiac Events",
      source: "Critical Pathways in Cardiology",
      year: 2010,
    },
    {
      title: "Evaluation of Chest Pain in the Primary Care Setting",
      source: "American Family Physician",
      year: 2017,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 3: PE Suspected (Intermediate)
// ============================================================================

export const peSuspected: Case = {
  id: "chest-pain-pe-suspected",
  slug: "suspected-pulmonary-embolism",
  title: "Suspected Pulmonary Embolism",
  chief_complaint: "Sudden chest pain and shortness of breath",
  clinical_vignette: `A 35-year-old female marketing executive presents to the emergency department with sudden onset of right-sided chest pain and shortness of breath that started 6 hours ago while at work. The chest pain is sharp, pleuritic (worse with deep breathing), and rated 7/10. She has associated dyspnea at rest and feels her heart racing.

She returned 3 days ago from a business trip to Asia (14-hour flight). She has been taking oral contraceptives for 5 years. She reports some right calf discomfort but no obvious swelling. She has no recent surgery, immobilization, or known malignancy. She has no personal or family history of blood clots.

She denies fever, cough, hemoptysis, or recent illness. She has no history of cardiac or pulmonary disease.`,
  patient_age: 35,
  patient_sex: "female",
  patient_history: [
    "No significant medical history",
    "Oral contraceptive use - 5 years",
    "Recent long-haul flight (14 hours) - 3 days ago",
    "No prior blood clots",
    "No family history of VTE",
  ],
  vital_signs: {
    heart_rate: 108,
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 72,
    respiratory_rate: 22,
    temperature: 37.2,
    temperature_unit: "celsius",
    oxygen_saturation: 94,
  } as VitalSigns,
  physical_exam: `General: Anxious-appearing woman in mild respiratory distress
Cardiovascular: Tachycardic, regular rhythm. Normal S1, S2. No murmurs. JVP mildly elevated.
Lungs: Clear to auscultation. No wheezes or crackles.
Chest Wall: No tenderness to palpation
Extremities: Right calf slightly fuller than left. Mild tenderness to palpation of right calf. Negative Homan's sign (unreliable).`,
  lab_results: [
    {
      name: "D-dimer",
      value: "2.4",
      unit: "μg/mL",
      reference_range: "<0.5",
      is_abnormal: true,
    },
    {
      name: "Troponin I",
      value: "0.08",
      unit: "ng/mL",
      reference_range: "<0.04",
      is_abnormal: true,
    },
    {
      name: "BNP",
      value: "180",
      unit: "pg/mL",
      reference_range: "<100",
      is_abnormal: true,
    },
    {
      name: "WBC",
      value: "9.2",
      unit: "x10^9/L",
      reference_range: "4.5-11.0",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "chest-pain" as CaseCategory,
  specialty_tags: ["em", "im"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Suspected Pulmonary Embolism",
  optimal_imaging: ["cta-chest-pe"],
  explanation: `This case represents suspected pulmonary embolism (PE) with intermediate clinical probability. CT Pulmonary Angiography (CTPA) is indicated.

**Clinical Probability Assessment (Wells Score for PE):**
- Clinical signs of DVT: +3 (calf tenderness and asymmetry)
- PE most likely diagnosis: +3
- Heart rate >100: +1.5
- Immobilization/surgery: 0
- Prior PE/DVT: 0
- Hemoptysis: 0
- Malignancy: 0
- **Total: 7.5 points = HIGH probability** (>6 = high)

However, even with "Moderate" Wells (2-6), the positive D-dimer mandates imaging.

**Why D-dimer Doesn't Rule Out PE:**
- D-dimer is only useful to RULE OUT PE in LOW probability patients
- This patient has elevated D-dimer (2.4, highly positive) AND intermediate-high probability
- Elevated troponin and BNP suggest right heart strain

**Why CTPA is Optimal:**
- Gold standard for diagnosing PE
- Directly visualizes clot in pulmonary arteries
- Can assess RV strain (RV:LV ratio)
- Can identify alternative diagnoses
- Rapid, widely available

**Why NOT V/Q Scan?**
- V/Q is an alternative when CTPA contraindicated (contrast allergy, renal failure, pregnancy)
- V/Q interpretation depends on chest X-ray being normal
- More often gives "intermediate probability" results requiring further testing

**Clinical Significance of Lab Findings:**
- Elevated troponin: RV strain, marker of severity
- Elevated BNP: RV dysfunction
- These don't change the imaging choice but suggest higher-risk PE`,
  teaching_points: [
    "D-dimer is only useful to RULE OUT PE in LOW-probability patients. If probability is moderate-high, proceed to imaging regardless of D-dimer.",
    "CTPA is the first-line imaging for suspected PE in most patients. V/Q scan is reserved for when CT is contraindicated.",
    "Elevated troponin and BNP in PE indicate right ventricular strain and suggest higher-risk PE - consider closer monitoring or ICU admission",
    "The Wells Score categorizes PE probability: <2 low, 2-6 moderate, >6 high. PERC rule can only be used if Wells <2.",
  ],
  clinical_pearls: [
    {
      content:
        "The classic PE triad of dyspnea, pleuritic chest pain, and hemoptysis is present in only 20% of patients - maintain high suspicion with risk factors",
      category: "clinical-pearl",
    },
    {
      content:
        "In pregnancy, V/Q scan is preferred over CTPA due to lower breast radiation dose - but CTPA is acceptable if V/Q unavailable or inconclusive",
      category: "high-yield",
    },
    {
      content:
        "Don't send a D-dimer if you're going to image anyway - it wastes time and money. Use D-dimer only in low-probability patients.",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "Calculate the Wells Score for this patient",
    "Is D-dimer useful in this clinical scenario?",
    "What is the first-line imaging test for suspected PE?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Suspected Pulmonary Embolism",
      source: "American College of Radiology",
      year: 2020,
      url: "https://acsearch.acr.org/docs/69404/Narrative/",
    },
    {
      title: "Diagnosis of Pulmonary Embolism with CT Angiography",
      source: "New England Journal of Medicine",
      year: 2006,
    },
    {
      title: "Wells Criteria for Pulmonary Embolism",
      source: "Thrombosis and Haemostasis",
      year: 2000,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 4: Aortic Dissection Concern (Advanced)
// ============================================================================

export const aorticDissection: Case = {
  id: "chest-pain-aortic-dissection",
  slug: "aortic-dissection-concern",
  title: "Aortic Dissection Concern",
  chief_complaint: "Sudden severe chest pain tearing to back",
  clinical_vignette: `A 58-year-old male construction supervisor is brought to the emergency department by EMS with sudden onset of severe chest pain that began 1 hour ago while lifting materials at work. He describes the pain as "tearing" or "ripping," starting in his anterior chest and immediately radiating through to his back between his shoulder blades. The pain is rated 10/10 and is the worst pain he has ever experienced.

He had one episode of near-syncope shortly after the pain started. He is diaphoretic and appears very uncomfortable. He denies shortness of breath, but feels "doom." He has no nausea, vomiting, or numbness.

He has a long history of poorly controlled hypertension and admits to inconsistent medication compliance. He smokes 1 pack of cigarettes daily for 35 years. He has no history of coronary artery disease, diabetes, or prior cardiac evaluation. His father died of a "ruptured aneurysm" at age 65.`,
  patient_age: 58,
  patient_sex: "male",
  patient_history: [
    "Hypertension - poorly controlled, non-compliant",
    "Smoker - 1 ppd x 35 years",
    "Family history: father died of ruptured aneurysm at 65",
    "No prior cardiac history",
    "No diabetes",
  ],
  vital_signs: {
    heart_rate: 110,
    blood_pressure_systolic: 185,
    blood_pressure_diastolic: 95,
    respiratory_rate: 22,
    temperature: 36.8,
    temperature_unit: "celsius",
    oxygen_saturation: 96,
  } as VitalSigns,
  physical_exam: `General: Diaphoretic, distressed male, writhing in pain
Cardiovascular: 
  - Tachycardic, regular rhythm
  - Blood pressure RIGHT arm: 185/95 mmHg
  - Blood pressure LEFT arm: 142/78 mmHg (>20 mmHg differential)
  - Grade II/VI diastolic murmur at left sternal border (new - no prior records)
  - No JVD
Lungs: Clear bilaterally
Abdomen: Soft, non-tender. Good femoral pulses bilaterally.
Neurological: Alert, no focal deficits. Equal grip strength.
Extremities: Radial pulses: right 2+, left 1+`,
  lab_results: [
    {
      name: "Troponin I",
      value: "0.15",
      unit: "ng/mL",
      reference_range: "<0.04",
      is_abnormal: true,
    },
    {
      name: "D-dimer",
      value: "5.8",
      unit: "μg/mL",
      reference_range: "<0.5",
      is_abnormal: true,
    },
    {
      name: "Creatinine",
      value: "1.4",
      unit: "mg/dL",
      reference_range: "0.7-1.3",
      is_abnormal: true,
    },
    {
      name: "Hemoglobin",
      value: "14.2",
      unit: "g/dL",
      reference_range: "13.5-17.5",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "chest-pain" as CaseCategory,
  specialty_tags: ["em", "surgery", "im"] as SpecialtyTrack[],
  difficulty: "advanced" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Suspected Aortic Pathology",
  optimal_imaging: ["cta-chest-pe"],
  explanation: `This case represents classic acute aortic dissection requiring EMERGENT CT Angiography. This is a surgical emergency.

**Classic Presentation Features:**
1. **Sudden severe pain** - Maximum intensity at onset (unlike ACS which builds)
2. **"Tearing/ripping" quality** - Pathognomonic description
3. **Radiation to back** - Suggests descending aortic involvement
4. **Blood pressure differential >20 mmHg** - Highly specific for dissection
5. **Pulse deficit** - Right radial stronger than left
6. **New diastolic murmur** - Suggests aortic regurgitation (proximal dissection)
7. **Risk factors** - Hypertension is #1 risk factor

**ADD (Aortic Dissection Detection) Risk Score:**
- High-risk conditions (HTN, known aortic aneurysm): +1
- High-risk pain (sudden, severe, tearing): +1
- High-risk exam (pulse deficit, BP differential, new murmur): +1
- **Score 3 = HIGH RISK** → Direct to imaging

**Why CT Angiography is Optimal:**
- Gold standard for acute aortic syndrome
- Visualizes intimal flap and false lumen
- Shows extent of dissection (Stanford A vs B)
- Identifies branch vessel involvement
- Evaluates for complications (rupture, malperfusion)
- Fast, widely available

**Why NOT Other Tests:**
- Chest X-ray: Only 60-90% sensitive; widened mediastinum may be absent
- Echocardiography: TTE has limited sensitivity; TEE is invasive
- MRI: Not first-line in acute setting due to time and availability

**Management After Imaging:**
- Stanford Type A (involves ascending): EMERGENT surgical repair
- Stanford Type B (descending only): Medical management unless complicated`,
  teaching_points: [
    "Aortic dissection classically presents with sudden, severe, tearing pain that is maximal at onset and radiates to the back",
    "Blood pressure differential >20 mmHg between arms is highly suggestive of dissection - ALWAYS check bilateral BPs in suspected dissection",
    "CT Angiography is the gold standard for diagnosing aortic dissection - don't delay for X-ray or other tests if suspicion is high",
    "Stanford Type A (ascending aorta) requires emergent surgery. Type B (descending only) is managed medically unless complicated.",
  ],
  clinical_pearls: [
    {
      content:
        "Hypertension is the #1 risk factor for aortic dissection, present in 70-90% of cases. Other risks include Marfan syndrome, bicuspid aortic valve, and cocaine use.",
      category: "high-yield",
    },
    {
      content:
        "Troponin may be elevated in dissection due to coronary ostia involvement (Type A) or demand ischemia - don't let positive troponin distract from the true diagnosis",
      category: "clinical-pearl",
    },
    {
      content:
        "The biggest mistake in aortic dissection is not thinking of it. The initial misdiagnosis rate is 30% - consider it in any sudden severe chest pain with hypertension.",
      category: "board-favorite",
    },
  ] as ClinicalPearl[],
  hints: [
    "What is the classic pain description in aortic dissection?",
    "What is the significance of the blood pressure differential?",
    "What imaging is most appropriate for suspected aortic dissection?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Acute Chest Pain - Suspected Aortic Dissection",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69402/Narrative/",
    },
    {
      title: "2022 ACC/AHA Guidelines for Diagnosis and Management of Aortic Disease",
      source: "Circulation",
      year: 2022,
    },
    {
      title: "International Registry of Acute Aortic Dissection (IRAD)",
      source: "JAMA",
      year: 2000,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Export All Chest Pain Cases
// ============================================================================

export const chestPainCases: Case[] = [
  typicalAngina,
  lowRiskChestPain,
  peSuspected,
  aorticDissection,
];

/**
 * Imaging ratings for Chest Pain cases
 */
export const chestPainImagingRatings = {
  // Case 1: Typical Angina
  "chest-pain-typical-angina": [
    {
      imaging_option_id: "nm-myocardial-perfusion",
      acr_rating: 8,
      rating_category: "usually-appropriate",
      rationale:
        "Stress myocardial perfusion imaging is appropriate for intermediate-high pretest probability patients to determine functional significance of CAD.",
    },
    {
      imaging_option_id: "echo-tte",
      acr_rating: 7,
      rating_category: "usually-appropriate",
      rationale:
        "Stress echocardiography is an excellent alternative to nuclear imaging for evaluating inducible ischemia.",
    },
    {
      imaging_option_id: "cta-chest-pe",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "Coronary CTA is better suited for low-intermediate risk patients. In high pretest probability, functional testing is preferred.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "With typical angina and multiple risk factors, some form of testing is needed to guide management.",
    },
  ],

  // Case 2: Low-Risk Chest Pain
  "chest-pain-msk-low-risk": [
    {
      imaging_option_id: "no-imaging",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Classic musculoskeletal chest pain with reproducible tenderness, low risk factors, and normal ECG does not require imaging.",
    },
    {
      imaging_option_id: "xray-chest",
      acr_rating: 3,
      rating_category: "usually-not-appropriate",
      rationale:
        "Chest X-ray would not change management for typical MSK pain with clear clinical diagnosis.",
    },
    {
      imaging_option_id: "cta-chest-pe",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "No indication for cardiac or PE workup given presentation and low probability scores.",
    },
  ],

  // Case 3: PE Suspected
  "chest-pain-pe-suspected": [
    {
      imaging_option_id: "cta-chest-pe",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "CTPA is the gold standard for diagnosing PE in patients with moderate-high clinical probability and positive D-dimer.",
    },
    {
      imaging_option_id: "nm-vq-scan",
      acr_rating: 7,
      rating_category: "usually-appropriate",
      rationale:
        "V/Q scan is an appropriate alternative when CTPA is contraindicated (contrast allergy, renal failure, pregnancy).",
    },
    {
      imaging_option_id: "us-le-venous",
      acr_rating: 6,
      rating_category: "may-be-appropriate",
      rationale:
        "Lower extremity venous ultrasound can support PE diagnosis if positive for DVT, but negative result doesn't rule out PE.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "With intermediate-high probability and positive D-dimer, imaging is mandatory to confirm or exclude PE.",
    },
  ],

  // Case 4: Aortic Dissection
  "chest-pain-aortic-dissection": [
    {
      imaging_option_id: "cta-chest-pe",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "CT Angiography of the chest/aorta is the gold standard for diagnosing acute aortic dissection. EMERGENT imaging is required.",
    },
    {
      imaging_option_id: "echo-tte",
      acr_rating: 6,
      rating_category: "may-be-appropriate",
      rationale:
        "TTE can show aortic regurgitation and pericardial effusion but has limited sensitivity for dissection. TEE is more sensitive but invasive.",
    },
    {
      imaging_option_id: "xray-chest",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "CXR may show widened mediastinum but has only 60-90% sensitivity. Should not delay CTA if dissection suspected.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Suspected aortic dissection is a surgical emergency. Imaging is mandatory and urgent.",
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getChestPainCaseById(id: string): Case | undefined {
  return chestPainCases.find((c) => c.id === id);
}

export function getChestPainCaseBySlug(slug: string): Case | undefined {
  return chestPainCases.find((c) => c.slug === slug);
}

export function getChestPainImagingRatings(
  caseId: string
): typeof chestPainImagingRatings[keyof typeof chestPainImagingRatings] | undefined {
  return chestPainImagingRatings[caseId as keyof typeof chestPainImagingRatings];
}
