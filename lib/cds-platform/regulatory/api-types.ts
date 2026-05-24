import type { FeatureCatalogEntry } from '@/lib/cds-platform/ml/feature-catalog';

/** Row shape returned by GET /api/regulatory/feature-catalog. */
export interface FeatureCatalogRow {
  name: string;
  label: string;
  weightDirection: FeatureCatalogEntry['weightDirection'];
  rationale: string;
  citationId: string;
  citation: { id: string; label: string; url: string };
  lastClinicalReviewISO: string;
}
