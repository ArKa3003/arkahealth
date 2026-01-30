// @ts-nocheck
/**
 * Low Back Pain Seed Cases
 *
 * Five clinical cases covering the spectrum of low back pain presentations
 * from simple mechanical LBP to complex cases with red flags.
 *
 * Based on ACR Appropriateness Criteria for Low Back Pain.
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
// Case 1: Acute Mechanical LBP (Beginner)
// ============================================================================

export const acuteMechanicalLBP: Case = {
  id: "lbp-acute-mechanical",
  slug: "acute-mechanical-low-back-pain",
  title: "Acute Low Back Pain in a Young Adult",
  chief_complaint: "Low back pain for 3 days",
  clinical_vignette: `A 28-year-old male presents to the clinic with low back pain that started 3 days ago after helping a friend move furniture. He describes the pain as a dull ache localized to the lower lumbar region, rated 6/10 in intensity. The pain is worse with movement, bending, and prolonged sitting, and is relieved by rest and lying down. He has taken ibuprofen with moderate relief.

The patient denies any radiation of pain to the legs, numbness, tingling, or weakness in the lower extremities. He reports no bowel or bladder dysfunction, no saddle anesthesia, and no difficulty walking. He has no history of fever, unexplained weight loss, night sweats, or recent infections. He has no personal history of cancer or significant medical conditions. He works as a software developer and exercises regularly.`,
  patient_age: 28,
  patient_sex: "male",
  patient_history: [
    "No significant past medical history",
    "No prior back problems",
    "Regular exercise",
    "Non-smoker",
  ],
  vital_signs: {
    heart_rate: 72,
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 76,
    respiratory_rate: 14,
    temperature: 36.8,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Well-appearing male in no acute distress
Spine: Mild paravertebral muscle tenderness bilaterally at L4-L5 level. No midline tenderness. No step-off deformity.
Range of Motion: Limited forward flexion due to pain, extension slightly limited
Neurological: Strength 5/5 in bilateral lower extremities (hip flexion, knee extension, ankle dorsiflexion, plantarflexion). Sensation intact to light touch in all dermatomes. Reflexes 2+ and symmetric at patellar and Achilles tendons.
Special Tests: Negative straight leg raise bilaterally. Negative crossed straight leg raise.
Gait: Normal, non-antalgic`,
  lab_results: null,
  category: "low-back-pain" as CaseCategory,
  specialty_tags: ["fm", "im", "em"] as SpecialtyTrack[],
  difficulty: "beginner" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Low Back Pain",
  optimal_imaging: ["no-imaging"],
  explanation: `This case represents classic acute mechanical low back pain, which is the most common presentation of back pain in primary care. The key clinical features supporting conservative management WITHOUT imaging include:

1. **Duration < 6 weeks**: Acute low back pain is defined as lasting less than 6 weeks. Most cases (90%) resolve within this timeframe regardless of treatment.

2. **Clear mechanical trigger**: The onset after physical exertion (moving furniture) suggests a musculoskeletal etiology such as muscle strain or ligamentous sprain.

3. **Absence of red flags**: No "red flag" symptoms that would warrant urgent imaging:
   - No fever or signs of infection (spinal epidural abscess, osteomyelitis)
   - No unexplained weight loss or history of malignancy
   - No neurological deficits (cauda equina syndrome, severe radiculopathy)
   - No history of significant trauma
   - No bowel/bladder dysfunction
   - Age is not concerning (not elderly, no increased fracture risk)
   - No IV drug use or immunocompromise

According to ACR Appropriateness Criteria, imaging for uncomplicated acute low back pain without red flags is rated as "Usually Not Appropriate" (ACR 1-3). Multiple studies have shown that early imaging does not improve outcomes and may lead to unnecessary interventions.`,
  teaching_points: [
    "Acute mechanical LBP without red flags does NOT require imaging - this is one of the most important clinical decision rules in medicine",
    "90% of acute low back pain resolves within 6 weeks with conservative management including NSAIDs, activity modification, and physical therapy",
    "The presence of ANY red flag (fever, weight loss, neurological deficits, cancer history, trauma, age >50 with new back pain, IV drug use) should prompt imaging consideration",
    "Early imaging for uncomplicated LBP has been shown to increase healthcare costs and may lead to unnecessary interventions without improving patient outcomes",
  ],
  clinical_pearls: [
    {
      content:
        "The absence of red flags is more important than the presence of symptoms in determining imaging need for acute LBP",
      category: "high-yield",
    },
    {
      content:
        "Studies show that patients who receive early imaging for uncomplicated LBP have LONGER disability duration and higher healthcare costs",
      category: "clinical-pearl",
    },
    {
      content:
        'A common mistake is ordering imaging because the patient "wants an answer" - proper counseling about the natural history is more valuable',
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "Consider whether there are any 'red flag' symptoms present",
    "Think about the natural history of acute mechanical low back pain",
    "What does the ACR say about imaging for uncomplicated acute LBP?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Low Back Pain",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69483/Narrative/",
    },
    {
      title: "Early imaging for back pain: limited benefit, added costs",
      source: "Annals of Internal Medicine",
      year: 2009,
    },
    {
      title:
        "Choosing Wisely: Five things physicians and patients should question",
      source: "American Academy of Family Physicians",
      year: 2012,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 2: LBP with Red Flags (Intermediate)
// ============================================================================

export const lbpWithRedFlags: Case = {
  id: "lbp-red-flags-neuro",
  slug: "low-back-pain-neurological-symptoms",
  title: "Low Back Pain with Neurological Symptoms",
  chief_complaint: "Back pain with leg weakness and difficulty urinating",
  clinical_vignette: `A 55-year-old female presents to the emergency department with 2 weeks of progressive low back pain accompanied by new left leg weakness and urinary retention requiring catheterization at home. The back pain is constant, rated 8/10, and not relieved by rest or NSAIDs. She reports difficulty walking due to weakness and has noticed numbness in her "saddle area" over the past few days.

Her medical history is significant for breast cancer diagnosed 5 years ago, treated with mastectomy, chemotherapy, and radiation. She has been in remission with normal surveillance imaging until 6 months ago. She denies recent trauma, fever, or infection. She has unintentionally lost 10 pounds over the past 2 months.

The patient is very concerned as she has been unable to work for the past week and her symptoms are worsening.`,
  patient_age: 55,
  patient_sex: "female",
  patient_history: [
    "Breast cancer - Stage IIA, 5 years ago",
    "Mastectomy with reconstruction",
    "Adjuvant chemotherapy (completed)",
    "Radiation therapy (completed)",
    "Tamoxifen therapy (current)",
    "Hypertension - well controlled",
    "Osteopenia",
  ],
  vital_signs: {
    heart_rate: 88,
    blood_pressure_systolic: 138,
    blood_pressure_diastolic: 82,
    respiratory_rate: 16,
    temperature: 37.2,
    temperature_unit: "celsius",
    oxygen_saturation: 98,
  } as VitalSigns,
  physical_exam: `General: Anxious-appearing female, uncomfortable but not in acute distress
Spine: Tenderness to palpation over mid-lumbar spine (L2-L4). No paraspinal muscle spasm.
Neurological: 
  - Motor: Left hip flexion 3/5, left knee extension 4/5, left ankle dorsiflexion 4/5
    Right lower extremity 5/5 throughout
  - Sensory: Decreased sensation in left L3-L4 distribution, decreased perianal sensation
  - Reflexes: Left patellar 1+, right patellar 2+. Achilles 2+ bilaterally
  - Special: Positive straight leg raise on left at 30 degrees
Rectal: Decreased anal sphincter tone
Gait: Antalgic, left leg weakness apparent`,
  lab_results: [
    {
      name: "WBC",
      value: "6.8",
      unit: "x10^9/L",
      reference_range: "4.5-11.0",
      is_abnormal: false,
    },
    {
      name: "Hemoglobin",
      value: "11.2",
      unit: "g/dL",
      reference_range: "12.0-16.0",
      is_abnormal: true,
    },
    {
      name: "Calcium",
      value: "11.4",
      unit: "mg/dL",
      reference_range: "8.5-10.5",
      is_abnormal: true,
    },
    {
      name: "Alkaline Phosphatase",
      value: "245",
      unit: "U/L",
      reference_range: "44-147",
      is_abnormal: true,
    },
  ] as LabResult[],
  category: "low-back-pain" as CaseCategory,
  specialty_tags: ["em", "im", "surgery"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Low Back Pain - Suspected Malignancy",
  optimal_imaging: ["mri-lumbar-nc"],
  explanation: `This case demonstrates multiple red flags that mandate URGENT imaging:

**Critical Red Flags Present:**
1. **History of malignancy** (breast cancer) - One of the most important red flags. Breast cancer commonly metastasizes to bone.
2. **Progressive neurological deficits** - Left leg weakness indicates possible cord/nerve root compression
3. **Cauda equina syndrome features** - Saddle anesthesia, urinary retention, decreased anal tone
4. **Unexplained weight loss** - Suggests systemic illness/malignancy
5. **Hypercalcemia and elevated ALP** - Laboratory findings consistent with bone metastases

**Why MRI is the optimal choice:**
- MRI is the gold standard for evaluating spinal cord, nerve roots, and soft tissue pathology
- Superior for detecting epidural metastases, cord compression, and soft tissue extension
- No radiation (relevant for cancer patient with prior radiation)
- Can evaluate multiple levels of the spine in one study

**Why NOT other options:**
- X-ray: Insensitive for early metastatic disease (30-50% of trabecular bone must be destroyed before visible)
- CT: Better for bony detail but inferior for cord/soft tissue evaluation
- This is an EMERGENCY - suspected cauda equina syndrome requires immediate imaging and likely urgent surgical consultation`,
  teaching_points: [
    "Cauda equina syndrome is a surgical emergency - classic triad is saddle anesthesia, urinary retention, and bilateral leg weakness",
    "History of malignancy, especially breast, prostate, lung, kidney, and thyroid, significantly increases pre-test probability for metastatic disease",
    "MRI is the imaging modality of choice when neurological compromise or malignancy is suspected - it provides superior soft tissue contrast",
    "Elevated alkaline phosphatase and hypercalcemia in a patient with back pain and cancer history strongly suggests bone metastases",
  ],
  clinical_pearls: [
    {
      content:
        "The 5 cancers that most commonly metastasize to bone: Breast, Prostate, Lung, Kidney, Thyroid - remember 'BLT with a Kosher Pickle'",
      category: "high-yield",
    },
    {
      content:
        "Cauda equina syndrome may present with urinary RETENTION early (due to parasympathetic dysfunction) but later progresses to incontinence",
      category: "clinical-pearl",
    },
    {
      content:
        "X-rays can be falsely negative for metastatic disease - 30-50% of trabecular bone must be destroyed before lesions become visible on radiographs",
      category: "board-favorite",
    },
  ] as ClinicalPearl[],
  hints: [
    "Look at the patient's past medical history carefully",
    "Consider what symptoms suggest cauda equina syndrome",
    "Which imaging modality best evaluates the spinal cord?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Low Back Pain",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69483/Narrative/",
    },
    {
      title: "Diagnosis and Management of Cauda Equina Syndrome",
      source: "American Academy of Orthopaedic Surgeons",
      year: 2019,
    },
    {
      title: "Imaging of Spinal Metastatic Disease",
      source: "AJR American Journal of Roentgenology",
      year: 2020,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 3: Chronic LBP (Intermediate)
// ============================================================================

export const chronicLBP: Case = {
  id: "lbp-chronic-failed-conservative",
  slug: "chronic-low-back-pain-failed-conservative-therapy",
  title: "Chronic Low Back Pain with Failed Conservative Therapy",
  chief_complaint: "Low back pain for 4 months despite treatment",
  clinical_vignette: `A 45-year-old male accountant presents for evaluation of persistent low back pain that has been present for 4 months. He initially developed the pain without any inciting event and has tried multiple treatments without significant improvement. He completed 8 weeks of physical therapy, has taken NSAIDs regularly (ibuprofen 600mg TID), and has modified his work ergonomics with a standing desk.

The pain is described as a constant dull ache in the lower lumbar region, rated 5-6/10 most days. It is worse with prolonged sitting and at the end of the workday. He has no leg pain, numbness, tingling, or weakness. There are no bowel or bladder symptoms. He sleeps poorly due to difficulty finding a comfortable position.

He denies any history of trauma, fever, weight loss, or night sweats. He has no history of cancer. He is otherwise healthy with no chronic medical conditions. He does not smoke and drinks alcohol socially. He is becoming frustrated and worried about his quality of life and ability to work.`,
  patient_age: 45,
  patient_sex: "male",
  patient_history: [
    "Hyperlipidemia - diet controlled",
    "Completed 8 weeks of physical therapy",
    "No prior back surgery",
    "No history of cancer",
    "Non-smoker",
  ],
  vital_signs: {
    heart_rate: 68,
    blood_pressure_systolic: 126,
    blood_pressure_diastolic: 78,
    respiratory_rate: 14,
    temperature: 36.6,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Well-appearing male, mildly uncomfortable when sitting
Spine: No paraspinal muscle tenderness. Mild pain with lumbar extension.
Range of Motion: Full flexion and extension with discomfort at end-range extension
Neurological: Strength 5/5 bilateral lower extremities in all major muscle groups. Sensation intact throughout. Reflexes 2+ and symmetric.
Special Tests: Negative bilateral straight leg raise. FABER test mildly positive bilaterally (hip osteoarthritis vs SI joint).
Gait: Normal`,
  lab_results: null,
  category: "low-back-pain" as CaseCategory,
  specialty_tags: ["fm", "im"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Low Back Pain",
  optimal_imaging: ["mri-lumbar-nc"],
  explanation: `This case represents chronic low back pain (>12 weeks duration) that has failed conservative therapy. While no red flags are present, imaging is now appropriate for the following reasons:

**Why imaging is NOW indicated:**
1. **Duration > 6 weeks** - By definition, this is now chronic back pain, which has different management implications
2. **Failed conservative therapy** - Patient has completed a reasonable trial of first-line treatments (PT, NSAIDs, ergonomic modifications) without improvement
3. **Impact on function** - Pain is affecting work and quality of life, warranting further workup

**Why MRI is the optimal choice:**
- Superior evaluation of disc pathology (degeneration, bulging, herniation)
- Can assess facet joint arthropathy
- Evaluates for lumbar stenosis
- No radiation exposure
- May identify treatable causes that could benefit from intervention

**Why NOT other options:**
- X-ray: Limited utility - cannot assess discs, neural structures, or soft tissues
- CT: Provides good bony detail but inferior for disc and soft tissue evaluation
- No imaging: No longer appropriate given failed conservative management

**Clinical context:**
The goal of imaging at this stage is to identify any structural pathology that might:
1. Explain the patient's symptoms
2. Guide further treatment (injection therapy, referral for surgical evaluation)
3. Rule out occult pathology`,
  teaching_points: [
    "The 6-week threshold is key: acute LBP (<6 weeks) without red flags needs no imaging, but chronic LBP (>6-12 weeks) with failed conservative therapy may benefit from MRI",
    "MRI is the modality of choice for evaluating disc disease, spinal stenosis, and facet arthropathy in chronic LBP",
    "Even when ordering imaging for chronic LBP, manage expectations - degenerative findings are common in asymptomatic individuals and may not correlate with symptoms",
    "Imaging findings should be correlated with clinical presentation before making treatment decisions",
  ],
  clinical_pearls: [
    {
      content:
        "Studies show that ~60% of asymptomatic adults over 40 have disc bulges on MRI - findings must be correlated clinically",
      category: "high-yield",
    },
    {
      content:
        "Failed conservative therapy means adequate trial (typically 6-8 weeks) of appropriate treatments, not just symptom persistence",
      category: "clinical-pearl",
    },
    {
      content:
        "Ordering imaging too early can lead to 'incidentalomas' and unnecessary interventions without improving outcomes",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "How long has this patient had symptoms?",
    "Has the patient had a reasonable trial of conservative therapy?",
    "What imaging best evaluates disc and soft tissue pathology?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Low Back Pain",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69483/Narrative/",
    },
    {
      title:
        "Imaging for Low Back Pain: A Systematic Review of Clinical Outcomes",
      source: "Journal of the American Medical Association",
      year: 2018,
    },
    {
      title:
        "Lumbar Disc Degeneration Correlation with MRI and Clinical Symptoms",
      source: "Spine Journal",
      year: 2017,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 4: LBP with Radiculopathy (Advanced)
// ============================================================================

export const lbpWithRadiculopathy: Case = {
  id: "lbp-radiculopathy-acute",
  slug: "low-back-pain-with-sciatica",
  title: "Low Back Pain with Sciatica",
  chief_complaint: "Back pain shooting down my right leg for 3 weeks",
  clinical_vignette: `A 38-year-old male construction worker presents with 3 weeks of low back pain that radiates down the posterior aspect of his right leg to his foot. The pain started after lifting heavy materials at work. He describes the leg pain as a sharp, shooting sensation that travels from his buttock down the back of his thigh and calf to his lateral foot. The leg pain is worse than the back pain.

The pain is exacerbated by sitting, coughing, and sneezing. He has noticed mild numbness on the outer aspect of his right foot but denies any weakness, bowel or bladder problems, or saddle area numbness. He has been taking acetaminophen with minimal relief.

He is otherwise healthy with no significant medical history, no prior back problems, and no history of cancer. He does not smoke. He is worried about missing work and his ability to perform his physically demanding job.`,
  patient_age: 38,
  patient_sex: "male",
  patient_history: [
    "No significant past medical history",
    "Construction worker - heavy lifting",
    "No prior back surgery",
    "Non-smoker",
    "Social alcohol use",
  ],
  vital_signs: {
    heart_rate: 76,
    blood_pressure_systolic: 132,
    blood_pressure_diastolic: 84,
    respiratory_rate: 14,
    temperature: 36.7,
    temperature_unit: "celsius",
    oxygen_saturation: 99,
  } as VitalSigns,
  physical_exam: `General: Well-appearing male, shifting uncomfortably in chair
Spine: Mild paraspinal muscle tenderness right > left at L4-S1. No midline tenderness.
Range of Motion: Limited forward flexion due to leg pain. Extension mildly limited.
Neurological:
  - Motor: Right ankle dorsiflexion 4+/5 (subtle weakness), all other muscle groups 5/5
  - Sensory: Decreased light touch sensation in S1 distribution (lateral foot) on right
  - Reflexes: Right Achilles 1+, left Achilles 2+. Patellar reflexes 2+ bilaterally.
Special Tests: Positive straight leg raise on right at 40 degrees (reproduces radicular pain). Negative crossed straight leg raise. Negative slump test on left.
Gait: Slightly antalgic, no foot drop`,
  lab_results: null,
  category: "low-back-pain" as CaseCategory,
  specialty_tags: ["fm", "im", "em", "surgery"] as SpecialtyTrack[],
  difficulty: "advanced" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Low Back Pain with Radiculopathy",
  optimal_imaging: ["no-imaging"],
  explanation: `This case represents acute lumbar radiculopathy (sciatica) WITHOUT red flags, which presents a nuanced clinical decision. The key teaching point is:

**INITIAL MANAGEMENT: Conservative therapy WITHOUT immediate imaging**

**Why NO imaging initially?**
1. **Duration < 6 weeks** - Even with radiculopathy, most patients improve with conservative management
2. **No significant motor weakness** - The subtle weakness (4+/5) is not severe enough to warrant urgent intervention
3. **No cauda equina features** - No bladder/bowel dysfunction, no saddle anesthesia
4. **Natural history is favorable** - 70-80% of patients with acute sciatica improve within 6-12 weeks without surgery

**Clinical findings suggesting L5-S1 radiculopathy:**
- Pain radiating to lateral foot (S1 distribution)
- Decreased S1 sensation (lateral foot)
- Diminished Achilles reflex (S1)
- Positive straight leg raise

**When to reconsider:**
- Symptoms persist beyond 6 weeks despite conservative management → then MRI is indicated
- Progressive motor weakness develops
- Cauda equina symptoms emerge

**ACR Appropriateness Criteria:**
For radiculopathy < 6 weeks without severe or progressive neurological deficits:
- Imaging: Usually Not Appropriate (ACR 2-3)
- Conservative management: First-line treatment

This is a challenging concept because patients often expect imaging when they have severe radicular symptoms. However, evidence shows early imaging does not improve outcomes for uncomplicated radiculopathy.`,
  teaching_points: [
    "Radiculopathy WITHOUT severe motor deficits or cauda equina features should initially be managed conservatively, with imaging reserved for cases that fail 6 weeks of treatment",
    "70-80% of patients with acute sciatica improve within 6-12 weeks without surgery - patience is key",
    "The presence of radicular symptoms alone does NOT mandate immediate imaging - severity, duration, and red flags guide the decision",
    "If the patient develops progressive weakness, worsening symptoms, or cauda equina features, this changes the management and URGENT imaging becomes indicated",
  ],
  clinical_pearls: [
    {
      content:
        "The L5-S1 disc herniation is the most common, causing S1 radiculopathy with lateral foot numbness and decreased Achilles reflex",
      category: "high-yield",
    },
    {
      content:
        "A positive straight leg raise at <60 degrees has high sensitivity (~90%) for disc herniation but low specificity",
      category: "clinical-pearl",
    },
    {
      content:
        "Ordering MRI immediately for radiculopathy without red flags or failed conservative therapy is a common over-imaging error",
      category: "common-mistake",
    },
    {
      content:
        "Board exams often test the concept that radiculopathy WITHOUT red flags should have conservative management FIRST, imaging only if fails treatment",
      category: "board-favorite",
    },
  ] as ClinicalPearl[],
  hints: [
    "How long has this patient had radicular symptoms?",
    "Are there any signs of cauda equina syndrome or severe motor weakness?",
    "What is the natural history of acute sciatica?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Low Back Pain",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69483/Narrative/",
    },
    {
      title: "Diagnosis and Treatment of Sciatica",
      source: "British Medical Journal",
      year: 2007,
    },
    {
      title: "Early Imaging for Low Back Pain and Sciatica",
      source: "Cochrane Database of Systematic Reviews",
      year: 2015,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Case 5: Suspected Compression Fracture (Intermediate)
// ============================================================================

export const suspectedCompressionFracture: Case = {
  id: "lbp-compression-fracture",
  slug: "low-back-pain-fall-elderly",
  title: "Low Back Pain After Fall in Elderly Patient",
  chief_complaint: "Severe back pain after falling at home",
  clinical_vignette: `A 72-year-old female presents to the emergency department with severe midback pain after falling at home 1 week ago. She tripped over her cat and fell backwards, landing on her buttocks. She had immediate onset of pain in her mid-to-lower thoracic spine area and has been unable to get comfortable since. She rates the pain 8/10 and describes it as constant, sharp, and worse with any movement.

She has been mostly confined to bed rest as sitting and standing are very painful. She has tried acetaminophen and ibuprofen with minimal relief. She denies any leg pain, numbness, tingling, weakness, or bowel/bladder problems.

Her medical history is significant for osteoporosis diagnosed 3 years ago. She was on alendronate but stopped taking it 6 months ago due to GI side effects. She also has hypertension and hypothyroidism. She does not smoke, drinks occasionally, and lives alone.`,
  patient_age: 72,
  patient_sex: "female",
  patient_history: [
    "Osteoporosis - diagnosed 3 years ago",
    "Alendronate - discontinued 6 months ago",
    "Hypertension - on lisinopril",
    "Hypothyroidism - on levothyroxine",
    "No prior fractures",
    "Lives alone",
  ],
  vital_signs: {
    heart_rate: 84,
    blood_pressure_systolic: 148,
    blood_pressure_diastolic: 88,
    respiratory_rate: 18,
    temperature: 36.8,
    temperature_unit: "celsius",
    oxygen_saturation: 97,
  } as VitalSigns,
  physical_exam: `General: Elderly female, appears uncomfortable, holding her back
Spine: Significant point tenderness to palpation over T11-T12 spinous processes. Paraspinal muscle spasm present. Kyphosis noted.
Range of Motion: Severely limited in all planes due to pain
Neurological: Strength 5/5 bilateral lower extremities. Sensation intact. Reflexes 2+ and symmetric. 
Special Tests: Unable to perform straight leg raise due to back pain
Gait: Antalgic, slow, guarded. Uses walker for stability.
Skin: No ecchymosis over spine`,
  lab_results: [
    {
      name: "Calcium",
      value: "9.2",
      unit: "mg/dL",
      reference_range: "8.5-10.5",
      is_abnormal: false,
    },
    {
      name: "Vitamin D",
      value: "18",
      unit: "ng/mL",
      reference_range: "30-100",
      is_abnormal: true,
    },
    {
      name: "Creatinine",
      value: "1.1",
      unit: "mg/dL",
      reference_range: "0.6-1.2",
      is_abnormal: false,
    },
  ] as LabResult[],
  category: "low-back-pain" as CaseCategory,
  specialty_tags: ["em", "fm", "im"] as SpecialtyTrack[],
  difficulty: "intermediate" as DifficultyLevel,
  acr_topic: "ACR Appropriateness Criteria: Low Back Pain - Osteoporotic Fracture",
  optimal_imaging: ["xray-lumbar"],
  explanation: `This case demonstrates a classic presentation of suspected vertebral compression fracture in an elderly osteoporotic patient. Imaging IS indicated in this case.

**Why imaging is appropriate:**
1. **Significant trauma mechanism** in an elderly patient with osteoporosis - even low-energy falls can cause fractures
2. **Point tenderness over specific vertebra** (T11-T12) - localizing sign suggestive of fracture
3. **Known osteoporosis** with discontinued treatment - increased fracture risk
4. **Severe, persistent pain** - typical of compression fracture

**Why X-ray is the initial choice:**
- First-line imaging for suspected vertebral fracture
- Can identify compression fracture, assess vertebral height loss
- Quick, low cost, widely available
- Low radiation exposure
- Adequate for initial diagnosis in most cases

**When to escalate to MRI:**
- If fracture confirmed on X-ray and assessment of acuity is needed (old vs. new)
- If neurological symptoms develop
- If pathological fracture is suspected (concern for malignancy)
- If X-ray is negative but clinical suspicion remains high

**Important clinical considerations:**
- Compression fractures can be acute, chronic, or pathological
- MRI with STIR sequence can differentiate acute from chronic fractures
- Consider secondary causes of osteoporosis if not previously evaluated
- Vitamin D deficiency (as in this case) contributes to bone fragility`,
  teaching_points: [
    "In elderly patients with osteoporosis, minor trauma can cause vertebral compression fractures - X-ray is the appropriate initial imaging",
    "Point tenderness over a specific spinous process is a highly localizing finding that increases pre-test probability for fracture",
    "If X-ray shows fracture but there's concern about whether it's acute vs. chronic, MRI with STIR sequence can differentiate based on bone marrow edema",
    "Vitamin D deficiency is common in osteoporotic patients and contributes to fall risk and bone fragility - always check and supplement",
  ],
  clinical_pearls: [
    {
      content:
        "Point tenderness over a specific spinous process has high positive predictive value for vertebral fracture in the setting of trauma",
      category: "clinical-pearl",
    },
    {
      content:
        "MRI STIR sequence shows bone marrow edema in ACUTE fractures but not chronic - this helps determine fracture age",
      category: "high-yield",
    },
    {
      content:
        "Don't forget to restart osteoporosis treatment and check vitamin D - preventing the NEXT fracture is as important as treating this one",
      category: "common-mistake",
    },
  ] as ClinicalPearl[],
  hints: [
    "Consider the patient's age and bone health status",
    "What is the significance of point tenderness over a specific vertebra?",
    "What is the first-line imaging for suspected vertebral fracture?",
  ],
  references: [
    {
      title: "ACR Appropriateness Criteria: Low Back Pain",
      source: "American College of Radiology",
      year: 2021,
      url: "https://acsearch.acr.org/docs/69483/Narrative/",
    },
    {
      title: "Diagnosis and Management of Vertebral Compression Fractures",
      source: "American Family Physician",
      year: 2020,
    },
    {
      title:
        "MRI Characteristics of Acute vs. Chronic Vertebral Compression Fractures",
      source: "Radiology",
      year: 2018,
    },
  ] as Reference[],
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// Export All Cases
// ============================================================================

export const lowBackPainCases: Case[] = [
  acuteMechanicalLBP,
  lbpWithRedFlags,
  chronicLBP,
  lbpWithRadiculopathy,
  suspectedCompressionFracture,
];

/**
 * Imaging ratings for Low Back Pain cases
 * Each case has ratings for multiple imaging options
 */
export const lowBackPainImagingRatings = {
  // Case 1: Acute Mechanical LBP
  "lbp-acute-mechanical": [
    {
      imaging_option_id: "no-imaging",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "Acute mechanical LBP without red flags resolves in 90% of cases within 6 weeks. Imaging does not improve outcomes and may lead to unnecessary interventions.",
    },
    {
      imaging_option_id: "xray-lumbar",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "X-rays do not change management in acute mechanical LBP without red flags. Degenerative findings are common and non-specific.",
    },
    {
      imaging_option_id: "mri-lumbar-nc",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "MRI is not indicated for acute LBP without red flags. Incidental findings may lead to unnecessary interventions.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "CT exposes patient to significant radiation without clinical benefit in this scenario.",
    },
  ],

  // Case 2: LBP with Red Flags
  "lbp-red-flags-neuro": [
    {
      imaging_option_id: "mri-lumbar-nc",
      acr_rating: 9,
      rating_category: "usually-appropriate",
      rationale:
        "MRI is the gold standard for evaluating suspected cord compression, metastatic disease, and cauda equina syndrome. EMERGENT imaging indicated.",
    },
    {
      imaging_option_id: "mri-lumbar-c",
      acr_rating: 8,
      rating_category: "usually-appropriate",
      rationale:
        "Contrast-enhanced MRI provides additional information about tumor enhancement and can help differentiate metastases from other lesions.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-c",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "CT can identify bony lesions but is inferior to MRI for soft tissue and cord evaluation. May be used if MRI is contraindicated.",
    },
    {
      imaging_option_id: "xray-lumbar",
      acr_rating: 3,
      rating_category: "usually-not-appropriate",
      rationale:
        "X-ray is insensitive for early metastatic disease and cannot evaluate the spinal cord or soft tissues.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "With red flags present including cancer history and neurological deficits, imaging is mandatory and should be emergent.",
    },
  ],

  // Case 3: Chronic LBP
  "lbp-chronic-failed-conservative": [
    {
      imaging_option_id: "mri-lumbar-nc",
      acr_rating: 8,
      rating_category: "usually-appropriate",
      rationale:
        "MRI is appropriate for chronic LBP (>6-12 weeks) with failed conservative therapy to evaluate for disc disease, stenosis, or other treatable pathology.",
    },
    {
      imaging_option_id: "xray-lumbar",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "X-ray may show degenerative changes and alignment but cannot assess disc disease or neural elements.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "CT provides good bony detail but is inferior to MRI for disc and soft tissue evaluation.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 3,
      rating_category: "usually-not-appropriate",
      rationale:
        "After adequate conservative therapy fails, imaging is now appropriate to guide further management.",
    },
  ],

  // Case 4: Radiculopathy
  "lbp-radiculopathy-acute": [
    {
      imaging_option_id: "no-imaging",
      acr_rating: 8,
      rating_category: "usually-appropriate",
      rationale:
        "Acute radiculopathy without severe deficits or red flags should initially be managed conservatively. 70-80% improve within 6-12 weeks.",
    },
    {
      imaging_option_id: "mri-lumbar-nc",
      acr_rating: 4,
      rating_category: "may-be-appropriate",
      rationale:
        "MRI would be appropriate if symptoms persist beyond 6 weeks or if neurological status worsens, but is not indicated initially.",
    },
    {
      imaging_option_id: "xray-lumbar",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "X-ray cannot evaluate disc herniation or neural compression and does not change initial management.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 2,
      rating_category: "usually-not-appropriate",
      rationale:
        "CT is not appropriate initial imaging for uncomplicated radiculopathy.",
    },
  ],

  // Case 5: Compression Fracture
  "lbp-compression-fracture": [
    {
      imaging_option_id: "xray-lumbar",
      acr_rating: 8,
      rating_category: "usually-appropriate",
      rationale:
        "X-ray is the appropriate first-line imaging for suspected vertebral compression fracture. Can identify fracture and assess vertebral height loss.",
    },
    {
      imaging_option_id: "mri-lumbar-nc",
      acr_rating: 7,
      rating_category: "usually-appropriate",
      rationale:
        "MRI is excellent for determining fracture acuity (STIR edema) and ruling out cord compression. Consider if X-ray positive or neurological symptoms.",
    },
    {
      imaging_option_id: "ct-abd-pelvis-nc",
      acr_rating: 5,
      rating_category: "may-be-appropriate",
      rationale:
        "CT provides excellent bony detail and can characterize fracture pattern, but involves more radiation and cannot assess acuity.",
    },
    {
      imaging_option_id: "no-imaging",
      acr_rating: 1,
      rating_category: "usually-not-appropriate",
      rationale:
        "Elderly patient with osteoporosis, trauma, and point tenderness has high probability of fracture. Imaging is indicated.",
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a case by ID
 */
export function getLBPCaseById(id: string): Case | undefined {
  return lowBackPainCases.find((c) => c.id === id);
}

/**
 * Get a case by slug
 */
export function getLBPCaseBySlug(slug: string): Case | undefined {
  return lowBackPainCases.find((c) => c.slug === slug);
}

/**
 * Get imaging ratings for a case
 */
export function getLBPImagingRatings(
  caseId: string
): typeof lowBackPainImagingRatings[keyof typeof lowBackPainImagingRatings] | undefined {
  return lowBackPainImagingRatings[caseId as keyof typeof lowBackPainImagingRatings];
}

/**
 * Get cases by difficulty
 */
export function getLBPCasesByDifficulty(difficulty: DifficultyLevel): Case[] {
  return lowBackPainCases.filter((c) => c.difficulty === difficulty);
}
