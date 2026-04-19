import type { RuralCase } from "@/lib/demos/rural/types";

export const RURAL_CASES: RuralCase[] = [
  {
    id: "rc-001",
    title: "Suspected PE at a Facility with Only X-ray and Ultrasound",
    category: "resource-constrained",
    difficulty: "intermediate",
    setting: "Critical Access Hospital, population 3,200 — Smith County, KS",
    availableEquipment: ["X-ray", "Ultrasound"],
    unavailableEquipment: ["CT", "CT-with-contrast", "MRI", "Nuclear-Medicine"],
    nearestAdvancedImaging: {
      facility: "Salina Regional Health Center",
      distance: 95,
      modalities: ["CT", "CT-with-contrast", "MRI", "MRI-with-contrast", "PET-CT"],
    },
    patientVignette:
      "A 42-year-old woman presents to the ED with acute onset pleuritic chest pain and dyspnea that started 4 hours ago. She returned from a 12-hour car trip 3 days ago. She takes oral contraceptives. She denies hemoptysis, calf pain, or prior VTE. She is mildly anxious but in no acute distress.",
    patientDemographics: {
      age: 42,
      sex: "Female",
      occupation: "Schoolteacher",
      insuranceType: "Commercial PPO",
      transportAccess: "Own vehicle, 12 miles from facility",
    },
    vitalSigns: {
      HR: "104 bpm",
      BP: "128/82 mmHg",
      RR: "22/min",
      SpO2: "93% on room air",
      Temp: "99.1°F",
    },
    physicalExam:
      "Alert, mild tachypnea. Lungs clear bilaterally. Heart tachycardic, regular rhythm, no murmur. No calf tenderness or asymmetric swelling. No JVD.",
    labResults: [
      {
        name: "D-dimer",
        value: "2.4",
        unit: "mcg/mL FEU",
        normalRange: "<0.5",
        isAbnormal: true,
        date: "2026-03-28",
      },
      {
        name: "Troponin I",
        value: "0.02",
        unit: "ng/mL",
        normalRange: "<0.04",
        isAbnormal: false,
        date: "2026-03-28",
      },
      {
        name: "BNP",
        value: "180",
        unit: "pg/mL",
        normalRange: "<100",
        isAbnormal: true,
        date: "2026-03-28",
      },
    ],
    clinicalQuestion:
      "What is the most appropriate next imaging step given the clinical suspicion for PE and the facility's equipment limitations?",
    imagingOptions: [
      {
        id: "opt-a",
        study: "CT Pulmonary Angiography (CTPA)",
        modality: "CT-with-contrast",
        availableLocally: false,
        availableViaMobile: false,
        requiresTransfer: true,
        casRating: 9,
        raasRating: 6,
        feedback: {
          isOptimalLocal: false,
          isOptimalOverall: true,
          explanation:
            "CTPA is the gold standard for PE diagnosis. However, it requires CT with IV contrast, which is not available at this facility. Transfer to a facility with CT is recommended if clinical suspicion remains high after initial workup.",
          whenToUse: "When CT with contrast is locally available or when transfer is feasible and clinically indicated",
          limitations: "Not available locally. Transfer required (95 miles).",
          followUpPlan:
            "If CTPA positive, initiate anticoagulation and determine need for thrombolysis vs standard treatment.",
        },
        cost: 2200,
        radiationDose: "~10 mSv",
        contraindications: ["Contrast allergy", "Severe renal insufficiency", "Pregnancy (relative)"],
        turnaroundTime: "Transfer + 2 hours",
      },
      {
        id: "opt-b",
        study: "Point-of-Care Echocardiography (POCUS)",
        modality: "Ultrasound",
        availableLocally: true,
        availableViaMobile: false,
        requiresTransfer: false,
        casRating: 6,
        raasRating: 8,
        feedback: {
          isOptimalLocal: true,
          isOptimalOverall: false,
          explanation:
            "Bedside echocardiography can identify right heart strain (RV dilation, septal bowing, McConnell's sign) suggesting hemodynamically significant PE. Combined with elevated D-dimer, positive Wells score, and clinical picture, POCUS findings can support immediate anticoagulation and transfer decision.",
          whenToUse:
            "As first-line imaging when CT is unavailable and PE is clinically suspected. Especially valuable for risk stratification.",
          limitations:
            "Cannot directly visualize pulmonary emboli. Sensitivity for PE ~50-60% but specificity for RV strain is high.",
          followUpPlan:
            "If RV strain present: initiate anticoagulation, arrange STAT transfer for CTPA. If normal: apply clinical decision rules, consider lower extremity DVT ultrasound.",
        },
        cost: 350,
        radiationDose: "None",
        contraindications: [],
        turnaroundTime: "15 minutes",
      },
      {
        id: "opt-c",
        study: "Lower Extremity DVT Ultrasound",
        modality: "Ultrasound",
        availableLocally: true,
        availableViaMobile: false,
        requiresTransfer: false,
        casRating: 5,
        raasRating: 7,
        feedback: {
          isOptimalLocal: false,
          isOptimalOverall: false,
          explanation:
            "Compression ultrasound of the lower extremities can identify DVT. If positive, it supports the PE diagnosis and justifies anticoagulation. However, ~50% of patients with PE have no demonstrable DVT, so a negative study does not rule out PE.",
          whenToUse:
            "As a complementary study to POCUS when CT is unavailable. A positive DVT ultrasound in the setting of suspected PE is sufficient to begin anticoagulation.",
          limitations: "Cannot diagnose PE directly. Negative result does not exclude PE.",
          followUpPlan:
            "If DVT found: start anticoagulation, arrange transfer for CTPA for definitive PE diagnosis. If negative: does not exclude PE — proceed with POCUS and clinical assessment.",
        },
        cost: 350,
        radiationDose: "None",
        contraindications: [],
        turnaroundTime: "20 minutes",
      },
      {
        id: "opt-d",
        study: "Chest X-ray",
        modality: "X-ray",
        availableLocally: true,
        availableViaMobile: false,
        requiresTransfer: false,
        casRating: 3,
        raasRating: 5,
        feedback: {
          isOptimalLocal: false,
          isOptimalOverall: false,
          explanation:
            "Chest X-ray is typically normal in PE or shows nonspecific findings (atelectasis, small effusion). It is useful primarily to exclude other causes of chest pain and dyspnea (pneumothorax, pneumonia, CHF). Should be performed but is not diagnostic for PE.",
          whenToUse:
            "As an initial screening tool to evaluate for alternative diagnoses. Should not be relied upon to diagnose or exclude PE.",
          limitations: "Very low sensitivity and specificity for PE. Normal CXR does not exclude PE.",
          followUpPlan:
            "Regardless of CXR findings, continue workup for PE with POCUS and clinical decision rules if suspicion is moderate to high.",
        },
        cost: 200,
        radiationDose: "0.02 mSv",
        contraindications: ["Pregnancy (shield abdomen)"],
        turnaroundTime: "5 minutes",
      },
    ],
    optimalLocalChoice: "opt-b",
    optimalOverallChoice: "opt-a",
    teachingPoints: [
      {
        id: "tp-001",
        category: "rural-specific",
        title: "POCUS as First-Line PE Assessment in Resource-Limited Settings",
        content:
          "When CTPA is unavailable, bedside echocardiography becomes the most valuable imaging tool for PE risk stratification. Focus on RV:LV ratio >1.0, RV free wall hypokinesis with apical sparing (McConnell's sign), and paradoxical septal motion. These findings indicate hemodynamically significant PE and should prompt immediate anticoagulation and transfer.",
        evidenceLevel: "B",
        source: "AHA Scientific Statement on PE Management, 2024",
      },
      {
        id: "tp-002",
        category: "clinical-pearl",
        title: "Wells Score Application in Transfer Decision-Making",
        content:
          "Apply the Wells score to quantify pre-test probability. A Wells score ≥4 (PE likely) combined with elevated D-dimer and positive POCUS findings should trigger immediate anticoagulation and transfer, even before definitive CTPA. A Wells score <4 with negative POCUS may allow outpatient CTPA follow-up within 24 hours in select cases.",
        evidenceLevel: "A",
        source: "ACEP Clinical Policy: PE, 2023",
      },
      {
        id: "tp-003",
        category: "safety-critical",
        title: "Do Not Delay Anticoagulation for Imaging",
        content:
          "In patients with high clinical probability of PE and evidence of hemodynamic compromise or right heart strain, initiate therapeutic anticoagulation immediately. Do not delay treatment to obtain definitive imaging. The risk of untreated PE far exceeds the risk of empiric anticoagulation in this population.",
        evidenceLevel: "A",
        source: "ESC Guidelines for Acute PE, 2024",
      },
      {
        id: "tp-004",
        category: "cost-effectiveness",
        title: "Rural Cost-Benefit of Local POCUS vs. Transfer for CTPA",
        content:
          "Transfer for CTPA costs the patient ~$200 in travel plus $2,200 for the study, a full day of lost wages, and carries risk of clinical deterioration during a 90-mile transfer. POCUS at $350 can provide immediate risk stratification, guide anticoagulation decisions, and determine whether urgent transfer is truly necessary. For hemodynamically stable patients with low clinical probability, POCUS can prevent unnecessary transfers.",
        evidenceLevel: "C",
        source: "Rural Health Information Hub, Imaging Access Analysis, 2025",
      },
    ],
    clinicalPearls: [
      "In rural settings, the combination of clinical decision rules (Wells/Geneva) + D-dimer + POCUS provides a powerful PE assessment pathway without CT.",
      "McConnell's sign on POCUS (RV free wall hypokinesis with apical sparing) has >95% specificity for acute PE.",
      "A normal D-dimer (<0.5 mcg/mL FEU) in a low-probability patient effectively rules out PE regardless of imaging availability.",
      "Document your clinical reasoning thoroughly — it strengthens both patient safety and medicolegal protection when working outside standard resource availability.",
    ],
    references: [
      "ACR Appropriateness Criteria: Suspected Pulmonary Embolism, 2025",
      "AHA Scientific Statement: Management of Massive and Submassive PE, 2024",
      "ACEP Clinical Policy: Pulmonary Embolism, 2023",
      "ESC/ERS Guidelines for the Diagnosis and Management of Acute PE, 2024",
    ],
    cmeCredits: 1.5,
    specialtyTags: ["Emergency Medicine", "Internal Medicine", "Family Medicine"],
    estimatedCompletionMinutes: 20,
  },
];

/** @deprecated Use `RURAL_CASES` — alias for existing imports */
export const ruralCases = RURAL_CASES;
