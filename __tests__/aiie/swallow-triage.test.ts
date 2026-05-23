import { describe, it, expect } from "vitest";

import {
  isSwallowStudyOrder,
  triageSwallow,
} from "@/lib/aiie/swallow-triage";
import { scoreOrder } from "@/lib/aiie/scoring-engine";
import type { AIIEOrder, AIIEInput, AIIERedFlags } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

const vfssOrder: AIIEOrder = {
  modality: "X-ray",
  procedure: "Video fluoroscopic swallow study (VFSS)",
  bodyPart: "swallow",
};

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

function baseSnapshot(notes: string[] = []): PatientRecordSnapshot {
  return {
    patientHash: "a".repeat(64),
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
    notes: notes.map((description, i) => ({
      id: `n-${i}`,
      description,
      typeCodings: [],
    })),
    codingContext: { activeIcd10: [], activeCpt: [] },
  };
}

describe("isSwallowStudyOrder", () => {
  it("matches VFSS and FEES procedure text only", () => {
    expect(isSwallowStudyOrder("MRI lumbar spine")).toBe(false);
    expect(isSwallowStudyOrder("modified barium swallow")).toBe(true);
    expect(isSwallowStudyOrder("FEES bedside")).toBe(true);
  });
});

describe("triageSwallow rule rows", () => {
  it("stroke with aspiration concern recommends FEES unless posterior fossa", () => {
    const assessment = triageSwallow({
      snapshot: baseSnapshot(),
      order: vfssOrder,
      complaint: "acute ischemic stroke with aspiration on bedside screen",
    });

    expect(assessment.recommendation).toBe("FEES");
    expect(assessment.supportingFactors[0]?.id).toBe("swallow_stroke_aspiration");
    expect(assessment.disagreesWithProposed).toBe(true);
  });

  it("post-extubation recommends bedside SLP evaluation first", () => {
    const assessment = triageSwallow({
      snapshot: baseSnapshot(["post-extubation dysphagia, SLP consult requested"]),
      order: vfssOrder,
      complaint: "difficulty swallowing after extubation",
    });

    expect(assessment.recommendation).toBe("bedside_sle");
    expect(assessment.supportingFactors[0]?.id).toBe("swallow_post_extubation");
  });

  it("progressive neuromuscular disease recommends VFSS", () => {
    const assessment = triageSwallow({
      snapshot: baseSnapshot(["ALS with progressive bulbar weakness"]),
      order: vfssOrder,
      complaint: "dysphagia",
    });

    expect(assessment.recommendation).toBe("VFSS");
    expect(assessment.supportingFactors[0]?.id).toBe("swallow_neuromuscular");
  });

  it("esophageal phase concern / reflux recommends VFSS", () => {
    const assessment = triageSwallow({
      snapshot: baseSnapshot(),
      order: vfssOrder,
      complaint: "esophageal phase dysphagia with GERD and reflux",
    });

    expect(assessment.recommendation).toBe("VFSS");
    expect(assessment.supportingFactors[0]?.id).toBe("swallow_esophageal_phase");
  });

  it("head and neck cancer post-treatment recommends VFSS", () => {
    const assessment = triageSwallow({
      snapshot: baseSnapshot(["head and neck cancer post-radiation dysphagia"]),
      order: vfssOrder,
      complaint: "swallow evaluation",
    });

    expect(assessment.recommendation).toBe("VFSS");
    expect(assessment.supportingFactors[0]?.id).toBe("swallow_head_neck_cancer");
  });

  it("no red flags recommends clinical bedside swallow eval", () => {
    const assessment = triageSwallow({
      snapshot: baseSnapshot(),
      order: vfssOrder,
      complaint: "mild throat discomfort after cold",
    });

    expect(assessment.recommendation).toBe("bedside_sle");
    expect(assessment.supportingFactors[0]?.id).toBe("swallow_bedside_first");
    expect(assessment.disagreesWithProposed).toBe(true);
  });
});

describe("scoreOrder swallow integration", () => {
  it("appends swallow factors when snapshot present and behaves without snapshot otherwise", async () => {
    const base: AIIEInput = {
      patient: { age: 72, sex: "female" },
      clinicalFactors: {
        chiefComplaint: "dysphagia after stroke with aspiration",
        duration: "2 days",
        symptoms: ["dysphagia"],
        redFlags: emptyRedFlags,
        priorImaging: false,
        conservativeManagementTried: false,
      },
      order: vfssOrder,
      age: 72,
      sex: "female",
      chiefComplaint: "dysphagia after stroke with aspiration",
      duration: "2 days",
      symptoms: ["dysphagia"],
      redFlags: emptyRedFlags,
      priorImaging: false,
      conservativeManagementTried: false,
      requestedModality: vfssOrder.modality,
      requestedProcedure: vfssOrder.procedure,
    };

    const withoutSnapshot = await scoreOrder(base);
    const swallowFactorIds = withoutSnapshot.factors.map((f) => f.id);
    expect(swallowFactorIds).not.toContain("swallow_stroke_aspiration");

    const withSnapshot = await scoreOrder({
      ...base,
      recordSnapshot: baseSnapshot(),
    });
    expect(withSnapshot.factors.some((f) => f.id.startsWith("swallow_"))).toBe(true);
  });
});
