import { NextResponse } from 'next/server';

import { CITATIONS, type Citation } from '@/lib/cds-platform/citations';

/**
 * GET /api/regulatory/citation-library — read-only citation registry export.
 */
export async function GET(): Promise<NextResponse<{ citations: Citation[] }>> {
  const citations = Object.values(CITATIONS);
  return NextResponse.json({ citations });
}
