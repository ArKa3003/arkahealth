/**
 * AIIE evidence registry entries — cross-cutting concept pages and engine
 * fallback slugs (linked from CLIN factor rows and ED red-flag chips).
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Cross-cutting evidence entries keyed by slug. */
export const GENERAL_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "red-flag-symptoms",
    region: "general",
    title: "Red-flag symptoms — when imaging thresholds drop",
    summary:
      "Red flags are history and exam findings — cancer history, fever with infection risk, new neurologic deficit, anticoagulation, constitutional symptoms — that raise the pre-test probability of serious pathology enough to bypass conservative-care waiting periods. They are sensitivity tools: most red-flag-positive patients still have benign disease, but their absence is what safely defers imaging.",
    clinicalBottomLine:
      "Red flags lower the imaging threshold and bypass watch-and-wait periods; their absence is the evidence basis for deferring imaging in uncomplicated presentations.",
    keyPoints: [
      "Individual red flags vary widely in predictive value — cancer history is among the strongest.",
      "Red flags work as a panel with clinical judgment, not as single mandatory triggers.",
      "Document red-flag status explicitly: it is the audit trail for both imaging and deferral decisions.",
    ],
    citations: [CIT.cochraneRedFlags, CIT.acpLbp, CIT.randUcla],
    relatedSlugs: [
      "spine-lumbar-low-back-pain-cancer-history",
      "head-brain-acute-headache-thunderclap",
      "conservative-care-before-imaging",
    ],
  }),
  defineEntry({
    slug: "conservative-care-before-imaging",
    region: "general",
    title: "Conservative care before imaging — the evidence for watchful waiting",
    summary:
      "For uncomplicated musculoskeletal and back pain presentations, randomized evidence shows early imaging does not improve pain, function, or satisfaction — while incidental findings anchor patients to structural narratives and drive intervention cascades. A documented conservative trial is the guideline-based first step.",
    clinicalBottomLine:
      "A documented 4–6 week conservative trial precedes advanced imaging for uncomplicated presentations; red flags and progressive deficits are the exceptions.",
    keyPoints: [
      "Early lumbar MRI for uncomplicated pain produces no outcome benefit in randomized comparisons.",
      "Incidental degenerative findings are near-universal with age and frequently mislabeled as the pain source.",
      "Payers and guidelines alike treat the documented conservative trial as the medical-necessity anchor.",
    ],
    citations: [CIT.chouLbpImaging, CIT.acpLbp, CIT.lancetLbp],
    relatedSlugs: [
      "spine-lumbar-low-back-pain-uncomplicated-under-6wk",
      "msk-lower-knee-pain-chronic-oa",
      "red-flag-symptoms",
    ],
  }),
  defineEntry({
    slug: "imaging-in-pregnancy",
    region: "general",
    title: "Imaging in pregnancy — modality selection and fetal safety",
    summary:
      "Ultrasound and MRI (without gadolinium) are the preferred modalities throughout pregnancy. Diagnostic X-ray and CT doses are generally below fetal harm thresholds, and a medically indicated study should never be withheld solely because of pregnancy — but a radiation-free alternative is preferred when diagnostically adequate.",
    clinicalBottomLine:
      "Prefer US and non-contrast MRI in pregnancy; perform a clearly indicated CT when alternatives are inadequate — diagnostic delay harms both patients.",
    keyPoints: [
      "ACOG: ultrasound and MRI are not associated with fetal risk when used appropriately.",
      "Gadolinium is avoided in pregnancy; iodinated contrast may be used when essential.",
      "Single diagnostic CT doses fall below deterministic fetal-effect thresholds.",
    ],
    citations: [CIT.acogPregImaging, CIT.acrAc],
    relatedSlugs: [
      "abdomen-rlq-appendicitis-pregnant-us-mri",
      "gu-renal-renal-colic-pregnant-us-first",
      "pelvis-pelvic-pain-female-ectopic-workup",
    ],
  }),
  defineEntry({
    slug: "pediatric-imaging-radiation-safety",
    region: "general",
    title: "Pediatric imaging — radiation stewardship",
    summary:
      "Children are more radiosensitive than adults and have more years for stochastic effects to manifest; cohort data link childhood CT exposure to small but measurable increases in leukemia and brain tumor risk. Ultrasound-first and MRI-preferred pathways, decision rules, and child-sized CT protocols are the stewardship toolkit.",
    clinicalBottomLine:
      "Choose radiation-free modalities first in children, apply validated decision rules (PECARN), and use child-dosed protocols when CT is genuinely needed.",
    keyPoints: [
      "Pediatric CT radiation carries measurable lifetime cancer risk that compounds across repeat scans.",
      "Decision rules safely eliminate a large share of pediatric CTs.",
      "Image Gently protocols right-size dose when CT is unavoidable.",
    ],
    citations: [CIT.pearceCt, CIT.imageGently, CIT.pecarn],
    relatedSlugs: [
      "head-brain-head-trauma-pediatric-2-to-18",
      "abdomen-rlq-appendicitis-pediatric-us-first",
    ],
  }),
  defineEntry({
    slug: "aiie-indeterminate-order",
    region: "general",
    title: "Indeterminate order — insufficient context for a scenario-level rating",
    summary:
      "AIIE returns an indeterminate (conservative mid-scale) rating when the order lacks the structured context — region, modality, indication, red-flag status — needed to match a clinical scenario in the Knowledge Matrix. The score neither endorses nor blocks the order; it asks for better documentation.",
    clinicalBottomLine:
      "An indeterminate AIIE rating is a documentation prompt, not a clinical verdict — adding the presenting complaint, duration, and red-flag status enables a definitive scenario-level rating.",
    keyPoints: [
      "Conservative defaults prevent unusual orders from receiving an unearned endorsement.",
      "Documented indication, symptom duration, and prior workup are the highest-yield missing fields.",
      "The clinician retains full decision authority; the matrix match tier is logged for audit.",
    ],
    citations: [CIT.randUcla, CIT.acrAc],
    relatedSlugs: ["red-flag-symptoms", "conservative-care-before-imaging"],
  }),
];
