/**
 * ARKA-INS PAS status: CMS-0057-F Provider Access–style GET by prior authorization id.
 */

import { NextResponse } from "next/server";

import { allowPasStatusRequest, rateLimitClientKey } from "@/lib/api/pas-status-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import type { OperationOutcome } from "@/lib/types/fhir";
import type { PASResponse } from "@/lib/types/davinci";

const FHIR_JSON = "application/fhir+json";

function outcome(status: number, diagnostics: string): NextResponse<OperationOutcome> {
  const oo: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{ severity: "error", code: "invalid", diagnostics }],
  };
  return NextResponse.json(oo, { status, headers: { "Content-Type": FHIR_JSON } });
}

/**
 * Returns the stored {@link PASResponse} for a completed simulated PAS submission.
 */
async function getPasStatus(
  request: Request,
  context: { params: Promise<{ paId: string }> },
): Promise<NextResponse<PASResponse | OperationOutcome>> {
  const ip = rateLimitClientKey(request);
  if (!allowPasStatusRequest(ip)) {
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "transient",
            diagnostics: "Rate limit exceeded (60 requests per minute per client).",
          },
        ],
      } satisfies OperationOutcome,
      { status: 429, headers: { "Content-Type": FHIR_JSON, "Retry-After": "60" } },
    );
  }

  const { paId } = await context.params;
  if (!paId || !/^[0-9a-fA-F-]{36}$/.test(paId)) {
    return outcome(400, "paId must be a UUID.");
  }

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
    return outcome(503, adminErr?.message ?? "Database unavailable.");
  }

  const { data: row, error } = await supabase
    .from("ins_pa_history")
    .select("pas_response, decision, decision_at, aiie_clinical_score, aiie_denial_risk, id")
    .eq("id", paId)
    .maybeSingle<{
      pas_response: PASResponse | null;
      decision: string;
      decision_at: string | null;
      aiie_clinical_score: number | null;
      aiie_denial_risk: number | null;
      id: string;
    }>();

  if (error) {
    return outcome(500, error.message);
  }
  if (!row) {
    return outcome(404, "No prior authorization found for this id.");
  }

  if (row.pas_response && typeof row.pas_response === "object") {
    const pr = row.pas_response as PASResponse;
    return NextResponse.json(pr, { headers: { "Content-Type": FHIR_JSON } });
  }

  const decisionMap: Record<string, PASResponse["decision"]> = {
    approved: "approved",
    denied: "denied",
    pended: "pended",
    auto_approved: "approved",
  };
  const decision = decisionMap[row.decision] ?? "pended";
  const ts = row.decision_at ?? new Date().toISOString();
  const appealDeadline = new Date(ts);
  appealDeadline.setUTCDate(appealDeadline.getUTCDate() + 180);

  const minimal: PASResponse = {
    resourceType: "ClaimResponse",
    id: `pas-response-${row.id}`,
    status: "active",
    use: "preauthorization",
    patient: { reference: "Patient/unknown" },
    created: ts,
    insurer: { reference: "Organization/payer" },
    outcome: "complete",
    decision,
    reasonCodes: [],
    appealDeadline: appealDeadline.toISOString(),
    decisionTimestamp: ts,
    cmsDenialDetails: [],
    paId: row.id,
    aiieDenialRisk: row.aiie_denial_risk ?? 0,
    aiieClinicalScore: row.aiie_clinical_score ?? 0,
  };

  return NextResponse.json(minimal, { headers: { "Content-Type": FHIR_JSON } });
}

export const GET = withInsApiLogging(getPasStatus);
