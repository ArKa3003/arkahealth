import { createHash } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { normalizeRecord } from "@/lib/fhir/record-normalizer";
import { scrubPhiText } from "@/lib/fhir/phi-scrub";
import { hashPatientId, scrapePatientRecord } from "@/lib/fhir/record-scraper";

const mockRequest = vi.fn();
const mockFrom = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    data: {
      from: mockFrom,
    },
    error: null,
  }),
}));

function buildMockClient() {
  return { request: mockRequest };
}

function patientHash(id: string): string {
  return hashPatientId(id);
}

const happyPathBundle = {
  resourceType: "Bundle",
  type: "searchset",
  entry: [
    {
      resource: {
        resourceType: "Condition",
        id: "c1",
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: "M54.5",
              display: "Low back pain",
            },
          ],
        },
        clinicalStatus: { coding: [{ code: "active" }] },
      },
    },
    {
      resource: {
        resourceType: "Condition",
        id: "c2",
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: "G89.29",
              display: "Chronic pain",
            },
          ],
        },
      },
    },
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "m1",
        status: "active",
        medicationCodeableConcept: {
          coding: [{ code: "198440", display: "Acetaminophen 500 MG" }],
        },
      },
    },
    {
      resource: {
        resourceType: "ImagingStudy",
        id: "img1",
        started: "2026-01-15T10:00:00Z",
        modality: [{ code: "MR", display: "MRI" }],
        description: "Lumbar spine MRI",
      },
    },
  ],
};

describe("record-scraper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest.mockReset();
    mockFrom.mockReset();
    mockUpsert.mockReset();

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gt: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      upsert: mockUpsert.mockResolvedValue({ error: null }),
    });
  });

  it("happy path: normalizes bundle with conditions, medication, and imaging", async () => {
    mockRequest.mockResolvedValue(happyPathBundle);

    const capturedAtIso = "2026-05-20T12:00:00.000Z";
    const snapshot = normalizeRecord({
      patientHash: patientHash("patient-1"),
      capturedAtIso,
      ttlSeconds: 1800,
      resources: happyPathBundle.entry.map((e) => e.resource),
    });

    expect(snapshot.problems).toHaveLength(2);
    expect(snapshot.problems[0]?.icd10).toBe("M54.5");
    expect(snapshot.medications).toHaveLength(1);
    expect(snapshot.priorImaging).toHaveLength(1);
    expect(snapshot.priorImaging[0]?.modality).toContain("MRI");
    expect(snapshot.codingContext.activeIcd10).toContain("M54.5");
    expect(snapshot.patientHash).toBe(patientHash("patient-1"));
  });

  it("cache hit: second scrape returns cached snapshot without FHIR calls", async () => {
    const cachedSnapshot = normalizeRecord({
      patientHash: patientHash("cached-patient"),
      capturedAtIso: new Date().toISOString(),
      ttlSeconds: 1800,
      resources: happyPathBundle.entry.map((e) => e.resource),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gt: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
          upsert: mockUpsert.mockResolvedValue({ error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ snapshot: cachedSnapshot }],
                error: null,
              }),
            }),
          }),
        }),
        upsert: mockUpsert,
      };
    });

    mockRequest.mockResolvedValue(happyPathBundle);

    const client = buildMockClient();
    const first = await scrapePatientRecord({
      patientId: "cached-patient",
      fhirClient: client as never,
    });
    expect(first.error).toBeNull();
    expect(first.data?.problems).toHaveLength(2);
    expect(mockRequest).toHaveBeenCalled();

    mockRequest.mockClear();

    const second = await scrapePatientRecord({
      patientId: "cached-patient",
      fhirClient: client as never,
    });
    expect(second.error).toBeNull();
    expect(second.data).toEqual(cachedSnapshot);
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("PHI scrub: SSN pattern is redacted in note text", () => {
    const scrubbed = scrubPhiText("Patient note. SSN 123-45-6789 for verification.");
    expect(scrubbed).not.toContain("123-45-6789");
    expect(scrubbed).toContain("[REDACTED-SSN]");

    const snapshot = normalizeRecord({
      patientHash: createHash("sha256").update("p", "utf8").digest("hex"),
      capturedAtIso: new Date().toISOString(),
      ttlSeconds: 1800,
      resources: [
        {
          resourceType: "DocumentReference",
          id: "doc1",
          description: "Discharge summary. SSN 123-45-6789 on file.",
          context: { period: { start: "2026-03-01" } },
          type: { coding: [{ system: "http://loinc.org", code: "18842-5" }] },
        },
      ],
    });

    expect(snapshot.notes[0]?.description).not.toContain("123-45-6789");
    expect(snapshot.notes[0]?.description).toContain("[REDACTED-SSN]");
  });

  it("empty patient: returns empty arrays, never null data", async () => {
    mockRequest.mockResolvedValue({ resourceType: "Bundle", type: "searchset", entry: [] });

    const result = await scrapePatientRecord({
      patientId: "empty-patient",
      fhirClient: buildMockClient() as never,
    });

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.problems).toEqual([]);
    expect(result.data?.medications).toEqual([]);
    expect(result.data?.priorImaging).toEqual([]);
    expect(result.data?.notes).toEqual([]);
  });
});
