import type { AIIEOrder, AIIERedFlags } from "@/lib/types/aiie";
import type {
  PatientRecordSnapshot,
  PriorDiagnosticReport,
  PriorImagingStudy,
} from "@/lib/types/record-snapshot";

/** Severity tier for prior-imaging overlap with a proposed order. */
export type RedundancySeverity = "high" | "medium" | "low" | "none";

/** Clinician-facing action hint derived from redundancy severity. */
export type SuggestedAction = "BLOCK_SOFT" | "DISCUSS" | "PROCEED";

/**
 * Deterministic redundancy assessment for a proposed order against a record snapshot.
 * Consumed by the control sheet and append-only scoring deltas — does not replace
 * {@link computeSnapshotSignal} or scoring-engine weights.
 */
export interface RedundancyAssessment {
  severity: RedundancySeverity;
  reason: string;
  priorStudyId?: string;
  daysSincePrior?: number;
  sameCpt: boolean;
  sameRegionDifferentModality: boolean;
  priorNormalWithoutRedFlags: boolean;
  suggestedAction: SuggestedAction;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const SEVERITY_RANK: Record<RedundancySeverity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Append-only SHAP-style delta for `prior_imaging_redundancy` from a redundancy assessment.
 * Add to the existing factor contribution; never replace hook or snapshot signals.
 *
 * @param assessment - Output of {@link evaluateRedundancy}.
 */
export function redundancyFactorDelta(assessment: RedundancyAssessment): number {
  switch (assessment.severity) {
    case "high":
      return -0.35;
    case "medium":
      return -0.15;
    case "low":
      return -0.05;
    default:
      return 0;
  }
}

/**
 * Evaluates whether a proposed imaging order is redundant relative to prior studies in the snapshot.
 *
 * @param proposed - Ordered CPT, modality, and anatomic region.
 * @param snapshot - Normalized FHIR record snapshot from async scrape.
 * @param redFlags - Optional clinical red flags for the "prior normal without red flags" rule.
 */
export function evaluateRedundancy(
  proposed: AIIEOrder,
  snapshot: PatientRecordSnapshot,
  redFlags?: AIIERedFlags,
): RedundancyAssessment {
  const none: RedundancyAssessment = {
    severity: "none",
    reason: "No overlapping prior imaging identified for this order.",
    sameCpt: false,
    sameRegionDifferentModality: false,
    priorNormalWithoutRedFlags: false,
    suggestedAction: "PROCEED",
  };

  if (snapshot.priorImaging.length === 0) {
    return none;
  }

  let worst = none;
  const now = Date.now();

  for (const study of snapshot.priorImaging) {
    const report = findLinkedReport(study, snapshot.priorReports);
    const row = assessStudy(proposed, study, report, now, redFlags);
    if (SEVERITY_RANK[row.severity] > SEVERITY_RANK[worst.severity]) {
      worst = row;
    }
  }

  return worst;
}

/**
 * Per-row redundancy for table highlighting.
 *
 * @param proposed - Proposed order.
 * @param study - Single prior imaging study row.
 * @param snapshot - Full patient snapshot (for linked report lookup).
 * @param redFlags - Optional clinical red flags.
 */
export function evaluateStudyRedundancy(
  proposed: AIIEOrder,
  study: PriorImagingStudy,
  snapshot: PatientRecordSnapshot,
  redFlags?: AIIERedFlags,
): RedundancyAssessment {
  const report = findLinkedReport(study, snapshot.priorReports);
  return assessStudy(proposed, study, report, Date.now(), redFlags);
}

function assessStudy(
  proposed: AIIEOrder,
  study: PriorImagingStudy,
  report: PriorDiagnosticReport | undefined,
  now: number,
  redFlags?: AIIERedFlags,
): RedundancyAssessment {
  const days = daysSinceStudy(study.startedIso, now);
  const priorCpt = report?.procedureCode;
  const proposedCpt = normalizeCpt(proposed.cpt);
  const sameCpt =
    Boolean(proposedCpt && priorCpt && normalizeCpt(priorCpt) === proposedCpt) ||
    cptMatchFromDescription(proposedCpt, study.description, report?.conclusionExcerpt);

  const proposedRegion = normalizeRegion(proposed.bodyPart ?? proposed.procedure);
  const priorRegion = normalizeRegion(study.bodySite ?? study.description ?? "");
  const sameRegion =
    proposedRegion.length > 0 &&
    priorRegion.length > 0 &&
    (proposedRegion === priorRegion ||
      proposedRegion.includes(priorRegion) ||
      priorRegion.includes(proposedRegion));

  const proposedMod = normalizeModality(proposed.modality);
  const priorMod = normalizeModality(study.modality.join(" "));
  const sameRegionDifferentModality =
    sameRegion && proposedMod.length > 0 && priorMod.length > 0 && proposedMod !== priorMod;

  const impression = parseImpressionTag(report?.conclusionExcerpt);
  const clinicalRedFlags = hasClinicalRedFlags(redFlags);
  const priorNormalWithoutRedFlags =
    impression === "normal" && days !== undefined && days <= 90 && !clinicalRedFlags;

  if (sameCpt && days !== undefined && days <= 30) {
    const dateLabel = formatStudyDate(study.startedIso);
    return {
      severity: "high",
      reason: `Potential duplicate — prior exam on ${dateLabel}.`,
      priorStudyId: study.id,
      daysSincePrior: days,
      sameCpt: true,
      sameRegionDifferentModality: false,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "BLOCK_SOFT",
    };
  }

  if (sameRegionDifferentModality && days !== undefined && days <= 14) {
    return {
      severity: "medium",
      reason: `Same anatomic region (${priorRegion}) imaged with ${priorMod} within ${Math.round(days)} days; proposed ${proposedMod} may overlap.`,
      priorStudyId: study.id,
      daysSincePrior: days,
      sameCpt: false,
      sameRegionDifferentModality: true,
      priorNormalWithoutRedFlags: false,
      suggestedAction: "DISCUSS",
    };
  }

  if (priorNormalWithoutRedFlags) {
    return {
      severity: "medium",
      reason: `Prior normal ${priorMod} of ${priorRegion} within ${Math.round(days ?? 0)} days without red-flag symptoms.`,
      priorStudyId: study.id,
      daysSincePrior: days,
      sameCpt: false,
      sameRegionDifferentModality: false,
      priorNormalWithoutRedFlags: true,
      suggestedAction: "DISCUSS",
    };
  }

  return {
    severity: "none",
    reason: "No redundancy rule matched for this prior study.",
    priorStudyId: study.id,
    daysSincePrior: days,
    sameCpt,
    sameRegionDifferentModality,
    priorNormalWithoutRedFlags: false,
    suggestedAction: "PROCEED",
  };
}

/**
 * Parses DiagnosticReport conclusion into an impression tag for the control sheet.
 *
 * @param conclusion - Scrubbed conclusion excerpt from FHIR DiagnosticReport.
 */
export function parseImpressionTag(
  conclusion?: string,
): "normal" | "abnormal" | "equivocal" | "unknown" {
  const text = (conclusion ?? "").toLowerCase();
  if (!text.trim()) {
    return "unknown";
  }
  if (/\b(equivocal|indeterminate|uncertain|cannot exclude)\b/.test(text)) {
    return "equivocal";
  }
  if (/\b(normal|unremarkable|no acute|negative for|within normal)\b/.test(text)) {
    return "normal";
  }
  if (
    /\b(abnormal|fracture|mass|lesion|effusion|stenosis|herniat|malignan|metasta|hemorrhage)\b/.test(
      text,
    )
  ) {
    return "abnormal";
  }
  return "unknown";
}

function findLinkedReport(
  study: PriorImagingStudy,
  reports: PriorDiagnosticReport[],
): PriorDiagnosticReport | undefined {
  if (!study.startedIso) {
    return reports[0];
  }
  const studyTime = Date.parse(study.startedIso);
  if (!Number.isFinite(studyTime)) {
    return reports[0];
  }
  let best: PriorDiagnosticReport | undefined;
  let bestDelta = Infinity;
  for (const report of reports) {
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
  return best ?? reports[0];
}

function daysSinceStudy(startedIso: string | undefined, now: number): number | undefined {
  if (!startedIso) {
    return undefined;
  }
  const started = Date.parse(startedIso);
  if (!Number.isFinite(started)) {
    return undefined;
  }
  return (now - started) / MS_PER_DAY;
}

function normalizeCpt(cpt?: string): string {
  return (cpt ?? "").replace(/\D/g, "").trim();
}

function normalizeRegion(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeModality(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("mri") || v.includes("mr")) {
    return "mri";
  }
  if (v.includes("ct")) {
    return "ct";
  }
  if (v.includes("x-ray") || v.includes("xray") || v.includes("xr")) {
    return "xray";
  }
  if (v.includes("ultrasound") || v.includes(" us")) {
    return "us";
  }
  if (v.includes("pet")) {
    return "pet";
  }
  return v.replace(/\s+/g, " ").trim();
}

function cptMatchFromDescription(
  proposedCpt: string,
  description?: string,
  conclusion?: string,
): boolean {
  if (!proposedCpt) {
    return false;
  }
  const blob = `${description ?? ""} ${conclusion ?? ""}`;
  return blob.includes(proposedCpt);
}

function hasClinicalRedFlags(redFlags?: AIIERedFlags): boolean {
  if (!redFlags) {
    return false;
  }
  return Object.values(redFlags).some(Boolean);
}

function formatStudyDate(iso?: string): string {
  if (!iso) {
    return "unknown date";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "unknown date";
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
