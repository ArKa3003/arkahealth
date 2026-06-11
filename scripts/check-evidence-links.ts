/**
 * External citation link checker for the AIIE evidence registry.
 *
 * HTTP-HEADs every unique external citation URL (falling back to GET for hosts
 * that reject HEAD) and reports dead links. Network-dependent: wired into the
 * go-live workflow as a NON-BLOCKING warning job (see docs/CI_KNOWN_ISSUES.md).
 *
 * Usage: npm run evidence:check
 */

import { listEvidenceEntries } from "../lib/evidence/registry";

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;
const USER_AGENT =
  "Mozilla/5.0 (compatible; ARKA-EvidenceLinkCheck/1.0; +https://arkahealth.com)";

interface LinkResult {
  url: string;
  ok: boolean;
  status: number | null;
  detail: string;
  slugs: string[];
}

/** Fetches a URL with the given method, following redirects, with a timeout. */
async function probe(url: string, method: "HEAD" | "GET"): Promise<Response> {
  return fetch(url, {
    method,
    redirect: "follow",
    headers: { "user-agent": USER_AGENT, accept: "*/*" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/**
 * Statuses publishers return to non-browser clients while the page is alive:
 * 403/429 (bot walls, rate limits) and 412 (Cochrane Library WAF).
 */
const BOT_GATED_STATUSES = new Set([403, 412, 429]);

/** Checks one citation URL: HEAD first, GET fallback for HEAD-hostile hosts. */
async function checkUrl(url: string, slugs: string[]): Promise<LinkResult> {
  try {
    let res = await probe(url, "HEAD");
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      // Many publishers (doi.org targets, journal platforms) reject HEAD or
      // bot-gate with 403/405/412/429 — retry with GET before flagging.
      res = await probe(url, "GET");
    }
    const ok = res.ok || BOT_GATED_STATUSES.has(res.status);
    return {
      url,
      ok,
      status: res.status,
      detail: ok && !res.ok ? `${res.status} (bot-gated, treated as alive)` : String(res.status),
      slugs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { url, ok: false, status: null, detail: message, slugs };
  }
}

async function main(): Promise<void> {
  const urlToSlugs = new Map<string, string[]>();
  for (const entry of listEvidenceEntries()) {
    for (const citation of entry.citations) {
      const slugs = urlToSlugs.get(citation.url) ?? [];
      slugs.push(entry.slug);
      urlToSlugs.set(citation.url, slugs);
    }
  }

  const targets = [...urlToSlugs.entries()];
  console.log(`Checking ${targets.length} unique external citation URLs...\n`);

  const results: LinkResult[] = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(batch.map(([url, slugs]) => checkUrl(url, slugs)));
    for (const result of settled) {
      results.push(result);
      console.log(`${result.ok ? "  OK " : " DEAD"}  [${result.detail}]  ${result.url}`);
    }
  }

  const dead = results.filter((r) => !r.ok);
  console.log(`\n${results.length - dead.length}/${results.length} citation URLs alive.`);

  if (dead.length > 0) {
    console.error(`\n${dead.length} dead citation URL(s):`);
    for (const result of dead) {
      console.error(`  ${result.url} [${result.detail}]`);
      console.error(`    referenced by: ${[...new Set(result.slugs)].join(", ")}`);
    }
    process.exitCode = 1;
  }
}

void main();
