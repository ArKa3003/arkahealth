import { describe, expect, it } from "vitest";

import { buildDuplicateOrderCard } from "@/lib/cards/duplicate-order-card";
import type { RedundancyAssessment } from "@/lib/aiie/redundancy";

const FDA_MARKER = "FDA Non-Device Clinical Decision Support tool under the 21st Century Cures Act";

describe("buildDuplicateOrderCard", () => {
  it("uses critical indicator and required override copy for high severity", () => {
    const assessment: RedundancyAssessment = {
      severity: "high",
      reason: "Potential duplicate — prior exam on Jan 1, 2026.",
      priorStudyId: "img-1",
      daysSincePrior: 10,
      sameCpt: true,
      sameRegionDifferentModality: false,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "BLOCK_SOFT",
    };

    const card = buildDuplicateOrderCard(assessment);
    expect(card.indicator).toBe("critical");
    expect(card.uuid).toBe("arka-ins-duplicate-order");
    expect(card.detail).toContain("img-1");
    expect(card.detail).toContain(FDA_MARKER);
    expect(card.overrideReasons?.some((r) => r.code === "other")).toBe(true);
    expect(card.detail).toMatch(/free-text/i);
  });

  it("uses warning indicator and optional override copy for medium severity", () => {
    const assessment: RedundancyAssessment = {
      severity: "medium",
      reason: "Same anatomic region imaged recently.",
      priorStudyId: "img-2",
      daysSincePrior: 7,
      sameCpt: false,
      sameRegionDifferentModality: true,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "DISCUSS",
    };

    const card = buildDuplicateOrderCard(assessment);
    expect(card.indicator).toBe("warning");
    expect(card.detail).toContain("img-2");
    expect(card.detail).toMatch(/optional/i);
  });
});
