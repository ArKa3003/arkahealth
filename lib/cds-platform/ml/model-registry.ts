/**
 * @file model-registry.ts
 * @description Model version management: active model, A/B testing between versions, and prediction logging for monitoring.
 */

import type { ModelVersion, MLPrediction, FeatureVector } from './types';

/** In-memory active model (set by deployment or config) */
let activeModel: ModelVersion | null = null;

/** Optional alternate model for A/B testing (e.g. 10% traffic) */
let alternateModel: ModelVersion | null = null;

/** A/B traffic fraction for alternate model (0–1). 0 = no A/B. */
let alternateTrafficFraction = 0;

/** In-memory prediction log for monitoring (last N entries) */
const PREDICTION_LOG_MAX = 1000;
const predictionLog: Array<{
  timestamp: string;
  predictionId: string;
  modelVersion: string;
  score: number;
  usedFallback: boolean;
  latencyMs: number;
  featureSummary?: Record<string, number>;
}> = [];

/**
 * Returns the currently active model version (used for predictions and audit).
 */
export function getActiveModel(): ModelVersion | null {
  return activeModel;
}

/**
 * Registers or sets the active model version (e.g. after deployment).
 */
export function setActiveModel(version: ModelVersion): void {
  activeModel = version;
}

/**
 * Sets the alternate model and traffic fraction for A/B testing.
 * @param version - Alternate model version (null to disable A/B)
 * @param fraction - Fraction of requests (0–1) to send to alternate
 */
export function setAlternateModel(version: ModelVersion | null, fraction: number): void {
  alternateModel = version;
  alternateTrafficFraction = Math.max(0, Math.min(1, fraction));
}

/**
 * Returns which model version to use for this request (for A/B testing).
 * If A/B is configured, uses random roll; otherwise returns active model.
 */
export function getModelForRequest(): ModelVersion | null {
  if (alternateModel != null && alternateTrafficFraction > 0 && Math.random() < alternateTrafficFraction) {
    return alternateModel;
  }
  return activeModel;
}

/**
 * Lists all known model versions (active + alternate if set).
 */
export function listModels(): ModelVersion[] {
  const set = new Map<string, ModelVersion>();
  if (activeModel) set.set(activeModel.id, activeModel);
  if (alternateModel) set.set(alternateModel.id, alternateModel);
  return Array.from(set.values());
}

/**
 * Log a prediction for monitoring. Appends to in-memory log (bounded size).
 */
export function logPrediction(prediction: MLPrediction, features: FeatureVector): void {
  const entry = {
    timestamp: new Date().toISOString(),
    predictionId: prediction.predictionId,
    modelVersion: prediction.modelVersion,
    score: prediction.score,
    usedFallback: prediction.usedFallback,
    latencyMs: prediction.latencyMs,
    featureSummary: features,
  };
  predictionLog.push(entry);
  if (predictionLog.length > PREDICTION_LOG_MAX) {
    predictionLog.shift();
  }
}

/**
 * Returns recent prediction log entries (for monitoring dashboards).
 */
export function getPredictionLog(limit = 100): typeof predictionLog {
  return predictionLog.slice(-limit);
}
