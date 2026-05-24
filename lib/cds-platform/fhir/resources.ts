/**
 * @file resources.ts
 * @description TypeScript interfaces for FHIR R4 resources used by the CDS Hooks pipeline.
 * Spec-compliant with HL7 FHIR R4. All dates are ISO 8601 strings.
 */

// =============================================================================
// Shared / common types (FHIR R4 data types)
// =============================================================================

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

export interface HumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Quantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'old' | 'secondary';
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text?: string;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: Period;
}

export interface Address {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
}

// =============================================================================
// Bundle
// =============================================================================

export interface FHIRBundleEntry<T> {
  fullUrl?: string;
  resource?: T;
  search?: { mode?: 'match' | 'include' | 'outcome' };
  request?: {
    method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url?: string;
    ifNoneMatch?: string;
    ifModifiedSince?: string;
    ifMatch?: string;
    ifNoneExist?: string;
  };
  response?: {
    status?: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: unknown;
  };
}

export interface FHIRBundle<T> {
  resourceType: 'Bundle';
  id?: string;
  meta?: { lastUpdated?: string; profile?: string[] };
  implicitRules?: string;
  language?: string;
  identifier?: Identifier;
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;
  total?: number;
  link?: Array<{ relation?: string; url?: string }>;
  entry?: FHIRBundleEntry<T>[];
  signature?: unknown;
}

// =============================================================================
// Patient
// =============================================================================

export interface FHIRPatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  organization?: Reference;
  period?: Period;
}

export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  meta?: { lastUpdated?: string; profile?: string[] };
  implicitRules?: string;
  language?: string;
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  contact?: FHIRPatientContact[];
  communication?: Array<{ language: CodeableConcept; preferred?: boolean }>;
  generalPractitioner?: Reference[];
  managingOrganization?: Reference;
  link?: Array<{ other: Reference; type: 'replaced-by' | 'replaces' | 'refer' | 'seealso' }>;
}

// =============================================================================
// Condition
// =============================================================================

export interface FHIRConditionStage {
  summary?: CodeableConcept;
  type?: CodeableConcept;
  assessment?: Reference[];
}

export interface FHIRConditionEvidence {
  code?: CodeableConcept[];
  detail?: Reference[];
}

export interface FHIRCondition {
  resourceType: 'Condition';
  id?: string;
  meta?: { lastUpdated?: string; profile?: string[] };
  implicitRules?: string;
  language?: string;
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject?: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: Quantity;
  onsetPeriod?: Period;
  onsetRange?: unknown;
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: Quantity;
  abatementPeriod?: Period;
  abatementRange?: unknown;
  abatementString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  stage?: FHIRConditionStage[];
  evidence?: FHIRConditionEvidence[];
  note?: Annotation[];
}

// =============================================================================
// ServiceRequest
// =============================================================================

export interface FHIRServiceRequest {
  resourceType: 'ServiceRequest';
  id?: string;
  meta?: { lastUpdated?: string; profile?: string[] };
  implicitRules?: string;
  language?: string;
  identifier?: Identifier[];
  instantiatesCanonical?: string[];
  instantiatesUri?: string[];
  basedOn?: Reference[];
  replaces?: Reference[];
  requisition?: Identifier;
  status?: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'inactive' | 'entered-in-error' | 'unknown';
  intent?: 'proposal' | 'plan' | 'directive' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  category?: CodeableConcept[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  doNotPerform?: boolean;
  code?: CodeableConcept;
  orderDetail?: CodeableConcept[];
  subject?: Reference;
  encounter?: Reference;
  occurrenceDateTime?: string;
  occurrencePeriod?: Period;
  occurrenceTiming?: unknown;
  asNeededBoolean?: boolean;
  asNeededCodeableConcept?: CodeableConcept;
  authoredOn?: string;
  requester?: Reference;
  performerType?: CodeableConcept;
  performer?: Reference[];
  locationCode?: CodeableConcept[];
  locationReference?: Reference[];
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  insurance?: Reference[];
  supportingInfo?: Reference[];
  specimen?: Reference[];
  bodySite?: CodeableConcept[];
  note?: Annotation[];
  patientInstruction?: string;
  relevantHistory?: Reference[];
}

// =============================================================================
// ImagingStudy
// =============================================================================

export interface FHIRImagingStudySeriesInstance {
  uid?: string;
  sopClass?: Coding;
  number?: number;
  title?: string;
}

export interface FHIRImagingStudySeries {
  uid?: string;
  number?: number;
  modality?: Coding;
  description?: string;
  numberOfInstances?: number;
  endpoint?: Reference[];
  bodySite?: Coding;
  laterality?: Coding;
  specimen?: Reference[];
  started?: string;
  performer?: Array<{ function?: CodeableConcept; actor: Reference }>;
  instance?: FHIRImagingStudySeriesInstance[];
}

export interface FHIRImagingStudy {
  resourceType: 'ImagingStudy';
  id?: string;
  meta?: { lastUpdated?: string; profile?: string[] };
  implicitRules?: string;
  language?: string;
  identifier?: Identifier[];
  status?: 'registered' | 'available' | 'cancelled' | 'entered-in-error' | 'unknown';
  modality?: Coding[];
  subject?: Reference;
  encounter?: Reference;
  started?: string;
  basedOn?: Reference[];
  referrer?: Reference;
  interpreter?: Reference[];
  endpoint?: Reference[];
  numberOfSeries?: number;
  numberOfInstances?: number;
  procedureReference?: Reference;
  procedureCode?: CodeableConcept[];
  location?: Reference;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  note?: Annotation[];
  description?: string;
  series?: FHIRImagingStudySeries[];
}

// =============================================================================
// Observation (lab results, eGFR, etc.)
// =============================================================================

export interface FHIRObservationReferenceRange {
  low?: Quantity;
  high?: Quantity;
  type?: CodeableConcept;
  appliesTo?: CodeableConcept[];
  age?: unknown;
  text?: string;
}

export interface FHIRObservationComponent {
  code: CodeableConcept;
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: unknown;
  valueRatio?: unknown;
  valueSampledData?: unknown;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  referenceRange?: FHIRObservationReferenceRange[];
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id?: string;
  meta?: { lastUpdated?: string; profile?: string[] };
  implicitRules?: string;
  language?: string;
  identifier?: Identifier[];
  status?: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: CodeableConcept[];
  code?: CodeableConcept;
  subject?: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  effectiveTiming?: unknown;
  effectiveInstant?: string;
  issued?: string;
  performer?: Reference[];
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: unknown;
  valueRatio?: unknown;
  valueSampledData?: unknown;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  valueReference?: Reference;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  note?: Annotation[];
  referenceRange?: FHIRObservationReferenceRange[];
  component?: FHIRObservationComponent[];
}

// =============================================================================
// MedicationRequest
// =============================================================================

export interface FHIRMedicationRequestDosageInstruction {
  sequence?: number;
  text?: string;
  additionalInstruction?: CodeableConcept[];
  patientInstruction?: string;
  timing?: unknown;
  asNeededBoolean?: boolean;
  asNeededCodeableConcept?: CodeableConcept;
  site?: CodeableConcept;
  route?: CodeableConcept;
  method?: CodeableConcept;
  doseAndRate?: Array<{
    type?: CodeableConcept;
    doseRange?: unknown;
    doseQuantity?: Quantity;
    rateRatio?: unknown;
    rateRange?: unknown;
    rateQuantity?: Quantity;
  }>;
  maxDosePerPeriod?: unknown;
  maxDosePerAdministration?: Quantity;
  maxDosePerLifetime?: Quantity;
}

export interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id?: string;
  meta?: { lastUpdated?: string; profile?: string[] };
  implicitRules?: string;
  language?: string;
  identifier?: Identifier[];
  status?: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown';
  intent?: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  category?: CodeableConcept[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject?: Reference;
  encounter?: Reference;
  supportingInformation?: Reference[];
  authoredOn?: string;
  requester?: Reference;
  recorder?: Reference;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  dosageInstruction?: FHIRMedicationRequestDosageInstruction[];
}

// =============================================================================
// Backward compatibility: alias existing names used by mappers and prefetch
// =============================================================================

export type FhirIdentifier = Identifier;
export type FhirCoding = Coding;
export type FhirCodeableConcept = CodeableConcept;
export type FhirReference = Reference;
export type FhirPatient = FHIRPatient;
export type FhirCondition = FHIRCondition;
export type FhirServiceRequest = FHIRServiceRequest;
export type FhirImagingStudy = FHIRImagingStudy;

/** Union of FHIR resource types we fetch */
export type FhirResource =
  | FHIRPatient
  | FHIRCondition
  | FHIRServiceRequest
  | FHIRImagingStudy
  | FHIRObservation
  | FHIRMedicationRequest;
