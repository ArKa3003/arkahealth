import { FHIRClient } from "@/lib/fhir/client";
import { isDemoMode } from "@/lib/demo/demo-mode";
import {
  mockAppointment,
  mockCoverageBundle,
  mockOrganization,
  mockPatient,
  mockPractitioner,
  mockServiceRequestBundle,
} from "@/lib/demo/mock-fhir";
import type { CDSHookRequest } from "@/lib/types/cds-hooks";
import type {
  Appointment,
  Bundle,
  Coverage,
  InsurancePlan,
  Organization,
  Patient,
  Practitioner,
  ServiceRequest,
} from "@/lib/types/fhir";

/**
 * CDS prefetch templates for coverage and ordering workflows.
 */
export const COVERAGE_PREFETCH = {
  patient: "Patient/{{context.patientId}}",
  coverage: "Coverage?patient={{context.patientId}}&status=active",
  serviceRequest:
    "ServiceRequest?patient={{context.patientId}}&category=imaging&_sort=-authored&_count=5",
  practitioner: "Practitioner/{{context.userId}}",
  organization: "Organization?practitioner={{context.userId}}",
  insurancePlan: "InsurancePlan?_id={{Coverage.payor}}",
} as const;

/**
 * CDS prefetch templates when an appointment is in context.
 */
export const APPOINTMENT_PREFETCH = {
  patient: "Patient/{{context.patientId}}",
  coverage: "Coverage?patient={{context.patientId}}&status=active",
  appointment: "Appointment/{{context.appointmentId}}",
} as const;

/** Keys produced by {@link resolvePrefetch}. */
export type PrefetchBundleKey =
  | keyof typeof COVERAGE_PREFETCH
  | keyof typeof APPOINTMENT_PREFETCH;

/**
 * Aggregated prefetch results with optional provenance for each slot.
 */
export interface PrefetchBundle {
  patient?: Patient;
  coverage?: Bundle<Coverage>;
  serviceRequest?: Bundle<ServiceRequest>;
  practitioner?: Practitioner;
  organization?: Bundle<Organization>;
  insurancePlan?: InsurancePlan | Bundle<InsurancePlan>;
  appointment?: Appointment;
  /** Whether each slot was satisfied from the incoming prefetch payload or a follow-up FHIR call. */
  resolution?: Partial<Record<PrefetchBundleKey, "prefetch" | "fhir">>;
}

function getStringField(context: Record<string, unknown>, key: string): string | undefined {
  const v = context[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

/**
 * Derives a logical `Patient` id from CDS hook context fields.
 */
export function patientIdFromContext(context: Record<string, unknown>): string | undefined {
  const explicit = getStringField(context, "patientId");
  if (explicit) {
    return explicit.startsWith("Patient/") ? explicit.slice(8) : explicit;
  }
  const patient = getStringField(context, "patient");
  if (patient) {
    return patient.startsWith("Patient/") ? patient.slice(8) : patient;
  }
  return undefined;
}

/**
 * Derives a logical `Practitioner` id from CDS hook context fields.
 */
export function userIdFromContext(context: Record<string, unknown>): string | undefined {
  const explicit = getStringField(context, "userId");
  if (explicit) {
    return explicit.startsWith("Practitioner/") ? explicit.slice(14) : explicit;
  }
  return undefined;
}

/**
 * Derives a logical `Appointment` id from CDS hook context fields.
 */
export function appointmentIdFromContext(context: Record<string, unknown>): string | undefined {
  const explicit = getStringField(context, "appointmentId");
  if (explicit) {
    return explicit.startsWith("Appointment/") ? explicit.slice(12) : explicit;
  }
  const appt = getStringField(context, "appointment");
  if (appt) {
    return appt.startsWith("Appointment/") ? appt.slice(12) : appt;
  }
  return undefined;
}

function isUnresolvedTemplate(value: unknown): boolean {
  return typeof value === "string" && value.includes("{{");
}

/**
 * Returns whether a prefetch slot appears populated by the EHR.
 */
export function isPrefetchSlotPopulated(value: unknown): boolean {
  if (value == null) {
    return false;
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 && !isUnresolvedTemplate(t);
  }
  if (typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (o.resourceType === "Bundle") {
    const entry = o.entry;
    if (Array.isArray(entry) && entry.length > 0) {
      return true;
    }
    const total = o.total;
    return typeof total === "number" && total > 0;
  }
  return typeof o.resourceType === "string";
}

function bundleFromCoverageValue(value: unknown): Bundle<Coverage> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const o = value as Record<string, unknown>;
  if (o.resourceType === "Bundle") {
    return o as unknown as Bundle<Coverage>;
  }
  if (o.resourceType === "Coverage") {
    return {
      resourceType: "Bundle",
      type: "collection",
      entry: [{ resource: o as unknown as Coverage }],
    };
  }
  return undefined;
}

function firstCoverageFromBundle(bundle: Bundle<Coverage> | undefined): Coverage | undefined {
  const entries = bundle?.entry;
  if (!entries?.length) {
    return undefined;
  }
  for (const e of entries) {
    const r = e.resource;
    if (r && (r as Coverage).resourceType === "Coverage") {
      return r as Coverage;
    }
  }
  return undefined;
}

function payorIdsForInsurancePlanSearch(coverage: Coverage | undefined): string[] {
  if (!coverage?.payor?.length) {
    return [];
  }
  const out: string[] = [];
  for (const p of coverage.payor) {
    const ref = p.reference?.trim();
    if (!ref) {
      continue;
    }
    const idPart = ref.includes("/") ? ref.split("/").pop() : ref;
    if (idPart) {
      out.push(idPart);
    }
  }
  return out;
}

function readPrefetchRecord(request: CDSHookRequest): Record<string, unknown> {
  const p = request.prefetch;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    return p as Record<string, unknown>;
  }
  return {};
}

function planTypeFromContext(context: Record<string, unknown>): "HDHP" | "PPO" | "Medicare" {
  const raw = context.demoPlanType ?? context.planType;
  if (raw === "HDHP" || raw === "PPO" || raw === "Medicare") {
    return raw;
  }
  return "PPO";
}

/**
 * Fills missing prefetch slots with {@link mock-fhir} resources when `DEMO_MODE=true`
 * (sandbox.cds-hooks.org or offline investor demos).
 */
function applyDemoPrefetchFallback(
  out: PrefetchBundle,
  resolution: Partial<Record<PrefetchBundleKey, "prefetch" | "fhir">>,
  context: Record<string, unknown>,
): void {
  const pid = patientIdFromContext(context) ?? "demo-sandbox-patient";
  const uid = userIdFromContext(context) ?? "demo-practitioner";
  const appointmentId = appointmentIdFromContext(context);
  const cptRaw = context.demoCpt;
  const cpt = typeof cptRaw === "string" && /^\d{5}$/.test(cptRaw) ? cptRaw : "72148";
  const siteRaw = context.demoSiteId;
  const siteId =
    typeof siteRaw === "string" && siteRaw.trim().length > 0 ? siteRaw.trim() : "loc-demo-imaging";
  const gold = context.demoGoldCard === true;
  const plan = planTypeFromContext(context);

  if (!out.patient) {
    out.patient = mockPatient(pid);
    resolution.patient = "prefetch";
  }
  if (!out.coverage) {
    out.coverage = mockCoverageBundle(pid, plan);
    resolution.coverage = "prefetch";
  }
  if (!out.serviceRequest) {
    out.serviceRequest = mockServiceRequestBundle(pid, cpt);
    resolution.serviceRequest = "prefetch";
  }
  if (!out.practitioner) {
    out.practitioner = mockPractitioner(uid, gold);
    resolution.practitioner = "prefetch";
  }
  if (!out.organization) {
    out.organization = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [{ resource: mockOrganization("org-payer-demo") }],
    };
    resolution.organization = "prefetch";
  }
  if (!out.insurancePlan) {
    const cov = firstCoverageFromBundle(out.coverage);
    const payorRef = cov?.payor?.[0]?.reference?.split("/").pop();
    const ip: InsurancePlan = {
      resourceType: "InsurancePlan",
      id: payorRef ?? "plan-demo",
      name: "Demo Commercial Plan",
      status: "active",
    };
    out.insurancePlan = ip;
    resolution.insurancePlan = "prefetch";
  }
  if (!out.appointment && appointmentId) {
    out.appointment = mockAppointment(pid, siteId);
    resolution.appointment = "prefetch";
  }
}

/**
 * Resolves CDS prefetch slots using any populated EHR data first, then lazy FHIR reads.
 */
export async function resolvePrefetch(request: CDSHookRequest): Promise<PrefetchBundle> {
  const context = request.context && typeof request.context === "object" && !Array.isArray(request.context)
    ? (request.context as Record<string, unknown>)
    : {};
  const prefetch = readPrefetchRecord(request);

  const patientId = patientIdFromContext(context);
  const userId = userIdFromContext(context);
  const appointmentId = appointmentIdFromContext(context);

  const client = new FHIRClient(request.fhirServer, request.fhirAuthorization);

  const resolution: Partial<Record<PrefetchBundleKey, "prefetch" | "fhir">> = {};
  const out: PrefetchBundle = { resolution };

  // Patient
  if (isPrefetchSlotPopulated(prefetch.patient)) {
    const p = prefetch.patient;
    if (p && typeof p === "object") {
      const o = p as Record<string, unknown>;
      if (o.resourceType === "Patient") {
        out.patient = p as Patient;
        resolution.patient = "prefetch";
      } else if (o.resourceType === "Bundle") {
        const entries = (o.entry as Array<{ resource?: unknown }> | undefined) ?? [];
        const firstPatient = entries.map((e) => e.resource).find((r) => (r as Patient)?.resourceType === "Patient");
        if (firstPatient) {
          out.patient = firstPatient as Patient;
          resolution.patient = "prefetch";
        }
      }
    }
  } else if (patientId) {
    const r = await client.getPatient(patientId);
    if (r.data) {
      out.patient = r.data;
      resolution.patient = "fhir";
    }
  }

  // Coverage
  if (isPrefetchSlotPopulated(prefetch.coverage)) {
    const b = bundleFromCoverageValue(prefetch.coverage);
    if (b) {
      out.coverage = b;
      resolution.coverage = "prefetch";
    }
  } else if (patientId) {
    const r = await client.getCoverage(patientId);
    if (r.data) {
      out.coverage = r.data;
      resolution.coverage = "fhir";
    }
  }

  // ServiceRequest
  if (isPrefetchSlotPopulated(prefetch.serviceRequest)) {
    const sr = prefetch.serviceRequest;
    if (sr && typeof sr === "object" && (sr as Bundle<ServiceRequest>).resourceType === "Bundle") {
      out.serviceRequest = sr as Bundle<ServiceRequest>;
      resolution.serviceRequest = "prefetch";
    }
  } else if (patientId) {
    const r = await client.getServiceRequest(patientId);
    if (r.data) {
      out.serviceRequest = r.data;
      resolution.serviceRequest = "fhir";
    }
  }

  // Practitioner
  if (isPrefetchSlotPopulated(prefetch.practitioner)) {
    const pr = prefetch.practitioner;
    if (pr && typeof pr === "object" && (pr as Practitioner).resourceType === "Practitioner") {
      out.practitioner = pr as Practitioner;
      resolution.practitioner = "prefetch";
    }
  } else if (userId) {
    const r = await client.getPractitioner(userId);
    if (r.data) {
      out.practitioner = r.data;
      resolution.practitioner = "fhir";
    }
  }

  // Organization
  if (isPrefetchSlotPopulated(prefetch.organization)) {
    const org = prefetch.organization;
    if (org && typeof org === "object" && (org as Bundle<Organization>).resourceType === "Bundle") {
      out.organization = org as Bundle<Organization>;
      resolution.organization = "prefetch";
    }
  } else if (userId) {
    const r = await client.getOrganization(`practitioner=${encodeURIComponent(userId)}`);
    if (r.data) {
      out.organization = r.data;
      resolution.organization = "fhir";
    }
  }

  // InsurancePlan (depends on coverage for id expansion)
  if (isPrefetchSlotPopulated(prefetch.insurancePlan)) {
    const ip = prefetch.insurancePlan;
    if (ip && typeof ip === "object") {
      const o = ip as Record<string, unknown>;
      if (o.resourceType === "InsurancePlan") {
        out.insurancePlan = ip as InsurancePlan;
        resolution.insurancePlan = "prefetch";
      } else if (o.resourceType === "Bundle") {
        out.insurancePlan = ip as Bundle<InsurancePlan>;
        resolution.insurancePlan = "prefetch";
      }
    }
  } else {
    const primaryCoverage = firstCoverageFromBundle(out.coverage);
    const payorIds = payorIdsForInsurancePlanSearch(primaryCoverage);
    if (payorIds.length > 0) {
      const r = await client.getInsurancePlan(`_id=${encodeURIComponent(payorIds[0]!)}`);
      if (r.data) {
        out.insurancePlan = r.data;
        resolution.insurancePlan = "fhir";
      }
    }
  }

  // Appointment
  if (isPrefetchSlotPopulated(prefetch.appointment)) {
    const ap = prefetch.appointment;
    if (ap && typeof ap === "object" && (ap as Appointment).resourceType === "Appointment") {
      out.appointment = ap as Appointment;
      resolution.appointment = "prefetch";
    }
  } else if (appointmentId) {
    const r = await client.getAppointment(appointmentId);
    if (r.data) {
      out.appointment = r.data;
      resolution.appointment = "fhir";
    }
  }

  if (isDemoMode()) {
    applyDemoPrefetchFallback(out, resolution, context);
  }

  return out;
}
