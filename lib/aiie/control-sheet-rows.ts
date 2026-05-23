import type { AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot, PriorImagingStudy } from "@/lib/types/record-snapshot";

import {
  evaluateStudyRedundancy,
  parseImpressionTag,
  type RedundancyAssessment,
} from "@/lib/aiie/redundancy";

/** Single row in the prior-imaging control sheet table. */
export interface PriorImagingControlSheetRow {
  study: PriorImagingStudy;
  dateIso?: string;
  modalityLabel: string;
  region: string;
  cpt?: string;
  indicationSummary: string;
  impression: ReturnType<typeof parseImpressionTag>;
  reportId?: string;
  reportExcerpt?: string;
  redundancy: RedundancyAssessment;
}

const INDICATION_MAX = 80;

/**
 * Builds control-sheet table rows from a record snapshot and proposed order.
 *
 * @param snapshot - Patient record snapshot (A.1).
 * @param proposed - Proposed imaging order.
 */
export function buildPriorImagingControlSheetRows(
  snapshot: PatientRecordSnapshot,
  proposed: AIIEOrder,
): PriorImagingControlSheetRow[] {
  return snapshot.priorImaging
    .map((study) => {
      const report = linkReport(study, snapshot);
      const impression = parseImpressionTag(report?.conclusionExcerpt);
      return {
        study,
        dateIso: study.startedIso,
        modalityLabel: study.modality.filter(Boolean).join(", ") || "—",
        region: study.bodySite ?? study.description ?? "—",
        cpt: report?.procedureCode,
        indicationSummary: truncateIndication(study.description ?? report?.category ?? "—"),
        impression,
        reportId: report?.id,
        reportExcerpt: report?.conclusionExcerpt,
        redundancy: evaluateStudyRedundancy(proposed, study, snapshot),
      };
    })
    .sort((a, b) => {
      const ta = a.dateIso ? Date.parse(a.dateIso) : 0;
      const tb = b.dateIso ? Date.parse(b.dateIso) : 0;
      return tb - ta;
    });
}

function linkReport(
  study: PriorImagingStudy,
  snapshot: PatientRecordSnapshot,
): (typeof snapshot.priorReports)[number] | undefined {
  if (!study.startedIso) {
    return snapshot.priorReports[0];
  }
  const studyTime = Date.parse(study.startedIso);
  if (!Number.isFinite(studyTime)) {
    return snapshot.priorReports[0];
  }
  let best: (typeof snapshot.priorReports)[number] | undefined;
  let bestDelta = Infinity;
  for (const report of snapshot.priorReports) {
    if (!report.issuedIso) {
      continue;
    }
    const issued = Date.parse(report.issuedIso);
    if (!Number.isFinite(issued)) {
      continue;
    }
    const delta = Math.abs(issued - studyTime);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = report;
    }
  }
  return best;
}

function truncateIndication(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= INDICATION_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, INDICATION_MAX - 1)}…`;
}
