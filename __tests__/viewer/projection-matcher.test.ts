import { describe, it, expect } from "vitest";

import {
  matchProjections,
  PROJECTION_MATCH_MIN_SCORE,
} from "@/lib/viewer/projection-matcher";
import type { PriorImagingStudy } from "@/lib/types/record-snapshot";

const current: PriorImagingStudy = {
  id: "current",
  startedIso: "2026-05-20T10:00:00Z",
  modality: ["DX", "Radiograph"],
  bodySite: "Chest",
  view: "PA",
  laterality: undefined,
  description: "Chest PA",
};

const priorMatch: PriorImagingStudy = {
  id: "prior-1",
  startedIso: "2026-01-10T10:00:00Z",
  modality: ["DX"],
  bodySite: "Chest",
  view: "PA",
  description: "Chest PA prior",
};

const priorWeak: PriorImagingStudy = {
  id: "prior-2",
  startedIso: "2025-06-01T10:00:00Z",
  modality: ["CT"],
  bodySite: "Abdomen",
  view: "AXIAL",
};

describe("matchProjections", () => {
  it("returns matches at or above minimum score sorted by similarity", () => {
    const results = matchProjections(current, [current, priorMatch, priorWeak]);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.priorStudyId).toBe("prior-1");
    expect(results[0]?.similarityScore).toBeGreaterThanOrEqual(PROJECTION_MATCH_MIN_SCORE);
    for (const row of results) {
      expect(row.similarityScore).toBeGreaterThanOrEqual(PROJECTION_MATCH_MIN_SCORE);
    }
  });

  it("excludes the current study id", () => {
    const results = matchProjections(current, [current, priorMatch]);
    expect(results.every((r) => r.priorStudyId !== "current")).toBe(true);
  });
});
