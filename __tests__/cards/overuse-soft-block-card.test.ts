import { describe, expect, it } from "vitest";

import { OVERUSE_RULES } from "@/lib/aiie/overuse-patterns";
import { buildOveruseCard } from "@/lib/cards/overuse-soft-block-card";
import { detailIncludesFdaDisclosure } from "@/lib/compliance/fda-disclosure";

describe("buildOveruseCard", () => {
  it("uses critical indicator and FDA disclosure for registry rules", () => {
    const rule = OVERUSE_RULES[0];
    const card = buildOveruseCard(rule, {
      order: { modality: "MRI", procedure: "MRI lumbar spine", bodyPart: "lumbar spine", cpt: "72148" },
    });
    expect(card.indicator).toBe("critical");
    expect(card.uuid).toBe(`arka-ins-overuse-${rule.id}`);
    expect(detailIncludesFdaDisclosure(card.detail)).toBe(true);
    expect(card.overrideReasons?.length).toBeGreaterThan(0);
  });
});
