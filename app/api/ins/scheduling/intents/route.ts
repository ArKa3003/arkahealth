import { NextResponse } from "next/server";

import { getSchedulingIntentDashboard } from "@/lib/ins/scheduling-intent";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

/**
 * GET /api/ins/scheduling/intents — scheduling queue summary for ARKA-INS dashboard (no PHI).
 */
async function handleGet(): Promise<NextResponse> {
  const data = await getSchedulingIntentDashboard();
  return NextResponse.json(data, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export const GET = withInsApiLogging(handleGet);
