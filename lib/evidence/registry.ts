/**
 * AIIE Evidence Registry — first-party evidence layer behind `/evidence/[slug]`.
 *
 * Keyed by the same `evidenceSlug` values the Knowledge Matrix emits. Every
 * matrix slug MUST resolve here (enforced by __tests__/evidence-links.test.ts
 * and scripts/generate-evidence-stubs.ts). The page and engine are ARKA/AIIE
 * branded; the citations underneath point at real external literature.
 */

import type { BodyRegion } from "@/lib/aiie/knowledge-matrix";
import { REGION_DISPLAY_NAMES } from "@/lib/aiie/knowledge-matrix/regions/defaults";

import type { EvidenceEntry, EvidenceRegion } from "./types";
import { MATRIX_REGIONS, regionDefaultEvidenceSlug } from "./matrix-slugs";
import { defineEntry } from "./entries/_entry";
import { CIT } from "./entries/citations";
import { ABDOMEN_ENTRIES } from "./entries/abdomen";
import { BREAST_ENTRIES } from "./entries/breast";
import { CARDIAC_ENTRIES } from "./entries/cardiac";
import { CHEST_ENTRIES } from "./entries/chest";
import { GENERAL_ENTRIES } from "./entries/general";
import { GU_RENAL_ENTRIES } from "./entries/gu-renal";
import { HEAD_BRAIN_ENTRIES } from "./entries/head-brain";
import { HEAD_FACE_NECK_ENTRIES } from "./entries/head-face-neck";
import { MSK_ENTRIES } from "./entries/msk";
import { PELVIS_ENTRIES } from "./entries/pelvis";
import { SPINE_ENTRIES } from "./entries/spine";
import { VASCULAR_ENTRIES } from "./entries/vascular";

export type { EvidenceCitation, EvidenceEntry, EvidenceRegion } from "./types";

/** Display labels for evidence index groups (matrix regions + cross-cutting). */
export const EVIDENCE_REGION_LABELS: Record<EvidenceRegion, string> = {
  ...REGION_DISPLAY_NAMES,
  general: "Cross-Cutting Principles",
};

/**
 * Builds the Tier 3 region-default registry entry for a body region — the
 * page behind `aiie-region-default-*` slugs emitted when an order resolves
 * without a scenario-level match.
 */
function buildRegionDefaultEntry(region: BodyRegion): EvidenceEntry {
  const label = REGION_DISPLAY_NAMES[region];
  return defineEntry({
    slug: regionDefaultEvidenceSlug(region),
    region,
    title: `${label} imaging — region default (appropriateness indeterminate)`,
    summary:
      `This order matched the ${label.toLowerCase()} region but no specific clinical scenario in the AIIE Knowledge Matrix, so a conservative mid-scale rating was applied. ` +
      "The rating neither endorses nor blocks the order; it indicates the documentation lacked the structured indication detail needed for a scenario-level appropriateness rating.",
    clinicalBottomLine:
      `Document the presenting complaint, symptom duration, red-flag status, and prior workup to obtain a definitive scenario-level rating for ${label.toLowerCase()} imaging.`,
    keyPoints: [
      "Region defaults are deliberately conservative so unusual region/modality pairings never receive an unearned endorsement.",
      "ACR Appropriateness Criteria cover the common clinical scenarios for this region — richer documentation lets AIIE match one.",
      "The match tier (region_default) is stamped into the audit log for this decision.",
    ],
    citations: [CIT.acrAc, CIT.randUcla],
    relatedSlugs: ["aiie-indeterminate-order", "conservative-care-before-imaging"],
  });
}

const ALL_ENTRIES: EvidenceEntry[] = [
  ...HEAD_BRAIN_ENTRIES,
  ...HEAD_FACE_NECK_ENTRIES,
  ...SPINE_ENTRIES,
  ...CHEST_ENTRIES,
  ...CARDIAC_ENTRIES,
  ...ABDOMEN_ENTRIES,
  ...PELVIS_ENTRIES,
  ...GU_RENAL_ENTRIES,
  ...MSK_ENTRIES,
  ...BREAST_ENTRIES,
  ...VASCULAR_ENTRIES,
  ...GENERAL_ENTRIES,
  ...MATRIX_REGIONS.map(buildRegionDefaultEntry),
];

/** The full registry, keyed by canonical evidenceSlug. */
export const EVIDENCE_REGISTRY: Readonly<Record<string, EvidenceEntry>> = Object.freeze(
  Object.fromEntries(ALL_ENTRIES.map((entry) => [entry.slug, entry])),
);

/** Total registered evidence topics (canonical slugs only). */
export function evidenceRegistryCount(): number {
  return Object.keys(EVIDENCE_REGISTRY).length;
}

/**
 * Aliases from concept-level slugs emitted by phase UIs (CLIN SHAP factor rows,
 * ED red-flag chips) to canonical registry slugs. The `/evidence/[slug]` route
 * resolves these with a redirect so no clinical link dead-ends.
 */
export const EVIDENCE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  // ED red-flag chips (extractEdRedFlags → factorEvidenceSlug)
  "thunderclap-onset": "head-brain-acute-headache-thunderclap",
  "tearing-chest-pain": "chest-acute-chest-pain-aortic-dissection",
  "neuro-deficit": "head-brain-acute-headache-neuro-deficit",
  fever: "head-brain-acute-headache-fever-immunocompromised",
  "weight-loss": "spine-lumbar-low-back-pain-cancer-history",
  "cancer-history": "spine-lumbar-low-back-pain-cancer-history",
  "recent-trauma": "head-brain-head-trauma-adult-high-risk",
  "sudden-onset": "head-brain-acute-headache-thunderclap",
  "meningeal-signs": "head-brain-acute-headache-fever-immunocompromised",
  immunocompromised: "head-brain-acute-headache-fever-immunocompromised",
  "progressive-symptoms": "head-brain-acute-headache-neuro-deficit",
  // CLIN SHAP factor rows (factorEvidenceSlug over AIIE factor names)
  "symptom-duration": "conservative-care-before-imaging",
  "history-of-cancer": "spine-lumbar-low-back-pain-cancer-history",
  "neurological-deficit": "head-brain-acute-headache-neuro-deficit",
  "neurological-signs": "head-brain-acute-headache-neuro-deficit",
  "age-50": "head-brain-acute-headache-new-over-50",
  "new-headache-age-50": "head-brain-acute-headache-new-over-50",
  "conservative-management": "conservative-care-before-imaging",
  "red-flags": "red-flag-symptoms",
  "red-flags-present": "red-flag-symptoms",
  "pregnancy-status": "imaging-in-pregnancy",
  "pregnancy-ct": "imaging-in-pregnancy",
  "pediatric-ultrasound": "pediatric-imaging-radiation-safety",
  "pediatric-ct": "pediatric-imaging-radiation-safety",
  "onset-pattern": "head-brain-acute-headache-thunderclap",
  "chronic-stable-pattern": "head-brain-acute-headache-chronic-stable",
  "suspected-appendicitis": "abdomen-rlq-appendicitis-adult-ct",
});

/**
 * Looks up a registry entry by canonical slug.
 *
 * @param slug - Canonical evidenceSlug.
 * @returns The entry, or null when the slug is not registered.
 */
export function getEvidenceEntry(slug: string): EvidenceEntry | null {
  return EVIDENCE_REGISTRY[slug] ?? null;
}

/**
 * Resolves a slug (canonical or alias) to its canonical registry slug.
 *
 * @param slug - Canonical slug or UI alias.
 * @returns Canonical slug, or null when neither a canonical entry nor an alias exists.
 */
export function resolveEvidenceSlug(slug: string): string | null {
  if (EVIDENCE_REGISTRY[slug]) return slug;
  const target = EVIDENCE_ALIASES[slug];
  return target && EVIDENCE_REGISTRY[target] ? target : null;
}

/**
 * Lists all registry entries in stable region-then-title order.
 */
export function listEvidenceEntries(): EvidenceEntry[] {
  return [...ALL_ENTRIES].sort((a, b) =>
    a.region === b.region
      ? a.title.localeCompare(b.title)
      : EVIDENCE_REGION_LABELS[a.region].localeCompare(EVIDENCE_REGION_LABELS[b.region]),
  );
}

/** One evidence index group (region label + sorted entries). */
export interface EvidenceRegionGroup {
  region: EvidenceRegion;
  label: string;
  entries: EvidenceEntry[];
}

/**
 * Groups all registry entries by region for the evidence index, with the
 * cross-cutting group first and anatomic regions alphabetical after it.
 */
export function evidenceEntriesByRegion(): EvidenceRegionGroup[] {
  const groups = new Map<EvidenceRegion, EvidenceEntry[]>();
  for (const entry of listEvidenceEntries()) {
    const list = groups.get(entry.region) ?? [];
    list.push(entry);
    groups.set(entry.region, list);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => {
    if (a === "general") return -1;
    if (b === "general") return 1;
    return EVIDENCE_REGION_LABELS[a].localeCompare(EVIDENCE_REGION_LABELS[b]);
  });
  return ordered.map(([region, entries]) => ({
    region,
    label: EVIDENCE_REGION_LABELS[region],
    entries,
  }));
}
