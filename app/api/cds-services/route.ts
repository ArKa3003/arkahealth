/**
 * Unified CDS Hooks discovery endpoint for the ARKA platform. Advertises services from both ARKA-CLIN (clinical appropriateness) and ARKA-INS (coverage + cost + PA) backed by the shared AIIE scoring engine. Epic, Cerner, or SMART Sandbox register ONE URL and get the full platform. This is the 'one engine, two lenses' architecture.
 */

import { NextResponse } from "next/server";

import { APPOINTMENT_PREFETCH, COVERAGE_PREFETCH } from "@/lib/fhir/prefetch";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

const discoveryHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "public, max-age=300",
  "X-ARKA-FDA-Compliance": "non-device-cds",
  "X-ARKA-CMS-0057-F-Ready": "true",
  "X-ARKA-Platform-Version": "unified-2.0",
} as const;

const services = [
  /*
   * TEMPORARILY REMOVED — Phase 4 of ARKA_CDS_HOOKS_UNIFIED_PLAYBOOK.md will restore this entry
   * along with the actual route at app/api/cds-services/arka-clin-appropriateness/route.ts.
   * Re-enable when the route ships.
   *
   * {
   *   hook: "order-select",
   *   title: "ARKA-CLIN Imaging Appropriateness",
   *   description:
   *     "AIIE-based clinical appropriateness scoring for imaging orders. FDA Non-Device CDS compliant.",
   *   id: "arka-clin-appropriateness",
   *   prefetch: {
   *     patient: "Patient/{{context.patientId}}",
   *     conditions: "Condition?patient={{context.patientId}}",
   *     observations: "Observation?patient={{context.patientId}}&category=laboratory",
   *     imagingStudies: "ImagingStudy?patient={{context.patientId}}",
   *   },
   * },
   */
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
  return NextResponse.json({ services }, { headers: discoveryHeaders });
}

export const GET = withInsApiLogging(discoveryGet);

/**
 * CORS preflight for CDS Hooks clients (sandbox, local dev, EHR-hosted apps).
 */
async function discoveryOptions(_request: Request): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: discoveryHeaders });
}

export const OPTIONS = withInsApiLogging(discoveryOptions);
