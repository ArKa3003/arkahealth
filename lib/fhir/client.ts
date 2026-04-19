import FhirKitClient from "fhir-kit-client";

import type { CDSFhirAuthorization } from "@/lib/types/cds-hooks";
import type {
  Appointment,
  Bundle,
  Coverage,
  InsurancePlan,
  Location,
  Organization,
  Patient,
  Practitioner,
  ServiceRequest,
} from "@/lib/types/fhir";

/** Milliseconds applied as an upper bound for every outbound FHIR request. */
const FHIR_CALL_TIMEOUT_MS = 2000;

/**
 * Normalized error returned by {@link FHIRClient} operations (no request bodies or identifiers).
 */
export interface FHIRError {
  /** Stable machine-readable error code. */
  code: string;
  /** Optional HTTP status when the failure was transport- or server-related. */
  status?: number;
}

/**
 * Standard success/failure tuple for FHIR calls.
 */
export type FHIRResult<T> = { data: T; error?: undefined } | { data: null; error: FHIRError };

function bearerFromAuthorization(auth: CDSFhirAuthorization | string | undefined): string | undefined {
  if (typeof auth === "string") {
    const t = auth.trim();
    return t.length > 0 ? t : undefined;
  }
  if (!auth?.accessToken) {
    return undefined;
  }
  return auth.accessToken.trim();
}

function toFhirError(err: unknown, fallbackCode: string): FHIRError {
  if (err && typeof err === "object") {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (typeof status === "number") {
      return { code: "fhir_request_failed", status };
    }
  }
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.message.toLowerCase().includes("abort")) {
      return { code: "fhir_timeout" };
    }
  }
  return { code: fallbackCode };
}

function requestTimeoutOptions(): RequestInit {
  return { signal: AbortSignal.timeout(FHIR_CALL_TIMEOUT_MS) };
}

/**
 * Typed facade over `fhir-kit-client` with consistent timeouts and {@link FHIRResult} responses.
 */
export class FHIRClient {
  private readonly inner: FhirKitClient | null;
  private readonly blocked: FHIRError | null;

  /**
   * @param fhirServer - Base URL for the FHIR server (SMART `iss` / CDS `fhirServer`).
   * @param fhirAuthorization - OAuth access token string, or CDS `fhirAuthorization` containing `accessToken`.
   */
  constructor(fhirServer: string | undefined, fhirAuthorization: CDSFhirAuthorization | string | undefined) {
    const base = typeof fhirServer === "string" ? fhirServer.trim() : "";
    const token = bearerFromAuthorization(fhirAuthorization);

    if (!base) {
      this.inner = null;
      this.blocked = { code: "missing_fhir_server" };
      return;
    }
    if (!token) {
      this.inner = null;
      this.blocked = { code: "missing_fhir_authorization" };
      return;
    }

    try {
      this.inner = new FhirKitClient({ baseUrl: base, bearerToken: token });
      this.blocked = null;
    } catch {
      this.inner = null;
      this.blocked = { code: "fhir_client_init_failed" };
    }
  }

  private guard<T>(): FHIRResult<T> | null {
    if (this.blocked) {
      return { data: null, error: this.blocked };
    }
    if (!this.inner) {
      return { data: null, error: { code: "fhir_client_unavailable" } };
    }
    return null;
  }

  /**
   * Reads a `Patient` instance by logical id.
   */
  async getPatient(id: string): Promise<FHIRResult<Patient>> {
    const g = this.guard<Patient>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.read({
        resourceType: "Patient",
        id,
        options: requestTimeoutOptions(),
      })) as Patient;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "patient_read_failed") };
    }
  }

  /**
   * Reads a single `Coverage` instance by logical id.
   */
  async readCoverage(id: string): Promise<FHIRResult<Coverage>> {
    const g = this.guard<Coverage>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.read({
        resourceType: "Coverage",
        id,
        options: requestTimeoutOptions(),
      })) as Coverage;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "coverage_read_failed") };
    }
  }

  /**
   * Searches active `Coverage` rows for a patient.
   */
  async getCoverage(patientId: string): Promise<FHIRResult<Bundle<Coverage>>> {
    const g = this.guard<Bundle<Coverage>>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.request(`Coverage?patient=${encodeURIComponent(patientId)}&status=active`, {
        options: requestTimeoutOptions(),
      })) as Bundle<Coverage>;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "coverage_search_failed") };
    }
  }

  /**
   * Searches recent imaging `ServiceRequest` rows for a patient.
   */
  /**
   * Reads a single `ServiceRequest` by logical id (for example from `order-select` selections).
   */
  async readServiceRequest(id: string): Promise<FHIRResult<ServiceRequest>> {
    const g = this.guard<ServiceRequest>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.read({
        resourceType: "ServiceRequest",
        id,
        options: requestTimeoutOptions(),
      })) as ServiceRequest;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "service_request_read_failed") };
    }
  }

  async getServiceRequest(patientId: string): Promise<FHIRResult<Bundle<ServiceRequest>>> {
    const g = this.guard<Bundle<ServiceRequest>>();
    if (g) {
      return g;
    }
    const path =
      `ServiceRequest?patient=${encodeURIComponent(patientId)}` +
      `&category=${encodeURIComponent("imaging")}` +
      `&_sort=${encodeURIComponent("-authored")}` +
      `&_count=5`;
    try {
      const data = (await this.inner!.request(path, {
        options: requestTimeoutOptions(),
      })) as Bundle<ServiceRequest>;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "service_request_search_failed") };
    }
  }

  /**
   * Runs an `Organization` search using the supplied relative query string (excluding the resource type prefix if included).
   */
  async getOrganization(query: string): Promise<FHIRResult<Bundle<Organization>>> {
    const g = this.guard<Bundle<Organization>>();
    if (g) {
      return g;
    }
    const path = query.startsWith("Organization?") ? query : `Organization?${query}`;
    try {
      const data = (await this.inner!.request(path, {
        options: requestTimeoutOptions(),
      })) as Bundle<Organization>;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "organization_search_failed") };
    }
  }

  /**
   * Reads a single `Organization` by logical id (for example an imaging facility on an `Appointment`).
   */
  async readOrganization(id: string): Promise<FHIRResult<Organization>> {
    const g = this.guard<Organization>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.read({
        resourceType: "Organization",
        id,
        options: requestTimeoutOptions(),
      })) as Organization;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "organization_read_failed") };
    }
  }

  /**
   * Reads an `InsurancePlan` by logical id, or searches when `query` includes `?`.
   */
  async getInsurancePlan(idOrQuery: string): Promise<FHIRResult<InsurancePlan | Bundle<InsurancePlan>>> {
    const g = this.guard<InsurancePlan | Bundle<InsurancePlan>>();
    if (g) {
      return g;
    }
    try {
      if (idOrQuery.includes("?")) {
        const path = idOrQuery.startsWith("InsurancePlan?") ? idOrQuery : `InsurancePlan?${idOrQuery}`;
        const data = (await this.inner!.request(path, {
          options: requestTimeoutOptions(),
        })) as Bundle<InsurancePlan>;
        return { data };
      }
      const data = (await this.inner!.read({
        resourceType: "InsurancePlan",
        id: idOrQuery,
        options: requestTimeoutOptions(),
      })) as InsurancePlan;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "insurance_plan_read_failed") };
    }
  }

  /**
   * Reads a `Practitioner` instance by logical id.
   */
  async getPractitioner(id: string): Promise<FHIRResult<Practitioner>> {
    const g = this.guard<Practitioner>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.read({
        resourceType: "Practitioner",
        id,
        options: requestTimeoutOptions(),
      })) as Practitioner;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "practitioner_read_failed") };
    }
  }

  /**
   * Reads an `Appointment` instance by logical id.
   */
  async getAppointment(id: string): Promise<FHIRResult<Appointment>> {
    const g = this.guard<Appointment>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.read({
        resourceType: "Appointment",
        id,
        options: requestTimeoutOptions(),
      })) as Appointment;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "appointment_read_failed") };
    }
  }

  /**
   * Reads a `Location` instance by logical id (for example an imaging site on an `Appointment`).
   */
  async getLocation(id: string): Promise<FHIRResult<Location>> {
    const g = this.guard<Location>();
    if (g) {
      return g;
    }
    try {
      const data = (await this.inner!.read({
        resourceType: "Location",
        id,
        options: requestTimeoutOptions(),
      })) as Location;
      return { data };
    } catch (e) {
      return { data: null, error: toFhirError(e, "location_read_failed") };
    }
  }
}
