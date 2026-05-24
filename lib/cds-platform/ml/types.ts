/**
 * @file types.ts
 * @description ML pipeline TypeScript types: feature vectors, model input/output, SHAP, model registry.
 */

/** Feature vector sent to XGBoost (all 23 features as numbers; keys match Python features.py) */
export type FeatureVector = Record<string, number>;

/** Request to the internal predict API */
export interface PredictRequest {
  features: FeatureVector;
  /** Optional: return SHAP values */
  explain?: boolean;
}

/** Single prediction result from Python service (raw) */
export interface PredictResult {
  /** Appropriateness score (1–9) */
  score: number;
  /** Optional class label */
  label?: string;
  /** Optional SHAP values per feature when explain=true */
  shap?: Record<string, number>;
}

/** Response from ML predict endpoint (Python API shape) */
export interface PredictResponse {
  result: PredictResult;
  modelVersion?: string;
  latencyMs?: number;
}

/** One feature contribution for SHAP explanation */
export interface SHAPFeatureContribution {
  feature: string;
  shapValue: number;
  featureValue: number;
  direction?: 'positive' | 'negative' | 'neutral';
}

/** SHAP explanation structure (matches Python ShapValues) */
export interface SHAPValues {
  baseValue: number;
  featureContributions: SHAPFeatureContribution[];
}

/** Full ML prediction returned by XGBoostClient (and AIIE fallback) */
export interface MLPrediction {
  score: number;
  category: string;
  confidence: number;
  shapValues: SHAPValues;
  modelVersion: string;
  predictionId: string;
  latencyMs: number;
  usedFallback: boolean;
}

/** Model metadata for registry and /model/info */
export interface ModelInfo {
  version: string;
  featureCount: number;
  trainedAt: string;
  metrics?: Record<string, number>;
}

/** Model version metadata for registry */
export interface ModelVersion {
  id: string;
  version: string;
  path: string;
  trainedAt: string;
  metrics?: Record<string, number>;
}
