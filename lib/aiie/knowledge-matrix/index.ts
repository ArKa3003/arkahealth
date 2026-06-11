/**
 * AIIE Clinical Knowledge Matrix — public API.
 *
 * Deterministic clinical appropriateness knowledge base owned by ARKA. Matrix
 * version is stamped into every score for auditability.
 */

export { ALL_SCENARIOS, SCENARIO_COUNT } from "./regions";
export { normalizeOrderContext } from "./normalizer";
export type { OrderReasonCodings } from "./normalizer";
export { resolveRating } from "./resolver";

export type {
  AppropriatenessRating,
  BodyRegion,
  ClinicalScenario,
  MatchTier,
  MatchedScenario,
  MatchedVariant,
  Modality,
  ModalityRating,
  NormalizedOrderContext,
  NumericRange,
  RadiationLevel,
  RedFlagKey,
  ResolvedRating,
  ScenarioVariant,
  VariantCriteria,
} from "./types";

/**
 * Semantic version of the AIIE Clinical Knowledge Matrix bundled with the engine.
 * Stamped into every AIIE score for audit trails and regression testing.
 */
export const MATRIX_VERSION = "1.0.0" as const;
