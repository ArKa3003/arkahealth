/**
 * Demo-site session cookie — signed JWE via jose (A256GCM).
 * Single principal only; no user database.
 */

import { EncryptJWT, jwtDecrypt } from "jose";

export const ARKA_SESSION_COOKIE = "arka_session" as const;
export const ARKA_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const DEMO_EMAIL_FALLBACK = "demo@getarka.health" as const;
export const DEMO_PASSWORD_FALLBACK = "arka-demo-2026" as const;

export type DemoSessionPayload = {
  email: string;
  sub: "demo-user";
};

export type DemoSessionError = {
  code: string;
  message: string;
};

export type DemoSessionResult<T> =
  | { data: T; error: null }
  | { data: null; error: DemoSessionError };

let cachedKey: { secret: string; key: Uint8Array } | null = null;

/**
 * Resolves demo credentials from environment with documented local fallbacks.
 */
export function getDemoCredentials(): { email: string; password: string } {
  return {
    email: process.env.DEMO_USER_EMAIL ?? DEMO_EMAIL_FALLBACK,
    password: process.env.DEMO_USER_PASSWORD ?? DEMO_PASSWORD_FALLBACK,
  };
}

/**
 * Returns true when supplied credentials match the configured demo user.
 */
export function validateDemoCredentials(email: string, password: string): boolean {
  const demo = getDemoCredentials();
  return email.trim().toLowerCase() === demo.email.trim().toLowerCase() && password === demo.password;
}

async function sessionKey(): Promise<DemoSessionResult<Uint8Array>> {
  const secret =
    process.env.SESSION_SECRET ??
    process.env.EHR_SESSION_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "arka-local-dev-session-secret-change-me-32"
      : undefined);
  if (!secret) {
    return {
      data: null,
      error: { code: "missing_session_secret", message: "SESSION_SECRET is not configured" },
    };
  }
  if (cachedKey?.secret === secret) {
    return { data: cachedKey.key, error: null };
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = new Uint8Array(digest);
  cachedKey = { secret, key };
  return { data: key, error: null };
}

/**
 * Seals a demo session payload into a compact JWE for an httpOnly cookie.
 */
export async function sealDemoSession(
  payload: DemoSessionPayload,
): Promise<DemoSessionResult<string>> {
  const keyResult = await sessionKey();
  if (keyResult.error) return { data: null, error: keyResult.error };
  try {
    const jwe = await new EncryptJWT({ ...payload })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setIssuer("arka-demo")
      .setExpirationTime(`${ARKA_SESSION_MAX_AGE_SECONDS}s`)
      .encrypt(keyResult.data);
    return { data: jwe, error: null };
  } catch {
    return { data: null, error: { code: "seal_failed", message: "Failed to seal session" } };
  }
}

/**
 * Opens and validates a demo session cookie value.
 */
export async function openDemoSession(value: string): Promise<DemoSessionResult<DemoSessionPayload>> {
  const keyResult = await sessionKey();
  if (keyResult.error) return { data: null, error: keyResult.error };
  try {
    const { payload } = await jwtDecrypt(value, keyResult.data, { issuer: "arka-demo" });
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email) {
      return { data: null, error: { code: "invalid_payload", message: "Session payload is invalid" } };
    }
    return { data: { email, sub: "demo-user" }, error: null };
  } catch {
    return { data: null, error: { code: "open_failed", message: "Session is invalid or expired" } };
  }
}
