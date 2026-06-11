import { getCaseById } from "@/lib/demos/ed";
import type { Case } from "@/lib/demos/ed/types";

/** ESI-style acuity tier (1 = most urgent). */
export type EdEsiLevel = 1 | 2 | 3 | 4 | 5;

export interface EdCockpitCaseMeta {
  caseId: string;
  esiLevel: EdEsiLevel;
  /** Minutes since ED arrival for live ticker. */
  arrivalMinutesAgo: number;
  /** Proposed imaging option id from imaging-options.ts */
  proposedImagingId: string;
}

/**
 * Five incoming ED cases — one per chief-complaint category file.
 */
export const ED_COCKPIT_CASE_META: EdCockpitCaseMeta[] = [
  {
    caseId: "chest-pain-aortic-dissection",
    esiLevel: 1,
    arrivalMinutesAgo: 8,
    proposedImagingId: "cta-chest-pe",
  },
  {
    caseId: "headache-chronic-daily",
    esiLevel: 4,
    arrivalMinutesAgo: 95,
    proposedImagingId: "ct-head-nc",
  },
  {
    caseId: "abd-pain-appendicitis",
    esiLevel: 2,
    arrivalMinutesAgo: 42,
    proposedImagingId: "ct-abd-pelvis-c",
  },
  {
    caseId: "lbp-acute-mechanical",
    esiLevel: 4,
    arrivalMinutesAgo: 118,
    proposedImagingId: "mri-lumbar-nc",
  },
  {
    caseId: "trauma-ankle-ottawa-positive",
    esiLevel: 3,
    arrivalMinutesAgo: 23,
    proposedImagingId: "xray-ankle",
  },
];

export interface EdCockpitCase extends EdCockpitCaseMeta {
  case: Case;
}

/**
 * Resolves cockpit metadata to full case records.
 */
export function getEdCockpitCases(): EdCockpitCase[] {
  return ED_COCKPIT_CASE_META.map((meta) => {
    const caseData = getCaseById(meta.caseId);
    if (!caseData) {
      throw new Error(`ED cockpit case not found: ${meta.caseId}`);
    }
    return { ...meta, case: caseData };
  });
}
