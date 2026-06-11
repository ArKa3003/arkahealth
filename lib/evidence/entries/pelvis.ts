/**
 * AIIE evidence registry entries — pelvis scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Pelvis evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const PELVIS_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "pelvis-pelvic-pain-female-ectopic-workup",
    region: "pelvis",
    title: "Possible ectopic pregnancy — transvaginal ultrasound plus β-hCG",
    summary:
      "Pelvic pain or bleeding with a positive pregnancy test is an ectopic workup: transvaginal ultrasound correlated with quantitative β-hCG. An empty uterus above the discriminatory zone, or an adnexal mass with free fluid, drives urgent management.",
    clinicalBottomLine:
      "EXPEDITE: transvaginal US with quantitative β-hCG for any pregnant patient with pain or bleeding — ruptured ectopic remains a leading cause of first-trimester maternal death.",
    keyPoints: [
      "Intrauterine pregnancy on TVUS effectively excludes ectopic outside rare heterotopic cases.",
      "β-hCG discriminatory thresholds guide interpretation of a non-diagnostic ultrasound.",
      "Hemodynamic instability with positive pregnancy test goes to the OR, not radiology.",
    ],
    citations: [CIT.acogEctopic, CIT.acrAc],
    relatedSlugs: ["pelvis-pelvic-pain-female-us-first", "imaging-in-pregnancy"],
  }),
  defineEntry({
    slug: "pelvis-pelvic-pain-female-post-menopausal-bleeding",
    region: "pelvis",
    title: "Postmenopausal bleeding — transvaginal ultrasound for endometrial assessment",
    summary:
      "Postmenopausal bleeding requires evaluation for endometrial carcinoma. Transvaginal ultrasound measuring endometrial thickness is an appropriate first test: ≤4 mm carries a very high negative predictive value, while thicker or persistent bleeding warrants sampling.",
    clinicalBottomLine:
      "TVUS first for postmenopausal bleeding — endometrial thickness ≤4 mm reasonably excludes carcinoma; anything more (or recurrent bleeding) gets endometrial sampling.",
    keyPoints: [
      "Endometrial cancer presents with bleeding in the large majority of cases — never attribute it to atrophy without evaluation.",
      "The 4 mm threshold yields >99% negative predictive value for carcinoma.",
      "Recurrent bleeding requires histology even after a reassuring ultrasound.",
    ],
    citations: [CIT.acogPmb, CIT.acrAc],
    relatedSlugs: ["pelvis-pelvic-pain-female-us-first", "red-flag-symptoms"],
  }),
  defineEntry({
    slug: "pelvis-pelvic-pain-female-us-first",
    region: "pelvis",
    title: "Female pelvic pain — pelvic ultrasound first",
    summary:
      "Transvaginal and transabdominal ultrasound is the first imaging study for female pelvic pain, evaluating ovarian cysts, torsion, tubo-ovarian abscess, and uterine pathology without radiation. CT and MRI are problem-solving studies, not first steps.",
    clinicalBottomLine:
      "Pelvic ultrasound first for female pelvic pain — reserve CT for suspected GI sources and MRI for problem-solving.",
    keyPoints: [
      "Ultrasound with Doppler is the primary test for suspected ovarian torsion.",
      "A pregnancy test precedes any imaging decision in reproductive-age patients.",
      "CT-first ordering for likely gynecologic pain adds radiation and rarely answers the question better.",
    ],
    citations: [CIT.acrAc, CIT.acogEctopic],
    relatedSlugs: ["pelvis-pelvic-pain-female-ectopic-workup", "pelvis-pelvic-pain-female-post-menopausal-bleeding"],
  }),
];
