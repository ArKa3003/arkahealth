/**
 * AIIE evidence registry entries — cervical, thoracic, and lumbar spine scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Spine evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const SPINE_ENTRIES: EvidenceEntry[] = [
  // Cervical
  defineEntry({
    slug: "spine-cervical-neck-pain-myelopathy-signs",
    region: "spine_cervical",
    title: "Neck pain with myelopathy signs — MRI without delay",
    summary:
      "Gait disturbance, hand clumsiness, hyperreflexia, or sphincter change with neck pain suggests degenerative cervical myelopathy or cord compression. MRI of the cervical spine is the definitive study and should not be deferred for a trial of conservative care.",
    clinicalBottomLine:
      "Objective myelopathic signs mandate cervical spine MRI promptly — surgical-candidacy decisions depend on cord signal and compression severity.",
    keyPoints: [
      "Degenerative cervical myelopathy is progressive; delayed diagnosis worsens surgical outcomes.",
      "MRI defines cord compression, signal change, and levels for decompression.",
      "CT myelography is the alternative when MRI is contraindicated.",
    ],
    citations: [CIT.aoMyelopathy, CIT.acrAc],
    relatedSlugs: ["spine-cervical-neck-pain-uncomplicated", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "spine-cervical-neck-pain-trauma-high-risk",
    region: "spine_cervical",
    title: "Cervical spine trauma, high risk — CT first",
    summary:
      "Trauma patients with high-risk features under the Canadian C-Spine Rule or who cannot be clinically cleared (NEXUS-positive) require imaging, and multidetector CT has replaced radiographs as the initial study in high-risk adults.",
    clinicalBottomLine:
      "High-risk or non-clearable cervical trauma gets CT of the cervical spine; plain films are inadequate in this group.",
    keyPoints: [
      "Canadian C-Spine high-risk factors: age ≥65, dangerous mechanism, extremity paresthesias.",
      "CT sensitivity for clinically significant fracture far exceeds radiographs in adults.",
      "MRI is added for neurologic deficit or suspected ligamentous/cord injury.",
    ],
    citations: [CIT.canadianCSpine, CIT.nexus, CIT.acrAc],
    relatedSlugs: ["spine-cervical-neck-pain-trauma-low-risk", "spine-cervical-neck-pain-myelopathy-signs"],
  }),
  defineEntry({
    slug: "spine-cervical-neck-pain-trauma-low-risk",
    region: "spine_cervical",
    title: "Cervical spine trauma, low risk — clinical clearance without imaging",
    summary:
      "Alert, stable trauma patients who satisfy the Canadian C-Spine Rule or NEXUS low-risk criteria can be cleared clinically. Imaging in rule-negative patients adds radiation and cost with essentially no diagnostic yield.",
    clinicalBottomLine:
      "Rule-negative patients (Canadian C-Spine or NEXUS) need no cervical imaging — clear clinically and document range of motion.",
    keyPoints: [
      "Both rules have sensitivity above 99% for clinically important injury.",
      "Active 45-degree rotation completes clearance under the Canadian rule.",
      "Imaging rates fall substantially with structured rule application, without missed injuries.",
    ],
    citations: [CIT.canadianCSpine, CIT.nexus],
    relatedSlugs: ["spine-cervical-neck-pain-trauma-high-risk"],
  }),
  defineEntry({
    slug: "spine-cervical-neck-pain-uncomplicated",
    region: "spine_cervical",
    title: "Uncomplicated neck pain — conservative care before imaging",
    summary:
      "Atraumatic neck pain without neurologic deficit or red flags is overwhelmingly degenerative or muscular and improves with conservative management. Early imaging frequently reveals incidental degenerative change that correlates poorly with symptoms.",
    clinicalBottomLine:
      "Defer imaging for uncomplicated neck pain; reserve MRI for persistent radiculopathy, myelopathic signs, or red flags after a conservative trial.",
    keyPoints: [
      "Degenerative findings on cervical MRI are near-universal with age and often asymptomatic.",
      "A 4–6 week conservative trial is appropriate before imaging persistent radicular pain.",
      "Red flags (cancer history, fever, IV drug use, progressive deficit) bypass the waiting period.",
    ],
    citations: [CIT.acrAc, CIT.cochraneRedFlags],
    relatedSlugs: ["spine-cervical-neck-pain-myelopathy-signs", "conservative-care-before-imaging"],
  }),

  // Thoracic
  defineEntry({
    slug: "spine-thoracic-thoracic-back-pain-post-trauma",
    region: "spine_thoracic",
    title: "Thoracic back pain after trauma — image for fracture",
    summary:
      "Significant mechanism, midline tenderness, or osteoporosis after thoracic trauma warrants imaging for vertebral fracture. CT is preferred for high-energy mechanisms; radiographs may suffice in low-energy presentations with low suspicion of instability.",
    clinicalBottomLine:
      "Image post-traumatic thoracic back pain — CT for high-energy or neurologically symptomatic injuries, radiographs for selected low-energy cases.",
    keyPoints: [
      "Thoracolumbar junction fractures are easily missed clinically in distracted or polytrauma patients.",
      "CT defines fracture morphology and stability classification.",
      "MRI is added for neurologic deficit or suspected posterior ligamentous complex injury.",
    ],
    citations: [CIT.acrAc, CIT.randUcla],
    relatedSlugs: ["spine-thoracic-thoracic-back-pain-red-flags", "spine-lumbar-low-back-pain-post-trauma"],
  }),
  defineEntry({
    slug: "spine-thoracic-thoracic-back-pain-red-flags",
    region: "spine_thoracic",
    title: "Thoracic back pain with red flags — MRI-led workup",
    summary:
      "Thoracic pain with cancer history, fever, immunosuppression, or progressive neurologic signs raises metastasis, infection, or cord compression — diagnoses where the thoracic cord's vulnerability makes delay costly. Contrast-enhanced MRI is the study of choice.",
    clinicalBottomLine:
      "Red-flag thoracic back pain goes straight to MRI (with contrast for suspected infection or malignancy) — the thoracic cord tolerates little delay.",
    keyPoints: [
      "The thoracic spine is the most common site of metastatic epidural cord compression.",
      "MRI with contrast distinguishes infection, neoplasm, and degenerative disease.",
      "New thoracic pain in known malignancy is cord compression until excluded.",
    ],
    citations: [CIT.cochraneRedFlags, CIT.acrAc],
    relatedSlugs: ["spine-lumbar-low-back-pain-cancer-history", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "spine-thoracic-thoracic-back-pain-uncomplicated",
    region: "spine_thoracic",
    title: "Uncomplicated thoracic back pain — no initial imaging",
    summary:
      "Mechanical thoracic back pain without trauma, red flags, or neurologic findings rarely reflects serious pathology. As with the lumbar spine, early imaging does not improve outcomes and frequently uncovers incidental degenerative findings.",
    clinicalBottomLine:
      "Manage uncomplicated thoracic back pain conservatively without imaging; escalate only for red flags, trauma, or persistent symptoms.",
    keyPoints: [
      "Serious causes of thoracic pain are reliably flagged by history (cancer, fever, trauma, deficit).",
      "Conservative care for 4–6 weeks is the first-line strategy.",
      "Unexplained persistent thoracic pain has a lower threshold for MRI than lumbar pain given the cord at this level.",
    ],
    citations: [CIT.acpLbp, CIT.acrAc],
    relatedSlugs: ["spine-thoracic-thoracic-back-pain-red-flags", "conservative-care-before-imaging"],
  }),

  // Lumbar
  defineEntry({
    slug: "spine-lumbar-low-back-pain-cancer-history",
    region: "spine_lumbar",
    title: "Low back pain with cancer history — MRI for metastatic disease",
    summary:
      "A history of malignancy is the single strongest red flag for vertebral metastasis in low back pain. MRI of the spine (with contrast as indicated) is the appropriate first study, bypassing the conservative-care waiting period applied to uncomplicated pain.",
    clinicalBottomLine:
      "Back pain plus cancer history warrants prompt MRI — do not apply the 6-week conservative-care delay to this group.",
    keyPoints: [
      "Prior malignancy raises the post-test probability of metastasis more than any other single red flag.",
      "MRI is the most sensitive modality for marrow replacement and epidural extension.",
      "New neurologic deficit in this setting is an oncologic emergency (cord compression).",
    ],
    citations: [CIT.cochraneRedFlags, CIT.chouLbpImaging, CIT.acrAc],
    relatedSlugs: ["spine-lumbar-low-back-pain-cauda-equina", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "spine-lumbar-low-back-pain-cauda-equina",
    region: "spine_lumbar",
    title: "Suspected cauda equina syndrome — emergent MRI",
    summary:
      "Saddle anesthesia, urinary retention or incontinence, bilateral leg weakness, or new sphincter dysfunction with back pain constitutes suspected cauda equina syndrome — a surgical emergency where decompression timing determines continence and motor outcomes.",
    clinicalBottomLine:
      "EXPEDITE: suspected cauda equina syndrome requires emergent lumbar MRI and same-day surgical consultation.",
    keyPoints: [
      "Outcomes deteriorate sharply when decompression is delayed beyond 24–48 hours.",
      "MRI is the only adequate study; CT cannot exclude the diagnosis.",
      "Post-void residual measurement supports, but must not delay, imaging.",
    ],
    citations: [CIT.chouLbpImaging, CIT.acrAc, CIT.lancetLbp],
    relatedSlugs: ["spine-lumbar-low-back-pain-cancer-history", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "spine-lumbar-low-back-pain-infection-ivdu",
    region: "spine_lumbar",
    title: "Back pain with infection risk (fever, IVDU) — contrast MRI",
    summary:
      "Fever, intravenous drug use, recent bacteremia, or immunosuppression with back pain raises vertebral osteomyelitis, discitis, or epidural abscess. Contrast-enhanced MRI is the definitive study and should be obtained promptly alongside inflammatory markers and blood cultures.",
    clinicalBottomLine:
      "Suspected spinal infection requires MRI with contrast urgently — epidural abscess with deficit is a surgical emergency.",
    keyPoints: [
      "Spinal epidural abscess is frequently misdiagnosed at first presentation; a high index of suspicion is essential.",
      "MRI with gadolinium distinguishes discitis-osteomyelitis from degenerative endplate change.",
      "ESR/CRP are sensitive screens that complement, not replace, imaging.",
    ],
    citations: [CIT.cochraneRedFlags, CIT.acrAc],
    relatedSlugs: ["spine-lumbar-low-back-pain-cauda-equina", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "spine-lumbar-low-back-pain-osteoporosis-fragility",
    region: "spine_lumbar",
    title: "Back pain with osteoporosis or fragility risk — radiographs first",
    summary:
      "Acute back pain in patients with osteoporosis, chronic steroid use, or age-related fracture risk warrants imaging for vertebral compression fracture. Radiographs are an appropriate first study; MRI distinguishes acute from chronic fractures and excludes malignant collapse.",
    clinicalBottomLine:
      "Image suspected fragility fracture — radiographs first, MRI for acuity assessment, treatment planning, or suspicion of pathologic fracture.",
    keyPoints: [
      "Compression fractures are common with minimal trauma in osteoporotic patients.",
      "Marrow edema on MRI identifies acute fractures that may benefit from intervention.",
      "An incident vertebral fracture should trigger bone-health evaluation (DXA, secondary causes).",
    ],
    citations: [CIT.acrAc, CIT.cochraneRedFlags],
    relatedSlugs: ["spine-lumbar-low-back-pain-post-trauma", "spine-thoracic-thoracic-back-pain-uncomplicated"],
  }),
  defineEntry({
    slug: "spine-lumbar-low-back-pain-post-trauma",
    region: "spine_lumbar",
    title: "Low back pain after significant trauma — image for fracture",
    summary:
      "High-energy mechanism, midline bony tenderness, or neurologic findings after lumbar trauma warrant imaging. CT is preferred for high-energy injuries; MRI is added for deficit or suspected ligamentous injury.",
    clinicalBottomLine:
      "Post-traumatic low back pain with significant mechanism or exam findings warrants CT; add MRI for neurologic compromise.",
    keyPoints: [
      "Low-energy falls in older or osteoporotic patients still justify imaging for fracture.",
      "CT characterizes fracture stability better than radiographs.",
      "Neurologic deficit after trauma adds MRI to the pathway, not in place of CT.",
    ],
    citations: [CIT.acrAc, CIT.randUcla],
    relatedSlugs: ["spine-lumbar-low-back-pain-osteoporosis-fragility", "spine-thoracic-thoracic-back-pain-post-trauma"],
  }),
  defineEntry({
    slug: "spine-lumbar-low-back-pain-radiculopathy-over-6wk",
    region: "spine_lumbar",
    title: "Persistent radiculopathy beyond 6 weeks — MRI when intervention considered",
    summary:
      "Radicular low back pain that fails 6 weeks of guideline-based conservative care is an appropriate indication for lumbar MRI — provided the result will inform a decision about epidural injection or surgery. Imaging without an interventional question rarely changes management.",
    clinicalBottomLine:
      "MRI persistent (>6 week) radiculopathy when the patient is a candidate for injection or surgery; otherwise continue conservative care.",
    keyPoints: [
      "Most disc herniations causing radiculopathy improve substantially without intervention.",
      "MRI findings must be correlated with the clinical level — asymptomatic herniations are common.",
      "Progressive motor deficit at any time bypasses the 6-week threshold.",
    ],
    citations: [CIT.acpLbp, CIT.chouLbpImaging, CIT.lancetLbp],
    relatedSlugs: ["spine-lumbar-low-back-pain-uncomplicated-under-6wk", "conservative-care-before-imaging"],
  }),
  defineEntry({
    slug: "spine-lumbar-low-back-pain-uncomplicated-under-6wk",
    region: "spine_lumbar",
    title: "Acute uncomplicated low back pain — no imaging under 6 weeks",
    summary:
      "Acute low back pain without red flags is the canonical low-value imaging scenario: systematic reviews show no outcome benefit from early imaging, and ACP guidelines recommend nonpharmacologic first-line care. Most episodes improve substantially within six weeks.",
    clinicalBottomLine:
      "Do not image acute uncomplicated low back pain in the first 6 weeks — treat conservatively and reassess.",
    keyPoints: [
      "Randomized data show early imaging for uncomplicated LBP does not improve pain or function.",
      "Incidental degenerative findings are nearly universal and can anchor patients to a structural narrative.",
      "Red flags (cancer, infection risk, cauda equina, fracture risk) define the exceptions.",
    ],
    citations: [CIT.acpLbp, CIT.chouLbpImaging, CIT.lancetLbp],
    relatedSlugs: [
      "spine-lumbar-low-back-pain-radiculopathy-over-6wk",
      "conservative-care-before-imaging",
      "red-flag-symptoms",
    ],
  }),
];
