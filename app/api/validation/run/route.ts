import { NextRequest, NextResponse } from 'next/server';

import { RetrospectiveValidator } from '@/lib/cds-platform/validation/retrospective-validator';
import type { ValidationConfig, ValidationReport } from '@/lib/cds-platform/validation/types';

export const maxDuration = 60;

interface RunValidationBody {
  n_samples?: number;
  include_subgroups?: boolean;
}

/**
 * Parse boolean from query string or JSON body.
 */
function parseBool(value: string | boolean | null | undefined): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  const v = value.toLowerCase();
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return undefined;
}

/**
 * Clamp sample count to dashboard-supported range.
 */
function parseNSamples(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (Number.isNaN(n)) return undefined;
  return Math.min(5000, Math.max(100, n));
}

/**
 * Resolve validation config from JSON body and/or query parameters.
 */
async function resolveConfig(request: NextRequest): Promise<ValidationConfig> {
  const url = new URL(request.url);
  let nSamples = parseNSamples(url.searchParams.get('n_samples'));
  let includeSubgroups = parseBool(url.searchParams.get('include_subgroups'));

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as RunValidationBody;
      if (body.n_samples !== undefined) {
        nSamples = parseNSamples(body.n_samples);
      }
      if (body.include_subgroups !== undefined) {
        includeSubgroups = parseBool(body.include_subgroups);
      }
    } catch {
      // Empty or invalid JSON body — query params only.
    }
  }

  return {
    nSamples: nSamples ?? 1000,
    includeSubgroups: includeSubgroups ?? true,
    dataSource: 'synthetic',
  };
}

/**
 * POST /api/validation/run — run retrospective validation harness and return report state.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ValidationReport | { error: string }>> {
  try {
    const config = await resolveConfig(request);
    const validator = new RetrospectiveValidator();
    const report = await validator.runValidation(config);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation run failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
