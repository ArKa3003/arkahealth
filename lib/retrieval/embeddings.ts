import { createHash } from "node:crypto";

const EMBEDDING_DIM = 384;

/**
 * Builds a deterministic 384-dimensional unit vector from text (offline / demo default).
 *
 * @param text - Input text.
 * @returns L2-normalized embedding vector.
 */
export function hashEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  const normalized = text.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const idx = (code * (i + 7)) % EMBEDDING_DIM;
    vec[idx] = (vec[idx] ?? 0) + (code % 97) / 97 - 0.5;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/**
 * Resolves an embedding for reference indexing (OpenAI when configured, else deterministic hash).
 *
 * @param text - Text to embed.
 * @returns 384-dimensional vector.
 */
export async function resolveEmbedding(text: string): Promise<number[]> {
  if (process.env.ARKA_EMBEDDINGS_PROVIDER === "openai") {
    const openAi = await fetchOpenAiEmbedding(text);
    if (openAi) {
      return openAi;
    }
  }
  return hashEmbedding(text);
}

async function fetchOpenAiEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
        dimensions: EMBEDDING_DIM,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    const embedding = json.data?.[0]?.embedding;
    if (!embedding || embedding.length !== EMBEDDING_DIM) {
      return null;
    }
    return embedding;
  } catch {
    return null;
  }
}

/**
 * Stable SHA-256 hex digest for cache keys (complaint hashing; no PHI stored).
 *
 * @param value - Raw string to hash.
 * @returns Lowercase hex digest.
 */
export function hashCacheKeyPart(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export { EMBEDDING_DIM };
