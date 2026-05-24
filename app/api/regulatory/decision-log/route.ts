import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';

import type { DecisionLogEntry } from '@/lib/cds-platform/audit/decision-log';
import { isRegulatoryPreviewAllowed } from '@/lib/cds-platform/regulatory/preview-gate';

const LOG_DIR = join(process.cwd(), 'logs');
const MAX_ENTRIES = 50;

/**
 * Reads up to {@link MAX_ENTRIES} most recent lines from `logs/decisions-*.jsonl`.
 */
async function readRecentDecisionLogEntries(): Promise<DecisionLogEntry[]> {
  let files: string[];
  try {
    files = await readdir(LOG_DIR);
  } catch {
    return [];
  }

  const decisionFiles = files
    .filter((f) => /^decisions-\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
    .sort()
    .reverse();

  const entries: DecisionLogEntry[] = [];

  for (const file of decisionFiles) {
    if (entries.length >= MAX_ENTRIES) break;
    try {
      const raw = await readFile(join(LOG_DIR, file), 'utf8');
      const lines = raw.split('\n').filter((line) => line.trim().length > 0);
      for (let i = lines.length - 1; i >= 0 && entries.length < MAX_ENTRIES; i -= 1) {
        try {
          entries.push(JSON.parse(lines[i]!) as DecisionLogEntry);
        } catch {
          // Skip malformed lines.
        }
      }
    } catch {
      // Skip unreadable files.
    }
  }

  return entries.slice(0, MAX_ENTRIES);
}

/**
 * GET /api/regulatory/decision-log — last 50 PHI-redacted decision log entries (gated).
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<{ entries: DecisionLogEntry[] } | { error: string }>> {
  if (!isRegulatoryPreviewAllowed(request)) {
    return NextResponse.json({ error: 'Regulatory preview not authorized' }, { status: 403 });
  }

  const entries = await readRecentDecisionLogEntries();
  return NextResponse.json({ entries });
}
