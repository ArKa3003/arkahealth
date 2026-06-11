/**
 * Evidence registry completeness gate + stub scaffolder.
 *
 * Diffs the evidenceSlugs the AIIE Knowledge Matrix can emit against the
 * registry keys in lib/evidence/registry.ts:
 *   - prints a ready-to-paste `defineEntry` scaffold for every missing slug;
 *   - exits 1 when any slug is missing (CI fails on missing entries);
 *   - also reports registry entries that no longer correspond to a matrix slug
 *     (informational — concept pages and aliases are expected extras).
 *
 * Usage: npm run evidence:stubs
 */

import { collectMatrixEvidenceSlugs } from "../lib/evidence/matrix-slugs";
import { ALL_SCENARIOS } from "../lib/aiie/knowledge-matrix";
import { EVIDENCE_REGISTRY } from "../lib/evidence/registry";

/** Finds the region for a matrix slug by scanning scenario ratings. */
function regionForSlug(slug: string): string {
  for (const scenario of ALL_SCENARIOS) {
    for (const variant of scenario.variants) {
      if (variant.ratings.some((r) => r.evidenceSlug === slug)) {
        return scenario.region;
      }
    }
  }
  return "general";
}

/** Renders a defineEntry scaffold for a missing slug. */
function scaffold(slug: string): string {
  const title = slug
    .replace(/-/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
  return [
    "  defineEntry({",
    `    slug: "${slug}",`,
    `    region: "${regionForSlug(slug)}",`,
    `    title: "${title} — TODO",`,
    '    summary: "TODO: 2–3 sentence plain-language synthesis.",',
    '    clinicalBottomLine: "TODO: single actionable conclusion.",',
    '    keyPoints: ["TODO"],',
    "    citations: [CIT.acrAc],",
    "    relatedSlugs: [],",
    "  }),",
  ].join("\n");
}

function main(): void {
  const matrixSlugs = [...collectMatrixEvidenceSlugs()].sort();
  const registrySlugs = new Set(Object.keys(EVIDENCE_REGISTRY));

  const missing = matrixSlugs.filter((slug) => !registrySlugs.has(slug));
  const matrixSet = new Set(matrixSlugs);
  const extras = [...registrySlugs].filter((slug) => !matrixSet.has(slug)).sort();

  console.log(`Matrix evidence slugs: ${matrixSlugs.length}`);
  console.log(`Registry entries:      ${registrySlugs.size}`);
  if (extras.length > 0) {
    console.log(
      `Registry-only entries (concept pages, expected): ${extras.length}\n  ${extras.join("\n  ")}`,
    );
  }

  if (missing.length === 0) {
    console.log("\nOK — every matrix evidenceSlug resolves in the evidence registry.");
    return;
  }

  console.error(`\nMISSING ${missing.length} registry entr${missing.length === 1 ? "y" : "ies"}:`);
  for (const slug of missing) {
    console.error(`  - ${slug}`);
  }
  console.error(
    "\nScaffolds (paste into the matching lib/evidence/entries/* file and fill in real content):\n",
  );
  for (const slug of missing) {
    console.error(scaffold(slug));
  }
  process.exitCode = 1;
}

main();
