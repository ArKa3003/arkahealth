import { describe, expect, it } from "vitest";

import { sanitizeCounterLabels } from "@/lib/server/metrics-counters";

describe("sanitizeCounterLabels", () => {
  it("keeps safe modality and rule_id labels", () => {
    expect(
      sanitizeCounterLabels({ modality: "CT", rule_id: "cta-chest-pe" }),
    ).toEqual({ modality: "CT", rule_id: "cta-chest-pe" });
  });

  it("drops PHI-like keys and values", () => {
    expect(
      sanitizeCounterLabels({
        patient_name: "Smith, John",
        modality: "MRI",
        mrn: "12345",
      }),
    ).toEqual({ modality: "MRI" });
  });

  it("drops email-shaped values", () => {
    expect(sanitizeCounterLabels({ modality: "user@test.com" })).toEqual({});
  });
});
