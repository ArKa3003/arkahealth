import type { ClinicalScenario } from "@/lib/demos/clin/types";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

import { createHash } from "node:crypto";

/** Demo CPT hints by modality and body region for control-sheet display. */
function demoCptForPrior(modality: string, bodyPart: string): string | undefined {
  const mod = modality.toLowerCase();
  const part = bodyPart.toLowerCase();
  if (mod.includes("mri") && part.includes("lumbar")) {
    return "72148";
  }
  if ((mod.includes("x-ray") || mod.includes("xray")) && part.includes("lumbar")) {
    return "72100";
  }
  if (mod.includes("ct") && part.includes("head")) {
    return "70450";
  }
  if (mod.includes("ct") && part.includes("chest")) {
    return "71250";
  }
  return undefined;
}

/**
 * Builds a {@link PatientRecordSnapshot} from a CLIN demo scenario for the control sheet.
 * PHI-safe: hashes patient id and uses scrubbed demo strings only.
 *
 * @param scenario - Active clinical demo scenario.
 */
export function buildClinDemoRecordSnapshot(scenario: ClinicalScenario): PatientRecordSnapshot {
  const patientHash = createHash("sha256").update(scenario.patientId).digest("hex");
  const capturedAtIso = new Date().toISOString();

  const priorImaging = (scenario.priorImaging ?? []).map((prior, index) => ({
    id: `demo-img-${index}`,
    startedIso: prior.date,
    modality: [prior.modality],
    bodySite: prior.bodyPart,
    description: `${prior.modality} ${prior.bodyPart}`.trim(),
  }));

  const priorReports = (scenario.priorImaging ?? []).map((prior, index) => {
    const findings = (prior.findings ?? "").toLowerCase();
    const conclusion =
      findings.includes("normal") || findings.includes("unremarkable") ?
        "No acute abnormality. Examination within normal limits."
      : findings.includes("abnormal") ?
        "Abnormal findings documented on prior study."
      : prior.findings ?? "Prior imaging report on file.";
    return {
      id: `demo-dr-${index}`,
      issuedIso: prior.date,
      category: prior.modality,
      procedureCode: demoCptForPrior(prior.modality, prior.bodyPart),
      conclusionExcerpt: conclusion.slice(0, 500),
    };
  });

  const problems = buildDemoProblems(scenario);
  const encounters = buildDemoEncounters(scenario);

  return {
    patientHash,
    capturedAtIso,
    ttlSeconds: 1800,
    problems,
    medications: [],
    allergies: [],
    encounters,
    priorImaging,
    priorReports,
    labs: [],
    vitals: [],
    notes: [],
    codingContext: {
      activeIcd10: problems.map((p) => p.icd10).filter((c): c is string => Boolean(c)),
      activeCpt: priorReports.map((r) => r.procedureCode).filter((c): c is string => Boolean(c)),
    },
  };
}

function buildDemoProblems(scenario: ClinicalScenario) {
  const entries: PatientRecordSnapshot["problems"] = [];
  const complaint = scenario.chiefComplaint.trim();
  if (complaint) {
    entries.push({
      conditionId: "demo-problem-complaint",
      display: complaint,
      clinicalStatus: "active",
    });
  }
  const history = scenario.clinicalHistory.trim();
  if (history) {
    const chronicMatch = history.match(/\bchronic\s+[\w\s]*(?:back|lumbar)\s*pain\b/i);
    if (chronicMatch) {
      entries.push({
        conditionId: "demo-problem-history",
        display: chronicMatch[0],
        clinicalStatus: "active",
        icd10: "M54.5",
      });
    } else if (/back|lumbar/i.test(history) && !entries.some((e) => /back|lumbar/i.test(e.display))) {
      entries.push({
        conditionId: "demo-problem-history",
        display: history.slice(0, 200),
        clinicalStatus: "active",
      });
    }
  }
  return entries;
}

function buildDemoEncounters(scenario: ClinicalScenario) {
  const history = scenario.clinicalHistory.trim();
  if (!history) {
    return [];
  }
  return [
    {
      id: "demo-enc-0",
      reasonDisplay: history.slice(0, 500),
      periodStartIso: new Date().toISOString(),
      typeDisplay: "Office visit",
    },
  ];
}
