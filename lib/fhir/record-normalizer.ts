import { scrubPhiText } from "@/lib/fhir/phi-scrub";
import { inferLaterality, inferViewCode } from "@/lib/viewer/view-infer";
import type {
  AllergyEntry,
  ClinicalNoteExcerpt,
  CodingContext,
  EncounterSummary,
  LabObservation,
  MedicationEntry,
  PatientRecordSnapshot,
  PriorDiagnosticReport,
  PriorImagingStudy,
  ProblemListEntry,
  VitalObservation,
} from "@/lib/types/record-snapshot";

const ICD10_SYSTEM = "http://hl7.org/fhir/sid/icd-10-cm";
const CPT_SYSTEM = "http://www.ama-assn.org/go/cpt";
const HCPCS_SYSTEM = "https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets";
const LOINC_ISS = "75261-1";
const LOINC_GCS = "9269-2";
const ADMISSION_DIAG_USE = "AD";

/** Minimal FHIR coding element used during normalization. */
export interface RawFhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

/** Minimal FHIR CodeableConcept used during normalization. */
export interface RawFhirCodeableConcept {
  coding?: RawFhirCoding[];
  text?: string;
}

/** A single resource entry merged from Patient/$everything and targeted searches. */
export interface RawFhirResource {
  resourceType: string;
  id?: string;
  code?: RawFhirCodeableConcept;
  clinicalStatus?: RawFhirCodeableConcept;
  onsetDateTime?: string;
  recordedDate?: string;
  medicationCodeableConcept?: RawFhirCodeableConcept;
  status?: string;
  effectivePeriod?: { start?: string; end?: string };
  effectiveDateTime?: string;
  category?: RawFhirCodeableConcept[];
  criticality?: string;
  class?: RawFhirCodeableConcept;
  type?: RawFhirCodeableConcept | RawFhirCodeableConcept[];
  period?: { start?: string; end?: string };
  reasonCode?: RawFhirCodeableConcept[];
  hospitalization?: { dischargeDisposition?: RawFhirCodeableConcept };
  diagnosis?: Array<{
    condition?: { reference?: string };
    use?: RawFhirCodeableConcept;
  }>;
  started?: string;
  uid?: string;
  identifier?: Array<{ system?: string; value?: string }>;
  modality?: Array<{ system?: string; code?: string; display?: string }>;
  bodySite?: RawFhirCodeableConcept[];
  description?: string;
  series?: Array<{
    description?: string;
    bodySite?: RawFhirCodeableConcept;
    modality?: { code?: string; display?: string };
    instance?: Array<{ title?: string; uid?: string }>;
  }>;
  issued?: string;
  conclusion?: string;
  valueQuantity?: { value?: number; unit?: string };
  valueString?: string;
  valueCodeableConcept?: RawFhirCodeableConcept;
  context?: {
    period?: { start?: string; end?: string };
  };
  subject?: { reference?: string };
}

/**
 * Merged FHIR bundle payload prior to normalization.
 */
export interface RawFhirBundle {
  /** SHA-256 hex digest of the patient logical id. */
  patientHash: string;
  /** Capture timestamp as ISO 8601. */
  capturedAtIso: string;
  /** TTL seconds applied when persisting this snapshot. */
  ttlSeconds: number;
  /** All resources collected from $everything and supplemental searches. */
  resources: RawFhirResource[];
}

function codingDisplay(concept: RawFhirCodeableConcept | undefined): string {
  if (!concept) {
    return "";
  }
  const fromCoding = concept.coding?.find((c) => c.display)?.display;
  return scrubPhiText(fromCoding ?? concept.text ?? "");
}

function icd10FromConcept(concept: RawFhirCodeableConcept | undefined): string | undefined {
  const coding = concept?.coding?.find((c) => c.system === ICD10_SYSTEM && c.code);
  return coding?.code;
}

function cptFromConcept(concept: RawFhirCodeableConcept | undefined): string | undefined {
  const coding = concept?.coding?.find(
    (c) =>
      (c.system === CPT_SYSTEM || c.system === HCPCS_SYSTEM) && c.code,
  );
  return coding?.code;
}

function loincCode(concept: RawFhirCodeableConcept | undefined): string | undefined {
  return concept?.coding?.find((c) => c.system === "http://loinc.org" && c.code)?.code;
}

function observationValueSummary(resource: RawFhirResource): string | undefined {
  if (resource.valueQuantity?.value !== undefined) {
    const unit = resource.valueQuantity.unit ?? "";
    return scrubPhiText(`${resource.valueQuantity.value} ${unit}`.trim());
  }
  if (resource.valueString) {
    return scrubPhiText(resource.valueString);
  }
  if (resource.valueCodeableConcept) {
    return codingDisplay(resource.valueCodeableConcept);
  }
  return undefined;
}

function parseNumericObservation(
  resources: RawFhirResource[],
  loinc: string,
): number | undefined {
  for (const r of resources) {
    if (r.resourceType !== "Observation") {
      continue;
    }
    const code = loincCode(r.code);
    if (code !== loinc) {
      continue;
    }
    const v = r.valueQuantity?.value;
    if (typeof v === "number" && Number.isFinite(v)) {
      return v;
    }
    const parsed = Number.parseFloat(r.valueString ?? "");
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function admissionIcd10FromEncounters(resources: RawFhirResource[]): string | undefined {
  for (const enc of resources) {
    if (enc.resourceType !== "Encounter" || !enc.diagnosis?.length) {
      continue;
    }
    for (const dx of enc.diagnosis) {
      const useCode = dx.use?.coding?.find((c) => c.code)?.code;
      if (useCode === ADMISSION_DIAG_USE) {
        const ref = dx.condition?.reference ?? "";
        const conditionId = ref.startsWith("Condition/") ? ref.slice(10) : ref;
        const condition = resources.find(
          (r) => r.resourceType === "Condition" && r.id === conditionId,
        );
        const icd = icd10FromConcept(condition?.code);
        if (icd) {
          return icd;
        }
      }
    }
  }
  return undefined;
}

function emptyCodingContext(): CodingContext {
  return { activeIcd10: [], activeCpt: [] };
}

/**
 * Maps merged FHIR resources into a {@link PatientRecordSnapshot} with PHI scrubbing.
 *
 * @param raw - Merged bundle from {@link scrapePatientRecord}.
 * @returns Typed snapshot for AIIE augmentation and cache storage.
 */
export function normalizeRecord(raw: RawFhirBundle): PatientRecordSnapshot {
  const activeIcd10 = new Set<string>();
  const activeCpt = new Set<string>();
  const poaFlags: Record<string, "Y" | "N" | "U" | "W"> = {};

  const problems: ProblemListEntry[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "Condition") {
      continue;
    }
    const icd = icd10FromConcept(r.code);
    if (icd) {
      activeIcd10.add(icd);
    }
    problems.push({
      conditionId: r.id,
      icd10: icd,
      display: codingDisplay(r.code) || scrubPhiText(r.code?.text),
      clinicalStatus: r.clinicalStatus?.coding?.[0]?.code,
      onsetIso: r.onsetDateTime ?? r.recordedDate,
    });
  }

  const medications: MedicationEntry[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "MedicationRequest" && r.resourceType !== "MedicationStatement") {
      continue;
    }
    const concept = r.medicationCodeableConcept ?? r.code;
    medications.push({
      id: r.id,
      code: concept?.coding?.[0]?.code,
      display: codingDisplay(concept),
      status: r.status,
      effectiveStartIso: r.effectivePeriod?.start ?? r.effectiveDateTime,
    });
  }

  const allergies: AllergyEntry[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "AllergyIntolerance") {
      continue;
    }
    allergies.push({
      id: r.id,
      display: codingDisplay(r.code),
      clinicalStatus: r.clinicalStatus?.coding?.[0]?.code,
      criticality: r.criticality,
    });
  }

  const encounters: EncounterSummary[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "Encounter") {
      continue;
    }
    const typeArr = Array.isArray(r.type) ? r.type : r.type ? [r.type] : [];
    const typeDisplay = typeArr.map((t) => codingDisplay(t)).filter(Boolean).join("; ");
    encounters.push({
      id: r.id,
      typeDisplay: typeDisplay || codingDisplay(r.class),
      periodStartIso: r.period?.start,
      periodEndIso: r.period?.end,
      reasonDisplay: r.reasonCode?.map((rc) => codingDisplay(rc)).join("; "),
      dischargeDisposition: codingDisplay(r.hospitalization?.dischargeDisposition),
    });
    for (const dx of r.diagnosis ?? []) {
      const useCode = dx.use?.coding?.[0]?.code;
      if (useCode && dx.condition?.reference) {
        const ref = dx.condition.reference;
        const conditionId = ref.startsWith("Condition/") ? ref.slice(10) : ref;
        const condition = raw.resources.find(
          (c) => c.resourceType === "Condition" && c.id === conditionId,
        );
        const icd = icd10FromConcept(condition?.code);
        if (icd && useCode.length <= 2) {
          const poa = useCode.toUpperCase();
          if (poa === "Y" || poa === "N" || poa === "U" || poa === "W") {
            poaFlags[icd] = poa;
          }
        }
      }
    }
  }

  const priorImaging: PriorImagingStudy[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "ImagingStudy") {
      continue;
    }
    const bodySiteText = r.bodySite?.map((b) => codingDisplay(b)).join("; ");
    const seriesText = (r.series ?? [])
      .map((s) => s.description ?? s.instance?.[0]?.title ?? "")
      .filter(Boolean)
      .join(" ");
    const description = scrubPhiText(r.description);
    const view =
      inferViewCode(description) ??
      inferViewCode(seriesText) ??
      inferViewCode(bodySiteText);
    const laterality =
      inferLaterality(bodySiteText) ?? inferLaterality(description);
    priorImaging.push({
      id: r.id,
      studyUid: r.uid?.trim() || undefined,
      startedIso: r.started,
      modality: (r.modality ?? []).map((m) => m.display ?? m.code ?? "").filter(Boolean),
      bodySite: bodySiteText,
      view,
      laterality,
      description,
    });
  }

  const priorReports: PriorDiagnosticReport[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "DiagnosticReport") {
      continue;
    }
    const cpt = r.code ? cptFromConcept(r.code) : undefined;
    if (cpt) {
      activeCpt.add(cpt);
    }
    priorReports.push({
      id: r.id,
      issuedIso: r.issued,
      category: r.category?.map((c) => codingDisplay(c)).join("; "),
      procedureCode: cpt,
      conclusionExcerpt: scrubPhiText(r.conclusion),
    });
  }

  const labs: LabObservation[] = [];
  const vitals: VitalObservation[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "Observation") {
      continue;
    }
    const categories = (r.category ?? []).flatMap((c) => c.coding ?? []);
    const isLab = categories.some((c) => c.code === "laboratory");
    const isVital = categories.some((c) => c.code === "vital-signs");
    const row = {
      id: r.id,
      code: loincCode(r.code) ?? r.code?.coding?.[0]?.code,
      display: codingDisplay(r.code),
      effectiveIso: r.effectiveDateTime ?? r.effectivePeriod?.start,
      valueSummary: observationValueSummary(r),
    };
    if (isLab) {
      labs.push(row);
    } else if (isVital) {
      vitals.push(row);
    }
  }

  const notes: ClinicalNoteExcerpt[] = [];
  for (const r of raw.resources) {
    if (r.resourceType !== "DocumentReference") {
      continue;
    }
    const typeConcept = Array.isArray(r.type) ? r.type[0] : r.type;
    notes.push({
      id: r.id,
      description: scrubPhiText(r.description),
      periodStartIso: r.context?.period?.start,
      periodEndIso: r.context?.period?.end,
      typeCodings: (typeConcept?.coding ?? []).map((c) => ({
        system: c.system,
        code: c.code,
        display: scrubPhiText(c.display),
      })),
    });
  }

  const injurySeverityScore = parseNumericObservation(raw.resources, LOINC_ISS);
  const glasgowComaScale = parseNumericObservation(raw.resources, LOINC_GCS);
  const admissionIcd10 = admissionIcd10FromEncounters(raw.resources);
  if (admissionIcd10) {
    activeIcd10.add(admissionIcd10);
  }

  const codingContext: CodingContext = {
    activeIcd10: [...activeIcd10],
    activeCpt: [...activeCpt],
    admissionIcd10,
    injurySeverityScore,
    glasgowComaScale,
    poaFlags: Object.keys(poaFlags).length > 0 ? poaFlags : undefined,
  };

  return {
    patientHash: raw.patientHash,
    capturedAtIso: raw.capturedAtIso,
    ttlSeconds: raw.ttlSeconds,
    problems,
    medications,
    allergies,
    encounters,
    priorImaging,
    priorReports,
    labs,
    vitals,
    notes,
    codingContext,
  };
}

/**
 * Builds an empty snapshot for patients with no retrievable FHIR resources.
 *
 * @param patientHash - SHA-256 hex digest of the patient id.
 * @param capturedAtIso - Capture timestamp.
 * @param ttlSeconds - Cache TTL in seconds.
 */
export function emptyRecordSnapshot(
  patientHash: string,
  capturedAtIso: string,
  ttlSeconds: number,
): PatientRecordSnapshot {
  return {
    patientHash,
    capturedAtIso,
    ttlSeconds,
    problems: [],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging: [],
    priorReports: [],
    labs: [],
    vitals: [],
    notes: [],
    codingContext: emptyCodingContext(),
  };
}
