const RADIOPAEDIA_MIN_INTERVAL_MS = 3000;

let radiopaediaLastRequestAt = 0;

/**
 * Resets the Radiopaedia client rate limiter (tests only).
 */
export function resetRadiopaediaRateLimiterForTests(): void {
  radiopaediaLastRequestAt = 0;
}

/**
 * Enforces at most one Radiopaedia upstream request per 3 seconds.
 */
export async function waitRadiopaediaRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - radiopaediaLastRequestAt;
  if (elapsed < RADIOPAEDIA_MIN_INTERVAL_MS) {
    await new Promise((resolve) => {
      setTimeout(resolve, RADIOPAEDIA_MIN_INTERVAL_MS - elapsed);
    });
  }
  radiopaediaLastRequestAt = Date.now();
}

export { RADIOPAEDIA_MIN_INTERVAL_MS };
