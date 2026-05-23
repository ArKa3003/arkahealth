/**
 * ARKA-INS demo: opt-in wiring of sidebar UI modules to real APIs (see Prompt 23).
 */

export type WireDemoModulesMode = "off" | "on" | "auto";

/**
 * Resolves `NEXT_PUBLIC_WIRE_DEMO_MODULES`: `true` = on, `false` = off, unset = auto (try API, fall back to mock).
 */
export function getWireDemoModulesMode(): WireDemoModulesMode {
  const v = process.env.NEXT_PUBLIC_WIRE_DEMO_MODULES;
  if (v === "true") {
    return "on";
  }
  if (v === "false") {
    return "off";
  }
  return "auto";
}

/**
 * When false, demo modules must not call backend APIs (mock only).
 */
export function isWireDemoModulesOff(): boolean {
  return getWireDemoModulesMode() === "off";
}

/**
 * When true, attempt real API calls (on + auto). Off mode skips network.
 */
export function shouldAttemptWireDemoModules(): boolean {
  return !isWireDemoModulesOff();
}

/**
 * Whether to fall back to mock data after a failed wire attempt (auto mode only; on mode also falls back for resilience).
 */
export function shouldFallbackWireDemoToMockOnError(): boolean {
  return getWireDemoModulesMode() !== "off";
}
