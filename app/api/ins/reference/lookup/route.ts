import { NextResponse } from "next/server";
import { z } from "zod";

import { composeReferenceQuery } from "@/lib/retrieval/compose-query";
import { truncateExcerptWords } from "@/lib/retrieval/excerpt";
import { queryTopK } from "@/lib/retrieval/vector-index";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const querySchema = z.object({
  cpt: z.string().optional(),
  bodyPart: z.string().optional(),
  complaint: z.string().min(1),
});

/**
 * GET /api/ins/reference/lookup — cache-only reference hits (no upstream fetch).
 */
async function getReferenceLookup(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    cpt: searchParams.get("cpt") ?? undefined,
    bodyPart: searchParams.get("bodyPart") ?? undefined,
    complaint: searchParams.get("complaint") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const composed = composeReferenceQuery(parsed.data);
  const hits = await queryTopK(composed, 5);

  const results = hits.map((hit) => ({
    id: hit.id,
    source: hit.source,
    title: hit.title,
    excerpt: truncateExcerptWords(hit.excerpt),
    url: hit.url,
    tags: hit.tags,
    licensing: hit.licensing,
    fetchedAt: hit.fetchedAt,
  }));

  return NextResponse.json(
    { query: composed, results },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = withInsApiLogging(getReferenceLookup);
