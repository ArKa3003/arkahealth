import { createClient } from "@supabase/supabase-js";

const SHA256_HEX = /^[a-fA-F0-9]{64}$/;

export interface SwallowOverrideEvent {
  patientHash: string;
  proposed: string;
  recommended: string;
  clinicianChoice: string;
  overrideReason?: string;
}

/**
 * Persists a de-identified swallow-triage override for quality committee trending.
 *
 * @param event - Hashed patient id and modality choices only (no PHI).
 */
export async function recordSwallowOverride(
  event: SwallowOverrideEvent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!SHA256_HEX.test(event.patientHash)) {
    return { ok: false, error: "Invalid patient_hash." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("ins_swallow_overrides").insert({
    patient_hash: event.patientHash,
    proposed: event.proposed,
    recommended: event.recommended,
    clinician_choice: event.clinicianChoice,
    override_reason: event.overrideReason?.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
