/**
 * End-to-end contract tests for the hardened CDS Hooks services (Prompt 3.5).
 *
 * Golden fixtures POSTed straight at the App Router handlers:
 *  1. valid order-select with a draft MRI lumbar + LBP reason code → full card contract
 *  2. missing prefetch → HTTP 200, empty cards (never a 5xx into the EHR)
 *  3. three draft orders → one independently scored card per order
 *  4. malformed requests (bad JSON, wrong hook, non-UUID hookInstance, missing context)
 *     → HTTP 200, empty cards + OperationOutcome-style extension
 *  5. CDS Hooks 2.0 §Feedback endpoint accepts accept/override outcomes
 */

import { describe, expect, it } from "vitest";

import { POST as clinOrderSelectPost } from "@/app/api/cds-services/arka-clin-appropriateness/route";
import { POST as clinOrderSignPost } from "@/app/api/cds-services/arka-clin-appropriateness-sign/route";
import { POST as feedbackPost } from "@/app/api/cds-services/feedback/route";
import { CDS_DURATION_HEADER } from "@/lib/cds-platform/cds-hooks/timing";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";

// -----------------------------------------------------------------------------
// Fixture builders
// -----------------------------------------------------------------------------

const HOOK_INSTANCE = "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea";
const ICD10_SYSTEM = "http://hl7.org/fhir/sid/icd-10-cm";
const CPT_SYSTEM = "http://www.ama-assn.org/go/cpt";

interface CardJson {
  uuid?: string;
  summary: string;
  detail?: string;
  indicator: "info" | "warning" | "critical";
  source: { label: string; url?: string };
  suggestions?: Array<{
    label: string;
    uuid?: string;
    isRecommended?: boolean;
    actions: Array<{ type: string; description?: string; resource?: Record<string, unknown> }>;
  }>;
  overrideReasons?: Array<{ code?: string; system?: string; display: string }>;
  links?: Array<{ label: string; url: string; type: string }>;
  medicalBasis?: {
    label: string;
    rationale: string;
    citationId: string;
    url: string;
    evidenceSlug?: string;
    matchTier?: string;
  };
}

interface ResponseJson {
  cards: CardJson[];
  extension?: Record<string, { resourceType: string; issue: Array<{ severity: string; code: string; diagnostics: string }> }>;
}

function bundle(resources: Array<Record<string, unknown>>): Record<string, unknown> {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map((resource) => ({ resource })),
  };
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function mriLumbarOrder(id = "sr-mri-lumbar"): Record<string, unknown> {
  return {
    resourceType: "ServiceRequest",
    id,
    status: "draft",
    intent: "order",
    subject: { reference: "Patient/pat-1" },
    code: {
      text: "MRI Lumbar Spine without contrast",
      coding: [{ system: CPT_SYSTEM, code: "72148", display: "MRI lumbar spine w/o contrast" }],
    },
    reasonCode: [
      {
        text: "Low back pain",
        coding: [{ system: ICD10_SYSTEM, code: "M54.5", display: "Low back pain" }],
      },
    ],
    authoredOn: isoDaysAgo(0),
    occurrenceDateTime: isoDaysAgo(-7),
  };
}

function ctHeadOrder(): Record<string, unknown> {
  return {
    resourceType: "ServiceRequest",
    id: "sr-ct-head",
    status: "draft",
    intent: "order",
    subject: { reference: "Patient/pat-1" },
    code: {
      text: "CT Head without contrast",
      coding: [{ system: CPT_SYSTEM, code: "70450", display: "CT head w/o contrast" }],
    },
    reasonCode: [
      { text: "Headache", coding: [{ system: ICD10_SYSTEM, code: "R51.9", display: "Headache" }] },
    ],
  };
}

function xrChestOrder(): Record<string, unknown> {
  return {
    resourceType: "ServiceRequest",
    id: "sr-xr-chest",
    status: "draft",
    intent: "order",
    subject: { reference: "Patient/pat-1" },
    code: {
      text: "X-ray Chest 2 views",
      coding: [{ system: CPT_SYSTEM, code: "71046", display: "Chest X-ray 2 views" }],
    },
    reasonCode: [
      { text: "Cough", coding: [{ system: ICD10_SYSTEM, code: "R05.9", display: "Cough" }] },
    ],
  };
}

function fullPrefetch(): Record<string, unknown> {
  return {
    patient: {
      resourceType: "Patient",
      id: "pat-1",
      birthDate: "1981-03-15",
      gender: "male",
    },
    activeConditions: bundle([
      {
        resourceType: "Condition",
        id: "cond-lbp",
        code: {
          text: "Low back pain",
          coding: [{ system: ICD10_SYSTEM, code: "M54.5", display: "Low back pain" }],
        },
        onsetDateTime: isoDaysAgo(21),
      },
    ]),
    recentImaging: bundle([]),
    relevantLabs: bundle([]),
    activeMedications: bundle([]),
    priorServiceRequests: bundle([]),
  };
}

function orderSelectRequest(
  orders: Array<Record<string, unknown>>,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    hook: "order-select",
    hookInstance: HOOK_INSTANCE,
    context: {
      userId: "Practitioner/pract-1",
      patientId: "pat-1",
      draftOrders: bundle(orders),
      selections: orders.map((o) => `ServiceRequest/${String(o.id)}`),
    },
    prefetch: fullPrefetch(),
    ...overrides,
  };
}

function post(handler: (req: Request) => Promise<Response>, body: unknown): Promise<Response> {
  return handler(
    new Request("http://localhost/api/cds-services/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function appropriatenessCards(json: ResponseJson): CardJson[] {
  return json.cards.filter((c) => /^AIIE [1-9]\/9 — /.test(c.summary));
}

// -----------------------------------------------------------------------------
// 1. Valid order-select: draft MRI lumbar + LBP reason code
// -----------------------------------------------------------------------------

describe("arka-clin-appropriateness — valid order-select (MRI lumbar + LBP)", () => {
  it("returns HTTP 200 with a full-contract appropriateness card", async () => {
    const res = await post(clinOrderSelectPost, orderSelectRequest([mriLumbarOrder()]));
    expect(res.status).toBe(200);

    const json = (await res.json()) as ResponseJson;
    const cards = appropriatenessCards(json);
    expect(cards.length).toBe(1);

    const card = cards[0];
    // Summary: <140 chars, carries the AIIE score.
    expect(card.summary.length).toBeLessThan(140);
    expect(card.summary).toMatch(/^AIIE [1-9]\/9 — /);

    // Indicator mapped from score (1–3 warning, 4–9 info; EXPEDITE critical).
    const score = Number(/^AIIE ([1-9])\/9/.exec(card.summary)?.[1]);
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(9);
    if (card.summary.includes("EXPEDITE")) {
      expect(card.indicator).toBe("critical");
    } else if (score <= 3) {
      expect(card.indicator).toBe("warning");
    } else {
      expect(card.indicator).toBe("info");
    }

    // Card identity + source.
    expect(card.uuid).toBeTruthy();
    expect(card.source.label).toContain("ARKA");

    // Detail ends with the mandated FDA Non-Device CDS sentence.
    expect(card.detail).toBeTruthy();
    expect(card.detail!.trimEnd().endsWith(FDA_NON_DEVICE_CDS_DISCLOSURE)).toBe(true);

    // Links follow the first-party evidence URL contract.
    expect(card.links?.length).toBeGreaterThanOrEqual(1);
    for (const link of card.links ?? []) {
      expect(link.type).toBe("absolute");
      expect(link.url).toMatch(/^https?:\/\/.+\/evidence\/[a-z0-9-]+$/);
    }

    // Medical basis resolved through the Knowledge Matrix (no dead-end).
    expect(card.medicalBasis).toBeTruthy();
    expect(card.medicalBasis!.citationId).toMatch(/^matrix:[a-z0-9-]+$/);
    expect(card.medicalBasis!.evidenceSlug).toMatch(/^[a-z0-9-]+$/);
    expect(card.medicalBasis!.rationale.length).toBeGreaterThanOrEqual(40);
    expect(card.detail).toContain(card.medicalBasis!.label);

    // Warning cards require a dismissal reason and ship a concrete alternative order.
    if (card.indicator === "warning") {
      expect(card.overrideReasons?.length).toBeGreaterThan(0);
      for (const reason of card.overrideReasons ?? []) {
        expect(reason.code).toBeTruthy();
        expect(reason.display).toBeTruthy();
      }
      if (card.suggestions?.length) {
        const action = card.suggestions[0].actions[0];
        expect(action.type).toBe("create");
        expect(action.resource?.resourceType).toBe("ServiceRequest");
        expect((action.resource?.subject as { reference?: string })?.reference).toBe(
          "Patient/pat-1",
        );
      }
    }
  });

  it("stamps the p95 timing header and stays inside the budget when warm", async () => {
    // Warm-up call (module init + matrix load) then measure.
    await post(clinOrderSelectPost, orderSelectRequest([mriLumbarOrder()]));
    const started = performance.now();
    const res = await post(clinOrderSelectPost, orderSelectRequest([mriLumbarOrder()]));
    const elapsed = performance.now() - started;

    expect(res.status).toBe(200);
    expect(res.headers.get(CDS_DURATION_HEADER)).toMatch(/^\d+$/);
    expect(elapsed).toBeLessThan(800);
  });
});

// -----------------------------------------------------------------------------
// 2. Missing prefetch
// -----------------------------------------------------------------------------

describe("arka-clin-appropriateness — missing prefetch", () => {
  it("returns HTTP 200 with empty cards (no 5xx into the EHR)", async () => {
    const body = orderSelectRequest([mriLumbarOrder()], { prefetch: undefined });
    delete (body as { prefetch?: unknown }).prefetch;

    const res = await post(clinOrderSelectPost, body);
    expect(res.status).toBe(200);

    const json = (await res.json()) as ResponseJson;
    expect(json.cards).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// 3. Three draft orders → one card per order
// -----------------------------------------------------------------------------

describe("arka-clin-appropriateness — three draft orders", () => {
  it("scores each draft order independently and returns one card per order", async () => {
    const res = await post(
      clinOrderSelectPost,
      orderSelectRequest([mriLumbarOrder(), ctHeadOrder(), xrChestOrder()]),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as ResponseJson;
    const cards = appropriatenessCards(json);
    expect(cards.length).toBe(3);

    const uuids = new Set(cards.map((c) => c.uuid));
    expect(uuids.size).toBe(3);

    for (const card of cards) {
      expect(card.summary.length).toBeLessThan(140);
      expect(card.detail!.trimEnd().endsWith(FDA_NON_DEVICE_CDS_DISCLOSURE)).toBe(true);
      expect(card.medicalBasis?.citationId).toMatch(/^matrix:[a-z0-9-]+$/);
    }
  });
});

// -----------------------------------------------------------------------------
// 4. Malformed requests → HTTP 200 + OperationOutcome-style extension
// -----------------------------------------------------------------------------

describe("CDS services — malformed requests never 4xx/5xx", () => {
  function expectOperationOutcome(json: ResponseJson): void {
    expect(json.cards).toEqual([]);
    const outcome = json.extension?.["arka-operation-outcome"];
    expect(outcome?.resourceType).toBe("OperationOutcome");
    expect(outcome?.issue.length).toBeGreaterThan(0);
    for (const issue of outcome?.issue ?? []) {
      expect(issue.severity).toBe("error");
      expect(issue.code).toBe("invalid");
      expect(issue.diagnostics).toBeTruthy();
    }
  }

  it("handles a non-JSON body", async () => {
    const res = await post(clinOrderSelectPost, "this is }{ not json");
    expect(res.status).toBe(200);
    expectOperationOutcome((await res.json()) as ResponseJson);
  });

  it("rejects the wrong hook for the service", async () => {
    const res = await post(
      clinOrderSelectPost,
      orderSelectRequest([mriLumbarOrder()], { hook: "order-sign" }),
    );
    expect(res.status).toBe(200);
    expectOperationOutcome((await res.json()) as ResponseJson);
  });

  it("rejects a non-UUID hookInstance", async () => {
    const res = await post(
      clinOrderSelectPost,
      orderSelectRequest([mriLumbarOrder()], { hookInstance: "not-a-uuid" }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as ResponseJson;
    expectOperationOutcome(json);
    const diagnostics = json.extension!["arka-operation-outcome"].issue
      .map((i) => i.diagnostics)
      .join(" ");
    expect(diagnostics).toContain("hookInstance");
  });

  it("rejects a context with no draftOrders", async () => {
    const res = await post(clinOrderSelectPost, {
      hook: "order-select",
      hookInstance: HOOK_INSTANCE,
      context: { userId: "Practitioner/pract-1", patientId: "pat-1" },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as ResponseJson;
    expectOperationOutcome(json);
    const diagnostics = json.extension!["arka-operation-outcome"].issue
      .map((i) => i.diagnostics)
      .join(" ");
    expect(diagnostics).toContain("draftOrders");
  });

  it("hardens the order-sign service the same way", async () => {
    const res = await post(clinOrderSignPost, "{{{");
    expect(res.status).toBe(200);
    expectOperationOutcome((await res.json()) as ResponseJson);
  });
});

// -----------------------------------------------------------------------------
// 5. CDS Hooks 2.0 §Feedback endpoint
// -----------------------------------------------------------------------------

describe("cds-services/feedback — CDS Hooks 2.0 §Feedback", () => {
  it("accepts a card-accepted outcome", async () => {
    const res = await post(feedbackPost, {
      hookInstance: HOOK_INSTANCE,
      serviceId: "arka-clin-appropriateness",
      feedback: [
        {
          card: "7a9e1c0e-2f4b-4c39-9d1e-1b2c3d4e5f60",
          outcome: "accepted",
          acceptedSuggestions: [{ id: "suggestion-1" }],
          outcomeTimestamp: new Date().toISOString(),
        },
      ],
    });
    expect(res.status).toBe(200);
  });

  it("accepts an overridden outcome with a reason coding", async () => {
    const res = await post(feedbackPost, {
      hookInstance: HOOK_INSTANCE,
      serviceId: "arka-clin-appropriateness",
      feedback: [
        {
          card: "7a9e1c0e-2f4b-4c39-9d1e-1b2c3d4e5f60",
          outcome: "overridden",
          overrideReason: {
            reason: {
              code: "clinical-judgment",
              system: "https://arkahealth.com/fhir/CodeSystem/cds-override-reason",
            },
            userComment: "Patient has additional symptoms not in the chart.",
          },
          outcomeTimestamp: new Date().toISOString(),
        },
      ],
    });
    expect(res.status).toBe(200);
  });

  it("returns an OperationOutcome-style extension for invalid feedback", async () => {
    const res = await post(feedbackPost, { feedback: [{ card: "abc" }] });
    expect(res.status).toBe(200);
    const json = (await res.json()) as ResponseJson;
    expect(json.extension?.["arka-operation-outcome"]?.resourceType).toBe("OperationOutcome");
  });
});
