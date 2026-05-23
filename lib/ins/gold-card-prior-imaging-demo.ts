import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

/**
 * Read-only demo snapshot for gold-card provider drawer prior-imaging mini sheet.
 *
 * @param cptCode - Selected portfolio CPT code.
 */
export function buildGoldCardPriorImagingSnapshot(cptCode: string): PatientRecordSnapshot {
  const capturedAtIso = new Date().toISOString();
  return {
    patientHash: "demo-gold-card-provider",
    capturedAtIso,
    ttlSeconds: 1800,
    problems: [],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging: [
      {
        id: "gc-img-1",
        startedIso: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        modality: ["CT"],
        bodySite: "Chest",
        description: "CT chest without contrast — prior authorization context",
      },
      {
        id: "gc-img-2",
        startedIso: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        modality: ["X-ray"],
        bodySite: "Chest",
        description: "Chest radiograph two-view",
      },
    ],
    priorReports: [
      {
        id: "gc-dr-1",
        issuedIso: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        procedureCode: cptCode,
        category: "CT",
        conclusionExcerpt: "No acute cardiopulmonary abnormality. Examination within normal limits.",
      },
      {
        id: "gc-dr-2",
        issuedIso: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        procedureCode: "71046",
        category: "X-ray",
        conclusionExcerpt: "Stable appearance compared with prior. No new focal opacity.",
      },
    ],
    labs: [],
    vitals: [],
    notes: [],
    codingContext: {
      activeIcd10: ["G93.41", "C79.31", "D49.6"],
      activeCpt: [cptCode, "71046"],
    },
  };
}
