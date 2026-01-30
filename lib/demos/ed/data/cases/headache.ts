// @ts-nocheck
/**
 * Headache Seed Cases
 *
 * Four clinical cases covering the spectrum of headache presentations
 * from benign chronic headache to emergent thunderclap headache.
 *
 * Based on ACR Appropriateness Criteria for Headache.
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
// Case 1: Chronic Daily Headache (Beginner)
// ============================================================================

export const chronicDailyHeadache: Case = {
  id: "headache-chronic-daily",
  slug: "chronic-daily-headache-medication-overuse",
  title: "Chronic Daily Headache in a Young Woman",
  chief_complaint: "Daily headaches for the past 3 months",
  clinical_vignette: `A 32-year-old female marketing executive presents with daily headaches that have been occurring for the past 3 months. She describes the pain as bilateral pressure, like a "band around her head," rated 4-5/10. The headaches are present nearly every day, usually starting in the afternoon and lasting several hours.

She denies any aura, visual changes, nausea, vomiting, or photophobia. There is no fever, neck stiffness, or neurological symptoms. She has no history of head trauma. She takes ibuprofen 400-600mg almost daily for the past 2 months with decreasing effectiveness. She reports increased stress at work and has been sleeping only 5-6 hours per night.

She has no significant medical history, no family history of brain tumors or aneurysms, and takes only occasional ibuprofen. She does not smoke but drinks 3-4 cups of coffee daily.`,
  patient_age: 32,
  patient_sex: "female",
  patient_history: [
    "No significant past medical history",
    "Daily ibuprofen use for 2 months",
    "High-stress occupation",
    "Poor sleep hygiene",
    "No prior headache diagnosis",
  ],
  vital_signs: {
    heart_rate: 72,
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 74,
    respiratory_rate: 14,
    temperature: 36.6,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Well-appearing female, no acute distress
HEENT: Normocephalic, atraumatic. Pupils equal and reactive. No papilledema on fundoscopic exam. Temporal arteries non-tender, normal pulsation.
Neck: Supple, no meningismus. Mild trapezius tenderness bilaterally.
Neurological: 
  - Cranial nerves II-XII intact
  - Motor: 5/5 strength all extremities
  - Sensory: Intact to light touch and pinprick
  - Reflexes: 2+ and symmetric throughout
  - Coordination: Normal finger-to-nose, heel-to-shin
  - Gait: Normal
Mental Status: Alert, oriented, appropriate affect`,
  lab_results: null,
  category: "headache" as CaseCategory,
  specialty_tags: ["fm", "im", "em"] as SpecialtyTrack[],
  difficulty: "beginner" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Headache",
  optimal_imaging: ["no-imaging"],
  explanation: `This case represents chronic daily headache, most likely medication overuse headache (MOH) or transformed migraine, in a patient WITHOUT any red flag features. Imaging is NOT indicated.

**Key Clinical Features Supporting No Imaging:**
1. **Chronic stable pattern** - Headaches have been consistent for 3 months without progression
2. **Bilateral pressure quality** - Typical of tension-type or medication overuse headache
3. **Normal neurological examination** - No focal deficits, papilledema, or meningismus
4. **No red flags** - No "SNOOP" criteria met:
   - **S**ystemic symptoms (fever, weight loss) - Absent
   - **N**eurological symptoms/signs - Absent
   - **O**nset sudden (thunderclap) - Absent
   - **O**lder age (>50 new onset) - Not applicable (age 32)
   - **P**attern change - Not applicable (no prior headache history)
5. **Clear contributing factors** - Analgesic overuse, stress, sleep deprivation, caffeine

**Why Medication Overuse Headache (MOH)?**
- Using analgesics >15 days/month for >3 months
- Headaches increase in frequency with continued analgesic use
- Treatment is analgesic withdrawal, not imaging

**ACR Appropriateness Criteria:**
For chronic headache without red flags and with normal neurological exam: Imaging is "Usually Not Appropriate" (ACR 1-3).`,
  teaching_points: [
    "Chronic stable headache with normal neurological exam does NOT require imaging - the yield is extremely low (<1%)",
    "Medication Overuse Headache (MOH) is a common cause of chronic daily headache and is diagnosed clinically; imaging does not help and delays appropriate treatment",
    "The SNOOP mnemonic helps identify red flags: Systemic symptoms, Neurologic signs, Onset sudden, Older age (>50 new onset), Pattern change",
    "Treatment for MOH is analgesic withdrawal and preventive therapy - ordering imaging may reinforce the patient's belief that something is structurally wrong",
  ],
  clinical_pearls: [
    {
      content:
        "Using simple analgesics >15 days/month or triptans/combination analgesics >10 days/month for >3 months can cause Medication Overuse Headache",
      category: "high-yield",
    },
    {
      content:
        "The most important 'imaging' test for chronic headache is a thorough neurological examination - a normal exam is highly reassuring",
      category: "clinical-pearl",
    },
    {
      content:
        "Ordering imaging 'just to be safe' for chronic stable headaches delays diagnosis, increases costs, and may lead to incidental findings requiring further workup",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "Are there any red flag symptoms (SNOOP criteria)?",
    "What is the pattern and quality of the headache?",
    "Consider the role of the patient's daily analgesic use",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Headache",
      source: "American College of Radiology",
      year: 2019,
      url: "https://acsearch.acr.org/docs/69482/Narrative/",
    },
    {
      title: "Medication Overuse Headache: Pathophysiology, Diagnosis, and Treatment",
      source: "The Lancet Neurology",
      year: 2018,
    },
    {
      title: "Choosing Wisely: Headache Imaging",
      source: "American Headache Society",
      year: 2013,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 2: Thunderclap Headache (Advanced)
// ============================================================================

export const thunderclapHeadache: Case = {
  id: "headache-thunderclap-sah",
  slug: "thunderclap-headache-subarachnoid-hemorrhage",
  title: "Thunderclap Headache During Exercise",
  chief_complaint: "Worst headache of my life that came on suddenly",
  clinical_vignette: `A 45-year-old male is brought to the emergency department by ambulance after developing sudden, severe headache while lifting weights at the gym. He describes the headache as "the worst headache of my life," reaching maximum intensity within seconds. The pain is diffuse, rated 10/10, and feels like "someone hit me in the back of the head with a baseball bat."

He had one episode of vomiting shortly after onset. He reports mild neck stiffness. He denies any history of similar headaches, recent head trauma, or fever. He has no preceding symptoms or aura. He has no history of migraine.

His medical history is notable for hypertension, which he admits to not treating consistently. He takes lisinopril intermittently. He smokes half a pack of cigarettes daily and drinks alcohol socially. His mother died of a "brain bleed" at age 52.`,
  patient_age: 45,
  patient_sex: "male",
  patient_history: [
    "Hypertension - poorly controlled",
    "Intermittent lisinopril use",
    "Smoker - 0.5 ppd",
    "Family history: mother died of intracranial hemorrhage at age 52",
    "No prior headache history",
  ],
  vital_signs: {
    heart_rate: 92,
    blood_pressure_systolic: 178,
    blood_pressure_diastolic: 102,
    respiratory_rate: 18,
    temperature: 37.0,
    temperature_unit: "celsius",
    oxygen_saturation: 98,
  } as VitalSigns,
  physical_exam: `General: Middle-aged male, appearing uncomfortable, holding head, photophobic
HEENT: Normocephalic, atraumatic. Pupils equal and reactive (sluggish on right?). 
Neck: Mild nuchal rigidity present. Kernig sign positive.
Neurological: 
  - Alert, oriented x3
  - Cranial nerves: Mild right pupil dilatation (4mm vs 3mm left), otherwise intact
  - Motor: 5/5 strength all extremities
  - Sensory: Intact
  - Reflexes: 2+ and symmetric
  - No pronator drift
Fundoscopic: Subhyaloid hemorrhages noted bilaterally (Terson syndrome)`,
  lab_results: [
    {
      name: "WBC",
      value: "10.2",
      unit: "x10^9/L",
      reference_range: "4.5-11.0",
      is_abnormal: false,
    },
    {
      name: "Glucose",
      value: "142",
      unit: "mg/dL",
      reference_range: "70-100",
      is_abnormal: true,
    },
    {
      name: "Troponin",
      value: "0.02",
      unit: "ng/mL",
      reference_range: "<0.04",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "headache" as CaseCategory,
  specialty_tags: ["em", "im", "surgery"] as SpecialtyTrack[],
  difficulty: "advanced" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Headache - Thunderclap",
  optimal_imaging: ["ct-head-nc"],
  explanation: `This case is a classic presentation of subarachnoid hemorrhage (SAH) requiring EMERGENT imaging. Thunderclap headache is a medical emergency.

**Why This is Likely SAH:**
1. **Thunderclap onset** - Maximal intensity within seconds; pathognomonic for SAH
2. **"Worst headache of life"** - Classic description
3. **Onset during exertion** - Valsalva maneuver can trigger aneurysm rupture
4. **Meningeal signs** - Nuchal rigidity, positive Kernig sign (blood irritating meninges)
5. **Risk factors** - Hypertension, smoking, family history of intracranial hemorrhage
6. **Physical exam findings** - Anisocoria (concerning for aneurysmal compression), Terson syndrome (retinal hemorrhages associated with SAH)

**Why CT Head WITHOUT Contrast is Optimal:**
- Sensitivity for SAH is ~98% within 6 hours, ~93% at 24 hours
- Non-contrast CT is the first-line test - blood appears hyperdense (white)
- Rapid, widely available, definitive when positive
- No contrast needed initially (contrast can obscure blood)

**Critical Next Steps:**
- If CT is NEGATIVE but clinical suspicion remains high → Lumbar puncture
  - Look for xanthochromia (yellow CSF from bilirubin)
  - Look for elevated RBCs that don't clear
- If CT or LP is positive → CT angiography (CTA) to identify aneurysm location

**Why NOT MRI First?**
- MRI takes longer and may not be available emergently
- CT is more widely available and faster
- CT is highly sensitive in early SAH`,
  teaching_points: [
    "Thunderclap headache (maximal intensity within seconds) is SAH until proven otherwise - NEVER attribute to tension headache or migraine",
    "CT Head without contrast within 6 hours has ~98% sensitivity for SAH; if negative, lumbar puncture is mandatory when clinical suspicion is high",
    "Xanthochromia (yellow discoloration of CSF due to bilirubin from hemoglobin breakdown) takes 12 hours to develop - LP should be performed if CT is negative",
    "Classic SAH risk factors: hypertension, smoking, family history, polycystic kidney disease, connective tissue disorders",
  ],
  clinical_pearls: [
    {
      content:
        "The '6-hour rule': CT sensitivity for SAH drops from 98% at 6 hours to 93% at 24 hours to 50% at 1 week - timing matters!",
      category: "high-yield",
    },
    {
      content:
        "Terson syndrome (vitreous/retinal hemorrhage) is seen in ~10-40% of SAH cases and indicates severe bleed with high intracranial pressure",
      category: "clinical-pearl",
    },
    {
      content:
        "Don't miss 'sentinel headaches' - 20-50% of SAH patients report a warning headache days before major rupture; these patients often get misdiagnosed",
      category: "board-favorite",
    },
  ] as ClinicalPearl[],
  hints: [
    "What does 'thunderclap' onset suggest?",
    "What is the time-sensitive imaging for suspected SAH?",
    "What should you do if CT is negative but suspicion is high?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Headache",
      source: "American College of Radiology",
      year: 2019,
      url: "https://acsearch.acr.org/docs/69482/Narrative/",
    },
    {
      title: "Diagnosis of Subarachnoid Hemorrhage",
      source: "New England Journal of Medicine",
      year: 2017,
    },
    {
      title: "Sensitivity of CT for SAH Over Time",
      source: "BMJ",
      year: 2011,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 3: New Headache with Papilledema (Intermediate)
// ============================================================================

export const headacheWithPapilledema: Case = {
  id: "headache-papilledema-iih",
  slug: "new-headache-papilledema-visual-changes",
  title: "New Headache with Papilledema",
  chief_complaint: "Progressive headaches and vision changes for 6 weeks",
  clinical_vignette: `A 28-year-old obese female presents with progressively worsening headaches over the past 6 weeks. The headaches are diffuse, worse in the morning and when bending over, and occasionally wake her from sleep. She has noticed transient visual obscurations - brief episodes of vision "graying out" lasting seconds, especially when changing positions.

She also reports a new whooshing sound in her ears (pulsatile tinnitus), particularly noticeable at night. Over the past 2 weeks, she has had intermittent horizontal diplopia when looking to the side.

Her medical history is significant for obesity (BMI 38) and she takes no regular medications. She was started on tetracycline 3 months ago for acne. She denies fever, trauma, or any previous neurological symptoms. She has no family history of brain tumors.`,
  patient_age: 28,
  patient_sex: "female",
  patient_history: [
    "Obesity - BMI 38",
    "Acne - on tetracycline for 3 months",
    "No prior headache history",
    "No family history of brain tumors",
  ],
  vital_signs: {
    heart_rate: 78,
    blood_pressure_systolic: 128,
    blood_pressure_diastolic: 82,
    respiratory_rate: 14,
    temperature: 36.7,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Obese female, appears mildly uncomfortable
HEENT: Normocephalic. 
Fundoscopic Exam: Bilateral papilledema with disc swelling, blurred disc margins, and absence of spontaneous venous pulsations
Visual Acuity: 20/25 OD, 20/30 OS
Visual Fields: Enlarged blind spots bilaterally
Neck: Supple, no meningismus
Neurological: 
  - Cranial Nerves: VI nerve palsy on right (incomplete lateral gaze)
  - Motor: 5/5 all extremities
  - Sensory: Intact
  - Reflexes: 2+ and symmetric
  - Coordination: Normal`,
  lab_results: null,
  category: "headache" as CaseCategory,
  specialty_tags: ["em", "im", "fm"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Headache - Elevated ICP",
  optimal_imaging: ["mri-brain-c"],
  explanation: `This case represents elevated intracranial pressure (ICP), most likely Idiopathic Intracranial Hypertension (IIH) given the demographic, but imaging is MANDATORY to rule out mass lesion or venous sinus thrombosis.

**Critical Findings:**
1. **Papilledema** - Bilateral disc swelling = elevated ICP until proven otherwise
2. **Transient visual obscurations** - Classic for elevated ICP
3. **Pulsatile tinnitus** - Seen in IIH
4. **CN VI palsy** - False localizing sign of elevated ICP
5. **Headache worse in morning/positional** - Suggests increased ICP
6. **Risk factors for IIH** - Young obese female, tetracycline use (known association)

**Why MRI Brain WITH Contrast is Optimal:**
- Best for ruling out mass lesions (tumors, abscess)
- Can identify venous sinus thrombosis (MRV can be added)
- Shows signs of elevated ICP (empty sella, flattened globes, enlarged optic nerve sheaths)
- No radiation

**Why NOT CT First?**
- CT is less sensitive for posterior fossa tumors
- CT cannot adequately evaluate for venous sinus thrombosis
- MRI provides more information in a non-emergent setting

**After Imaging:**
- If MRI is negative for mass → Lumbar puncture
  - Measures opening pressure (IIH: >25 cm H2O)
  - Normal CSF composition confirms IIH diagnosis

**Important:** Papilledema is a medical urgency - chronic elevated ICP can cause permanent vision loss.`,
  teaching_points: [
    "Papilledema on exam ALWAYS requires imaging - it indicates elevated intracranial pressure which can be from mass, hydrocephalus, or venous obstruction",
    "MRI with contrast is preferred over CT for evaluating new headache with papilledema because it better evaluates for posterior fossa masses and can include venous imaging",
    "Idiopathic Intracranial Hypertension (IIH) is a diagnosis of EXCLUSION - must rule out mass lesion and venous sinus thrombosis first",
    "Medications associated with IIH: tetracycline/doxycycline, vitamin A derivatives, growth hormone, corticosteroid withdrawal",
  ],
  clinical_pearls: [
    {
      content:
        "The classic IIH patient is a young obese female with headache, papilledema, and CN VI palsy - but you MUST image before assuming this diagnosis",
      category: "clinical-pearl",
    },
    {
      content:
        "CN VI palsy is a 'false localizing sign' of elevated ICP because the nerve has a long intracranial course and is susceptible to compression",
      category: "high-yield",
    },
    {
      content:
        "Don't perform LP for suspected IIH until you've ruled out mass lesion with imaging - LP in the setting of a mass can cause herniation",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "What does papilledema indicate physiologically?",
    "What must be ruled out before diagnosing IIH?",
    "Which imaging modality best evaluates for both mass and venous causes?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Headache",
      source: "American College of Radiology",
      year: 2019,
      url: "https://acsearch.acr.org/docs/69482/Narrative/",
    },
    {
      title: "Idiopathic Intracranial Hypertension: Diagnosis and Management",
      source: "Journal of Neurology, Neurosurgery & Psychiatry",
      year: 2018,
    },
    {
      title: "Neuroimaging in IIH",
      source: "Radiographics",
      year: 2019,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 4: Migraine without Red Flags (Beginner)
// ============================================================================

export const migraineWithoutRedFlags: Case = {
  id: "headache-migraine-typical",
  slug: "typical-migraine-with-aura",
  title: "Migraine with Typical Aura",
  chief_complaint: "Recurrent one-sided headaches with visual symptoms",
  clinical_vignette: `A 25-year-old female medical student presents for evaluation of recurrent headaches that have been occurring since her teenage years. She experiences 2-4 episodes per month. The headaches are unilateral (alternating sides), throbbing in quality, and rated 7-8/10 in intensity.

Each episode is preceded by a 20-30 minute visual aura consisting of zigzag lines and flickering lights that gradually expand and then resolve. After the aura, she develops the headache along with nausea, sensitivity to light, and sensitivity to sound. The headaches last 4-12 hours and are partially relieved by lying down in a dark, quiet room and taking sumatriptan.

She has no associated fever, weight loss, neck stiffness, or neurological symptoms during or between attacks. Her mother and maternal aunt both have similar headaches. She denies recent head trauma. She takes oral contraceptives and occasional sumatriptan. Her neurological exam between attacks has always been normal.`,
  patient_age: 25,
  patient_sex: "female",
  patient_history: [
    "Migraine with aura - since teenage years",
    "Family history: mother and aunt with migraine",
    "Oral contraceptive use",
    "No prior imaging",
    "Normal neurological exams historically",
  ],
  vital_signs: {
    heart_rate: 68,
    blood_pressure_systolic: 112,
    blood_pressure_diastolic: 70,
    respiratory_rate: 14,
    temperature: 36.5,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Well-appearing female, no acute distress (currently headache-free)
HEENT: Normocephalic, atraumatic. Pupils equal and reactive. No papilledema.
Neck: Supple, no meningismus
Neurological: 
  - Cranial Nerves: II-XII intact
  - Motor: 5/5 strength all extremities
  - Sensory: Intact throughout
  - Reflexes: 2+ and symmetric
  - Coordination: Normal
  - Gait: Normal
Mental Status: Alert, oriented, appropriate`,
  lab_results: null,
  category: "headache" as CaseCategory,
  specialty_tags: ["fm", "im"] as SpecialtyTrack[],
  difficulty: "beginner" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Headache",
  optimal_imaging: ["no-imaging"],
  explanation: `This case represents typical migraine with aura, which is a CLINICAL diagnosis. Neuroimaging is NOT indicated.

**Why This is Classic Migraine with Aura:**
1. **Meets ICHD-3 criteria for migraine with typical aura:**
   - Visual aura (zigzag lines, flickering lights)
   - Gradual development over 5+ minutes
   - Duration 5-60 minutes
   - Followed by headache
2. **Typical migraine features:**
   - Unilateral, throbbing quality
   - Moderate-to-severe intensity
   - Associated nausea, photophobia, phonophobia
   - Duration 4-72 hours
   - Improved by rest in dark room
3. **Strong family history** - 70-80% of migraine patients have family history
4. **Normal neurological examination**
5. **Stable pattern** - No change in headache characteristics

**Why NO Imaging:**
- ACR rates imaging as "Usually Not Appropriate" for:
  - Recurrent headaches meeting migraine criteria
  - Normal neurological examination
  - No red flags
- Studies show <1% clinically significant findings when imaging migraineurs without red flags
- Imaging does not change management for typical migraine

**What WOULD warrant imaging:**
- Change in headache pattern
- New neurological symptoms
- First or worst headache
- Onset after age 50
- Aura lasting >60 minutes or always same side`,
  teaching_points: [
    "Migraine is a CLINICAL diagnosis - typical migraine with normal neurological exam does NOT require imaging",
    "Visual aura should be gradual (spreading over >5 min), last <60 min, and be fully reversible - atypical aura warrants investigation",
    "The presence of aura does NOT mean imaging is needed - it's the NATURE of the aura and overall clinical picture that matters",
    "Ordering routine imaging for migraine increases costs, radiation exposure (if CT), and may lead to incidental findings causing patient anxiety",
  ],
  clinical_pearls: [
    {
      content:
        "The typical migraine visual aura ('fortification spectra') is a positive visual phenomenon that expands gradually - sudden visual loss is NOT typical aura",
      category: "high-yield",
    },
    {
      content:
        "Migraine with aura in women taking estrogen-containing contraceptives increases stroke risk - this is a counseling point, not an imaging indication",
      category: "clinical-pearl",
    },
    {
      content:
        "A common mistake is imaging every patient with aura - typical aura that is consistent with prior episodes does not need imaging",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "Does this headache pattern meet criteria for a primary headache disorder?",
    "Are there any red flag features (SNOOP criteria)?",
    "Has there been any change in the headache pattern?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Headache",
      source: "American College of Radiology",
      year: 2019,
      url: "https://acsearch.acr.org/docs/69482/Narrative/",
    },
    {
      title: "International Classification of Headache Disorders, 3rd edition",
      source: "International Headache Society",
      year: 2018,
    },
    {
      title: "Neuroimaging for the Evaluation of Chronic Headaches",
      source: "Headache",
      year: 2000,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Export All Headache Cases
// ============================================================================

export const headacheCases: Case[] = [
  chronicDailyHeadache,
  thunderclapHeadache,
  headacheWithPapilledema,
  migraineWithoutRedFlags,
];

/**
 * Imaging ratings for Headache cases
 */
export const headacheImagingRatings = {
  // Case 1: Chronic Daily Headache
  "headache-chronic-daily": [
    {
      imaging_option_id: "no-imaging",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Chronic stable headache with normal neurological exam has <1% yield for significant pathology. Imaging delays appropriate diagnosis of medication overuse headache.",
    },
    {
      imaging_option_id: "ct-head-nc",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "CT adds radiation exposure without clinical benefit for chronic stable headache without red flags.",
    },
    {
      imaging_option_id: "mri-brain-nc",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "MRI is not indicated for chronic headache with normal exam - may find incidental abnormalities causing unnecessary concern.",
    },
  ],

  // Case 2: Thunderclap Headache
  "headache-thunderclap-sah": [
    {
      imaging_option_id: "ct-head-nc",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Non-contrast CT is the first-line EMERGENT test for thunderclap headache. 98% sensitive for SAH within 6 hours. Blood appears hyperdense.",
    },
    {
      imaging_option_id: "mri-brain-nc",
      acr_rating: 6,
      rating_category: "may-be-appropriate",
      rationale:
        "MRI is sensitive but not first-line due to longer acquisition time and potentially limited availability in emergency setting.",
    },
    {
      imaging_option_id: "ct-head-c",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "Contrast not needed for initial SAH detection; may obscure blood. CTA may be added if CT positive to locate aneurysm.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Thunderclap headache requires emergent imaging - SAH mortality is 50% without treatment.",
    },
  ],

  // Case 3: Headache with Papilledema
  "headache-papilledema-iih": [
    {
      imaging_option_id: "mri-brain-c",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "MRI with contrast best evaluates for mass lesions and can include MRV to assess for venous sinus thrombosis. Shows IIH-associated findings.",
    },
    {
      imaging_option_id: "mri-brain-nc",
      acr_rating: 7,
      rating_category: "usually-appropriate",
      rationale:
        "MRI without contrast is acceptable if contrast contraindicated, but contrast helps characterize masses and venous thrombosis.",
    },
    {
      imaging_option_id: "ct-head-nc",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "CT can identify large masses but is inferior to MRI for posterior fossa tumors and venous sinus evaluation.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Papilledema indicates elevated ICP - imaging is mandatory to rule out mass before considering LP.",
    },
  ],

  // Case 4: Migraine without Red Flags
  "headache-migraine-typical": [
    {
      imaging_option_id: "no-imaging",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Typical migraine with aura meeting diagnostic criteria and normal neurological exam does not benefit from imaging.",
    },
    {
      imaging_option_id: "mri-brain-nc",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "MRI is not indicated for typical migraine - may find incidental white matter hyperintensities causing unnecessary concern.",
    },
    {
      imaging_option_id: "ct-head-nc",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "CT adds radiation without benefit for classic migraine presentation with normal exam.",
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getHeadacheCaseById(id: string): Case | undefined {
  return headacheCases.find((c) => c.id === id);
}

export function getHeadacheCaseBySlug(slug: string): Case | undefined {
  return headacheCases.find((c) => c.slug === slug);
}

export function getHeadacheImagingRatings(
  caseId: string
): typeof headacheImagingRatings[keyof typeof headacheImagingRatings] | undefined {
  return headacheImagingRatings[caseId as keyof typeof headacheImagingRatings];
}
