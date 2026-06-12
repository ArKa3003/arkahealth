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

/** Additional scenarios for practice mode only (not shown in live queue). */
export const ED_PRACTICE_EXTRA_META: EdCockpitCaseMeta[] = [
  {
    caseId: "headache-thunderclap-sah",
    esiLevel: 1,
    arrivalMinutesAgo: 5,
    proposedImagingId: "ct-head-nc",
  },
  {
    caseId: "chest-pain-pe-suspected",
    esiLevel: 2,
    arrivalMinutesAgo: 31,
    proposedImagingId: "cta-chest-pe",
  },
  {
    caseId: "lbp-red-flags-neuro",
    esiLevel: 2,
    arrivalMinutesAgo: 54,
    proposedImagingId: "mri-lumbar-nc",
  },
];

function resolveEdCases(metaList: EdCockpitCaseMeta[]): EdCockpitCase[] {
  return metaList.map((meta) => {
    const caseData = getCaseById(meta.caseId);
    if (!caseData) {
      throw new Error(`ED cockpit case not found: ${meta.caseId}`);
    }
    return { ...meta, case: caseData };
  });
}

/**
 * Resolves cockpit metadata to full case records (live queue).
 */
export function getEdCockpitCases(): EdCockpitCase[] {
  return resolveEdCases(ED_COCKPIT_CASE_META);
}

/**
 * Full practice scenario bank — cockpit cases plus additional vignettes.
 */
export function getEdPracticeCases(): EdCockpitCase[] {
  return resolveEdCases([...ED_COCKPIT_CASE_META, ...ED_PRACTICE_EXTRA_META]);
}
