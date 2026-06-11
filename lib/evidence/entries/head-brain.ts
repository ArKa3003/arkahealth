/**
 * AIIE evidence registry entries — head / brain scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Head / brain evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const HEAD_BRAIN_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "head-brain-acute-headache-chronic-stable",
    region: "head_brain",
    title: "Chronic stable headache — imaging rarely indicated",
    summary:
      "Chronic headache with a stable pattern, normal neurologic examination, and no red flags has a very low yield for significant intracranial pathology on neuroimaging. Routine CT or MRI in this population adds cost and incidental findings without changing management.",
    clinicalBottomLine:
      "Do not image chronic stable headache with a normal neurologic exam; reassess only if the pattern changes or red flags emerge.",
    keyPoints: [
      "Significant abnormality rates on imaging for chronic stable primary headache approximate the asymptomatic background rate.",
      "A change in headache pattern, new neurologic deficit, or systemic features should prompt re-evaluation for imaging.",
      "MRI is preferred over CT when imaging is genuinely indicated for non-acute headache (no ionizing radiation, better posterior fossa detail).",
    ],
    citations: [CIT.acepHeadache, CIT.acrAc],
    relatedSlugs: [
      "head-brain-acute-headache-new-over-50",
      "head-brain-acute-headache-thunderclap",
      "red-flag-symptoms",
    ],
  }),
  defineEntry({
    slug: "head-brain-acute-headache-fever-immunocompromised",
    region: "head_brain",
    title: "Headache with fever or immunocompromise — urgent imaging pathway",
    summary:
      "Headache accompanied by fever, meningeal signs, or an immunocompromised state raises concern for CNS infection, abscess, or opportunistic disease. Contrast-enhanced imaging is usually appropriate, and CT before lumbar puncture is indicated when mass effect is suspected.",
    clinicalBottomLine:
      "Image urgently (CT, then MRI with contrast as needed) for headache with fever, meningeal signs, or immunocompromise before or alongside CSF sampling.",
    keyPoints: [
      "Immunocompromised hosts have a materially higher pre-test probability of abscess, toxoplasmosis, and fungal disease.",
      "CT prior to lumbar puncture is recommended for patients with focal deficit, papilledema, or altered mental status.",
      "MRI with contrast is the most sensitive study for meningeal and parenchymal infection once the patient is stabilized.",
    ],
    citations: [CIT.acepHeadache, CIT.acrAc],
    relatedSlugs: [
      "head-brain-acute-headache-neuro-deficit",
      "head-brain-acute-headache-thunderclap",
      "red-flag-symptoms",
    ],
  }),
  defineEntry({
    slug: "head-brain-acute-headache-neuro-deficit",
    region: "head_brain",
    title: "Headache with new neurologic deficit — image without delay",
    summary:
      "A new focal neurologic deficit accompanying headache changes the differential to stroke, mass lesion, or hemorrhage and warrants prompt neuroimaging. Non-contrast CT answers the immediate hemorrhage question; MRI better characterizes ischemia and masses.",
    clinicalBottomLine:
      "New focal deficit with headache is an absolute indication for urgent neuroimaging — start with non-contrast CT, escalate to MRI as indicated.",
    keyPoints: [
      "Focal deficit is among the strongest predictors of actionable intracranial pathology in headache cohorts.",
      "Non-contrast head CT rapidly excludes hemorrhage and large mass effect in the acute window.",
      "MRI with and without contrast follows when CT is non-diagnostic and suspicion persists.",
    ],
    citations: [CIT.acepHeadache, CIT.ahaStroke, CIT.acrAc],
    relatedSlugs: [
      "head-brain-suspected-stroke-acute-under-4-5h",
      "head-brain-acute-headache-thunderclap",
      "red-flag-symptoms",
    ],
  }),
  defineEntry({
    slug: "head-brain-acute-headache-new-over-50",
    region: "head_brain",
    title: "New headache after age 50 — lowered imaging threshold",
    summary:
      "A genuinely new or changed headache beginning after age 50 carries a higher probability of secondary cause, including neoplasm and giant cell arteritis. Guidelines lower the imaging threshold in this group relative to younger adults with primary headache syndromes.",
    clinicalBottomLine:
      "New-onset headache over age 50 merits neuroimaging (MRI preferred non-acutely) plus ESR/CRP when giant cell arteritis is plausible.",
    keyPoints: [
      "Age over 50 with new headache is a classic secondary-headache red flag across guidelines.",
      "MRI is preferred for non-emergent workup; CT is reserved for acute presentations.",
      "Evaluate concurrently for giant cell arteritis when temporal tenderness, jaw claudication, or visual symptoms are present.",
    ],
    citations: [CIT.acepHeadache, CIT.acrAc],
    relatedSlugs: [
      "head-brain-acute-headache-chronic-stable",
      "head-brain-acute-headache-neuro-deficit",
      "red-flag-symptoms",
    ],
  }),
  defineEntry({
    slug: "head-brain-acute-headache-post-trauma-gcs-15-low-risk",
    region: "head_brain",
    title: "Post-traumatic headache, GCS 15, low risk — CT often avoidable",
    summary:
      "After minor head trauma with GCS 15 and no high-risk features, validated decision rules (Canadian CT Head Rule, New Orleans Criteria) identify patients in whom CT can be safely omitted. Imaging decisions should be rule-based rather than reflexive.",
    clinicalBottomLine:
      "Apply the Canadian CT Head Rule; GCS 15 patients without rule-positive features do not need CT for post-traumatic headache alone.",
    keyPoints: [
      "The Canadian CT Head Rule has near-perfect sensitivity for injuries requiring neurosurgical intervention.",
      "Headache alone after minor trauma, without vomiting, age ≥65, or dangerous mechanism, does not mandate CT.",
      "Observation with return precautions is the evidence-based alternative to immediate imaging.",
    ],
    citations: [CIT.canadianCtHead, CIT.newOrleans, CIT.acrAc],
    relatedSlugs: [
      "head-brain-head-trauma-adult-low-risk",
      "head-brain-acute-headache-post-trauma-gcs-under-15",
    ],
  }),
  defineEntry({
    slug: "head-brain-acute-headache-post-trauma-gcs-under-15",
    region: "head_brain",
    title: "Post-traumatic headache with GCS <15 — immediate CT",
    summary:
      "Any depressed level of consciousness after head trauma is a high-risk feature in every validated decision rule. Non-contrast head CT should be obtained immediately to exclude hemorrhage, contusion, and mass effect.",
    clinicalBottomLine:
      "GCS below 15 after head trauma mandates immediate non-contrast head CT — decision rules do not apply as rule-out tools here.",
    keyPoints: [
      "GCS <15 at two hours post-injury is a high-risk criterion in the Canadian CT Head Rule.",
      "CT is the modality of choice acutely: fast, widely available, and highly sensitive for hemorrhage.",
      "Neurosurgical consultation and repeat imaging are driven by initial CT findings and clinical trajectory.",
    ],
    citations: [CIT.canadianCtHead, CIT.acrAc],
    relatedSlugs: [
      "head-brain-head-trauma-adult-high-risk",
      "head-brain-acute-headache-post-trauma-gcs-15-low-risk",
    ],
  }),
  defineEntry({
    slug: "head-brain-acute-headache-thunderclap",
    region: "head_brain",
    title: "Thunderclap headache — emergent subarachnoid hemorrhage workup",
    summary:
      "Headache reaching maximal intensity within a minute is subarachnoid hemorrhage until proven otherwise. Non-contrast CT within six hours of onset is highly sensitive; the Ottawa SAH rule supports structured risk assessment, and CTA evaluates for aneurysm when hemorrhage is confirmed or suspicion persists.",
    clinicalBottomLine:
      "Treat thunderclap headache as an emergency: immediate non-contrast head CT, then LP or CTA when CT is negative beyond the early window.",
    keyPoints: [
      "Modern CT within 6 hours of onset approaches 100% sensitivity for aneurysmal SAH in neurologically intact patients.",
      "The Ottawa SAH rule is a highly sensitive screen for which acute headaches need workup.",
      "CTA follows positive CT or persistent suspicion to identify the culprit aneurysm.",
    ],
    citations: [CIT.ottawaSah, CIT.acepHeadache, CIT.acrAc],
    relatedSlugs: [
      "head-brain-acute-headache-neuro-deficit",
      "head-brain-suspected-stroke-acute-under-4-5h",
      "red-flag-symptoms",
    ],
  }),
  defineEntry({
    slug: "head-brain-head-trauma-adult-high-risk",
    region: "head_brain",
    title: "Adult head trauma, high risk — non-contrast CT indicated",
    summary:
      "Adults with head trauma and any high-risk feature — GCS <15, suspected open or depressed skull fracture, signs of basilar skull fracture, repeated vomiting, age ≥65, or dangerous mechanism — require non-contrast head CT per the Canadian CT Head Rule.",
    clinicalBottomLine:
      "Any Canadian CT Head Rule high-risk feature after adult head trauma indicates immediate non-contrast CT.",
    keyPoints: [
      "High-risk criteria predict need for neurosurgical intervention with very high sensitivity.",
      "CT without contrast is the first-line study; MRI plays no role in the initial triage of acute trauma.",
      "Anticoagulated patients fall outside the rule's derivation and generally warrant imaging.",
    ],
    citations: [CIT.canadianCtHead, CIT.newOrleans, CIT.acrAc],
    relatedSlugs: [
      "head-brain-head-trauma-adult-low-risk",
      "head-brain-acute-headache-post-trauma-gcs-under-15",
    ],
  }),
  defineEntry({
    slug: "head-brain-head-trauma-adult-low-risk",
    region: "head_brain",
    title: "Adult head trauma, low risk — CT safely avoided",
    summary:
      "Alert adults with minor head injury and no Canadian CT Head Rule criteria have a negligible risk of injury requiring intervention. Discharge with observation instructions is the guideline-supported pathway, avoiding radiation and incidental findings.",
    clinicalBottomLine:
      "No rule-positive features after minor adult head trauma → no CT; provide structured return precautions instead.",
    keyPoints: [
      "Decision-rule-negative patients have <1% incidence of clinically important brain injury.",
      "Routine CT in low-risk trauma drives cost and incidental findings without outcome benefit.",
      "Re-image promptly for deterioration, persistent vomiting, or new focal signs.",
    ],
    citations: [CIT.canadianCtHead, CIT.acrAc],
    relatedSlugs: [
      "head-brain-head-trauma-adult-high-risk",
      "head-brain-acute-headache-post-trauma-gcs-15-low-risk",
    ],
  }),
  defineEntry({
    slug: "head-brain-head-trauma-pediatric-2-to-18",
    region: "head_brain",
    title: "Pediatric head trauma (2–18 years) — PECARN-guided CT decisions",
    summary:
      "For children 2 years and older with minor head trauma, the PECARN rules stratify the risk of clinically important traumatic brain injury. CT is reserved for high-risk children; intermediate-risk children are candidates for observation before imaging.",
    clinicalBottomLine:
      "Apply PECARN: image high-risk children, observe intermediate-risk children, and avoid CT in rule-negative children.",
    keyPoints: [
      "PECARN identifies children at <0.05% risk of important TBI in whom CT can be omitted.",
      "Observation for 4–6 hours is an evidence-based alternative for intermediate-risk presentations.",
      "Each avoided pediatric CT eliminates a measurable lifetime radiation-attributable cancer risk.",
    ],
    citations: [CIT.pecarn, CIT.pearceCt, CIT.imageGently],
    relatedSlugs: [
      "head-brain-head-trauma-pediatric-under-2",
      "head-brain-head-trauma-pediatric-low-risk",
      "pediatric-imaging-radiation-safety",
    ],
  }),
  defineEntry({
    slug: "head-brain-head-trauma-pediatric-low-risk",
    region: "head_brain",
    title: "Pediatric head trauma, PECARN low risk — no CT",
    summary:
      "Children who are PECARN rule-negative have a vanishingly small risk of clinically important traumatic brain injury. CT should be avoided in this group given the elevated radiosensitivity of pediatric patients.",
    clinicalBottomLine:
      "PECARN-negative children should not undergo head CT; discharge with caregiver observation guidance.",
    keyPoints: [
      "Rule-negative risk of clinically important TBI is approximately 1 in 2,000 or lower.",
      "Pediatric CT radiation carries a small but real leukemia and brain tumor risk that compounds with repeat scans.",
      "Caregiver instructions and re-presentation criteria are the safety net, not imaging.",
    ],
    citations: [CIT.pecarn, CIT.pearceCt, CIT.imageGently],
    relatedSlugs: [
      "head-brain-head-trauma-pediatric-2-to-18",
      "pediatric-imaging-radiation-safety",
    ],
  }),
  defineEntry({
    slug: "head-brain-head-trauma-pediatric-under-2",
    region: "head_brain",
    title: "Pediatric head trauma under 2 years — age-specific PECARN branch",
    summary:
      "Infants and toddlers under 2 use the dedicated PECARN algorithm branch with age-appropriate predictors (altered mental status, palpable skull fracture, scalp hematoma location, mechanism, behavior per caregiver). The threshold to observe rather than scan is calibrated to this group's higher radiation sensitivity.",
    clinicalBottomLine:
      "Use the under-2 PECARN branch: CT for high-risk findings, structured observation for intermediate risk, no imaging when rule-negative.",
    keyPoints: [
      "Non-frontal scalp hematoma, severe mechanism, and abnormal behavior drive risk in the under-2 branch.",
      "The youngest children carry the highest per-scan radiation-attributable risk.",
      "Consider non-accidental trauma whenever findings and history are discordant.",
    ],
    citations: [CIT.pecarn, CIT.imageGently, CIT.pearceCt],
    relatedSlugs: [
      "head-brain-head-trauma-pediatric-2-to-18",
      "pediatric-imaging-radiation-safety",
    ],
  }),
  defineEntry({
    slug: "head-brain-seizure-breakthrough",
    region: "head_brain",
    title: "Breakthrough seizure in known epilepsy — imaging usually unnecessary",
    summary:
      "A typical breakthrough seizure in a patient with established epilepsy who returns to baseline rarely requires emergent imaging. Imaging is indicated for new focal deficit, persistent altered mental status, trauma, or a change in seizure character.",
    clinicalBottomLine:
      "Do not routinely re-image typical breakthrough seizures with return to baseline; image for new deficits, trauma, or changed semiology.",
    keyPoints: [
      "Yield of emergent CT in baseline-returned breakthrough seizures is very low.",
      "Medication levels, adherence, and provocation factors are the primary workup.",
      "New focal features or failure to return to baseline shift the patient to the first-seizure pathway.",
    ],
    citations: [CIT.acepSeizure, CIT.acrAc],
    relatedSlugs: ["head-brain-seizure-first", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "head-brain-seizure-first",
    region: "head_brain",
    title: "First unprovoked seizure — neuroimaging indicated",
    summary:
      "Adults with a first unprovoked seizure warrant neuroimaging to identify structural causes, which are found in a meaningful minority and alter recurrence risk estimates and treatment decisions. Emergent CT screens for acute lesions; MRI is the definitive study.",
    clinicalBottomLine:
      "Obtain neuroimaging after a first unprovoked seizure — CT acutely if concern for an emergent lesion, MRI definitively.",
    keyPoints: [
      "Structural brain lesions are identified in roughly 10% of first-seizure presentations.",
      "Brain MRI with an epilepsy protocol is preferred for definitive evaluation.",
      "Imaging findings feed directly into AAN-framed recurrence risk and treatment counseling.",
    ],
    citations: [CIT.aanFirstSeizure, CIT.acepSeizure, CIT.acrAc],
    relatedSlugs: ["head-brain-seizure-breakthrough", "head-brain-acute-headache-neuro-deficit"],
  }),
  defineEntry({
    slug: "head-brain-suspected-stroke-acute-under-4-5h",
    region: "head_brain",
    title: "Suspected acute stroke within 4.5 hours — emergent CT pathway",
    summary:
      "Suspected stroke inside the thrombolysis window is a time-critical imaging emergency. Non-contrast CT excludes hemorrhage before thrombolysis, and CTA identifies large-vessel occlusion for thrombectomy triage; door-to-imaging targets are measured in minutes.",
    clinicalBottomLine:
      "EXPEDITE: immediate non-contrast head CT (plus CTA for LVO triage) — eligibility for alteplase within 4.5 hours depends on it.",
    keyPoints: [
      "Guidelines target imaging initiation within 20 minutes of arrival for suspected stroke.",
      "Non-contrast CT is the gatekeeper for IV thrombolysis (ECASS III extends the window to 4.5 hours).",
      "CTA of the head and neck triages large-vessel occlusion for endovascular therapy.",
    ],
    citations: [CIT.ahaStroke, CIT.ecass3, CIT.acrAc],
    relatedSlugs: [
      "head-brain-suspected-stroke-wake-up",
      "head-brain-suspected-stroke-tia",
      "head-brain-acute-headache-neuro-deficit",
    ],
  }),
  defineEntry({
    slug: "head-brain-suspected-stroke-tia",
    region: "head_brain",
    title: "Transient ischemic attack — urgent tissue-based workup",
    summary:
      "TIA is a tissue-based diagnosis requiring urgent imaging: MRI with diffusion-weighted sequences detects infarction in a substantial fraction of clinically transient events, and vascular imaging of the cervical and intracranial vessels identifies treatable stenosis.",
    clinicalBottomLine:
      "Image TIA urgently — DWI-MRI preferred within 24 hours plus carotid/intracranial vascular imaging to drive secondary prevention.",
    keyPoints: [
      "Up to a third of clinically-defined TIAs show infarction on DWI, reclassifying them as strokes.",
      "Early carotid imaging identifies symptomatic stenosis where intervention is most beneficial.",
      "Stroke risk is front-loaded in the days after TIA — workup speed matters.",
    ],
    citations: [CIT.tiaDefinition, CIT.ahaStroke, CIT.acrAc],
    relatedSlugs: [
      "head-brain-suspected-stroke-acute-under-4-5h",
      "vascular-carotid-stenosis-symptomatic",
    ],
  }),
  defineEntry({
    slug: "head-brain-suspected-stroke-wake-up",
    region: "head_brain",
    title: "Wake-up stroke — advanced imaging selects treatment candidates",
    summary:
      "Patients who wake with stroke symptoms have an unknown onset time, but advanced imaging can substitute for the clock: DWI-FLAIR mismatch selects thrombolysis candidates (WAKE-UP), and perfusion mismatch extends thrombectomy eligibility to 24 hours (DAWN).",
    clinicalBottomLine:
      "Unknown-onset stroke still gets emergent imaging — MRI mismatch or CT perfusion can qualify patients for reperfusion therapy.",
    keyPoints: [
      "DWI-positive / FLAIR-negative mismatch identifies strokes likely within the thrombolysis window.",
      "Clinical-core mismatch on perfusion imaging extends thrombectomy benefit to 6–24 hours.",
      "Initial non-contrast CT remains the immediate hemorrhage screen on arrival.",
    ],
    citations: [CIT.wakeUp, CIT.dawn, CIT.ahaStroke],
    relatedSlugs: [
      "head-brain-suspected-stroke-acute-under-4-5h",
      "head-brain-suspected-stroke-tia",
    ],
  }),
];
