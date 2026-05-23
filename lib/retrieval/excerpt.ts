const MAX_WORDS = 300;

/**
 * Hard-truncates text to at most {@link MAX_WORDS} words (server-side licensing guard).
 *
 * @param text - Raw excerpt or summary.
 * @returns Truncated excerpt with ellipsis when shortened.
 */
export function truncateExcerptWords(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= MAX_WORDS) {
    return trimmed;
  }
  return `${words.slice(0, MAX_WORDS).join(" ")}…`;
}
