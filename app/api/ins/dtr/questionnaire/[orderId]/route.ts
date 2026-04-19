/**
 * ARKA-INS DTR: returns a FHIR R4 Questionnaire derived from AIIE factors (CQL-lite).
 */

import { NextResponse } from "next/server";

import {
  generateQuestionnaire,
  resolveDtrOrderContext,
  scoreOrderContext,
} from "@/lib/davinci/dtr";
import type { OperationOutcome } from "@/lib/types/fhir";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

const FHIR_JSON = "application/fhir+json";

/**
 * Placeholder SMART on FHIR bearer validation: requires a non-trivial Bearer token.
 *
 * @param request - Incoming HTTP request.
 */
function validateSmartBearer(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return false;
  }
  const token = auth.slice(7).trim();
  return token.length >= 8;
}

function unauthorizedOutcome(): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: "error",
        code: "security",
        diagnostics:
          "Authorization failed. Provide a SMART Bearer access token (placeholder validation accepts opaque tokens).",
      },
    ],
  };
}

/**
 * GET FHIR Questionnaire for an order: resolves context, re-runs AIIE, generates DTR items.
 */
async function getDtrQuestionnaire(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
): Promise<NextResponse> {
  if (!validateSmartBearer(request)) {
    return NextResponse.json(unauthorizedOutcome(), {
      status: 401,
      headers: { "Content-Type": FHIR_JSON },
    });
  }

  const { orderId } = await context.params;
  const { searchParams } = new URL(request.url);
  const contextB64 = searchParams.get("context");

  const resolved = resolveDtrOrderContext(orderId, contextB64);
  if (resolved.error || !resolved.data) {
    const oo: OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "invalid",
          diagnostics: resolved.error ?? "Unable to resolve order context",
        },
      ],
    };
    return NextResponse.json(oo, { status: 400, headers: { "Content-Type": FHIR_JSON } });
  }

  const aiie = await scoreOrderContext(resolved.data);
  const questionnaire = generateQuestionnaire(
    aiie,
    resolved.data.parsedCoverage,
    resolved.data.serviceRequest,
  );

  return NextResponse.json(questionnaire, {
    headers: { "Content-Type": FHIR_JSON },
  });
}

export const GET = withInsApiLogging(getDtrQuestionnaire);
