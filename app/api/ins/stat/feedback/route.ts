import { NextResponse } from "next/server";
import { z } from "zod";

import { recordStatGateOverride } from "@/lib/ins/stat-events";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 5;

const bodySchema = z.object({
  orderHash: z.string().regex(/^[a-f0-9]{64}$/i),
  overrideReason: z.string().min(1).max(256),
  clinicianHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
});

/**
 * POST /api/ins/stat/feedback — records clinician override when keeping STAT after reclass card.
 */
async function handlePost(req: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await recordStatGateOverride(
    parsed.data.orderHash,
    parsed.data.overrideReason,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to record override." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export const POST = withInsApiLogging(handlePost);
