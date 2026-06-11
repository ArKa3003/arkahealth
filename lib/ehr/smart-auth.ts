/**
 * @file smart-auth.ts
 * @description SMART App Launch (EHR-launch flow) helpers: discovers the
 * `.well-known/smart-configuration` for an issuing FHIR server, builds the OAuth2
 * authorize redirect with PKCE (S256), exchanges the authorization code for tokens,
 * and seals/opens the encrypted httpOnly session cookies (JWE via jose, A256GCM).
 *
 * No PHI is ever persisted server-side: tokens live only inside encrypted cookies
 * and patient data is fetched client-side directly from the EHR's FHIR server.
 * All helpers return `{ data, error }` tuples and never throw.
 */

import { EncryptJWT, jwtDecrypt } from 'jose';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Standard error shape for SMART auth helpers (never thrown). */
export interface SmartAuthError {
  /** Stable error code for branching in callers. */
  code: string;
  /** Human-readable detail safe for logs (no tokens, no PHI). */
  message: string;
}

/** `{ data, error }` tuple used by every helper in this module. */
export type SmartAuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: SmartAuthError };

/** Subset of `{iss}/.well-known/smart-configuration` that ARKA consumes. */
export interface SmartConfiguration {
  /** OAuth2 authorization endpoint. */
  authorizationEndpoint: string;
  /** OAuth2 token endpoint. */
  tokenEndpoint: string;
  /** Advertised capabilities (e.g. `launch-ehr`, `context-ehr-patient`). */
  capabilities: string[];
  /** Advertised PKCE methods; ARKA requires S256. */
  codeChallengeMethodsSupported: string[];
}

/** PKCE verifier/challenge pair (S256). */
export interface PkcePair {
  /** High-entropy random verifier (base64url, 43 chars). */
  codeVerifier: string;
  /** base64url(SHA-256(codeVerifier)). */
  codeChallenge: string;
}

/** Transient state sealed into the launch cookie between /ehr/launch and /ehr/callback. */
export interface SmartLaunchState {
  /** Anti-CSRF state echoed back by the authorization server. */
  state: string;
  /** PKCE code verifier for the token exchange. */
  codeVerifier: string;
  /** FHIR server base URL (`iss`) for this launch. */
  iss: string;
  /** Token endpoint discovered from smart-configuration. */
  tokenEndpoint: string;
  /** Redirect URI registered for this app. */
  redirectUri: string;
}

/** EHR session sealed into the long-lived session cookie after token exchange. */
export interface EhrSession {
  /** OAuth2 access token for FHIR API calls. */
  accessToken: string;
  /** Optional refresh token when `offline_access`/EHR grants one. */
  refreshToken?: string;
  /** FHIR server base URL the tokens are valid against. */
  fhirBaseUrl: string;
  /** Token endpoint used for refresh. */
  tokenEndpoint: string;
  /** Granted scopes. */
  scope: string;
  /** Epoch ms when the access token expires. */
  expiresAt: number;
  /** Patient-in-context id from the launch context, when provided. */
  patientId?: string;
  /** Encounter-in-context id from the launch context, when provided. */
  encounterId?: string;
  /** `fhirUser` claim from the id_token (e.g. Practitioner/123), when provided. */
  fhirUser?: string;
}

/** Token endpoint response fields ARKA consumes. */
interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  patient?: string;
  encounter?: string;
  id_token?: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Scopes requested at EHR launch (read-only imaging context). */
export const SMART_SCOPES = [
  'launch',
  'openid',
  'fhirUser',
  'patient/Patient.read',
  'patient/ServiceRequest.read',
  'patient/Condition.read',
  'patient/Observation.read',
  'patient/DiagnosticReport.read',
].join(' ');

/** Name of the transient (5 min) launch-state cookie. */
export const EHR_LAUNCH_COOKIE = 'arka_ehr_launch';

/** Name of the encrypted EHR session cookie. */
export const EHR_SESSION_COOKIE = 'arka_ehr_session';

/** Max lifetime of the sealed session cookie in seconds (8h shift). */
export const EHR_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const SMART_CONFIG_TIMEOUT_MS = 5_000;
const TOKEN_TIMEOUT_MS = 8_000;

// -----------------------------------------------------------------------------
// PKCE + crypto helpers
// -----------------------------------------------------------------------------

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Generates a PKCE verifier/challenge pair using the S256 method.
 */
export async function generatePkcePair(): Promise<SmartAuthResult<PkcePair>> {
  try {
    const random = crypto.getRandomValues(new Uint8Array(32));
    const codeVerifier = base64UrlEncode(random);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return {
      data: { codeVerifier, codeChallenge: base64UrlEncode(new Uint8Array(digest)) },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: { code: 'pkce_failed', message: err instanceof Error ? err.message : 'PKCE generation failed' },
    };
  }
}

/**
 * Generates a random anti-CSRF `state` value.
 */
export function generateState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));
}

// -----------------------------------------------------------------------------
// SMART configuration discovery
// -----------------------------------------------------------------------------

/**
 * Fetches `{iss}/.well-known/smart-configuration` and validates the endpoints
 * ARKA needs for the EHR-launch sequence (authorize + token + S256 PKCE).
 *
 * @param iss - FHIR server base URL passed by the EHR as the `iss` launch param.
 */
export async function fetchSmartConfiguration(
  iss: string,
): Promise<SmartAuthResult<SmartConfiguration>> {
  let issUrl: URL;
  try {
    issUrl = new URL(iss);
  } catch {
    return { data: null, error: { code: 'invalid_iss', message: 'iss is not a valid URL' } };
  }
  if (issUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    return { data: null, error: { code: 'insecure_iss', message: 'iss must use https' } };
  }

  const configUrl = `${iss.replace(/\/+$/, '')}/.well-known/smart-configuration`;
  try {
    const res = await fetch(configUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(SMART_CONFIG_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) {
      return {
        data: null,
        error: { code: 'smart_config_http', message: `smart-configuration returned ${res.status}` },
      };
    }
    const json = (await res.json()) as Record<string, unknown>;
    const authorizationEndpoint = json['authorization_endpoint'];
    const tokenEndpoint = json['token_endpoint'];
    if (typeof authorizationEndpoint !== 'string' || typeof tokenEndpoint !== 'string') {
      return {
        data: null,
        error: { code: 'smart_config_invalid', message: 'authorization/token endpoint missing' },
      };
    }
    const methods = Array.isArray(json['code_challenge_methods_supported'])
      ? (json['code_challenge_methods_supported'] as string[])
      : [];
    return {
      data: {
        authorizationEndpoint,
        tokenEndpoint,
        capabilities: Array.isArray(json['capabilities']) ? (json['capabilities'] as string[]) : [],
        codeChallengeMethodsSupported: methods,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'smart_config_fetch_failed',
        message: err instanceof Error ? err.message : 'smart-configuration fetch failed',
      },
    };
  }
}

// -----------------------------------------------------------------------------
// Authorize URL + token exchange
// -----------------------------------------------------------------------------

/** Inputs for building the OAuth2 authorize redirect. */
export interface AuthorizeUrlParams {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  /** Opaque launch token from the EHR. */
  launch: string;
  /** FHIR server base URL — sent as `aud` per SMART App Launch. */
  iss: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}

/**
 * Builds the SMART EHR-launch authorize redirect URL (response_type=code, PKCE S256).
 */
export function buildAuthorizeUrl(params: AuthorizeUrlParams): SmartAuthResult<string> {
  try {
    const url = new URL(params.authorizationEndpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('scope', params.scope ?? SMART_SCOPES);
    url.searchParams.set('state', params.state);
    url.searchParams.set('aud', params.iss);
    url.searchParams.set('launch', params.launch);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return { data: url.toString(), error: null };
  } catch {
    return {
      data: null,
      error: { code: 'invalid_authorization_endpoint', message: 'authorization_endpoint is not a valid URL' },
    };
  }
}

async function postTokenRequest(
  tokenEndpoint: string,
  body: URLSearchParams,
): Promise<SmartAuthResult<TokenResponse>> {
  try {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as TokenResponse & { error?: string };
    if (!res.ok || !json.access_token) {
      return {
        data: null,
        error: {
          code: 'token_exchange_failed',
          message: `token endpoint returned ${res.status}${json.error ? ` (${json.error})` : ''}`,
        },
      };
    }
    return { data: json, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'token_request_failed',
        message: err instanceof Error ? err.message : 'token request failed',
      },
    };
  }
}

/** Extracts the `fhirUser` (or `profile`) claim from an unverified id_token payload. */
function extractFhirUser(idToken: string | undefined): string | undefined {
  if (!idToken) return undefined;
  try {
    const payloadSegment = idToken.split('.')[1];
    if (!payloadSegment) return undefined;
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(normalized)) as Record<string, unknown>;
    const fhirUser = claims['fhirUser'] ?? claims['profile'];
    return typeof fhirUser === 'string' ? fhirUser : undefined;
  } catch {
    return undefined;
  }
}

/** Inputs for the authorization-code token exchange. */
export interface CodeExchangeParams {
  tokenEndpoint: string;
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
  /** FHIR base URL the session is bound to. */
  iss: string;
}

/**
 * Exchanges the authorization code for tokens (public client + PKCE) and maps the
 * response onto an {@link EhrSession} ready to be sealed into the session cookie.
 */
export async function exchangeAuthorizationCode(
  params: CodeExchangeParams,
): Promise<SmartAuthResult<EhrSession>> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });
  const result = await postTokenRequest(params.tokenEndpoint, body);
  if (result.error) return { data: null, error: result.error };

  const token = result.data;
  return {
    data: {
      accessToken: token.access_token as string,
      refreshToken: token.refresh_token,
      fhirBaseUrl: params.iss,
      tokenEndpoint: params.tokenEndpoint,
      scope: token.scope ?? '',
      expiresAt: Date.now() + Math.max(60, token.expires_in ?? 3600) * 1000,
      patientId: token.patient,
      encounterId: token.encounter,
      fhirUser: extractFhirUser(token.id_token),
    },
    error: null,
  };
}

/**
 * Refreshes an expired session using its refresh token; preserves launch context
 * fields (patient/encounter) when the token response omits them.
 */
export async function refreshEhrSession(
  session: EhrSession,
  clientId: string,
): Promise<SmartAuthResult<EhrSession>> {
  if (!session.refreshToken) {
    return { data: null, error: { code: 'no_refresh_token', message: 'session has no refresh token' } };
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: session.refreshToken,
    client_id: clientId,
  });
  const result = await postTokenRequest(session.tokenEndpoint, body);
  if (result.error) return { data: null, error: result.error };

  const token = result.data;
  return {
    data: {
      ...session,
      accessToken: token.access_token as string,
      refreshToken: token.refresh_token ?? session.refreshToken,
      scope: token.scope ?? session.scope,
      expiresAt: Date.now() + Math.max(60, token.expires_in ?? 3600) * 1000,
      patientId: token.patient ?? session.patientId,
      encounterId: token.encounter ?? session.encounterId,
    },
    error: null,
  };
}

// -----------------------------------------------------------------------------
// Encrypted cookie sealing (jose JWE — dir / A256GCM)
// -----------------------------------------------------------------------------

let cachedKey: { secret: string; key: Uint8Array } | null = null;

/** Derives a 32-byte AES key from EHR_SESSION_SECRET (SHA-256), cached per secret. */
async function sessionKey(): Promise<SmartAuthResult<Uint8Array>> {
  const secret = process.env.EHR_SESSION_SECRET ?? process.env.SESSION_SECRET;
  if (!secret) {
    return {
      data: null,
      error: { code: 'missing_session_secret', message: 'EHR_SESSION_SECRET is not configured' },
    };
  }
  if (cachedKey && cachedKey.secret === secret) {
    return { data: cachedKey.key, error: null };
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = new Uint8Array(digest);
  cachedKey = { secret, key };
  return { data: key, error: null };
}

/**
 * Seals an arbitrary JSON payload into a compact JWE string for an httpOnly cookie.
 *
 * @param payload - Cookie payload (launch state or EHR session).
 * @param maxAgeSeconds - Encryption-level expiry, matching the cookie Max-Age.
 */
export async function sealCookiePayload(
  payload: Record<string, unknown>,
  maxAgeSeconds: number,
): Promise<SmartAuthResult<string>> {
  const keyResult = await sessionKey();
  if (keyResult.error) return { data: null, error: keyResult.error };
  try {
    const jwe = await new EncryptJWT(payload)
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setIssuer('arka-ehr')
      .setExpirationTime(`${maxAgeSeconds}s`)
      .encrypt(keyResult.data);
    return { data: jwe, error: null };
  } catch (err) {
    return {
      data: null,
      error: { code: 'seal_failed', message: err instanceof Error ? err.message : 'cookie sealing failed' },
    };
  }
}

/**
 * Opens a sealed cookie value back into its payload; expired/tampered cookies fail closed.
 */
export async function openCookiePayload<T>(value: string): Promise<SmartAuthResult<T>> {
  const keyResult = await sessionKey();
  if (keyResult.error) return { data: null, error: keyResult.error };
  try {
    const { payload } = await jwtDecrypt(value, keyResult.data, { issuer: 'arka-ehr' });
    return { data: payload as T, error: null };
  } catch {
    return { data: null, error: { code: 'open_failed', message: 'cookie is invalid or expired' } };
  }
}

/**
 * Resolves the SMART public client id for this deployment.
 */
export function smartClientId(): string {
  return process.env.EHR_CLIENT_ID ?? 'arka-ehr-embedded';
}
