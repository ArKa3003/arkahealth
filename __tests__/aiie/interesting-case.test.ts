import { describe, it, expect } from "vitest";

import {
  assessRarityFromIndex,
  buildCptCombo,
  buildIcd10Combo,
  buildRedFlagCombo,
  rRarity,
} from "@/lib/aiie/interesting-case";
import { buildDemoRarityIndex } from "@/lib/aiie/rarity-demo-index";
import { buildGoldCardPriorImagingSnapshot } from "@/lib/ins/gold-card-prior-imaging-demo";
import type { AIIEOrder } from "@/lib/types/aiie";

describe("interesting-case rarity", () => {
  const index = buildDemoRarityIndex();

  it("computes higher -log2 probability for rare marginals", () => {
    const common = rRarity(18_500, 42_000, 4);
    const rare = rRarity(3, 42_000, 4);
    expect(rare).toBeGreaterThan(common);
  });

  it("flags gold-card demo snapshot in top decile", () => {
    const snapshot = buildGoldCardPriorImagingSnapshot("71260");
    const order: AIIEOrder = {
      cpt: "71260",
      modality: "CT",
      bodyPart: "Chest",
      procedure: "CT Chest",
    };

    const keys = {
      icd10_combo: buildIcd10Combo(snapshot),
      cpt_combo: buildCptCombo(snapshot, order),
      age_sex_region: "40-64|female|rural-midwest",
      redflag_combo: buildRedFlagCombo({
        cancerHistory: true,
        neurologicalDeficit: true,
        fever: false,
        weightLoss: false,
        trauma: false,
        immunocompromised: false,
        ivDrugUse: false,
        osteoporosis: false,
        ageOver50: true,
        ageUnder18: false,
        progressiveSymptoms: true,
        bladderBowelDysfunction: false,
        suddenOnset: false,
      }),
      age_bucket: "40-64",
      sex: "female",
      region_bucket: "rural-midwest",
    };

    const result = assessRarityFromIndex(index, keys);
    expect(result.interesting).toBe(true);
    expect(result.percentile).toBeGreaterThanOrEqual(0.9);
    expect(result.drivers.length).toBe(4);
  });

  it("does not flag common M54.5 lumbar MRI pattern", () => {
    const snapshot = buildGoldCardPriorImagingSnapshot("72148");
    snapshot.codingContext.activeIcd10 = ["M54.5", "M54.16"];
    snapshot.problems = [];
    const order: AIIEOrder = {
      cpt: "72148",
      modality: "MRI",
      bodyPart: "lumbar",
      procedure: "MRI lumbar",
    };
    const result = assessRarityFromIndex(index, {
      icd10_combo: buildIcd10Combo(snapshot),
      cpt_combo: buildCptCombo(snapshot, order),
      age_sex_region: "40-64|female|unspecified",
      redflag_combo: "none",
      age_bucket: "40-64",
      sex: "female",
      region_bucket: "unspecified",
    });
    expect(result.interesting).toBe(false);
  });
});
