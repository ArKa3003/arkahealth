import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIELibError } from "@/lib/types/aiie";

import { resolveEmbedding } from "@/lib/retrieval/embeddings";
import type { ReferenceDoc, ReferenceSource } from "@/lib/retrieval/types";

interface CacheRow {
  id: string;
  source: ReferenceSource;
  title: string;
  excerpt: string;
  url: string;
  tags: string[] | null;
  licensing: string;
  fetched_at: string;
  similarity?: number;
}

/**
 * Embeds a reference document and upserts it into `ins_reference_cache`.
 *
 * @param doc - Document to index (embedding computed from title + excerpt).
 */
export async function embedAndStore(doc: ReferenceDoc): Promise<void> {
  const { data: client, error: clientError } = createAdminClient();
  if (clientError || !client) {
    return;
  }

  const embedText = `${doc.title}\n${doc.excerpt}`;
  const embedding = await resolveEmbedding(embedText);

  const row = {
    source: doc.source,
    title: doc.title,
    excerpt: doc.excerpt,
    url: doc.url,
    tags: doc.tags,
    licensing: doc.licensing,
    embedding,
    fetched_at: doc.fetchedAt ?? new Date().toISOString(),
  };

  await client.from("ins_reference_cache").upsert(row, { onConflict: "source,url" });
}

/**
 * Returns top-k similar cached references (30-day TTL); never calls upstream APIs.
 *
 * @param query - Composed clinical query string.
 * @param k - Maximum hits (default 5).
 * @returns Ranked reference documents (empty when cache cold or misconfigured).
 */
export async function queryTopK(query: string, k = 5): Promise<ReferenceDoc[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }

  const { data: client, error: clientError } = createAdminClient();
  if (clientError || !client) {
    return [];
  }

  const embedding = await resolveEmbedding(q);
  const { data, error } = await client.rpc("match_ins_reference_cache", {
    query_embedding: embedding,
    match_count: k,
  });

  if (error || !data) {
    return [];
  }

  return (data as CacheRow[]).map((row) => ({
    id: row.id,
    source: row.source,
    title: row.title,
    excerpt: row.excerpt,
    url: row.url,
    tags: row.tags ?? [],
    licensing: row.licensing,
    fetchedAt: row.fetched_at,
  }));
}

/**
 * Maps retrieval errors for worker scripts (non-throwing).
 *
 * @param error - Upstream lib error.
 * @returns Same error (typed helper for callers).
 */
export function asRetrievalError(error: AIIELibError): AIIELibError {
  return error;
}
