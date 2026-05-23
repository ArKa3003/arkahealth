import { createAdminClient } from "@/lib/supabase/admin";
import type { StatGateResult } from "@/lib/aiie/stat-gate";

/**
 * Persists a STAT gate evaluation to `ins_stat_events` (no PHI).
 */
export async function logInsStatEvent(params: {
  orderHash: string;
  priorityRequested: string;
  gate: StatGateResult;
  clinicianHash?: string;
  overrideReason?: string;
}): Promise<void> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return;
  }

  await supabase.from("ins_stat_events").insert({
    order_hash: params.orderHash,
    priority_requested: params.priorityRequested,
    priority_recommended: params.gate.recommendedPriority,
    meets_criteria: params.gate.meetsCriteria,
    matched_criteria: params.gate.matchedCriteria,
    override_reason: params.overrideReason ?? null,
    clinician_hash: params.clinicianHash ?? null,
  });
}

/**
 * Records clinician override when dismissing the STAT reclass card (keeps STAT).
 *
 * @param orderHash - SHA-256 order identifier.
 * @param overrideReason - CDS override reason code from the EHR.
 */
export async function recordStatGateOverride(
  orderHash: string,
  overrideReason: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = orderHash.trim();
  const reason = overrideReason.trim();
  if (!trimmed || !reason) {
    return { ok: false, error: "orderHash and overrideReason are required." };
  }

  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return { ok: false, error: adminError?.message ?? "Supabase unavailable." };
  }

  const { data: rows, error: selectError } = await supabase
    .from("ins_stat_events")
    .select("id")
    .eq("order_hash", trimmed)
    .order("created_at", { ascending: false })
    .limit(1);

  if (selectError) {
    return { ok: false, error: selectError.message };
  }

  const row = (rows?.[0] ?? null) as { id?: string } | null;
  if (!row?.id) {
    await supabase.from("ins_stat_events").insert({
      order_hash: trimmed,
      priority_requested: "stat",
      priority_recommended: "stat",
      meets_criteria: true,
      matched_criteria: [],
      override_reason: reason,
      clinician_hash: null,
    });
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("ins_stat_events")
    .update({ override_reason: reason, meets_criteria: true, priority_recommended: "stat" })
    .eq("id", row.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}
