import { describe, it, expect } from "vitest";

import {
  evaluateStat,
  STAT_CRITERION_IDS,
} from "@/lib/aiie/stat-gate";
import type { AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

const order: AIIEOrder = {
  modality: "CT",
  procedure: "CT head without contrast",
  bodyPart: "head",
};

function baseSnapshot(
  overrides: Partial<PatientRecordSnapshot["codingContext"]> = {},
): PatientRecordSnapshot {
  return {
    patientHash: "test-hash",
    capturedAtIso: new Date().toISOString(),
    ttlSeconds: 1800,
    problems: [],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging: [],
    priorReports: [],
    labs: [],
    vitals: [],
    notes: [],
    codingContext: { activeIcd10: [], activeCpt: [], ...overrides },
  };
}

describe("evaluateStat", () => {
  it("passes legitimate STAT when GCS ≤ 13", () => {
    const snapshot = baseSnapshot({ glasgowComaScale: 12 });
    const result = evaluateStat({
      snapshot,
      order,
      complaint: "head injury",
      priority: "stat",
    });

    expect(result.meetsCriteria).toBe(true);
    expect(result.matchedCriteria).toContain(STAT_CRITERION_IDS.GCS_LE_13);
    expect(result.recommendedPriority).toBe("stat");
  });

  it("passes legitimate STAT when ISS ≥ 16", () => {
    const snapshot = baseSnapshot({ injurySeverityScore: 18 });
    const result = evaluateStat({
      snapshot,
      order,
      complaint: "polytrauma",
      priority: "stat",
    });

    expect(result.meetsCriteria).toBe(true);
    expect(result.matchedCriteria).toContain(STAT_CRITERION_IDS.TRAUMA_SEVERE);
    expect(result.recommendedPriority).toBe("stat");
  });

  it("passes legitimate STAT for NIHSS-aligned stroke complaint", () => {
    const snapshot = baseSnapshot();
    const result = evaluateStat({
      snapshot,
      order,
      complaint: "acute facial droop and arm weakness, suspected stroke",
      priority: "stat",
    });

    expect(result.meetsCriteria).toBe(true);
    expect(result.matchedCriteria).toContain(STAT_CRITERION_IDS.SUSPECTED_STROKE);
    expect(result.recommendedPriority).toBe("stat");
  });

  it("recommends urgent when STAT has no emergent criteria", () => {
    const snapshot = baseSnapshot();
    const result = evaluateStat({
      snapshot,
      order,
      complaint: "chronic low back pain, routine follow-up imaging",
      priority: "stat",
    });

    expect(result.meetsCriteria).toBe(false);
    expect(result.matchedCriteria).toHaveLength(0);
    expect(result.recommendedPriority).toBe("urgent");
  });

  it("does not gate routine priority", () => {
    const snapshot = baseSnapshot();
    const result = evaluateStat({
      snapshot,
      order,
      complaint: "chronic pain",
      priority: "routine",
    });

    expect(result.meetsCriteria).toBe(true);
    expect(result.recommendedPriority).toBe("routine");
  });
});
