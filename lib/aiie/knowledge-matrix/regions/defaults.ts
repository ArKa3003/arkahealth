/**
 * Region-level default ratings for Tier 3 (`region_default`) matrix resolution.
 *
 * Used when region and modality are known but no clinical scenario matched.
 * Ratings are deliberately conservative mid-scale values: the order is neither
 * endorsed nor blocked, and documentation improvement is recommended.
 */

import type {
  AppropriatenessRating,
  BodyRegion,
  Modality,
  ModalityRating,
} from "../types";
import { RADIATION_BY_MODALITY } from "./_rating-builder";

/** Display names for region-default pseudo-scenarios. */
export const REGION_DISPLAY_NAMES: Record<BodyRegion, string> = {
  head_brain: "Head / Brain",
  head_face_neck: "Head, Face & Neck",
  spine_cervical: "Cervical Spine",
  spine_thoracic: "Thoracic Spine",
  spine_lumbar: "Lumbar Spine",
  chest: "Chest",
  cardiac: "Cardiac",
  abdomen: "Abdomen",
  pelvis: "Pelvis",
  gu_renal: "GU / Renal",
  msk_upper: "Upper Extremity MSK",
  msk_lower: "Lower Extremity MSK",
  vascular: "Vascular",
  breast: "Breast",
  whole_body: "Whole Body",
};

/** Fallback default rating for modalities without a region-specific entry. */
const REGION_DEFAULT_FALLBACK_RATING: AppropriatenessRating = 4;

/**
 * Region workhorse modalities receive a neutral 5 ("indeterminate"); all other
 * modalities fall back to a conservative 4 so unusual region/modality pairings
 * never default to an endorsement.
 */
const REGION_DEFAULT_RATINGS: Record<
  BodyRegion,
  Partial<Record<Modality, AppropriatenessRating>>
> = {
  head_brain: { ct: 5, mri: 5, cta: 4, mra: 4 },
  head_face_neck: { ct: 5, us: 5, mri: 4 },
  spine_cervical: { mri: 5, ct: 4, xr: 4 },
  spine_thoracic: { mri: 5, ct: 4, xr: 4 },
  spine_lumbar: { mri: 5, ct: 5, xr: 4 },
  chest: { xr: 5, ct: 5, cta: 4 },
  cardiac: { us: 5, cta: 4, nm: 4 },
  abdomen: { ct: 5, ct_contrast: 5, us: 5 },
  pelvis: { us: 5, mri: 4, ct: 4 },
  gu_renal: { ct: 5, us: 5, us_doppler: 5 },
  msk_upper: { xr: 5, mri: 4, us: 4 },
  msk_lower: { xr: 5, mri: 4 },
  vascular: { us_doppler: 5, cta: 4, mra: 4 },
  breast: { mammo: 5, us: 5 },
  whole_body: { ct: 4 },
};

/**
 * Builds the Tier 3 region-default modality rating for a known region and modality.
 *
 * @param region - Resolved anatomic region.
 * @param modality - Resolved imaging modality.
 * @returns Conservative mid-scale rating with a documentation-improvement rationale.
 */
export function regionDefaultRating(
  region: BodyRegion,
  modality: Modality,
): ModalityRating {
  const rating =
    REGION_DEFAULT_RATINGS[region][modality] ?? REGION_DEFAULT_FALLBACK_RATING;
  return {
    modality,
    rating,
    radiationLevel: RADIATION_BY_MODALITY[modality],
    evidenceSlug: `aiie-region-default-${region.replace(/_/g, "-")}`,
    rationale: `Insufficient indication detail for ${REGION_DISPLAY_NAMES[region].toLowerCase()} ${modality.replace(/_/g, " ").toUpperCase()}; appropriateness indeterminate — documentation improvement recommended. Documenting the presenting complaint, symptom duration, red-flag status, and prior workup enables a definitive scenario-level rating.`,
  };
}
