/**
 * Unified CDS Hooks discovery endpoint for the ARKA platform. Advertises services from both ARKA-CLIN (clinical appropriateness) and ARKA-INS (coverage + cost + PA) backed by the shared AIIE scoring engine. Epic, Cerner, or SMART Sandbox register ONE URL and get the full platform. This is the 'one engine, two lenses' architecture.
 */

import { NextResponse } from "next/server";

import { PREFETCH_TEMPLATES } from "@/lib/cds-platform/fhir/prefetch";
import { FDA_DISCLOSURE_VERSION } from "@/lib/compliance/fda-disclosure";
import { APPOINTMENT_PREFETCH, COVERAGE_PREFETCH } from "@/lib/fhir/prefetch";
import { routes } from "@/lib/constants";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

const CLIN_PREFETCH = {
  patient: PREFETCH_TEMPLATES.patient,
  activeConditions: PREFETCH_TEMPLATES.activeConditions,
  relevantLabs: PREFETCH_TEMPLATES.relevantLabs,
  recentImaging: PREFETCH_TEMPLATES.recentImaging,
  activeMedications: PREFETCH_TEMPLATES.activeMedications,
  priorServiceRequests: PREFETCH_TEMPLATES.priorServiceRequests,
} as const;

/** Set on every response from this route (not via next.config.ts). */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

const discoveryMetaHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300",
  "X-ARKA-FDA-Compliance": "non-device-cds",
  "X-ARKA-FDA-Disclosure-Version": FDA_DISCLOSURE_VERSION,
  "X-ARKA-CMS-0057-F-Ready": "true",
  "X-ARKA-Platform-Version": "unified-2.0",
} as const;

/**
 * Applies CORS headers directly on the response object before it is returned.
 */
function withCorsHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

const services = [
  {
    hook: "order-select",
    title: "ARKA-CLIN Imaging Appropriateness",
    description:
      "Guideline-anchored imaging-appropriateness CDS for the order-select hook. Recommendations cite USPSTF and specialty-society guidelines; ML-derived patient-specific refinement is shown as a non-authoritative confidence layer.",
    id: "arka-clin-appropriateness",
    prefetch: { ...CLIN_PREFETCH },
  },
  {
    hook: "order-sign",
    id: "arka-clin-appropriateness-sign",
    title: "ARKA-CLIN Final Imaging Review",
    description:
      "Final guideline-anchored appropriateness check at order-sign. Returns a non-blocking critical-tier card with descriptive override reasons when the proposed study departs from evidence-based appropriateness criteria or specialty-society guidance for the indication.",
    prefetch: { ...CLIN_PREFETCH },
  },
  {
    hook: "order-select",
    title: "ARKA-INS Coverage & Cost Intelligence",
    description:
      "Prior auth status, gold card eligibility, and out-of-pocket cost estimate. Shares AIIE engine with ARKA-CLIN. FDA Non-Device CDS compliant.",
    id: "arka-ins-coverage",
    prefetch: { ...COVERAGE_PREFETCH },
  },
  {
    hook: "order-sign",
    title: "ARKA-INS Final Coverage Check",
    description: "Final PA verification and packet readiness check before order signature.",
    id: "arka-ins-final-check",
    prefetch: { ...COVERAGE_PREFETCH },
  },
  {
    hook: "appointment-book",
    title: "ARKA-INS Site Optimizer",
    description:
      "Suggests cheapest appropriate in-network imaging site based on coverage and cash-pay alternatives.",
    id: "arka-ins-appointment",
    prefetch: { ...APPOINTMENT_PREFETCH },
  },
] as const;

/**
 * CDS Hooks service discovery (GET). Returns ARKA-CLIN and ARKA-INS service metadata for a single EHR registration URL.
 */
async function discoveryGet(_request: Request): Promise<NextResponse> {
  const response = NextResponse.json(
    { services, feedback: routes.cdsFeedbackApi },
    { headers: discoveryMetaHeaders },
  );
  return withCorsHeaders(response);
}

export const GET = withInsApiLogging(discoveryGet);

/**
 * CORS preflight for CDS Hooks clients (sandbox, local dev, EHR-hosted apps).
 * Standalone export — no logging wrapper; headers set only in this handler.
 */
export async function OPTIONS(_request: Request): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 200 });
  return withCorsHeaders(response);
}
