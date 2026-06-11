/**
 * AIIE evidence registry entries — upper and lower extremity MSK scenarios.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";
import { CIT } from "./citations";
import { defineEntry } from "./_entry";

/** MSK evidence entries keyed by Knowledge Matrix evidenceSlug. */
export const MSK_ENTRIES: EvidenceEntry[] = [
  // Upper extremity
  defineEntry({
    slug: "msk-upper-shoulder-pain-acute-trauma-xr-first",
    region: "msk_upper",
    title: "Acute shoulder trauma — radiographs first",
    summary:
      "Acute traumatic shoulder pain starts with radiographs to identify fracture and dislocation. Advanced imaging is a second step driven by surgical questions — suspected acute full-thickness cuff tear in a young patient or persistent symptoms after films.",
    clinicalBottomLine:
      "X-ray first for acute shoulder trauma; MRI follows only for specific soft-tissue surgical questions after radiographs.",
    keyPoints: [
      "Radiographs reliably identify fracture, dislocation, and AC separation.",
      "Post-reduction films confirm congruency and detect Hill-Sachs/Bankart bony lesions.",
      "Immediate MRI for traumatic cuff tear is reserved for acute weakness in surgical candidates.",
    ],
    citations: [CIT.acrAc, CIT.rotatorCuffMeta],
    relatedSlugs: ["msk-upper-shoulder-pain-chronic-rotator-cuff-mri", "msk-upper-shoulder-pain-chronic-rotator-cuff-us"],
  }),
  defineEntry({
    slug: "msk-upper-shoulder-pain-chronic-rotator-cuff-mri",
    region: "msk_upper",
    title: "Chronic shoulder pain, suspected cuff disease — MRI when surgery is on the table",
    summary:
      "MRI characterizes rotator cuff tear size, retraction, and muscle quality — details that matter when operative repair is being considered after failed conservative care. Ordering MRI before a conservative trial, or without a surgical question, is low-value.",
    clinicalBottomLine:
      "MRI chronic cuff symptoms after a failed conservative trial and when surgery is genuinely under consideration — tear anatomy then changes the plan.",
    keyPoints: [
      "Asymptomatic cuff tears are common and increase with age — imaging findings need clinical correlation.",
      "Muscle atrophy and fatty infiltration on MRI predict repair outcomes.",
      "A structured conservative program is first-line for most atraumatic cuff disease.",
    ],
    citations: [CIT.rotatorCuffMeta, CIT.acrAc],
    relatedSlugs: ["msk-upper-shoulder-pain-chronic-rotator-cuff-us", "conservative-care-before-imaging"],
  }),
  defineEntry({
    slug: "msk-upper-shoulder-pain-chronic-rotator-cuff-us",
    region: "msk_upper",
    title: "Chronic shoulder pain — ultrasound as an accurate cuff alternative",
    summary:
      "High-resolution ultrasound in experienced hands matches MRI accuracy for full-thickness rotator cuff tears at lower cost, with dynamic assessment and guided injection capability as bonuses.",
    clinicalBottomLine:
      "Ultrasound is an accurate, cheaper alternative to MRI for suspected cuff tears where skilled MSK sonography is available.",
    keyPoints: [
      "Meta-analysis shows comparable sensitivity/specificity of US and MRI for full-thickness tears.",
      "Ultrasound enables dynamic impingement assessment and same-visit guided injection.",
      "Operator dependence is the principal limitation — accuracy assumes MSK-trained sonographers.",
    ],
    citations: [CIT.rotatorCuffMeta, CIT.acrAc],
    relatedSlugs: ["msk-upper-shoulder-pain-chronic-rotator-cuff-mri", "msk-upper-shoulder-pain-acute-trauma-xr-first"],
  }),

  // Lower extremity
  defineEntry({
    slug: "msk-lower-ankle-pain-trauma-low-risk",
    region: "msk_lower",
    title: "Ankle injury, Ottawa-negative — no radiographs",
    summary:
      "The Ottawa ankle rules identify patients whose acute ankle injury does not require radiography with near-perfect sensitivity for clinically significant fracture. Rule-negative patients can be managed functionally without films.",
    clinicalBottomLine:
      "Ottawa-negative ankle injuries need no X-ray — treat functionally and re-examine if not improving.",
    keyPoints: [
      "Pooled sensitivity for the Ottawa ankle rules approaches 98–100%.",
      "Rule application reduces ankle radiography by roughly a third without missed significant fractures.",
      "Document the rule elements (malleolar tenderness, weight-bearing) in the record.",
    ],
    citations: [CIT.ottawaAnkleReview, CIT.acrAc],
    relatedSlugs: ["msk-lower-ankle-pain-trauma-meets-criteria"],
  }),
  defineEntry({
    slug: "msk-lower-ankle-pain-trauma-meets-criteria",
    region: "msk_lower",
    title: "Ankle injury meeting Ottawa criteria — radiographs indicated",
    summary:
      "Bony tenderness at the malleoli or midfoot landmarks, or inability to bear weight, satisfies the Ottawa ankle rules and indicates radiography of the ankle and/or foot series as directed by the positive element.",
    clinicalBottomLine:
      "Ottawa-positive ankle injuries get targeted radiographs — ankle series for malleolar findings, foot series for midfoot findings.",
    keyPoints: [
      "The rules direct which series (ankle versus foot) to order, limiting views.",
      "CT is reserved for complex or intra-articular fractures after radiographs.",
      "Stress views and MRI address ligamentous questions later, not acutely.",
    ],
    citations: [CIT.ottawaAnkleReview, CIT.acrAc],
    relatedSlugs: ["msk-lower-ankle-pain-trauma-low-risk"],
  }),
  defineEntry({
    slug: "msk-lower-hip-pain-acute-trauma",
    region: "msk_lower",
    title: "Acute hip trauma — radiographs first",
    summary:
      "Hip pain after a fall or trauma is evaluated first with pelvis and hip radiographs, which identify the large majority of femoral neck and intertrochanteric fractures and immediately direct operative care.",
    clinicalBottomLine:
      "Radiograph all suspected hip fractures first — surgical planning starts from plain films obtained without delay.",
    keyPoints: [
      "Early surgery (within 36–48 hours) improves hip fracture outcomes — imaging should not bottleneck the pathway.",
      "AP pelvis plus cross-table lateral are the standard initial views.",
      "Persistent clinical suspicion despite normal films moves to MRI for occult fracture.",
    ],
    citations: [CIT.niceHip, CIT.acrAc],
    relatedSlugs: ["msk-lower-hip-pain-occult-fracture-negative-xr"],
  }),
  defineEntry({
    slug: "msk-lower-hip-pain-occult-fracture-negative-xr",
    region: "msk_lower",
    title: "Suspected occult hip fracture with negative X-ray — MRI",
    summary:
      "When a patient cannot bear weight after hip trauma but radiographs are normal, MRI is the definitive study for occult fracture — recommended within 24 hours by NICE. CT is the fallback when MRI is unavailable, accepting lower sensitivity for trabecular injury.",
    clinicalBottomLine:
      "Negative films + clinical suspicion (non-weight-bearing) → hip MRI within 24 hours; do not discharge on analgesia alone.",
    keyPoints: [
      "2–10% of hip fractures are radiographically occult.",
      "Missed occult fractures displace, converting fixable injuries into arthroplasty cases.",
      "Limited coronal MRI protocols answer the question quickly and cheaply.",
    ],
    citations: [CIT.niceHip, CIT.acrAc],
    relatedSlugs: ["msk-lower-hip-pain-acute-trauma"],
  }),
  defineEntry({
    slug: "msk-lower-knee-pain-acute-trauma-low-risk",
    region: "msk_lower",
    title: "Acute knee injury, Ottawa-negative — no radiographs",
    summary:
      "The Ottawa knee rule (age ≥55, patellar or fibular head tenderness, inability to flex 90°, inability to bear weight) safely excludes fracture when negative, eliminating the need for acute radiographs.",
    clinicalBottomLine:
      "Ottawa-negative acute knee injuries need no X-ray — manage symptomatically with re-evaluation if not improving.",
    keyPoints: [
      "Systematic review supports near-100% sensitivity of the Ottawa knee rule for fracture.",
      "Most acute knee injuries are soft-tissue and do not benefit from acute imaging.",
      "MRI questions (meniscus, ligament) belong to the persistent-symptom pathway, not day one.",
    ],
    citations: [CIT.ottawaKneeReview, CIT.acrAc],
    relatedSlugs: ["msk-lower-knee-pain-acute-trauma-xr-criteria", "msk-lower-knee-pain-meniscal-ligament-post-xr"],
  }),
  defineEntry({
    slug: "msk-lower-knee-pain-acute-trauma-xr-criteria",
    region: "msk_lower",
    title: "Acute knee injury meeting Ottawa criteria — radiographs",
    summary:
      "Any positive Ottawa knee rule element indicates knee radiographs to evaluate for fracture. CT follows for surgical planning of confirmed tibial plateau or complex fractures.",
    clinicalBottomLine:
      "Ottawa-positive knee injuries get plain radiographs; escalate to CT only for surgical planning of confirmed complex fractures.",
    keyPoints: [
      "Age ≥55 alone satisfies the rule — fracture risk rises with age.",
      "Effusion plus inability to bear weight raises occult fracture concern even with normal films.",
      "MRI is not an acute fracture tool here; it addresses soft-tissue questions later.",
    ],
    citations: [CIT.ottawaKneeReview, CIT.acrAc],
    relatedSlugs: ["msk-lower-knee-pain-acute-trauma-low-risk"],
  }),
  defineEntry({
    slug: "msk-lower-knee-pain-chronic-oa",
    region: "msk_lower",
    title: "Chronic knee pain with osteoarthritis — weight-bearing X-ray, not MRI",
    summary:
      "Chronic degenerative knee pain is evaluated with weight-bearing radiographs. MRI in established osteoarthritis is a recognized low-value order: it nearly always shows meniscal signal that does not change management, and arthroscopy for degenerative disease lacks benefit.",
    clinicalBottomLine:
      "Weight-bearing radiographs for chronic knee OA — MRI adds cost and incidental meniscal findings without changing guideline-based management.",
    keyPoints: [
      "Degenerative meniscal tears on MRI are near-universal in OA and largely incidental.",
      "BMJ Rapid Recommendation advises against arthroscopy for degenerative knee disease.",
      "Exercise, weight management, and stepped analgesia are the evidence-based core of OA care.",
    ],
    citations: [CIT.oarsiOa, CIT.bmjArthroscopy, CIT.meteor],
    relatedSlugs: ["msk-lower-knee-pain-meniscal-ligament-post-xr", "conservative-care-before-imaging"],
  }),
  defineEntry({
    slug: "msk-lower-knee-pain-meniscal-ligament-post-xr",
    region: "msk_lower",
    title: "Suspected meniscal or ligament injury — MRI after radiographs and persistence",
    summary:
      "MRI is the right study for mechanically symptomatic suspected meniscal or ligamentous injury — after radiographs and typically after symptoms persist despite initial conservative care, in patients for whom arthroscopic or reconstructive surgery is realistic.",
    clinicalBottomLine:
      "MRI for suspected internal derangement when mechanical symptoms persist post-X-ray and surgery is a realistic option.",
    keyPoints: [
      "True locking and instability are the symptoms that most reliably benefit from MRI triage.",
      "METEOR showed PT-first strategies match surgery for many meniscal tears with OA.",
      "MRI before any conservative trial in non-locking knees is usually premature.",
    ],
    citations: [CIT.meteor, CIT.bmjArthroscopy, CIT.acrAc],
    relatedSlugs: ["msk-lower-knee-pain-chronic-oa", "msk-lower-knee-pain-acute-trauma-low-risk"],
  }),
];
