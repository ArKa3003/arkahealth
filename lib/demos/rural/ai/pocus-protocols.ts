import type { POCUSProtocol } from "../types";

export const POCUS_PROTOCOLS: POCUSProtocol[] = [
  {
    id: "pocus-001",
    name: "FAST Exam (Focused Assessment with Sonography for Trauma)",
    indication: "Blunt or penetrating abdominal/thoracic trauma",
    category: "FAST",
    difficulty: "basic",
    steps: [
      {
        stepNumber: 1,
        instruction:
          "Place the phased array or curvilinear probe in the right upper quadrant (RUQ) — Morrison's pouch",
        probePosition:
          "Right mid-axillary line at the level of the 11th-12th ribs, indicator toward patient's head",
        expectedView:
          "Interface between liver and right kidney (hepatorenal recess). Look for anechoic stripe (free fluid).",
        qualityIndicators: [
          "Both liver and kidney parenchyma clearly visible",
          "Diaphragm seen superiorly",
          "Inferior pole of kidney visible",
        ],
        commonErrors: [
          "Probe too anterior — misses posterior recess",
          "Not enough depth — kidney tip cut off",
          "Rib shadow obscuring view",
        ],
      },
      {
        stepNumber: 2,
        instruction: "Move probe to left upper quadrant (LUQ) — splenorenal recess",
        probePosition: "Left posterior axillary line, 9th-10th intercostal space, indicator toward head",
        expectedView:
          "Interface between spleen and left kidney. Look for anechoic stripe (free fluid).",
        qualityIndicators: ["Spleen and left kidney clearly visible", "Diaphragm visible", "Splenic tip seen"],
        commonErrors: [
          "Probe not posterior enough — spleen difficult to see",
          "LUQ is harder than RUQ — takes practice",
          "Stomach gas can obscure view",
        ],
      },
      {
        stepNumber: 3,
        instruction: "Place probe in subxiphoid position for cardiac view",
        probePosition:
          "Subxiphoid/subcostal, probe nearly flat against abdomen, indicator to patient's right",
        expectedView:
          "Four-chamber cardiac view. Assess for pericardial effusion (anechoic stripe around heart).",
        qualityIndicators: ["All four chambers visible", "Pericardium clearly seen", "No obscuring bowel gas"],
        commonErrors: [
          "Probe angle too steep",
          "Not enough pressure — liver doesn't serve as acoustic window",
          "Patient habitus may require alternative views",
        ],
      },
      {
        stepNumber: 4,
        instruction: "Place probe in the suprapubic region for pelvic view",
        probePosition:
          "Midline, just above pubic symphysis, angled inferiorly into pelvis, indicator to patient's right",
        expectedView:
          "Bladder as acoustic window. Look for free fluid posterior to bladder (rectovesical pouch in males, pouch of Douglas in females).",
        qualityIndicators: [
          "Full bladder visible as anechoic structure",
          "Uterus visible posterior to bladder (females)",
          "Clear view of pelvic cul-de-sac",
        ],
        commonErrors: [
          "Empty bladder — no acoustic window (consider Foley clamp)",
          "Probe angle too superior",
          "Bowel gas obscuring pelvic structures",
        ],
      },
    ],
    normalFindings: [
      "No free fluid in any of the four views",
      "Normal cardiac activity without pericardial effusion",
      "Bilateral lung sliding present (if extended FAST performed)",
    ],
    abnormalFindings: [
      "Anechoic stripe in Morrison's pouch, splenorenal recess, or pelvis indicates free fluid (likely hemoperitoneum in trauma)",
      "Pericardial effusion — anechoic stripe between myocardium and pericardium",
      "Absent lung sliding with barcode sign suggests pneumothorax (eFAST)",
    ],
    clinicalDecisionPoints: [
      "Positive FAST + hemodynamic instability → emergent surgical consultation / transfer",
      "Positive FAST + hemodynamically stable → CT abdomen/pelvis if available, or transfer for CT",
      "Negative FAST does not exclude injury — serial exams or CT recommended for high mechanism",
    ],
    pitfalls: [
      "FAST sensitivity is only ~73-88% — a negative FAST does NOT rule out intra-abdominal injury",
      "Small amounts of free fluid (<200mL) may be missed",
      "Retroperitoneal hemorrhage is NOT detected by FAST",
      "In obese patients, image quality may be significantly degraded",
      "Subcutaneous emphysema from pneumothorax can obscure all views",
    ],
    references: [
      "ACEP Ultrasound Guidelines: FAST Exam, 2023",
      "Scalea TM, et al. FAST exam: a review. J Trauma, 2019",
    ],
    estimatedDurationMinutes: 5,
  },
  // Additional protocols would follow for: cardiac, DVT, gallbladder, renal, obstetric, lung, aorta
];
