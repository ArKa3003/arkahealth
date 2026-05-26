import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Reads a Markdown document from the repository root at build/request time.
 *
 * @param relativePath - Path relative to process.cwd() (e.g. `docs/REGULATORY_RATIONALE_MEMO.md`).
 */
export async function readRepoMarkdown(relativePath: string): Promise<string> {
  const absolute = path.join(process.cwd(), relativePath);
  return readFile(absolute, 'utf-8');
}
