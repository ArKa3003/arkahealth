/**
 * Evidence URL contract (Part 4): every CDS evidence link points at the
 * first-party `/evidence/[slug]` route, built from `NEXT_PUBLIC_SITE_URL`.
 * Never link to external domains from clinical cards — slugs resolve through
 * the ARKA evidence registry, which carries the underlying citations.
 */

const DEFAULT_SITE_URL = "https://arkahealth.com";

/**
 * Builds the absolute first-party evidence URL for a Knowledge Matrix evidence slug.
 *
 * @param slug - Stable kebab-case `evidenceSlug` emitted by the AIIE Clinical Knowledge Matrix.
 * @returns Absolute URL of the form `{NEXT_PUBLIC_SITE_URL}/evidence/{slug}`.
 */
export function evidenceUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}/evidence/${safeSlug || "imaging"}`;
}
