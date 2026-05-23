import { describe, expect, it } from "vitest";

import type { OrderLifecycleRow } from "@/lib/ins/order-lifecycle";

describe("OrderLifecycleRow", () => {
  it("uses hashed identifiers only in the public shape", () => {
    const row: OrderLifecycleRow = {
      orderHash: "a".repeat(64),
      patientHash: "b".repeat(64),
      cpt: "72148",
      clinicalScore: 72,
      mnaiTier: "moderate",
      auditAt: new Date().toISOString(),
      schedulingStatus: "pending",
      slaExpiresAt: new Date().toISOString(),
      coverageStatus: "verified",
      paStatus: "approved",
      paDecisionAt: new Date().toISOString(),
      estimatedPatientResponsibility: 240,
    };
    expect(row.orderHash).toMatch(/^[a-f0-9]{64}$/i);
    expect(row.patientHash).toMatch(/^[a-f0-9]{64}$/i);
    expect(JSON.stringify(row)).not.toMatch(/patient.*name|mrn|dob/i);
  });
});
