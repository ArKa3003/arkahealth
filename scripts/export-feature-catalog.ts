/**
 * Exports FEATURE_CATALOG to JSON for ml-service training guardrails (Phase 5.3).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { FEATURE_CATALOG } from '@/lib/cds-platform/ml/feature-catalog';

const outPath = join(process.cwd(), 'lib/cds-platform/ml/feature-catalog.json');

writeFileSync(outPath, `${JSON.stringify(FEATURE_CATALOG, null, 2)}\n`, 'utf8');

const keys = Object.keys(FEATURE_CATALOG);
console.log(`Wrote ${keys.length} features to ${outPath}`);
