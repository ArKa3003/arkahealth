import { describe, it, expect } from "vitest";

import {
  evaluateRedundancy,
  parseImpressionTag,
  redundancyFactorDelta,
} from "@/lib/aiie/redundancy";
import type { AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

function baseSnapshot(priorImaging: PatientRecordSnapshot["priorImaging"]): PatientRecordSnapshot {
  return {
    patientHash: "test",
    capturedAtIso: new Date().toISOString(),
    ttlSeconds: 1800,
    problems: [],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging,
    priorReports: [
      {
        id: "dr-1",
        issuedIso: priorImaging[0]?.startedIso,
        procedureCode: "72148",
        conclusionExcerpt: "No acute abnormality. Examination within normal limits.",
      },
    ],
    labs: [],
    vitals: [],
    notes: [],
    codingContext: { activeIcd10: [], activeCpt: ["72148"] },
  };
}

describe("evaluateRedundancy", () => {
  const proposed: AIIEOrder = {
    cpt: "72148",
    modality: "MRI",
    bodyPart: "lumbar spine",
    procedure: "MRI lumbar spine",
  };

  it("returns high severity when same CPT within 30 days", () => {
    const started = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const snapshot = baseSnapshot([
      {
        id: "img-1",
        startedIso: started,
        modality: ["MRI"],
        bodySite: "lumbar spine",
        description: "MRI lumbar spine",
      },
    ]);

    const result = evaluateRedundancy(proposed, snapshot);
    expect(result.severity).toBe("high");
    expect(result.sameCpt).toBe(true);
    expect(result.suggestedAction).toBe("BLOCK_SOFT");
    expect(result.reason).toMatch(/Potential duplicate/i);
  });

  it("returns medium for same region different modality within 14 days", () => {
    const started = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const snapshot = baseSnapshot([
      {
        id: "img-2",
        startedIso: started,
        modality: ["CT"],
        bodySite: "lumbar spine",
        description: "CT lumbar spine",
      },
    ]);
    snapshot.priorReports = [
      {
        id: "dr-2",
        issuedIso: started,
        procedureCode: "72125",
        conclusionExcerpt: "Mild degenerative change.",
      },
    ];

    const result = evaluateRedundancy(proposed, snapshot);
    expect(result.severity).toBe("medium");
    expect(result.sameRegionDifferentModality).toBe(true);
    expect(result.suggestedAction).toBe("DISCUSS");
  });

  it("exposes append-only factor delta without replacing baseline signal", () => {
    const high = redundancyFactorDelta({
      severity: "high",
      reason: "",
      sameCpt: true,
      sameRegionDifferentModality: false,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "BLOCK_SOFT",
    });
    expect(high).toBeLessThan(0);
    expect(
      redundancyFactorDelta({
        severity: "none",
        reason: "",
        sameCpt: false,
        sameRegionDifferentModality: false,
        priorNormalWithoutRedFlags: false,
        suggestedAction: "PROCEED",
      }),
    ).toBe(0);
  });
});

describe("parseImpressionTag", () => {
  it("classifies normal and abnormal conclusions", () => {
    expect(parseImpressionTag("No acute abnormality. Within normal limits.")).toBe("normal");
    expect(parseImpressionTag("Mass effect with midline shift.")).toBe("abnormal");
    expect(parseImpressionTag("Findings are equivocal.")).toBe("equivocal");
  });
});
