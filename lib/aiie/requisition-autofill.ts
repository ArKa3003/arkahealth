/**
 * Deterministic requisition autofill from {@link PatientRecordSnapshot} (regex + keywords only),
 * plus the silent documentation assist: the prior-auth / medical-necessity narrative generated
 * from the matrix rationale and SHAP-style factor breakdown.
 * Proposals are never applied without explicit clinician confirmation.
 */

import { ALL_SCENARIOS } from "@/lib/aiie/knowledge-matrix";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import { evidenceUrl } from "@/lib/evidence/url";
import type {
  AIIEClinicalFactors,
  AIIEInput,
  AIIEOrder,
  AIIEScore,
} from "@/lib/types/aiie";
import type { PatientRecordSnapshot, ProblemListEntry } from "@/lib/types/record-snapshot";

/** Source object in the record snapshot that produced a proposal. */
export type AutofillFieldSource =
  | "problem_list"
  | "encounter_note"
  | "medication_list"
  | "observation";

/** Confidence tier for a single proposed field value. */
export type AutofillConfidence = "high" | "medium" | "low";

/** One proposed fill-in for a missing clinical factor path. */
export interface AutofillProposalField {
  /** Dot path under {@link AIIEClinicalFactors}, e.g. `clinicalFactors.duration`. */
  path: string;
  /** Proposed string value (booleans encoded as `"true"` / `"false"`). */
  value: string;
  source: AutofillFieldSource;
  confidence: AutofillConfidence;
  /** Human-readable citation of the snapshot row used. */
  citation: string;
}

/** Bundle of proposed fill-ins for clinician review. */
export interface AutofillProposal {
  fields: AutofillProposalField[];
}

const DURATION_PATH = "clinicalFactors.duration";
const SYMPTOMS_PATH = "clinicalFactors.symptoms";
const CONSERVATIVE_TRIED_PATH = "clinicalFactors.conservativeManagementTried";
const CONSERVATIVE_DURATION_PATH = "clinicalFactors.conservativeManagementDuration";

const SYMPTOM_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(low\s*back|lumbar)\s*pain\b/i, label: "low back pain" },
  { pattern: /\bradiculopathy\b/i, label: "radiculopathy" },
  { pattern: /\bsciatica\b/i, label: "sciatica" },
  { pattern: /\bnumbness\b/i, label: "numbness" },
  { pattern: /\bweakness\b/i, label: "weakness" },
  { pattern: /\bparesthesia\b/i, label: "paresthesia" },
  { pattern: /\bheadache\b/i, label: "headache" },
  { pattern: /\bneck\s*pain\b/i, label: "neck pain" },
  { pattern: /\babdominal\s*pain\b/i, label: "abdominal pain" },
  { pattern: /\bdyspnea\b/i, label: "dyspnea" },
  { pattern: /\bchest\s*pain\b/i, label: "chest pain" },
];

const CONSERVATIVE_MED_PATTERNS =
  /\b(pt|physical therapy|physiotherapy|ibuprofen|naproxen|nsaid|meloxicam|cyclobenzaprine|gabapentin|conservative)\b/i;

const CONSERVATIVE_NOTE_PATTERNS =
  /\b(conservative management|failed conservative|physical therapy|completed pt|trial of conservative)\b/i;

/**
 * Returns true when duration, structured symptoms, or conservative-care documentation is absent.
 *
 * @param existing - Current structured clinical factors on the order.
 */
export function isRequisitionIncomplete(existing: AIIEClinicalFactors): boolean {
  const durationMissing = !existing.duration?.trim();
  const symptomsMissing = !existing.symptoms?.length;
  const conservativeUndocumented =
    existing.conservativeManagementTried === false &&
    !existing.conservativeManagementDuration?.trim();
  return durationMissing || symptomsMissing || conservativeUndocumented;
}

/**
 * Proposes deterministic fill-ins from the record snapshot for missing requisition fields.
 * Does not mutate the order or factors — callers apply only after clinician confirmation.
 *
 * @param input - Snapshot, order context, and existing clinical factors.
 */
export function proposeAutofill(input: {
  snapshot: PatientRecordSnapshot;
  order: AIIEOrder;
  existing: AIIEClinicalFactors;
}): AutofillProposal {
  const { snapshot, order, existing } = input;
  if (!isRequisitionIncomplete(existing)) {
    return { fields: [] };
  }

  const fields: AutofillProposalField[] = [];
  const orderContext = orderText(order);

  if (!existing.duration?.trim()) {
    const durationProposal = proposeDuration(snapshot, orderContext);
    if (durationProposal) {
      fields.push(durationProposal);
    }
  }

  if (!existing.symptoms?.length) {
    const symptomProposal = proposeSymptoms(snapshot, orderContext);
    if (symptomProposal) {
      fields.push(symptomProposal);
    }
  }

  if (
    existing.conservativeManagementTried === false &&
    !existing.conservativeManagementDuration?.trim()
  ) {
    const conservativeProposals = proposeConservativeCare(snapshot);
    fields.push(...conservativeProposals);
  }

  return { fields: dedupeFields(fields) };
}

/**
 * Merges a clinician-confirmed autofill value into an {@link AIIEInput} (immutable copy).
 *
 * @param input - Base AIIE input.
 * @param path - Dot path from {@link AutofillProposalField.path}.
 * @param value - Confirmed value string.
 */
export function applyAutofillToInput(
  input: AIIEInput,
  path: string,
  value: string,
): AIIEInput {
  const clinical = { ...input.clinicalFactors };

  switch (path) {
    case DURATION_PATH:
      clinical.duration = value;
      break;
    case SYMPTOMS_PATH: {
      const added = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      clinical.symptoms = [...new Set([...clinical.symptoms, ...added])];
      break;
    }
    case CONSERVATIVE_TRIED_PATH:
      clinical.conservativeManagementTried = value === "true";
      break;
    case CONSERVATIVE_DURATION_PATH:
      clinical.conservativeManagementDuration = value;
      break;
    default:
      return input;
  }

  return {
    ...input,
    clinicalFactors: clinical,
    duration: clinical.duration,
    symptoms: clinical.symptoms,
    conservativeManagementTried: clinical.conservativeManagementTried,
    conservativeManagementDuration: clinical.conservativeManagementDuration,
  };
}

function orderText(order: AIIEOrder): string {
  return `${order.modality} ${order.bodyPart ?? ""} ${order.procedure}`.toLowerCase();
}

function proposeDuration(
  snapshot: PatientRecordSnapshot,
  orderContext: string,
): AutofillProposalField | null {
  const relevantProblems = snapshot.problems.filter((p) =>
    problemMatchesOrder(p, orderContext),
  );
  const problems = relevantProblems.length > 0 ? relevantProblems : snapshot.problems;

  for (const problem of problems) {
    const fromOnset = durationFromOnset(problem);
    if (fromOnset) {
      return {
        path: DURATION_PATH,
        value: fromOnset.value,
        source: "problem_list",
        confidence: fromOnset.confidence,
        citation: problemCitation(problem),
      };
    }

    const fromDisplay = durationFromDisplayText(problem.display);
    if (fromDisplay) {
      return {
        path: DURATION_PATH,
        value: fromDisplay.value,
        source: "problem_list",
        confidence: fromDisplay.confidence,
        citation: problemCitation(problem),
      };
    }
  }

  for (const encounter of snapshot.encounters) {
    const text = [encounter.reasonDisplay, encounter.typeDisplay].filter(Boolean).join(" ");
    const parsed = parseDurationFromText(text);
    if (parsed) {
      return {
        path: DURATION_PATH,
        value: parsed.value,
        source: "encounter_note",
        confidence: parsed.confidence,
        citation: `Encounter ${encounter.id ?? "—"}: ${encounter.reasonDisplay ?? encounter.typeDisplay ?? "visit"}`,
      };
    }
  }

  for (const note of snapshot.notes) {
    const parsed = parseDurationFromText(note.description ?? "");
    if (parsed) {
      return {
        path: DURATION_PATH,
        value: parsed.value,
        source: "encounter_note",
        confidence: parsed.confidence,
        citation: `Clinical note ${note.id ?? "—"}: ${note.description?.slice(0, 80) ?? "document"}`,
      };
    }
  }

  return null;
}

function proposeSymptoms(
  snapshot: PatientRecordSnapshot,
  orderContext: string,
): AutofillProposalField | null {
  const corpus: Array<{ text: string; source: AutofillFieldSource; citation: string }> = [];

  for (const problem of snapshot.problems) {
    if (!problemMatchesOrder(problem, orderContext) && snapshot.problems.length > 1) {
      continue;
    }
    corpus.push({
      text: problem.display,
      source: "problem_list",
      citation: problemCitation(problem),
    });
  }

  for (const encounter of snapshot.encounters) {
    if (encounter.reasonDisplay) {
      corpus.push({
        text: encounter.reasonDisplay,
        source: "encounter_note",
        citation: `Encounter ${encounter.id ?? "—"}: ${encounter.reasonDisplay}`,
      });
    }
  }

  const matched = new Set<string>();
  let bestCitation = "";
  let bestSource: AutofillFieldSource = "problem_list";

  for (const row of corpus) {
    for (const { pattern, label } of SYMPTOM_KEYWORDS) {
      if (pattern.test(row.text)) {
        matched.add(label);
        if (!bestCitation) {
          bestCitation = row.citation;
          bestSource = row.source;
        }
      }
    }
  }

  if (matched.size === 0) {
    return null;
  }

  return {
    path: SYMPTOMS_PATH,
    value: [...matched].join(", "),
    source: bestSource,
    confidence: matched.size >= 2 ? "high" : "medium",
    citation: bestCitation,
  };
}

function proposeConservativeCare(
  snapshot: PatientRecordSnapshot,
): AutofillProposalField[] {
  const fields: AutofillProposalField[] = [];

  for (const med of snapshot.medications) {
    if (CONSERVATIVE_MED_PATTERNS.test(med.display)) {
      fields.push({
        path: CONSERVATIVE_TRIED_PATH,
        value: "true",
        source: "medication_list",
        confidence: "medium",
        citation: `Medication ${med.id ?? "—"}: ${med.display}`,
      });
      fields.push({
        path: CONSERVATIVE_DURATION_PATH,
        value: "Documented on medication list (duration not specified)",
        source: "medication_list",
        confidence: "low",
        citation: `Medication ${med.id ?? "—"}: ${med.display}`,
      });
      return fields;
    }
  }

  for (const encounter of snapshot.encounters) {
    const text = encounter.reasonDisplay ?? "";
    if (CONSERVATIVE_NOTE_PATTERNS.test(text)) {
      fields.push({
        path: CONSERVATIVE_TRIED_PATH,
        value: "true",
        source: "encounter_note",
        confidence: "high",
        citation: `Encounter ${encounter.id ?? "—"}: ${text.slice(0, 120)}`,
      });
      const weeks = parseDurationFromText(text);
      if (weeks) {
        fields.push({
          path: CONSERVATIVE_DURATION_PATH,
          value: weeks.value,
          source: "encounter_note",
          confidence: weeks.confidence,
          citation: `Encounter ${encounter.id ?? "—"}: ${text.slice(0, 120)}`,
        });
      }
      return fields;
    }
  }

  for (const note of snapshot.notes) {
    const text = note.description ?? "";
    if (CONSERVATIVE_NOTE_PATTERNS.test(text)) {
      fields.push({
        path: CONSERVATIVE_TRIED_PATH,
        value: "true",
        source: "encounter_note",
        confidence: "medium",
        citation: `Clinical note ${note.id ?? "—"}: ${text.slice(0, 120)}`,
      });
      return fields;
    }
  }

  for (const lab of snapshot.labs) {
    if (/physical therapy|conservative/i.test(lab.display)) {
      fields.push({
        path: CONSERVATIVE_TRIED_PATH,
        value: "true",
        source: "observation",
        confidence: "low",
        citation: `Observation ${lab.id ?? "—"}: ${lab.display}`,
      });
      return fields;
    }
  }

  return fields;
}

function problemMatchesOrder(problem: ProblemListEntry, orderContext: string): boolean {
  const text = problem.display.toLowerCase();
  if (orderContext.includes("lumbar") || orderContext.includes("spine")) {
    return /back|lumbar|spine|lumb/i.test(text);
  }
  if (orderContext.includes("head")) {
    return /head|headache|migraine/i.test(text);
  }
  if (orderContext.includes("knee")) {
    return /knee/i.test(text);
  }
  if (orderContext.includes("abdomen") || orderContext.includes("abdominal")) {
    return /abdom|rlq|append/i.test(text);
  }
  return true;
}

function durationFromOnset(
  problem: ProblemListEntry,
): { value: string; confidence: AutofillConfidence } | null {
  if (!problem.onsetIso) {
    return null;
  }
  const onset = Date.parse(problem.onsetIso);
  if (!Number.isFinite(onset)) {
    return null;
  }
  const days = Math.floor((Date.now() - onset) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return null;
  }
  if (days >= 84) {
    const weeks = Math.round(days / 7);
    return { value: `${weeks} weeks (from problem onset)`, confidence: "high" };
  }
  if (days >= 14) {
    return { value: `${Math.round(days / 7)} weeks (from problem onset)`, confidence: "high" };
  }
  if (days >= 1) {
    return { value: `${days} days (from problem onset)`, confidence: "high" };
  }
  return { value: "Less than 1 day (from problem onset)", confidence: "medium" };
}

function durationFromDisplayText(
  display: string,
): { value: string; confidence: AutofillConfidence } | null {
  const lower = display.toLowerCase();
  if (/\bchronic\b/.test(lower)) {
    return { value: "12+ weeks (chronic, problem list)", confidence: "high" };
  }
  if (/\bsubacute\b/.test(lower)) {
    return { value: "4–12 weeks (subacute, problem list)", confidence: "medium" };
  }
  if (/\bacute\b/.test(lower)) {
    return { value: "Less than 4 weeks (acute, problem list)", confidence: "medium" };
  }
  return parseDurationFromText(display);
}

function parseDurationFromText(
  text: string,
): { value: string; confidence: AutofillConfidence } | null {
  if (!text.trim()) {
    return null;
  }
  const match = text.match(
    /\b(\d+)\s*(day|days|week|weeks|month|months|year|years)\b/i,
  );
  if (!match) {
    return null;
  }
  const n = match[1];
  const unit = match[2].toLowerCase();
  const normalized =
    unit.startsWith("day") ? `${n} days`
    : unit.startsWith("week") ? `${n} weeks`
    : unit.startsWith("month") ? `${n} months`
    : `${n} years`;
  return { value: normalized, confidence: "medium" };
}

function problemCitation(problem: ProblemListEntry): string {
  const icd = problem.icd10 ? ` (${problem.icd10})` : "";
  return `Problem list: ${problem.display}${icd}`;
}

function dedupeFields(fields: AutofillProposalField[]): AutofillProposalField[] {
  const seen = new Set<string>();
  return fields.filter((f) => {
    const key = `${f.path}:${f.value}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Silent documentation assist — prior-auth / medical-necessity narrative
// ---------------------------------------------------------------------------

/** Generated PA / medical-necessity narrative attached to a CDS card. */
export interface MedicalNecessityNarrative {
  /** Full copyable narrative text (ends with the FDA non-device CDS disclosure). */
  text: string;
  /** Factor bullet lines supporting the order (from the SHAP breakdown). */
  supportingFactors: string[];
  /** Opposing factors / documentation gaps surfaced for the reviewer. */
  considerations: string[];
  /** First-party AIIE evidence URL backing the narrative, when matched. */
  evidenceUrl: string | null;
  /** Knowledge matrix semver stamped into the narrative, when matched. */
  matrixVersion: string | null;
}

/** Inputs for {@link generateMedicalNecessityNarrative}. */
export interface NarrativeInput {
  /** Ordered imaging service. */
  order: AIIEOrder;
  /** AIIE score with factor breakdown and matrix provenance. */
  score: AIIEScore;
  /** Clinical indication text from the order. */
  indication: string;
  /** Optional demographics line ("67-year-old female"); omit any identifiers. */
  patient?: { age?: number | null; sex?: string };
}

const MAX_FACTOR_LINES = 4;

function factorLine(factor: AIIEScore["factors"][number]): string {
  const sign = factor.contribution > 0 ? "+" : "−";
  const magnitude = Math.abs(factor.contribution).toFixed(2);
  const citation = factor.evidenceCitation ? ` — ${factor.evidenceCitation}` : "";
  return `${factor.name} (${sign}${magnitude})${citation}`;
}

/**
 * Generates the prior-auth / medical-necessity narrative for ARKA-INS from the
 * matrix rationale plus the SHAP-style factor breakdown. Deterministic and
 * PHI-free: only the order, score, indication, and an age/sex line appear —
 * never names or identifiers. Attach as a copyable block; the clinician owns
 * what (if anything) gets submitted.
 *
 * @param input - Order, score, indication, and optional demographics.
 */
export function generateMedicalNecessityNarrative(
  input: NarrativeInput,
): MedicalNecessityNarrative {
  const { order, score, indication, patient } = input;
  const match = score.matrixMatch ?? null;
  const scenario = match
    ? (ALL_SCENARIOS.find((s) => s.id === match.scenarioId) ?? null)
    : null;

  const sorted = [...score.factors]
    .filter((f) => f.contribution !== 0)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const supportingFactors = sorted
    .filter((f) => f.contribution > 0)
    .slice(0, MAX_FACTOR_LINES)
    .map(factorLine);
  const considerations = sorted
    .filter((f) => f.contribution < 0)
    .slice(0, MAX_FACTOR_LINES)
    .map(factorLine);

  const evidence = match ? evidenceUrl(match.evidenceSlug) : null;
  const study = order.bodyPart ? `${order.modality} — ${order.bodyPart}` : order.modality;

  const lines: string[] = [
    "MEDICAL NECESSITY STATEMENT (generated by ARKA AIIE — clinician reviewed)",
    "",
    `Requested study: ${study} (${order.procedure})${order.cpt ? ` [CPT ${order.cpt}]` : ""}`,
    `Indication: ${indication || "Not documented"}`,
  ];
  if (patient?.age != null) {
    lines.push(`Patient: ${patient.age}-year-old${patient.sex ? ` ${patient.sex}` : ""}`);
  }
  if (scenario) {
    lines.push(`Clinical scenario: ${scenario.name}`);
  }
  lines.push(
    "",
    `AIIE appropriateness: ${score.clinicalScore}/9 (confidence ${(score.confidence * 100).toFixed(0)}%).`,
    score.narrativeRationale,
  );
  if (supportingFactors.length > 0) {
    lines.push("", "Supporting clinical factors:");
    lines.push(...supportingFactors.map((f) => `- ${f}`));
  }
  if (considerations.length > 0) {
    lines.push("", "Documentation considerations:");
    lines.push(...considerations.map((f) => `- ${f}`));
  }
  if (evidence && match) {
    lines.push(
      "",
      `Evidence basis: ${evidence} (AIIE Clinical Knowledge Matrix v${match.matrixVersion})`,
    );
  }
  lines.push("", FDA_NON_DEVICE_CDS_DISCLOSURE);

  return {
    text: lines.join("\n"),
    supportingFactors,
    considerations,
    evidenceUrl: evidence,
    matrixVersion: match?.matrixVersion ?? null,
  };
}
