import { describe, expect, it } from "vitest";

import { evaluateOveruseRules, OVERUSE_RULES } from "@/lib/aiie/overuse-patterns";
import type { AIIEClinicalFactors, AIIEOrder, AIIERedFlags } from "@/lib/types/aiie";

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

function clinical(overrides: Partial<AIIEClinicalFactors> = {}): AIIEClinicalFactors {
  return {
    chiefComplaint: "Low back pain",
    duration: "3 weeks",
    symptoms: ["low back pain"],
    redFlags: emptyRedFlags(),
    priorImaging: false,
    conservativeManagementTried: false,
    ...overrides,
  };
}

function lumbarMriOrder(): AIIEOrder {
  return {
    cpt: "72148",
    modality: "MRI",
    bodyPart: "Lumbar spine",
    procedure: "MRI lumbar spine without contrast",
  };
}

describe("OVERUSE_RULES registry", () => {
  it("seeds six rules with ACR or Choosing Wisely citations", () => {
    expect(OVERUSE_RULES).toHaveLength(6);
    for (const rule of OVERUSE_RULES) {
      expect(rule.citations.length).toBeGreaterThanOrEqual(1);
      expect(
        rule.citations.some(
          (c) => c.includes("ACR Appropriateness Criteria") || c.includes("Choosing Wisely"),
        ),
      ).toBe(true);
    }
  });

  it("matches anchor case: lumbar MRI for LBP without conservative care or red flags", () => {
    const matched = evaluateOveruseRules({
      order: lumbarMriOrder(),
      clinical: clinical(),
    });
    expect(matched.map((r) => r.id)).toContain("mri_lumbar_lbp_nored");
  });

  it("does not match lumbar MRI when conservative care is documented", () => {
    const matched = evaluateOveruseRules({
      order: lumbarMriOrder(),
      clinical: clinical({ conservativeManagementTried: true, conservativeManagementDuration: "6 weeks PT" }),
    });
    expect(matched.map((r) => r.id)).not.toContain("mri_lumbar_lbp_nored");
  });

  it("does not match lumbar MRI when spinal red flags are present", () => {
    const flags = emptyRedFlags();
    flags.neurologicalDeficit = true;
    const matched = evaluateOveruseRules({
      order: lumbarMriOrder(),
      clinical: clinical({ redFlags: flags }),
    });
    expect(matched.map((r) => r.id)).not.toContain("mri_lumbar_lbp_nored");
  });
});
