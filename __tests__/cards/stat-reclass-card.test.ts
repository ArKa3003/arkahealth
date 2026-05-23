import { describe, expect, it } from "vitest";

import { evaluateStat } from "@/lib/aiie/stat-gate";
import { buildStatReclassCard } from "@/lib/cards/stat-reclass-card";
import { detailIncludesFdaDisclosure } from "@/lib/compliance/fda-disclosure";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import type { ServiceRequest } from "@/lib/types/fhir";

function emptySnapshot(): PatientRecordSnapshot {
  return {
    patientHash: "h",
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
    codingContext: { activeIcd10: [], activeCpt: [] },
  };
}

describe("buildStatReclassCard", () => {
  it("emits warning card with urgent suggestion when STAT criteria not met", () => {
    const gate = evaluateStat({
      snapshot: emptySnapshot(),
      order: { modality: "CT", procedure: "CT head without contrast", bodyPart: "head" },
      complaint: "chronic headache",
      priority: "stat",
      patientAgeYears: 40,
    });
    expect(gate.meetsCriteria).toBe(false);

    const sr: ServiceRequest = {
      resourceType: "ServiceRequest",
      id: "sr-1",
      intent: "order",
      priority: "stat",
      subject: { reference: "Patient/p1" },
    };
    const card = buildStatReclassCard({ gate, serviceRequest: sr });
    expect(card.uuid).toBe("arka-ins-stat-reclass");
    expect(card.indicator).toBe("warning");
    expect(detailIncludesFdaDisclosure(card.detail)).toBe(true);
    expect(card.suggestions?.[0]?.actions?.[0]?.type).toBe("update");
  });
});
