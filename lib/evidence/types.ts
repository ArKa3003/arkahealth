/**
 * AIIE Evidence Registry — type definitions.
 *
 * The registry is the first-party evidence layer behind every `/evidence/[slug]`
 * link emitted by the Knowledge Matrix and CDS cards. Pages and the engine are
 * ARKA/AIIE-branded; the citations underneath point at real external literature.
 */

import type { BodyRegion } from "@/lib/aiie/knowledge-matrix";

/**
 * Grouping key for the evidence index. Matrix regions plus a cross-cutting
 * "general" group for concept pages (red flags, pregnancy, radiation safety).
 */
export type EvidenceRegion = BodyRegion | "general";

/**
 * One resolvable external citation underneath an AIIE evidence entry.
 */
export interface EvidenceCitation {
  /** Human-readable citation line (authors / title abbreviation). */
  label: string;
  /** Publishing body or journal. */
  source: string;
  /** Publication or last-major-update year. */
  year: number;
  /** Resolvable https URL (society guideline page, USPSTF, or doi.org). */
  url: string;
  /** DOI when the citation is a published article. */
  doi?: string;
}

/**
 * One entry in the AIIE evidence registry, keyed by `evidenceSlug`.
 */
export interface EvidenceEntry {
  /** Stable kebab-case slug — identical to the Knowledge Matrix `evidenceSlug`. */
  slug: string;
  /** Clinician-facing page title. */
  title: string;
  /** 2–3 sentence plain-language synthesis of the evidence. */
  summary: string;
  /** Single-sentence actionable conclusion shown in the highlighted card. */
  clinicalBottomLine: string;
  /** Bulleted key points supporting the bottom line. */
  keyPoints: string[];
  /** Real, resolvable external literature underneath the AIIE synthesis. */
  citations: EvidenceCitation[];
  /** Slugs of related registry entries rendered as chips. */
  relatedSlugs: string[];
  /** ISO date (YYYY-MM-DD) of the last AIIE editorial review. */
  lastReviewed: string;
  /** Index grouping region. */
  region: EvidenceRegion;
}
