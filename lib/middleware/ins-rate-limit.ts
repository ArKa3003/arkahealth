/**
 * In-memory rate limiter for Edge middleware: 100 requests per minute per client key (IP).
 * Suitable for single-region; replace with Redis/Upstash for strict multi-instance limits.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 100;

const buckets = new Map<string, number[]>();

/**
 * @param clientKey - Typically derived from IP (see {@link rateLimitClientKey}).
 * @returns Whether the request is allowed.
 */
export function allowInsMiddlewareRequest(clientKey: string): boolean {
  const now = Date.now();
  const prev = buckets.get(clientKey) ?? [];
  const kept = prev.filter((t) => now - t < WINDOW_MS);
  if (kept.length >= MAX_PER_WINDOW) {
    buckets.set(clientKey, kept);
    return false;
  }
  kept.push(now);
  buckets.set(clientKey, kept);
  return true;
}

/**
 * @param request - Incoming HTTP request.
 * @returns Best-effort client identifier for rate limiting.
 */
export function rateLimitClientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}
