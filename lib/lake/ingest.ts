import { createHash } from "node:crypto";

import { scrubPhiText } from "@/lib/fhir/phi-scrub";
import type { AiieAuditEvent } from "@/lib/server/aiie-audit-logger";
import { createAdminClient } from "@/lib/supabase/admin";

const SHA256_HEX = /^[a-f0-9]{64}$/i;

/**
 * Institution-specific salt for lake patient hashes so the same global audit hash
 * cannot be joined across federated sites.
 *
 * @param institutionId - Tenant identifier for the imaging site.
 */
export function lakeInstitutionSalt(institutionId: string): string {
  const perInst =
    process.env[`ARKA_LAKE_SALT_${institutionId.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}`]
      ?.trim();
  if (perInst) {
    return perInst;
  }
  const global = process.env.ARKA_LAKE_PATIENT_SALT?.trim();
  if (global) {
    return `${global}:${institutionId}`;
  }
  return `arka-lake-v1:${institutionId}`;
}

/**
 * Re-hashes an audit-level patient hash with a per-institution salt.
 *
 * @param institutionId - Institution tenant id.
 * @param patientHash - SHA-256 hex from {@link hashAuditIdentifier}.
 */
export function lakePatientHash(institutionId: string, patientHash: string): string {
  const salt = lakeInstitutionSalt(institutionId);
  return createHash("sha256")
    .update(`${salt}:${patientHash}`, "utf8")
    .digest("hex");
}

/**
 * Scrubs and truncates report conclusion text before lake persistence.
 *
 * @param raw - Raw or partially scrubbed conclusion narrative.
 */
export function redactReportConclusion(raw: string | undefined): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const scrubbed = scrubPhiText(raw.trim());
  return scrubbed.length > 0 ? scrubbed : null;
}

/**
 * Inserts one de-identified imaging order row into `arka_lake.imaging_orders`.
 * Never throws; logs failures with `console.warn`.
 *
 * @param event - De-identified AIIE audit payload (may include lake demographic fields).
 * @param institutionId - Federated institution / site identifier.
 */
export async function ingestImagingOrder(
  event: AiieAuditEvent,
  institutionId: string,
): Promise<void> {
  try {
    const inst = institutionId.trim();
    if (!inst) {
      console.warn("[arka_lake] skipped: empty institution_id");
      return;
    }
    if (!SHA256_HEX.test(event.orderHash) || !SHA256_HEX.test(event.patientHash)) {
      console.warn("[arka_lake] skipped: invalid hash format");
      return;
    }

    const ageBucket = event.ageBucket ?? "18-44";
    const sex = event.sex?.trim() || "unknown";

    const { data: supabase, error } = createAdminClient();
    if (error || !supabase) {
      console.warn("[arka_lake] skipped:", error?.message ?? "no supabase client");
      return;
    }

    const reportConclusion = redactReportConclusion(event.reportConclusionRedacted);

    const row = {
      institution_id: inst,
      order_hash: event.orderHash,
      patient_hash: lakePatientHash(inst, event.patientHash),
      age_bucket: ageBucket,
      sex,
      icd10: event.icd10,
      cpt: event.cpt ?? null,
      modality: event.modality ?? null,
      body_part: event.bodyPart ?? null,
      appropriateness: event.clinicalScore,
      denial_risk: event.denialRisk,
      prior_imaging_within_30d: event.priorImagingWithin30d ?? false,
      trauma_severity: event.traumaSeverity ?? null,
      mnai_tier: event.mnaiTier ?? null,
      report_conclusion_redacted: reportConclusion,
    };

    const { error: insertErr } = await supabase
      .schema("arka_lake")
      .from("imaging_orders")
      .upsert(row, { onConflict: "institution_id,order_hash" });

    if (insertErr) {
      console.warn("[arka_lake] insert failed:", insertErr.message);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    console.warn("[arka_lake] unexpected:", msg);
  }
}
