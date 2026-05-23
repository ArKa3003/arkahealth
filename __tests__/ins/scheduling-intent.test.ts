import { createHash } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  appointmentMatchesIntent,
  captureIntent,
  markBreached,
  reconcileIntents,
  schedulingSlaExpiresAt,
} from "@/lib/ins/scheduling-intent";
import { hashAuditIdentifier } from "@/lib/server/aiie-audit-logger";
import type { AiieAuditEvent } from "@/lib/server/aiie-audit-logger";
import type { Appointment } from "@/lib/types/fhir";

const mockUpsert = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSearchAppointments = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    data: { from: mockFrom },
    error: null,
  }),
}));

vi.mock("@/lib/fhir/client", () => ({
  FHIRClient: class MockFhirClient {
    searchAppointments = mockSearchAppointments;
  },
}));

function hashId(value: string): string {
  return createHash("sha256").update(value.trim(), "utf8").digest("hex");
}

function baseAuditEvent(overrides: Partial<AiieAuditEvent> = {}): AiieAuditEvent {
  return {
    orderHash: hashId("order-abc"),
    patientHash: hashId("Patient/p1"),
    icd10: ["M54.5"],
    cpt: "70553",
    clinicalScore: 72,
    denialRisk: 4,
    factorPayload: { confidence: 0.9, factors: [] },
    ...overrides,
  };
}

function chainOpenIntents(data: unknown) {
  mockSelect.mockReturnValue({
    in: vi.fn().mockResolvedValue({ data, error: null }),
    eq: mockEq,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ARKA_FHIR_BASE_URL = "https://fhir.example.org";
  process.env.ARKA_FHIR_RECONCILE_BEARER_TOKEN = "test-token";

  mockUpsert.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
  mockEq.mockReturnValue({ in: mockIn, maybeSingle: mockMaybeSingle });
  mockIn.mockResolvedValue({ error: null });
  mockMaybeSingle.mockResolvedValue({
    data: {
      id: "intent-1",
      order_hash: hashId("order-abc"),
      cpt: "70553",
      status: "pending",
    },
    error: null,
  });

  mockFrom.mockImplementation((table: string) => {
    if (table === "ins_scheduling_intent") {
      return {
        upsert: mockUpsert,
        select: mockSelect,
        update: mockUpdate,
        eq: mockEq,
      };
    }
    if (table === "ins_validation_events") {
      return { insert: mockInsert };
    }
    if (table === "ins_counters") {
      return { insert: mockInsert };
    }
    return {};
  });
});

describe("captureIntent", () => {
  it("writes exactly one row per order_hash (idempotent upsert)", async () => {
    const event = baseAuditEvent();
    await captureIntent(event);
    await captureIntent(event);

    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_hash: event.orderHash,
        patient_hash: event.patientHash,
        status: "pending",
        cpt: "70553",
      }),
      { onConflict: "order_hash", ignoreDuplicates: true },
    );
  });
});

describe("appointmentMatchesIntent", () => {
  it("matches ServiceRequest reason reference to order hash", () => {
    const orderId = "sr-99";
    const intent = {
      order_hash: hashAuditIdentifier(orderId),
      patient_hash: hashAuditIdentifier("Patient/p1"),
      cpt: "70553",
    };
    const appt: Appointment = {
      resourceType: "Appointment",
      id: "appt-1",
      status: "booked",
      participant: [{ actor: { reference: "Patient/p1" }, status: "accepted" }],
      reasonReference: [{ reference: `ServiceRequest/${orderId}` }],
      serviceType: [{ coding: [{ code: "70553" }] }],
    };
    expect(appointmentMatchesIntent(appt, intent)).toBe(true);
  });
});

describe("reconcileIntents", () => {
  it("flips status when a FHIR Appointment with matching service exists", async () => {
    const orderHash = hashId("order-abc");
    const patientHash = hashId("Patient/p1");

    const openIntents = [
      {
        id: "intent-1",
        order_hash: orderHash,
        patient_hash: patientHash,
        sla_expires_at: schedulingSlaExpiresAt(),
        status: "pending" as const,
        cpt: "70553",
      },
    ];

    chainOpenIntents(openIntents);

    mockSearchAppointments.mockResolvedValue({
      data: {
        resourceType: "Bundle",
        type: "searchset",
        entry: [
          {
            resource: {
              resourceType: "Appointment",
              id: "appt-42",
              status: "booked",
              participant: [{ actor: { reference: "Patient/p1" }, status: "accepted" }],
              reasonReference: [{ reference: "ServiceRequest/order-abc" }],
              serviceType: [{ coding: [{ code: "70553" }] }],
            } satisfies Appointment,
          },
        ],
      },
      error: undefined,
    });

    const result = await reconcileIntents();

    expect(result.scheduled).toBe(1);
    expect(result.breached).toBe(0);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("marks SLA expiry as breached and emits scheduling_intent_breach validation event", async () => {
    const pastSla = new Date(Date.now() - 60_000).toISOString();
    const openIntents = [
      {
        id: "intent-expired",
        order_hash: hashId("order-old"),
        patient_hash: hashId("Patient/p2"),
        sla_expires_at: pastSla,
        status: "pending" as const,
        cpt: "72148",
      },
    ];

    chainOpenIntents(openIntents);
    mockSearchAppointments.mockResolvedValue({ data: { resourceType: "Bundle", entry: [] }, error: undefined });

    mockFrom.mockImplementation((table: string) => {
      if (table === "ins_scheduling_intent") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: "intent-expired",
                    order_hash: hashId("order-old"),
                    cpt: "72148",
                    status: "pending",
                  },
                  error: null,
                }),
            }),
            in: () => Promise.resolve({ data: openIntents, error: null }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "ins_validation_events") {
        return { insert: mockInsert };
      }
      if (table === "ins_counters") {
        return { insert: mockInsert };
      }
      return {};
    });

    const result = await reconcileIntents();

    expect(result.breached).toBe(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "scheduling_intent_breach",
        metadata: expect.objectContaining({
          order_hash: hashId("order-old"),
          cpt: "72148",
        }),
      }),
    );
  });
});

describe("markBreached", () => {
  it("is idempotent when already breached", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "intent-1",
        order_hash: hashId("order-abc"),
        cpt: "70553",
        status: "sla_breached",
      },
      error: null,
    });

    await markBreached("intent-1");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
