import { describe, it, expect } from "vitest";

import {
  proposeAutofill,
  isRequisitionIncomplete,
} from "@/lib/aiie/requisition-autofill";
import type { AIIEClinicalFactors, AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

const emptyRedFlags: AIIEClinicalFactors["redFlags"] = {
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

function incompleteFactors(overrides?: Partial<AIIEClinicalFactors>): AIIEClinicalFactors {
  return {
    chiefComplaint: "Back pain",
    duration: "",
    symptoms: [],
    redFlags: emptyRedFlags,
    priorImaging: false,
    conservativeManagementTried: false,
    ...overrides,
  };
}

const lumbarMriOrder: AIIEOrder = {
  cpt: "72148",
  modality: "MRI",
  bodyPart: "lumbar spine",
  procedure: "MRI lumbar spine without contrast",
};

describe("proposeAutofill", () => {
  it("proposes duration from chronic low back pain on problem list for lumbar MRI", () => {
    const snapshot: PatientRecordSnapshot = {
      patientHash: "hash",
      capturedAtIso: new Date().toISOString(),
      ttlSeconds: 1800,
      problems: [
        {
          display: "chronic low back pain",
          clinicalStatus: "active",
          icd10: "M54.5",
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

    const proposal = proposeAutofill({
      snapshot,
      order: lumbarMriOrder,
      existing: incompleteFactors(),
    });

    const durationField = proposal.fields.find((f) => f.path === "clinicalFactors.duration");
    expect(durationField).toBeDefined();
    expect(durationField?.source).toBe("problem_list");
    expect(durationField?.value).toMatch(/weeks/i);
    expect(durationField?.citation).toContain("chronic low back pain");
  });

  it("returns no proposals when requisition is complete", () => {
    const snapshot: PatientRecordSnapshot = {
      patientHash: "h",
      capturedAtIso: new Date().toISOString(),
      ttlSeconds: 1800,
      problems: [{ display: "chronic low back pain", clinicalStatus: "active" }],
      medications: [],
      allergies: [],
      encounters: [],
      priorImaging: [],
      priorReports: [],
      labs: [],
      vitals: [],
      notes: [],
      codingContext: { activeIcd10: [], activeCpt: [] },
    };

    const proposal = proposeAutofill({
      snapshot,
      order: lumbarMriOrder,
      existing: incompleteFactors({
        duration: "8 weeks",
        symptoms: ["low back pain"],
        conservativeManagementTried: true,
        conservativeManagementDuration: "6 weeks PT",
      }),
    });

    expect(proposal.fields).toHaveLength(0);
    expect(isRequisitionIncomplete(incompleteFactors({
      duration: "8 weeks",
      symptoms: ["low back pain"],
      conservativeManagementTried: true,
      conservativeManagementDuration: "6 weeks PT",
    }))).toBe(false);
  });

  it("is deterministic for identical inputs", () => {
    const snapshot: PatientRecordSnapshot = {
      patientHash: "h",
      capturedAtIso: new Date().toISOString(),
      ttlSeconds: 1800,
      problems: [{ display: "chronic low back pain", clinicalStatus: "active" }],
      medications: [],
      allergies: [],
      encounters: [],
      priorImaging: [],
      priorReports: [],
      labs: [],
      vitals: [],
      notes: [],
      codingContext: { activeIcd10: [], activeCpt: [] },
    };
    const input = {
      snapshot,
      order: lumbarMriOrder,
      existing: incompleteFactors(),
    };
    expect(proposeAutofill(input)).toEqual(proposeAutofill(input));
  });
});
