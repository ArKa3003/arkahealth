/**
 * Server-side DEMO_MODE flag for ARKA-INS investor demos and offline CDS behavior.
 *
 * Set `DEMO_MODE=true` in the environment (e.g. `.env.local`). For client UI watermarks,
 * also set `NEXT_PUBLIC_DEMO_MODE=true` so Next.js can expose it to the browser.
 */

/**
 * @returns Whether strict production persistence and destructive routes should be disabled.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Client-safe demo flag (requires `NEXT_PUBLIC_DEMO_MODE`).
 *
 * @returns Whether to show subtle demo chrome in the browser.
 */
export function isDemoModeClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
