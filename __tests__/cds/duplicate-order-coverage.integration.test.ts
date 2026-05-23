import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AIIEScore } from "@/lib/types/aiie";
import type { CDSHookRequest } from "@/lib/types/cds-hooks";
import type {
  Bundle,
  Coverage,
  Patient,
  Practitioner,
  ServiceRequest,
} from "@/lib/types/fhir";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

const { getPatientRecordSnapshot } = vi.hoisted(() => ({
  getPatientRecordSnapshot: vi.fn(),
}));

const mockScore: AIIEScore = {
  clinicalScore: 7,
  denialRisk: 3,
  confidence: 0.85,
  factors: [
    {
      id: "clinical-alignment",
      name: "Clinical alignment",
      weight: 0.4,
      contribution: 0.4,
      evidenceCitation: "ACR Appropriateness Criteria",
    },
  ],
  narrativeRationale: "Mock score for CDS integration test.",
};

const startedIso = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

const mockRecordSnapshot: PatientRecordSnapshot = {
  patientHash: "test-patient-hash",
  capturedAtIso: new Date().toISOString(),
  ttlSeconds: 1800,
  problems: [],
  medications: [],
  allergies: [],
  encounters: [],
  priorImaging: [
    {
      id: "img-prior-72148",
      startedIso,
      modality: ["MRI"],
      bodySite: "lumbar spine",
      description: "MRI lumbar spine",
    },
  ],
  priorReports: [
    {
      id: "dr-prior-1",
      issuedIso: startedIso,
      procedureCode: "72148",
      conclusionExcerpt: "No acute abnormality. Examination within normal limits.",
    },
  ],
  labs: [],
  vitals: [],
  notes: [],
  codingContext: { activeIcd10: [], activeCpt: ["72148"] },
};

vi.mock("@/lib/aiie/scoring-engine", () => ({
  scoreOrder: vi.fn().mockResolvedValue(mockScore),
}));

vi.mock("@/lib/aiie/gold-card", () => ({
  computeGoldCardScore: vi.fn().mockResolvedValue({
    data: null,
    error: { code: "NO_INS_PROVIDER", message: "mock" },
  }),
}));

vi.mock("@/lib/aiie/oop-estimator", () => ({
  estimatePatientResponsibility: vi.fn().mockResolvedValue({
    data: {
      estimatedPatientResponsibility: 450,
      deductibleRemaining: 500,
      coinsurance: 0.2,
      copay: 0,
      inNetworkNegotiatedRate: 2200,
      confidence: 0.8,
      assumptions: ["Mock estimate for integration test"],
      alternativeSiteRecommended: false,
      goodFaithEstimateCompliant: true,
    },
    error: undefined,
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    data: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            gte: async () => ({ data: [], error: null }),
          }),
          in: () => ({
            gte: async () => ({ data: [], error: null }),
          }),
          limit: async () => ({ data: [], error: null }),
        }),
        insert: async () => ({ data: null, error: null }),
      }),
    },
    error: null,
  }),
}));

vi.mock("@/lib/server/aiie-audit-logger", () => ({
  buildAiieAuditEvent: vi.fn(),
  hashAuditIdentifier: vi.fn((v: string) => `hash-${v}`),
  logAiieAudit: vi.fn(),
}));

vi.mock("@/lib/ins/stat-events", () => ({
  logInsStatEvent: vi.fn(),
}));

vi.mock("@/lib/server/with-ins-api-logging", () => ({
  withInsApiLogging: <T extends (request: Request) => Promise<Response>>(handler: T) => handler,
}));

vi.mock("@/lib/fhir/client", () => {
  class MockFHIRClient {
    getPatientRecordSnapshot = getPatientRecordSnapshot;
    readServiceRequest = vi.fn().mockResolvedValue({ data: null });
  }
  return { FHIRClient: MockFHIRClient };
});

function bundle<T extends { resourceType: string }>(resources: T[]): Bundle<T> {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map((resource) => ({ resource })),
  };
}

function coverageRequest(): CDSHookRequest {
  const patientId = "dup-test-patient";
  const srId = "dup-test-sr";

  const patient: Patient = {
    resourceType: "Patient",
    id: patientId,
    birthDate: "1978-05-12",
    gender: "male",
  };

  const practitioner: Practitioner = {
    resourceType: "Practitioner",
    id: "dup-test-practitioner",
    name: [{ text: "Dr. Test" }],
    identifier: [
      {
        system: "http://hl7.org/fhir/sid/us-npi",
        value: "1003000127",
      },
    ],
  };

  const coverage: Coverage = {
    resourceType: "Coverage",
    id: "dup-test-coverage",
    status: "active",
    beneficiary: { reference: `Patient/${patientId}` },
    payor: [{ reference: "Organization/aetna", display: "Aetna" }],
    costToBeneficiary: [
      {
        type: { text: "Deductible remaining" },
        valueMoney: { value: 500, currency: "USD" },
      },
      {
        type: { text: "Coinsurance" },
        valueQuantity: { value: 20, unit: "%" },
      },
    ],
  };

  const serviceRequest: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: srId,
    intent: "order",
    status: "active",
    priority: "routine",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/service-request-category",
            code: "imaging",
            display: "Imaging",
          },
        ],
      },
    ],
    subject: { reference: `Patient/${patientId}` },
    code: {
      coding: [
        {
          system: "http://www.ama-assn.org/go/cpt",
          code: "72148",
          display: "MRI lumbar spine",
        },
      ],
      text: "MRI lumbar spine",
    },
    bodySite: [{ text: "lumbar spine" }],
    reasonCode: [{ text: "Lumbar radiculopathy" }],
  };

  return {
    hook: "order-select",
    hookInstance: randomUUID(),
    fhirServer: "https://sandbox.example/fhir",
    context: {
      patientId: `Patient/${patientId}`,
      userId: `Practitioner/${practitioner.id}`,
      selections: [`ServiceRequest/${srId}`],
    },
    prefetch: {
      patient,
      practitioner,
      coverage: bundle([coverage]),
      serviceRequest: bundle([serviceRequest]),
      organization: {
        resourceType: "Bundle",
        type: "searchset",
        entry: [
          {
            resource: {
              resourceType: "Organization",
              id: "org-aetna",
              name: "Aetna",
            },
          },
        ],
      },
      insurancePlan: {
        resourceType: "InsurancePlan",
        id: "aetna",
        name: "Aetna Commercial",
        status: "active",
      },
    },
  };
}

describe("arka-ins-coverage duplicate-order CDS card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPatientRecordSnapshot.mockReset();
    getPatientRecordSnapshot.mockResolvedValue({ data: mockRecordSnapshot });
  });

  it("returns duplicate-order card when prior same-CPT study is within 30 days", async () => {
    const { POST } = await import("@/app/api/cds-services/arka-ins-coverage/route");

    const req = new Request("http://localhost/api/cds-services/arka-ins-coverage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coverageRequest()),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { cards: { uuid?: string; indicator?: string }[] };
    const dup = body.cards.find((c) => c.uuid === "arka-ins-duplicate-order");

    expect(dup).toBeDefined();
    expect(dup?.indicator).toBe("critical");
    expect(getPatientRecordSnapshot).toHaveBeenCalled();
  });
});
