/**
 * Typed patient record snapshot produced by FHIR bulk scrape and normalization.
 * No raw patient identifiers are stored in cache — only {@link PatientRecordSnapshot.patientHash}.
 */

/** A single problem-list entry derived from FHIR Condition. */
export interface ProblemListEntry {
  /** FHIR Condition logical id when present. */
  conditionId?: string;
  /** ICD-10-CM code when mapped from Condition.code. */
  icd10?: string;
  /** Human-readable problem display text (PHI-scrubbed, truncated). */
  display: string;
  /** Clinical status such as active or resolved. */
  clinicalStatus?: string;
  /** Onset or recorded date as ISO 8601. */
  onsetIso?: string;
}

/** A medication row from MedicationRequest or MedicationStatement. */
export interface MedicationEntry {
  /** FHIR resource logical id. */
  id?: string;
  /** RxNorm or other coded medication identifier. */
  code?: string;
  /** Display name (PHI-scrubbed). */
  display: string;
  /** Status such as active or stopped. */
  status?: string;
  /** Effective period start as ISO 8601. */
  effectiveStartIso?: string;
}

/** An allergy or intolerance entry. */
export interface AllergyEntry {
  /** FHIR AllergyIntolerance logical id. */
  id?: string;
  /** Substance or category display (PHI-scrubbed). */
  display: string;
  /** Clinical status. */
  clinicalStatus?: string;
  /** Criticality when documented. */
  criticality?: string;
}

/** Summarized encounter for appropriateness context. */
export interface EncounterSummary {
  /** FHIR Encounter logical id. */
  id?: string;
  /** Encounter class or type display. */
  typeDisplay?: string;
  /** Period start as ISO 8601. */
  periodStartIso?: string;
  /** Period end as ISO 8601. */
  periodEndIso?: string;
  /** Reason for visit text (PHI-scrubbed). */
  reasonDisplay?: string;
  /** Discharge disposition when present. */
  dischargeDisposition?: string;
}

/** Prior imaging study metadata (no DICOM pixels). */
export interface PriorImagingStudy {
  /** FHIR ImagingStudy logical id. */
  id?: string;
  /** DICOM Study Instance UID when present on ImagingStudy.uid. */
  studyUid?: string;
  /** Study started timestamp as ISO 8601. */
  startedIso?: string;
  /** Modality codes or display summary. */
  modality: string[];
  /** Body site description. */
  bodySite?: string;
  /** Projection / view code (e.g. PA, AP, LAT) for reference-viewer matching. */
  view?: string;
  /** Laterality when documented (L, R, bilateral). */
  laterality?: string;
  /** Study description (PHI-scrubbed). */
  description?: string;
  /** Accession number from ImagingStudy.identifier when present. */
  accessionNumber?: string;
  /** Ordering or referring provider display from ImagingStudy.referrer when present. */
  orderingProvider?: string;
}

/** Prior diagnostic report narrative excerpt. */
export interface PriorDiagnosticReport {
  /** FHIR DiagnosticReport logical id. */
  id?: string;
  /** Report issued date as ISO 8601. */
  issuedIso?: string;
  /** Report category display. */
  category?: string;
  /** CPT or HCPCS procedure code when present on the report. */
  procedureCode?: string;
  /** Conclusion or result narrative (PHI-scrubbed, truncated). */
  conclusionExcerpt?: string;
}

/** Laboratory observation row. */
export interface LabObservation {
  /** FHIR Observation logical id. */
  id?: string;
  /** LOINC or local code. */
  code?: string;
  /** Display name. */
  display: string;
  /** Effective or issued time as ISO 8601. */
  effectiveIso?: string;
  /** Numeric or string value summary (PHI-scrubbed). */
  valueSummary?: string;
}

/** Vital-sign observation row. */
export interface VitalObservation {
  /** FHIR Observation logical id. */
  id?: string;
  /** LOINC or local code. */
  code?: string;
  /** Display name. */
  display: string;
  /** Effective time as ISO 8601. */
  effectiveIso?: string;
  /** Value summary (PHI-scrubbed). */
  valueSummary?: string;
}

/** Clinical note excerpt from DocumentReference (no binary content). */
export interface ClinicalNoteExcerpt {
  /** FHIR DocumentReference logical id. */
  id?: string;
  /** Document description (PHI-scrubbed). */
  description?: string;
  /** Context period start as ISO 8601. */
  periodStartIso?: string;
  /** Context period end as ISO 8601. */
  periodEndIso?: string;
  /** Document type codings. */
  typeCodings: Array<{ system?: string; code?: string; display?: string }>;
}

/** Billing and trauma coding context extracted from the record. */
export interface CodingContext {
  /** Active ICD-10-CM codes from problem list and encounters. */
  activeIcd10: string[];
  /** Active CPT or HCPCS procedure codes when present on orders or reports. */
  activeCpt: string[];
  /** Admission diagnosis ICD-10 when Encounter.diagnosis use is AD. */
  admissionIcd10?: string;
  /** Injury Severity Score from LOINC 75261-1 when present. */
  injurySeverityScore?: number;
  /** Glasgow Coma Scale total from LOINC 9269-2 when present. */
  glasgowComaScale?: number;
  /** E/M level code or display when documented. */
  eAndMLevel?: string;
  /** Present-on-admission flags keyed by ICD-10 code. */
  poaFlags?: Record<string, "Y" | "N" | "U" | "W">;
}

/**
 * Normalized per-patient clinical record used to augment AIIE scoring inputs.
 */
export interface PatientRecordSnapshot {
  /** SHA-256 hex digest of the source patient logical id (never store raw id in cache). */
  patientHash: string;
  /** Snapshot capture timestamp as ISO 8601. */
  capturedAtIso: string;
  /** Cache TTL in seconds used when this snapshot was written. */
  ttlSeconds: number;
  /** Problem list entries. */
  problems: ProblemListEntry[];
  /** Medication list entries. */
  medications: MedicationEntry[];
  /** Allergy entries. */
  allergies: AllergyEntry[];
  /** Encounter summaries. */
  encounters: EncounterSummary[];
  /** Prior imaging studies. */
  priorImaging: PriorImagingStudy[];
  /** Prior diagnostic reports. */
  priorReports: PriorDiagnosticReport[];
  /** Laboratory observations. */
  labs: LabObservation[];
  /** Vital-sign observations. */
  vitals: VitalObservation[];
  /** Clinical note excerpts (metadata only). */
  notes: ClinicalNoteExcerpt[];
  /** Consolidated coding context for payer and trauma signals. */
  codingContext: CodingContext;
}
