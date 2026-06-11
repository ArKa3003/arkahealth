/**
 * @file jwt-validator.ts
 * @description CDS Hooks security-model JWT validation for incoming service calls.
 * Per the CDS Hooks spec, EHR CDS clients sign each request with a JWT carried in
 * the `Authorization: Bearer` header whose protected header points at the
 * client's JWKS via `jku`. ARKA verifies: issuer allowlist → jku allowlist (https
 * + issuer-origin or explicit allowlist) → signature against a cached remote
 * JWKS → audience allowlist.
 *
 * Enforcement is opt-in via CDS_JWT_REQUIRED=1 so local demos and the public
 * sandbox keep working without keys. Edge-runtime safe (no pino, jose only);
 * helpers return `{ data, error }` tuples and never throw.
 */

import {
  createRemoteJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from 'jose';

/** Error shape returned by {@link verifyCdsHooksJwt} (never thrown). */
export interface CdsJwtError {
  /** Stable code: missing_token | invalid_token | issuer_not_allowed | jku_not_allowed | verification_failed. */
  code: string;
  /** Human-readable detail safe to log (never contains the token). */
  message: string;
}

/** `{ data, error }` tuple for JWT verification. */
export type CdsJwtResult =
  | { data: JWTPayload; error: null }
  | { data: null; error: CdsJwtError };

/** Signature algorithms accepted per the CDS Hooks security model. */
const ALLOWED_ALGORITHMS = ['ES384', 'RS384', 'ES256', 'RS256'];

const JWKS_CACHE = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Whether incoming CDS Hooks requests must carry a verifiable JWT
 * (CDS_JWT_REQUIRED=1). Local demos leave this unset.
 */
export function isCdsJwtRequired(): boolean {
  return process.env.CDS_JWT_REQUIRED === '1';
}

function envList(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Issuer allowlist from CDS_JWT_ALLOWED_ISSUERS (comma-separated). */
function allowedIssuers(): string[] {
  return envList('CDS_JWT_ALLOWED_ISSUERS');
}

/**
 * Audience allowlist from CDS_JWT_ALLOWED_AUDIENCES, falling back to the
 * deployment's own base URL (the EHR sets `aud` to the called service URL).
 */
function allowedAudiences(): string[] {
  const configured = envList('CDS_JWT_ALLOWED_AUDIENCES');
  if (configured.length > 0) return configured;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return siteUrl ? [siteUrl.replace(/\/+$/, '')] : [];
}

function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

/** True when `aud` (string or array) intersects the allowlist, prefix-matching service paths. */
function audienceAllowed(aud: JWTPayload['aud'], allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  const audiences = Array.isArray(aud) ? aud : aud ? [aud] : [];
  return audiences.some((a) => allowlist.some((allowed) => a === allowed || a.startsWith(allowed)));
}

function cachedJwks(jku: string): ReturnType<typeof createRemoteJWKSet> {
  const existing = JWKS_CACHE.get(jku);
  if (existing) return existing;
  const jwks = createRemoteJWKSet(new URL(jku), {
    cacheMaxAge: 10 * 60 * 1000,
    cooldownDuration: 30 * 1000,
  });
  JWKS_CACHE.set(jku, jwks);
  return jwks;
}

/**
 * Verifies the CDS Hooks request JWT from an `Authorization: Bearer` header value.
 *
 * @param authorizationHeader - Raw Authorization header (or null when absent).
 * @returns Verified JWT payload, or a stable error when the request must be rejected.
 */
export async function verifyCdsHooksJwt(
  authorizationHeader: string | null,
): Promise<CdsJwtResult> {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) {
    return {
      data: null,
      error: { code: 'missing_token', message: 'Authorization: Bearer JWT is required' },
    };
  }

  let jku: string | undefined;
  let issuer: string | undefined;
  try {
    const header = decodeProtectedHeader(token);
    if (typeof header.alg !== 'string' || !ALLOWED_ALGORITHMS.includes(header.alg)) {
      return {
        data: null,
        error: { code: 'invalid_token', message: `Unsupported JWT alg "${header.alg}"` },
      };
    }
    jku = typeof header.jku === 'string' ? header.jku : undefined;
    const claims = decodeJwt(token);
    issuer = typeof claims.iss === 'string' ? claims.iss : undefined;
  } catch {
    return { data: null, error: { code: 'invalid_token', message: 'JWT is malformed' } };
  }

  const issuers = allowedIssuers();
  if (!issuer || (issuers.length > 0 && !issuers.includes(issuer))) {
    return {
      data: null,
      error: { code: 'issuer_not_allowed', message: 'JWT issuer is not on the allowlist' },
    };
  }

  if (!jku || !jku.startsWith('https://')) {
    return {
      data: null,
      error: { code: 'jku_not_allowed', message: 'JWT header must carry an https jku' },
    };
  }
  const jkuAllowlist = envList('CDS_JWT_ALLOWED_JWKS');
  const jkuTrusted =
    jkuAllowlist.length > 0
      ? jkuAllowlist.some((allowed) => jku === allowed || jku.startsWith(allowed))
      : sameOrigin(jku, issuer);
  if (!jkuTrusted) {
    return {
      data: null,
      error: { code: 'jku_not_allowed', message: 'jku does not match issuer origin or allowlist' },
    };
  }

  try {
    const { payload } = await jwtVerify(token, cachedJwks(jku), {
      issuer,
      algorithms: ALLOWED_ALGORITHMS,
      clockTolerance: 60,
    });
    if (!audienceAllowed(payload.aud, allowedAudiences())) {
      return {
        data: null,
        error: { code: 'verification_failed', message: 'JWT audience is not on the allowlist' },
      };
    }
    return { data: payload, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'verification_failed',
        message: err instanceof Error ? err.message : 'JWT verification failed',
      },
    };
  }
}
