import type {
  PatientRecordSnapshot,
  PriorDiagnosticReport,
  PriorImagingStudy,
} from "@/lib/types/record-snapshot";

/** ACR White Paper–aligned incidental finding categories (deterministic keyword/regex only). */
export type IncidentalCategory =
  | "pulmonary_nodule"
  | "adrenal_mass"
  | "renal_cyst"
  | "thyroid_nodule"
  | "liver_lesion"
  | "other";

/**
 * Untracked incidental finding surfaced for clinician follow-up.
 * Produced only from {@link PatientRecordSnapshot.priorReports} conclusion text — no LLM inference.
 */
export interface IncidentalFinding {
  priorReportId: string;
  date: string;
  text: string;
  category: IncidentalCategory;
  followupRecommended: string;
  daysOverdue: number;
  citation: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface CategoryRule {
  category: IncidentalCategory;
  patterns: RegExp[];
  /** Recommended surveillance interval in days (Fleischner / ACR incidental guidance, simplified). */
  intervalDays: number;
  followupRecommended: string;
  citation: string;
  /** Body-site / description tokens for subsequent follow-up imaging. */
  followUpSiteTokens: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "pulmonary_nodule",
    patterns: [
      /\b(?:incidental\s+)?(?:pulmonary|lung)\s+nodule\b/i,
      /\b(?:solid|part[- ]?solid|subsolid|ground[- ]?glass)\s+(?:pulmonary\s+)?nodule\b/i,
      /\bnodule\s+(?:in|of)\s+(?:the\s+)?(?:right|left|bilateral)?\s*(?:lower|upper|middle)?\s*lobe\b/i,
    ],
    intervalDays: 183,
    followupRecommended: "Fleischner-style low-dose CT follow-up at 6 months",
    citation: "Fleischner Society 2017; ACR White Paper — incidental pulmonary nodules",
    followUpSiteTokens: ["chest", "lung", "pulmonary", "thorax", "thoracic"],
  },
  {
    category: "adrenal_mass",
    patterns: [
      /\b(?:incidental\s+)?adrenal\s+(?:nodule|mass|lesion|incidentaloma)\b/i,
      /\badrenal\s+(?:indeterminate|lipid[- ]?poor)\s+lesion\b/i,
    ],
    intervalDays: 183,
    followupRecommended: "ACR incidental adrenal lesion protocol — repeat CT at 6 months if indeterminate",
    citation: "ACR White Paper — incidental adrenal findings",
    followUpSiteTokens: ["adrenal", "abdomen", "retroperitoneum"],
  },
  {
    category: "renal_cyst",
    patterns: [
      /\b(?:incidental\s+)?(?:renal|kidney)\s+cyst\b/i,
      /\bBosniak\s+(?:I{1,2}F?|III|IV)\b/i,
      /\b(?:simple|complex)\s+(?:renal|kidney)\s+cyst\b/i,
    ],
    intervalDays: 365,
    followupRecommended: "ACR incidental renal cyst — imaging follow-up at 12 months when Bosniak IIF or greater",
    citation: "ACR White Paper — incidental renal masses",
    followUpSiteTokens: ["renal", "kidney", "abdomen", "retroperitoneum"],
  },
  {
    category: "thyroid_nodule",
    patterns: [
      /\b(?:incidental\s+)?thyroid\s+nodule\b/i,
      /\bthyroid\s+incidentaloma\b/i,
    ],
    intervalDays: 365,
    followupRecommended: "ATA/ACR thyroid incidentaloma — ultrasound follow-up at 12 months when indicated",
    citation: "ACR White Paper — incidental thyroid nodules",
    followUpSiteTokens: ["thyroid", "neck"],
  },
  {
    category: "liver_lesion",
    patterns: [
      /\b(?:incidental\s+)?(?:hepatic|liver)\s+(?:lesion|nodule|mass|cyst)\b/i,
      /\b(?:focal|indeterminate)\s+(?:liver|hepatic)\s+(?:lesion|nodule)\b/i,
    ],
    intervalDays: 183,
    followupRecommended: "ACR incidental liver lesion — multiphase CT or MRI at 6 months when indeterminate",
    citation: "ACR White Paper — incidental liver findings",
    followUpSiteTokens: ["liver", "hepatic", "abdomen"],
  },
  {
    category: "other",
    patterns: [/\bincidental\s+(?:finding|lesion|mass|nodule|cyst)\b/i],
    intervalDays: 365,
    followupRecommended: "Documented incidental finding — specialty-appropriate follow-up per ACR white paper",
    citation: "ACR White Paper on Management of Incidental Findings",
    followUpSiteTokens: [],
  },
];

const FOLLOW_UP_NARRATIVE =
  /\b(?:follow[- ]?up|surveillance|repeat\s+(?:ct|mri|ultrasound|us)|f\s*\/\s*u|recommend(?:ed)?\s+(?:ct|mri|us|ultrasound))\b/i;

const RESOLVED_NARRATIVE =
  /\b(?:no\s+longer\s+(?:requires|needs)\s+follow[- ]?up|resolved|benign\s+no\s+action|stable\s+for\s+\d+\s+years?)\b/i;

/**
 * Stable key for dismiss state in UI.
 *
 * @param finding - Detected incidental row.
 */
export function incidentalFindingKey(finding: IncidentalFinding): string {
  return `${finding.priorReportId}:${finding.category}`;
}

/**
 * Human-readable category label for cards and audit text.
 *
 * @param category - Incidental category code.
 */
export function incidentalCategoryLabel(category: IncidentalCategory): string {
  switch (category) {
    case "pulmonary_nodule":
      return "pulmonary nodule";
    case "adrenal_mass":
      return "adrenal mass";
    case "renal_cyst":
      return "renal cyst";
    case "thyroid_nodule":
      return "thyroid nodule";
    case "liver_lesion":
      return "liver lesion";
    default:
      return "incidental finding";
  }
}

/**
 * Detects prior-report incidentals that are overdue for recommended follow-up and lack
 * documented surveillance in the snapshot. Deterministic: same snapshot always yields the same list.
 *
 * @param snapshot - Normalized FHIR record snapshot (PHI-scrubbed).
 */
export function detectIncidentals(snapshot: PatientRecordSnapshot): IncidentalFinding[] {
  const referenceMs = parseIsoMs(snapshot.capturedAtIso) ?? 0;
  const findings: IncidentalFinding[] = [];
  const seenKeys = new Set<string>();

  for (const report of snapshot.priorReports) {
    const text = (report.conclusionExcerpt ?? "").trim();
    if (!text) {
      continue;
    }

    const reportMs = parseIsoMs(report.issuedIso);
    if (reportMs === undefined) {
      continue;
    }

    const reportDate = formatDateOnly(report.issuedIso ?? "");

    for (const rule of CATEGORY_RULES) {
      const match = firstPatternMatch(text, rule.patterns);
      if (!match) {
        continue;
      }

      const key = `${report.id ?? reportDate}:${rule.category}`;
      if (seenKeys.has(key)) {
        continue;
      }

      const daysSince = Math.floor((referenceMs - reportMs) / MS_PER_DAY);
      const daysOverdue = Math.max(0, daysSince - rule.intervalDays);
      if (daysOverdue <= 0) {
        continue;
      }

      if (hasDocumentedFollowUp(snapshot, report, rule, reportMs)) {
        continue;
      }

      seenKeys.add(key);
      findings.push({
        priorReportId: report.id ?? key,
        date: reportDate,
        text: extractExcerpt(text, match.index, match.length),
        category: rule.category,
        followupRecommended: rule.followupRecommended,
        daysOverdue,
        citation: rule.citation,
      });
    }
  }

  findings.sort((a, b) => {
    if (b.daysOverdue !== a.daysOverdue) {
      return b.daysOverdue - a.daysOverdue;
    }
    return a.date.localeCompare(b.date);
  });

  return findings;
}

function firstPatternMatch(
  text: string,
  patterns: RegExp[],
): { index: number; length: number; matched: string } | null {
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    const m = re.exec(text);
    if (m && m.index !== undefined) {
      return { index: m.index, length: m[0].length, matched: m[0] };
    }
  }
  return null;
}

function extractExcerpt(text: string, matchIndex: number, matchLen: number): string {
  const window = 120;
  const start = Math.max(0, matchIndex - window);
  const end = Math.min(text.length, matchIndex + matchLen + window);
  const slice = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) {
    return `…${slice}`;
  }
  if (end < text.length) {
    return `${slice}…`;
  }
  return slice;
}

function parseIsoMs(iso?: string): number | undefined {
  if (!iso) {
    return undefined;
  }
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 10) || "unknown date";
  }
  return d.toISOString().slice(0, 10);
}

function hasDocumentedFollowUp(
  snapshot: PatientRecordSnapshot,
  sourceReport: PriorDiagnosticReport,
  rule: CategoryRule,
  sourceReportMs: number,
): boolean {
  for (const study of snapshot.priorImaging) {
    if (isFollowUpImaging(study, sourceReportMs, rule)) {
      return true;
    }
  }

  for (const report of snapshot.priorReports) {
    if (report === sourceReport) {
      continue;
    }
    const ms = parseIsoMs(report.issuedIso);
    if (ms === undefined || ms <= sourceReportMs) {
      continue;
    }
    const text = (report.conclusionExcerpt ?? "").toLowerCase();
    if (RESOLVED_NARRATIVE.test(text)) {
      return true;
    }
    if (matchesCategoryNarrative(text, rule) && FOLLOW_UP_NARRATIVE.test(text)) {
      return true;
    }
    if (matchesCategoryNarrative(text, rule) && /\b(?:stable|unchanged|no\s+significant\s+change)\b/i.test(text)) {
      return true;
    }
  }

  const narrativeBlob = [
    ...snapshot.problems.map((p) => p.display),
    ...snapshot.encounters.map((e) => e.reasonDisplay ?? ""),
    ...snapshot.notes.map((n) => n.description ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  if (matchesCategoryNarrative(narrativeBlob, rule) && FOLLOW_UP_NARRATIVE.test(narrativeBlob)) {
    return true;
  }

  return false;
}

function isFollowUpImaging(
  study: PriorImagingStudy,
  afterMs: number,
  rule: CategoryRule,
): boolean {
  const studyMs = parseIsoMs(study.startedIso);
  if (studyMs === undefined || studyMs <= afterMs) {
    return false;
  }

  const blob = [
    study.bodySite ?? "",
    study.description ?? "",
    ...(study.modality ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (rule.followUpSiteTokens.length === 0) {
    return FOLLOW_UP_NARRATIVE.test(blob);
  }

  return rule.followUpSiteTokens.some((token) => blob.includes(token));
}

function matchesCategoryNarrative(text: string, rule: CategoryRule): boolean {
  return rule.patterns.some((pattern) => {
    const re = new RegExp(pattern.source, pattern.flags);
    return re.test(text);
  });
}
