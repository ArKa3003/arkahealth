import { describe, it, expect } from "vitest";

import { computeMNAI } from "@/lib/coding/mnai";
import type { AIIEScore } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

function baseAiie(overrides?: Partial<AIIEScore>): AIIEScore {
  return {
    clinicalScore: 6,
    denialRisk: 4,
    confidence: 0.8,
    factors: [
      {
        id: "guideline_alignment",
        name: "Guideline alignment",
        weight: 0.15,
        contribution: 0.6,
        present: true,
        evidenceCitation: "test",
      },
      {
        id: "red_flag_symptoms",
        name: "Red flag symptoms",
        weight: 0.2,
        contribution: 0,
        present: false,
        evidenceCitation: "test",
      },
      {
        id: "prior_imaging_redundancy",
        name: "Prior imaging redundancy",
        weight: 0.2,
        contribution: -0.1,
        present: false,
        evidenceCitation: "test",
      },
    ],
    narrativeRationale: "test narrative",
    ...overrides,
  };
}

function lumbarSnapshot(onsetDaysAgo: number): PatientRecordSnapshot {
  const onset = new Date(Date.now() - onsetDaysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    patientHash: "abc",
    capturedAtIso: new Date().toISOString(),
    ttlSeconds: 1800,
    problems: [
      {
        icd10: "M54.5",
        display: "Low back pain",
        clinicalStatus: "active",
        onsetIso: onset,
      },
    ],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging: [],
    priorReports: [],
    labs: [],
    vitals: [],
    notes: [],
    codingContext: { activeIcd10: ["M54.5"], activeCpt: ["72148"] },
  };
}

describe("computeMNAI", () => {
  it("returns identical output for identical inputs (deterministic)", () => {
    const snapshot = lumbarSnapshot(50);
    const aiie = baseAiie();
    const input = { icd10: ["M54.5"], cpt: "72148", snapshot, aiie };
    const a = computeMNAI(input);
    const b = computeMNAI(input);
    expect(a).toEqual(b);
  });

  it("matches curated lumbar MRI pair with policy references", () => {
    const result = computeMNAI({
      icd10: ["M54.5"],
      cpt: "72148",
      snapshot: lumbarSnapshot(50),
      aiie: baseAiie(),
    });
    expect(result.curated).toBe(true);
    expect(result.matchedIcd10).toBe("M54.5");
    expect(result.matchedCpt).toBe("72148");
    expect(result.policyReferences.length).toBeGreaterThan(0);
    for (const ref of result.policyReferences) {
      expect(ref.strength).toMatch(
        /^(usually_appropriate|may_be_appropriate|usually_not_appropriate|usually_appropriate_with_red_flags)$/,
      );
    }
  });

  it("returns neutral state when pair is not curated", () => {
    const result = computeMNAI({
      icd10: ["Z00.00"],
      cpt: "99999",
      snapshot: lumbarSnapshot(10),
      aiie: baseAiie(),
    });
    expect(result.curated).toBe(false);
    expect(result.index).toBe(50);
    expect(result.tier).toBe("amber");
    expect(result.policyReferences).toEqual([]);
  });

  it("elevates tier when red-flag overrides are present on headache CT", () => {
    const snapshot: PatientRecordSnapshot = {
      ...lumbarSnapshot(3),
      problems: [
        {
          icd10: "R51.9",
          display: "Sudden onset worst headache with neurological deficit",
          clinicalStatus: "active",
          onsetIso: new Date().toISOString(),
        },
      ],
      codingContext: { activeIcd10: ["R51.9"], activeCpt: ["70450"] },
    };
    const aiie = baseAiie({
      factors: [
        ...baseAiie().factors.filter((f) => f.id !== "red_flag_symptoms"),
        {
          id: "red_flag_symptoms",
          name: "Red flag symptoms",
          weight: 0.2,
          contribution: 0.9,
          present: true,
          evidenceCitation: "test",
        },
      ],
    });
    const result = computeMNAI({
      icd10: ["R51.9"],
      cpt: "70450",
      snapshot,
      aiie,
    });
    expect(result.curated).toBe(true);
    expect(result.index).toBeGreaterThanOrEqual(65);
    expect(["green", "amber"]).toContain(result.tier);
  });

  it("includes FDA non-device CDS language in narrative", () => {
    const result = computeMNAI({
      icd10: ["M54.5"],
      cpt: "72148",
      snapshot: lumbarSnapshot(50),
      aiie: baseAiie(),
    });
    expect(result.narrative).toContain("FDA Non-Device Clinical Decision Support");
  });
});
