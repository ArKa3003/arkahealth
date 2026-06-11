/**
 * AIIE evidence registry entries — head, face & neck scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Head, face & neck evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const HEAD_FACE_NECK_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "head-face-neck-neck-mass-adult-persistent",
    region: "head_face_neck",
    title: "Persistent adult neck mass — ultrasound-first characterization",
    summary:
      "An adult neck mass persisting beyond two weeks is malignant until proven otherwise, but the initial imaging study is usually ultrasound (with FNA as indicated) or contrast-enhanced CT rather than empiric advanced imaging. The AAO-HNS guideline frames a standardized escalation pathway.",
    clinicalBottomLine:
      "Persistent adult neck masses need targeted imaging — ultrasound or contrast-enhanced CT of the neck — and should not be observed without workup.",
    keyPoints: [
      "A neck mass persisting >2 weeks in an adult warrants evaluation for malignancy.",
      "Ultrasound characterizes cystic versus solid disease and guides FNA biopsy.",
      "Contrast-enhanced CT maps deep extent and nodal basins before biopsy or referral.",
    ],
    citations: [CIT.aaoNeckMass, CIT.acrAc],
    relatedSlugs: [
      "head-face-neck-neck-mass-adult-with-red-flags",
      "head-face-neck-thyroid-nodule-initial-characterization",
    ],
  }),
  defineEntry({
    slug: "head-face-neck-neck-mass-adult-with-red-flags",
    region: "head_face_neck",
    title: "Adult neck mass with red flags — expedited cross-sectional imaging",
    summary:
      "Neck masses with fixation, rapid growth, associated otalgia, dysphagia, weight loss, or smoking history carry a high probability of head and neck cancer. Contrast-enhanced CT plus prompt specialist referral is the expedited pathway.",
    clinicalBottomLine:
      "Red-flag neck masses get contrast-enhanced CT of the neck and urgent otolaryngology referral — do not delay for a trial of antibiotics.",
    keyPoints: [
      "Constitutional symptoms or fixation shift the differential decisively toward malignancy.",
      "Contrast-enhanced CT is the workhorse for primary site and nodal staging.",
      "Empiric antibiotics without follow-up are a common source of diagnostic delay.",
    ],
    citations: [CIT.aaoNeckMass, CIT.acrAc],
    relatedSlugs: ["head-face-neck-neck-mass-adult-persistent", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "head-face-neck-sinusitis-complicated-orbital",
    region: "head_face_neck",
    title: "Complicated sinusitis with orbital or intracranial signs — CT now",
    summary:
      "Sinusitis with proptosis, ophthalmoplegia, vision change, severe headache, or neurologic findings signals orbital or intracranial extension. Contrast-enhanced CT of the sinuses and orbits is obtained emergently; MRI adds sensitivity for intracranial complications.",
    clinicalBottomLine:
      "Suspected orbital or intracranial complication of sinusitis is an emergency — contrast-enhanced CT immediately, MRI for intracranial extension.",
    keyPoints: [
      "Orbital cellulitis and subperiosteal abscess require same-day surgical assessment.",
      "Contrast CT distinguishes preseptal from postseptal disease and maps abscesses.",
      "MRI with contrast is most sensitive for cavernous sinus thrombosis and empyema.",
    ],
    citations: [CIT.idsaSinusitis, CIT.aaoSinusitis, CIT.acrAc],
    relatedSlugs: ["head-face-neck-sinusitis-uncomplicated", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "head-face-neck-sinusitis-uncomplicated",
    region: "head_face_neck",
    title: "Uncomplicated acute sinusitis — no imaging",
    summary:
      "Acute uncomplicated rhinosinusitis is a clinical diagnosis. Imaging cannot distinguish viral from bacterial disease, and both IDSA and AAO-HNS guidelines recommend against radiographs or CT in the absence of complications or diagnostic uncertainty about mimics.",
    clinicalBottomLine:
      "Do not image uncomplicated acute sinusitis — diagnose clinically and image only for suspected complications or recurrent/chronic disease being staged for surgery.",
    keyPoints: [
      "Mucosal thickening on CT is common in asymptomatic adults and is non-specific.",
      "Guidelines reserve CT for complications, immunocompromise, or pre-surgical planning.",
      "Symptom duration and pattern (double-worsening) guide antibiotic decisions, not imaging.",
    ],
    citations: [CIT.aaoSinusitis, CIT.idsaSinusitis, CIT.acrAc],
    relatedSlugs: ["head-face-neck-sinusitis-complicated-orbital", "conservative-care-before-imaging"],
  }),
  defineEntry({
    slug: "head-face-neck-thyroid-nodule-initial-characterization",
    region: "head_face_neck",
    title: "Thyroid nodule — ultrasound with TI-RADS risk stratification",
    summary:
      "Dedicated thyroid ultrasound is the universal first study for a palpable or incidentally detected thyroid nodule. ACR TI-RADS and ATA sonographic patterns stratify malignancy risk and set size thresholds for FNA, avoiding biopsy of low-risk nodules.",
    clinicalBottomLine:
      "Characterize every thyroid nodule with ultrasound and apply TI-RADS — FNA decisions follow sonographic risk, not nodule presence alone.",
    keyPoints: [
      "Ultrasound features (composition, echogenicity, margins, echogenic foci) drive TI-RADS scoring.",
      "Most nodules are benign; TI-RADS substantially reduces unnecessary biopsies.",
      "CT/MRI are reserved for substernal extension or locoregional staging of known cancer.",
    ],
    citations: [CIT.tirads, CIT.ataThyroid, CIT.acrAc],
    relatedSlugs: ["head-face-neck-neck-mass-adult-persistent"],
  }),
];
