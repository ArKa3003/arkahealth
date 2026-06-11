/**
 * Collects every evidenceSlug the AIIE Clinical Knowledge Matrix can emit.
 *
 * Used by the registry stub generator (scripts/generate-evidence-stubs.ts) and
 * the evidence-links test suite to guarantee every matrix slug resolves to a
 * first-party `/evidence/[slug]` page.
 */

import type { BodyRegion } from "@/lib/aiie/knowledge-matrix";
import { ALL_SCENARIOS } from "@/lib/aiie/knowledge-matrix";
import { REGION_DISPLAY_NAMES } from "@/lib/aiie/knowledge-matrix/regions/defaults";

/** Slug emitted by the resolver's Tier 4 conservative default. */
export const INDETERMINATE_SLUG = "aiie-indeterminate-order";

/**
 * Builds the Tier 3 region-default evidence slug for a body region
 * (mirrors `regionDefaultRating` in the matrix defaults module).
 *
 * @param region - Matrix body region.
 */
export function regionDefaultEvidenceSlug(region: BodyRegion): string {
  return `aiie-region-default-${region.replace(/_/g, "-")}`;
}

/** All matrix body regions (keys of the region display map). */
export const MATRIX_REGIONS = Object.keys(REGION_DISPLAY_NAMES) as BodyRegion[];

/**
 * Collects the full set of evidence slugs the Knowledge Matrix can emit:
 * every variant rating slug, every region-default slug, and the
 * conservative-default (indeterminate) slug.
 */
export function collectMatrixEvidenceSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const scenario of ALL_SCENARIOS) {
    for (const variant of scenario.variants) {
      for (const rating of variant.ratings) {
        slugs.add(rating.evidenceSlug);
      }
    }
  }
  for (const region of MATRIX_REGIONS) {
    slugs.add(regionDefaultEvidenceSlug(region));
  }
  slugs.add(INDETERMINATE_SLUG);
  return slugs;
}
