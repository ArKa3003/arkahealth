import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIELibError } from "@/lib/types/aiie";

import { truncateExcerptWords } from "@/lib/retrieval/excerpt";
import type { WebmdCorpusHit } from "@/lib/retrieval/types";

interface WebmdCorpusRow {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  tags: string[] | null;
  licensing: string;
  uploaded_at: string;
}

/**
 * Searches the admin-curated WebMD corpus in Supabase (no live scraping).
 *
 * @param query - Free-text consumer-education query.
 * @returns Corpus hits or a structured error (never throws).
 */
export async function searchWebmdCorpus(
  query: string,
): Promise<{ data: WebmdCorpusHit[]; error: null } | { data: null; error: AIIELibError }> {
  const q = query.trim();
  if (!q) {
    return {
      data: null,
      error: { code: "invalid_query", message: "WebMD corpus search query must be non-empty." },
    };
  }

  const { data: client, error: clientError } = createAdminClient();
  if (clientError || !client) {
    return {
      data: null,
      error: clientError ?? {
        code: "MISSING_SUPABASE_ADMIN_CONFIG",
        message: "Supabase admin client unavailable.",
      },
    };
  }

  const needle = q.toLowerCase();
  const { data: rows, error } = await client
    .from("ins_reference_webmd_corpus")
    .select("id, title, excerpt, url, tags, licensing, uploaded_at")
    .limit(100);

  if (error) {
    return {
      data: null,
      error: { code: "corpus_query_failed", message: error.message },
    };
  }

  const fetchedAt = new Date().toISOString();
  const filtered = ((rows ?? []) as WebmdCorpusRow[]).filter(
    (row) =>
      row.title.toLowerCase().includes(needle) ||
      row.excerpt.toLowerCase().includes(needle) ||
      (row.tags ?? []).some((tag) => tag.toLowerCase().includes(needle)),
  );
  const hits: WebmdCorpusHit[] = filtered.slice(0, 20).map((row) => ({
    id: row.id,
    title: row.title,
    excerpt: truncateExcerptWords(row.excerpt),
    url: row.url,
    tags: row.tags ?? [],
    licensing: row.licensing,
    fetchedAt,
  }));

  return { data: hits, error: null };
}
