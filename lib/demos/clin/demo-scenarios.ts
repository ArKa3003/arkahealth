// src/lib/demo-scenarios.ts
// Pre-built demo scenarios for presentations
import { ClinicalScenario } from "./types";

export const DEMO_SCENARIOS: Record<string, ClinicalScenario> = {
  // Scenario 1: Classic inappropriate imaging - uncomplicated low back pain
  'lbp-inappropriate': {
    patientId: 'DEMO-001',
    age: 45,
    sex: 'male',
    chiefComplaint: 'Lower back pain',
    clinicalHistory: 'Construction worker, no prior back issues',
    symptoms: ['pain', 'muscle spasm', 'difficulty bending'],
    duration: '3 days',
    redFlags: [
      { flag: 'History of cancer', present: false },
      { flag: 'Unexplained weight loss', present: false },
      { flag: 'Fever', present: false },
      { flag: 'Neurological deficit', present: false },
      { flag: 'Trauma', present: false },
      { flag: 'Age > 50 with new symptoms', present: false },
    ],
    proposedImaging: {
      modality: 'MRI',
      bodyPart: 'lumbar spine',
      indication: 'rule out disc herniation',
      urgency: 'routine',
    },
    priorImaging: [
      {
        modality: 'X-ray',
        bodyPart: 'lumbar spine',
        date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        daysAgo: 18,
      },
    ],
  },

  // Scenario 2: Appropriate imaging with red flags
  'lbp-with-red-flags': {
    patientId: 'DEMO-002',
    age: 62,
    sex: 'female',
    chiefComplaint: 'Lower back pain with leg weakness',
    clinicalHistory:
      'History of breast cancer 5 years ago, currently in remission',
    symptoms: [
      'back pain',
      'leg weakness',
      'numbness in left foot',
      'difficulty walking',
    ],
    duration: '2 weeks',
    redFlags: [
      { flag: 'History of cancer', present: true },
      { flag: 'Unexplained weight loss', present: false },
      { flag: 'Fever', present: false },
      { flag: 'Neurological deficit', present: true },
      { flag: 'Trauma', present: false },
      { flag: 'Age > 50 with new symptoms', present: true },
    ],
    proposedImaging: {
      modality: 'MRI with contrast',
      bodyPart: 'lumbar spine',
      indication: 'evaluate for metastatic disease vs disc herniation',
      urgency: 'urgent',
    },
  },

  // Scenario 3: Headache - inappropriate CT
  'headache-inappropriate': {
    patientId: 'DEMO-003',
    age: 35,
    sex: 'female',
    chiefComplaint: 'Chronic headaches',
    clinicalHistory:
      'Migraines since age 20, well-controlled with sumatriptan',
    symptoms: ['throbbing headache', 'photophobia', 'nausea'],
    duration: '10 years, current episode 2 days',
    redFlags: [
      { flag: 'Sudden onset severe headache', present: false },
      { flag: 'Neurological deficit', present: false },
      { flag: 'Fever', present: false },
      { flag: 'Change in headache pattern', present: false },
    ],
    proposedImaging: {
      modality: 'CT',
      bodyPart: 'head',
      indication: 'evaluate chronic headaches',
      urgency: 'routine',
    },
  },

  // Scenario 4: Thunderclap headache - appropriate urgent imaging
  'headache-thunderclap': {
    patientId: 'DEMO-004',
    age: 52,
    sex: 'male',
    chiefComplaint: 'Sudden severe headache',
    clinicalHistory: 'Hypertension, smoker',
    symptoms: [
      'worst headache of life',
      'sudden onset',
      'neck stiffness',
      'vomiting',
    ],
    duration: '2 hours',
    redFlags: [
      { flag: 'Sudden onset severe headache', present: true },
      { flag: 'Worst headache of life', present: true },
      { flag: 'Neck stiffness', present: true },
    ],
    proposedImaging: {
      modality: 'CT',
      bodyPart: 'head',
      indication: 'rule out subarachnoid hemorrhage',
      urgency: 'stat',
    },
  },

  // Scenario 5: Pediatric appendicitis - appropriate US
  'appendicitis-pediatric': {
    patientId: 'DEMO-005',
    age: 12,
    sex: 'male',
    chiefComplaint: 'Right lower quadrant abdominal pain',
    clinicalHistory: 'Previously healthy',
    symptoms: ['RLQ pain', 'nausea', 'low-grade fever', 'anorexia'],
    duration: '18 hours',
    redFlags: [{ flag: 'Fever', present: true }],
    proposedImaging: {
      modality: 'Ultrasound',
      bodyPart: 'abdomen',
      indication: 'evaluate for appendicitis',
      urgency: 'urgent',
    },
  },

  // Scenario 6: Pregnant patient - radiation awareness
  'pregnant-rlq-pain': {
    patientId: 'DEMO-006',
    age: 28,
    sex: 'female',
    chiefComplaint: 'Right lower quadrant abdominal pain',
    clinicalHistory: 'First pregnancy, 8 weeks gestation',
    symptoms: ['RLQ pain', 'nausea', 'mild tenderness'],
    duration: '6 hours',
    redFlags: [
      { flag: 'Fever', present: false },
      { flag: 'History of cancer', present: false },
    ],
    pregnancyStatus: 'pregnant',
    proposedImaging: {
      modality: 'CT',
      bodyPart: 'abdomen and pelvis',
      indication: 'rule out appendicitis',
      urgency: 'urgent',
    },
  },

  // Scenario 7: Pediatric headache - age-appropriate choices
  'pediatric-headache': {
    patientId: 'DEMO-007',
    age: 8,
    sex: 'male',
    chiefComplaint: 'Headache',
    clinicalHistory: 'Previously healthy child, no significant medical history',
    symptoms: ['headache', 'mild photophobia'],
    duration: '2 weeks',
    redFlags: [
      { flag: 'Sudden onset severe headache', present: false },
      { flag: 'Neurological deficit', present: false },
      { flag: 'Fever', present: false },
      { flag: 'Change in headache pattern', present: false },
    ],
    proposedImaging: {
      modality: 'CT',
      bodyPart: 'head',
      indication: 'evaluate headache',
      urgency: 'routine',
    },
  },

  // Scenario 8: Contrast allergy - contraindication handling
  'contrast-allergy-chest-pain': {
    patientId: 'DEMO-008',
    age: 55,
    sex: 'male',
    chiefComplaint: 'Chest pain',
    clinicalHistory: 'Known iodinated contrast allergy (hives, pruritus), hypertension, diabetes',
    symptoms: ['chest pain', 'shortness of breath', 'diaphoresis'],
    duration: '1 hour',
    redFlags: [
      { flag: 'History of cancer', present: false },
      { flag: 'Trauma', present: false },
    ],
    contrastAllergy: {
      hasAllergy: true,
      allergyType: 'iodinated',
    },
    proposedImaging: {
      modality: 'CT with contrast',
      bodyPart: 'chest',
      indication: 'rule out aortic dissection or PE',
      urgency: 'stat',
    },
  },

  // Scenario 9: Renal impairment - contrast nephropathy warning
  'renal-impairment-pe': {
    patientId: 'DEMO-009',
    age: 70,
    sex: 'female',
    chiefComplaint: 'Shortness of breath',
    clinicalHistory: 'Chronic kidney disease, eGFR 25, diabetes, hypertension',
    symptoms: ['dyspnea', 'chest pain', 'tachycardia'],
    duration: '4 hours',
    redFlags: [
      { flag: 'History of cancer', present: false },
      { flag: 'Trauma', present: false },
    ],
    renalFunction: {
      egfr: 25,
      hasImpairment: true,
    },
    proposedImaging: {
      modality: 'CT with contrast',
      bodyPart: 'chest',
      indication: 'rule out pulmonary embolism',
      urgency: 'urgent',
    },
  },

  // Scenario 10: Appropriate imaging - lung cancer screening
  'lung-cancer-screening': {
    patientId: 'DEMO-010',
    age: 45,
    sex: 'male',
    chiefComplaint: 'Lung cancer screening',
    clinicalHistory: '45-year-old smoker, 30 pack-year history, asymptomatic',
    symptoms: [],
    duration: 'N/A - screening',
    redFlags: [
      { flag: 'History of cancer', present: false },
      { flag: 'Unexplained weight loss', present: false },
    ],
    proposedImaging: {
      modality: 'CT',
      bodyPart: 'chest',
      indication: 'lung cancer screening per USPSTF guidelines',
      urgency: 'routine',
    },
  },
};

export function getDemoScenario(
  key: string
): ClinicalScenario | undefined {
  return DEMO_SCENARIOS[key];
}

export function getAllDemoScenarios(): {
  key: string;
  title: string;
  description: string;
}[] {
  return [
    {
      key: 'lbp-inappropriate',
      title: 'Low Back Pain - Usually Not Appropriate',
      description:
        '45yo male, 3 days of pain, no red flags → AIIE recommends conservative management',
    },
    {
      key: 'lbp-with-red-flags',
      title: 'Low Back Pain - Usually Appropriate',
      description:
        '62yo female, back pain + neuro deficit + cancer history → MRI appropriate',
    },
    {
      key: 'headache-inappropriate',
      title: 'Chronic Headache - Usually Not Appropriate',
      description:
        '35yo with stable 10-year migraine history → AIIE: CT not indicated',
    },
    {
      key: 'headache-thunderclap',
      title: 'Thunderclap Headache - Usually Appropriate',
      description:
        '52yo with sudden severe headache → CT STAT appropriate',
    },
    {
      key: 'appendicitis-pediatric',
      title: 'Pediatric Appendicitis - Usually Appropriate',
      description:
        '12yo male with RLQ pain → Ultrasound first is appropriate',
    },
    {
      key: 'pregnant-rlq-pain',
      title: 'Pregnant Patient - Radiation Awareness',
      description:
        '28yo pregnant (8 weeks), RLQ pain, CT ordered → Warning: avoid radiation, recommend ultrasound',
    },
    {
      key: 'pediatric-headache',
      title: 'Pediatric Headache - Age-Appropriate',
      description:
        '8yo male, headache 2 weeks, no red flags, CT ordered → Recommendation against routine CT in children',
    },
    {
      key: 'contrast-allergy-chest-pain',
      title: 'Contrast Allergy - Contraindication',
      description:
        '55yo with iodinated contrast allergy, chest pain, CT-A ordered → Warning: suggest premedication or alternative',
    },
    {
      key: 'renal-impairment-pe',
      title: 'Renal Impairment - Contrast Safety',
      description:
        '70yo with eGFR 25, suspected PE, CT-PA ordered → Warning: contrast nephropathy risk, consider V/Q scan',
    },
    {
      key: 'lung-cancer-screening',
      title: 'Lung Cancer Screening - Usually Appropriate',
      description:
        '45yo smoker, 30 pack-years, screening CT → AIIE: appropriate per USPSTF guidelines',
    },
  ];
}

