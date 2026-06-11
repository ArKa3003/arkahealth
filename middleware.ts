import { type NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { allowInsMiddlewareRequest, rateLimitClientKey } from "@/lib/middleware/ins-rate-limit";
import { safeParseCdsHookRequest } from "@/lib/validation/cds-hooks-request";
import { isCdsJwtRequired, verifyCdsHooksJwt } from "@/lib/cds-platform/cds-hooks/jwt-validator";

const FHIR_JSON = "application/fhir+json";

/**
 * ARKA-INS + CDS Hooks API paths (rate limit + CDS POST validation). Does not touch /clin/* or /ed/*.
 */
function isInsOrCdsApi(pathname: string): boolean {
  return pathname.startsWith("/api/ins/") || pathname.startsWith("/api/cds-services");
}

/**
 * POST to a concrete CDS service URL (not discovery GET on `/api/cds-services`).
 */
function isCdsHookServicePost(pathname: string, method: string): boolean {
  if (method !== "POST") {
    return false;
  }
  if (!pathname.startsWith("/api/cds-services/")) {
    return false;
  }
  return pathname.length > "/api/cds-services/".length;
}

/**
 * Adds `X-Request-ID` / `x-request-start` to all matched routes; rate-limits `/api/ins/*` and
 * `/api/cds-services/*`; validates CDS Hooks 2.0 JSON for POSTs to CDS service endpoints.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const requestId = nanoid();
  const start = String(Date.now());

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-request-start", start);

  const pathname = request.nextUrl.pathname;
  const method = request.method;

  if (isInsOrCdsApi(pathname) && method !== "OPTIONS") {
    const ip = rateLimitClientKey(request);
    if (!allowInsMiddlewareRequest(ip)) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "throttled",
              diagnostics: "Rate limit exceeded (100 requests per minute per IP).",
            },
          ],
        },
        {
          status: 429,
          headers: {
            "Content-Type": FHIR_JSON,
            "X-Request-ID": requestId,
            "Retry-After": "60",
          },
        },
      );
    }
  }

  if (isCdsHookServicePost(pathname, method)) {
    // CDS Hooks security model: verify the EHR-signed JWT when CDS_JWT_REQUIRED=1
    // (iss/aud allowlists from env, JWKS fetched via the header jku and cached).
    if (isCdsJwtRequired()) {
      const jwtResult = await verifyCdsHooksJwt(request.headers.get("authorization"));
      if (jwtResult.error) {
        return NextResponse.json(
          {
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                code: "security",
                diagnostics: `CDS Hooks JWT validation failed: ${jwtResult.error.message}`,
              },
            ],
          },
          {
            status: 401,
            headers: { "Content-Type": FHIR_JSON, "X-Request-ID": requestId },
          },
        );
      }
    }

    const clone = request.clone();
    let body: unknown;
    try {
      body = await clone.json();
    } catch {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "invalid",
              diagnostics: "Request body must be JSON for CDS Hooks service calls.",
            },
          ],
        },
        {
          status: 400,
          headers: { "Content-Type": FHIR_JSON, "X-Request-ID": requestId },
        },
      );
    }
    const parsed = safeParseCdsHookRequest(body);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "invalid",
              diagnostics: `CDS Hooks 2.0 request validation failed: ${parsed.message}`,
            },
          ],
        },
        {
          status: 400,
          headers: { "Content-Type": FHIR_JSON, "X-Request-ID": requestId },
        },
      );
    }
  }

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  res.headers.set("X-Request-ID", requestId);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
