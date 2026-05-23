/**
 * DTR demo client: GET questionnaire and POST QuestionnaireResponse for `demo-order` (Prompt 23).
 */

import type { Parameters, Questionnaire, QuestionnaireResponse } from "@/lib/types/fhir";

/** Path segment used by `/api/ins/dtr/questionnaire/[orderId]` for sandbox DTR. */
export const DTR_DEMO_ORDER_ID = "demo-order";

/**
 * Placeholder SMART bearer accepted by the INS DTR routes (length ≥ 8).
 */
function dtrBearer(): string {
  return process.env.NEXT_PUBLIC_INS_DEMO_DTR_BEARER ?? "arka-ins-demo-dtr-bearer-token";
}

/**
 * Loads the FHIR Questionnaire for the fixed demo order id.
 */
export async function fetchDtrQuestionnaireDemo(): Promise<Questionnaire> {
  const res = await fetch(`/api/ins/dtr/questionnaire/${DTR_DEMO_ORDER_ID}`, {
    headers: {
      Authorization: `Bearer ${dtrBearer()}`,
      Accept: "application/fhir+json",
    },
  });
  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      raw && typeof raw === "object" && "issue" in raw ?
        JSON.stringify((raw as { issue?: unknown }).issue)
      : `HTTP ${res.status}`;
    throw new Error(`DTR questionnaire failed: ${msg}`);
  }
  const q = raw as Questionnaire;
  if (q.resourceType !== "Questionnaire") {
    throw new Error("DTR questionnaire response was not a Questionnaire");
  }
  return q;
}

export interface DtrSubmitResult {
  denialRisk: number;
  pasSubmissionReady: boolean;
  narrativeRationale?: string;
}

/**
 * Reads ARKA DTR submit `Parameters` output.
 *
 * @param params - FHIR Parameters body from `/api/ins/dtr/submit`.
 */
export function readDtrSubmitParameters(params: Parameters): DtrSubmitResult {
  let denialRisk = 5;
  let pasSubmissionReady = false;
  let narrativeRationale: string | undefined;
  for (const row of params.parameter ?? []) {
    if (row.name === "denialRisk" && row.valueInteger != null) {
      denialRisk = row.valueInteger;
    }
    if (row.name === "pasSubmissionReady" && row.valueBoolean != null) {
      pasSubmissionReady = row.valueBoolean;
    }
    if (row.name === "narrativeRationale" && row.valueString != null) {
      narrativeRationale = row.valueString;
    }
  }
  return { denialRisk, pasSubmissionReady, narrativeRationale };
}

/**
 * Submits a QuestionnaireResponse for the demo order and returns parsed metrics.
 *
 * @param response - Completed QuestionnaireResponse resource.
 */
export async function submitDtrQuestionnaireDemo(
  response: QuestionnaireResponse,
): Promise<DtrSubmitResult> {
  const res = await fetch(`/api/ins/dtr/submit?orderId=${encodeURIComponent(DTR_DEMO_ORDER_ID)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dtrBearer()}`,
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
    },
    body: JSON.stringify(response),
  });
  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      raw && typeof raw === "object" && "issue" in raw ?
        JSON.stringify((raw as { issue?: unknown }).issue)
      : `HTTP ${res.status}`;
    throw new Error(`DTR submit failed: ${msg}`);
  }
  const params = raw as Parameters;
  if (params.resourceType !== "Parameters") {
    throw new Error("DTR submit response was not Parameters");
  }
  return readDtrSubmitParameters(params);
}
