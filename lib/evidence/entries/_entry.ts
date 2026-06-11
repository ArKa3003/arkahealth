/**
 * Factory for AIIE evidence registry entries — applies the shared editorial
 * review date so individual entry files stay data-only.
 */

import type { EvidenceEntry } from "@/lib/evidence/types";

/** ISO date of the current AIIE editorial review pass over the registry. */
export const EVIDENCE_LAST_REVIEWED = "2026-06-01";

/**
 * Builds a registry entry, defaulting `lastReviewed` to the shared review date.
 *
 * @param entry - Entry fields; `lastReviewed` may be omitted.
 */
export function defineEntry(
  entry: Omit<EvidenceEntry, "lastReviewed"> & { lastReviewed?: string },
): EvidenceEntry {
  return { lastReviewed: EVIDENCE_LAST_REVIEWED, ...entry };
}
