/**
 * AIIE evidence registry entries — breast scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Breast evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const BREAST_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "breast-breast-screening-average-risk-40-plus",
    region: "breast",
    title: "Breast cancer screening, average risk — mammography from 40",
    summary:
      "Screening mammography for average-risk women is recommended beginning at age 40 (USPSTF 2024: biennial 40–74). Digital breast tomosynthesis improves recall rates and cancer detection where available.",
    clinicalBottomLine:
      "Begin screening mammography at 40 for average-risk women; tomosynthesis is the preferred technique where offered.",
    keyPoints: [
      "USPSTF 2024 moved the recommended starting age from 50 to 40.",
      "Dense breasts reduce mammographic sensitivity and may prompt supplemental imaging discussions.",
      "Screening intervals (annual versus biennial) balance detection against false positives.",
    ],
    citations: [CIT.uspstfBreast, CIT.acrAc],
    relatedSlugs: ["breast-breast-screening-high-risk-mri-supplement", "breast-palpable-lump-30-plus-mammo-us"],
  }),
  defineEntry({
    slug: "breast-breast-screening-high-risk-mri-supplement",
    region: "breast",
    title: "High-risk breast screening — annual MRI supplements mammography",
    summary:
      "Women with ≥20–25% lifetime breast cancer risk — BRCA carriers, strong family history, or chest radiation before 30 — should receive annual breast MRI in addition to mammography per American Cancer Society guidance.",
    clinicalBottomLine:
      "Lifetime risk ≥20%: add annual contrast-enhanced breast MRI to mammography — neither study alone is sufficient in this group.",
    keyPoints: [
      "MRI sensitivity in high-risk cohorts roughly doubles mammography alone.",
      "Formal risk models (Tyrer-Cuzick, BRCAPRO) determine eligibility — document the estimate.",
      "MRI supplements, never replaces, mammography (each detects cancers the other misses).",
    ],
    citations: [CIT.acsBreastMri, CIT.uspstfBreast],
    relatedSlugs: ["breast-breast-screening-average-risk-40-plus"],
  }),
  defineEntry({
    slug: "breast-palpable-lump-30-plus-mammo-us",
    region: "breast",
    title: "Palpable breast lump at 30+ — diagnostic mammography plus ultrasound",
    summary:
      "A palpable breast mass in a woman 30 or older is evaluated with diagnostic mammography plus targeted ultrasound. The combination characterizes most lesions definitively and directs biopsy of suspicious findings.",
    clinicalBottomLine:
      "Diagnostic mammogram + targeted US for palpable lumps at age ≥30; a negative workup with a persistent suspicious mass still warrants biopsy.",
    keyPoints: [
      "Diagnostic (not screening) mammography is the correct order for a symptomatic breast.",
      "Ultrasound distinguishes cysts from solid masses and guides core biopsy.",
      "Clinical suspicion overrides negative imaging — triple assessment governs.",
    ],
    citations: [CIT.acrAc, CIT.uspstfBreast],
    relatedSlugs: ["breast-palpable-lump-under-30-us-first", "breast-breast-screening-average-risk-40-plus"],
  }),
  defineEntry({
    slug: "breast-palpable-lump-under-30-us-first",
    region: "breast",
    title: "Palpable breast lump under 30 — ultrasound first",
    summary:
      "In women under 30, dense glandular tissue limits mammography and the pre-test probability of malignancy is low; targeted ultrasound is the first study for a palpable lump, with mammography added only for suspicious sonographic findings.",
    clinicalBottomLine:
      "Ultrasound first for palpable lumps under 30 — add mammography only when ultrasound raises suspicion.",
    keyPoints: [
      "Fibroadenomas dominate this age group and have characteristic sonographic features.",
      "Breast density makes screening-age mammographic technique low-yield here.",
      "Suspicious or indeterminate ultrasound findings proceed to biopsy regardless of age.",
    ],
    citations: [CIT.acrAc, CIT.uspstfBreast],
    relatedSlugs: ["breast-palpable-lump-30-plus-mammo-us"],
  }),
];
