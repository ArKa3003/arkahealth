/** In-process warm cache for viewer WebP thumbnails (demo / repeat loads). */
const cache = new Map<string, { webp: Buffer; expiresAt: number }>();

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function cacheKey(patientHash: string, studyUid: string): string {
  return `${patientHash}:${studyUid}`;
}

/**
 * Reads a cached WebP buffer if still valid.
 */
export function getCachedThumbnail(
  patientHash: string,
  studyUid: string,
): Buffer | null {
  const entry = cache.get(cacheKey(patientHash, studyUid));
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(patientHash, studyUid));
    return null;
  }
  return entry.webp;
}

/**
 * Stores a WebP thumbnail in the warm cache.
 */
export function setCachedThumbnail(
  patientHash: string,
  studyUid: string,
  webp: Buffer,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  cache.set(cacheKey(patientHash, studyUid), {
    webp,
    expiresAt: Date.now() + ttlMs,
  });
}

/** Clears cache (tests). */
export function clearThumbnailCache(): void {
  cache.clear();
}
