import { describe, it, expect } from "vitest";
import { evaluateRAAS } from "@/lib/demos/rural/scoring/raas-engine";
import { DEMO_FACILITIES } from "@/lib/demos/rural/facility-profiles";

describe("RAAS Engine", () => {
  const facility = DEMO_FACILITIES[0]; // Prairie View (CAH, X-ray + US only)

  it("should return higher RAAS for locally available modality", () => {
    const result = evaluateRAAS({
      clinicalScenario: {
        patientId: "test",
        age: 35,
        sex: "male",
        chiefComplaint: "Wrist pain after fall",
        clinicalHistory: "No PMH",
        symptoms: ["Wrist pain", "Swelling"],
        duration: "2 hours",
        redFlags: [{ flag: "Deformity", present: true }],
        proposedImaging: { modality: "X-ray", bodyPart: "Wrist", indication: "Fracture eval", urgency: "urgent" },
      },
      facilityProfile: facility,
      patientContext: {
        distanceToFacilityMiles: 10,
        transportationAccess: "own-vehicle",
        employmentImpact: "half-day",
        childcareNeeded: false,
        insuranceType: "Commercial",
        preferredLanguage: "English",
        mobilityLimitations: false,
      },
    });

    expect(result.triageRecommendation.tier).toBe("local-first");
    expect(result.resourceAdjustedScore.value).toBeGreaterThanOrEqual(result.clinicalAppropriatenessScore.value);
  });

  it("should recommend transfer for STAT CT at facility without CT", () => {
    const result = evaluateRAAS({
      clinicalScenario: {
        patientId: "test",
        age: 68,
        sex: "female",
        chiefComplaint: "Acute weakness",
        clinicalHistory: "HTN, Afib",
        symptoms: ["Left-sided weakness", "Slurred speech"],
        duration: "30 minutes",
        redFlags: [
          { flag: "Acute neuro deficit", present: true },
          { flag: "tPA window", present: true },
        ],
        proposedImaging: { modality: "CT", bodyPart: "Head", indication: "Stroke eval", urgency: "stat" },
      },
      facilityProfile: facility,
      patientContext: {
        distanceToFacilityMiles: 5,
        transportationAccess: "medical-transport",
        employmentImpact: "minimal",
        childcareNeeded: false,
        insuranceType: "Medicare",
        preferredLanguage: "English",
        mobilityLimitations: true,
      },
    });

    expect(result.triageRecommendation.tier).toBe("transfer");
    expect(result.urgencyClassification).toBe("emergent");
  });

  it("should recommend mobile unit for routine MRI", () => {
    const result = evaluateRAAS({
      clinicalScenario: {
        patientId: "test",
        age: 52,
        sex: "male",
        chiefComplaint: "Knee pain",
        clinicalHistory: "Failed PT",
        symptoms: ["Knee pain", "Locking"],
        duration: "3 months",
        redFlags: [{ flag: "Locking", present: true }],
        proposedImaging: { modality: "MRI", bodyPart: "Knee", indication: "Meniscal tear", urgency: "routine" },
      },
      facilityProfile: facility,
      patientContext: {
        distanceToFacilityMiles: 30,
        transportationAccess: "own-vehicle",
        employmentImpact: "full-day",
        childcareNeeded: false,
        insuranceType: "Commercial",
        preferredLanguage: "English",
        mobilityLimitations: false,
      },
    });

    expect(result.triageRecommendation.tier).toBe("mobile-unit");
  });
});
