import {
  CONSERVATIVE_CARE_REGEX,
  DURATION_REGEX,
  RED_FLAG_PHRASES,
  SYMPTOMS,
} from "@/lib/nlp/clinical-lexicon";
import type { AIIERedFlags } from "@/lib/types/aiie";

/** Structured proposals from deterministic note parsing. */
export interface ExtractionResult {
  /** Canonical symptom ids for {@link import("@/lib/types/aiie").AIIEClinicalFactors.symptoms}. */
  symptoms: string[];
  /** Partial red-flag booleans inferred from the note. */
  redFlags: Partial<AIIERedFlags>;
  /** Normalized duration string (e.g. "6 weeks"). */
  duration?: string;
  /** Conservative-care trial inferred from the note. */
  conservativeCare?: { tried: boolean; duration?: string };
  /** Overall match strength for UI badges. */
  confidence: "high" | "medium" | "low";
}

/**
 * Formats a numeric duration capture as a human-readable AIIE duration string.
 */
function formatDuration(value: string, unit: string): string {
  return `${value} ${unit.toLowerCase()}`;
}

/**
 * Extracts symptom duration, skipping spans already used for conservative-care duration.
 */
function extractSymptomDuration(text: string, conservativeSpan?: string): string | undefined {
  const ordered = [...DURATION_REGEX].sort(
    (a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0),
  );

  for (const entry of ordered) {
    const match = entry.regex.exec(text);
    if (!match || match.index === undefined) {
      continue;
    }
    const full = match[0];
    if (conservativeSpan && text.includes(conservativeSpan) && full === conservativeSpan) {
      continue;
    }
    const value = match[1];
    const unit = match[2];
    if (!value || !unit) {
      continue;
    }
    if (
      conservativeSpan &&
      /(?:PT|physical\s+therapy|conservative)/i.test(text.slice(Math.max(0, match.index - 20), match.index + full.length))
    ) {
      const isConservativeClause = CONSERVATIVE_CARE_REGEX.some(
        (c) => c.mapsTo === "duration" && c.regex.test(text),
      );
      if (isConservativeClause && !/\bx\s*\d+/i.test(full)) {
        continue;
      }
    }
    return formatDuration(value, unit);
  }
  return undefined;
}

/**
 * Extracts conservative-care tried flag and optional duration from the note.
 */
function extractConservativeCare(
  text: string,
): { tried: boolean; duration?: string; durationSpan?: string } | undefined {
  let tried = false;
  let duration: string | undefined;
  let durationSpan: string | undefined;

  for (const entry of CONSERVATIVE_CARE_REGEX) {
    const match = entry.regex.exec(text);
    if (!match) {
      continue;
    }
    if (entry.mapsTo === "tried") {
      tried = true;
    }
    if (entry.mapsTo === "duration" && match[1] && match[2]) {
      duration = formatDuration(match[1], match[2]);
      durationSpan = match[0];
    }
  }

  if (!tried && !duration) {
    return undefined;
  }
  return { tried: tried || Boolean(duration), duration, durationSpan };
}

/**
 * Scores extraction confidence from the number and types of matches.
 */
function scoreConfidence(result: Omit<ExtractionResult, "confidence">): ExtractionResult["confidence"] {
  const signalCount =
    result.symptoms.length +
    Object.keys(result.redFlags).length +
    (result.duration ? 1 : 0) +
    (result.conservativeCare?.tried ? 1 : 0);

  if (signalCount >= 4) {
    return "high";
  }
  if (signalCount >= 2) {
    return "medium";
  }
  return "low";
}

/**
 * Deterministic regex + lexicon extraction over a pasted clinician note.
 * Proposes AIIE-aligned fields; callers must confirm before applying.
 *
 * @param text - Raw free-text clinical note.
 */
export function extractClinicalHistory(text: string): ExtractionResult {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { symptoms: [], redFlags: {}, confidence: "low" };
  }

  const symptoms: string[] = [];
  for (const entry of SYMPTOMS) {
    if (entry.pattern.test(trimmed) && !symptoms.includes(entry.symptomId)) {
      symptoms.push(entry.symptomId);
    }
  }

  const redFlags: Partial<AIIERedFlags> = {};
  for (const entry of RED_FLAG_PHRASES) {
    if (entry.pattern.test(trimmed)) {
      redFlags[entry.flag] = true;
    }
  }

  const conservativeCare = extractConservativeCare(trimmed);
  const duration = extractSymptomDuration(trimmed, conservativeCare?.durationSpan);

  const base: Omit<ExtractionResult, "confidence"> = {
    symptoms,
    redFlags,
    ...(duration ? { duration } : {}),
    ...(conservativeCare ?
      {
        conservativeCare: {
          tried: conservativeCare.tried,
          ...(conservativeCare.duration ? { duration: conservativeCare.duration } : {}),
        },
      }
    : {}),
  };

  return { ...base, confidence: scoreConfidence(base) };
}
