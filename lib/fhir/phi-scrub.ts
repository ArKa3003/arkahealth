/** Maximum length for free-text fields after scrubbing. */
export const PHI_SCRUB_MAX_LENGTH = 2000;

const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const NINE_DIGIT_PATTERN = /\b\d{9}\b/g;
const DATE_LIKE_PATTERN =
  /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;

/**
 * Replaces common PHI patterns in free text and truncates to a safe maximum length.
 *
 * @param text - Raw narrative or display string from FHIR.
 * @returns Scrubbed text suitable for cache and logs.
 */
export function scrubPhiText(text: string | undefined): string {
  if (!text) {
    return "";
  }
  let out = text
    .replace(SSN_PATTERN, "[REDACTED-SSN]")
    .replace(PHONE_PATTERN, "[REDACTED-PHONE]")
    .replace(NINE_DIGIT_PATTERN, "[REDACTED-ID]")
    .replace(DATE_LIKE_PATTERN, (match) => {
      const yearMatch = match.match(/\d{4}/);
      return yearMatch ? yearMatch[0] : "[REDACTED-DATE]";
    });
  if (out.length > PHI_SCRUB_MAX_LENGTH) {
    out = `${out.slice(0, PHI_SCRUB_MAX_LENGTH)}…`;
  }
  return out;
}
