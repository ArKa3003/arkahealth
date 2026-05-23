import { describe, it, expect } from "vitest";

import { detectIncidentals } from "@/lib/aiie/incidentals";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

function snapshotWithReports(
  reports: PatientRecordSnapshot["priorReports"],
  capturedAtIso = "2026-05-20T12:00:00.000Z",
  priorImaging: PatientRecordSnapshot["priorImaging"] = [],
): PatientRecordSnapshot {
  return {
    patientHash: "test-hash",
    capturedAtIso,
    ttlSeconds: 1800,
    problems: [],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging,
    priorReports: reports,
    labs: [],
    vitals: [],
    notes: [],
    codingContext: { activeIcd10: [], activeCpt: [] },
  };
}

describe("detectIncidentals", () => {
  it("returns identical findings for the same snapshot (deterministic)", () => {
    const snapshot = snapshotWithReports([
      {
        id: "dr-1",
        issuedIso: "2025-06-01T00:00:00.000Z",
        conclusionExcerpt:
          "Incidental 7 mm pulmonary nodule in the right lower lobe. Recommend follow-up CT in 6 months.",
      },
    ]);

    const first = detectIncidentals(snapshot);
    const second = detectIncidentals(snapshot);
    expect(first).toEqual(second);
    expect(first.length).toBe(1);
    expect(first[0]?.category).toBe("pulmonary_nodule");
    expect(first[0]?.daysOverdue).toBeGreaterThan(0);
  });

  it("does not surface findings when follow-up chest CT exists after the report", () => {
    const reportDate = "2025-06-01T00:00:00.000Z";
    const snapshot = snapshotWithReports(
      [
        {
          id: "dr-1",
          issuedIso: reportDate,
          conclusionExcerpt: "Incidental pulmonary nodule, 8 mm. Follow-up CT recommended.",
        },
      ],
      "2026-05-20T12:00:00.000Z",
      [
        {
          id: "img-fu",
          startedIso: "2025-12-15T00:00:00.000Z",
          modality: ["CT"],
          bodySite: "chest",
          description: "CT chest nodule follow-up",
        },
      ],
    );

    expect(detectIncidentals(snapshot)).toEqual([]);
  });

  it("returns no findings for normal reports without incidental language", () => {
    const snapshot = snapshotWithReports([
      {
        id: "dr-normal",
        issuedIso: "2024-01-01T00:00:00.000Z",
        conclusionExcerpt: "No acute cardiopulmonary abnormality. Examination within normal limits.",
      },
    ]);

    expect(detectIncidentals(snapshot)).toEqual([]);
  });

  it("does not flag findings still inside the recommended interval", () => {
    const snapshot = snapshotWithReports([
      {
        id: "dr-recent",
        issuedIso: "2026-03-01T00:00:00.000Z",
        conclusionExcerpt: "Incidental thyroid nodule measuring 12 mm.",
      },
    ]);

    expect(detectIncidentals(snapshot)).toEqual([]);
  });

  it("uses capturedAtIso as the reference clock (not wall time)", () => {
    const snapshot = snapshotWithReports(
      [
        {
          id: "dr-fixed",
          issuedIso: "2025-01-01T00:00:00.000Z",
          conclusionExcerpt: "Incidental adrenal mass, indeterminate lipid content.",
        },
      ],
      "2025-07-04T00:00:00.000Z",
    );

    const findings = detectIncidentals(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.daysOverdue).toBe(1);
  });
});
