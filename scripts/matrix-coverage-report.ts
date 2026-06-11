/**
 * AIIE Clinical Knowledge Matrix coverage report (run with: npm run matrix:coverage).
 *
 * Prints scenario/variant/rating counts, per-region coverage, and the tier
 * distribution of a keyword-driven resolution sweep (every scenario keyword,
 * probed with the scenario's region context and preferred modality, the way a
 * real imaging order arrives). Exits non-zero when tier-3/4 (region default /
 * conservative default) resolutions exceed 15% of the keyword-driven sweep —
 * that budget breach means matrix keywords or candidate scoring regressed.
 */

import {
  ALL_SCENARIOS,
  MATRIX_VERSION,
  normalizeOrderContext,
  resolveRating,
} from "@/lib/aiie/knowledge-matrix";
import type {
  BodyRegion,
  MatchTier,
  Modality,
} from "@/lib/aiie/knowledge-matrix";
import type { AIIEInput, AIIERedFlags } from "@/lib/types/aiie";

const TIER_3_4_BUDGET = 0.15;

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

const TIERS: readonly MatchTier[] = [
  "exact_variant",
  "scenario_default",
  "region_default",
  "conservative_default",
];

/** Builds an all-false red-flag set. */
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

/**
 * Builds a minimal AIIE input for a keyword probe.
 *
 * @param complaint - Presenting complaint text (one matrix keyword).
 * @param bodyPart - Body-part order text ("" probes without region context).
 * @param modalityText - Requested modality order text.
 */
function buildProbe(
  complaint: string,
  bodyPart: string,
  modalityText: string,
): AIIEInput {
  const redFlags = emptyRedFlags();
  const procedure = `${modalityText} ${bodyPart}`.trim();
  return {
    patient: { age: 40, sex: "female" },
    clinicalFactors: {
      chiefComplaint: complaint,
      duration: "",
      symptoms: [],
      redFlags,
      priorImaging: false,
      conservativeManagementTried: false,
    },
    order: { modality: modalityText, bodyPart, procedure },
    age: 40,
    sex: "female",
    chiefComplaint: complaint,
    duration: "",
    symptoms: [],
    redFlags,
    priorImaging: false,
    conservativeManagementTried: false,
    requestedModality: modalityText,
    requestedProcedure: procedure,
  };
}

/** Preferred-modality order text for a scenario's default variant. */
function preferredModalityText(scenarioId: string): string {
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId);
  const variant =
    scenario?.variants.find((v) => v.isDefault === true) ?? scenario?.variants[0];
  const preferred =
    variant?.ratings.find((r) => r.isPreferred) ?? variant?.ratings[0];
  return preferred ? MODALITY_ORDER_TEXT[preferred.modality] : "";
}

/**
 * Resolves every scenario presentation keyword and tallies match tiers.
 *
 * @param withRegionContext - When true, probes include the scenario's region
 *   body part (the realistic order shape); when false, keyword text only.
 */
function runKeywordSweep(withRegionContext: boolean): Record<MatchTier, number> {
  const tally: Record<MatchTier, number> = {
    exact_variant: 0,
    scenario_default: 0,
    region_default: 0,
    conservative_default: 0,
  };
  for (const scenario of ALL_SCENARIOS) {
    const modalityText = preferredModalityText(scenario.id);
    const bodyPart = withRegionContext ? REGION_BODY_PART[scenario.region] : "";
    for (const keyword of scenario.presentationKeywords) {
      const ctx = normalizeOrderContext(buildProbe(keyword, bodyPart, modalityText));
      const resolved = resolveRating(ctx).data;
      tally[resolved.matchTier] += 1;
    }
  }
  return tally;
}

function pct(part: number, total: number): string {
  return total === 0 ? "0.0%" : `${((part / total) * 100).toFixed(1)}%`;
}

function printTierTally(tally: Record<MatchTier, number>): number {
  const total = TIERS.reduce((sum, tier) => sum + tally[tier], 0);
  for (const tier of TIERS) {
    console.log(
      `    ${tier.padEnd(22)} ${String(tally[tier]).padStart(5)}  (${pct(tally[tier], total)})`,
    );
  }
  return total;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const scenarioCount = ALL_SCENARIOS.length;
const variantCount = ALL_SCENARIOS.reduce((sum, s) => sum + s.variants.length, 0);
const ratingCount = ALL_SCENARIOS.reduce(
  (sum, s) => sum + s.variants.reduce((vs, v) => vs + v.ratings.length, 0),
  0,
);
const keywordCount = ALL_SCENARIOS.reduce(
  (sum, s) => sum + s.presentationKeywords.length,
  0,
);

console.log(`AIIE Clinical Knowledge Matrix coverage report (v${MATRIX_VERSION})`);
console.log("=".repeat(64));
console.log(`Scenarios: ${scenarioCount}`);
console.log(`Variants:  ${variantCount}`);
console.log(`Ratings:   ${ratingCount}`);
console.log(`Keywords:  ${keywordCount}`);
console.log("");

console.log("Per-region coverage:");
const byRegion = new Map<BodyRegion, { scenarios: number; variants: number; ratings: number }>();
for (const scenario of ALL_SCENARIOS) {
  const entry = byRegion.get(scenario.region) ?? { scenarios: 0, variants: 0, ratings: 0 };
  entry.scenarios += 1;
  entry.variants += scenario.variants.length;
  entry.ratings += scenario.variants.reduce((sum, v) => sum + v.ratings.length, 0);
  byRegion.set(scenario.region, entry);
}
for (const region of Object.keys(REGION_BODY_PART) as BodyRegion[]) {
  const entry = byRegion.get(region) ?? { scenarios: 0, variants: 0, ratings: 0 };
  console.log(
    `    ${region.padEnd(16)} scenarios=${String(entry.scenarios).padStart(2)}  variants=${String(entry.variants).padStart(3)}  ratings=${String(entry.ratings).padStart(4)}`,
  );
}
console.log("");

console.log("Keyword-driven sweep (keyword + region context + preferred modality):");
const gatedTally = runKeywordSweep(true);
const gatedTotal = printTierTally(gatedTally);
console.log("");

console.log("Keyword-only sweep (no region context — informational):");
printTierTally(runKeywordSweep(false));
console.log("");

const tier34 = gatedTally.region_default + gatedTally.conservative_default;
const tier34Share = gatedTotal === 0 ? 1 : tier34 / gatedTotal;
console.log(
  `Tier-3/4 share of keyword-driven sweep: ${pct(tier34, gatedTotal)} (budget ${TIER_3_4_BUDGET * 100}%)`,
);

if (tier34Share > TIER_3_4_BUDGET) {
  console.error(
    `FAIL: tier-3/4 resolutions (${tier34}/${gatedTotal}) exceed the ${TIER_3_4_BUDGET * 100}% budget — matrix keywords or candidate scoring regressed.`,
  );
  process.exit(1);
}
console.log("PASS: keyword-driven sweep within tier-3/4 budget.");
