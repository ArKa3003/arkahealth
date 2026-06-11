// @vitest-environment happy-dom
/**
 * Fixture-driven e2e for the embedded EHR rail (vitest + testing-library):
 * icon → expand → order card expand (narrative visible) → accept → FHIR
 * write-back payload assertion. All network I/O (SMART session, FHIR reads,
 * the ServiceRequest PUT, CDS feedback, and audit events) is mocked and
 * captured for assertion.
 */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EhrEmbedClient } from "@/components/ehr/EhrEmbedClient";
import { MATRIX_VERSION } from "@/lib/aiie/knowledge-matrix";
import type { FHIRServiceRequest } from "@/lib/cds-platform/fhir/resources";
import { ICD10_CM_SYSTEM, ARKA_MODALITY_SYSTEM } from "@/lib/ehr/writeback";
import { useEhrRailStore } from "@/lib/stores/ehr-rail-store";

import patientFixture from "@/sandbox-fixtures/ehr/patient.json";
import serviceRequestsFixture from "@/sandbox-fixtures/ehr/service-requests.json";

const FHIR_BASE = "https://fhir.example.test/r4";

interface CapturedRequest {
  url: string;
  method: string;
  body: unknown;
}

let captured: CapturedRequest[];

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function installFetchMock(): void {
  captured = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      captured.push({
        url,
        method,
        body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
      });

      if (url.includes("/api/ehr/session")) {
        return jsonResponse({
          data: {
            fhirBaseUrl: FHIR_BASE,
            accessToken: "test-access-token",
            patientId: "arka-ehr-demo-patient",
            encounterId: null,
            fhirUser: null,
            scope: "patient/ServiceRequest.read",
            expiresAt: Date.now() + 3_600_000,
          },
          error: null,
        });
      }
      if (url.startsWith(`${FHIR_BASE}/Patient/`)) {
        return jsonResponse(patientFixture);
      }
      if (url.startsWith(`${FHIR_BASE}/ServiceRequest?`)) {
        return jsonResponse(serviceRequestsFixture);
      }
      if (method === "PUT" && url.startsWith(`${FHIR_BASE}/ServiceRequest/`)) {
        return jsonResponse({ resourceType: "ServiceRequest" });
      }
      if (url.includes("/api/cds-services/feedback") || url.includes("/api/ehr/events")) {
        return jsonResponse({});
      }
      throw new Error(`Unmocked fetch: ${method} ${url}`);
    }),
  );
}

describe("EHR rail e2e — icon → expand → accept → write-back", () => {
  beforeEach(() => {
    installFetchMock();
    // Latch the one-time pulse so the rail stays in icon mode and the test
    // exercises the clinician-initiated icon → expand path explicitly.
    useEhrRailStore.setState({
      expanded: false,
      userInitiated: false,
      alertCount: 0,
      pulsing: false,
      pulsePlayed: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes the optimized ServiceRequest back on explicit accept", async () => {
    render(<EhrEmbedClient demoMode={false} />);

    // 1. Icon mode: the floating badge is present and shows the alert count
    //    (fixtures include a STAT order carrying the EXPEDITE signal).
    const icon = await screen.findByRole(
      "button",
      { name: /open arka imaging intelligence/i },
      { timeout: 5000 },
    );

    // 2. Clinician expands the rail.
    fireEvent.click(icon);
    expect(await screen.findByText("Maria Elena Rivera")).toBeInTheDocument();

    // 3. Expand the lumbar MRI order card.
    const orderToggle = await screen.findByRole("button", {
      name: /mri lumbar spine without contrast/i,
    });
    fireEvent.click(orderToggle);

    // The silently generated PA narrative is attached as a copyable block.
    expect(await screen.findByText(/PA narrative — auto-generated/i)).toBeInTheDocument();
    expect(screen.getByText(/MEDICAL NECESSITY STATEMENT/)).toBeInTheDocument();

    // 4. Explicit accept → write-back.
    const acceptButton = screen.getAllByRole("button", { name: /accept & write back/i })[0];
    fireEvent.click(acceptButton);

    await screen.findByText(/optimized order written back to the EHR/i);

    // 5. Write-back payload assertion (golden fields).
    const put = captured.find(
      (r) => r.method === "PUT" && r.url.startsWith(`${FHIR_BASE}/ServiceRequest/`),
    );
    expect(put).toBeDefined();
    expect(put!.url).toBe(`${FHIR_BASE}/ServiceRequest/arka-ehr-demo-sr-1`);

    const sent = put!.body as FHIRServiceRequest;
    expect(sent.id).toBe("arka-ehr-demo-sr-1");
    expect(sent.note?.at(-1)?.text).toBe(
      `Order optimized by AIIE v${MATRIX_VERSION} — clinician approved`,
    );
    expect(sent.supportingInfo?.at(-1)?.reference).toMatch(/\/evidence\/[a-z0-9-]+$/);
    const reasonCodings = (sent.reasonCode ?? []).flatMap((cc) => cc.coding ?? []);
    expect(reasonCodings.some((c) => c.system === ICD10_CM_SYSTEM)).toBe(true);
    const modalityCoding = (sent.code?.coding ?? []).find(
      (c) => c.system === ARKA_MODALITY_SYSTEM,
    );
    expect(modalityCoding?.code).toBe("mri");

    // 6. Audit trail: feedback + rail events fired with hashed patient id only.
    await waitFor(() => {
      const feedback = captured.find((r) => r.url.includes("/api/cds-services/feedback"));
      expect(feedback).toBeDefined();
      const feedbackBody = feedback!.body as {
        feedback: Array<{ card: string; outcome: string }>;
      };
      expect(feedbackBody.feedback[0]).toMatchObject({
        card: "arka-ehr-demo-sr-1",
        outcome: "accepted",
      });

      const eventPosts = captured
        .filter((r) => r.url.includes("/api/ehr/events") && r.method === "POST")
        .flatMap(
          (r) =>
            (r.body as { events: Array<{ eventType: string; patientHash: string }> }).events,
        );
      const types = eventPosts.map((e) => e.eventType);
      expect(types).toContain("rail_render");
      expect(types).toContain("card_view");
      expect(types).toContain("narrative_generated");
      expect(types).toContain("card_accept");
      expect(types).toContain("writeback_posted");
      for (const event of eventPosts) {
        expect(event.patientHash).toMatch(/^[a-f0-9]{64}$/);
        expect(JSON.stringify(event)).not.toContain("arka-ehr-demo-patient");
      }
    });
  });

  it("records an override without ever writing to the EHR", async () => {
    render(<EhrEmbedClient demoMode={false} />);

    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: /open arka imaging intelligence/i },
        { timeout: 5000 },
      ),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /ct head without contrast/i }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: /dismiss/i })[0]);

    expect(await screen.findByText(/recorded as overridden/i)).toBeInTheDocument();

    await waitFor(() => {
      const feedback = captured.find((r) => r.url.includes("/api/cds-services/feedback"));
      expect(feedback).toBeDefined();
      expect(
        (feedback!.body as { feedback: Array<{ outcome: string }> }).feedback[0].outcome,
      ).toBe("overridden");
    });

    // Overrides must never trigger a FHIR write.
    expect(captured.some((r) => r.method === "PUT")).toBe(false);
  });
});
