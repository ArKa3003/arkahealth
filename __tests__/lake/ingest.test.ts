import { describe, expect, it } from "vitest";

import { imagingLakeAgeBucket } from "@/lib/lake/age-bucket";
import {
  lakePatientHash,
  redactReportConclusion,
} from "@/lib/lake/ingest";
import { hashAuditIdentifier } from "@/lib/server/aiie-audit-logger";

describe("imagingLakeAgeBucket", () => {
  it("maps ages to governance buckets", () => {
    expect(imagingLakeAgeBucket(2)).toBe("0-4");
    expect(imagingLakeAgeBucket(12)).toBe("5-17");
    expect(imagingLakeAgeBucket(30)).toBe("18-44");
    expect(imagingLakeAgeBucket(55)).toBe("45-64");
    expect(imagingLakeAgeBucket(70)).toBe("65-84");
    expect(imagingLakeAgeBucket(90)).toBe("85+");
  });
});

describe("lakePatientHash", () => {
  it("re-hashes per institution so cross-site joins do not match", () => {
    const base = hashAuditIdentifier("Patient/demo-1");
    const siteA = lakePatientHash("site-a", base);
    const siteB = lakePatientHash("site-b", base);
    expect(siteA).not.toBe(siteB);
    expect(siteA).not.toBe(base);
    expect(siteA).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is stable for the same institution and audit hash", () => {
    const base = hashAuditIdentifier("Patient/demo-2");
    expect(lakePatientHash("demo-hospital", base)).toBe(
      lakePatientHash("demo-hospital", base),
    );
  });
});

describe("redactReportConclusion", () => {
  it("stores DOB-like patterns as year-only", () => {
    const out = redactReportConclusion("Impression stable. DOB 01/15/1990 noted in header.");
    expect(out).toContain("1990");
    expect(out).not.toContain("01/15");
    expect(out).not.toMatch(/\b01\/15\/1990\b/);
  });
});
