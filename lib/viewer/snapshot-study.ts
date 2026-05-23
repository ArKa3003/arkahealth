import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIELibError } from "@/lib/types/aiie";
import type { PatientRecordSnapshot, PriorImagingStudy } from "@/lib/types/record-snapshot";

/**
 * Loads a non-expired record snapshot from `ins_record_cache` by patient hash.
 *
 * @param patientHash - SHA-256 hex digest.
 */
export async function readCachedRecordSnapshot(
  patientHash: string,
): Promise<
  { data: PatientRecordSnapshot; error: null } | { data: null; error: AIIELibError }
> {
  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return {
      data: null,
      error: adminError ?? { code: "SUPABASE_UNAVAILABLE", message: "Admin client unavailable." },
    };
  }

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("ins_record_cache")
    .select("snapshot")
    .eq("patient_hash", patientHash)
    .gt("expires_at", nowIso)
    .limit(1);

  if (error) {
    return {
      data: null,
      error: { code: "RECORD_CACHE_READ_FAILED", message: error.message },
    };
  }

  const row = rows?.[0] as { snapshot?: PatientRecordSnapshot } | undefined;
  if (!row?.snapshot) {
    return {
      data: null,
      error: { code: "RECORD_SNAPSHOT_NOT_FOUND", message: "No cached record for patient." },
    };
  }

  return { data: row.snapshot, error: null };
}

/**
 * Finds a prior imaging row in a snapshot by FHIR id or DICOM Study Instance UID.
 *
 * @param snapshot - Patient record snapshot.
 * @param studyUid - Route segment (logical id or DICOM UID).
 */
export function findImagingStudyInSnapshot(
  snapshot: PatientRecordSnapshot,
  studyUid: string,
): PriorImagingStudy | undefined {
  const key = studyUid.trim();
  return snapshot.priorImaging.find(
    (s) => s.id === key || s.studyUid === key,
  );
}
