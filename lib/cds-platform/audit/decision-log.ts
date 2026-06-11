/**
 * FDA Non-Device CDS evidence trail. PHI redaction is mandatory — see docs/PHI_REDACTION.md.
 * Do not log raw scenarios.
 */

import { createHash } from 'crypto';
import { appendFile, mkdir, readdir, readFile } from 'fs/promises';
import { join } from 'path';

import type { ClinicalScenario } from '@/lib/cds-platform/types';

/** De-identified scenario fingerprint for audit logs. */
export interface RedactedScenarioFingerprint {
  scenarioHash: string;
  ageBucket: '0-1' | '2-5' | '6-11' | '12-17' | '18-39' | '40-64' | '65-79' | '80+';
  sex: 'M' | 'F' | 'U';
  indicationICD10: string;
  modalityCPT: string;
  urgency: 'routine' | 'urgent' | 'emergent';
}

/** One CDS hook invocation record (no PHI). */
export interface DecisionLogEntry {
  hookInstance: string;
  hook: 'order-select' | 'order-sign' | 'appointment-book';
  hookTimestampISO: string;
  scenario: RedactedScenarioFingerprint;
  rulesFired: Array<{ ruleId: string; medicalBasisCitationId: string; tier: string }>;
  mlInvoked: boolean;
  mlScore?: number;
  mlTopFeatures?: Array<{ name: string; contribution: number; catalogPresent: boolean }>;
  cardsShipped: number;
  fdaDisclosureVersion: string;
  cardSourceLabels: string[];
  durationMs: number;
}

const LOG_DIR = join(process.cwd(), 'logs');

/**
 * Canonical JSON with sorted keys for stable hashing.
 *
 * @param value - Plain object to serialize.
 */
function canonicalJson(value: Record<string, unknown>): string {
  const sorted = Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = value[key];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

/**
 * Maps patient age in years to an audit bucket (no exact age stored).
 *
 * @param age - Age in years from scenario.
 */
function toAgeBucket(age: number | undefined): RedactedScenarioFingerprint['ageBucket'] {
  if (typeof age !== 'number' || age < 0) {
    return '18-39';
  }
  if (age <= 1) return '0-1';
  if (age <= 5) return '2-5';
  if (age <= 11) return '6-11';
  if (age <= 17) return '12-17';
  if (age <= 39) return '18-39';
  if (age <= 64) return '40-64';
  if (age <= 79) return '65-79';
  return '80+';
}

/**
 * Maps scenario sex to M/F/U without storing free-text gender identity labels.
 *
 * @param sex - Scenario sex field.
 */
function toSexCode(sex: ClinicalScenario['sex']): RedactedScenarioFingerprint['sex'] {
  if (sex === 'Male') return 'M';
  if (sex === 'Female') return 'F';
  return 'U';
}

/**
 * Derives urgency bucket from proposed imaging urgency string.
 *
 * @param urgency - Proposed imaging urgency.
 */
function toUrgencyBucket(
  urgency: string | undefined,
): RedactedScenarioFingerprint['urgency'] {
  const normalized = (urgency ?? 'Routine').toLowerCase();
  if (normalized === 'stat' || normalized === 'asap') return 'emergent';
  if (normalized === 'urgent') return 'urgent';
  return 'routine';
}

/**
 * Best-effort ICD-10 code from conditions (display/code only, no narrative).
 *
 * @param scenario - Clinical scenario.
 */
function extractIndicationIcd10(scenario: ClinicalScenario): string {
  const first = scenario.conditions?.[0];
  if (first?.code && typeof first.code === 'string') {
    return first.code;
  }
  return 'unknown';
}

/**
 * Best-effort modality/CPT token from proposed order (no order id).
 *
 * @param scenario - Clinical scenario.
 */
function extractModalityCpt(scenario: ClinicalScenario): string {
  const proposed = scenario.proposedImaging;
  const modality = proposed?.modality;
  if (typeof modality === 'string' && modality.trim()) {
    return modality.trim().slice(0, 32);
  }
  const sr = scenario.serviceRequests?.[0];
  if (sr?.code && typeof sr.code === 'string') {
    return sr.code;
  }
  return 'unknown';
}

/**
 * Redacts a {@link ClinicalScenario} to a PHI-free fingerprint for audit logging.
 * Strips patient identifiers, birth date (age bucket only), addresses, telecom,
 * practitioner identifiers, and free-text notes.
 *
 * @param scenario - Raw clinical scenario (must not be written to logs).
 */
export function redact(scenario: ClinicalScenario): RedactedScenarioFingerprint {
  const ageBucket = toAgeBucket(scenario.age);
  const sex = toSexCode(scenario.sex);
  const indicationICD10 = extractIndicationIcd10(scenario);
  const modalityCPT = extractModalityCpt(scenario);
  const urgency = toUrgencyBucket(scenario.proposedImaging?.urgency);

  const hashPayload = canonicalJson({
    ageBucket,
    sex,
    indicationICD10,
    modalityCPT,
    urgency,
    hasRedFlags: (scenario.redFlags ?? []).some((r) => r.present),
    symptomDurationDays:
      typeof scenario.duration === 'number' && scenario.duration >= 0 ?
        scenario.duration
      : -1,
    pregnancyStatus: scenario.pregnancyStatus ?? 'unknown',
    priorImaging90dCount: (scenario.priorImaging ?? []).filter(
      (p) => p.daysAgo >= 0 && p.daysAgo <= 90,
    ).length,
  });

  const scenarioHash = createHash('sha256').update(hashPayload).digest('hex');

  return {
    scenarioHash,
    ageBucket,
    sex,
    indicationICD10,
    modalityCPT,
    urgency,
  };
}

/**
 * Appends one decision log entry to `logs/decisions-YYYY-MM-DD.jsonl`.
 * Never throws to the request handler — filesystem failures are warned and ignored.
 *
 * @param entry - Redacted decision log entry.
 */
export async function writeDecisionLog(entry: DecisionLogEntry): Promise<void> {
  const day = entry.hookTimestampISO.slice(0, 10);
  const filePath = join(LOG_DIR, `decisions-${day}.jsonl`);
  await appendLine(filePath, entry);
}

/**
 * One CDS Hooks 2.0 §Feedback record: card acceptance or override per card uuid.
 * No PHI — free-text user comments are recorded as a length only, never verbatim.
 */
export interface FeedbackLogEntry {
  /** Correlation id from the originating hook invocation. */
  hookInstance: string;
  /** Service id the feedback was posted against. */
  serviceId: string;
  /** Card uuid the clinician acted on. */
  cardUuid: string;
  /** CDS Hooks 2.0 feedback outcome. */
  outcome: 'accepted' | 'overridden';
  /** Override reason coding when the card was dismissed (code only, no comment text). */
  overrideReasonCode?: string;
  /** Override reason code system. */
  overrideReasonSystem?: string;
  /** Length of the clinician's free-text comment (text itself is never logged — PHI risk). */
  overrideCommentLength?: number;
  /** Suggestion uuids accepted with the card. */
  acceptedSuggestionIds?: string[];
  /** Outcome timestamp reported by the EHR (ISO 8601). */
  outcomeTimestampISO: string;
  /** Server receipt timestamp (ISO 8601). */
  receivedAtISO: string;
}

/**
 * Appends one CDS feedback entry to `logs/feedback-YYYY-MM-DD.jsonl`.
 * Never throws to the request handler — filesystem failures are warned and ignored.
 *
 * @param entry - PHI-free feedback record.
 */
export async function writeFeedbackLog(entry: FeedbackLogEntry): Promise<void> {
  const day = entry.receivedAtISO.slice(0, 10);
  const filePath = join(LOG_DIR, `feedback-${day}.jsonl`);
  await appendLine(filePath, entry);
}

/**
 * Embedded-rail automation event types audited to the decision log.
 * Every rail render, card view, accept, override, narrative generation, and
 * write-back is recorded — with a hashed patient id, never PHI.
 */
export type RailEventType =
  | 'rail_render'
  | 'card_view'
  | 'card_accept'
  | 'card_override'
  | 'narrative_generated'
  | 'writeback_posted';

/** One embedded-rail automation event (no PHI; patient id pre-hashed with SHA-256). */
export interface RailEventLogEntry {
  /** Event type from the rail automation surface. */
  eventType: RailEventType;
  /** SHA-256 hex of the patient id — raw identifiers are never logged. */
  patientHash: string;
  /** ServiceRequest id the event relates to, when order-scoped. */
  orderId?: string;
  /** Evidence slug from the matrix match, when order-scoped. */
  evidenceSlug?: string;
  /** Knowledge matrix semver active when the event occurred. */
  matrixVersion: string;
  /** True when the rail ran from sandbox fixtures rather than a live EHR. */
  demoMode: boolean;
  /** Client-side event timestamp (ISO 8601). */
  occurredAtISO: string;
  /** Server receipt timestamp (ISO 8601). */
  receivedAtISO: string;
}

/**
 * Appends one rail automation event to `logs/rail-events-YYYY-MM-DD.jsonl`.
 * Never throws to the request handler — filesystem failures are warned and ignored.
 *
 * @param entry - PHI-free rail event record.
 */
export async function writeRailEventLog(entry: RailEventLogEntry): Promise<void> {
  const day = entry.receivedAtISO.slice(0, 10);
  const filePath = join(LOG_DIR, `rail-events-${day}.jsonl`);
  await appendLine(filePath, entry);
}

/** Aggregated automation stats surfaced on the INS dashboard. */
export interface AutomationStats {
  /** Rail renders (icon mounted with scored orders). */
  railRenders: number;
  /** Order cards expanded by clinicians. */
  cardViews: number;
  /** Suggestions explicitly accepted. */
  accepts: number;
  /** Suggestions overridden / dismissed. */
  overrides: number;
  /** PA / medical-necessity narratives auto-generated. */
  narrativesGenerated: number;
  /** ServiceRequest write-backs posted to the EHR. */
  writebacks: number;
  /** Estimated clinician clicks saved by silent automation. */
  clicksSavedEstimate: number;
}

/** Estimated clicks to hand-write one PA medical-necessity narrative in the EHR. */
const CLICKS_PER_NARRATIVE = 14;
/** Estimated clicks to manually re-code an order (modality, ICD-10, references). */
const CLICKS_PER_WRITEBACK = 9;

/**
 * Aggregates rail automation events from `logs/rail-events-*.jsonl` into the
 * dashboard stats. Read-only and non-throwing — missing/corrupt files count as zero.
 */
export async function readAutomationStats(): Promise<AutomationStats> {
  const stats: AutomationStats = {
    railRenders: 0,
    cardViews: 0,
    accepts: 0,
    overrides: 0,
    narrativesGenerated: 0,
    writebacks: 0,
    clicksSavedEstimate: 0,
  };

  let files: string[] = [];
  try {
    files = (await readdir(LOG_DIR)).filter(
      (f) => f.startsWith('rail-events-') && f.endsWith('.jsonl'),
    );
  } catch {
    return stats;
  }

  for (const file of files) {
    let content = '';
    try {
      content = await readFile(join(LOG_DIR, file), 'utf8');
    } catch {
      continue;
    }
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      let entry: Partial<RailEventLogEntry>;
      try {
        entry = JSON.parse(line) as Partial<RailEventLogEntry>;
      } catch {
        continue;
      }
      switch (entry.eventType) {
        case 'rail_render':
          stats.railRenders += 1;
          break;
        case 'card_view':
          stats.cardViews += 1;
          break;
        case 'card_accept':
          stats.accepts += 1;
          break;
        case 'card_override':
          stats.overrides += 1;
          break;
        case 'narrative_generated':
          stats.narrativesGenerated += 1;
          break;
        case 'writeback_posted':
          stats.writebacks += 1;
          break;
        default:
          break;
      }
    }
  }

  stats.clicksSavedEstimate =
    stats.narrativesGenerated * CLICKS_PER_NARRATIVE + stats.writebacks * CLICKS_PER_WRITEBACK;
  return stats;
}

/**
 * Shared JSONL append with non-throwing error handling.
 *
 * @param filePath - Target JSONL file.
 * @param entry - Serializable log entry.
 */
async function appendLine(filePath: string, entry: unknown): Promise<void> {
  const line = `${JSON.stringify(entry)}\n`;
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(filePath, line, 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[decision-log] Failed to write ${filePath}: ${message}`);
  }
}
