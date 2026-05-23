/**
 * Builds a synthetic CDS Hooks `order-select` request for the ARKA-INS investor demo,
 * using demo patient/order data and full prefetch so `/api/cds-services/arka-ins-coverage` can score without a live FHIR server.
 */

import type { Patient, ImagingOrder } from "@/lib/demos/ins/types";
import type { CDSHookRequest } from "@/lib/types/cds-hooks";
import type { Bundle, Coverage, Patient as FHIRPatient, Practitioner, ServiceRequest } from "@/lib/types/fhir";

function bundle<T extends { resourceType: string }>(resources: T[]): Bundle<T> {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map((resource) => ({ resource })),
  };
}

function imagingCategory(): ServiceRequest["category"] {
  return [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/service-request-category",
          code: "imaging",
          display: "Imaging",
        },
      ],
    },
  ];
}

function buildPatientResource(patient: Patient, logicalId: string): FHIRPatient {
  return {
    resourceType: "Patient",
    id: logicalId,
    active: true,
    gender: patient.gender === "female" ? "female" : patient.gender === "male" ? "male" : "unknown",
    birthDate: patient.dateOfBirth,
    name: [{ family: patient.lastName, given: [patient.firstName], text: `${patient.firstName} ${patient.lastName}` }],
  };
}

function buildPractitioner(order: ImagingOrder, logicalId: string): Practitioner {
  const npi = order.orderingProvider.npi.replace(/\D/g, "").padStart(10, "0").slice(0, 10);
  return {
    resourceType: "Practitioner",
    id: logicalId,
    active: true,
    name: [{ text: order.orderingProvider.name }],
    identifier: [
      {
        system: "http://hl7.org/fhir/sid/us-npi",
        value: npi,
      },
    ],
  };
}

function buildCoverageResource(patient: Patient, patientLogicalId: string, orderId: string): Coverage {
  const payorRef = `Organization/payer-${patient.insurancePlan.id.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  return {
    resourceType: "Coverage",
    id: `coverage-${orderId}`,
    status: "active",
    subscriberId: patient.memberId,
    beneficiary: { reference: `Patient/${patientLogicalId}` },
    subscriber: { reference: `Patient/${patientLogicalId}` },
    payor: [{ reference: payorRef, display: patient.insurancePlan.name }],
    period: { start: patient.insurancePlan.effectiveDate ?? "2024-01-01" },
    class: [
      {
        type: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-class", code: "plan" }],
        },
        value: patient.insurancePlan.id,
        name: patient.insurancePlan.name,
      },
    ],
    costToBeneficiary: [
      {
        type: { text: "Deductible remaining" },
        valueMoney: { value: 900, currency: "USD" },
      },
      {
        type: { text: "Coinsurance" },
        valueQuantity: { value: 20, unit: "%" },
      },
    ],
  };
}

function buildServiceRequest(
  patient: Patient,
  order: ImagingOrder,
  patientLogicalId: string,
  srId: string,
): ServiceRequest {
  const reasonText = order.clinicalIndication || order.clinicalNotes || "Imaging evaluation";
  const reasonCode =
    order.icdCodes.length > 0 ?
      order.icdCodes.map((code, i) => ({
        coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code, display: order.icdDescriptions?.[i] ?? code }],
        text: order.icdDescriptions?.[i] ?? reasonText,
      }))
    : [{ text: reasonText }];
  return {
    resourceType: "ServiceRequest",
    id: srId,
    intent: "order",
    status: "active",
    category: imagingCategory(),
    subject: { reference: `Patient/${patientLogicalId}` },
    authoredOn: order.createdAt,
    code: {
      coding: [
        {
          system: "http://www.ama-assn.org/go/cpt",
          code: order.cptCode,
          display: order.cptDescription ?? order.imagingType,
        },
      ],
      text: order.cptDescription ?? `${order.imagingType} — ${order.cptCode}`,
    },
    reasonCode,
    note: order.clinicalNotes ? [{ text: order.clinicalNotes }] : undefined,
  };
}

/**
 * Builds a CDS Hooks request payload for the coverage service from demo store patient and order.
 *
 * @param patient - Demo patient (member id and demographics).
 * @param order - Demo imaging order (CPT, indication, provider NPI).
 * @param hookInstance - Unique hook invocation id (UUID).
 */
export function buildDemoCdsCoverageRequest(
  patient: Patient,
  order: ImagingOrder,
  hookInstance: string,
): CDSHookRequest {
  const patientLogicalId = `demo-ins-${patient.id.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const practitionerLogicalId = `demo-pract-${order.orderingProvider.npi.replace(/\D/g, "").slice(-10)}`;
  const srId = `demo-sr-${order.id.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  const pat = buildPatientResource(patient, patientLogicalId);
  const pr = buildPractitioner(order, practitionerLogicalId);
  const cov = buildCoverageResource(patient, patientLogicalId, order.id);
  const sr = buildServiceRequest(patient, order, patientLogicalId, srId);

  return {
    hook: "order-select",
    hookInstance,
    fhirServer: "https://sandbox.cds-hooks.org/fhir",
    context: {
      patientId: patientLogicalId,
      userId: practitionerLogicalId,
      selections: [{ reference: `ServiceRequest/${srId}` }],
    },
    prefetch: {
      patient: pat,
      practitioner: pr,
      coverage: bundle([cov]),
      serviceRequest: bundle([sr]),
    },
  };
}
