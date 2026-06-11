/**
 * Exhaustive permutation tests for the AIIE Clinical Knowledge Matrix.
 *
 * 1. Full cartesian sweep: every BodyRegion × Modality × scenario lead keyword
 *    × red flags on/off × age × prior imaging — zero exceptions allowed.
 * 2. Adversarial inputs: garbage, emoji, SQL-ish, wrong-language text.
 * 3. Clinical correctness golden set: ≥60 named cases with expected matrix
 *    rating ranges and preferred modalities; never a region/conservative default.
 * 4. Determinism: identical input → identical output, 50×.
 * 5. Performance: 1,000 random sweep inputs under 2 seconds.
 */

import { describe, it, expect } from "vitest";

import {
  ALL_SCENARIOS,
  normalizeOrderContext,
  resolveRating,
} from "@/lib/aiie/knowledge-matrix";
import type {
  BodyRegion,
  MatchTier,
  Modality,
  ResolvedRating,
  ScenarioVariant,
} from "@/lib/aiie/knowledge-matrix";
import { ALL_MODALITIES } from "@/lib/aiie/knowledge-matrix/regions/_rating-builder";
import { scoreOrder } from "@/lib/aiie/scoring-engine";
import type { AIIEInput, AIIERedFlags, AIIEScore } from "@/lib/types/aiie";

// ---------------------------------------------------------------------------
// Input construction helpers
// ---------------------------------------------------------------------------

const ALL_REGIONS: readonly BodyRegion[] = [
  "head_brain",
  "head_face_neck",
  "spine_cervical",
  "spine_thoracic",
  "spine_lumbar",
  "chest",
  "cardiac",
  "abdomen",
  "pelvis",
  "gu_renal",
  "msk_upper",
  "msk_lower",
  "vascular",
  "breast",
  "whole_body",
];

/** Representative body-part text that the normalizer resolves to each region. */
const REGION_BODY_PART: Record<BodyRegion, string> = {
  head_brain: "brain",
  head_face_neck: "face",
  spine_cervical: "cervical spine",
  spine_thoracic: "thoracic spine",
  spine_lumbar: "lumbar spine",
  chest: "chest",
  cardiac: "heart",
  abdomen: "abdomen",
  pelvis: "pelvis",
  gu_renal: "kidney",
  msk_upper: "shoulder",
  msk_lower: "knee",
  vascular: "carotid",
  breast: "breast",
  whole_body: "whole body",
};

/** Order text that the normalizer resolves to each matrix modality. */
const MODALITY_ORDER_TEXT: Record<Modality, string> = {
  xr: "X-ray",
  ct: "CT",
  cta: "CTA",
  ct_contrast: "CT with contrast",
  mri: "MRI",
  mri_contrast: "MRI with contrast",
  mra: "MRA",
  us: "Ultrasound",
  us_doppler: "Doppler ultrasound",
  nm: "Nuclear medicine scan",
  pet_ct: "PET-CT",
  fluoro: "Fluoroscopy",
  mammo: "Mammography",
  dexa: "DEXA bone densitometry",
};

const VALID_TIERS: readonly MatchTier[] = [
  "exact_variant",
  "scenario_default",
  "region_default",
  "conservative_default",
];

function emptyRedFlags(): AIIERedFlags {
  return {
    cancerHistory: false,
    neurologicalDeficit: false,
    fever: false,
    weightLoss: false,
    trauma: false,
    immunocompromised: false,
    ivDrugUse: false,
    osteoporosis: false,
    ageOver50: false,
    ageUnder18: false,
    progressiveSymptoms: false,
    bladderBowelDysfunction: false,
    suddenOnset: false,
  };
}

interface InputSpec {
  complaint: string;
  bodyPart: string;
  modalityText: string;
  duration?: string;
  age?: number;
  sex?: "male" | "female";
  pregnant?: boolean;
  redFlags?: Partial<AIIERedFlags>;
  priorImaging?: boolean;
  conservativeTried?: boolean;
}

function buildInput(spec: InputSpec): AIIEInput {
  const redFlags: AIIERedFlags = { ...emptyRedFlags(), ...spec.redFlags };
  const age = spec.age ?? 40;
  const duration = spec.duration ?? "";
  const procedure = `${spec.modalityText} ${spec.bodyPart}`.trim();
  return {
    patient: { age, sex: spec.sex ?? "female", pregnant: spec.pregnant },
    clinicalFactors: {
      chiefComplaint: spec.complaint,
      duration,
      symptoms: [],
      redFlags,
      priorImaging: spec.priorImaging ?? false,
      conservativeManagementTried: spec.conservativeTried ?? false,
    },
    order: {
      modality: spec.modalityText,
      bodyPart: spec.bodyPart,
      procedure,
    },
    age,
    sex: spec.sex ?? "female",
    pregnant: spec.pregnant,
    chiefComplaint: spec.complaint,
    duration,
    symptoms: [],
    redFlags,
    priorImaging: spec.priorImaging ?? false,
    conservativeManagementTried: spec.conservativeTried ?? false,
    requestedModality: spec.modalityText,
    requestedProcedure: procedure,
  };
}

/** Appends invariant violations for a score to the failures list. */
function checkScoreInvariants(
  score: AIIEScore,
  label: string,
  failures: string[],
): void {
  if (!Number.isInteger(score.clinicalScore) || score.clinicalScore < 1 || score.clinicalScore > 9) {
    failures.push(`${label}: clinicalScore ${score.clinicalScore} not an integer 1-9`);
  }
  if (typeof score.denialRisk !== "number" || !Number.isFinite(score.denialRisk)) {
    failures.push(`${label}: denialRisk missing or non-numeric`);
  }
  if (!Array.isArray(score.factors) || score.factors.length === 0) {
    failures.push(`${label}: factors empty`);
  }
  if (!score.matrixMatch) {
    failures.push(`${label}: matrixMatch missing`);
    return;
  }
  if (!VALID_TIERS.includes(score.matrixMatch.tier)) {
    failures.push(`${label}: invalid tier ${score.matrixMatch.tier}`);
  }
  if (!score.matrixMatch.evidenceSlug || score.matrixMatch.evidenceSlug.length === 0) {
    failures.push(`${label}: evidenceSlug empty`);
  }
  if (!score.narrativeRationale || score.narrativeRationale.trim().length === 0) {
    failures.push(`${label}: narrativeRationale empty`);
  }
}

// ---------------------------------------------------------------------------
// 1. Full cartesian sweep
// ---------------------------------------------------------------------------

const SWEEP_COMPLAINTS: readonly string[] = ALL_SCENARIOS.map(
  (s) => s.presentationKeywords[0],
);
const SWEEP_AGES = [8, 35, 72] as const;
const SWEEP_RED_FLAGS_ON: Partial<AIIERedFlags> = {
  suddenOnset: true,
  neurologicalDeficit: true,
};

describe("full cartesian sweep — every combination resolves with valid output", () => {
  for (const region of ALL_REGIONS) {
    it(
      `region ${region}: modality × complaint × red flags × age × prior imaging`,
      async () => {
        const failures: string[] = [];
        for (const modality of ALL_MODALITIES) {
          for (const complaint of SWEEP_COMPLAINTS) {
            for (const flagsOn of [false, true]) {
              for (const age of SWEEP_AGES) {
                for (const priorImaging of [false, true]) {
                  const label = `${region}/${modality}/"${complaint}"/flags=${flagsOn}/age=${age}/prior=${priorImaging}`;
                  const input = buildInput({
                    complaint,
                    bodyPart: REGION_BODY_PART[region],
                    modalityText: MODALITY_ORDER_TEXT[modality],
                    age,
                    redFlags: flagsOn ? SWEEP_RED_FLAGS_ON : undefined,
                    priorImaging,
                  });
                  let score: AIIEScore;
                  try {
                    score = await scoreOrder(input);
                  } catch (err) {
                    failures.push(`${label}: threw ${String(err)}`);
                    continue;
                  }
                  checkScoreInvariants(score, label, failures);
                  if (failures.length > 25) {
                    expect.fail(
                      `Aborting early, first failures:\n${failures.join("\n")}`,
                    );
                  }
                }
              }
            }
          }
        }
        expect(failures).toEqual([]);
      },
      120_000,
    );
  }
});

// ---------------------------------------------------------------------------
// 2. Adversarial inputs
// ---------------------------------------------------------------------------

describe("adversarial inputs — always resolve at a valid tier, never throw", () => {
  const lorem =
    "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ";
  const tenKLorem = lorem.repeat(Math.ceil(10_000 / lorem.length)).slice(0, 10_000);

  const adversarialCases: Array<{ name: string; spec: InputSpec }> = [
    {
      name: "all-empty strings",
      spec: { complaint: "", bodyPart: "", modalityText: "", age: 0 },
    },
    {
      name: "emoji complaint",
      spec: { complaint: "🤕💥🧠🚑", bodyPart: "🦴", modalityText: "🩻" },
    },
    {
      name: "10k-char lorem complaint",
      spec: { complaint: tenKLorem, bodyPart: "", modalityText: "" },
    },
    {
      name: "SQL-ish strings",
      spec: {
        complaint: "'; DROP TABLE ins_pa_history; --",
        bodyPart: "1=1 OR '' = ''",
        modalityText: "Robert'); DELETE FROM orders;",
      },
    },
    {
      name: "wrong-language text (dolor de cabeza)",
      spec: { complaint: "dolor de cabeza muy fuerte", bodyPart: "", modalityText: "" },
    },
    {
      name: "modality-only (CT)",
      spec: { complaint: "", bodyPart: "", modalityText: "CT" },
    },
    {
      name: "complaint-only (headache)",
      spec: { complaint: "headache", bodyPart: "", modalityText: "" },
    },
    {
      name: "contradictory: pregnancy=true at age 80",
      spec: {
        complaint: "rlq pain suspected appendicitis",
        bodyPart: "abdomen",
        modalityText: "CT",
        age: 80,
        pregnant: true,
      },
    },
  ];

  for (const { name, spec } of adversarialCases) {
    it(`${name} resolves at tier 4 or better`, async () => {
      const failures: string[] = [];
      const score = await scoreOrder(buildInput(spec));
      checkScoreInvariants(score, name, failures);
      expect(failures).toEqual([]);
      expect(VALID_TIERS).toContain(score.matrixMatch?.tier);

      const resolved = resolveRating(normalizeOrderContext(buildInput(spec)));
      expect(resolved.error).toBeNull();
      expect(resolved.data.rating.rating).toBeGreaterThanOrEqual(1);
      expect(resolved.data.rating.rating).toBeLessThanOrEqual(9);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Clinical correctness golden set
// ---------------------------------------------------------------------------

interface GoldenCase {
  name: string;
  spec: InputSpec;
  /** Matrix modality the order text must resolve to (rating is for this modality). */
  requested: Modality;
  minRating: number;
  maxRating: number;
  scenarioId: string;
  /** Expected preferred (first-line) modality of the matched variant. */
  preferred?: Modality;
  /** Expects an expedite/stat signal in the rationale. */
  stat?: boolean;
}

const f = (overrides: Partial<AIIERedFlags>): Partial<AIIERedFlags> => overrides;

const GOLDEN_CASES: GoldenCase[] = [
  // --- Lumbar spine ---
  {
    name: "uncomplicated low back pain 2 weeks + MRI → usually not appropriate",
    spec: { complaint: "low back pain", bodyPart: "lumbar spine", modalityText: "MRI", duration: "2 weeks", age: 38 },
    requested: "mri", minRating: 1, maxRating: 3, scenarioId: "low-back-pain",
  },
  {
    name: "uncomplicated low back pain 2 weeks + CT → usually not appropriate",
    spec: { complaint: "low back pain", bodyPart: "lumbar spine", modalityText: "CT", duration: "2 weeks", age: 38 },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "low-back-pain",
  },
  {
    name: "radiculopathy >6 weeks after conservative care + MRI → appropriate",
    spec: { complaint: "low back pain with sciatica", bodyPart: "lumbar spine", modalityText: "MRI", duration: "8 weeks", age: 45, conservativeTried: true },
    requested: "mri", minRating: 7, maxRating: 9, scenarioId: "low-back-pain", preferred: "mri",
  },
  {
    name: "radiculopathy >6 weeks + XR → limited value",
    spec: { complaint: "low back pain with sciatica", bodyPart: "lumbar spine", modalityText: "X-ray", duration: "8 weeks", age: 45, conservativeTried: true },
    requested: "xr", minRating: 1, maxRating: 4, scenarioId: "low-back-pain",
  },
  {
    name: "cauda equina syndrome + MRI lumbar → emergent",
    spec: { complaint: "low back pain with saddle anesthesia and urinary retention", bodyPart: "lumbar spine", modalityText: "MRI", age: 42, redFlags: f({ bladderBowelDysfunction: true, neurologicalDeficit: true }) },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "low-back-pain", preferred: "mri",
  },
  {
    name: "cauda equina syndrome + CT → only when MRI unavailable",
    spec: { complaint: "low back pain with saddle anesthesia and urinary retention", bodyPart: "lumbar spine", modalityText: "CT", age: 42, redFlags: f({ bladderBowelDysfunction: true, neurologicalDeficit: true }) },
    requested: "ct", minRating: 4, maxRating: 6, scenarioId: "low-back-pain",
  },
  {
    name: "back pain with cancer history + MRI → metastatic workup",
    spec: { complaint: "low back pain", bodyPart: "lumbar spine", modalityText: "MRI", age: 61, redFlags: f({ cancerHistory: true }) },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "low-back-pain", preferred: "mri",
  },
  {
    name: "suspected spinal infection with fever and IVDU + MRI contrast → preferred",
    spec: { complaint: "low back pain with fevers", bodyPart: "lumbar spine", modalityText: "MRI with contrast", age: 34, redFlags: f({ fever: true, ivDrugUse: true }) },
    requested: "mri_contrast", minRating: 8, maxRating: 9, scenarioId: "low-back-pain", preferred: "mri_contrast",
  },
  {
    name: "osteoporotic fragility fracture + MRI → occult compression fracture",
    spec: { complaint: "low back pain", bodyPart: "lumbar spine", modalityText: "MRI", age: 78, redFlags: f({ osteoporosis: true, trauma: true }) },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "low-back-pain", preferred: "mri",
  },
  {
    name: "lumbar trauma with suspected fracture + CT → appropriate",
    spec: { complaint: "low back pain", bodyPart: "lumbar spine", modalityText: "CT", age: 30, redFlags: f({ trauma: true }) },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "low-back-pain", preferred: "ct",
  },

  // --- Cervical spine ---
  {
    name: "uncomplicated atraumatic neck pain + MRI → not indicated",
    spec: { complaint: "neck pain and stiff neck", bodyPart: "cervical spine", modalityText: "MRI", age: 40 },
    requested: "mri", minRating: 1, maxRating: 3, scenarioId: "neck-pain",
  },
  {
    name: "cervical myelopathy signs + MRI → indicated",
    spec: { complaint: "neck pain with myelopathy", bodyPart: "cervical spine", modalityText: "MRI", age: 58, redFlags: f({ neurologicalDeficit: true, progressiveSymptoms: true }) },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "neck-pain", preferred: "mri",
  },
  {
    name: "cervical trauma failing low-risk criteria + CT → indicated",
    spec: { complaint: "neck pain", bodyPart: "cervical spine", modalityText: "CT", age: 35, redFlags: f({ trauma: true }) },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "neck-pain", preferred: "ct",
  },
  {
    name: "cervical trauma meeting clearance criteria + CT → usually not appropriate",
    spec: { complaint: "neck pain", bodyPart: "cervical spine", modalityText: "CT", age: 35, redFlags: f({ trauma: true }), conservativeTried: true },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "neck-pain",
  },

  // --- Thoracic spine ---
  {
    name: "uncomplicated thoracic back pain + MRI → not first-line",
    spec: { complaint: "mid back pain", bodyPart: "thoracic spine", modalityText: "MRI", age: 44 },
    requested: "mri", minRating: 1, maxRating: 3, scenarioId: "thoracic-back-pain",
  },
  {
    name: "thoracic pain with systemic red flags + MRI → indicated",
    spec: { complaint: "mid back pain", bodyPart: "thoracic spine", modalityText: "MRI", age: 66, redFlags: f({ cancerHistory: true, fever: true, weightLoss: true }) },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "thoracic-back-pain", preferred: "mri",
  },
  {
    name: "thoracic trauma + CT → appropriate",
    spec: { complaint: "mid back pain", bodyPart: "thoracic spine", modalityText: "CT", age: 50, redFlags: f({ trauma: true }) },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "thoracic-back-pain", preferred: "ct",
  },

  // --- Head / brain ---
  {
    name: "thunderclap headache + CT head → first-line for SAH",
    spec: { complaint: "thunderclap headache, worst headache of life", bodyPart: "head", modalityText: "CT", age: 39, redFlags: f({ suddenOnset: true }) },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "acute-headache", preferred: "ct",
  },
  {
    name: "thunderclap headache + MRI → less available emergently",
    spec: { complaint: "thunderclap headache, worst headache of life", bodyPart: "head", modalityText: "MRI", age: 39, redFlags: f({ suddenOnset: true }) },
    requested: "mri", minRating: 4, maxRating: 6, scenarioId: "acute-headache",
  },
  {
    name: "headache with focal neurologic deficit + MRI → preferred",
    spec: { complaint: "new headache", bodyPart: "head", modalityText: "MRI", age: 47, redFlags: f({ neurologicalDeficit: true }) },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "acute-headache", preferred: "mri",
  },
  {
    name: "chronic stable headache 3 months + CT → Choosing Wisely no",
    spec: { complaint: "headache", bodyPart: "head", modalityText: "CT", duration: "3 months", age: 36 },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "acute-headache",
  },
  {
    name: "new headache after age 50 + MRI → exclude secondary causes",
    spec: { complaint: "new headache", bodyPart: "head", modalityText: "MRI", age: 57, redFlags: f({ ageOver50: true }) },
    requested: "mri", minRating: 7, maxRating: 9, scenarioId: "acute-headache", preferred: "mri",
  },
  {
    name: "adult head trauma high-risk + CT → indicated",
    spec: { complaint: "head injury after fall with loss of consciousness", bodyPart: "head", modalityText: "CT", age: 41, redFlags: f({ trauma: true, neurologicalDeficit: true }) },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "head-trauma", preferred: "ct",
  },
  {
    name: "adult minor head trauma low-risk + CT → usually not appropriate",
    spec: { complaint: "minor head injury after fall", bodyPart: "head", modalityText: "CT", age: 29, redFlags: f({ trauma: true }) },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "head-trauma",
  },
  {
    name: "pediatric head trauma failing PECARN + CT → indicated",
    spec: { complaint: "pediatric head injury after fall", bodyPart: "head", modalityText: "CT", age: 7, redFlags: f({ trauma: true, ageUnder18: true }) },
    requested: "ct", minRating: 6, maxRating: 8, scenarioId: "head-trauma", preferred: "ct",
  },
  {
    name: "pediatric head trauma low-risk by PECARN + CT → usually not appropriate",
    spec: { complaint: "pediatric head injury after fall", bodyPart: "head", modalityText: "CT", age: 7, redFlags: f({ trauma: true, ageUnder18: true }), conservativeTried: true },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "head-trauma",
  },
  {
    name: "infant head trauma under 2 + CT → often indicated",
    spec: { complaint: "infant head injury after fall", bodyPart: "head", modalityText: "CT", age: 1, redFlags: f({ trauma: true, ageUnder18: true }) },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "head-trauma", preferred: "ct",
  },
  {
    name: "acute stroke under 4.5h + CT → mandatory before thrombolysis",
    spec: { complaint: "stroke alert with facial droop and aphasia", bodyPart: "brain", modalityText: "CT", duration: "today", age: 68, redFlags: f({ suddenOnset: true }) },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "suspected-stroke", preferred: "ct",
  },
  {
    name: "acute stroke under 4.5h + CTA → LVO triage",
    spec: { complaint: "stroke alert with facial droop and aphasia", bodyPart: "brain", modalityText: "CTA", duration: "today", age: 68, redFlags: f({ suddenOnset: true }) },
    requested: "cta", minRating: 8, maxRating: 9, scenarioId: "suspected-stroke",
  },
  {
    name: "wake-up stroke + MRI → DWI defines infarct age",
    spec: { complaint: "woke up with weakness, wake up stroke", bodyPart: "brain", modalityText: "MRI", age: 71, redFlags: f({ suddenOnset: true }) },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "suspected-stroke", preferred: "mri",
  },
  {
    name: "first unprovoked seizure + MRI → structural workup",
    spec: { complaint: "first seizure, unprovoked seizures", bodyPart: "brain", modalityText: "MRI", age: 33 },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "seizure", preferred: "mri",
  },
  {
    name: "breakthrough seizure with new features + MRI → repeat imaging",
    spec: { complaint: "breakthrough seizure", bodyPart: "brain", modalityText: "MRI", age: 27, redFlags: f({ progressiveSymptoms: true }) },
    requested: "mri", minRating: 7, maxRating: 9, scenarioId: "seizure", preferred: "mri",
  },

  // --- Head / face / neck ---
  {
    name: "uncomplicated acute sinusitis + CT → usually not appropriate",
    spec: { complaint: "acute sinusitis with facial pressure", bodyPart: "face", modalityText: "CT", age: 31 },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "sinusitis",
  },
  {
    name: "complicated sinusitis with orbital concern + CT → appropriate",
    spec: { complaint: "sinusitis with eye swelling", bodyPart: "face", modalityText: "CT", age: 24, redFlags: f({ fever: true, neurologicalDeficit: true }) },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "sinusitis", preferred: "ct",
  },
  {
    name: "thyroid nodule + US → first-line characterization",
    spec: { complaint: "thyroid nodule found on exam", bodyPart: "neck", modalityText: "Ultrasound", age: 49 },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "thyroid-nodule", preferred: "us",
  },
  {
    name: "thyroid nodule + CT → not first-line",
    spec: { complaint: "thyroid nodule found on exam", bodyPart: "neck", modalityText: "CT", age: 49 },
    requested: "ct", minRating: 1, maxRating: 4, scenarioId: "thyroid-nodule",
  },
  {
    name: "persistent adult neck mass + CT → appropriate",
    spec: { complaint: "neck mass with enlarged lymph node", bodyPart: "neck", modalityText: "CT", duration: "3 weeks", age: 52 },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "neck-mass-adult", preferred: "ct",
  },
  {
    name: "neck mass with systemic red flags + CT contrast → indicated",
    spec: { complaint: "neck mass with enlarged lymph node", bodyPart: "neck", modalityText: "CT with contrast", age: 63, redFlags: f({ weightLoss: true, cancerHistory: true, fever: true }) },
    requested: "ct_contrast", minRating: 8, maxRating: 9, scenarioId: "neck-mass-adult", preferred: "ct_contrast",
  },

  // --- Chest ---
  {
    name: "sudden chest pain ACS rule-out + CTA → appropriate pathway",
    spec: { complaint: "sudden crushing chest pain", bodyPart: "chest", modalityText: "CTA", age: 54, redFlags: f({ suddenOnset: true }) },
    requested: "cta", minRating: 7, maxRating: 9, scenarioId: "acute-chest-pain", preferred: "cta",
  },
  {
    name: "PE low pretest with negative d-dimer + CTA → usually not appropriate",
    spec: { complaint: "pleuritic chest pain, low PE suspicion, d-dimer negative", bodyPart: "chest", modalityText: "CTA", age: 35, conservativeTried: true },
    requested: "cta", minRating: 1, maxRating: 4, scenarioId: "acute-chest-pain",
  },
  {
    name: "PE high pretest + CTA → indicated, expedite",
    spec: { complaint: "pleuritic chest pain with hypoxia, suspected pulmonary embolism", bodyPart: "chest", modalityText: "CTA", age: 59, redFlags: f({ suddenOnset: true, neurologicalDeficit: true }) },
    requested: "cta", minRating: 8, maxRating: 9, scenarioId: "acute-chest-pain", preferred: "cta", stat: true,
  },
  {
    name: "chronic cough beyond 8 weeks + XR → appropriate initial imaging",
    spec: { complaint: "chronic cough", bodyPart: "chest", modalityText: "X-ray", duration: "3 months", age: 45 },
    requested: "xr", minRating: 6, maxRating: 8, scenarioId: "chronic-cough", preferred: "xr",
  },
  {
    name: "chronic cough with weight loss + CT → malignancy concern",
    spec: { complaint: "chronic cough", bodyPart: "chest", modalityText: "CT", age: 62, redFlags: f({ weightLoss: true }) },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "chronic-cough", preferred: "ct",
  },
  {
    name: "hemoptysis + CT → parenchymal and airway sources",
    spec: { complaint: "coughing blood, hemoptysis", bodyPart: "chest", modalityText: "CT", age: 48 },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "hemoptysis", preferred: "ct",
  },
  {
    name: "massive hemoptysis + CTA → localize bleeding before intervention",
    spec: { complaint: "massive hemoptysis, coughing blood", bodyPart: "chest", modalityText: "CTA", age: 56, redFlags: f({ suddenOnset: true }) },
    requested: "cta", minRating: 8, maxRating: 9, scenarioId: "hemoptysis", preferred: "cta",
  },
  {
    name: "lung cancer screening eligible 60yo smoker + low-dose CT → appropriate",
    spec: { complaint: "lung cancer screening, 30 pack years", bodyPart: "chest", modalityText: "CT", age: 60 },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "lung-cancer-screening", preferred: "ct",
  },
  {
    name: "lung cancer screening at age 35 + CT → outside criteria",
    spec: { complaint: "lung cancer screening, 30 pack years", bodyPart: "chest", modalityText: "CT", age: 35 },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "lung-cancer-screening",
  },

  // --- Cardiac ---
  {
    name: "pre-op screening CXR asymptomatic → usually not appropriate",
    spec: { complaint: "routine pre-op surgical clearance, asymptomatic", bodyPart: "chest", modalityText: "X-ray", age: 44 },
    requested: "xr", minRating: 1, maxRating: 3, scenarioId: "pre-op-clearance",
  },
  {
    name: "pre-op high-risk surgery with symptoms + echo → appropriate",
    spec: { complaint: "pre-op cardiac clearance before high-risk surgery", bodyPart: "heart", modalityText: "Echocardiogram", age: 72, redFlags: f({ progressiveSymptoms: true, ageOver50: true }) },
    requested: "us", minRating: 7, maxRating: 9, scenarioId: "pre-op-clearance", preferred: "us",
  },
  {
    name: "stable chest pain low-intermediate risk + CCTA → appropriate",
    spec: { complaint: "stable chest pain with exertion", bodyPart: "heart", modalityText: "CTA", age: 50 },
    requested: "cta", minRating: 7, maxRating: 9, scenarioId: "stable-chest-pain", preferred: "cta",
  },
  {
    name: "stable chest pain over 50 functional pathway + nuclear stress → appropriate",
    spec: { complaint: "stable chest pain with exertion", bodyPart: "heart", modalityText: "Nuclear medicine scan", age: 70, redFlags: f({ ageOver50: true }) },
    requested: "nm", minRating: 7, maxRating: 9, scenarioId: "stable-chest-pain", preferred: "nm",
  },
  {
    name: "new heart failure + echocardiogram → first-line",
    spec: { complaint: "new heart failure with volume overload", bodyPart: "heart", modalityText: "Echocardiogram", age: 64 },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "new-heart-failure", preferred: "us",
  },

  // --- Abdomen ---
  {
    name: "adult suspected appendicitis + CT → first-line",
    spec: { complaint: "rlq pain, suspected appendicitis", bodyPart: "abdomen", modalityText: "CT", age: 40 },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "rlq-appendicitis", preferred: "ct",
  },
  {
    name: "first trimester pregnancy + suspected appendicitis: US → first-line",
    spec: { complaint: "rlq pain, suspected appendicitis", bodyPart: "abdomen", modalityText: "Ultrasound", age: 28, pregnant: true },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "rlq-appendicitis", preferred: "us",
  },
  {
    name: "first trimester pregnancy + suspected appendicitis: CT → avoided",
    spec: { complaint: "rlq pain, suspected appendicitis", bodyPart: "abdomen", modalityText: "CT", age: 28, pregnant: true },
    requested: "ct", minRating: 1, maxRating: 4, scenarioId: "rlq-appendicitis",
  },
  {
    name: "pediatric suspected appendicitis + US → radiation-sparing first-line",
    spec: { complaint: "rlq pain, suspected appendicitis", bodyPart: "abdomen", modalityText: "Ultrasound", age: 10, redFlags: f({ ageUnder18: true }) },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "rlq-appendicitis", preferred: "us",
  },
  {
    name: "suspected cholecystitis + US → first-line",
    spec: { complaint: "ruq pain, gallbladder, positive murphy sign", bodyPart: "abdomen", modalityText: "Ultrasound", age: 46 },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "ruq-cholecystitis", preferred: "us",
  },
  {
    name: "suspected cholecystitis + CT → secondary",
    spec: { complaint: "ruq pain, gallbladder, positive murphy sign", bodyPart: "abdomen", modalityText: "CT", age: 46 },
    requested: "ct", minRating: 1, maxRating: 4, scenarioId: "ruq-cholecystitis",
  },
  {
    name: "uncomplicated pancreatitis + CT → usually not appropriate",
    spec: { complaint: "epigastric pain, acute pancreatitis, lipase elevated", bodyPart: "abdomen", modalityText: "CT", age: 50 },
    requested: "ct", minRating: 1, maxRating: 3, scenarioId: "epigastric-pancreatitis",
  },
  {
    name: "severe pancreatitis with suspected necrosis + CT contrast → appropriate",
    spec: { complaint: "epigastric pain, acute pancreatitis, lipase elevated", bodyPart: "abdomen", modalityText: "CT with contrast", age: 50, redFlags: f({ fever: true, progressiveSymptoms: true }) },
    requested: "ct_contrast", minRating: 7, maxRating: 9, scenarioId: "epigastric-pancreatitis", preferred: "ct_contrast",
  },
  {
    name: "suspected small bowel obstruction + CT → first-line",
    spec: { complaint: "vomiting with distended abdomen, small bowel obstruction", bodyPart: "abdomen", modalityText: "CT", age: 67 },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "suspected-sbo", preferred: "ct",
  },
  {
    name: "uncomplicated diverticulitis + CT → appropriate",
    spec: { complaint: "llq pain, suspected diverticulitis", bodyPart: "abdomen", modalityText: "CT", age: 58 },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "diverticulitis", preferred: "ct",
  },
  {
    name: "complicated diverticulitis immunocompromised + CT contrast → indicated",
    spec: { complaint: "llq pain, suspected diverticulitis", bodyPart: "abdomen", modalityText: "CT with contrast", age: 61, redFlags: f({ fever: true, immunocompromised: true }) },
    requested: "ct_contrast", minRating: 8, maxRating: 9, scenarioId: "diverticulitis", preferred: "ct_contrast",
  },
  {
    name: "stable blunt abdominal trauma + CT → indicated",
    spec: { complaint: "blunt abdominal trauma with seatbelt sign", bodyPart: "abdomen", modalityText: "CT", age: 33, redFlags: f({ trauma: true }) },
    requested: "ct", minRating: 8, maxRating: 9, scenarioId: "blunt-abdominal-trauma", preferred: "ct",
  },
  {
    name: "unstable blunt abdominal trauma + FAST US → expedite",
    spec: { complaint: "blunt abdominal trauma, hypotensive and unstable", bodyPart: "abdomen", modalityText: "FAST ultrasound", age: 33, redFlags: f({ trauma: true, suddenOnset: true }) },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "blunt-abdominal-trauma", preferred: "us", stat: true,
  },

  // --- Pelvis ---
  {
    name: "female pelvic pain + US → first-line",
    spec: { complaint: "pelvic pain with adnexal pain", bodyPart: "pelvis", modalityText: "Ultrasound", age: 32 },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "pelvic-pain-female", preferred: "us",
  },
  {
    name: "female pelvic pain + CT → not first-line (gonadal radiation)",
    spec: { complaint: "pelvic pain with adnexal pain", bodyPart: "pelvis", modalityText: "CT", age: 32 },
    requested: "ct", minRating: 1, maxRating: 4, scenarioId: "pelvic-pain-female",
  },
  {
    name: "suspected ectopic pregnancy + US → first-line, expedite",
    spec: { complaint: "sudden pelvic pain, positive beta hcg, suspected ectopic pregnancy", bodyPart: "pelvis", modalityText: "Ultrasound", age: 27, pregnant: true, redFlags: f({ suddenOnset: true }) },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "pelvic-pain-female", preferred: "us", stat: true,
  },
  {
    name: "postmenopausal bleeding + US → endometrial evaluation",
    spec: { complaint: "pelvic pain and postmenopausal bleeding", bodyPart: "pelvis", modalityText: "Ultrasound", age: 62, redFlags: f({ ageOver50: true }) },
    requested: "us", minRating: 7, maxRating: 9, scenarioId: "pelvic-pain-female", preferred: "us",
  },

  // --- GU / renal ---
  {
    name: "renal colic + low-dose CT → appropriate",
    spec: { complaint: "acute flank pain, suspected kidney stone", bodyPart: "kidney", modalityText: "CT", age: 35 },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "renal-colic", preferred: "ct",
  },
  {
    name: "renal colic in pregnancy + US → radiation-sparing first-line",
    spec: { complaint: "acute flank pain, suspected kidney stone", bodyPart: "kidney", modalityText: "Ultrasound", age: 30, pregnant: true },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "renal-colic", preferred: "us",
  },
  {
    name: "recurrent renal colic in adolescent + US → preferred",
    spec: { complaint: "recurrent flank pain, kidney stone history", bodyPart: "kidney", modalityText: "Ultrasound", age: 16, redFlags: f({ ageUnder18: true }) },
    requested: "us", minRating: 7, maxRating: 9, scenarioId: "renal-colic", preferred: "us",
  },
  {
    name: "microscopic hematuria + CT urography → appropriate after urologic eval",
    spec: { complaint: "microscopic hematuria on urinalysis", bodyPart: "kidney", modalityText: "CT", age: 55 },
    requested: "ct", minRating: 6, maxRating: 8, scenarioId: "hematuria", preferred: "ct",
  },
  {
    name: "gross hematuria + CT urography → indicated",
    spec: { complaint: "gross hematuria, blood in urine", bodyPart: "kidney", modalityText: "CT", age: 60, redFlags: f({ suddenOnset: true }) },
    requested: "ct", minRating: 7, maxRating: 9, scenarioId: "hematuria", preferred: "ct",
  },
  {
    name: "acute scrotal pain + US Doppler → first-line",
    spec: { complaint: "acute scrotal pain", bodyPart: "scrotum", modalityText: "Doppler ultrasound", age: 22, sex: "male" },
    requested: "us_doppler", minRating: 8, maxRating: 9, scenarioId: "scrotal-pain", preferred: "us_doppler",
  },
  {
    name: "testicular torsion + US Doppler → 9 with stat signal",
    spec: { complaint: "sudden severe testicular pain, suspected torsion", bodyPart: "scrotum", modalityText: "Doppler ultrasound", age: 15, sex: "male", redFlags: f({ suddenOnset: true, ageUnder18: true }) },
    requested: "us_doppler", minRating: 9, maxRating: 9, scenarioId: "scrotal-pain", preferred: "us_doppler", stat: true,
  },

  // --- MSK upper ---
  {
    name: "chronic rotator cuff after failed conservative care + MRI → appropriate",
    spec: { complaint: "shoulder pain, rotator cuff syndrome", bodyPart: "shoulder", modalityText: "MRI", duration: "8 weeks", age: 53, conservativeTried: true },
    requested: "mri", minRating: 7, maxRating: 9, scenarioId: "shoulder-pain", preferred: "mri",
  },
  {
    name: "chronic rotator cuff + US → cost-effective alternative",
    spec: { complaint: "shoulder pain, rotator cuff syndrome", bodyPart: "shoulder", modalityText: "Ultrasound", duration: "8 weeks", age: 53 },
    requested: "us", minRating: 7, maxRating: 9, scenarioId: "shoulder-pain", preferred: "us",
  },
  {
    name: "acute shoulder trauma + XR → first-line",
    spec: { complaint: "shoulder injury after fall", bodyPart: "shoulder", modalityText: "X-ray", age: 36, redFlags: f({ trauma: true }) },
    requested: "xr", minRating: 8, maxRating: 9, scenarioId: "shoulder-pain", preferred: "xr",
  },

  // --- MSK lower ---
  {
    name: "acute knee trauma meeting Ottawa criteria + XR → indicated",
    spec: { complaint: "knee injury, knee pain", bodyPart: "knee", modalityText: "X-ray", age: 28, redFlags: f({ trauma: true }) },
    requested: "xr", minRating: 7, maxRating: 9, scenarioId: "knee-pain", preferred: "xr",
  },
  {
    name: "knee trauma Ottawa-negative + XR → usually not appropriate",
    spec: { complaint: "knee injury, knee pain", bodyPart: "knee", modalityText: "X-ray", age: 28, redFlags: f({ trauma: true }), conservativeTried: true },
    requested: "xr", minRating: 1, maxRating: 3, scenarioId: "knee-pain",
  },
  {
    name: "suspected meniscal tear after negative XR + MRI → appropriate",
    spec: { complaint: "knee pain with locking, suspected meniscus tear", bodyPart: "knee", modalityText: "MRI", age: 41, priorImaging: true, conservativeTried: true },
    requested: "mri", minRating: 7, maxRating: 9, scenarioId: "knee-pain", preferred: "mri",
  },
  {
    name: "chronic knee osteoarthritis + MRI → usually not appropriate",
    spec: { complaint: "chronic knee pain, osteoarthritis", bodyPart: "knee", modalityText: "MRI", duration: "6 months", age: 66 },
    requested: "mri", minRating: 1, maxRating: 3, scenarioId: "knee-pain",
  },
  {
    name: "suspected occult hip fracture after negative XR + MRI → indicated",
    spec: { complaint: "hip pain after fall, suspected occult fracture", bodyPart: "hip", modalityText: "MRI", age: 81, redFlags: f({ osteoporosis: true, trauma: true }), priorImaging: true },
    requested: "mri", minRating: 8, maxRating: 9, scenarioId: "hip-pain", preferred: "mri",
  },
  {
    name: "acute hip trauma + XR → first-line",
    spec: { complaint: "hip pain after fall", bodyPart: "hip", modalityText: "X-ray", age: 79, redFlags: f({ trauma: true }) },
    requested: "xr", minRating: 8, maxRating: 9, scenarioId: "hip-pain", preferred: "xr",
  },
  {
    name: "ankle trauma meeting Ottawa criteria + XR → indicated",
    spec: { complaint: "twisted ankle, ankle pain", bodyPart: "ankle", modalityText: "X-ray", age: 25, redFlags: f({ trauma: true }) },
    requested: "xr", minRating: 7, maxRating: 9, scenarioId: "ankle-pain", preferred: "xr",
  },
  {
    name: "ankle trauma Ottawa-negative + XR → usually not appropriate",
    spec: { complaint: "twisted ankle, ankle pain", bodyPart: "ankle", modalityText: "X-ray", age: 25, redFlags: f({ trauma: true }), conservativeTried: true },
    requested: "xr", minRating: 1, maxRating: 3, scenarioId: "ankle-pain",
  },

  // --- Vascular ---
  {
    name: "suspected DVT + venous duplex → first-line",
    spec: { complaint: "unilateral leg swelling and calf pain, suspected dvt", bodyPart: "veins", modalityText: "Venous duplex ultrasound", age: 57 },
    requested: "us_doppler", minRating: 8, maxRating: 9, scenarioId: "suspected-dvt", preferred: "us_doppler",
  },
  {
    name: "symptomatic carotid stenosis + duplex → first-line",
    spec: { complaint: "tia symptoms with carotid bruit", bodyPart: "carotid", modalityText: "Carotid duplex ultrasound", age: 69, redFlags: f({ suddenOnset: true }) },
    requested: "us_doppler", minRating: 8, maxRating: 9, scenarioId: "carotid-stenosis", preferred: "us_doppler",
  },
  {
    name: "symptomatic carotid stenosis + CTA → confirmatory",
    spec: { complaint: "tia symptoms with carotid bruit", bodyPart: "carotid", modalityText: "CTA", age: 69, redFlags: f({ suddenOnset: true }) },
    requested: "cta", minRating: 7, maxRating: 9, scenarioId: "carotid-stenosis",
  },
  {
    name: "AAA screening eligible age 70 + US → appropriate",
    spec: { complaint: "aaa screening, former smoker", bodyPart: "aorta", modalityText: "Ultrasound", age: 70, sex: "male" },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "aaa-screening", preferred: "us",
  },
  {
    name: "known AAA surveillance + US → standard interval imaging",
    spec: { complaint: "known abdominal aortic aneurysm surveillance", bodyPart: "aorta", modalityText: "Ultrasound", age: 80, sex: "male", priorImaging: true },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "aaa-screening", preferred: "us",
  },

  // --- Breast ---
  {
    name: "screening mammography average risk age 52 → appropriate",
    spec: { complaint: "annual screening mammogram", bodyPart: "breast", modalityText: "Mammography", age: 52 },
    requested: "mammo", minRating: 8, maxRating: 9, scenarioId: "breast-screening", preferred: "mammo",
  },
  {
    name: "screening with US instead of mammo → not a replacement",
    spec: { complaint: "annual screening mammogram", bodyPart: "breast", modalityText: "Ultrasound", age: 52 },
    requested: "us", minRating: 1, maxRating: 4, scenarioId: "breast-screening",
  },
  {
    name: "high-risk supplemental breast MRI → appropriate",
    spec: { complaint: "high risk breast cancer screening", bodyPart: "breast", modalityText: "MRI", age: 44, redFlags: f({ cancerHistory: true, immunocompromised: true }) },
    requested: "mri", minRating: 7, maxRating: 9, scenarioId: "breast-screening", preferred: "mri",
  },
  {
    name: "palpable breast lump age 45 + mammo → appropriate",
    spec: { complaint: "palpable breast lump, dominant mass", bodyPart: "breast", modalityText: "Mammography", age: 45 },
    requested: "mammo", minRating: 8, maxRating: 9, scenarioId: "palpable-lump", preferred: "mammo",
  },
  {
    name: "palpable breast lump age 24 + US → first-line under 30",
    spec: { complaint: "palpable breast lump", bodyPart: "breast", modalityText: "Ultrasound", age: 24 },
    requested: "us", minRating: 8, maxRating: 9, scenarioId: "palpable-lump", preferred: "us",
  },
];

/** Looks up the matched variant in the matrix (default variant for tier 2). */
function matchedVariant(resolved: ResolvedRating): ScenarioVariant | null {
  const scenario = ALL_SCENARIOS.find((s) => s.id === resolved.scenario.id);
  if (!scenario) {
    return null;
  }
  if (resolved.variant) {
    return scenario.variants.find((v) => v.id === resolved.variant?.id) ?? null;
  }
  return scenario.variants.find((v) => v.isDefault === true) ?? scenario.variants[0];
}

describe("clinical correctness golden set", () => {
  it("has at least 60 named cases", () => {
    expect(GOLDEN_CASES.length).toBeGreaterThanOrEqual(60);
  });

  for (const golden of GOLDEN_CASES) {
    it(golden.name, () => {
      const ctx = normalizeOrderContext(buildInput(golden.spec));
      const resolved = resolveRating(ctx).data;

      // Golden cases must never fall through to region/conservative defaults;
      // a fall-through means the matrix has a data gap.
      expect(["exact_variant", "scenario_default"]).toContain(resolved.matchTier);
      expect(resolved.scenario.id).toBe(golden.scenarioId);
      expect(resolved.rating.modality).toBe(golden.requested);
      expect(resolved.rating.rating).toBeGreaterThanOrEqual(golden.minRating);
      expect(resolved.rating.rating).toBeLessThanOrEqual(golden.maxRating);
      expect(resolved.rating.evidenceSlug.length).toBeGreaterThan(0);

      if (golden.preferred) {
        const variant = matchedVariant(resolved);
        expect(variant).not.toBeNull();
        const preferredRating = variant?.ratings.find((r) => r.isPreferred);
        expect(preferredRating?.modality).toBe(golden.preferred);
      }
      if (golden.stat) {
        expect(resolved.rating.rationale).toMatch(/expedite/i);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("same input scored 50 times yields identical output", async () => {
    const input = buildInput({
      complaint: "thunderclap headache, worst headache of life",
      bodyPart: "head",
      modalityText: "CT",
      age: 39,
      redFlags: f({ suddenOnset: true }),
    });
    const first = await scoreOrder(input);
    for (let i = 0; i < 49; i += 1) {
      const next = await scoreOrder(input);
      expect(next).toEqual(first);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Performance
// ---------------------------------------------------------------------------

/** Deterministic 32-bit PRNG for reproducible random sweep sampling. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("performance", () => {
  it(
    "scores 1,000 random sweep inputs in under 2 seconds",
    async () => {
      const rng = mulberry32(0xa11e);
      const pick = <T,>(items: readonly T[]): T =>
        items[Math.floor(rng() * items.length)];

      const inputs = Array.from({ length: 1000 }, () =>
        buildInput({
          complaint: pick(SWEEP_COMPLAINTS),
          bodyPart: REGION_BODY_PART[pick(ALL_REGIONS)],
          modalityText: MODALITY_ORDER_TEXT[pick(ALL_MODALITIES)],
          age: pick(SWEEP_AGES),
          redFlags: rng() < 0.5 ? SWEEP_RED_FLAGS_ON : undefined,
          priorImaging: rng() < 0.5,
        }),
      );

      const start = performance.now();
      for (const input of inputs) {
        await scoreOrder(input);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000);
    },
    30_000,
  );
});
