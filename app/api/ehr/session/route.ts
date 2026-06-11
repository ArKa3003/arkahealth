/**
 * @file route.ts
 * @description Same-origin session reader for the embedded EHR rail
 * (`GET /api/ehr/session`). Opens the encrypted httpOnly session cookie and hands
 * the SMART access token + FHIR base URL to the client, which fetches FHIR
 * resources directly from the EHR. Transparently refreshes expired tokens when a
 * refresh token is present. Nothing is persisted server-side; the cookie is the
 * only state.
 */

import { NextResponse, type NextRequest } from 'next/server';

import {
  EHR_SESSION_COOKIE,
  EHR_SESSION_MAX_AGE_SECONDS,
  openCookiePayload,
  refreshEhrSession,
  sealCookiePayload,
  smartClientId,
  type EhrSession,
} from '@/lib/ehr/smart-auth';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

function errorResponse(code: string, message: string, status: number): NextResponse {
  return NextResponse.json(
    { data: null, error: { code, message } },
    { status, headers: NO_STORE_HEADERS },
  );
}

/**
 * Returns the active EHR session context for client-side FHIR fetches.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieValue = request.cookies.get(EHR_SESSION_COOKIE)?.value;
  if (!cookieValue) {
    return errorResponse('no_session', 'No EHR session — launch ARKA from your EHR.', 401);
  }

  const opened = await openCookiePayload<EhrSession>(cookieValue);
  if (opened.error) {
    return errorResponse('invalid_session', 'EHR session is invalid or expired.', 401);
  }

  let session = opened.data;
  let resealedCookie: string | null = null;

  if (session.expiresAt <= Date.now() + 30_000) {
    const refreshed = await refreshEhrSession(session, smartClientId());
    if (refreshed.error) {
      return errorResponse('session_expired', 'EHR session expired — relaunch from your EHR.', 401);
    }
    session = refreshed.data;
    const sealed = await sealCookiePayload({ ...session }, EHR_SESSION_MAX_AGE_SECONDS);
    if (!sealed.error) {
      resealedCookie = sealed.data;
    }
  }

  const response = NextResponse.json(
    {
      data: {
        fhirBaseUrl: session.fhirBaseUrl,
        accessToken: session.accessToken,
        patientId: session.patientId ?? null,
        encounterId: session.encounterId ?? null,
        fhirUser: session.fhirUser ?? null,
        scope: session.scope,
        expiresAt: session.expiresAt,
      },
      error: null,
    },
    { headers: NO_STORE_HEADERS },
  );

  if (resealedCookie) {
    const secure = request.nextUrl.protocol === 'https:';
    response.cookies.set(EHR_SESSION_COOKIE, resealedCookie, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      maxAge: EHR_SESSION_MAX_AGE_SECONDS,
    });
  }
  return response;
}
