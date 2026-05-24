/**
 * @file scoring-engine.ts
 * @description Rule-based AIIE-style appropriateness scoring. Used as fallback when the
 *   Python XGBoost ML service is unavailable. Produces 1–9 scale and category consistent
 *   with the ML model output.
 */

import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { MLPrediction, SHAPValues, SHAPFeatureContribution } from '@/lib/cds-platform/ml/types';
import { extractFeatures, getFeatureNames } from '@/lib/cds-platform/ml/feature-engineer';

const AIIE_MODEL_VERSION = '1.0.0-rulebased';

/** Score categories (1–9) matching Python decode_prediction */
const SCORE_CATEGORIES: Array<[number, number, string]> = [
  [1.0, 1.9, 'usually_not_appropriate'],
  [2.0, 2.9, 'may_be_appropriate'],
  [3.0, 3.9, 'usually_not_appropriate'],
  [4.0, 4.9, 'may_be_appropriate'],
  [5.0, 5.9, 'usually_appropriate'],
  [6.0, 6.9, 'usually_appropriate'],
  [7.0, 7.9, 'usually_appropriate'],
  [8.0, 8.9, 'usually_appropriate'],
  [9.0, 9.0, 'usually_appropriate'],
];

function getFeature(features: Record<string, number>, name: string): number {
  const v = features[name];
  return typeof v === 'number' ? v : 0;
}

function decodeCategory(score: number): string {
  const s = Math.max(1, Math.min(9, score));
  for (const [low, high, category] of SCORE_CATEGORIES) {
    if (s >= low && s <= high) return category;
  }
  return 'usually_appropriate';
}

/**
 * Rule-based appropriateness score (1–9) from feature vector.
 * Mirrors ml-service/model/fallback.py logic.
 */
function ruleBasedScore(features: Record<string, number>): number {
  let score = 5.0;

  if (getFeature(features, 'has_red_flags') === 1) score -= 1.5;
  if (getFeature(features, 'neurological_deficit') === 1) score -= 0.8;
  if (getFeature(features, 'fever_present') === 1) score -= 0.3;
  if (getFeature(features, 'cancer_history') === 1) score += 0.2;

  const symptomDays = getFeature(features, 'symptom_duration_days');
  if (symptomDays >= 0 && symptomDays < 7 && getFeature(features, 'has_red_flags') === 0) score += 0.4;
  else if (symptomDays >= 0 && symptomDays < 90) score += 0.2;

  if (getFeature(features, 'same_modality_prior_30d') === 1) score -= 0.5;
  if (getFeature(features, 'same_body_site_prior_30d') === 1) score -= 0.3;
  const prior90 = getFeature(features, 'prior_imaging_count_90d');
  if (prior90 > 2) score -= 0.4;

  const urgency = getFeature(features, 'urgency_level');
  if (urgency >= 2) score += 0.5;
  else if (urgency === 1) score += 0.2;

  if (getFeature(features, 'conservative_tx_tried') === 1) score += 0.3;
  if (getFeature(features, 'imaging_in_problem_list') === 1) score += 0.2;

  if (getFeature(features, 'is_pregnant') === 1) score -= 0.2;
  if (getFeature(features, 'has_contrast_allergy') === 1) score -= 0.2;

  return Math.max(1, Math.min(9, Math.round(score * 100) / 100));
}

/**
 * Build placeholder SHAP values for fallback (no real SHAP; zero contributions).
 */
function placeholderShap(features: Record<string, number>): SHAPValues {
  const featureNames = getFeatureNames();
  const featureContributions: SHAPFeatureContribution[] = featureNames.map((feature) => ({
    feature,
    shapValue: 0,
    featureValue: features[feature] ?? 0,
    direction: 'neutral',
  }));
  return {
    baseValue: 5.0,
    featureContributions,
  };
}

/**
 * Score a clinical scenario using the AIIE rule-based engine.
 * Use when the Python ML service is unavailable.
 */
export function scoreScenario(scenario: ClinicalScenario): MLPrediction {
  const start = performance.now();
  const features = extractFeatures(scenario);
  const score = ruleBasedScore(features);
  const category = decodeCategory(score);
  const latencyMs = performance.now() - start;
  const predictionId = `aiie-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  return {
    score: Math.round(score * 100) / 100,
    category,
    confidence: 0.7,
    shapValues: placeholderShap(features),
    modelVersion: AIIE_MODEL_VERSION,
    predictionId,
    latencyMs,
    usedFallback: true,
  };
}
