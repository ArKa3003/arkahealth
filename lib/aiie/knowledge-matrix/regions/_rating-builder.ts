/**
 * Helpers for constructing full modality rating sets in region data files.
 * Region files remain data-only; rating assembly logic lives here.
 */

import type {
  AppropriatenessRating,
  Modality,
  ModalityRating,
  RadiationLevel,
} from "../types";

/** Every modality in the AIIE Clinical Knowledge Matrix. */
export const ALL_MODALITIES: readonly Modality[] = [
  "xr",
  "ct",
  "cta",
  "ct_contrast",
  "mri",
  "mri_contrast",
  "mra",
  "us",
  "us_doppler",
  "nm",
  "pet_ct",
  "fluoro",
  "mammo",
  "dexa",
] as const;

/** Relative radiation tier per modality used across the matrix and resolver. */
export const RADIATION_BY_MODALITY: Record<Modality, RadiationLevel> = {
  xr: 1,
  ct: 3,
  cta: 3,
  ct_contrast: 3,
  mri: 0,
  mri_contrast: 0,
  mra: 0,
  us: 0,
  us_doppler: 0,
  nm: 3,
  pet_ct: 4,
  fluoro: 2,
  mammo: 1,
  dexa: 1,
};

/** Per-modality override for a variant rating set. */
export interface ModalityOverride {
  rating: AppropriatenessRating;
  rationale: string;
  isPreferred?: boolean;
  contrastIssues?: string;
}

const DEFAULT_NOT_INDICATED =
  "Not indicated as initial imaging for this clinical presentation per evidence-based appropriateness criteria.";

/**
 * Builds a complete ModalityRating[] for all matrix modalities.
 *
 * @param evidenceSlug - Stable kebab-case slug shared across modalities in the variant.
 * @param overrides - Modality-specific ratings; omitted modalities default to rating 1.
 * @param fallbackRationale - Rationale for non-overridden modalities.
 */
export function buildRatings(
  evidenceSlug: string,
  overrides: Partial<Record<Modality, ModalityOverride>>,
  fallbackRationale: string = DEFAULT_NOT_INDICATED,
): ModalityRating[] {
  return ALL_MODALITIES.map((modality) => {
    const override = overrides[modality];
    if (override) {
      return {
        modality,
        rating: override.rating,
        radiationLevel: RADIATION_BY_MODALITY[modality],
        evidenceSlug,
        rationale: override.rationale,
        ...(override.isPreferred ? { isPreferred: true } : {}),
        ...(override.contrastIssues ? { contrastIssues: override.contrastIssues } : {}),
      };
    }
    return {
      modality,
      rating: 1,
      radiationLevel: RADIATION_BY_MODALITY[modality],
      evidenceSlug,
      rationale: fallbackRationale,
    };
  });
}
