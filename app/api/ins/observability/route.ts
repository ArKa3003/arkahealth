/**
 * Cached observability sparkline payload for the INS dashboard card.
 */

import { NextResponse } from "next/server";

import { isDemoMode } from "@/lib/demo/demo-mode";
import {
  buildObservabilitySnapshot,
  buildOfflineObservabilitySnapshot,
} from "@/lib/server/metrics-counters";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 3;

/** CDN / browser cache aligned with client 30s refresh (serve stale while revalidating). */
const CACHE_CONTROL = "public, s-maxage=25, stale-while-revalidate=30";

async function getHandler(): Promise<NextResponse> {
  if (isDemoMode()) {
    const body = buildOfflineObservabilitySnapshot(60);
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "X-Observability-Source": "demo",
      },
    });
  }

  const body = await buildObservabilitySnapshot(60);
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "X-Observability-Source": "live",
    },
  });
}

export const GET = withInsApiLogging(getHandler);
