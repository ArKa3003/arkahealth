/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

import { PriorImagingControlSheet } from "@/components/shared/PriorImagingControlSheet";
import type { AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

vi.mock("@/lib/aiie/control-sheet-rows", () => ({
  buildPriorImagingControlSheetRows: vi.fn(),
}));

vi.mock("@/lib/aiie/redundancy", () => ({
  evaluateRedundancy: vi.fn(),
}));

import { buildPriorImagingControlSheetRows } from "@/lib/aiie/control-sheet-rows";
import { evaluateRedundancy } from "@/lib/aiie/redundancy";

const mockBuildRows = vi.mocked(buildPriorImagingControlSheetRows);
const mockEvaluate = vi.mocked(evaluateRedundancy);

const proposed: AIIEOrder = {
  cpt: "72148",
  modality: "MRI",
  bodyPart: "lumbar spine",
  procedure: "MRI lumbar spine",
};

const emptySnapshot: PatientRecordSnapshot = {
  patientHash: "abc",
  capturedAtIso: "2026-05-20T12:00:00.000Z",
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
};

const populatedSnapshot: PatientRecordSnapshot = {
  ...emptySnapshot,
  priorImaging: [
    {
      id: "img-1",
      startedIso: "2026-05-01T10:00:00Z",
      modality: ["MRI"],
      bodySite: "lumbar spine",
      description: "MRI lumbar spine",
    },
  ],
};

describe("PriorImagingControlSheet", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvaluate.mockReturnValue({
      severity: "none",
      reason: "No overlap",
      sameCpt: false,
      sameRegionDifferentModality: false,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "PROCEED",
    });
  });

  it("renders zero-state when priorImaging is empty", () => {
    render(
      <PriorImagingControlSheet
        snapshot={emptySnapshot}
        proposed={proposed}
        onOverride={vi.fn()}
      />,
    );

    expect(screen.getByText(/No prior imaging studies were found/i)).toBeInTheDocument();
    expect(screen.getByText(/Last export:/i)).toBeInTheDocument();
  });

  it("highlights rows when redundancy returns high", () => {
    mockBuildRows.mockReturnValue([
      {
        study: populatedSnapshot.priorImaging[0]!,
        dateIso: "2026-05-01T10:00:00Z",
        modalityLabel: "MRI",
        region: "lumbar spine",
        cpt: "72148",
        indicationSummary: "MRI lumbar spine",
        impression: "normal",
        reportId: "dr-1",
        reportExcerpt: "Normal",
        redundancy: {
          severity: "high",
          reason: "Potential duplicate",
          sameCpt: true,
          sameRegionDifferentModality: false,
          priorNormalWithoutRedFlags: false,
          suggestedAction: "BLOCK_SOFT",
        },
      },
    ]);

    const { container } = render(
      <PriorImagingControlSheet
        snapshot={populatedSnapshot}
        proposed={proposed}
        onOverride={vi.fn()}
      />,
    );

    const highlighted = container.querySelector(".border-l-red-500");
    expect(highlighted).toBeTruthy();
  });

  it("calls onOverride with the textarea value when the override button is clicked", () => {
    mockBuildRows.mockReturnValue([
      {
        study: populatedSnapshot.priorImaging[0]!,
        dateIso: "2026-05-01T10:00:00Z",
        modalityLabel: "MRI",
        region: "lumbar spine",
        cpt: "72148",
        indicationSummary: "MRI lumbar spine",
        impression: "normal",
        redundancy: {
          severity: "high",
          reason: "Duplicate",
          sameCpt: true,
          sameRegionDifferentModality: false,
          priorNormalWithoutRedFlags: false,
          suggestedAction: "BLOCK_SOFT",
        },
      },
    ]);
    mockEvaluate.mockReturnValue({
      severity: "high",
      reason: "Duplicate",
      sameCpt: true,
      sameRegionDifferentModality: false,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "BLOCK_SOFT",
    });

    const onOverride = vi.fn();
    render(
      <PriorImagingControlSheet
        snapshot={populatedSnapshot}
        proposed={proposed}
        onOverride={onOverride}
      />,
    );

    const textarea = screen.getByLabelText(/Override rationale/i);
    fireEvent.change(textarea, { target: { value: "Clinical progression warrants repeat MRI" } });
    fireEvent.click(screen.getByRole("button", { name: /Proceed with documented override/i }));

    expect(onOverride).toHaveBeenCalledWith("Clinical progression warrants repeat MRI");
  });
});
