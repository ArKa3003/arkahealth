import { describe, it, expect } from "vitest";

import { scoreOrder } from "@/lib/aiie/scoring-engine";
import type { AIIEInput } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

function minimalInput(snapshot?: PatientRecordSnapshot): AIIEInput {
  return {
    patient: { age: 45, sex: "male" },
    clinicalFactors: {
      chiefComplaint: "Low back pain",
      duration: "8 weeks",
      symptoms: ["back pain"],
      redFlags: {
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
      },
      priorImaging: false,
      conservativeManagementTried: true,
      conservativeManagementDuration: "6 weeks PT",
    },
    order: {
      cpt: "72148",
      modality: "MRI",
      bodyPart: "lumbar spine",
      procedure: "MRI lumbar spine without contrast",
    },
    age: 45,
    sex: "male",
    chiefComplaint: "Low back pain",
    duration: "8 weeks",
    symptoms: ["back pain"],
    redFlags: {
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
    },
    priorImaging: false,
    conservativeManagementTried: true,
    conservativeManagementDuration: "6 weeks PT",
    requestedModality: "MRI",
    requestedProcedure: "MRI lumbar spine without contrast",
    recordSnapshot: snapshot,
  };
}

describe("scoreOrder MNAI enrichment", () => {
  const snapshot: PatientRecordSnapshot = {
    patientHash: "hash",
    capturedAtIso: new Date().toISOString(),
    ttlSeconds: 1800,
    problems: [
      {
        icd10: "M54.5",
        display: "Low back pain",
        clinicalStatus: "active",
        onsetIso: new Date(Date.now() - 50 * 86400000).toISOString(),
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
    codingContext: { activeIcd10: ["M54.5"], activeCpt: [] },
  };

  it("attaches mnai without changing clinicalScore when snapshot and CPT present", async () => {
    const withSnapshot = await scoreOrder(minimalInput(snapshot));
    const withoutSnapshot = await scoreOrder(minimalInput(undefined));

    expect(withSnapshot.mnai).toBeDefined();
    expect(withSnapshot.mnai?.curated).toBe(true);
    expect(withoutSnapshot.mnai).toBeUndefined();
    expect(withSnapshot.clinicalScore).toBeGreaterThanOrEqual(1);
    expect(withSnapshot.clinicalScore).toBeLessThanOrEqual(9);
    expect(withSnapshot.factors.some((f) => f.id === "trauma_severity")).toBe(true);
  });
});
