/**
 * Aggregated AIIE Clinical Knowledge Matrix region scenarios.
 */

import type { ClinicalScenario } from "../types";
import { ABDOMEN_SCENARIOS } from "./abdomen";
import { BREAST_SCENARIOS } from "./breast";
import { CARDIAC_SCENARIOS } from "./cardiac";
import { CHEST_SCENARIOS } from "./chest";
import { GU_RENAL_SCENARIOS } from "./gu-renal";
import { HEAD_BRAIN_SCENARIOS } from "./head-brain";
import { HEAD_FACE_NECK_SCENARIOS } from "./head-face-neck";
import { MSK_LOWER_SCENARIOS } from "./msk-lower";
import { MSK_UPPER_SCENARIOS } from "./msk-upper";
import { PELVIS_SCENARIOS } from "./pelvis";
import { SPINE_CERVICAL_SCENARIOS } from "./spine-cervical";
import { SPINE_LUMBAR_SCENARIOS } from "./spine-lumbar";
import { SPINE_THORACIC_SCENARIOS } from "./spine-thoracic";
import { VASCULAR_SCENARIOS } from "./vascular";

/** All clinical scenarios across body regions in the knowledge matrix. */
export const ALL_SCENARIOS: ClinicalScenario[] = [
  ...HEAD_BRAIN_SCENARIOS,
  ...HEAD_FACE_NECK_SCENARIOS,
  ...SPINE_CERVICAL_SCENARIOS,
  ...SPINE_THORACIC_SCENARIOS,
  ...SPINE_LUMBAR_SCENARIOS,
  ...CHEST_SCENARIOS,
  ...CARDIAC_SCENARIOS,
  ...ABDOMEN_SCENARIOS,
  ...PELVIS_SCENARIOS,
  ...GU_RENAL_SCENARIOS,
  ...MSK_UPPER_SCENARIOS,
  ...MSK_LOWER_SCENARIOS,
  ...VASCULAR_SCENARIOS,
  ...BREAST_SCENARIOS,
];

/** Total number of clinical scenarios in the matrix. */
export const SCENARIO_COUNT = ALL_SCENARIOS.length;

export {
  ABDOMEN_SCENARIOS,
  BREAST_SCENARIOS,
  CARDIAC_SCENARIOS,
  CHEST_SCENARIOS,
  GU_RENAL_SCENARIOS,
  HEAD_BRAIN_SCENARIOS,
  HEAD_FACE_NECK_SCENARIOS,
  MSK_LOWER_SCENARIOS,
  MSK_UPPER_SCENARIOS,
  PELVIS_SCENARIOS,
  SPINE_CERVICAL_SCENARIOS,
  SPINE_LUMBAR_SCENARIOS,
  SPINE_THORACIC_SCENARIOS,
  VASCULAR_SCENARIOS,
};

/**
 * Dev-only integrity checks for scenario ids and evidence slugs.
 */
function assertMatrixIntegrity(scenarios: ClinicalScenario[]): void {
  const scenarioIds = new Set<string>();
  const evidenceSlugs = new Set<string>();

  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.id)) {
      throw new Error(
        `AIIE Clinical Knowledge Matrix: duplicate scenario id "${scenario.id}"`,
      );
    }
    scenarioIds.add(scenario.id);

    for (const variant of scenario.variants) {
      const slug = variant.ratings[0]?.evidenceSlug;
      if (!slug) {
        throw new Error(
          `AIIE Clinical Knowledge Matrix: variant "${scenario.id}/${variant.id}" has no ratings`,
        );
      }
      if (evidenceSlugs.has(slug)) {
        throw new Error(
          `AIIE Clinical Knowledge Matrix: duplicate evidence slug "${slug}"`,
        );
      }
      evidenceSlugs.add(slug);

      const slugMismatch = variant.ratings.some((r) => r.evidenceSlug !== slug);
      if (slugMismatch) {
        throw new Error(
          `AIIE Clinical Knowledge Matrix: inconsistent evidence slugs in variant "${scenario.id}/${variant.id}"`,
        );
      }
    }
  }
}

if (process.env.NODE_ENV === "development") {
  assertMatrixIntegrity(ALL_SCENARIOS);
}
