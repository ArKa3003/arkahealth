import { createHash } from "node:crypto";

import type Client from "fhir-kit-client";

import {
  emptyRecordSnapshot,
  normalizeRecord,
  type RawFhirBundle,
  type RawFhirResource,
} from "@/lib/fhir/record-normalizer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIELibError } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import type { Bundle } from "@/lib/types/fhir";

/** Default cache TTL: 30 minutes. */
export const DEFAULT_RECORD_CACHE_TTL_SECONDS = 1800;

/** Re-export fhir-kit-client Client type for scrape callers. */
export type FhirKitClient = Client;

interface RecordCacheRow {
  snapshot: PatientRecordSnapshot;
  captured_at: string;
  expires_at: string;
}

/**
 * SHA-256 hex digest of a patient logical id (used as cache primary key).
 *
 * @param patientId - Raw FHIR Patient id (memory only; never persisted).
 */
export function hashPatientId(patientId: string): string {
  return createHash("sha256").update(patientId, "utf8").digest("hex");
}

function patientRef(patientId: string): string {
  const trimmed = patientId.trim();
  return trimmed.startsWith("Patient/") ? trimmed : `Patient/${trimmed}`;
}

function logicalPatientId(patientId: string): string {
  const ref = patientRef(patientId);
  return ref.startsWith("Patient/") ? ref.slice(8) : ref;
}

function isBundle(value: unknown): value is Bundle {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Bundle).resourceType === "Bundle"
  );
}

function resourcesFromBundle(bundle: Bundle): RawFhirResource[] {
  const out: RawFhirResource[] = [];
  for (const entry of bundle.entry ?? []) {
    const resource = entry.resource;
    if (resource && typeof resource === "object" && "resourceType" in resource) {
      out.push(resource as RawFhirResource);
    }
  }
  return out;
}

async function fhirRequest(
  client: Client,
  path: string,
): Promise<{ data: unknown | null; error: AIIELibError | null }> {
  try {
    const data = await client.request(path, {
      options: { signal: AbortSignal.timeout(8000) },
    });
    return { data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "FHIR request failed";
    return {
      data: null,
      error: { code: "FHIR_RECORD_FETCH_FAILED", message },
    };
  }
}

const SUPPLEMENTAL_SEARCHES = (patientId: string): string[] => {
  const ref = encodeURIComponent(patientRef(patientId));
  return [
    `Condition?patient=${ref}&_count=200`,
    `MedicationRequest?patient=${ref}&_count=200`,
    `MedicationStatement?patient=${ref}&_count=200`,
    `AllergyIntolerance?patient=${ref}&_count=200`,
    `Encounter?patient=${ref}&_count=200`,
    `ImagingStudy?patient=${ref}&_count=200`,
    `DiagnosticReport?patient=${ref}&_count=200`,
    `Observation?patient=${ref}&category=laboratory&_count=200`,
    `Observation?patient=${ref}&category=vital-signs&_count=200`,
    `DocumentReference?patient=${ref}&_count=200`,
  ];
};

async function fetchMergedResources(
  client: Client,
  patientId: string,
): Promise<{ resources: RawFhirResource[]; error: AIIELibError | null }> {
  const merged: RawFhirResource[] = [];
  const seen = new Set<string>();

  const pushUnique = (resources: RawFhirResource[]) => {
    for (const r of resources) {
      const key = `${r.resourceType}/${r.id ?? ""}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(r);
    }
  };

  const everythingPath = `${patientRef(patientId)}/$everything`;
  const everything = await fhirRequest(client, everythingPath);
  if (everything.error) {
    return { resources: [], error: everything.error };
  }
  if (isBundle(everything.data)) {
    pushUnique(resourcesFromBundle(everything.data));
  }

  for (const path of SUPPLEMENTAL_SEARCHES(patientId)) {
    const result = await fhirRequest(client, path);
    if (result.error) {
      return { resources: [], error: result.error };
    }
    if (isBundle(result.data)) {
      pushUnique(resourcesFromBundle(result.data));
    }
  }

  return { resources: merged, error: null };
}

async function readCachedSnapshot(
  patientHash: string,
): Promise<{ data: PatientRecordSnapshot | null; error: AIIELibError | null }> {
  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return { data: null, error: adminError };
  }

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("ins_record_cache")
    .select("snapshot, captured_at, expires_at")
    .eq("patient_hash", patientHash)
    .gt("expires_at", nowIso)
    .limit(1);

  if (error) {
    return {
      data: null,
      error: { code: "RECORD_CACHE_READ_FAILED", message: error.message },
    };
  }

  const row = (rows?.[0] ?? null) as RecordCacheRow | null;
  if (!row?.snapshot) {
    return { data: null, error: null };
  }

  return { data: row.snapshot as PatientRecordSnapshot, error: null };
}

async function writeCachedSnapshot(
  patientHash: string,
  snapshot: PatientRecordSnapshot,
  ttlSeconds: number,
): Promise<{ error: AIIELibError | null }> {
  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return { error: adminError };
  }

  const capturedAt = new Date(snapshot.capturedAtIso);
  const expiresAt = new Date(capturedAt.getTime() + ttlSeconds * 1000);

  const { error } = await supabase.from("ins_record_cache").upsert({
    patient_hash: patientHash,
    snapshot,
    captured_at: snapshot.capturedAtIso,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return {
      error: { code: "RECORD_CACHE_WRITE_FAILED", message: error.message },
    };
  }

  return { error: null };
}

/**
 * Asynchronously ingests a patient's FHIR record via Patient/$everything and targeted
 * searches, with a Supabase-backed cache (`ins_record_cache`) for sub-300ms CDS hook paths.
 *
 * @param args - Patient id, authenticated fhir-kit-client, and optional TTL override.
 * @returns Normalized {@link PatientRecordSnapshot} or a structured {@link AIIELibError}.
 */
export async function scrapePatientRecord(args: {
  patientId: string;
  fhirClient: Client;
  ttlSeconds?: number;
}): Promise<
  { data: PatientRecordSnapshot; error: null } | { data: null; error: AIIELibError }
> {
  const patientId = args.patientId?.trim();
  if (!patientId) {
    return {
      data: null,
      error: { code: "MISSING_PATIENT_ID", message: "patientId is required." },
    };
  }

  const ttlSeconds = args.ttlSeconds ?? DEFAULT_RECORD_CACHE_TTL_SECONDS;
  const patientHash = hashPatientId(logicalPatientId(patientId));

  const cached = await readCachedSnapshot(patientHash);
  if (cached.error) {
    return { data: null, error: cached.error };
  }
  if (cached.data) {
    return { data: cached.data, error: null };
  }

  const capturedAtIso = new Date().toISOString();
  const { resources, error: fetchError } = await fetchMergedResources(
    args.fhirClient,
    patientId,
  );
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  const raw: RawFhirBundle = {
    patientHash,
    capturedAtIso,
    ttlSeconds,
    resources,
  };

  const snapshot =
    resources.length === 0 ?
      emptyRecordSnapshot(patientHash, capturedAtIso, ttlSeconds)
    : normalizeRecord(raw);

  const { error: writeError } = await writeCachedSnapshot(
    patientHash,
    snapshot,
    ttlSeconds,
  );
  if (writeError) {
    return { data: null, error: writeError };
  }

  return { data: snapshot, error: null };
}
