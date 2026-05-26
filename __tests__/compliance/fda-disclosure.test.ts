import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildDuplicateOrderCard } from "@/lib/cards/duplicate-order-card";
import { buildOveruseCard } from "@/lib/cards/overuse-soft-block-card";
import { buildStatReclassCard } from "@/lib/cards/stat-reclass-card";
import { appendFdaDetailDisclaimer } from "@/lib/cards/card-shared";
import {
  detailIncludesFdaDisclosure,
  FDA_DISCLOSURE_MARKERS,
  FDA_NON_DEVICE_CDS_DISCLOSURE,
} from "@/lib/compliance/fda-disclosure";
import { evaluateStat } from "@/lib/aiie/stat-gate";
import type { RedundancyAssessment } from "@/lib/aiie/redundancy";
import { OVERUSE_RULES } from "@/lib/aiie/overuse-patterns";
import type { ServiceRequest } from "@/lib/types/fhir";

const CARDS_DIR = join(process.cwd(), "lib", "cards");

describe("FDA non-device CDS disclosure", () => {
  it("exports the canonical sentence used in CI grep", () => {
    expect(FDA_NON_DEVICE_CDS_DISCLOSURE).toContain("Non-Device Clinical Decision Support");
    expect(FDA_NON_DEVICE_CDS_DISCLOSURE).toContain("FD&C Act");
    expect(FDA_NON_DEVICE_CDS_DISCLOSURE).toContain(
      "clinician is responsible for the final decision",
    );
  });

  it("appendFdaDetailDisclaimer includes canonical copy", () => {
    const detail = appendFdaDetailDisclaimer("Clinical summary.");
    expect(detailIncludesFdaDisclosure(detail)).toBe(true);
    for (const marker of FDA_DISCLOSURE_MARKERS) {
      expect(detail).toContain(marker);
    }
  });

  it("every lib/cards builder appends disclosure on detail", () => {
    const statGate = evaluateStat({
      snapshot: {
        patientHash: "h",
        capturedAtIso: new Date().toISOString(),
        ttlSeconds: 1800,
        problems: [],
        medications: [],
        allergies: [],
        encounters: [],
        priorImaging: [],
        priorReports: [],
        labs: [],
        vitals: [],
        notes: [],
        codingContext: { activeIcd10: [], activeCpt: [] },
      },
      order: { modality: "CT", procedure: "CT head", bodyPart: "head" },
      complaint: "headache",
      priority: "stat",
      patientAgeYears: 45,
    });
    const sr: ServiceRequest = {
      resourceType: "ServiceRequest",
      id: "sr-stat",
      intent: "order",
      priority: "stat",
      subject: { reference: "Patient/p1" },
    };
    const statCard = buildStatReclassCard({ gate: statGate, serviceRequest: sr });
    expect(detailIncludesFdaDisclosure(statCard.detail)).toBe(true);

    const redundancy: RedundancyAssessment = {
      severity: "high",
      reason: "Duplicate study.",
      priorStudyId: "img-1",
      daysSincePrior: 5,
      sameCpt: true,
      sameRegionDifferentModality: false,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "BLOCK_SOFT",
    };
    expect(detailIncludesFdaDisclosure(buildDuplicateOrderCard(redundancy).detail)).toBe(true);

    const rule = OVERUSE_RULES[0];
    expect(
      detailIncludesFdaDisclosure(
        buildOveruseCard(rule, { order: { modality: "MRI", procedure: "MRI lumbar", bodyPart: "lumbar" } })
          .detail,
      ),
    ).toBe(true);
  });

  it("lib/cards/*.ts sources reference appendFdaDetailDisclaimer or canonical sentence", () => {
    const files = readdirSync(CARDS_DIR).filter((f) => f.endsWith(".ts") && f !== "card-shared.ts");
    for (const file of files) {
      const src = readFileSync(join(CARDS_DIR, file), "utf8");
      const hasFooter =
        src.includes("appendFdaDetailDisclaimer") ||
        src.includes("FDA_NON_DEVICE_CDS_DISCLOSURE") ||
        src.includes(FDA_NON_DEVICE_CDS_DISCLOSURE);
      expect(hasFooter, `${file} must use shared FDA footer helper`).toBe(true);
    }
  });
});
