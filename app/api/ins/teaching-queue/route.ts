import { NextResponse } from "next/server";

import { redactSnapshotForTeaching, type RarityAssessment } from "@/lib/aiie/interesting-case";
import { hashAuditIdentifier } from "@/lib/server/aiie-audit-logger";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

type TeachingQueueBody = {
  patientHash: string;
  rarity: RarityAssessment;
  snapshot: PatientRecordSnapshot;
  addedBy?: string;
};

const SHA256_HEX = /^[a-f0-9]{64}$/i;

/**
 * POST /api/ins/teaching-queue — clinician opt-in; stores hashed ids and redacted snapshot only.
 */
async function postTeachingQueue(request: Request): Promise<NextResponse> {
  let body: TeachingQueueBody;
  try {
    body = (await request.json()) as TeachingQueueBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patientHash = body.patientHash?.trim();
  if (!patientHash || !SHA256_HEX.test(patientHash)) {
    return NextResponse.json({ error: "patientHash must be a SHA-256 hex digest" }, { status: 400 });
  }

  if (!body.rarity?.interesting) {
    return NextResponse.json({ error: "Case is not flagged as interesting" }, { status: 400 });
  }

  if (!body.snapshot) {
    return NextResponse.json({ error: "snapshot is required" }, { status: 400 });
  }

  const addedByHash = hashAuditIdentifier(
    body.addedBy?.trim() || request.headers.get("x-provider-id")?.trim() || "anonymous-clinician",
  );

  const snapshotRedacted = redactSnapshotForTeaching({
    ...body.snapshot,
    patientHash,
  });

  const { data: supabase, error: clientError } = createAdminClient();
  if (clientError || !supabase) {
    return NextResponse.json({ error: clientError?.message ?? "Database unavailable" }, { status: 503 });
  }

  const { data: row, error: insertError } = await supabase
    .from("ins_teaching_queue")
    .insert({
      patient_hash: patientHash,
      rarity_score: body.rarity.rarityScore,
      drivers: body.rarity.drivers,
      snapshot_redacted: snapshotRedacted,
      added_by_hash: addedByHash,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ id: row?.id, queued: true });
}

export const POST = withInsApiLogging(postTeachingQueue);
