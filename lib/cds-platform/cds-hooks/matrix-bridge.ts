/**
 * @file matrix-bridge.ts
 * @description Bridges the FHIR-mapped cds-platform {@link ClinicalScenario} into the
 *   AIIE Clinical Knowledge Matrix. Fully in-memory and synchronous — no fs or network —
 *   so CDS Hooks responses stay inside the 800ms p95 budget.
 */

import {
  ALL_SCENARIOS,
  MATRIX_VERSION,
  normalizeOrderContext,
  resolveRating,
} from '@/lib/aiie/knowledge-matrix';
import type { Modality, ModalityRating, ResolvedRating } from '@/lib/aiie/knowledge-matrix';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { AIIEInput, AIIERedFlags, AIIESex } from '@/lib/types/aiie';

/** Human-readable display names for matrix modalities (used on cards and suggestions). */
export const MATRIX_MODALITY_DISPLAY: Record<Modality, string> = {
  xr: 'X-ray',
  ct: 'CT',
  cta: 'CT angiography',
  ct_contrast: 'CT with contrast',
  mri: 'MRI',
  mri_contrast: 'MRI with contrast',
  mra: 'MR angiography',
  us: 'Ultrasound',
  us_doppler: 'Doppler ultrasound',
  nm: 'Nuclear medicine',
  pet_ct: 'PET-CT',
  fluoro: 'Fluoroscopy',
  mammo: 'Mammography',
  dexa: 'DEXA',
};

/** Re-exported so card builders can stamp the matrix version without a deep import. */
export { MATRIX_VERSION };

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
    suddenOnset: false,
    bladderBowelDysfunction: false,
  };
}

/** Maps cds-platform red-flag display names (code-systems RED_FLAG_CODES keys) to AIIE keys. */
const RED_FLAG_NAME_TO_KEY: Record<string, keyof AIIERedFlags> = {
  'Cancer history': 'cancerHistory',
  'Neurological deficit': 'neurologicalDeficit',
  'Fever with back pain': 'fever',
  'Saddle anesthesia': 'neurologicalDeficit',
  'Bowel dysfunction': 'bladderBowelDysfunction',
  'Bladder dysfunction': 'bladderBowelDysfunction',
  'Thunderclap headache onset': 'suddenOnset',
  'Worst headache of life': 'suddenOnset',
  'Immunocompromised state': 'immunocompromised',
  Trauma: 'trauma',
};

function toAiieRedFlags(scenario: ClinicalScenario): AIIERedFlags {
  const flags = emptyRedFlags();
  for (const rf of scenario.redFlags ?? []) {
    if (!rf?.present) continue;
    const key = RED_FLAG_NAME_TO_KEY[rf.flag];
    if (key) flags[key] = true;
  }
  if (typeof scenario.age === 'number') {
    if (scenario.age > 50) flags.ageOver50 = true;
    if (scenario.age < 18) flags.ageUnder18 = true;
  }
  return flags;
}

function toAiieSex(sex: ClinicalScenario['sex']): AIIESex {
  return sex === 'Female' ? 'female' : 'male';
}

/**
 * Resolves a FHIR-mapped cds-platform scenario through the AIIE Clinical Knowledge
 * Matrix (normalize → four-tier cascade). Never throws and always returns a rating —
 * tier-4 lands on the indeterminate-order basis with documentation guidance.
 *
 * @param scenario - FHIR-mapped clinical scenario for a single draft order.
 * @returns Resolved evidence-linked modality rating from the matrix.
 */
export function resolveMatrixForScenario(scenario: ClinicalScenario): ResolvedRating {
  const sr = scenario.serviceRequests?.[0];
  const proposed = scenario.proposedImaging;
  const modality = proposed?.modality != null ? String(proposed.modality) : '';
  const bodyPart = proposed?.bodyPart != null ? String(proposed.bodyPart) : '';
  const procedure = sr?.display ?? modality;
  const durationText =
    typeof scenario.duration === 'number' && scenario.duration >= 0
      ? `${scenario.duration} days`
      : '';
  const redFlags = toAiieRedFlags(scenario);

  const input: AIIEInput = {
    patient: {
      age: scenario.age ?? 0,
      sex: toAiieSex(scenario.sex),
      pregnant: scenario.pregnancyStatus === 'pregnant' ? true : undefined,
    },
    clinicalFactors: {
      chiefComplaint: scenario.chiefComplaint ?? '',
      duration: durationText,
      symptoms: scenario.symptoms ?? [],
      redFlags,
      priorImaging: (scenario.priorImaging ?? []).length > 0,
      conservativeManagementTried: false,
    },
    order: {
      cpt: sr?.code,
      modality: modality as AIIEInput['order']['modality'],
      bodyPart: bodyPart || undefined,
      procedure: procedure ?? '',
    },
    age: scenario.age ?? 0,
    sex: toAiieSex(scenario.sex),
    pregnant: scenario.pregnancyStatus === 'pregnant' ? true : undefined,
    chiefComplaint: [scenario.chiefComplaint, scenario.clinicalHistory, proposed?.indication]
      .filter(Boolean)
      .join('; '),
    duration: durationText,
    symptoms: scenario.symptoms ?? [],
    redFlags,
    priorImaging: (scenario.priorImaging ?? []).length > 0,
    conservativeManagementTried: false,
    requestedModality: modality as AIIEInput['requestedModality'],
    requestedProcedure: procedure ?? '',
  };

  const context = normalizeOrderContext(input, {
    reasonIcd10: sr?.reasonIcd10 ?? [],
    reasonSnomed: sr?.reasonSnomed ?? [],
  });
  return resolveRating(context).data;
}

/**
 * True when the matrix matched a red-flag variant for this scenario — the
 * EXPEDITE signal that escalates the card indicator to `critical`.
 *
 * @param resolved - Output of {@link resolveMatrixForScenario}.
 */
export function isRedFlagExpedite(resolved: ResolvedRating): boolean {
  return (resolved.variant?.criteria.redFlags.length ?? 0) > 0;
}

/**
 * All modality ratings on the matched variant from the matrix registry
 * (empty for scenario/region/tier-4 defaults, which carry no variant).
 *
 * @param resolved - Output of {@link resolveMatrixForScenario}.
 */
export function matchedVariantRatings(resolved: ResolvedRating): ModalityRating[] {
  if (!resolved.variant) return [];
  const scenario = ALL_SCENARIOS.find((s) => s.id === resolved.scenario.id);
  const variant = scenario?.variants.find((v) => v.id === resolved.variant?.id);
  return variant?.ratings ?? [];
}

/**
 * Returns the better-rated alternative modality for the matched variant, when one
 * exists. Prefers the variant's `isPreferred` rating; falls back to the highest-rated
 * modality strictly above the ordered modality's rating.
 *
 * @param resolved - Output of {@link resolveMatrixForScenario}.
 */
export function betterRatedAlternative(resolved: ResolvedRating): ModalityRating | null {
  const ordered = resolved.rating;
  const candidates = matchedVariantRatings(resolved);
  const preferred = candidates.find(
    (r) => r.isPreferred && r.modality !== ordered.modality && r.rating > ordered.rating,
  );
  if (preferred) return preferred;
  const best = [...candidates]
    .filter((r) => r.modality !== ordered.modality && r.rating > ordered.rating)
    .sort((a, b) => b.rating - a.rating)[0];
  return best ?? null;
}
