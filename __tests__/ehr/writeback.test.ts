/**
 * Golden tests for the accepted-suggestion FHIR write-back payload
 * (lib/ehr/writeback.ts): corrected modality coding, reasonCode completed from
 * the matched scenario's ICD-10, supportingInfo evidence reference, and the
 * clinician-approved audit annotation — built from the sandbox EHR fixtures
 * through the real scoring pipeline.
 */

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { MATRIX_VERSION } from "@/lib/aiie/knowledge-matrix";
import { scoreOrder } from "@/lib/aiie/scoring-engine";
import type {
  FHIRBundle,
  FHIRPatient,
  FHIRServiceRequest,
} from "@/lib/cds-platform/fhir/resources";
import { mapServiceRequestBundle, type EhrImagingOrder } from "@/lib/ehr/order-mapper";
import {
  ARKA_MODALITY_SYSTEM,
  ICD10_CM_SYSTEM,
  buildWritebackServiceRequest,
  executeWriteback,
  writebackNoteText,
} from "@/lib/ehr/writeback";
import { evidenceUrl } from "@/lib/evidence/url";
import type { AIIEScore } from "@/lib/types/aiie";

import patientFixture from "@/sandbox-fixtures/ehr/patient.json";
import serviceRequestsFixture from "@/sandbox-fixtures/ehr/service-requests.json";

const patient = patientFixture as unknown as FHIRPatient;
const bundle = serviceRequestsFixture as unknown as FHIRBundle<FHIRServiceRequest>;

const ACCEPTED_AT = "2026-06-10T15:00:00.000Z";

let orders: EhrImagingOrder[];
let lumbarOrder: EhrImagingOrder;
let lumbarScore: AIIEScore;

beforeAll(async () => {
  orders = mapServiceRequestBundle(bundle, patient);
  lumbarOrder = orders.find((o) => o.id === "arka-ehr-demo-sr-1")!;
  lumbarScore = await scoreOrder(lumbarOrder.aiieInput);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildWritebackServiceRequest — golden payload (lumbar MRI fixture)", () => {
  it("constructs the full optimized ServiceRequest", () => {
    const built = buildWritebackServiceRequest({
      serviceRequest: lumbarOrder.serviceRequest,
      aiieInput: lumbarOrder.aiieInput,
      score: lumbarScore,
      acceptedAtISO: ACCEPTED_AT,
    });

    expect(built.error).toBeNull();
    const { resource, noteText, evidenceReference, icd10Added } = built.data!;

    // Golden: stable identity and audit fields.
    expect(resource).toMatchObject({
      resourceType: "ServiceRequest",
      id: "arka-ehr-demo-sr-1",
      status: "draft",
      intent: "order",
      subject: { reference: "Patient/arka-ehr-demo-patient" },
    });

    // Annotation: exact clinician-approved note with matrix version.
    expect(noteText).toBe(`Order optimized by AIIE v${MATRIX_VERSION} — clinician approved`);
    expect(noteText).toBe(writebackNoteText(MATRIX_VERSION));
    expect(resource.note).toEqual([
      { authorString: "ARKA AIIE", time: ACCEPTED_AT, text: noteText },
    ]);

    // Modality coding: original CPT coding retained + ARKA AIIE modality coding appended.
    const codings = resource.code?.coding ?? [];
    expect(codings).toContainEqual({
      system: "http://www.ama-assn.org/go/cpt",
      code: "72148",
      display: "MRI lumbar spine without contrast",
    });
    const arkaCoding = codings.find((c) => c.system === ARKA_MODALITY_SYSTEM);
    expect(arkaCoding).toBeDefined();
    expect(arkaCoding?.code).toBe("mri");
    expect(arkaCoding?.display).toBe("MRI");

    // reasonCode completed from the matched scenario's ICD-10 (lumbar spine: M54/M51/M48).
    expect(icd10Added).toMatch(/^M5|^M4/);
    const reasonCodings = (resource.reasonCode ?? []).flatMap((cc) => cc.coding ?? []);
    const icdCoding = reasonCodings.find((c) => c.system === ICD10_CM_SYSTEM);
    expect(icdCoding?.code).toBe(icd10Added);
    expect(icdCoding?.display).toBeTruthy();
    // Original free-text indication preserved.
    expect(resource.reasonCode?.[0]?.text).toContain("Low back pain");

    // supportingInfo references the first-party AIIE evidence URL.
    expect(lumbarScore.matrixMatch).toBeDefined();
    const expectedEvidence = evidenceUrl(lumbarScore.matrixMatch!.evidenceSlug);
    expect(evidenceReference).toBe(expectedEvidence);
    expect(expectedEvidence).toMatch(/\/evidence\/[a-z0-9-]+$/);
    expect(resource.supportingInfo).toContainEqual(
      expect.objectContaining({ reference: expectedEvidence }),
    );
  });

  it("never mutates the original ServiceRequest", () => {
    const original = JSON.parse(JSON.stringify(lumbarOrder.serviceRequest)) as FHIRServiceRequest;
    buildWritebackServiceRequest({
      serviceRequest: lumbarOrder.serviceRequest,
      aiieInput: lumbarOrder.aiieInput,
      score: lumbarScore,
      acceptedAtISO: ACCEPTED_AT,
    });
    expect(lumbarOrder.serviceRequest).toEqual(original);
  });

  it("is idempotent for the evidence reference (no duplicate supportingInfo)", () => {
    const first = buildWritebackServiceRequest({
      serviceRequest: lumbarOrder.serviceRequest,
      aiieInput: lumbarOrder.aiieInput,
      score: lumbarScore,
      acceptedAtISO: ACCEPTED_AT,
    });
    const second = buildWritebackServiceRequest({
      serviceRequest: first.data!.resource,
      aiieInput: lumbarOrder.aiieInput,
      score: lumbarScore,
      acceptedAtISO: ACCEPTED_AT,
    });
    const refs = (second.data!.resource.supportingInfo ?? []).filter(
      (r) => r.reference === first.data!.evidenceReference,
    );
    expect(refs).toHaveLength(1);
  });

  it("does not add a second ICD-10 coding when the order is already coded", () => {
    const precoded: FHIRServiceRequest = {
      ...lumbarOrder.serviceRequest,
      reasonCode: [
        {
          coding: [{ system: ICD10_CM_SYSTEM, code: "M54.16", display: "Radiculopathy, lumbar" }],
          text: "Lumbar radiculopathy",
        },
      ],
    };
    const built = buildWritebackServiceRequest({
      serviceRequest: precoded,
      aiieInput: lumbarOrder.aiieInput,
      score: lumbarScore,
      acceptedAtISO: ACCEPTED_AT,
    });
    expect(built.error).toBeNull();
    expect(built.data!.icd10Added).toBeNull();
    const icdCodings = (built.data!.resource.reasonCode ?? [])
      .flatMap((cc) => cc.coding ?? [])
      .filter((c) => c.system === ICD10_CM_SYSTEM);
    expect(icdCodings).toEqual([
      { system: ICD10_CM_SYSTEM, code: "M54.16", display: "Radiculopathy, lumbar" },
    ]);
  });

  it("returns missing_order_id when the ServiceRequest has no id", () => {
    const { id: _id, ...withoutId } = lumbarOrder.serviceRequest;
    const built = buildWritebackServiceRequest({
      serviceRequest: withoutId as FHIRServiceRequest,
      aiieInput: lumbarOrder.aiieInput,
      score: lumbarScore,
      acceptedAtISO: ACCEPTED_AT,
    });
    expect(built.data).toBeNull();
    expect(built.error?.code).toBe("missing_order_id");
  });

  it("returns no_matrix_match when the score carries no matrix provenance", () => {
    const scoreWithoutMatch: AIIEScore = { ...lumbarScore, matrixMatch: undefined };
    const built = buildWritebackServiceRequest({
      serviceRequest: lumbarOrder.serviceRequest,
      aiieInput: lumbarOrder.aiieInput,
      score: scoreWithoutMatch,
      acceptedAtISO: ACCEPTED_AT,
    });
    expect(built.data).toBeNull();
    expect(built.error?.code).toBe("no_matrix_match");
  });
});

describe("executeWriteback", () => {
  it("PUTs the resource to the FHIR server with the SMART token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const built = buildWritebackServiceRequest({
      serviceRequest: lumbarOrder.serviceRequest,
      aiieInput: lumbarOrder.aiieInput,
      score: lumbarScore,
      acceptedAtISO: ACCEPTED_AT,
    });
    const result = await executeWriteback(
      { fhirBaseUrl: "https://fhir.example.test/r4/", accessToken: "tok-123" },
      built.data!.resource,
    );

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://fhir.example.test/r4/ServiceRequest/arka-ehr-demo-sr-1");
    expect(init.method).toBe("PUT");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-123");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/fhir+json",
    );
    const sent = JSON.parse(init.body as string) as FHIRServiceRequest;
    expect(sent.note?.[0]?.text).toBe(writebackNoteText(MATRIX_VERSION));
  });

  it("returns a tuple error on non-2xx responses (never throws)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 403 })));
    const result = await executeWriteback(
      { fhirBaseUrl: "https://fhir.example.test/r4", accessToken: "tok" },
      lumbarOrder.serviceRequest,
    );
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe("writeback_http");
  });
});
