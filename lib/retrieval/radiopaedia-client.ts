import type { AIIELibError } from "@/lib/types/aiie";

import { truncateExcerptWords } from "@/lib/retrieval/excerpt";
import { waitRadiopaediaRateLimit } from "@/lib/retrieval/rate-limit";
import type { RadiopaediaHit } from "@/lib/retrieval/types";

const ARTICLES_URL = "https://radiopaedia.org/api/v1/articles";

interface RadiopaediaArticleRaw {
  id?: number | string;
  title?: string;
  name?: string;
  summary?: string;
  excerpt?: string;
  description?: string;
  body?: string;
  url?: string;
  slug?: string;
  tags?: string[];
  tag_list?: string[];
}

/**
 * Searches Radiopaedia articles (background worker only — not for CDS hooks).
 *
 * @param query - Free-text clinical query.
 * @returns Hits or a structured error (never throws).
 */
export async function searchRadiopaedia(
  query: string,
): Promise<{ data: RadiopaediaHit[]; error: null } | { data: null; error: AIIELibError }> {
  const q = query.trim();
  if (!q) {
    return {
      data: null,
      error: { code: "invalid_query", message: "Radiopaedia search query must be non-empty." },
    };
  }

  await waitRadiopaediaRateLimit();

  const url = new URL(ARTICLES_URL);
  url.searchParams.set("query", q);

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.RADIOPAEDIA_ACCESS_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { headers, cache: "no-store" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      data: null,
      error: { code: "upstream_fetch_failed", message },
    };
  }

  if (response.status === 429) {
    return {
      data: null,
      error: {
        code: "upstream_rate_limited",
        message: "Radiopaedia rate limit exceeded. Retry after backoff.",
      },
    };
  }

  if (!response.ok) {
    return {
      data: null,
      error: {
        code: "upstream_error",
        message: `Radiopaedia API returned HTTP ${response.status}.`,
      },
    };
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    return {
      data: null,
      error: { code: "upstream_parse_error", message: "Radiopaedia response was not valid JSON." },
    };
  }

  const rows = extractArticleRows(payload);
  const fetchedAt = new Date().toISOString();
  const hits: RadiopaediaHit[] = rows
    .map((row) => mapArticleRow(row, fetchedAt))
    .filter((hit): hit is RadiopaediaHit => hit != null)
    .slice(0, 20);

  return { data: hits, error: null };
}

function extractArticleRows(payload: unknown): RadiopaediaArticleRaw[] {
  if (Array.isArray(payload)) {
    return payload as RadiopaediaArticleRaw[];
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["articles", "results", "data", "items"]) {
      const candidate = obj[key];
      if (Array.isArray(candidate)) {
        return candidate as RadiopaediaArticleRaw[];
      }
    }
  }
  return [];
}

function mapArticleRow(row: RadiopaediaArticleRaw, fetchedAt: string): RadiopaediaHit | null {
  const id = row.id != null ? String(row.id) : row.slug;
  const title = (row.title ?? row.name)?.trim();
  if (!id || !title) {
    return null;
  }
  const rawExcerpt =
    row.summary ?? row.excerpt ?? row.description ?? stripHtml(row.body ?? "") ?? title;
  const slug = row.slug ?? id;
  const url =
    row.url?.trim() ||
    `https://radiopaedia.org/articles/${encodeURIComponent(String(slug).replace(/\s+/g, "-").toLowerCase())}`;
  const tags = Array.isArray(row.tags)
    ? row.tags.map(String)
    : Array.isArray(row.tag_list)
      ? row.tag_list.map(String)
      : [];

  return {
    id: String(id),
    title,
    excerpt: truncateExcerptWords(rawExcerpt),
    url,
    tags,
    licensing: "CC-BY-NC-SA-3.0",
    fetchedAt,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
