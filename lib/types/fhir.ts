/**
 * Minimal FHIR R4 resource types used by ARKA workflows.
 */

/**
 * Canonical FHIR metadata block.
 */
export interface FHIRMeta {
  /** Version identifier for the resource instance. */
  versionId?: string;
  /** Timestamp of the last update. */
  lastUpdated?: string;
  /** Profiles asserted by this resource. */
  profile?: string[];
  /** Security labels associated with the resource. */
  security?: FHIRCoding[];
  /** User-facing tags associated with the resource. */
  tag?: FHIRCoding[];
}

/**
 * Generic FHIR identifier.
 */
export interface FHIRIdentifier {
  /** Namespace URI for the identifier. */
  system?: string;
  /** Identifier value. */
  value?: string;
  /** Optional label describing the identifier use. */
  type?: FHIRCodeableConcept;
  /** Declares whether the identifier is official, secondary, and so on. */
  use?: string;
}

/**
 * Generic FHIR reference.
 */
export interface FHIRReference {
  /** Relative or absolute reference string. */
  reference?: string;
  /** Resource type if known at serialization time. */
  type?: string;
  /** Human-readable display text. */
  display?: string;
  /** Inline identifier when the target resource is not referenced directly. */
  identifier?: FHIRIdentifier;
}

/**
 * Standard FHIR coding element.
 */
export interface FHIRCoding {
  /** Code system URI. */
  system?: string;
  /** Version of the code system. */
  version?: string;
  /** Code value. */
  code?: string;
  /** Human-readable display string. */
  display?: string;
  /** Indicates the code was selected by the user. */
  userSelected?: boolean;
}

/**
 * Standard FHIR CodeableConcept element.
 */
export interface FHIRCodeableConcept {
  /** Structured codings attached to the concept. */
  coding?: FHIRCoding[];
  /** Plain-language concept text. */
  text?: string;
}

/**
 * Standard FHIR period element.
 */
export interface FHIRPeriod {
  /** Inclusive period start timestamp. */
  start?: string;
  /** Inclusive period end timestamp. */
  end?: string;
}

/**
 * Standard FHIR quantity element.
 */
export interface FHIRQuantity {
  /** Numeric value. */
  value?: number;
  /** Comparator such as `<` or `>=`. */
  comparator?: string;
  /** Unit display string. */
  unit?: string;
  /** System URI for the unit. */
  system?: string;
  /** Unit code. */
  code?: string;
}

/**
 * Standard FHIR extension element.
 */
export interface FHIRExtension {
  /** Canonical URL identifying the extension definition. */
  url: string;
  /** Nested extensions when using complex extensions. */
  extension?: FHIRExtension[];
  /** String value. */
  valueString?: string;
  /** Boolean value. */
  valueBoolean?: boolean;
  /** Integer value. */
  valueInteger?: number;
  /** Decimal value. */
  valueDecimal?: number;
  /** Date value. */
  valueDate?: string;
  /** DateTime value. */
  valueDateTime?: string;
  /** URI value. */
  valueUri?: string;
  /** Canonical reference value. */
  valueCanonical?: string;
  /** Coding value. */
  valueCoding?: FHIRCoding;
  /** CodeableConcept value. */
  valueCodeableConcept?: FHIRCodeableConcept;
  /** Reference value. */
  valueReference?: FHIRReference;
}

/**
 * Standard FHIR attachment element.
 */
export interface FHIRAttachment {
  /** MIME type for the attachment. */
  contentType?: string;
  /** Language of the attachment contents. */
  language?: string;
  /** Raw data encoded as base64. */
  data?: string;
  /** External URL for the attachment. */
  url?: string;
  /** Original filename. */
  title?: string;
}

/**
 * Standard FHIR human name element.
 */
export interface FHIRHumanName {
  /** Plain-text full name. */
  text?: string;
  /** Family name. */
  family?: string;
  /** Given names. */
  given?: string[];
  /** Prefixes such as Dr. */
  prefix?: string[];
  /** Suffixes such as Jr. */
  suffix?: string[];
}

/**
 * Standard FHIR contact point element.
 */
export interface FHIRContactPoint {
  /** Contact channel such as phone or email. */
  system?: string;
  /** Actual contact value. */
  value?: string;
  /** Home, work, mobile, and so on. */
  use?: string;
}

/**
 * Standard FHIR address element.
 */
export interface FHIRAddress {
  /** Street lines. */
  line?: string[];
  /** City name. */
  city?: string;
  /** State or province. */
  state?: string;
  /** Postal code. */
  postalCode?: string;
  /** Country name or code. */
  country?: string;
}

/**
 * Base shape shared by all FHIR resources used here.
 */
export interface FHIRResourceBase<TResourceType extends string> {
  /** Literal FHIR resource type. */
  resourceType: TResourceType;
  /** Logical resource id. */
  id?: string;
  /** Resource metadata. */
  meta?: FHIRMeta;
  /** Resource-level extensions. */
  extension?: FHIRExtension[];
}

/**
 * FHIR R4 Patient resource.
 */
export interface Patient extends FHIRResourceBase<"Patient"> {
  /** Business identifiers for the patient. */
  identifier?: FHIRIdentifier[];
  /** Whether the patient record is active. */
  active?: boolean;
  /** Patient names. */
  name?: FHIRHumanName[];
  /** Telecom contact points. */
  telecom?: FHIRContactPoint[];
  /** Administrative gender. */
  gender?: "male" | "female" | "other" | "unknown";
  /** Birth date in ISO format. */
  birthDate?: string;
  /** Patient addresses. */
  address?: FHIRAddress[];
  /** Managing organization reference. */
  managingOrganization?: FHIRReference;
}

/**
 * FHIR R4 Coverage resource.
 */
export interface Coverage extends FHIRResourceBase<"Coverage"> {
  /** Business identifiers for the coverage. */
  identifier?: FHIRIdentifier[];
  /** Coverage status. */
  status?: "active" | "cancelled" | "draft" | "entered-in-error";
  /** Subscriber identifier. */
  subscriberId?: string;
  /** Subscriber reference. */
  subscriber?: FHIRReference;
  /** Beneficiary reference. */
  beneficiary?: FHIRReference;
  /** Relationship between subscriber and beneficiary. */
  relationship?: FHIRCodeableConcept;
  /** Period when the coverage is effective. */
  period?: FHIRPeriod;
  /** Payer references. */
  payor?: FHIRReference[];
  /** Class values such as group or plan. */
  class?: Array<{
    /** Classification type. */
    type?: FHIRCodeableConcept;
    /** Class value. */
    value?: string;
    /** User-facing class label. */
    name?: string;
  }>;
  /** Insurance order in the coordination of benefits sequence. */
  order?: number;
  /** Benefit type. */
  type?: FHIRCodeableConcept;
  /** Network name or identifier for this coverage. */
  network?: string;
  /** Patient cost responsibility (copay, coinsurance, deductible, etc.). */
  costToBeneficiary?: Array<{
    /** Category of cost such as deductible or copay. */
    type?: FHIRCodeableConcept;
    /** Cost expressed as a quantity (for example percentage). */
    valueQuantity?: FHIRQuantity;
    /** Cost expressed as money. */
    valueMoney?: { value?: number; currency?: string };
  }>;
}

/**
 * FHIR R4 ServiceRequest resource.
 */
export interface ServiceRequest extends FHIRResourceBase<"ServiceRequest"> {
  /** External identifiers for the service request. */
  identifier?: FHIRIdentifier[];
  /** Classification of the service (for example imaging, laboratory). */
  category?: FHIRCodeableConcept[];
  /** Request lifecycle status. */
  status?: string;
  /** Request intent. */
  intent: string;
  /** Request priority. */
  priority?: "routine" | "urgent" | "asap" | "stat";
  /** Requested service code. */
  code?: FHIRCodeableConcept;
  /** Clinical indications or reasons. */
  reasonCode?: FHIRCodeableConcept[];
  /** Supporting diagnosis/problem references. */
  reasonReference?: FHIRReference[];
  /** Subject of the request. */
  subject: FHIRReference;
  /** Encounter context. */
  encounter?: FHIRReference;
  /** Authored timestamp. */
  authoredOn?: string;
  /** Ordering clinician. */
  requester?: FHIRReference;
  /** Organization or practitioner performing the service. */
  performer?: FHIRReference[];
  /** Body site(s) for the request. */
  bodySite?: FHIRCodeableConcept[];
  /** Additional request notes. */
  note?: Array<{
    /** Note author reference. */
    authorReference?: FHIRReference;
    /** Note timestamp. */
    time?: string;
    /** Note text body. */
    text: string;
  }>;
}

/**
 * FHIR R4 Practitioner resource.
 */
export interface Practitioner extends FHIRResourceBase<"Practitioner"> {
  /** Practitioner identifiers. */
  identifier?: FHIRIdentifier[];
  /** Whether the practitioner is active. */
  active?: boolean;
  /** Practitioner names. */
  name?: FHIRHumanName[];
  /** Telecom contact points. */
  telecom?: FHIRContactPoint[];
  /** Gender. */
  gender?: "male" | "female" | "other" | "unknown";
}

/**
 * FHIR R4 Organization resource.
 */
export interface Organization extends FHIRResourceBase<"Organization"> {
  /** Business identifiers. */
  identifier?: FHIRIdentifier[];
  /** Whether the organization record is active. */
  active?: boolean;
  /** Organization name. */
  name?: string;
  /** Contact methods. */
  telecom?: FHIRContactPoint[];
  /** Postal addresses. */
  address?: FHIRAddress[];
  /** Parent organization reference. */
  partOf?: FHIRReference;
}

/**
 * FHIR R4 Location resource (minimal fields used for imaging site labeling).
 */
export interface Location extends FHIRResourceBase<"Location"> {
  /** Location name such as facility or suite label. */
  name?: string;
  /** Operational status. */
  status?: string;
  /** Physical address. */
  address?: FHIRAddress;
  /** Managing organization. */
  managingOrganization?: FHIRReference;
}

/**
 * FHIR R4 InsurancePlan resource.
 */
export interface InsurancePlan extends FHIRResourceBase<"InsurancePlan"> {
  /** Business identifiers. */
  identifier?: FHIRIdentifier[];
  /** Publication status. */
  status?: string;
  /** Plan name. */
  name?: string;
  /** Owned-by organization reference. */
  ownedBy?: FHIRReference;
  /** Administered-by organization reference. */
  administeredBy?: FHIRReference;
  /** Coverage type. */
  type?: FHIRCodeableConcept[];
  /** Covered networks. */
  network?: FHIRReference[];
  /** Plan definitions. */
  plan?: Array<{
    /** Plan identifiers. */
    identifier?: FHIRIdentifier[];
    /** Plan type. */
    type?: FHIRCodeableConcept;
    /** Covered services. */
    coverage?: Array<{
      /** Coverage type. */
      type?: FHIRCodeableConcept;
      /** Covered benefits. */
      benefit?: Array<{
        /** Benefit type. */
        type?: FHIRCodeableConcept;
        /** Benefit limits. */
        limit?: Array<{
          /** Applicability of the limit. */
          value?: FHIRQuantity;
          /** Limit code. */
          code?: FHIRCodeableConcept;
        }>;
      }>;
    }>;
  }>;
}

/**
 * FHIR R4 Questionnaire resource.
 */
export interface Questionnaire extends FHIRResourceBase<"Questionnaire"> {
  /** External identifiers. */
  identifier?: FHIRIdentifier[];
  /** Publication status. */
  status: string;
  /** Primary questionnaire name. */
  name?: string;
  /** Human-readable title. */
  title?: string;
  /** Canonical URL. */
  url?: string;
  /** Version string. */
  version?: string;
  /** Subject types allowed to answer. */
  subjectType?: string[];
  /** Questionnaire items. */
  item?: QuestionnaireItem[];
}

/**
 * Initial value for a questionnaire item (FHIR R4).
 */
export interface QuestionnaireItemInitial {
  /** Boolean initial value. */
  valueBoolean?: boolean;
  /** Decimal initial value. */
  valueDecimal?: number;
  /** Integer initial value. */
  valueInteger?: number;
  /** Date initial value. */
  valueDate?: string;
  /** DateTime initial value. */
  valueDateTime?: string;
  /** Time initial value. */
  valueTime?: string;
  /** String initial value. */
  valueString?: string;
  /** URI initial value. */
  valueUri?: string;
  /** Coding initial value. */
  valueCoding?: FHIRCoding;
  /** Quantity initial value. */
  valueQuantity?: FHIRQuantity;
  /** Reference initial value. */
  valueReference?: FHIRReference;
}

/**
 * Nested questionnaire item.
 */
export interface QuestionnaireItem {
  /** Stable item linkage identifier. */
  linkId: string;
  /** User-facing prompt text. */
  text?: string;
  /** Item type. */
  type: string;
  /** Indicates whether an answer is required. */
  required?: boolean;
  /** Repeats allowed flag. */
  repeats?: boolean;
  /** Default values when known from prefetch or rules engine. */
  initial?: QuestionnaireItemInitial[];
  /** Codified answer options. */
  answerOption?: Array<{
    /** Coding answer option. */
    valueCoding?: FHIRCoding;
    /** String answer option. */
    valueString?: string;
    /** Integer answer option. */
    valueInteger?: number;
  }>;
  /** Child items. */
  item?: QuestionnaireItem[];
  /** Item-level extensions. */
  extension?: FHIRExtension[];
}

/**
 * FHIR R4 QuestionnaireResponse resource.
 */
export interface QuestionnaireResponse extends FHIRResourceBase<"QuestionnaireResponse"> {
  /** External identifiers. */
  identifier?: FHIRIdentifier[];
  /** Completion status. */
  status: "in-progress" | "completed" | "amended" | "entered-in-error" | "stopped";
  /** Questionnaire canonical reference. */
  questionnaire?: string;
  /** Subject being answered for. */
  subject?: FHIRReference;
  /** Encounter context. */
  encounter?: FHIRReference;
  /** Authored timestamp. */
  authored?: string;
  /** Author reference. */
  author?: FHIRReference;
  /** Source reference. */
  source?: FHIRReference;
  /** Response items. */
  item?: QuestionnaireResponseItem[];
}

/**
 * Nested questionnaire response item.
 */
export interface QuestionnaireResponseItem {
  /** Link identifier matching the Questionnaire item. */
  linkId: string;
  /** Optional prompt text snapshot. */
  text?: string;
  /** Answers for this item. */
  answer?: QuestionnaireResponseAnswer[];
  /** Child items. */
  item?: QuestionnaireResponseItem[];
}

/**
 * Questionnaire response answer value container.
 */
export interface QuestionnaireResponseAnswer {
  /** String answer value. */
  valueString?: string;
  /** Boolean answer value. */
  valueBoolean?: boolean;
  /** Integer answer value. */
  valueInteger?: number;
  /** Decimal answer value. */
  valueDecimal?: number;
  /** Date answer value. */
  valueDate?: string;
  /** DateTime answer value. */
  valueDateTime?: string;
  /** Coding answer value. */
  valueCoding?: FHIRCoding;
  /** Reference answer value. */
  valueReference?: FHIRReference;
  /** Quantity answer value. */
  valueQuantity?: FHIRQuantity;
  /** Nested answer items. */
  item?: QuestionnaireResponseItem[];
}

/**
 * FHIR R4 Claim resource.
 */
export interface Claim extends FHIRResourceBase<"Claim"> {
  /** Business identifiers. */
  identifier?: FHIRIdentifier[];
  /** Claim status. */
  status: string;
  /** Claim use such as claim or preauthorization. */
  use: string;
  /** Claim type. */
  type: FHIRCodeableConcept;
  /** Patient reference. */
  patient: FHIRReference;
  /** Created timestamp. */
  created: string;
  /** Insurer reference. */
  insurer?: FHIRReference;
  /** Provider reference. */
  provider: FHIRReference;
  /** Claim priority. */
  priority: FHIRCodeableConcept;
  /** Clinical prescription/order reference. */
  prescription?: FHIRReference;
  /** Supporting information blocks. */
  supportingInfo?: Array<{
    /** Sequence number. */
    sequence: number;
    /** Information category. */
    category: FHIRCodeableConcept;
    /** Code details. */
    code?: FHIRCodeableConcept;
    /** Timing date. */
    timingDate?: string;
    /** Timing period. */
    timingPeriod?: FHIRPeriod;
    /** Boolean value. */
    valueBoolean?: boolean;
    /** String value. */
    valueString?: string;
    /** Quantity value. */
    valueQuantity?: FHIRQuantity;
    /** Attachment value. */
    valueAttachment?: FHIRAttachment;
    /** Reference value. */
    valueReference?: FHIRReference;
  }>;
  /** Insurance coverage entries. */
  insurance?: Array<{
    /** Coordination-of-benefits sequence. */
    sequence: number;
    /** Whether the coverage is primary for the claim. */
    focal: boolean;
    /** Coverage reference. */
    coverage: FHIRReference;
  }>;
  /** Diagnosis list (ICD-10-CM and related) linked to claim lines. */
  diagnosis?: Array<{
    /** Diagnosis sequence number referenced by claim items. */
    sequence: number;
    /** Diagnosis code. */
    diagnosisCodeableConcept: FHIRCodeableConcept;
  }>;
  /** Claim items. */
  item?: Array<{
    /** Line item sequence. */
    sequence: number;
    /** Product or service code. */
    productOrService: FHIRCodeableConcept;
    /** Service modifiers. */
    modifier?: FHIRCodeableConcept[];
    /** Program codes. */
    programCode?: FHIRCodeableConcept[];
    /** Serviced date. */
    servicedDate?: string;
    /** Serviced period. */
    servicedPeriod?: FHIRPeriod;
    /** Quantity requested. */
    quantity?: FHIRQuantity;
    /** Unit price. */
    unitPrice?: FHIRQuantity;
    /** Body site. */
    bodySite?: FHIRCodeableConcept;
    /** Diagnosis sequence references. */
    diagnosisSequence?: number[];
    /** Information sequence references. */
    informationSequence?: number[];
  }>;
}

/**
 * FHIR R4 ClaimResponse resource.
 */
export interface ClaimResponse extends FHIRResourceBase<"ClaimResponse"> {
  /** Business identifiers. */
  identifier?: FHIRIdentifier[];
  /** Response status. */
  status: string;
  /** Claim type. */
  type?: FHIRCodeableConcept;
  /** Claim use. */
  use: string;
  /** Patient reference. */
  patient: FHIRReference;
  /** Created timestamp. */
  created: string;
  /** Insurer reference. */
  insurer: FHIRReference;
  /** Request provider reference. */
  requestor?: FHIRReference;
  /** Reference to the originating claim. */
  request?: FHIRReference;
  /** Outcome code. */
  outcome?: string;
  /** Overall disposition text. */
  disposition?: string;
  /** Item-level adjudication results. */
  item?: Array<{
    /** Original item sequence. */
    itemSequence: number;
    /** Adjudication results. */
    adjudication?: Array<{
      /** Adjudication category. */
      category: FHIRCodeableConcept;
      /** Optional reason. */
      reason?: FHIRCodeableConcept;
      /** Monetary or count amount. */
      amount?: FHIRQuantity;
      /** Numeric value. */
      value?: number;
    }>;
  }>;
  /** Errors associated with processing. */
  error?: Array<{
    /** Error item sequence. */
    itemSequence?: number;
    /** Error code. */
    code: FHIRCodeableConcept;
  }>;
}

/**
 * FHIR R4 Appointment resource.
 */
export interface Appointment extends FHIRResourceBase<"Appointment"> {
  /** Business identifiers. */
  identifier?: FHIRIdentifier[];
  /** Appointment status. */
  status: string;
  /** Service categories. */
  serviceCategory?: FHIRCodeableConcept[];
  /** Service types. */
  serviceType?: FHIRCodeableConcept[];
  /** Specialty references encoded as concepts. */
  specialty?: FHIRCodeableConcept[];
  /** Appointment type. */
  appointmentType?: FHIRCodeableConcept;
  /** Reason codes. */
  reasonCode?: FHIRCodeableConcept[];
  /** Reason references. */
  reasonReference?: FHIRReference[];
  /** Start timestamp. */
  start?: string;
  /** End timestamp. */
  end?: string;
  /** Free-text comments. */
  comment?: string;
  /** Appointment participants. */
  participant?: Array<{
    /** Participant actor. */
    actor?: FHIRReference;
    /** Participant role. */
    type?: FHIRCodeableConcept[];
    /** Participant status. */
    status: string;
    /** Required participation flag. */
    required?: string;
  }>;
}

/**
 * FHIR R4 Bundle entry for search or collection results.
 */
export interface BundleEntry<T = unknown> {
  /** Resolved resource for this entry. */
  resource?: T;
  /** Absolute or relative URL for this entry. */
  fullUrl?: string;
}

/**
 * FHIR R4 Bundle resource.
 */
export interface Bundle<T = unknown> extends FHIRResourceBase<"Bundle"> {
  /** Bundle purpose such as searchset or collection. */
  type: string;
  /** Contained entries. */
  entry?: BundleEntry<T>[];
  /** Total number of matching results (search). */
  total?: number;
}

/**
 * FHIR R4 OperationOutcome issue.
 */
export interface OperationOutcomeIssue {
  /** Issue severity. */
  severity: "fatal" | "error" | "warning" | "information";
  /** High-level error code. */
  code: string;
  /** Additional diagnostic detail. */
  diagnostics?: string;
}

/**
 * FHIR R4 OperationOutcome resource.
 */
export interface OperationOutcome extends FHIRResourceBase<"OperationOutcome"> {
  /** One or more issues describing the outcome. */
  issue: OperationOutcomeIssue[];
}

/**
 * FHIR R4 Parameters resource (name/value pairs).
 */
export interface ParametersParameter {
  /** Parameter name. */
  name: string;
  /** String value. */
  valueString?: string;
  /** Boolean value. */
  valueBoolean?: boolean;
  /** Integer value. */
  valueInteger?: number;
  /** Decimal value. */
  valueDecimal?: number;
  /** Nested parts. */
  part?: ParametersParameter[];
}

/**
 * FHIR R4 Parameters resource.
 */
export interface Parameters extends FHIRResourceBase<"Parameters"> {
  /** Named parameters. */
  parameter?: ParametersParameter[];
}

/**
 * Union of all shared FHIR resources used by ARKA.
 */
export type FHIRResource =
  | Patient
  | Coverage
  | ServiceRequest
  | Practitioner
  | Organization
  | Location
  | InsurancePlan
  | Questionnaire
  | QuestionnaireResponse
  | Claim
  | ClaimResponse
  | Appointment
  | Bundle
  | OperationOutcome
  | Parameters;

/**
 * Narrows a generic FHIR resource to a specific resource type.
 */
export function isResourceType<T extends FHIRResource["resourceType"]>(
  resource: FHIRResource | null | undefined,
  resourceType: T,
): resource is Extract<FHIRResource, { resourceType: T }> {
  return resource?.resourceType === resourceType;
}
