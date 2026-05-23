import { describe, it, expect } from "vitest";

import { traumaGate } from "@/lib/aiie/trauma-gate";
import { scoreOrder } from "@/lib/aiie/scoring-engine";
import type { AIIEOrder, AIIERedFlags } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

const emptyRedFlags: AIIERedFlags = {
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

describe("traumaGate", () => {
  it("ISS=4 with MRI knee order yields negative gateSignal without red flags", () => {
    const snapshot = baseSnapshot({ injurySeverityScore: 4 });
    const order: AIIEOrder = {
      modality: "MRI",
      bodyPart: "knee",
      procedure: "MRI knee without contrast",
    };

    const result = traumaGate(snapshot, order, emptyRedFlags);

    expect(result.severityTier).toBe("minor");
    expect(result.gateSignal).toBeLessThan(0);
    expect(result.gateSignal).toBeGreaterThanOrEqual(-0.8);
  });

  it("ISS=20 polytrauma with CT chest/abdomen/pelvis yields positive gateSignal", () => {
    const snapshot = baseSnapshot({ injurySeverityScore: 20 });
    const order: AIIEOrder = {
      modality: "CT",
      bodyPart: "chest abdomen pelvis",
      procedure: "CT chest abdomen and pelvis with contrast",
    };

    const result = traumaGate(snapshot, order, emptyRedFlags);

    expect(result.severityTier).toBe("severe");
    expect(result.gateSignal).toBeGreaterThan(0);
  });

  it("GCS=9 alone elevates CT head gateSignal by at least 0.3", () => {
    const snapshot = baseSnapshot({ glasgowComaScale: 9 });
    const order: AIIEOrder = {
      modality: "CT",
      bodyPart: "head",
      procedure: "CT head without contrast",
    };

    const result = traumaGate(snapshot, order, emptyRedFlags);

    expect(result.gcs).toBe(9);
    expect(result.gateSignal).toBeGreaterThanOrEqual(0.3);
  });
});

describe("scoreOrder trauma gate integration", () => {
  it("matches legacy output when recordSnapshot is undefined", async () => {
    const input = {
      patient: { age: 45, sex: "male" as const },
      clinicalFactors: {
        chiefComplaint: "Low back pain",
        duration: "8 weeks",
        symptoms: ["back pain"],
        redFlags: emptyRedFlags,
        priorImaging: false,
        conservativeManagementTried: true,
        conservativeManagementDuration: "6 weeks PT",
      },
      order: {
        modality: "MRI",
        bodyPart: "lumbar spine",
        procedure: "MRI lumbar spine without contrast",
      },
      age: 45,
      sex: "male" as const,
      chiefComplaint: "Low back pain",
      duration: "8 weeks",
      symptoms: ["back pain"],
      redFlags: emptyRedFlags,
      priorImaging: false,
      conservativeManagementTried: true,
      conservativeManagementDuration: "6 weeks PT",
      requestedModality: "MRI",
      requestedProcedure: "MRI lumbar spine without contrast",
    };

    const score = await scoreOrder(input);
    expect(score.factors.map((f) => f.id)).not.toContain("trauma_severity");
    expect(score.clinicalScore).toBeGreaterThanOrEqual(1);
    expect(score.clinicalScore).toBeLessThanOrEqual(9);
  });

  it("adds trauma_severity factor when snapshot is present", async () => {
    const snapshot = baseSnapshot({ injurySeverityScore: 4 });
    const score = await scoreOrder({
      patient: { age: 28, sex: "male" },
      clinicalFactors: {
        chiefComplaint: "Knee pain after fall",
        duration: "2 days",
        symptoms: ["knee pain"],
        redFlags: emptyRedFlags,
        priorImaging: false,
        conservativeManagementTried: false,
      },
      order: {
        modality: "MRI",
        bodyPart: "knee",
        procedure: "MRI knee",
      },
      age: 28,
      sex: "male",
      chiefComplaint: "Knee pain after fall",
      duration: "2 days",
      symptoms: ["knee pain"],
      redFlags: emptyRedFlags,
      priorImaging: false,
      conservativeManagementTried: false,
      requestedModality: "MRI",
      requestedProcedure: "MRI knee",
      recordSnapshot: snapshot,
    });

    const traumaFactor = score.factors.find((f) => f.id === "trauma_severity");
    expect(traumaFactor).toBeDefined();
    expect(traumaFactor?.weight).toBeCloseTo(0.1, 5);
    const weightSum = score.factors.reduce((s, f) => s + f.weight, 0);
    expect(weightSum).toBeCloseTo(1, 5);
    expect(score.clinicalScore).toBeGreaterThanOrEqual(1);
    expect(score.clinicalScore).toBeLessThanOrEqual(9);
  });
});
