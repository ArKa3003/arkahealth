import { NextResponse } from "next/server";
import { z } from "zod";

import { recordSwallowOverride } from "@/lib/ins/swallow-overrides";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 5;

const bodySchema = z.object({
  patientHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
  proposed: z.enum(["VFSS", "FEES", "bedside_sle", "unknown"]),
  recommended: z.enum(["VFSS", "FEES", "bedside_sle", "unknown"]),
  clinicianChoice: z.enum(["VFSS", "FEES", "bedside_sle", "unknown"]),
  overrideReason: z.string().min(1).max(512).optional(),
});

/**
 * POST /api/ins/swallow-overrides — records clinician choice when triage disagrees with the order.
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

  const { patientHash, proposed, recommended, clinicianChoice, overrideReason } = parsed.data;

  if (
    clinicianChoice === "VFSS" &&
    recommended === "FEES" &&
    (!overrideReason || overrideReason.trim().length === 0)
  ) {
    return NextResponse.json(
      { error: "overrideReason is required when keeping VFSS after FEES was recommended." },
      { status: 400 },
    );
  }

  const result = await recordSwallowOverride({
    patientHash,
    proposed,
    recommended,
    clinicianChoice,
    overrideReason,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export const POST = withInsApiLogging(handlePost);
