/**
 * @file build-cds-request.ts
 * @description Builds CDS Hooks 2.0 request payloads from demo scenarios (order-select / order-sign).
 */

import type { CDSHookRequest } from '@/lib/types/cds-hooks';
import type { FHIRBundle, FHIRPatient, FHIRServiceRequest } from '@/lib/cds-platform/fhir/resources';
import type { DemoScenario } from './scenarios';

function bundle<T>(resources: T[]): FHIRBundle<T> {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: resources.map((resource) => ({ resource })),
  };
}

function patientResource(scenario: DemoScenario): FHIRPatient {
  const birthYear = new Date().getFullYear() - scenario.age;
  return {
    resourceType: 'Patient',
    id: scenario.patientId,
    name: [{ family: scenario.patientName.split(' ').slice(-1)[0], given: scenario.patientName.split(' ').slice(0, -1), text: scenario.patientName }],
    gender: scenario.sex === 'Male' ? 'male' : 'female',
    birthDate: `${birthYear}-06-15`,
    identifier: [{ system: 'urn:arka:mrn', value: scenario.mrn }],
  };
}

function draftOrder(scenario: DemoScenario): FHIRServiceRequest {
  return {
    resourceType: 'ServiceRequest',
    id: `draft-${scenario.id}`,
    status: 'draft',
    intent: 'order',
    priority: scenario.urgency === 'Stat' ? 'stat' : scenario.urgency === 'Urgent' ? 'urgent' : 'routine',
    subject: { reference: `Patient/${scenario.patientId}` },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-request-category',
            code: 'imaging',
            display: 'Imaging',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://www.ama-assn.org/go/cpt',
          code: scenario.cpt,
          display: scenario.orderDisplay,
        },
      ],
      text: scenario.orderDisplay,
    },
    bodySite: [{ text: scenario.bodyPart }],
    reasonCode: [
      {
        text: `${scenario.chiefComplaint} (${scenario.icd10})`,
        coding: [{ code: scenario.icd10, display: scenario.chiefComplaint }],
      },
    ],
    note: [{ text: `Duration: ${scenario.duration} days` }],
  };
}

function conditionsBundle(scenario: DemoScenario): FHIRBundle<Record<string, unknown>> {
  return bundle(
    scenario.problems.map((p, i) => ({
      resourceType: 'Condition',
      id: `cond-${scenario.id}-${i}`,
      clinicalStatus: { coding: [{ code: 'active' }] },
      code: { coding: [{ code: p.icd10, display: p.display }], text: p.display },
      subject: { reference: `Patient/${scenario.patientId}` },
    })),
  );
}

function labsBundle(scenario: DemoScenario): FHIRBundle<Record<string, unknown>> {
  return bundle([
    {
      resourceType: 'Observation',
      id: `egfr-${scenario.id}`,
      status: 'final',
      code: { coding: [{ code: '33914-3', display: 'eGFR' }] },
      subject: { reference: `Patient/${scenario.patientId}` },
      valueQuantity: { value: scenario.eGFR, unit: 'mL/min/1.73m2' },
      effectiveDateTime: new Date().toISOString().slice(0, 10),
    },
  ]);
}

/**
 * Builds a CDS Hooks 2.0 request for the given scenario and hook.
 *
 * @param scenario - Demo scenario chart + order context.
 * @param hook - `order-select` or `order-sign`.
 */
export function buildCdsRequest(
  scenario: DemoScenario,
  hook: 'order-select' | 'order-sign',
): CDSHookRequest {
  const draft = draftOrder(scenario);
  const draftOrders = bundle([draft]);

  return {
    hook,
    hookInstance: crypto.randomUUID(),
    fhirServer: 'https://demo.epicsim.arkahealth.local/fhir',
    context: {
      patientId: scenario.patientId,
      userId: scenario.userId,
      encounterId: `encounter-${scenario.id}`,
      draftOrders,
      selections: [`ServiceRequest/draft-${scenario.id}`],
    },
    prefetch: {
      patient: patientResource(scenario),
      activeConditions: conditionsBundle(scenario),
      relevantLabs: labsBundle(scenario),
      recentImaging: bundle([]),
      activeMedications: bundle([]),
      priorServiceRequests: bundle([]),
    },
  };
}
