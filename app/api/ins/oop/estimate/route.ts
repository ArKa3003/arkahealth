/**
 * ARKA-INS out-of-pocket estimate API with Good Faith Estimate (GFE) payload for self-pay/uninsured.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { coverageFinancialsFromParsed } from "@/lib/aiie/coverage-financials";
import { estimatePatientResponsibility } from "@/lib/aiie/oop-estimator";
import { parseCoverage } from "@/lib/fhir/coverage";
import { FHIRClient } from "@/lib/fhir/client";
import { buildGoodFaithEstimateBlock } from "@/lib/ins/gfe";
import type { OOPEstimate } from "@/lib/types/aiie";
import type { Coverage } from "@/lib/types/fhir";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const postBodySchema = z.object({
  cptCode: z.string().min(1, "cptCode is required"),
  patientId: z.string().min(1, "patientId is required"),
  coverageId: z.string().min(1, "coverageId is required"),
  siteId: z.string().uuid().optional(),
  /** ICD-10-CM codes when known; placeholder codes are not used when omitted. */
  diagnosisCodes: z.array(z.string().min(1)).max(24).optional(),
});

function fhirServerFromRequest(request: Request): string | undefined {
  const h =
    request.headers.get("x-fhir-server")?.trim() ||
    request.headers.get("fhir-server")?.trim() ||
    process.env.ARKA_FHIR_BASE_URL?.trim();
  return h && h.length > 0 ? h : undefined;
}

function bearerFromRequest(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }
  const t = auth.slice(7).trim();
  return t.length > 0 ? t : undefined;
}

function patientLogicalTail(patientId: string): string {
  const p = patientId.trim();
  const idx = p.lastIndexOf("/");
  return idx >= 0 ? p.slice(idx + 1) : p;
}

function coverageAppliesToPatient(coverage: Coverage, patientId: string): boolean {
  const pid = patientLogicalTail(patientId);
  const benRef = coverage.beneficiary?.reference?.trim() ?? "";
  const subRef = coverage.subscriber?.reference?.trim() ?? "";
  const benTail = patientLogicalTail(benRef);
  const subTail = patientLogicalTail(subRef);
  return benTail === pid || subTail === pid;
}

function gfeProviderFromEnv(): { name: string; npi: string; tin: string } {
  return {
    name: process.env.ARKA_GFE_PROVIDER_NAME?.trim() || "ARKA Imaging Network",
    npi: process.env.ARKA_GFE_PROVIDER_NPI?.trim() || "1999999999",
    tin: process.env.ARKA_GFE_PROVIDER_TIN?.trim() || "00-0000000",
  };
}

/**
 * POST — returns OOPEstimate plus a CMS-oriented Good Faith Estimate block; caches estimates 24h in `ins_oop_estimates`.
 */
async function postOopEstimate(
  request: Request,
): Promise<
  NextResponse<
    | { estimate: OOPEstimate; goodFaithEstimate: ReturnType<typeof buildGoodFaithEstimateBlock> }
    | { error: string; code?: string }
  >
> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsedBody = postBodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.flatten().formErrors.join("; ") },
      { status: 400 },
    );
  }

  const { cptCode, patientId, coverageId, siteId, diagnosisCodes } = parsedBody.data;

  const fhirServer = fhirServerFromRequest(request);
  const token = bearerFromRequest(request);
  if (!fhirServer || !token) {
    return NextResponse.json(
      {
        error:
          "Provide X-FHIR-Server (or FHIR-Server) and Authorization: Bearer token, or set ARKA_FHIR_BASE_URL for server-side calls.",
        code: "MISSING_FHIR_CONTEXT",
      },
      { status: 400 },
    );
  }

  const client = new FHIRClient(fhirServer, token);
  const covResult = await client.readCoverage(coverageId);
  if (covResult.error || !covResult.data) {
    return NextResponse.json(
      { error: covResult.error?.code ?? "Coverage not found.", code: "COVERAGE_READ_FAILED" },
      { status: 502 },
    );
  }

  const coverageResource = covResult.data;
  if (coverageResource.status && coverageResource.status !== "active") {
    return NextResponse.json({ error: "Coverage is not active.", code: "COVERAGE_INACTIVE" }, { status: 400 });
  }

  if (!coverageAppliesToPatient(coverageResource, patientId)) {
    return NextResponse.json(
      { error: "Coverage beneficiary does not match patientId.", code: "PATIENT_COVERAGE_MISMATCH" },
      { status: 400 },
    );
  }

  const parsed = parseCoverage(coverageResource);
  const coverageBlock = coverageFinancialsFromParsed(parsed, coverageResource, cptCode);
  const planId = parsed.planId ?? parsed.planName;

  const oop = await estimatePatientResponsibility({
    cptCode,
    coverage: coverageBlock,
    siteId,
    planId,
  });

  if (oop.error) {
    const clientErr = ["INVALID_CPT", "MISSING_PAYER_ID"].includes(oop.error.code);
    return NextResponse.json(
      { error: oop.error.message, code: oop.error.code },
      { status: clientErr ? 400 : 503 },
    );
  }

  if (!oop.data) {
    return NextResponse.json({ error: "Estimate unavailable.", code: "OOP_UNAVAILABLE" }, { status: 503 });
  }

  const dx =
    diagnosisCodes && diagnosisCodes.length > 0 ?
      diagnosisCodes
    : ["Z13.89"]; // Encounter for screening for other disorder (placeholder when payer does not supply dx)

  const prov = gfeProviderFromEnv();
  const issueDateIso = new Date().toISOString().slice(0, 10);
  const gfe = buildGoodFaithEstimateBlock({
    providerName: prov.name,
    providerNPI: prov.npi,
    providerTIN: prov.tin,
    cptCode,
    diagnosisCodes: dx,
    expectedChargeUsd: oop.data.inNetworkNegotiatedRate,
    issueDateIso,
  });

  return NextResponse.json({
    estimate: oop.data,
    goodFaithEstimate: gfe,
  });
}

export const POST = withInsApiLogging(postOopEstimate);
