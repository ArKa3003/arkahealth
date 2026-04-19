/**
 * Mock FHIR R4 resources for sandbox.cds-hooks.org test patients and fully offline demo mode.
 * Used when CDS prefetch is empty and {@link isDemoMode} is enabled (see `resolvePrefetch`).
 */

import type {
  Appointment,
  Bundle,
  Coverage,
  Organization,
  Patient,
  Practitioner,
  ServiceRequest,
} from "@/lib/types/fhir";

function bundle<T extends { resourceType: string }>(resources: T[]): Bundle<T> {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map((resource) => ({ resource })),
  };
}

/**
 * @param id - Logical Patient id (may include or omit a `Patient/` prefix in callers).
 */
export function mockPatient(id: string): Patient {
  const pid = id.replace(/^Patient\//, "");
  return {
    resourceType: "Patient",
    id: pid,
    active: true,
    gender: "female",
    birthDate: "1978-04-12",
    name: [{ family: "DemoPatient", given: ["Jordan"], text: "Jordan DemoPatient" }],
    address: [{ city: "Dallas", state: "TX", postalCode: "75201", country: "US" }],
  };
}

/**
 * @param patientId - Logical Patient id for beneficiary linkage.
 * @param planType - Drives deductible / coinsurance mock for OOP estimators.
 */
export function mockCoverage(
  patientId: string,
  planType: "HDHP" | "PPO" | "Medicare",
): Coverage {
  const pid = patientId.replace(/^Patient\//, "");
  const payorOrgId = "org-payer-demo";
  const deductible =
    planType === "HDHP" ? 3200
    : planType === "Medicare" ? 240
    : 900;
  const coinsurancePct =
    planType === "HDHP" ? 0.2
    : planType === "Medicare" ? 0.2
    : 0.18;

  return {
    resourceType: "Coverage",
    id: `coverage-${pid}`,
    status: "active",
    subscriber: { reference: `Patient/${pid}` },
    beneficiary: { reference: `Patient/${pid}` },
    payor: [{ reference: `Organization/${payorOrgId}`, display: "Demo National Payer" }],
    period: { start: "2024-01-01" },
    class: [
      {
        type: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-class", code: "plan" }],
        },
        value: planType === "Medicare" ? "MEDICARE" : "COMMERCIAL",
        name: planType,
      },
    ],
    costToBeneficiary: [
      {
        type: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-copay-type", code: "deductible" }],
        },
        valueMoney: { value: deductible, currency: "USD" },
      },
      {
        type: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-copay-type", code: "coinsurance" }],
        },
        valueQuantity: { value: coinsurancePct * 100, unit: "%" },
      },
    ],
  };
}

/**
 * @param patientId - Subject Patient id.
 * @param cpt - Ordering CPT code (5-digit).
 */
export function mockServiceRequest(patientId: string, cpt: string): ServiceRequest {
  const pid = patientId.replace(/^Patient\//, "");
  return {
    resourceType: "ServiceRequest",
    id: `sr-demo-${cpt}-${pid}`,
    status: "active",
    intent: "order",
    priority: "routine",
    subject: { reference: `Patient/${pid}` },
    authoredOn: new Date().toISOString(),
    category: [
      {
        coding: [{ system: "http://snomed.info/sct", code: "363679005", display: "Imaging" }],
        text: "Imaging",
      },
    ],
    code: {
      coding: [{ system: "http://www.ama-assn.org/go/cpt", code: cpt, display: `CPT ${cpt}` }],
      text: `Procedure ${cpt}`,
    },
    reasonCode: [
      {
        coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: "M54.16", display: "Radiculopathy, lumbar region" }],
        text: "Lumbar radiculopathy",
      },
    ],
  };
}

/**
 * @param id - Logical Practitioner id.
 * @param goldCarded - Whether narrative copy should reflect gold-card eligibility (display only).
 */
export function mockPractitioner(id: string, goldCarded: boolean): Practitioner {
  const pid = id.replace(/^Practitioner\//, "");
  return {
    resourceType: "Practitioner",
    id: pid,
    active: true,
    name: [
      {
        family: "Ordering",
        given: ["Alex"],
        prefix: ["Dr."],
        text: goldCarded ? "Dr. Alex Ordering (Gold card demo)" : "Dr. Alex Ordering",
      },
    ],
  };
}

/**
 * @param id - Logical Organization id.
 */
export function mockOrganization(id: string): Organization {
  const oid = id.replace(/^Organization\//, "");
  return {
    resourceType: "Organization",
    id: oid,
    active: true,
    name: "ARKA Demo Imaging Network",
    address: [{ city: "Kansas City", state: "MO", postalCode: "64108", country: "US" }],
  };
}

/**
 * @param patientId - Patient id for participant reference.
 * @param siteId - Logical site / Location id used as supporting information.
 */
export function mockAppointment(patientId: string, siteId: string): Appointment {
  const pid = patientId.replace(/^Patient\//, "");
  const start = new Date(Date.now() + 86400000).toISOString();
  return {
    resourceType: "Appointment",
    id: `appt-demo-${pid}`,
    status: "booked",
    start,
    end: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    participant: [
      {
        actor: { reference: `Patient/${pid}` },
        status: "accepted",
        required: "required",
      },
      {
        actor: { reference: `Location/${siteId.replace(/^Location\//, "")}` },
        status: "accepted",
        required: "optional",
      },
    ],
  };
}

/**
 * Wraps {@link mockCoverage} as a search Bundle.
 */
export function mockCoverageBundle(patientId: string, planType: "HDHP" | "PPO" | "Medicare"): Bundle<Coverage> {
  return bundle([mockCoverage(patientId, planType)]);
}

/**
 * Wraps {@link mockServiceRequest} as a search Bundle.
 */
export function mockServiceRequestBundle(patientId: string, cpt: string): Bundle<ServiceRequest> {
  return bundle([mockServiceRequest(patientId, cpt)]);
}
