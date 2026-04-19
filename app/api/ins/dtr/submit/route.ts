/**
 * ARKA-INS DTR: accepts QuestionnaireResponse, validates required items, rescores AIIE, returns Parameters.
 */

import { NextResponse } from "next/server";

import { scoreOrder } from "@/lib/aiie/scoring-engine";
import {
  applyQuestionnaireResponseToInput,
  generateQuestionnaire,
  resolveDtrOrderContext,
  scoreOrderContext,
  validateRequiredItemsAnswered,
} from "@/lib/davinci/dtr";
import { isDemoMode } from "@/lib/demo/demo-mode";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import type { OperationOutcome, Parameters, QuestionnaireResponse } from "@/lib/types/fhir";

const FHIR_JSON = "application/fhir+json";

const FDA_NOTICE =
  "This recommendation is provided by ARKA Imaging Intelligence Engine, an FDA Non-Device Clinical Decision Support tool under the 21st Century Cures Act. The ordering clinician retains full responsibility for the final decision.";

/** MGMA-style documentation time baseline (minutes) avoided vs fully manual PA documentation. */
const MGMA_DOC_MINUTES_BASELINE = 8;

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

function isQuestionnaireResponse(body: unknown): body is QuestionnaireResponse {
  if (!body || typeof body !== "object") {
    return false;
  }
  const o = body as QuestionnaireResponse;
  return o.resourceType === "QuestionnaireResponse" && typeof o.status === "string";
}

/**
 * POST QuestionnaireResponse; returns Parameters with updated AIIE metrics.
 */
async function postDtrSubmit(request: Request): Promise<NextResponse> {
  if (!validateSmartBearer(request)) {
    return NextResponse.json(unauthorizedOutcome(), {
      status: 401,
      headers: { "Content-Type": FHIR_JSON },
    });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId?.trim()) {
    const oo: OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "required",
          diagnostics: "Query parameter orderId is required to rebuild scoring context.",
        },
      ],
    };
    return NextResponse.json(oo, { status: 400, headers: { "Content-Type": FHIR_JSON } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const oo: OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [{ severity: "error", code: "invalid", diagnostics: "JSON body required" }],
    };
    return NextResponse.json(oo, { status: 400, headers: { "Content-Type": FHIR_JSON } });
  }

  if (!isQuestionnaireResponse(body)) {
    const oo: OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "invalid",
          diagnostics: "Body must be a FHIR QuestionnaireResponse resource.",
        },
      ],
    };
    return NextResponse.json(oo, { status: 400, headers: { "Content-Type": FHIR_JSON } });
  }

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

  const baselineAiie = await scoreOrderContext(resolved.data);
  const questionnaire = generateQuestionnaire(
    baselineAiie,
    resolved.data.parsedCoverage,
    resolved.data.serviceRequest,
  );

  const validation = validateRequiredItemsAnswered(questionnaire, body);
  if (!validation.ok) {
    const oo: OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "invalid",
          diagnostics: `Required Questionnaire items not answered: ${validation.missingLinkIds.join(", ")}`,
        },
      ],
    };
    return NextResponse.json(oo, { status: 422, headers: { "Content-Type": FHIR_JSON } });
  }

  const mergedInput = applyQuestionnaireResponseToInput(
    resolved.data.aiieInput,
    questionnaire,
    body,
  );
  const updated = await scoreOrder(mergedInput);
  const pasSubmissionReady = updated.denialRisk <= 5;

  const parameters: Parameters = {
    resourceType: "Parameters",
    parameter: [
      { name: "denialRisk", valueInteger: updated.denialRisk },
      { name: "clinicalScore", valueInteger: updated.clinicalScore },
      { name: "pasSubmissionReady", valueBoolean: pasSubmissionReady },
      { name: "confidence", valueDecimal: updated.confidence },
      { name: "factors", valueString: JSON.stringify(updated.factors) },
      { name: "narrativeRationale", valueString: updated.narrativeRationale },
      { name: "fdaNotice", valueString: FDA_NOTICE },
      {
        name: "documentationEfficiencyNote",
        valueString: `Estimated documentation time savings vs fully manual prior-authorization packet preparation: ${MGMA_DOC_MINUTES_BASELINE} minutes (MGMA physician time benchmarks; illustrative). ${FDA_NOTICE}`,
      },
    ],
  };

  if (!isDemoMode()) {
    const { data: supabase } = createAdminClient();
    if (supabase) {
      await supabase.from("ins_validation_events").insert({
        event_type: "provider_time_saved",
        payer_id: resolved.data.parsedCoverage.payerId ?? null,
        minutes_saved: MGMA_DOC_MINUTES_BASELINE,
        amount_usd: null,
        provider_id: null,
      });
      if (updated.denialRisk < baselineAiie.denialRisk) {
        await supabase.from("ins_validation_events").insert({
          event_type: "dtr_denial_risk_reduced",
          payer_id: resolved.data.parsedCoverage.payerId ?? null,
          minutes_saved: null,
          amount_usd: null,
          provider_id: null,
          metadata: {
            priorDenialRisk: baselineAiie.denialRisk,
            updatedDenialRisk: updated.denialRisk,
          },
        });
      }
    }
  }

  return NextResponse.json(parameters, { headers: { "Content-Type": FHIR_JSON } });
}

export const POST = withInsApiLogging(postDtrSubmit);
