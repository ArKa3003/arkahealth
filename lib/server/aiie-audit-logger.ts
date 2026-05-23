import { createHash } from "node:crypto";

import { evaluateRedundancy } from "@/lib/aiie/redundancy";
import { traumaGate } from "@/lib/aiie/trauma-gate";
import { imagingLakeAgeBucket } from "@/lib/lake/age-bucket";
import { ingestImagingOrder } from "@/lib/lake/ingest";
import { scrubPhiText } from "@/lib/fhir/phi-scrub";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIEInput, AIIEScore } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import type { ServiceRequest } from "@/lib/types/fhir";

const SHA256_HEX = /^[a-f0-9]{64}$/i;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/;
const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;

/** De-identified row written to `ins_aiie_audit` and optional `arka_lake.imaging_orders`. */
export interface AiieAuditEvent {
  orderHash: string;
  patientHash: string;
  icd10: string[];
  cpt?: string;
  iss?: number;
  gcs?: number;
  mnaiIndex?: number;
  mnaiTier?: string;
  clinicalScore: number;
  denialRisk: number;
  factorPayload: Record<string, unknown>;
  /** Lake: coarse age band (`0-4` … `85+`). */
  ageBucket?: string;
  /** Lake: administrative sex. */
  sex?: string;
  /** Lake: ordered modality. */
  modality?: string;
  /** Lake: anatomic region. */
  bodyPart?: string;
  /** Lake: same-CPT prior within 30 days (duplicate-order proxy). */
  priorImagingWithin30d?: boolean;
  /** Lake: trauma gate severity tier when present. */
  traumaSeverity?: string;
  /** Lake: latest prior report conclusion (scrubbed again at ingest). */
  reportConclusionRedacted?: string;
}

/**
 * SHA-256 hex digest for order or patient identifiers (no raw FHIR ids in storage).
 *
 * @param value - Logical id or `ResourceType/id` reference string.
 */
export function hashAuditIdentifier(value: string): string {
  return createHash("sha256").update(value.trim(), "utf8").digest("hex");
}

function icd10FromServiceRequest(sr: ServiceRequest): string[] {
  const out: string[] = [];
  for (const rc of sr.reasonCode ?? []) {
    for (const c of rc.coding ?? []) {
      const sys = (c.system ?? "").toLowerCase();
      if (
        c.code &&
        (sys.includes("icd-10") ||
          sys.includes("icd10") ||
          sys.includes("icd10cm") ||
          sys.includes("icd-10-cm"))
      ) {
        out.push(c.code.trim().toUpperCase());
      }
    }
  }
  return out;
}

function icd10FromSnapshot(snapshot: PatientRecordSnapshot | undefined): string[] {
  if (!snapshot) {
    return [];
  }
  const codes: string[] = [];
  if (snapshot.codingContext.admissionIcd10) {
    codes.push(snapshot.codingContext.admissionIcd10);
  }
  if (snapshot.codingContext.activeIcd10) {
    codes.push(...snapshot.codingContext.activeIcd10);
  }
  for (const p of snapshot.problems ?? []) {
    if (p.icd10) {
      codes.push(p.icd10);
    }
  }
  return codes.map((c) => c.trim().toUpperCase()).filter(Boolean);
}

function dedupeIcd10(codes: string[]): string[] {
  return [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].slice(0, 32);
}

function latestPriorReportConclusion(
  snapshot: PatientRecordSnapshot | undefined,
): string | undefined {
  if (!snapshot?.priorReports?.length) {
    return undefined;
  }
  const sorted = [...snapshot.priorReports].sort((a, b) =>
    (b.issuedIso ?? "").localeCompare(a.issuedIso ?? ""),
  );
  return sorted[0]?.conclusionExcerpt;
}

function priorImagingWithin30d(
  input: AIIEInput,
): boolean {
  if (!input.recordSnapshot) {
    return false;
  }
  const assessment = evaluateRedundancy(
    input.order,
    input.recordSnapshot,
    input.clinicalFactors.redFlags,
  );
  return (
    assessment.sameCpt &&
    assessment.daysSincePrior !== undefined &&
    assessment.daysSincePrior <= 30
  );
}

function buildDeidentifiedFactorPayload(
  score: AIIEScore,
  input: AIIEInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    confidence: score.confidence,
    factors: score.factors.map((f) => ({
      id: f.id,
      weight: f.weight,
      contribution: f.contribution,
      present: f.present,
    })),
  };

  if (score.mnai) {
    payload.mnai = {
      index: score.mnai.index,
      tier: score.mnai.tier,
      curated: score.mnai.curated,
      matchedIcd10: score.mnai.matchedIcd10,
      matchedCpt: score.mnai.matchedCpt,
      qualifierStatus: score.mnai.qualifierStatus,
    };
  }

  if (input.recordSnapshot) {
    const gate = traumaGate(
      input.recordSnapshot,
      input.order,
      input.clinicalFactors.redFlags,
    );
    payload.trauma = {
      iss: gate.iss,
      gcs: gate.gcs,
      ais: gate.ais,
      severityTier: gate.severityTier,
      gateSignal: gate.gateSignal,
    };
  }

  return payload;
}

function scrubJsonValue(value: unknown): unknown {
  if (typeof value === "string") {
    return scrubPhiText(value);
  }
  if (Array.isArray(value)) {
    return value.map(scrubJsonValue);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubJsonValue(v);
    }
    return out;
  }
  return value;
}

function payloadContainsPhiPatterns(payload: Record<string, unknown>): boolean {
  const stack: unknown[] = [payload];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (typeof cur === "string") {
      if (SSN_PATTERN.test(cur) || PHONE_PATTERN.test(cur)) {
        return true;
      }
      continue;
    }
    if (Array.isArray(cur)) {
      stack.push(...cur);
      continue;
    }
    if (cur && typeof cur === "object") {
      stack.push(...Object.values(cur as Record<string, unknown>));
    }
  }
  return false;
}

/**
 * Builds a de-identified audit event from a completed AIIE score and hook context.
 *
 * @param params - Patient/order ids, optional FHIR order, score, and input used for scoring.
 */
export function buildAiieAuditEvent(params: {
  patientId: string;
  orderId: string;
  serviceRequest?: ServiceRequest;
  input: AIIEInput;
  score: AIIEScore;
}): AiieAuditEvent {
  const { patientId, orderId, serviceRequest, input, score } = params;
  const icd10 = dedupeIcd10([
    ...(serviceRequest ? icd10FromServiceRequest(serviceRequest) : []),
    ...icd10FromSnapshot(input.recordSnapshot),
  ]);

  let iss: number | undefined;
  let gcs: number | undefined;
  let traumaSeverity: string | undefined;
  if (input.recordSnapshot) {
    const gate = traumaGate(
      input.recordSnapshot,
      input.order,
      input.clinicalFactors.redFlags,
    );
    iss = gate.iss;
    gcs = gate.gcs;
    traumaSeverity = gate.severityTier;
  }

  return {
    orderHash: hashAuditIdentifier(orderId),
    patientHash: hashAuditIdentifier(
      patientId.startsWith("Patient/") ? patientId : `Patient/${patientId}`,
    ),
    icd10,
    cpt: input.order.cpt,
    iss,
    gcs,
    mnaiIndex: score.mnai?.index,
    mnaiTier: score.mnai?.tier,
    clinicalScore: score.clinicalScore,
    denialRisk: score.denialRisk,
    factorPayload: buildDeidentifiedFactorPayload(score, input),
    ageBucket: imagingLakeAgeBucket(input.age),
    sex: input.sex,
    modality: input.order.modality,
    bodyPart: input.order.bodyPart,
    priorImagingWithin30d: priorImagingWithin30d(input),
    traumaSeverity,
    reportConclusionRedacted: latestPriorReportConclusion(input.recordSnapshot),
  };
}

/**
 * Persists one AIIE audit row. Never throws; logs insert and PHI-check failures to `console.warn`.
 *
 * @param event - De-identified audit payload.
 */
export async function logAiieAudit(event: AiieAuditEvent): Promise<void> {
  try {
    if (!SHA256_HEX.test(event.orderHash) || !SHA256_HEX.test(event.patientHash)) {
      console.warn("[ins_aiie_audit] skipped: invalid hash format");
      return;
    }

    const factorPayload = scrubJsonValue(event.factorPayload) as Record<string, unknown>;
    if (payloadContainsPhiPatterns(factorPayload)) {
      console.warn("[ins_aiie_audit] skipped: PHI pattern detected after scrub");
      return;
    }

    const { data: supabase, error } = createAdminClient();
    if (error || !supabase) {
      console.warn("[ins_aiie_audit] skipped:", error?.message ?? "no supabase client");
      return;
    }

    const { error: insertErr } = await supabase.from("ins_aiie_audit").insert({
      order_hash: event.orderHash,
      patient_hash: event.patientHash,
      icd10: event.icd10,
      cpt: event.cpt ?? null,
      iss: event.iss ?? null,
      gcs: event.gcs ?? null,
      mnai_index: event.mnaiIndex ?? null,
      mnai_tier: event.mnaiTier ?? null,
      clinical_score: event.clinicalScore,
      denial_risk: event.denialRisk,
      factor_payload: factorPayload,
    });

    if (insertErr) {
      console.warn("[ins_aiie_audit] insert failed:", insertErr.message);
      return;
    }

    const institutionId = process.env.ARKA_INSTITUTION_ID?.trim();
    if (institutionId) {
      void ingestImagingOrder(event, institutionId);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    console.warn("[ins_aiie_audit] unexpected:", msg);
  }
}
