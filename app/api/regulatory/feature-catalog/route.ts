import { NextResponse } from 'next/server';

import { tryGetCitation } from '@/lib/cds-platform/citations';
import { FEATURE_CATALOG } from '@/lib/cds-platform/ml/feature-catalog';
import type { FeatureCatalogRow } from '@/lib/cds-platform/regulatory/api-types';

/**
 * GET /api/regulatory/feature-catalog — read-only Feature Rationale Catalogue export.
 */
export async function GET(): Promise<NextResponse<{ features: FeatureCatalogRow[] }>> {
  const features = Object.entries(FEATURE_CATALOG).map(([name, entry]) => {
    const resolved = tryGetCitation(entry.citationId);
    const citation = {
      id: resolved?.id ?? entry.citationId,
      label: resolved?.label ?? entry.label,
      url: resolved?.url ?? entry.url,
    };
    return {
      name,
      label: entry.label,
      weightDirection: entry.weightDirection,
      rationale: entry.rationale,
      citationId: entry.citationId,
      citation,
      lastClinicalReviewISO: entry.lastClinicalReviewISO,
    };
  });
  return NextResponse.json({ features });
}
