/**
 * @file ml-config.ts
 * @description Server-side ML service configuration from environment variables.
 */

import { XGBoostClient, DEFAULT_ML_SERVICE_URL } from './xgboost-client';

const DEFAULT_ML_TIMEOUT_MS = 5000;

/**
 * Returns whether rule-based fallback is enabled when the ML service is unreachable.
 * FDA Non-Device CDS Criterion 4 requires independent clinician review; fallback must stay on in production.
 */
export function isMlFallbackEnabled(): boolean {
  const raw = typeof process !== 'undefined' ? process.env?.ML_FALLBACK_ENABLED : undefined;
  if (raw === undefined || raw === '') return true;
  return raw.toLowerCase() === 'true' || raw === '1';
}

/**
 * Parses ML service timeout from env (milliseconds).
 */
export function getMlServiceTimeoutMs(): number {
  const raw = typeof process !== 'undefined' ? process.env?.ML_SERVICE_TIMEOUT : undefined;
  if (!raw) return DEFAULT_ML_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ML_TIMEOUT_MS;
}

/**
 * Creates an XGBoostClient using process env (`ML_SERVICE_URL`, `ML_SERVICE_TIMEOUT`).
 */
export function createMlClient(): XGBoostClient {
  return new XGBoostClient({
    baseUrl:
      typeof process !== 'undefined'
        ? process.env?.ML_SERVICE_URL ?? DEFAULT_ML_SERVICE_URL
        : DEFAULT_ML_SERVICE_URL,
    timeout: getMlServiceTimeoutMs(),
  });
}
