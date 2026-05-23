import { NextResponse } from "next/server";

import { refreshReferenceCache } from "@/lib/retrieval/refresh-cache";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 10;

/**
 * Returns true when the request carries the Vercel cron secret or Supabase service role key.
 */
function isServiceOrCronAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ")) {
    return false;
  }
  const token = auth.slice(7).trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return (
    (cronSecret != null && cronSecret.length > 0 && token === cronSecret) ||
    (serviceKey != null && serviceKey.length > 0 && token === serviceKey)
  );
}

/**
 * POST /api/ins/reference/refresh — nightly worker: Radiopaedia + corpus → pgvector cache.
 */
async function handlePost(req: Request): Promise<NextResponse> {
  if (!isServiceOrCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Serverless cap: full 200-combo refresh runs via `npm run refresh:reference-cache`.
  const result = await refreshReferenceCache({ maxCombos: 3 });
  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export const POST = withInsApiLogging(handlePost);

/** Vercel Cron issues GET; reuse POST handler with the same auth gate. */
export const GET = withInsApiLogging(handlePost);
