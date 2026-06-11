/**
 * @file route.ts
 * @description OAuth2 redirect URI for the SMART EHR-launch flow
 * (`GET /ehr/callback?code=...&state=...`). Verifies the anti-CSRF state against
 * the sealed launch cookie, exchanges the code for tokens (PKCE), seals the
 * resulting session into an encrypted httpOnly cookie, and redirects to the
 * embedded app at /ehr/app. Tokens never touch server-side storage.
 */

import { NextResponse, type NextRequest } from 'next/server';

import {
  EHR_LAUNCH_COOKIE,
  EHR_SESSION_COOKIE,
  EHR_SESSION_MAX_AGE_SECONDS,
  exchangeAuthorizationCode,
  openCookiePayload,
  sealCookiePayload,
  smartClientId,
  type SmartLaunchState,
} from '@/lib/ehr/smart-auth';

export const dynamic = 'force-dynamic';

function redirectWithError(origin: string, code: string): NextResponse {
  const response = NextResponse.redirect(
    `${origin}/ehr/app?launch_error=${encodeURIComponent(code)}`,
  );
  response.cookies.delete(EHR_LAUNCH_COOKIE);
  return response;
}

/**
 * Completes the SMART EHR-launch token exchange and establishes the cookie session.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin, protocol } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  if (oauthError) {
    return redirectWithError(origin, oauthError);
  }
  if (!code || !state) {
    return redirectWithError(origin, 'missing_code_or_state');
  }

  const launchCookie = request.cookies.get(EHR_LAUNCH_COOKIE)?.value;
  if (!launchCookie) {
    return redirectWithError(origin, 'missing_launch_state');
  }

  const launchState = await openCookiePayload<SmartLaunchState>(launchCookie);
  if (launchState.error) {
    return redirectWithError(origin, 'invalid_launch_state');
  }
  if (launchState.data.state !== state) {
    return redirectWithError(origin, 'state_mismatch');
  }

  const session = await exchangeAuthorizationCode({
    tokenEndpoint: launchState.data.tokenEndpoint,
    code,
    codeVerifier: launchState.data.codeVerifier,
    clientId: smartClientId(),
    redirectUri: launchState.data.redirectUri,
    iss: launchState.data.iss,
  });
  if (session.error) {
    return redirectWithError(origin, session.error.code);
  }

  const sealed = await sealCookiePayload({ ...session.data }, EHR_SESSION_MAX_AGE_SECONDS);
  if (sealed.error) {
    return redirectWithError(origin, sealed.error.code);
  }

  const secure = protocol === 'https:';
  const response = NextResponse.redirect(`${origin}/ehr/app`);
  response.cookies.delete(EHR_LAUNCH_COOKIE);
  response.cookies.set(EHR_SESSION_COOKIE, sealed.data, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: EHR_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
