/**
 * AIIE evidence registry entries — abdomen scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** Abdomen evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const ABDOMEN_ENTRIES: EvidenceEntry[] = [
  defineEntry({
    slug: "abdomen-blunt-abdominal-trauma-hemodynamically-stable",
    region: "abdomen",
    title: "Blunt abdominal trauma, hemodynamically stable — contrast CT",
    summary:
      "Hemodynamically stable patients with significant blunt abdominal trauma are evaluated with contrast-enhanced CT of the abdomen and pelvis, which grades solid-organ injury and increasingly enables non-operative management.",
    clinicalBottomLine:
      "Stable blunt abdominal trauma with significant mechanism or findings → IV-contrast CT abdomen/pelvis; FAST complements but does not replace CT.",
    keyPoints: [
      "CT grading of splenic and hepatic injuries underpins non-operative management decisions.",
      "A negative FAST does not exclude injury in stable patients with concerning mechanism.",
      "Serial examination is an option only for low-mechanism, low-suspicion presentations.",
    ],
    citations: [CIT.fastCochrane, CIT.acrAc],
    relatedSlugs: ["abdomen-blunt-abdominal-trauma-hemodynamically-unstable"],
  }),
  defineEntry({
    slug: "abdomen-blunt-abdominal-trauma-hemodynamically-unstable",
    region: "abdomen",
    title: "Blunt abdominal trauma, unstable — FAST and the OR, not the scanner",
    summary:
      "Hemodynamically unstable blunt trauma patients should not travel to CT. Bedside FAST identifies free fluid in seconds; a positive FAST in an unstable patient is an indication for immediate operative exploration.",
    clinicalBottomLine:
      "EXPEDITE: unstable patient + positive FAST → operating room. CT is reserved for patients who stabilize with resuscitation.",
    keyPoints: [
      "The CT scanner is a dangerous place for an unstable trauma patient.",
      "FAST is rapid and repeatable at the bedside during resuscitation.",
      "Unstable with negative FAST: reassess for alternative bleeding sources (pelvis, chest, long bones).",
    ],
    citations: [CIT.fastCochrane, CIT.acrAc],
    relatedSlugs: ["abdomen-blunt-abdominal-trauma-hemodynamically-stable"],
  }),
  defineEntry({
    slug: "abdomen-diverticulitis-complicated",
    region: "abdomen",
    title: "Complicated diverticulitis — CT defines abscess and perforation",
    summary:
      "Suspected complicated diverticulitis — severe pain, sepsis, peritonitis, or failure of outpatient therapy — requires contrast-enhanced CT to identify abscess, perforation, obstruction, or fistula and to guide percutaneous drainage versus surgery.",
    clinicalBottomLine:
      "Image suspected complicated diverticulitis with IV-contrast CT — abscess size and free air determine drainage and operative decisions.",
    keyPoints: [
      "Abscesses ≥3–4 cm are candidates for image-guided percutaneous drainage.",
      "Free perforation with peritonitis is a surgical emergency.",
      "CT severity staging (modified Hinchey) correlates with management intensity.",
    ],
    citations: [CIT.ascrsDiverticulitis, CIT.agaDiverticulitis, CIT.acrAc],
    relatedSlugs: ["abdomen-diverticulitis-uncomplicated"],
  }),
  defineEntry({
    slug: "abdomen-diverticulitis-uncomplicated",
    region: "abdomen",
    title: "Suspected uncomplicated diverticulitis — CT confirms first episodes",
    summary:
      "CT with IV contrast is appropriate to confirm a first episode of suspected acute diverticulitis and exclude complications. In patients with classic recurrent symptoms and prior imaging-confirmed disease, repeat imaging for every mild episode adds little.",
    clinicalBottomLine:
      "CT confirms first or atypical diverticulitis episodes; mild classic recurrences in confirmed disease may be managed without repeat imaging.",
    keyPoints: [
      "First presentations warrant CT — clinical diagnosis alone is wrong in a meaningful fraction.",
      "AGA suggests selective, not routine, antibiotic use in uncomplicated disease.",
      "Colonoscopy after resolution is recommended following a first complicated or imaging-diagnosed episode when not recently performed.",
    ],
    citations: [CIT.agaDiverticulitis, CIT.ascrsDiverticulitis, CIT.acrAc],
    relatedSlugs: ["abdomen-diverticulitis-complicated", "conservative-care-before-imaging"],
  }),
  defineEntry({
    slug: "abdomen-epigastric-pancreatitis-severe-or-suspected-complication",
    region: "abdomen",
    title: "Severe or complicated acute pancreatitis — delayed contrast CT",
    summary:
      "In severe acute pancreatitis or clinical deterioration, contrast-enhanced CT performed 72 hours or more after onset characterizes necrosis and local complications per the revised Atlanta classification. Very early CT underestimates necrosis and rarely changes management.",
    clinicalBottomLine:
      "CT for pancreatitis severity assessment is most informative ≥72 hours after onset — image deterioration, not the diagnosis itself.",
    keyPoints: [
      "Necrosis demarcates over days; early CT understages severity.",
      "Revised Atlanta nomenclature (APFC, pseudocyst, ANC, WON) drives intervention timing.",
      "Imaging is indicated immediately when the diagnosis is uncertain or perforation is suspected.",
    ],
    citations: [CIT.atlantaPancreatitis, CIT.acgPancreatitis, CIT.acrAc],
    relatedSlugs: ["abdomen-epigastric-pancreatitis-uncomplicated"],
  }),
  defineEntry({
    slug: "abdomen-epigastric-pancreatitis-uncomplicated",
    region: "abdomen",
    title: "Uncomplicated acute pancreatitis — diagnose clinically, image selectively",
    summary:
      "Acute pancreatitis is diagnosed by two of three criteria (pain, lipase >3× ULN, imaging); when pain and lipase suffice, early CT is unnecessary. Right upper quadrant ultrasound is indicated in all first episodes to assess for gallstones as the etiology.",
    clinicalBottomLine:
      "Uncomplicated pancreatitis needs RUQ ultrasound for gallstone etiology — not an admission CT — when pain and lipase establish the diagnosis.",
    keyPoints: [
      "ACG: routine early CT in uncomplicated pancreatitis adds cost and contrast without benefit.",
      "Ultrasound for gallstones determines whether cholecystectomy is needed before discharge.",
      "Reserve CT/MRCP for diagnostic uncertainty, deterioration, or suspected complications.",
    ],
    citations: [CIT.acgPancreatitis, CIT.atlantaPancreatitis, CIT.acrAc],
    relatedSlugs: ["abdomen-epigastric-pancreatitis-severe-or-suspected-complication", "abdomen-ruq-cholecystitis-us-first"],
  }),
  defineEntry({
    slug: "abdomen-rlq-appendicitis-adult-ct",
    region: "abdomen",
    title: "Suspected appendicitis in adults — CT with IV contrast",
    summary:
      "Contrast-enhanced CT is the most accurate imaging study for suspected appendicitis in non-pregnant adults, with sensitivity and specificity both around 95%. Clinical scores (Alvarado, AIR) stratify who needs imaging at all.",
    clinicalBottomLine:
      "IV-contrast CT is the adult appendicitis study of choice; use clinical scoring to avoid imaging very-low-risk patients.",
    keyPoints: [
      "CT reduced negative appendectomy rates dramatically versus clinical diagnosis alone.",
      "Low-dose CT protocols approach standard-dose accuracy in appendicitis.",
      "Ultrasound-first remains preferred for children and pregnant patients.",
    ],
    citations: [CIT.jerusalemAppy, CIT.doriaPedsAppy, CIT.acrAc],
    relatedSlugs: ["abdomen-rlq-appendicitis-pediatric-us-first", "abdomen-rlq-appendicitis-pregnant-us-mri"],
  }),
  defineEntry({
    slug: "abdomen-rlq-appendicitis-pediatric-us-first",
    region: "abdomen",
    title: "Suspected pediatric appendicitis — ultrasound first",
    summary:
      "Children with suspected appendicitis are imaged ultrasound-first to avoid CT radiation. A visualized normal or inflamed appendix is usually diagnostic; equivocal studies escalate to MRI or low-dose CT depending on availability.",
    clinicalBottomLine:
      "Ultrasound is the first study for pediatric appendicitis; escalate equivocal results to MRI (preferred) or low-dose CT rather than defaulting to CT.",
    keyPoints: [
      "Graded-compression ultrasound has high specificity when the appendix is visualized.",
      "Staged US→CT/MRI pathways cut pediatric CT use substantially without missed diagnoses.",
      "Pediatric radiation stewardship (Image Gently) underpins the US-first strategy.",
    ],
    citations: [CIT.doriaPedsAppy, CIT.jerusalemAppy, CIT.imageGently],
    relatedSlugs: ["abdomen-rlq-appendicitis-adult-ct", "pediatric-imaging-radiation-safety"],
  }),
  defineEntry({
    slug: "abdomen-rlq-appendicitis-pregnant-us-mri",
    region: "abdomen",
    title: "Suspected appendicitis in pregnancy — ultrasound then MRI",
    summary:
      "Pregnant patients with suspected appendicitis are imaged with ultrasound first; when non-diagnostic — common as gestation advances — non-contrast MRI is the next study. CT is reserved for when MRI is unavailable and the diagnosis remains urgent.",
    clinicalBottomLine:
      "US first, MRI second for appendicitis in pregnancy — avoid ionizing radiation and gadolinium without forgoing a timely diagnosis.",
    keyPoints: [
      "MRI for appendicitis in pregnancy has sensitivity and specificity above 90%.",
      "Delayed diagnosis and perforation carry greater fetal risk than properly indicated imaging.",
      "Gadolinium is avoided in pregnancy; non-contrast MRI protocols suffice.",
    ],
    citations: [CIT.acogPregImaging, CIT.jerusalemAppy, CIT.acrAc],
    relatedSlugs: ["abdomen-rlq-appendicitis-adult-ct", "imaging-in-pregnancy"],
  }),
  defineEntry({
    slug: "abdomen-ruq-cholecystitis-us-first",
    region: "abdomen",
    title: "Suspected acute cholecystitis — right upper quadrant ultrasound first",
    summary:
      "Ultrasound is the first-line study for right upper quadrant pain and suspected acute cholecystitis: it detects stones, wall thickening, pericholecystic fluid, and a sonographic Murphy sign. HIDA scanning adjudicates equivocal cases per Tokyo Guidelines diagnostic criteria.",
    clinicalBottomLine:
      "RUQ ultrasound first for suspected cholecystitis; hepatobiliary scintigraphy (HIDA) when ultrasound is equivocal.",
    keyPoints: [
      "Ultrasound is fast, radiation-free, and accurate for calculous disease.",
      "Tokyo Guidelines combine local signs, systemic inflammation, and imaging for diagnosis and severity grading.",
      "CT contributes for suspected complications (perforation, emphysematous cholecystitis).",
    ],
    citations: [CIT.tg18Cholecystitis, CIT.acrAc],
    relatedSlugs: ["abdomen-epigastric-pancreatitis-uncomplicated", "abdomen-rlq-appendicitis-adult-ct"],
  }),
  defineEntry({
    slug: "abdomen-suspected-sbo-standard",
    region: "abdomen",
    title: "Suspected small bowel obstruction — CT with IV contrast",
    summary:
      "CT of the abdomen and pelvis with IV contrast is the standard study for suspected small bowel obstruction, confirming the diagnosis, locating the transition point, and detecting ischemia or closed-loop physiology that mandates surgery.",
    clinicalBottomLine:
      "Suspected SBO → IV-contrast CT abdomen/pelvis; signs of ischemia or closed loop convert management from trial-of-decompression to surgery.",
    keyPoints: [
      "Bologna guidelines endorse CT for diagnosis and water-soluble contrast challenge for adhesive SBO management.",
      "Reduced bowel-wall enhancement and mesenteric edema predict strangulation.",
      "Plain radiographs are insensitive and rarely change management when CT is available.",
    ],
    citations: [CIT.bolognaSbo, CIT.acrAc],
    relatedSlugs: ["abdomen-blunt-abdominal-trauma-hemodynamically-stable"],
  }),
];
