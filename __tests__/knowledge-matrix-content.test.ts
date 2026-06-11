import { describe, it, expect } from "vitest";

import { ALL_MODALITIES } from "@/lib/aiie/knowledge-matrix/regions/_rating-builder";
import { ALL_SCENARIOS, SCENARIO_COUNT } from "@/lib/aiie/knowledge-matrix/regions";

const EVIDENCE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)+$/;
const MIN_RATIONALE_LENGTH = 20;
const MIN_MODALITIES_PER_VARIANT = 6;

describe("AIIE Clinical Knowledge Matrix content", () => {
  it("exports a non-empty scenario set with matching count", () => {
    expect(SCENARIO_COUNT).toBeGreaterThan(0);
    expect(ALL_SCENARIOS).toHaveLength(SCENARIO_COUNT);
  });

  it("has unique scenario ids and evidence slugs", () => {
    const scenarioIds = ALL_SCENARIOS.map((s) => s.id);
    const evidenceSlugs = ALL_SCENARIOS.flatMap((s) =>
      s.variants.map((v) => v.ratings[0]?.evidenceSlug),
    );

    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
    expect(new Set(evidenceSlugs).size).toBe(evidenceSlugs.length);
  });

  for (const scenario of ALL_SCENARIOS) {
    describe(`scenario: ${scenario.id}`, () => {
      it("has at least one variant", () => {
        expect(scenario.variants.length).toBeGreaterThanOrEqual(1);
      });

      it("has exactly one default variant for scenario_default resolution", () => {
        const defaults = scenario.variants.filter((v) => v.isDefault === true);
        expect(defaults).toHaveLength(1);
      });

      for (const variant of scenario.variants) {
        it(`variant ${variant.id} meets content requirements`, () => {
          expect(variant.ratings.length).toBeGreaterThanOrEqual(
            MIN_MODALITIES_PER_VARIANT,
          );

          const hasHighRating = variant.ratings.some((r) => r.rating >= 7);
          const imagingNotIndicated = variant.imagingIndicated === false;

          expect(hasHighRating || imagingNotIndicated).toBe(true);

          for (const rating of variant.ratings) {
            expect(rating.rationale.length).toBeGreaterThanOrEqual(
              MIN_RATIONALE_LENGTH,
            );
            expect(rating.evidenceSlug).toMatch(EVIDENCE_SLUG_PATTERN);
            expect(rating.radiationLevel).toBeGreaterThanOrEqual(0);
            expect(rating.radiationLevel).toBeLessThanOrEqual(4);

            if (
              rating.modality === "us" ||
              rating.modality === "us_doppler" ||
              rating.modality === "mri" ||
              rating.modality === "mri_contrast" ||
              rating.modality === "mra"
            ) {
              expect(rating.radiationLevel).toBe(0);
            }
          }

          const ratedModalities = new Set(variant.ratings.map((r) => r.modality));
          expect(ratedModalities.size).toBe(variant.ratings.length);
        });
      }
    });
  }

  it("rates all matrix modalities in every variant when using full builder sets", () => {
    for (const scenario of ALL_SCENARIOS) {
      for (const variant of scenario.variants) {
        if (variant.ratings.length === ALL_MODALITIES.length) {
          const modalities = variant.ratings.map((r) => r.modality).sort();
          const expected = [...ALL_MODALITIES].sort();
          expect(modalities).toEqual(expected);
        }
      }
    }
  });
});
