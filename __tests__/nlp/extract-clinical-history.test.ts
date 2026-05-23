import { describe, it, expect } from "vitest";

import { extractClinicalHistory } from "@/lib/nlp/extractClinicalHistory";

describe("extractClinicalHistory", () => {
  it("extracts progressive neuro deficits, duration, and conservative care from a pasted note", () => {
    const result = extractClinicalHistory(
      "Progressive neuro deficits x 6 weeks, PT for 2 months",
    );

    expect(result.symptoms).toContain("progressive_symptoms");
    expect(result.redFlags.progressiveSymptoms).toBe(true);
    expect(result.duration).toBe("6 weeks");
    expect(result.conservativeCare?.tried).toBe(true);
    expect(result.confidence).not.toBe("low");
  });

  it("returns empty proposals for blank input", () => {
    const result = extractClinicalHistory("   ");
    expect(result.symptoms).toEqual([]);
    expect(result.redFlags).toEqual({});
    expect(result.confidence).toBe("low");
  });
});
