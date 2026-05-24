/**
 * @file xgboost-client.ts
 * @description TypeScript client for the Python XGBoost ML service (FastAPI). Supports
 *   single/batch prediction with fallback to AIIE rule-based scoring when the service is unavailable.
 */

import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { FeatureVector, MLPrediction, SHAPValues, SHAPFeatureContribution } from './types';
import { extractFeatures } from './feature-engineer';
import { scoreScenario } from '@/lib/cds-platform/scoring-fallback';
import { logPrediction } from './model-registry';

/** Raw response shape from Python POST /predict */
interface PythonPredictResponse {
  appropriateness_score: number;
  appropriateness_category: string;
  confidence: number;
  shap_values: {
    base_value: number;
    feature_contributions: Array<{
      feature: string;
      shap_value: number;
      feature_value: number;
    }>;
  };
  model_version: string;
  prediction_id: string;
}

/** Raw response from Python GET /health */
interface PythonHealthResponse {
  status?: string;
  model_loaded?: boolean;
  model_version?: string;
  feature_count?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_COUNT = 2;

function parsePythonPrediction(
  body: PythonPredictResponse,
  latencyMs: number
): MLPrediction {
  const contribs: SHAPFeatureContribution[] = (body.shap_values?.feature_contributions ?? []).map(
    (c) => ({
      feature: c.feature,
      shapValue: c.shap_value,
      featureValue: c.feature_value,
      direction:
        c.shap_value > 0 ? 'positive' : c.shap_value < 0 ? 'negative' : ('neutral' as const),
    })
  );
  const shapValues: SHAPValues = {
    baseValue: body.shap_values?.base_value ?? 5,
    featureContributions: contribs,
  };
  return {
    score: body.appropriateness_score,
    category: body.appropriateness_category,
    confidence: body.confidence,
    shapValues,
    modelVersion: body.model_version ?? 'unknown',
    predictionId: body.prediction_id ?? '',
    latencyMs,
    usedFallback: false,
  };
}

export class XGBoostClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryCount: number;

  constructor(options: {
    baseUrl: string;
    timeout?: number;
    retryCount?: number;
  }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.retryCount = Math.max(0, options.retryCount ?? DEFAULT_RETRY_COUNT);
  }

  /**
   * Run a single prediction: convert scenario to features, POST to /predict, return MLPrediction.
   * On service failure, falls back to AIIE rule-based scoring.
   */
  async predict(scenario: ClinicalScenario): Promise<MLPrediction> {
    const features = extractFeatures(scenario);
    const start = performance.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        const res = await fetch(`${this.baseUrl}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`ML service returned ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json()) as PythonPredictResponse;
        const latencyMs = performance.now() - start;
        const prediction = parsePythonPrediction(data, latencyMs);
        logPrediction(prediction, features);
        return prediction;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.retryCount) continue;
      }
    }

    const fallback = scoreScenario(scenario);
    logPrediction(fallback, features);
    return fallback;
  }

  /**
   * Batch prediction for validation. Calls /predict/batch; on failure, falls back to
   * AIIE scoring for each scenario.
   */
  async predictBatch(scenarios: ClinicalScenario[]): Promise<MLPrediction[]> {
    if (scenarios.length === 0) return [];

    const featuresList = scenarios.map((s) => extractFeatures(s));
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout + featuresList.length * 100);
      const res = await fetch(`${this.baseUrl}/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features_list: featuresList }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`ML batch returned ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as { predictions: PythonPredictResponse[] };
      const latencyMs = performance.now() - start;
      const perItemMs = data.predictions.length > 0 ? latencyMs / data.predictions.length : 0;
      const predictions: MLPrediction[] = (data.predictions ?? []).map((p, i) => {
        const pred = parsePythonPrediction(p, perItemMs);
        logPrediction(pred, featuresList[i] ?? {});
        return pred;
      });
      return predictions;
    } catch {
      return scenarios.map((scenario) => {
        const pred = scoreScenario(scenario);
        const features = extractFeatures(scenario);
        logPrediction(pred, features);
        return pred;
      });
    }
  }

  /**
   * Health check: GET /health. Returns healthy, modelVersion, and measured latency.
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    modelVersion: string;
    latency: number;
  }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(this.timeout, 5000));
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latency = performance.now() - start;
      if (!res.ok) {
        return { healthy: false, modelVersion: '', latency };
      }
      const data = (await res.json()) as PythonHealthResponse;
      return {
        healthy: data.status === 'ok',
        modelVersion: data.model_version ?? '',
        latency,
      };
    } catch {
      return {
        healthy: false,
        modelVersion: '',
        latency: performance.now() - start,
      };
    }
  }
}

/** Default ML service URL (e.g. http://localhost:8000) */
export const DEFAULT_ML_SERVICE_URL =
  (typeof process !== 'undefined' ? process.env?.ML_SERVICE_URL : undefined) ?? 'http://localhost:8000';

/**
 * Standalone health check (for GET /api/ml/health).
 */
export async function healthCheck(baseUrl?: string): Promise<{
  healthy: boolean;
  modelVersion: string;
  latency: number;
}> {
  const client = new XGBoostClient({
    baseUrl: baseUrl ?? DEFAULT_ML_SERVICE_URL,
    timeout: 5000,
  });
  return client.healthCheck();
}

/**
 * Standalone predict by feature vector (for internal API /api/ml/predict).
 * Does not use fallback; throws if the service is unavailable.
 */
export async function predict(
  features: FeatureVector,
  options?: { baseUrl?: string; explain?: boolean }
): Promise<{ result: MLPrediction; modelVersion?: string; latencyMs?: number }> {
  const base = options?.baseUrl ?? DEFAULT_ML_SERVICE_URL;
  const baseUrl = typeof base === 'string' ? base.replace(/\/$/, '') : DEFAULT_ML_SERVICE_URL.replace(/\/$/, '');
  const start = performance.now();
  const res = await fetch(`${baseUrl}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });
  const latencyMs = performance.now() - start;
  if (!res.ok) {
    throw new Error(`ML service returned ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as PythonPredictResponse;
  const prediction = parsePythonPrediction(data, latencyMs);
  return {
    result: prediction,
    modelVersion: prediction.modelVersion,
    latencyMs: prediction.latencyMs,
  };
}
