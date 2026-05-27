import type { FeatureCatalogEntry } from '@/lib/cds-platform/ml/feature-catalog';

/** Canonical production origin for in-app regulatory documentation. */
export const ARKA_FEATURE_CATALOG_BASE = 'https://www.getarka.health/docs/feature-catalog';

/** Hostnames treated as first-party for in-app Next.js navigation. */
export const ARKA_IN_APP_HOSTS = new Set([
  'www.getarka.health',
  'getarka.health',
  'arkahealth.com',
  'www.arkahealth.com',
  'arkahealth.vercel.app',
  'localhost',
  '127.0.0.1',
]);

/**
 * Resolves the citation URL shown on SHAP rows and CDS extensions.
 * Context-dependent features deep-link to the per-feature anchor on the catalogue page;
 * guideline-class features keep their external authority URLs.
 *
 * @param featureName - ML feature key (catalogue map key).
 * @param entry - Feature Rationale Catalogue entry.
 */
export function buildFeatureCitationUrl(featureName: string, entry: FeatureCatalogEntry): string {
  if (entry.authorityClass === 'context_dependent') {
    return `${ARKA_FEATURE_CATALOG_BASE}#${featureName}`;
  }
  return entry.url;
}

/**
 * Converts a first-party absolute URL to a same-origin relative path for Next.js {@link Link}.
 *
 * @param url - Absolute or relative citation URL.
 */
export function toInAppHref(url: string): string | null {
  if (url.startsWith('/')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (ARKA_IN_APP_HOSTS.has(parsed.hostname)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * @param url - Citation URL to classify.
 */
export function isArkaInAppUrl(url: string): boolean {
  return toInAppHref(url) !== null;
}
