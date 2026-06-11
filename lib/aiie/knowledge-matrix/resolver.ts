/**
 * Four-tier deterministic resolver for the AIIE Clinical Knowledge Matrix.
 *
 * Cascade (strict, never throws, never returns null data):
 *   1. exact_variant        — scenario candidate with fully matching variant criteria
 *   2. scenario_default     — scenario matched, no variant fit → scenario's default variant
 *   3. region_default       — region + modality known, no scenario → conservative mid rating
 *   4. conservative_default — nothing resolvable → rating 4 with documentation guidance
 */

import { regionDefaultRating, REGION_DISPLAY_NAMES } from "./regions/defaults";
import { ALL_SCENARIOS } from "./regions";
import { RADIATION_BY_MODALITY } from "./regions/_rating-builder";
import type {
  ClinicalScenario,
  ModalityRating,
  NormalizedOrderContext,
  ResolvedRating,
  ScenarioVariant,
  VariantCriteria,
} from "./types";

const SCENARIOS_BY_ID = new Map<string, ClinicalScenario>(
  ALL_SCENARIOS.map((s) => [s.id, s]),
);

/** Conservative fallback rating used by Tier 4. */
const CONSERVATIVE_RATING = 4 as const;
/** Radiation tier assumed when the modality cannot be resolved. */
const UNKNOWN_MODALITY_RADIATION = 2 as const;

// ---------------------------------------------------------------------------
// Variant criteria matching
// ---------------------------------------------------------------------------

function inRange(value: number, range: { min?: number; max?: number }): boolean {
  if (range.min !== undefined && value < range.min) {
    return false;
  }
  if (range.max !== undefined && value > range.max) {
    return false;
  }
  return true;
}

/**
 * Returns true when every specified criterion matches the context.
 * Unspecified criteria are wildcards; criteria requiring a value the context
 * does not carry (e.g. a duration window with unknown duration) do not match.
 */
function criteriaMatch(
  criteria: VariantCriteria,
  ctx: NormalizedOrderContext,
): boolean {
  if (!criteria.redFlags.every((flag) => ctx.redFlags.includes(flag))) {
    return false;
  }
  if (criteria.durationDays !== undefined) {
    if (ctx.durationDays === null || !inRange(ctx.durationDays, criteria.durationDays)) {
      return false;
    }
  }
  if (criteria.ageRange !== undefined) {
    if (ctx.age === null || !inRange(ctx.age, criteria.ageRange)) {
      return false;
    }
  }
  if (criteria.priorImaging !== undefined && ctx.priorImaging !== criteria.priorImaging) {
    return false;
  }
  if (criteria.pregnancy !== undefined && (ctx.pregnancy === true) !== criteria.pregnancy) {
    return false;
  }
  if (criteria.trauma !== undefined && ctx.trauma !== criteria.trauma) {
    return false;
  }
  if (
    criteria.immunocompromised !== undefined &&
    ctx.immunocompromised !== criteria.immunocompromised
  ) {
    return false;
  }
  if (
    criteria.priorConservativeCare !== undefined &&
    ctx.priorConservativeCare !== criteria.priorConservativeCare
  ) {
    return false;
  }
  return true;
}

/** Number of specified (non-wildcard) criteria — the specificity tiebreaker. */
function criteriaSpecificity(criteria: VariantCriteria): number {
  let count = criteria.redFlags.length;
  if (criteria.durationDays !== undefined) count += 1;
  if (criteria.ageRange !== undefined) count += 1;
  if (criteria.priorImaging !== undefined) count += 1;
  if (criteria.pregnancy !== undefined) count += 1;
  if (criteria.trauma !== undefined) count += 1;
  if (criteria.immunocompromised !== undefined) count += 1;
  if (criteria.priorConservativeCare !== undefined) count += 1;
  return count;
}

/**
 * Picks the most specific matching variant. Red-flag variants always outrank
 * non-red-flag variants when their flags match; ties break on criteria count,
 * then stable file order.
 */
function bestMatchingVariant(
  scenario: ClinicalScenario,
  ctx: NormalizedOrderContext,
): ScenarioVariant | null {
  let best: ScenarioVariant | null = null;
  let bestKey = -1;
  for (const variant of scenario.variants) {
    if (!criteriaMatch(variant.criteria, ctx)) {
      continue;
    }
    const redFlagRank = variant.criteria.redFlags.length > 0 ? 1 : 0;
    // Red-flag rank dominates; specificity count breaks ties within a rank.
    const key = redFlagRank * 1000 + criteriaSpecificity(variant.criteria);
    if (key > bestKey) {
      best = variant;
      bestKey = key;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Rating selection within a variant
// ---------------------------------------------------------------------------

/**
 * Selects the modality-specific rating; when the requested modality is unknown
 * falls back to the variant's preferred (or highest-rated) modality.
 */
function ratingForModality(
  variant: ScenarioVariant,
  ctx: NormalizedOrderContext,
): ModalityRating {
  if (ctx.modality !== null) {
    const exact = variant.ratings.find((r) => r.modality === ctx.modality);
    if (exact) {
      return exact;
    }
  }
  const preferred = variant.ratings.find((r) => r.isPreferred);
  if (preferred) {
    return preferred;
  }
  return [...variant.ratings].sort((a, b) => b.rating - a.rating)[0];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves a normalized order context to an evidence-linked modality rating
 * via the strict four-tier cascade. Never throws and always returns data —
 * any input, including garbage, lands in a tier.
 *
 * @param input - Normalized clinical and order discriminators.
 * @returns Resolved rating with `error: null` in all four tiers.
 */
export function resolveRating(
  input: NormalizedOrderContext,
): { data: ResolvedRating; error: null } {
  // Tier 1 — exact_variant: first ranked candidate with a fully matching variant.
  for (const candidateId of input.scenarioCandidates) {
    const scenario = SCENARIOS_BY_ID.get(candidateId);
    if (!scenario) {
      continue;
    }
    const variant = bestMatchingVariant(scenario, input);
    if (variant) {
      return {
        data: {
          rating: ratingForModality(variant, input),
          scenario: { id: scenario.id, name: scenario.name, region: scenario.region },
          variant: { id: variant.id, criteria: variant.criteria },
          matchTier: "exact_variant",
        },
        error: null,
      };
    }
  }

  // Tier 2 — scenario_default: scenario matched but no variant criteria fit.
  for (const candidateId of input.scenarioCandidates) {
    const scenario = SCENARIOS_BY_ID.get(candidateId);
    if (!scenario) {
      continue;
    }
    const defaultVariant =
      scenario.variants.find((v) => v.isDefault === true) ?? scenario.variants[0];
    return {
      data: {
        rating: ratingForModality(defaultVariant, input),
        scenario: { id: scenario.id, name: scenario.name, region: scenario.region },
        variant: null,
        matchTier: "scenario_default",
      },
      error: null,
    };
  }

  // Tier 3 — region_default: region and modality known but no scenario matched.
  if (input.region !== null && input.modality !== null) {
    return {
      data: {
        rating: regionDefaultRating(input.region, input.modality),
        scenario: {
          id: `region-default-${input.region.replace(/_/g, "-")}`,
          name: `${REGION_DISPLAY_NAMES[input.region]} — Unspecified Indication`,
          region: input.region,
        },
        variant: null,
        matchTier: "region_default",
      },
      error: null,
    };
  }

  // Tier 4 — conservative_default: nothing resolvable.
  return {
    data: {
      rating: {
        modality: input.modality ?? "ct",
        rating: CONSERVATIVE_RATING,
        radiationLevel:
          input.modality !== null ?
            RADIATION_BY_MODALITY[input.modality]
          : UNKNOWN_MODALITY_RADIATION,
        evidenceSlug: "aiie-indeterminate-order",
        rationale:
          "Order could not be resolved to a clinical scenario in the AIIE Clinical Knowledge Matrix; conservative indeterminate rating applied. Documenting the presenting complaint, anatomic region, imaging modality, symptom duration, red-flag status, and prior workup would allow a definitive scenario-level appropriateness rating.",
      },
      scenario: {
        id: "aiie-indeterminate-order",
        name: "Indeterminate Order",
        region: input.region ?? "whole_body",
      },
      variant: null,
      matchTier: "conservative_default",
    },
    error: null,
  };
}
