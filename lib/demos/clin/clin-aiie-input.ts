import type { ClinicalScenario } from "@/lib/demos/clin/types";
import type { AIIEInput, AIIEClinicalFactors, AIIERedFlags } from "@/lib/types/aiie";
import { clinicalScenarioToAIIEOrder } from "@/lib/demos/clin/clin-aiie-order";

/**
 * Maps demo red-flag labels to {@link AIIERedFlags} booleans.
 */
function mapRedFlags(scenario: ClinicalScenario): AIIERedFlags {
  const reds = scenario.redFlags ?? [];
  const f = (key: string) =>
    reds.some((r) => r.present && r.flag.toLowerCase().includes(key));

  return {
    cancerHistory: f("cancer"),
    neurologicalDeficit: f("neuro"),
    fever: f("fever"),
    weightLoss: f("weight loss"),
    trauma: f("trauma"),
    immunocompromised: f("immuno"),
    ivDrugUse: f("iv drug"),
    osteoporosis: f("osteoporosis"),
    ageOver50: f("age") || scenario.age > 50,
    ageUnder18: f("pediatric") || scenario.age < 18,
    progressiveSymptoms: f("progressive"),
    bladderBowelDysfunction: f("bladder") || f("bowel"),
    suddenOnset: f("sudden"),
  };
}

/**
 * Builds structured {@link AIIEClinicalFactors} from a CLIN demo scenario.
 */
export function clinicalScenarioToClinicalFactors(
  scenario: ClinicalScenario,
  overrides?: Partial<AIIEClinicalFactors>,
): AIIEClinicalFactors {
  return {
    chiefComplaint: scenario.chiefComplaint,
    duration: scenario.duration,
    symptoms: scenario.symptoms ?? [],
    redFlags: mapRedFlags(scenario),
    priorImaging: !!(scenario.priorImaging && scenario.priorImaging.length > 0),
    priorImagingTimeframe: scenario.priorImaging?.[0]
      ? `${scenario.priorImaging[0].daysAgo} days ago`
      : undefined,
    conservativeManagementTried: false,
    ...overrides,
  };
}

/**
 * Builds a shared {@link AIIEInput} for scoreOrder and requisition autofill in the CLIN demo.
 *
 * @param scenario - Partial or full clinical scenario from the form.
 * @param factorOverrides - Optional overrides after clinician-confirmed autofill.
 */
export function clinicalScenarioToAIIEInput(
  scenario: ClinicalScenario,
  factorOverrides?: Partial<AIIEClinicalFactors>,
): AIIEInput {
  const clinicalFactors = clinicalScenarioToClinicalFactors(scenario, factorOverrides);
  const order = clinicalScenarioToAIIEOrder(scenario);
  const sex = scenario.sex === "other" ? "male" : scenario.sex;

  return {
    patient: { age: scenario.age, sex },
    clinicalFactors,
    order,
    age: scenario.age,
    sex,
    pregnant: scenario.pregnancyStatus === "pregnant",
    chiefComplaint: scenario.chiefComplaint,
    duration: clinicalFactors.duration,
    symptoms: clinicalFactors.symptoms,
    redFlags: clinicalFactors.redFlags,
    priorImaging: clinicalFactors.priorImaging,
    priorImagingTimeframe: clinicalFactors.priorImagingTimeframe,
    conservativeManagementTried: clinicalFactors.conservativeManagementTried,
    conservativeManagementDuration: clinicalFactors.conservativeManagementDuration,
    requestedModality: scenario.proposedImaging.modality,
    requestedProcedure: order.procedure,
  };
}
