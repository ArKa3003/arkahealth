/**
 * @file timing.ts
 * @description p95 latency instrumentation for CDS Hooks routes. Logs the duration of
 *   every request via pino and warns when a response breaches the 800ms p95 budget.
 *   The scoring hot path is in-memory (Knowledge Matrix + rule-based fallback);
 *   network (ML service, FHIR fetch) is deadline-bounded and fs writes (decision log)
 *   are fire-and-forget, so the budget holds on the cold path.
 */

import pino from 'pino';

const logger = pino({
  name: 'cds-hooks-timing',
  level: process.env.LOG_LEVEL ?? 'info',
});

/** p95 latency budget for CDS Hooks responses (ms). */
export const CDS_P95_BUDGET_MS = 800;

/** Response header carrying the measured handler duration. */
export const CDS_DURATION_HEADER = 'X-ARKA-CDS-Duration-Ms';

/**
 * Wraps a CDS Hooks route handler with per-request timing: logs duration with the
 * service id, warns on p95 budget breaches, and stamps the duration header.
 *
 * @param serviceId - CDS service id (e.g. "arka-clin-appropriateness").
 * @param handler - Route handler to instrument.
 */
export function withCdsTiming<A extends unknown[], R extends Response>(
  serviceId: string,
  handler: (request: Request, ...args: A) => Promise<R>,
): (request: Request, ...args: A) => Promise<R> {
  return async (request: Request, ...args: A): Promise<R> => {
    const startedAt = performance.now();
    const response = await handler(request, ...args);
    const durationMs = Math.round(performance.now() - startedAt);

    if (durationMs > CDS_P95_BUDGET_MS) {
      logger.warn(
        { serviceId, durationMs, budgetMs: CDS_P95_BUDGET_MS, status: response.status },
        'CDS Hooks request exceeded p95 budget',
      );
    } else {
      logger.info({ serviceId, durationMs, status: response.status }, 'CDS Hooks request timed');
    }

    try {
      response.headers.set(CDS_DURATION_HEADER, String(durationMs));
    } catch {
      // Immutable response headers (e.g. streamed) — timing is still logged.
    }
    return response;
  };
}
