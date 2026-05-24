/**
 * @file client.ts
 * @description FHIR R4 HTTP client for fetching Patient, Condition, ServiceRequest,
 *   ImagingStudy, Observation, and MedicationRequest resources. Uses native fetch (Node 18+).
 *   Supports retry with exponential backoff, timeout, OperationOutcome parsing, and pino logging.
 */

import pino from 'pino';
import type {
  FHIRPatient,
  FHIRCondition,
  FHIRServiceRequest,
  FHIRImagingStudy,
  FHIRObservation,
  FHIRMedicationRequest,
  FHIRBundle,
} from './resources';

// -----------------------------------------------------------------------------
// Config & OperationOutcome (error response)
// -----------------------------------------------------------------------------

export interface FHIRClientConfig {
  /** Base URL of the FHIR server (e.g. https://fhir.example.com/r4) */
  baseUrl: string;
  /** Optional Bearer token for SMART on FHIR */
  accessToken?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** If true, return MockFHIRClient for testing without a live server */
  mockMode?: boolean;
}

/** @deprecated Use FHIRClientConfig */
export type FhirClientConfig = FHIRClientConfig;

/** FHIR R4 OperationOutcome issue (minimal for error parsing) */
export interface OperationOutcomeIssue {
  severity?: 'fatal' | 'error' | 'warning' | 'information';
  code?: string;
  details?: { text?: string };
  diagnostics?: string;
  expression?: string[];
}

export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue?: OperationOutcomeIssue[];
}

// -----------------------------------------------------------------------------
// FHIRClientError
// -----------------------------------------------------------------------------

export class FHIRClientError extends Error {
  readonly statusCode: number;
  readonly operationOutcome?: OperationOutcome;
  readonly url: string;

  constructor(
    message: string,
    statusCode: number,
    url: string,
    operationOutcome?: OperationOutcome
  ) {
    super(message);
    this.name = 'FHIRClientError';
    this.statusCode = statusCode;
    this.url = url;
    this.operationOutcome = operationOutcome;
    Object.setPrototypeOf(this, FHIRClientError.prototype);
  }
}

// -----------------------------------------------------------------------------
// Logging: mask patient identifiers in URLs and query params
// -----------------------------------------------------------------------------

const PATIENT_ID_PATTERNS = [
  /Patient\/[^/&\s]+/gi,
  /patient=[^&\s]+/gi,
  /subject=[^&\s]+/gi,
];

function maskPatientIdentifiers(url: string): string {
  let out = url;
  for (const re of PATIENT_ID_PATTERNS) {
    out = out.replace(re, (m) => m.replace(/[^/=&]+$/, '[REDACTED]'));
  }
  return out;
}

// -----------------------------------------------------------------------------
// Logger
// -----------------------------------------------------------------------------

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

// -----------------------------------------------------------------------------
// FHIRClient
// -----------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

function parseOperationOutcome(body: unknown): OperationOutcome | undefined {
  if (body && typeof body === 'object' && (body as Record<string, unknown>).resourceType === 'OperationOutcome') {
    return body as OperationOutcome;
  }
  return undefined;
}

function isAbsoluteReference(ref: string): boolean {
  return ref.startsWith('http://') || ref.startsWith('https://');
}

export class FHIRClient {
  protected readonly baseUrl: string;
  protected readonly accessToken?: string;
  protected readonly timeout: number;

  constructor(params: {
    baseUrl: string;
    accessToken?: string;
    timeout?: number;
  }) {
    this.baseUrl = params.baseUrl.replace(/\/$/, '');
    this.accessToken = params.accessToken;
    this.timeout = params.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Performs a FHIR GET request with retry (429/5xx), timeout, and logging.
   */
  protected async request<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}/${path.replace(/^\//, '')}`;
    const maskedUrl = maskPatientIdentifiers(url);
    const start = Date.now();

    let lastError: FHIRClientError | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const signal = options?.signal ?? controller.signal;

      try {
        const headers: Record<string, string> = {
          Accept: 'application/fhir+json',
          'Content-Type': 'application/fhir+json',
        };
        if (this.accessToken) {
          headers.Authorization = `Bearer ${this.accessToken}`;
        }

        const res = await fetch(url, {
          method: 'GET',
          headers,
          signal,
        });
        clearTimeout(timeoutId);

        const durationMs = Date.now() - start;
        logger.info({
          msg: 'FHIR request',
          url: maskedUrl,
          status: res.status,
          durationMs,
          attempt: attempt + 1,
        });

        let body: unknown;
        const ct = res.headers.get('content-type') ?? '';
        const text = await res.text();
        if (ct.includes('application/json') || ct.includes('application/fhir+json')) {
          try {
            body = text ? JSON.parse(text) : undefined;
          } catch {
            body = text;
          }
        } else {
          body = text;
        }

        if (!res.ok) {
          const outcome = parseOperationOutcome(body);
          const msg =
            outcome?.issue?.[0]?.details?.text ??
            outcome?.issue?.[0]?.diagnostics ??
            `FHIR request failed: ${res.status} ${res.statusText}`;
          lastError = new FHIRClientError(msg, res.status, url, outcome);
          if (RETRYABLE_STATUSES.includes(res.status) && attempt < MAX_RETRIES) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
            logger.warn({ msg: 'FHIR retry', url: maskedUrl, status: res.status, backoffMs });
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
          throw lastError;
        }

        return body as T;
      } catch (err) {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - start;
        if (err instanceof FHIRClientError) {
          lastError = err;
          if (RETRYABLE_STATUSES.includes(err.statusCode) && attempt < MAX_RETRIES) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
            logger.warn({ msg: 'FHIR retry', url: maskedUrl, status: err.statusCode, backoffMs });
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
          throw err;
        }
        if (err instanceof Error && err.name === 'AbortError') {
          logger.warn({ msg: 'FHIR request timeout', url: maskedUrl, durationMs });
          throw new FHIRClientError(`Request timeout after ${this.timeout}ms`, 408, url);
        }
        logger.error({ msg: 'FHIR request error', url: maskedUrl, durationMs, err });
        throw err;
      }
    }
    throw lastError ?? new FHIRClientError('FHIR request failed', 0, url);
  }

  /**
   * Execute a raw FHIR GET by path (e.g. "Patient/123" or "Condition?patient=123&clinical-status=active").
   * Used by prefetch to run template-resolved URLs.
   */
  async getByPath<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async getPatient(patientId: string): Promise<FHIRPatient> {
    const path = `Patient/${encodeURIComponent(patientId)}`;
    const resource = await this.request<FHIRPatient>(path);
    if (resource?.resourceType !== 'Patient') {
      throw new FHIRClientError('Invalid Patient resource returned', 0, `${this.baseUrl}/${path}`);
    }
    return resource;
  }

  async getConditions(
    patientId: string,
    params?: { clinicalStatus?: string; category?: string }
  ): Promise<FHIRBundle<FHIRCondition>> {
    const searchParams = new URLSearchParams({ patient: patientId });
    if (params?.clinicalStatus) searchParams.set('clinical-status', params.clinicalStatus);
    if (params?.category) searchParams.set('category', params.category);
    const path = `Condition?${searchParams.toString()}`;
    const bundle = await this.request<FHIRBundle<FHIRCondition>>(path);
    if (bundle?.resourceType !== 'Bundle') {
      throw new FHIRClientError('Invalid Bundle returned', 0, `${this.baseUrl}/${path}`);
    }
    return bundle;
  }

  async getServiceRequests(
    patientId: string,
    params?: { status?: string; category?: string }
  ): Promise<FHIRBundle<FHIRServiceRequest>> {
    const searchParams = new URLSearchParams({ patient: patientId });
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);
    const path = `ServiceRequest?${searchParams.toString()}`;
    const bundle = await this.request<FHIRBundle<FHIRServiceRequest>>(path);
    if (bundle?.resourceType !== 'Bundle') {
      throw new FHIRClientError('Invalid Bundle returned', 0, `${this.baseUrl}/${path}`);
    }
    return bundle;
  }

  async getImagingStudies(
    patientId: string,
    params?: { count?: number; sort?: string }
  ): Promise<FHIRBundle<FHIRImagingStudy>> {
    const searchParams = new URLSearchParams({ patient: patientId });
    if (params?.count != null) searchParams.set('_count', String(params.count));
    if (params?.sort) searchParams.set('_sort', params.sort);
    const path = `ImagingStudy?${searchParams.toString()}`;
    const bundle = await this.request<FHIRBundle<FHIRImagingStudy>>(path);
    if (bundle?.resourceType !== 'Bundle') {
      throw new FHIRClientError('Invalid Bundle returned', 0, `${this.baseUrl}/${path}`);
    }
    return bundle;
  }

  async getObservations(
    patientId: string,
    params?: { code?: string; count?: number; sort?: string }
  ): Promise<FHIRBundle<FHIRObservation>> {
    const searchParams = new URLSearchParams({ patient: patientId });
    if (params?.code) searchParams.set('code', params.code);
    if (params?.count != null) searchParams.set('_count', String(params.count));
    if (params?.sort) searchParams.set('_sort', params.sort);
    const path = `Observation?${searchParams.toString()}`;
    const bundle = await this.request<FHIRBundle<FHIRObservation>>(path);
    if (bundle?.resourceType !== 'Bundle') {
      throw new FHIRClientError('Invalid Bundle returned', 0, `${this.baseUrl}/${path}`);
    }
    return bundle;
  }

  async getMedicationRequests(
    patientId: string,
    params?: { status?: string }
  ): Promise<FHIRBundle<FHIRMedicationRequest>> {
    const searchParams = new URLSearchParams({ patient: patientId });
    if (params?.status) searchParams.set('status', params.status);
    const path = `MedicationRequest?${searchParams.toString()}`;
    const bundle = await this.request<FHIRBundle<FHIRMedicationRequest>>(path);
    if (bundle?.resourceType !== 'Bundle') {
      throw new FHIRClientError('Invalid Bundle returned', 0, `${this.baseUrl}/${path}`);
    }
    return bundle;
  }

  /**
   * Resolves a reference (e.g. "Patient/123" or "https://fhir.example.com/Patient/123") to the resource.
   */
  async resolveReference<T>(reference: string): Promise<T> {
    const trimmed = reference.trim();
    if (!trimmed) {
      throw new FHIRClientError('Empty reference', 0, reference);
    }
    let url: string;
    if (isAbsoluteReference(trimmed)) {
      url = trimmed;
    } else {
      const path = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
      url = `${this.baseUrl}/${path}`;
    }
    return this.request<T>(url);
  }
}

// -----------------------------------------------------------------------------
// Mock data: 5 patient profiles for demo scenarios
// -----------------------------------------------------------------------------

const MOCK_PATIENT_IDS = ['demo-pediatric', 'demo-young-adult', 'demo-middle-aged', 'demo-elderly', 'demo-geriatric'] as const;
type MockPatientId = (typeof MOCK_PATIENT_IDS)[number];

function mockPatient(id: string, birthDate: string, gender: FHIRPatient['gender'], name: string): FHIRPatient {
  return {
    resourceType: 'Patient',
    id,
    identifier: [{ system: 'http://hospital.example.org', value: id }],
    name: [{ use: 'official', family: name.split(' ').pop(), given: name.split(' ').slice(0, -1) }],
    gender,
    birthDate,
    active: true,
  };
}

function mockBundle<T>(resources: T[], type: FHIRBundle<T>['type'] = 'searchset'): FHIRBundle<T> {
  return {
    resourceType: 'Bundle',
    type,
    total: resources.length,
    entry: resources.map((resource) => ({ resource })),
  };
}

function mockCondition(
  id: string,
  code: string,
  display: string,
  subjectRef: string,
  clinicalStatus = 'active'
): FHIRCondition {
  return {
    resourceType: 'Condition',
    id,
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: clinicalStatus }],
    },
    code: { coding: [{ system: 'http://snomed.info/sct', code, display }], text: display },
    subject: { reference: subjectRef },
    onsetDateTime: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
}

function mockServiceRequest(
  id: string,
  code: string,
  display: string,
  subjectRef: string,
  status: FHIRServiceRequest['status'] = 'active'
): FHIRServiceRequest {
  return {
    resourceType: 'ServiceRequest',
    id,
    status,
    intent: 'order',
    code: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code, display }], text: display },
    subject: { reference: subjectRef },
    authoredOn: new Date().toISOString(),
  };
}

function mockImagingStudy(
  id: string,
  subjectRef: string,
  modality: string,
  started: string,
  procedureDisplay: string
): FHIRImagingStudy {
  return {
    resourceType: 'ImagingStudy',
    id,
    status: 'available',
    subject: { reference: subjectRef },
    started,
    procedureCode: [{ coding: [{ system: 'http://snomed.info/sct', display: procedureDisplay }] }],
    modality: [{ code: modality }],
    series: [{ uid: `series-${id}`, modality: { code: modality }, number: 1 }],
  };
}

function mockObservation(
  id: string,
  subjectRef: string,
  code: string,
  display: string,
  value: number,
  unit: string,
  effective?: string
): FHIRObservation {
  return {
    resourceType: 'Observation',
    id,
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code, display }], text: display },
    subject: { reference: subjectRef },
    valueQuantity: { value, unit, system: 'http://unitsofmeasure.org', code: unit },
    effectiveDateTime: effective ?? new Date().toISOString(),
  };
}

function mockMedicationRequest(
  id: string,
  subjectRef: string,
  display: string,
  status: FHIRMedicationRequest['status'] = 'active'
): FHIRMedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    id,
    status,
    intent: 'order',
    medicationCodeableConcept: { text: display },
    subject: { reference: subjectRef },
    authoredOn: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
}

// Build mock data per patient (maps to demo scenarios: pediatric, young adult, middle-aged, elderly, geriatric).
// Resource IDs are prefixed with patientId so resolveReference can resolve them globally.
function getMockDataForPatient(patientId: string): {
  patient: FHIRPatient;
  conditions: FHIRCondition[];
  serviceRequests: FHIRServiceRequest[];
  imagingStudies: FHIRImagingStudy[];
  observations: FHIRObservation[];
  medicationRequests: FHIRMedicationRequest[];
} {
  const subjectRef = `Patient/${patientId}`;
  const normalizedId = MOCK_PATIENT_IDS.includes(patientId as MockPatientId) ? patientId : 'demo-middle-aged';
  const pid = normalizedId;

  switch (normalizedId) {
    case 'demo-pediatric': {
      // 8yo, back pain scenario
      const patient = mockPatient(patientId, '2017-03-15', 'female', 'Emma Wilson');
      const conditions = [
        mockCondition(`${pid}-c1`, '279039003', 'Back pain', subjectRef),
        mockCondition(`${pid}-c2`, '25064002', 'Headache', subjectRef),
      ];
      const serviceRequests = [
        mockServiceRequest(`${pid}-sr1`, '72148', 'MRI lumbar spine without contrast', subjectRef),
      ];
      const imagingStudies: FHIRImagingStudy[] = []; // no prior imaging
      const observations = [
        mockObservation(`${pid}-egfr`, subjectRef, '33914-3', 'eGFR', 98, 'mL/min/1.73m2'),
      ];
      const medicationRequests: FHIRMedicationRequest[] = [];
      return { patient, conditions, serviceRequests, imagingStudies, observations, medicationRequests };
    }

    case 'demo-young-adult': {
      // 28yo, headache scenario
      const patient = mockPatient(patientId, '1997-06-20', 'male', 'James Chen');
      const conditions = [
        mockCondition(`${pid}-c1`, '25064002', 'Headache', subjectRef),
        mockCondition(`${pid}-c2`, '386661006', 'Fever', subjectRef),
      ];
      const serviceRequests = [
        mockServiceRequest(`${pid}-sr1`, '70450', 'CT head without contrast', subjectRef),
      ];
      const imagingStudies = [
        mockImagingStudy(
          `${pid}-is1`,
          subjectRef,
          'CT',
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          'CT head'
        ),
      ];
      const observations = [
        mockObservation(`${pid}-egfr`, subjectRef, '33914-3', 'eGFR', 105, 'mL/min/1.73m2'),
      ];
      const medicationRequests = [
        mockMedicationRequest(`${pid}-mr1`, subjectRef, 'Ibuprofen 400mg'),
      ];
      return { patient, conditions, serviceRequests, imagingStudies, observations, medicationRequests };
    }

    case 'demo-middle-aged': {
      // 45yo, abdominal pain, metformin
      const patient = mockPatient(patientId, '1980-01-10', 'female', 'Maria Garcia');
      const conditions = [
        mockCondition(`${pid}-c1`, '21522001', 'Abdominal pain', subjectRef),
        mockCondition(`${pid}-c2`, '44054006', 'Type 2 diabetes', subjectRef),
      ];
      const serviceRequests = [
        mockServiceRequest(`${pid}-sr1`, '74177', 'CT abdomen and pelvis with contrast', subjectRef),
      ];
      const imagingStudies = [
        mockImagingStudy(
          `${pid}-is1`,
          subjectRef,
          'CT',
          new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          'CT abdomen'
        ),
      ];
      const observations = [
        mockObservation(`${pid}-egfr`, subjectRef, '33914-3', 'eGFR', 72, 'mL/min/1.73m2'),
      ];
      const medicationRequests = [
        mockMedicationRequest(`${pid}-mr1`, subjectRef, 'Metformin 500mg BID'),
      ];
      return { patient, conditions, serviceRequests, imagingStudies, observations, medicationRequests };
    }

    case 'demo-elderly': {
      // 72yo, chest pain, anticoagulant, reduced eGFR
      const patient = mockPatient(patientId, '1953-08-25', 'male', 'Robert Brown');
      const conditions = [
        mockCondition(`${pid}-c1`, '22298006', 'Chest pain', subjectRef),
        mockCondition(`${pid}-c2`, '38341003', 'Hypertension', subjectRef),
        mockCondition(`${pid}-c3`, '399211009', 'History of myocardial infarction', subjectRef),
      ];
      const serviceRequests = [
        mockServiceRequest(`${pid}-sr1`, '71260', 'CT thorax with contrast', subjectRef),
      ];
      const imagingStudies = [
        mockImagingStudy(
          `${pid}-is1`,
          subjectRef,
          'CT',
          new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          'CT chest'
        ),
        mockImagingStudy(
          `${pid}-is2`,
          subjectRef,
          'XR',
          new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
          'Chest X-ray'
        ),
      ];
      const observations = [
        mockObservation(`${pid}-egfr`, subjectRef, '33914-3', 'eGFR', 38, 'mL/min/1.73m2'),
      ];
      const medicationRequests = [
        mockMedicationRequest(`${pid}-mr1`, subjectRef, 'Warfarin 5mg daily'),
        mockMedicationRequest(`${pid}-mr2`, subjectRef, 'Metformin 1000mg BID'),
      ];
      return { patient, conditions, serviceRequests, imagingStudies, observations, medicationRequests };
    }

    case 'demo-geriatric': {
      // 85yo, cancer history, severely impaired eGFR, contrast-relevant meds (metformin, NSAIDs)
      const patient = mockPatient(patientId, '1940-11-05', 'female', 'Helen Davis');
      const conditions = [
        mockCondition(`${pid}-c1`, '363346000', 'Malignant neoplasm of breast', subjectRef),
        mockCondition(`${pid}-c2`, '38341003', 'Hypertension', subjectRef),
        mockCondition(`${pid}-c3`, '42399005', 'Chronic kidney disease', subjectRef),
      ];
      const serviceRequests = [
        mockServiceRequest(`${pid}-sr1`, '71260', 'CT thorax with IV contrast', subjectRef),
      ];
      const imagingStudies = [
        mockImagingStudy(
          `${pid}-is1`,
          subjectRef,
          'CT',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          'CT chest'
        ),
        mockImagingStudy(
          `${pid}-is2`,
          subjectRef,
          'MG',
          new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          'Mammography'
        ),
      ];
      const observations = [
        mockObservation(`${pid}-egfr`, subjectRef, '33914-3', 'eGFR', 18, 'mL/min/1.73m2'),
      ];
      const medicationRequests = [
        mockMedicationRequest(`${pid}-mr1`, subjectRef, 'Metformin 500mg daily'),
        mockMedicationRequest(`${pid}-mr2`, subjectRef, 'Metformin 500mg daily'),
      ];
      return { patient, conditions, serviceRequests, imagingStudies, observations, medicationRequests };
    }

    default:
      return getMockDataForPatient('demo-middle-aged');
  }
}

/** All mock resource IDs for resolveReference lookup (type -> id -> resource) */
function getAllMockResources(): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const id of MOCK_PATIENT_IDS) {
    const data = getMockDataForPatient(id);
    map.set(`Patient/${id}`, { ...data.patient, id });
    for (const r of data.conditions) map.set(`Condition/${r.id}`, r);
    for (const r of data.serviceRequests) map.set(`ServiceRequest/${r.id}`, r);
    for (const r of data.imagingStudies) map.set(`ImagingStudy/${r.id}`, r);
    for (const r of data.observations) map.set(`Observation/${r.id}`, r);
    for (const r of data.medicationRequests) map.set(`MedicationRequest/${r.id}`, r);
  }
  return map;
}

// -----------------------------------------------------------------------------
// MockFHIRClient
// -----------------------------------------------------------------------------

export class MockFHIRClient extends FHIRClient {
  constructor(params?: { baseUrl?: string; accessToken?: string; timeout?: number }) {
    super({
      baseUrl: params?.baseUrl ?? 'https://fhir.example.com/r4',
      accessToken: params?.accessToken,
      timeout: params?.timeout,
    });
  }

  override async getByPath<T = unknown>(path: string): Promise<T> {
    const [pathPart, queryPart] = path.split('?');
    const params = queryPart
      ? Object.fromEntries(new URLSearchParams(queryPart))
      : ({} as Record<string, string>);
    const patientId = params.patient ?? params.subject;
    const match = pathPart.match(/^\/(Patient|Condition|ServiceRequest|ImagingStudy|Observation|MedicationRequest)\/([^/]+)$/i)
      ?? pathPart.match(/^(Patient|Condition|ServiceRequest|ImagingStudy|Observation|MedicationRequest)\/([^/]+)$/i);
    if (match) {
      const [, resourceType, id] = match;
      if (resourceType?.toLowerCase() === 'patient') {
        return this.getPatient(id) as Promise<T>;
      }
    }
    if (patientId) {
      if (pathPart.includes('Condition') || pathPart.startsWith('Condition')) {
        return this.getConditions(patientId, {
          clinicalStatus: params['clinical-status'],
          category: params.category,
        }) as Promise<T>;
      }
      if (pathPart.includes('ServiceRequest') || pathPart.startsWith('ServiceRequest')) {
        return this.getServiceRequests(patientId, {
          status: params.status,
          category: params.category,
        }) as Promise<T>;
      }
      if (pathPart.includes('ImagingStudy') || pathPart.startsWith('ImagingStudy')) {
        return this.getImagingStudies(patientId, {
          count: params._count ? parseInt(params._count, 10) : undefined,
          sort: params._sort,
        }) as Promise<T>;
      }
      if (pathPart.includes('Observation') || pathPart.startsWith('Observation')) {
        return this.getObservations(patientId, {
          code: params.code,
          count: params._count ? parseInt(params._count, 10) : undefined,
          sort: params._sort,
        }) as Promise<T>;
      }
      if (pathPart.includes('MedicationRequest') || pathPart.startsWith('MedicationRequest')) {
        return this.getMedicationRequests(patientId, { status: params.status }) as Promise<T>;
      }
    }
    return super.getByPath<T>(path);
  }

  override async getPatient(patientId: string): Promise<FHIRPatient> {
    const { patient } = getMockDataForPatient(patientId);
    return { ...patient, id: patientId };
  }

  override async getConditions(
    patientId: string,
    params?: { clinicalStatus?: string; category?: string }
  ): Promise<FHIRBundle<FHIRCondition>> {
    const { conditions } = getMockDataForPatient(patientId);
    let filtered = conditions;
    if (params?.clinicalStatus) {
      filtered = filtered.filter(
        (c) => c.clinicalStatus?.coding?.[0]?.code === params.clinicalStatus
      );
    }
    if (params?.category) {
      filtered = filtered.filter(
        (c) => c.category?.some((cat) => cat.coding?.some((co) => co.code === params.category))
      );
    }
    return mockBundle(filtered);
  }

  override async getServiceRequests(
    patientId: string,
    params?: { status?: string; category?: string }
  ): Promise<FHIRBundle<FHIRServiceRequest>> {
    const { serviceRequests } = getMockDataForPatient(patientId);
    let filtered = serviceRequests;
    if (params?.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    return mockBundle(filtered);
  }

  override async getImagingStudies(
    patientId: string,
    params?: { count?: number; sort?: string }
  ): Promise<FHIRBundle<FHIRImagingStudy>> {
    const { imagingStudies } = getMockDataForPatient(patientId);
    let list = [...imagingStudies];
    if (params?.count != null && params.count < list.length) {
      list = list.slice(0, params.count);
    }
    if (params?.sort) {
      list.sort((a, b) => {
        const sa = a.started ?? '';
        const sb = b.started ?? '';
        return params.sort?.startsWith('-') ? sb.localeCompare(sa) : sa.localeCompare(sb);
      });
    }
    return mockBundle(list);
  }

  override async getObservations(
    patientId: string,
    params?: { code?: string; count?: number; sort?: string }
  ): Promise<FHIRBundle<FHIRObservation>> {
    const { observations } = getMockDataForPatient(patientId);
    let filtered = observations;
    if (params?.code) {
      filtered = filtered.filter(
        (o) => o.code?.coding?.some((c) => c.code === params.code)
      );
    }
    if (params?.count != null && params.count < filtered.length) {
      filtered = filtered.slice(0, params.count);
    }
    return mockBundle(filtered);
  }

  override async getMedicationRequests(
    patientId: string,
    params?: { status?: string }
  ): Promise<FHIRBundle<FHIRMedicationRequest>> {
    const { medicationRequests } = getMockDataForPatient(patientId);
    let filtered = medicationRequests;
    if (params?.status) {
      filtered = filtered.filter((m) => m.status === params.status);
    }
    return mockBundle(filtered);
  }

  override async resolveReference<T>(reference: string): Promise<T> {
    const trimmed = reference.trim();
    const match =
      trimmed.match(/\/(Patient|Condition|ServiceRequest|ImagingStudy|Observation|MedicationRequest)\/([^/?]+)/i) ??
      trimmed.match(/^(Patient|Condition|ServiceRequest|ImagingStudy|Observation|MedicationRequest)\/([^/?]+)/i);
    if (match) {
      const [, resourceType, id] = match;
      const key = `${resourceType}/${id}`;
      const resource = getAllMockResources().get(key);
      if (resource != null) return resource as T;
    }
    return super.resolveReference<T>(reference);
  }
}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

/**
 * Creates a FHIR client. If config.mockMode is true, returns a MockFHIRClient
 * with realistic mock data for testing without a live FHIR server.
 */
export function createFHIRClient(config: FHIRClientConfig): FHIRClient {
  if (config.mockMode) {
    return new MockFHIRClient({
      baseUrl: config.baseUrl,
      accessToken: config.accessToken,
      timeout: config.timeout,
    });
  }
  return new FHIRClient({
    baseUrl: config.baseUrl,
    accessToken: config.accessToken,
    timeout: config.timeout,
  });
}
