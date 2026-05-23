import type { ClinicalScenario } from "@/lib/demos/clin/types";
import type { AIIEOrder } from "@/lib/types/aiie";

/** Demo CPT codes for proposed orders in the CLIN control sheet. */
function demoProposedCpt(modality: string, bodyPart: string): string | undefined {
  const mod = modality.toLowerCase();
  const part = bodyPart.toLowerCase();
  if (mod.includes("mri") && part.includes("lumbar")) {
    return "72148";
  }
  if (mod.includes("ct") && part.includes("head")) {
    return "70450";
  }
  return undefined;
}

/**
 * Maps a CLIN demo scenario to an {@link AIIEOrder} for redundancy evaluation.
 *
 * @param scenario - Clinical demo scenario with proposed imaging.
 */
export function clinicalScenarioToAIIEOrder(scenario: ClinicalScenario): AIIEOrder {
  const { modality, bodyPart, indication } = scenario.proposedImaging;
  const procedureParts = [modality, bodyPart, indication].filter((s) => s.trim().length > 0);
  return {
    cpt: demoProposedCpt(modality, bodyPart),
    modality,
    bodyPart,
    procedure: procedureParts.join(" — ").trim(),
  };
}
