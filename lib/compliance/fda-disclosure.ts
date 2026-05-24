/**
 * Canonical FDA non-device CDS footer required on every ARKA-INS CDS card `detail` field.
 * Keep in sync with `.cursorrules` and go-live grep tests.
 */

/** Version string recorded in decision logs and regulatory exports. */
export const FDA_DISCLOSURE_VERSION =
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FDA_DISCLOSURE_VERSION : undefined) ??
  '1.1.0';

export const FDA_NON_DEVICE_CDS_DISCLOSURE =
  "This recommendation is provided by ARKA Imaging Intelligence Engine, an FDA Non-Device Clinical Decision Support tool under the 21st Century Cures Act. The ordering clinician retains full responsibility for the final decision.";

/**
 * Substrings used by CDS sandbox harness and CI grep tests (detail may use markdown emphasis).
 */
export const FDA_DISCLOSURE_MARKERS = [
  "FDA Non-Device",
  "21st Century Cures Act",
  "ordering clinician retains full responsibility",
] as const;

/**
 * Returns true when `detail` includes the canonical disclosure (markdown-tolerant).
 *
 * @param detail - CDS card detail markdown.
 */
export function detailIncludesFdaDisclosure(detail: string | undefined): boolean {
  if (!detail?.trim()) {
    return false;
  }
  const normalized = detail.replace(/\*/g, "");
  return normalized.includes(FDA_NON_DEVICE_CDS_DISCLOSURE);
}
