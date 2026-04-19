/**
 * ARKA-INS RBM reviewer actions — persist to `ins_validation_events` as `provider_override` with ROI metadata.
 */

import { createHash } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { isDemoMode } from "@/lib/demo/demo-mode";
import { RBM_REVIEWER_EVENT_SOURCE } from "@/lib/ins/reviewer-queue";
import type { ReviewerActionRequestBody } from "@/lib/ins/reviewer-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const actionSchema = z.object({
  caseId: z.string().uuid(),
  cptCode: z.string().min(1).max(16),
  payerId: z.string().min(1).max(64),
  action: z.enum(["approve", "approve_with_note", "request_dtr", "pend", "deny"]),
  note: z.string().min(1).max(8000),
  overrideReason: z.string().min(1).max(256),
  minutesOnCase: z.number().min(0).max(720),
  providerId: z.string().uuid(),
});

const MGMA_PA_REVIEW_BASELINE_MIN = 12;

/**
 * POST — log reviewer disposition; `minutes_saved` = max(0, 12 − actual minutes on case).
 */
async function postReviewerAction(request: Request): Promise<NextResponse<{ ok: true } | { error: string }>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: msg || "Invalid body" }, { status: 400 });
  }

  const b = parsed.data as ReviewerActionRequestBody;
  const minutesSaved = Math.max(0, Math.round(MGMA_PA_REVIEW_BASELINE_MIN - b.minutesOnCase));

  const noteHash = createHash("sha256").update(b.note, "utf8").digest("hex");

  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Reviewer actions are disabled while DEMO_MODE is enabled." },
      { status: 403 },
    );
  }

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
    return NextResponse.json(
      { error: adminErr?.message ?? "Database unavailable." },
      { status: 503 },
    );
  }

  const { error: insertErr } = await supabase.from("ins_validation_events").insert({
    event_type: "provider_override",
    provider_id: b.providerId,
    payer_id: b.payerId,
    minutes_saved: minutesSaved,
    amount_usd: null,
    metadata: {
      source: RBM_REVIEWER_EVENT_SOURCE,
      action: b.action,
      case_id: b.caseId,
      cpt_code: b.cptCode,
      payer_id: b.payerId,
      override_reason: b.overrideReason,
      note_sha256: noteHash,
    },
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const POST = withInsApiLogging(postReviewerAction);
