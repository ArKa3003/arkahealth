/**
 * ARKA-INS PAS: submit Da Vinci PAS Claim packet; simulated payer decision via {@link submitPAS}.
 */

import { createHash, randomUUID } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { computeGoldCardScore, logGoldCardPaAvoided } from "@/lib/aiie/gold-card";
import {
  PAS_SUBMIT_MGMA_MINUTES_BASELINE,
  submitPAS,
} from "@/lib/davinci/pas";
import { parseCoverage } from "@/lib/fhir/coverage";
import { isDemoMode } from "@/lib/demo/demo-mode";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import type { Claim, Coverage, OperationOutcome, Practitioner, QuestionnaireResponse, ServiceRequest } from "@/lib/types/fhir";
import type { PASRequest, PASResponse } from "@/lib/types/davinci";
import type { AIIEInput } from "@/lib/types/aiie";

const FHIR_JSON = "application/fhir+json";

const fhirRef = z.object({
  reference: z.string().optional(),
  display: z.string().optional(),
});

const codeableConcept = z
  .object({
    coding: z
      .array(z.object({ system: z.string().optional(), code: z.string().optional() }).passthrough())
      .optional(),
    text: z.string().optional(),
  })
  .passthrough();

const pasSubmissionSchema = z.object({
  providerId: z.string().uuid(),
  claim: z
    .object({
      resourceType: z.literal("Claim"),
      status: z.string(),
      type: codeableConcept,
      use: z.string(),
      patient: fhirRef.passthrough(),
      provider: fhirRef.passthrough(),
      priority: codeableConcept,
      created: z.string(),
      item: z.array(z.unknown()).min(1),
    })
    .passthrough(),
  questionnaireResponse: z
    .object({
      resourceType: z.literal("QuestionnaireResponse"),
      status: z.enum(["in-progress", "completed", "amended", "entered-in-error", "stopped"]),
    })
    .passthrough(),
  aiieInput: z
    .object({
      patient: z.object({
        age: z.number(),
        sex: z.enum(["male", "female"]),
      }),
      clinicalFactors: z.object({ chiefComplaint: z.string() }).passthrough(),
      order: z
        .object({
          modality: z.string(),
          procedure: z.string(),
        })
        .passthrough(),
    })
    .passthrough(),
  serviceRequest: z
    .object({
      resourceType: z.literal("ServiceRequest"),
      intent: z.string(),
      subject: fhirRef.passthrough(),
    })
    .passthrough(),
  coverage: z
    .object({
      resourceType: z.literal("Coverage"),
      beneficiary: fhirRef.passthrough(),
    })
    .passthrough(),
  orderingProvider: z
    .object({
      resourceType: z.literal("Practitioner"),
    })
    .passthrough(),
});

function outcome(status: number, diagnostics: string): NextResponse<OperationOutcome> {
  const oo: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{ severity: "error", code: "invalid", diagnostics }],
  };
  return NextResponse.json(oo, { status, headers: { "Content-Type": FHIR_JSON } });
}

function mapDecisionToDb(
  d: PASResponse["decision"],
  goldCardAuto: boolean,
): "approved" | "denied" | "pended" | "auto_approved" {
  if (d === "approved" && goldCardAuto) {
    return "auto_approved";
  }
  if (d === "approved") {
    return "approved";
  }
  if (d === "denied") {
    return "denied";
  }
  return "pended";
}

function patientHashFromPas(pas: PASRequest): string | null {
  const ref = pas.serviceRequest.subject?.reference ?? pas.claim.patient?.reference;
  if (!ref?.trim()) {
    return null;
  }
  return createHash("sha256").update(ref.trim(), "utf8").digest("hex");
}

function cptFromPas(pas: PASRequest): string {
  const item = pas.claim.item?.[0];
  const code = item?.productOrService?.coding?.find((c) => c.code && /^\d{5}$/.test(c.code))?.code;
  return code ?? "00000";
}

function icd10FromPas(pas: PASRequest): string[] {
  const dx = pas.claim.diagnosis;
  if (!dx?.length) {
    return [];
  }
  return dx
    .map((d) => d.diagnosisCodeableConcept?.coding?.find((c) => c.code)?.code)
    .filter((c): c is string => typeof c === "string" && c.length > 0);
}

/**
 * POST full PAS packet; returns {@link PASResponse} with simulated adjudication.
 */
async function postPasSubmit(request: Request): Promise<NextResponse<PASResponse | OperationOutcome>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return outcome(400, "Request body must be JSON.");
  }

  const parsed = pasSubmissionSchema.safeParse(json);
  if (!parsed.success) {
    return outcome(400, `Invalid PAS payload: ${parsed.error.message}`);
  }

  const b = parsed.data;
  const pas: PASRequest = {
    claim: b.claim as Claim,
    questionnaireResponse: b.questionnaireResponse as QuestionnaireResponse,
    aiieInput: b.aiieInput as unknown as AIIEInput,
    serviceRequest: b.serviceRequest as ServiceRequest,
    coverage: b.coverage as Coverage,
    orderingProvider: b.orderingProvider as Practitioner,
  };

  const patientHash = patientHashFromPas(pas);
  if (!patientHash) {
    return outcome(422, "Could not derive patient hash from ServiceRequest.subject or Claim.patient reference.");
  }

  const paId = randomUUID();
  const cpt = cptFromPas(pas);
  const icd10s = icd10FromPas(pas);
  const payerId = parseCoverage(pas.coverage).payerId ?? "unknown-payer";

  const gold = await computeGoldCardScore(b.providerId, cpt, payerId);
  const goldCardAuto = gold.data?.eligible === true;
  const result = await submitPAS(pas, { paId, goldCardEligible: goldCardAuto });
  if (result.error || !result.data) {
    return outcome(500, result.error?.message ?? "PAS adjudication failed.");
  }

  const res = result.data;

  if (isDemoMode()) {
    return NextResponse.json(res, { headers: { "Content-Type": FHIR_JSON } });
  }

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
    return outcome(503, adminErr?.message ?? "Database unavailable.");
  }

  const { error: insertErr } = await supabase.from("ins_pa_history").insert({
    id: paId,
    provider_id: b.providerId,
    patient_hash: patientHash,
    cpt_code: cpt,
    icd10_codes: icd10s.length > 0 ? icd10s : ["Z01.818"],
    payer_id: payerId,
    aiie_clinical_score: res.aiieClinicalScore,
    aiie_denial_risk: res.aiieDenialRisk,
    decision: mapDecisionToDb(res.decision, goldCardAuto),
    decision_at: res.decisionTimestamp,
    pas_response: res as unknown as Record<string, unknown>,
  });

  if (insertErr) {
    return outcome(500, `Persist failed: ${insertErr.message}`);
  }

  if (goldCardAuto) {
    await logGoldCardPaAvoided(b.providerId, payerId);
  } else {
    await supabase.from("ins_validation_events").insert({
      event_type: "pa_submitted",
      provider_id: b.providerId,
      payer_id: payerId,
      minutes_saved: PAS_SUBMIT_MGMA_MINUTES_BASELINE,
      amount_usd: null,
    });
  }

  return NextResponse.json(res, { headers: { "Content-Type": FHIR_JSON } });
}

export const POST = withInsApiLogging(postPasSubmit);
