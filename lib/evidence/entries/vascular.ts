/**
 * AIIE evidence registry entries — vascular scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Vascular evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const VASCULAR_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "vascular-aaa-screening-screening-eligible",
    region: "vascular",
    title: "AAA screening — one-time ultrasound for eligible men",
    summary:
      "One-time abdominal aortic ultrasound is recommended for men aged 65–75 who have ever smoked (USPSTF grade B), with selective screening for never-smokers. Ultrasound is essentially 100% sensitive for aneurysm at no radiation cost.",
    clinicalBottomLine:
      "Order a one-time screening abdominal ultrasound for men 65–75 who have ever smoked.",
    keyPoints: [
      "Screening reduces AAA-related mortality in randomized trials.",
      "Ultrasound is the screening modality — CT is for surveillance thresholds and repair planning.",
      "Women who have never smoked are recommended against routine screening.",
    ],
    citations: [CIT.uspstfAaa, CIT.svsAaa],
    relatedSlugs: ["vascular-aaa-screening-surveillance-known-aaa"],
  }),
  defineEntry({
    slug: "vascular-aaa-screening-surveillance-known-aaa",
    region: "vascular",
    title: "Known AAA — interval ultrasound surveillance by diameter",
    summary:
      "Surveillance intervals for known abdominal aortic aneurysm scale with diameter per SVS guidance (e.g., 3 years for 3.0–3.9 cm, annually for 4.0–4.9 cm, semi-annually approaching threshold). CT angiography enters at repair planning, not for routine follow-up.",
    clinicalBottomLine:
      "Surveil known AAA with ultrasound at diameter-based intervals; CTA is for repair planning near the 5.5 cm (men) threshold.",
    keyPoints: [
      "Rupture risk accelerates non-linearly with diameter.",
      "Ultrasound surveillance avoids cumulative radiation and contrast over years of follow-up.",
      "Rapid expansion (>0.5 cm/6 months) is itself a repair indication.",
    ],
    citations: [CIT.svsAaa, CIT.uspstfAaa],
    relatedSlugs: ["vascular-aaa-screening-screening-eligible"],
  }),
  defineEntry({
    slug: "vascular-carotid-stenosis-asymptomatic-screening",
    region: "vascular",
    title: "Asymptomatic carotid screening — recommended against",
    summary:
      "The USPSTF recommends against screening for asymptomatic carotid artery stenosis in the general adult population (grade D): prevalence is low, false positives trigger risky interventions, and benefit over medical therapy is unproven.",
    clinicalBottomLine:
      "Do not order carotid duplex as a screening study in asymptomatic adults without specific indications — USPSTF grade D.",
    keyPoints: [
      "Population prevalence of significant asymptomatic stenosis is low (~1%).",
      "Downstream harms include unnecessary endarterectomy and stenting complications.",
      "Auscultated bruits alone are poor predictors and not an evidence-based screening trigger.",
    ],
    citations: [CIT.uspstfCarotid, CIT.acrAc],
    relatedSlugs: ["vascular-carotid-stenosis-symptomatic"],
  }),
  defineEntry({
    slug: "vascular-carotid-stenosis-symptomatic",
    region: "vascular",
    title: "Symptomatic carotid stenosis — urgent duplex after TIA or stroke",
    summary:
      "Carotid imaging is urgent after TIA or non-disabling stroke in the anterior circulation: duplex ultrasound (or CTA/MRA) identifies the 50–99% symptomatic stenoses where early endarterectomy delivers its largest absolute benefit.",
    clinicalBottomLine:
      "Image the carotids within days of TIA/minor stroke — revascularization benefit decays rapidly with delay (NASCET).",
    keyPoints: [
      "NASCET established large stroke-prevention benefit for endarterectomy in 70–99% symptomatic stenosis.",
      "Benefit is greatest when surgery occurs within 2 weeks of the index event.",
      "Duplex first; CTA/MRA confirm and characterize before intervention.",
    ],
    citations: [CIT.nascet, CIT.tiaDefinition, CIT.acrAc],
    relatedSlugs: ["head-brain-suspected-stroke-tia", "vascular-carotid-stenosis-asymptomatic-screening"],
  }),
  defineEntry({
    slug: "vascular-suspected-dvt-standard-doppler",
    region: "vascular",
    title: "Suspected DVT — Wells score, D-dimer, and compression ultrasound",
    summary:
      "Suspected lower-extremity DVT follows a probability-based pathway: Wells scoring, D-dimer to rule out in low-probability patients, and compression ultrasound with Doppler as the definitive imaging study for the rest.",
    clinicalBottomLine:
      "Low-probability + negative D-dimer rules out DVT without imaging; everyone else gets compression Doppler ultrasound.",
    keyPoints: [
      "Wells validated that D-dimer safely excludes DVT at low pretest probability.",
      "Whole-leg compression US is highly sensitive and specific for proximal DVT.",
      "ASH 2018 endorses the probability-stratified strategy over universal imaging.",
    ],
    citations: [CIT.wellsDvt, CIT.ashVte, CIT.acrAc],
    relatedSlugs: ["chest-acute-chest-pain-pe-low-pretest-d-dimer", "conservative-care-before-imaging"],
  }),
];
