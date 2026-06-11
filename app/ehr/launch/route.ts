/**
 * @file route.ts
 * @description SMART App Launch entry point (`GET /ehr/launch?iss=...&launch=...`).
 * Discovers the EHR's smart-configuration, generates PKCE + anti-CSRF state, seals
 * them into a short-lived encrypted cookie, and redirects to the EHR's OAuth2
 * authorize endpoint. Errors never throw — they redirect to /ehr/app with an
 * error code so the embedded UI can render a quiet failure state.
 */

import { NextResponse, type NextRequest } from 'next/server';

import {
  buildAuthorizeUrl,
  EHR_LAUNCH_COOKIE,
  fetchSmartConfiguration,
  generatePkcePair,
  generateState,
  sealCookiePayload,
  smartClientId,
  type SmartLaunchState,
} from '@/lib/ehr/smart-auth';

export const dynamic = 'force-dynamic';

const LAUNCH_COOKIE_MAX_AGE_SECONDS = 300;

function redirectWithError(origin: string, code: string): NextResponse {
  return NextResponse.redirect(`${origin}/ehr/app?launch_error=${encodeURIComponent(code)}`);
}

/**
 * Starts the SMART EHR-launch authorization sequence.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin, protocol } = request.nextUrl;
  const iss = searchParams.get('iss');
  const launch = searchParams.get('launch');

  if (!iss || !launch) {
    return redirectWithError(origin, 'missing_launch_params');
  }

  const config = await fetchSmartConfiguration(iss);
  if (config.error) {
    return redirectWithError(origin, config.error.code);
  }

  const pkce = await generatePkcePair();
  if (pkce.error) {
    return redirectWithError(origin, pkce.error.code);
  }

  const state = generateState();
  const redirectUri = `${origin}/ehr/callback`;

  const launchState: SmartLaunchState = {
    state,
    codeVerifier: pkce.data.codeVerifier,
    iss,
    tokenEndpoint: config.data.tokenEndpoint,
    redirectUri,
  };
  const sealed = await sealCookiePayload({ ...launchState }, LAUNCH_COOKIE_MAX_AGE_SECONDS);
  if (sealed.error) {
    return redirectWithError(origin, sealed.error.code);
  }

  const authorizeUrl = buildAuthorizeUrl({
    authorizationEndpoint: config.data.authorizationEndpoint,
    clientId: smartClientId(),
    redirectUri,
    launch,
    iss,
    state,
    codeChallenge: pkce.data.codeChallenge,
  });
  if (authorizeUrl.error) {
    return redirectWithError(origin, authorizeUrl.error.code);
  }

  // SameSite=None so the cookie survives the cross-site redirect back inside the
  // EHR's embedded browser frame; falls back to Lax for local http development.
  const secure = protocol === 'https:';
  const response = NextResponse.redirect(authorizeUrl.data);
  response.cookies.set(EHR_LAUNCH_COOKIE, sealed.data, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/ehr',
    maxAge: LAUNCH_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
