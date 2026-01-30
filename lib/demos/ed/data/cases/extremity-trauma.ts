// @ts-nocheck
/**
 * Extremity Trauma Seed Cases
 *
 * Four clinical cases covering common extremity trauma presentations
 * with focus on clinical decision rules (Ottawa Rules) for appropriate imaging.
 *
 * Based on ACR Appropriateness Criteria for Extremity Trauma.
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
// Case 1: Ankle Injury - Ottawa Negative (Beginner)
// ============================================================================

export const ankleInjuryOttawaNegative: Case = {
  id: "trauma-ankle-ottawa-negative",
  slug: "ankle-injury-ottawa-rules-negative",
  title: "Ankle Injury - Ottawa Rules Negative",
  chief_complaint: "Twisted my ankle playing basketball",
  clinical_vignette: `A 30-year-old male recreational basketball player presents to urgent care after twisting his right ankle during a game 2 hours ago. He was going up for a rebound and landed on another player's foot, causing his ankle to "roll inward." He felt immediate pain and had to stop playing.

He was able to walk off the court with a limp and has been weight-bearing since, though it's uncomfortable. He denies any "pop" or giving way. The ankle is mildly swollen on the lateral side. He has no numbness or tingling.

He has had one similar ankle sprain 5 years ago that resolved without imaging or specific treatment. He is otherwise healthy with no chronic medical conditions. He takes no medications.`,
  patient_age: 30,
  patient_sex: "male",
  patient_history: [
    "Prior right ankle sprain - 5 years ago, resolved spontaneously",
    "No chronic medical conditions",
    "Recreational basketball player",
    "No medications",
  ],
  vital_signs: {
    heart_rate: 72,
    blood_pressure_systolic: 122,
    blood_pressure_diastolic: 78,
    respiratory_rate: 14,
    temperature: 36.6,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Healthy male in no acute distress
Right Ankle:
  - Mild swelling over lateral malleolus
  - Ecchymosis beginning over lateral ankle
  - Tenderness anterior to lateral malleolus (ATFL area)
  - NO tenderness over posterior edge or tip of LATERAL MALLEOLUS (bone)
  - NO tenderness over posterior edge or tip of MEDIAL MALLEOLUS (bone)
  - NO tenderness over proximal 5th METATARSAL base
  - NO tenderness over NAVICULAR bone
  - Full active range of motion with discomfort at extremes
  - Stable to anterior drawer and talar tilt tests
  - Able to WEIGHT-BEAR and take 4+ steps (with mild limp)
Neurovascular: Intact distal pulses, sensation, and motor function`,
  lab_results: null,
  category: "extremity-trauma" as CaseCategory,
  specialty_tags: ["em", "fm"] as SpecialtyTrack[],
  difficulty: "beginner" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Acute Ankle Injury",
  optimal_imaging: ["no-imaging"],
  explanation: `This case represents an ankle injury that DOES NOT meet Ottawa Ankle Rules criteria. No imaging is needed.

**Ottawa Ankle Rules - Ankle X-ray Only Indicated If:**
1. Bone tenderness at posterior edge or tip of LATERAL malleolus, OR
2. Bone tenderness at posterior edge or tip of MEDIAL malleolus, OR
3. Inability to bear weight immediately AND in the ED (4 steps)

**Ottawa Foot Rules - Foot X-ray Only Indicated If:**
1. Bone tenderness at base of 5th METATARSAL, OR
2. Bone tenderness over NAVICULAR bone, OR
3. Inability to bear weight immediately AND in the ED (4 steps)

**This Patient DOES NOT Meet Criteria:**
- ✗ No posterior lateral malleolus tenderness
- ✗ No medial malleolus tenderness
- ✗ No 5th metatarsal tenderness
- ✗ No navicular tenderness
- ✗ CAN bear weight and take 4+ steps

**Why Ottawa Rules Are Excellent:**
- Sensitivity 98-99.6% for clinically significant fractures
- Reduces unnecessary ankle X-rays by 30-40%
- Validated in multiple studies and populations
- Saves healthcare costs and patient time

**Clinical Diagnosis:**
This is a likely **lateral ankle sprain** (most common: ATFL injury)
- Inversion mechanism
- Tenderness over ATFL (anterior to lateral malleolus)
- Stable exam (no ligament laxity)

**Management WITHOUT Imaging:**
- RICE: Rest, Ice, Compression, Elevation
- NSAIDs for pain and inflammation
- Protected weight-bearing as tolerated
- Physical therapy if not improving in 1-2 weeks`,
  teaching_points: [
    "The Ottawa Ankle Rules have 98-99.6% sensitivity for fractures and reduce unnecessary X-rays by 30-40% - LEARN and USE them",
    "Key Ottawa sites: posterior edge/tip of malleoli (not anterior), navicular, and base of 5th metatarsal",
    "Tenderness ANTERIOR to the lateral malleolus suggests ATFL sprain, not fracture - this is the most common ankle injury",
    "If the patient can bear weight and take 4 steps, and has no bone tenderness at Ottawa sites, imaging is not indicated",
  ],
  clinical_pearls: [
    {
      content:
        "The most commonly injured ankle ligament is the ATFL (anterior talofibular ligament) - it's injured in inversion sprains and causes tenderness ANTERIOR to the lateral malleolus",
      category: "high-yield",
    },
    {
      content:
        "Ottawa Rules check POSTERIOR malleolus tenderness because that's where the malleolar fractures occur - don't confuse with anterior ligament tenderness",
      category: "clinical-pearl",
    },
    {
      content:
        "The biggest mistake with Ottawa Rules is ignoring them because 'the patient wants an X-ray' - they are one of the most validated clinical decision rules in medicine",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "Apply the Ottawa Ankle Rules systematically",
    "Where exactly is the tenderness located?",
    "Can the patient bear weight?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Acute Trauma to the Ankle",
      source: "American College of Radiology",
      year: 2020,
      url: "https://acsearch.acr.org/docs/69380/Narrative/",
    },
    {
      title: "Ottawa Ankle Rules: Validation Study",
      source: "BMJ",
      year: 1995,
    },
    {
      title: "Implementation of Ottawa Ankle Rules",
      source: "Annals of Emergency Medicine",
      year: 1997,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 2: Ankle Injury - Ottawa Positive (Beginner)
// ============================================================================

export const ankleInjuryOttawaPositive: Case = {
  id: "trauma-ankle-ottawa-positive",
  slug: "ankle-injury-ottawa-rules-positive",
  title: "Ankle Injury - Ottawa Rules Positive",
  chief_complaint: "Can't walk on my ankle after a fall",
  clinical_vignette: `A 28-year-old female presents to the emergency department after falling off a curb 3 hours ago. She was walking in heels, stepped off the curb awkwardly, and her left ankle twisted inward forcefully. She felt a "pop" and immediate severe pain. She was unable to put any weight on it immediately after the injury and had to be helped to a car.

The ankle is significantly swollen. She has not been able to walk since the injury. She tried to stand once and could not bear weight due to severe pain. She rates the pain 8/10.

She has no history of prior ankle injuries. She is otherwise healthy and takes only oral contraceptives.`,
  patient_age: 28,
  patient_sex: "female",
  patient_history: [
    "No prior ankle injuries",
    "No chronic medical conditions",
    "Oral contraceptive use",
  ],
  vital_signs: {
    heart_rate: 88,
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 72,
    respiratory_rate: 14,
    temperature: 36.7,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Young female, appears uncomfortable, not weight-bearing
Left Ankle:
  - Significant swelling diffusely
  - Ecchymosis over lateral and posterior ankle
  - TENDERNESS over POSTERIOR EDGE of LATERAL MALLEOLUS (bone)
  - Tenderness also anterior to lateral malleolus
  - No medial malleolus tenderness
  - No 5th metatarsal or navicular tenderness
  - Limited range of motion due to pain and swelling
  - UNABLE TO BEAR WEIGHT - tried to take 4 steps and could not
Neurovascular: Intact distal pulses, sensation, and motor function (limited by pain)`,
  lab_results: null,
  category: "extremity-trauma" as CaseCategory,
  specialty_tags: ["em", "fm"] as SpecialtyTrack[],
  difficulty: "beginner" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Acute Ankle Injury",
  optimal_imaging: ["xray-ankle"],
  explanation: `This case represents an ankle injury that MEETS Ottawa Ankle Rules criteria. Ankle X-ray IS indicated.

**Ottawa Ankle Rules - This Patient MEETS Criteria:**
1. ✓ **Bone tenderness at posterior edge of LATERAL malleolus** - POSITIVE
2. ✗ No medial malleolus tenderness
3. ✓ **Inability to bear weight and take 4 steps** - POSITIVE

She meets TWO criteria - only ONE is needed to indicate imaging.

**Why X-ray is Appropriate:**
- Ottawa Rules have high sensitivity but imaging is needed when criteria are met
- Clinical suspicion for fracture is elevated
- X-ray will identify:
  - Lateral malleolus fracture (Weber classification)
  - Medial malleolus fracture
  - Bimalleolar or trimalleolar fracture
  - Posterior malleolus fracture
  - Talus fracture
  - Distal fibula fracture

**Standard Ankle X-ray Series:**
- AP view
- Lateral view
- Mortise view (15-20° internal rotation)

**If X-ray is Negative but High Suspicion:**
- Consider CT for occult fracture (talar dome, posterior malleolus)
- MRI for ligament injury or occult bone injury
- Consider stress views for instability

**High-Energy Mechanism Concerns:**
- The "pop" sensation is concerning for either ligament rupture or fracture
- Forced inversion with significant swelling warrants imaging`,
  teaching_points: [
    "Ottawa Ankle Rules indicate when imaging IS needed - meeting ANY ONE criterion means X-ray is appropriate",
    "This patient meets TWO Ottawa criteria: posterior lateral malleolus tenderness AND inability to bear weight",
    "Standard ankle X-ray series includes AP, lateral, and mortise (15-20° internal rotation) views",
    "If X-ray is negative but clinical suspicion remains high, consider CT for occult fracture or MRI for ligament/cartilage injury",
  ],
  clinical_pearls: [
    {
      content:
        "A 'pop' at the time of injury can indicate either ligament rupture OR fracture - it should raise clinical suspicion but isn't specific for either",
      category: "clinical-pearl",
    },
    {
      content:
        "The Weber classification (A, B, C) for lateral malleolus fractures is based on fracture location relative to the syndesmosis and guides treatment",
      category: "high-yield",
    },
    {
      content:
        "Don't forget to examine the proximal fibula in ankle injuries - Maisonneuve fracture (proximal fibula + syndesmosis disruption) can be missed",
      category: "board-favorite",
    },
  ] as ClinicalPearl[],
  hints: [
    "Apply the Ottawa Ankle Rules to this patient",
    "Does she meet any of the criteria for imaging?",
    "What is the appropriate imaging study?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Acute Trauma to the Ankle",
      source: "American College of Radiology",
      year: 2020,
      url: "https://acsearch.acr.org/docs/69380/Narrative/",
    },
    {
      title: "Ottawa Ankle Rules",
      source: "JAMA",
      year: 1994,
    },
    {
      title: "Weber Classification of Ankle Fractures",
      source: "Orthopedic Clinics of North America",
      year: 2008,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 3: Elderly Fall - Hip Fracture (Intermediate)
// ============================================================================

export const elderlyHipFracture: Case = {
  id: "trauma-hip-elderly-fall",
  slug: "elderly-fall-suspected-hip-fracture",
  title: "Elderly Fall - Suspected Hip Fracture",
  chief_complaint: "I fell and can't get up - my hip hurts terribly",
  clinical_vignette: `A 78-year-old female is brought to the emergency department by EMS after falling at home. She was getting up from a chair, felt dizzy, and fell directly onto her left side. She was unable to get up afterward and lay on the floor for approximately 1 hour before her daughter found her.

She is complaining of severe left hip pain, rated 10/10. She cannot move her left leg without severe pain. She denies hitting her head or losing consciousness. She has no neck pain, back pain, or other injuries.

Her medical history includes osteoporosis, hypertension, type 2 diabetes, and mild cognitive impairment. She takes alendronate, lisinopril, metformin, and donepezil. She lives alone but her daughter checks on her daily. She uses a cane for ambulation normally.`,
  patient_age: 78,
  patient_sex: "female",
  patient_history: [
    "Osteoporosis - on alendronate",
    "Hypertension - on lisinopril",
    "Type 2 Diabetes - on metformin",
    "Mild cognitive impairment - on donepezil",
    "Uses cane for ambulation",
    "Lives alone",
  ],
  vital_signs: {
    heart_rate: 98,
    blood_pressure_systolic: 108,
    blood_pressure_diastolic: 62,
    respiratory_rate: 18,
    temperature: 36.4,
    temperature_unit: "celsius",
    oxygen_saturation: 96,
  } as VitalSigns,
  physical_exam: `General: Elderly female, appears uncomfortable, lying supine with left leg supported
Left Lower Extremity:
  - LEFT leg appears SHORTENED and EXTERNALLY ROTATED
  - Unable to actively move left hip due to pain
  - Tenderness to palpation over greater trochanter and groin
  - Unable to perform straight leg raise
  - UNABLE TO BEAR WEIGHT
Neurovascular: 
  - Distal pulses present (DP and PT)
  - Sensation intact
  - Cannot assess motor strength due to pain
Remainder of Exam:
  - No head trauma, C-spine non-tender
  - Chest and abdomen non-tender
  - Right lower extremity normal`,
  lab_results: [
    {
      name: "Hemoglobin",
      value: "10.8",
      unit: "g/dL",
      reference_range: "12.0-16.0",
      is_abnormal: true,
    },
    {
      name: "Creatinine",
      value: "1.4",
      unit: "mg/dL",
      reference_range: "0.6-1.2",
      is_abnormal: true,
    },
    {
      name: "Glucose",
      value: "156",
      unit: "mg/dL",
      reference_range: "70-100",
      is_abnormal: true,
    },
  ] as LabResult[],
  category: "extremity-trauma" as CaseCategory,
  specialty_tags: ["em", "fm", "surgery"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Acute Hip Trauma",
  optimal_imaging: ["xray-hip"],
  explanation: `This case represents a classic hip fracture presentation in an elderly patient. X-ray is the appropriate first-line imaging.

**Classic Hip Fracture Presentation:**
1. **Elderly patient** with **fall**
2. **Hip/groin pain** - cannot move leg
3. **Leg position** - SHORTENED and EXTERNALLY ROTATED (pathognomonic)
4. **Unable to bear weight**
5. **Risk factors** - Osteoporosis, female, age

**Why This is Almost Certainly a Fracture:**
- The triad of elderly + fall + shortened/externally rotated leg is virtually diagnostic
- Shortening occurs due to muscle spasm pulling fractured fragments
- External rotation is due to loss of normal mechanical support

**Why X-ray is First-Line:**
- AP pelvis and lateral hip views
- Sensitivity 90-98% for displaced fractures
- Quick, low cost, widely available
- Identifies fracture location (femoral neck, intertrochanteric, subtrochanteric)
- Guides surgical planning

**If X-ray is NEGATIVE but High Suspicion:**
- **10-15% of hip fractures are occult on initial X-ray**
- Proceed to MRI (gold standard for occult fracture) or CT
- DO NOT send patient home with negative X-ray if clinical suspicion is high
- MRI sensitivity approaches 100% for occult hip fracture

**Clinical Urgency:**
- Hip fractures are SURGICAL EMERGENCIES
- Early surgery (<24-48 hours) reduces mortality
- This patient has low BP (may indicate blood loss, dehydration, or pain)`,
  teaching_points: [
    "The clinical triad of elderly patient + fall + shortened/externally rotated leg is virtually diagnostic of hip fracture",
    "X-ray (AP pelvis + lateral hip) is first-line imaging with 90-98% sensitivity for displaced fractures",
    "10-15% of hip fractures are occult on X-ray - if clinical suspicion is high and X-ray is negative, proceed to MRI (or CT if MRI unavailable)",
    "Hip fractures require early surgery (<24-48 hours) to reduce mortality - don't delay diagnosis",
  ],
  clinical_pearls: [
    {
      content:
        "Femoral neck fractures may disrupt blood supply to the femoral head, risking avascular necrosis - this influences surgical choice (fixation vs replacement)",
      category: "high-yield",
    },
    {
      content:
        "A patient who can straight leg raise against gravity almost certainly does NOT have a hip fracture - this is a useful screening test",
      category: "clinical-pearl",
    },
    {
      content:
        "The biggest mistake is sending home an elderly patient with hip pain and negative X-ray - always consider MRI for occult fracture if suspicion is high",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "What is the clinical significance of a shortened, externally rotated leg?",
    "What is the first-line imaging for suspected hip fracture?",
    "What should you do if X-ray is negative but suspicion remains high?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Acute Hip Trauma",
      source: "American College of Radiology",
      year: 2019,
      url: "https://acsearch.acr.org/docs/69419/Narrative/",
    },
    {
      title: "MRI for Occult Hip Fractures",
      source: "Radiology",
      year: 2012,
    },
    {
      title: "Hip Fracture Management Guidelines",
      source: "American Academy of Orthopaedic Surgeons",
      year: 2021,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 4: Knee Trauma - Possible Fracture (Intermediate)
// ============================================================================

export const kneeTrauma: Case = {
  id: "trauma-knee-mva",
  slug: "knee-trauma-motor-vehicle-accident",
  title: "Knee Trauma - Motor Vehicle Accident",
  chief_complaint: "My knee hit the dashboard in a car accident",
  clinical_vignette: `A 35-year-old male is brought to the emergency department by ambulance after being involved in a motor vehicle collision. He was an unrestrained driver who rear-ended another vehicle at approximately 30 mph. His knee struck the dashboard. The airbags deployed.

He is complaining of severe right knee pain, rated 9/10. He notes significant swelling that developed within minutes of the injury. He cannot bend his knee past 90 degrees due to pain and swelling. He is unsure if he can bear weight as he has not tried.

He denies loss of consciousness, head injury, neck pain, or other injuries. He has no significant medical history. He takes no medications.`,
  patient_age: 35,
  patient_sex: "male",
  patient_history: [
    "No significant medical history",
    "No prior knee injuries",
    "No medications",
    "Unrestrained driver in MVC",
  ],
  vital_signs: {
    heart_rate: 92,
    blood_pressure_systolic: 138,
    blood_pressure_diastolic: 88,
    respiratory_rate: 16,
    temperature: 36.8,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Young male, alert, in moderate distress from knee pain
Right Knee:
  - Large EFFUSION present (tense)
  - Diffuse swelling
  - Tenderness over patella, femoral condyles, and tibial plateau
  - Cannot flex knee past 90 degrees
  - UNABLE TO BEAR WEIGHT when attempted
  - Limited ligament exam due to swelling and guarding
  - Neurovascular intact distally
Remainder:
  - Cervical spine non-tender with full ROM
  - No chest wall tenderness
  - Abdomen soft, non-tender
  - Right hip exam limited but non-tender`,
  lab_results: null,
  category: "extremity-trauma" as CaseCategory,
  specialty_tags: ["em", "surgery"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Acute Knee Trauma",
  optimal_imaging: ["xray-hip"],
  explanation: `This case represents significant knee trauma from dashboard impact. Knee X-ray is indicated based on Ottawa Knee Rules AND mechanism.

**Ottawa Knee Rules - X-ray Indicated If ANY:**
1. Age ≥55 years
2. Isolated tenderness of patella (no other bony tenderness)
3. Tenderness at head of fibula
4. Inability to flex knee to 90 degrees
5. Inability to bear weight immediately AND in ED (4 steps)

**This Patient MEETS Multiple Criteria:**
- ✓ **Cannot flex to 90 degrees** - POSITIVE
- ✓ **Cannot bear weight** - POSITIVE

**High-Energy Mechanism Considerations:**
Even without Ottawa criteria, this mechanism warrants imaging:
- Dashboard impact = axial load on flexed knee
- Can cause:
  - Patellar fracture
  - Femoral condyle fracture
  - Tibial plateau fracture
  - Posterior cruciate ligament (PCL) injury
  - Posterior hip dislocation (check hip!)

**Why X-ray is Appropriate:**
- AP and lateral knee views
- Evaluate for fracture
- Assess for effusion (often hemarthrosis with fracture or ligament injury)
- May add patellar (sunrise) view

**Rapid Effusion is Concerning:**
- Effusion within minutes to hours of injury = hemarthrosis
- Hemarthrosis differential:
  - Fracture (most common)
  - ACL tear
  - Meniscal tear with vascular zone involvement
  - Patellar dislocation

**Don't Forget:**
- Dashboard injuries can cause posterior hip dislocation - examine the hip
- Consider pelvis X-ray if any hip concern`,
  teaching_points: [
    "Ottawa Knee Rules indicate X-ray if: age ≥55, isolated patella tenderness, fibular head tenderness, cannot flex to 90°, or cannot bear weight 4 steps",
    "Dashboard mechanism (axial load on flexed knee) can cause patella fracture, tibial plateau fracture, PCL injury, and posterior hip dislocation",
    "Rapid effusion (hemarthrosis) after knee trauma suggests fracture, ACL tear, or other significant injury - imaging is warranted",
    "Always examine the hip in dashboard knee injuries - posterior hip dislocation is an emergency and can be missed",
  ],
  clinical_pearls: [
    {
      content:
        "The Ottawa Knee Rules have 98.5% sensitivity for fractures - using them reduces unnecessary X-rays by 28%",
      category: "high-yield",
    },
    {
      content:
        "A lipohemarthrosis (fat-fluid level on lateral X-ray) is PATHOGNOMONIC for intra-articular fracture - fat from bone marrow floats on blood",
      category: "clinical-pearl",
    },
    {
      content:
        "Don't forget to examine the hip in dashboard injuries - posterior hip dislocation can present subtly and is an orthopedic emergency",
      category: "board-favorite",
    },
  ] as ClinicalPearl[],
  hints: [
    "Apply the Ottawa Knee Rules to this patient",
    "What is concerning about the mechanism of injury?",
    "What does rapid effusion after trauma suggest?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Acute Trauma to the Knee",
      source: "American College of Radiology",
      year: 2020,
      url: "https://acsearch.acr.org/docs/69420/Narrative/",
    },
    {
      title: "Ottawa Knee Rules",
      source: "Annals of Internal Medicine",
      year: 1996,
    },
    {
      title: "Dashboard Knee Injuries",
      source: "Journal of Trauma",
      year: 2005,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Export All Extremity Trauma Cases
// ============================================================================

export const extremityTraumaCases: Case[] = [
  ankleInjuryOttawaNegative,
  ankleInjuryOttawaPositive,
  elderlyHipFracture,
  kneeTrauma,
];

/**
 * Imaging ratings for Extremity Trauma cases
 */
export const extremityTraumaImagingRatings = {
  // Case 1: Ankle Injury - Ottawa Negative
  "trauma-ankle-ottawa-negative": [
    {
      imaging_option_id: "no-imaging",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Patient does not meet Ottawa Ankle Rules criteria. Ottawa Rules have 98-99.6% sensitivity - imaging is not indicated.",
    },
    {
      imaging_option_id: "xray-ankle",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "Ottawa Rules negative. X-ray would add cost and radiation without clinical benefit.",
    },
    {
      imaging_option_id: "mri-knee",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "MRI is not indicated for acute ankle sprain with Ottawa-negative exam and clinically stable presentation.",
    },
  ],

  // Case 2: Ankle Injury - Ottawa Positive
  "trauma-ankle-ottawa-positive": [
    {
      imaging_option_id: "xray-ankle",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Patient meets Ottawa Ankle Rules (posterior lateral malleolus tenderness AND inability to bear weight). X-ray is indicated.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Ottawa Rules positive - imaging is needed to evaluate for fracture.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 3,
      rating_category: "usually-not-appropriate",
      rationale:
        "CT is not first-line for ankle injury. Reserve for complex fractures or surgical planning after initial X-ray.",
    },
  ],

  // Case 3: Elderly Hip Fracture
  "trauma-hip-elderly-fall": [
    {
      imaging_option_id: "xray-hip",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Classic hip fracture presentation (elderly, fall, shortened/externally rotated leg). AP pelvis and lateral hip X-ray is first-line.",
    },
    {
      imaging_option_id: "mri-lumbar-nc",
      acr_rating: 7,
      rating_category: "usually-appropriate",
      rationale:
        "MRI hip is indicated if X-ray is negative but clinical suspicion remains high. 10-15% of hip fractures are occult on X-ray.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 6,
      rating_category: "may-be-appropriate",
      rationale:
        "CT can detect occult fractures if MRI is unavailable or contraindicated, though MRI is preferred.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Clinical presentation strongly suggests fracture. Imaging is mandatory before management decisions.",
    },
  ],

  // Case 4: Knee Trauma
  "trauma-knee-mva": [
    {
      imaging_option_id: "xray-hip",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Patient meets Ottawa Knee Rules (cannot flex to 90°, cannot bear weight). High-energy mechanism also warrants imaging. Should be knee X-ray.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "CT knee may be needed for complex fractures (tibial plateau) but is not first-line. Consider CT hip for dashboard mechanism.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Ottawa Knee Rules positive and high-energy mechanism. Imaging is mandatory.",
    },
    {
      imaging_option_id: "mri-knee",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "MRI is not first-line for acute trauma. May be useful after X-ray if ligament or meniscal injury suspected.",
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getExtremityTraumaCaseById(id: string): Case | undefined {
  return extremityTraumaCases.find((c) => c.id === id);
}

export function getExtremityTraumaCaseBySlug(slug: string): Case | undefined {
  return extremityTraumaCases.find((c) => c.slug === slug);
}

export function getExtremityTraumaImagingRatings(
  caseId: string
): typeof extremityTraumaImagingRatings[keyof typeof extremityTraumaImagingRatings] | undefined {
  return extremityTraumaImagingRatings[caseId as keyof typeof extremityTraumaImagingRatings];
}
