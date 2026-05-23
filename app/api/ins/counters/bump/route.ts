/**
 * Fire-and-forget counter increment from browser demos (non-PHI labels only).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { bump } from "@/lib/server/metrics-counters";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

const bodySchema = z.object({
  counter: z.string().min(1).max(128),
  labels: z.record(z.string(), z.string()).optional(),
});

async function postHandler(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid counter payload" }, { status: 400 });
  }

  await bump(parsed.data.counter, parsed.data.labels);
  return NextResponse.json({ ok: true });
}

export const POST = withInsApiLogging(postHandler);
