/**
 * Static internal link audit for the ARKA app router surface.
 *
 * Discovers valid routes from `app/` (pages, dynamic segments, API is excluded)
 * and asserts every internal href from navigation registries and `app/` source
 * files resolves to an existing route.
 *
 * Usage: npm run links:check
 */

import fs from "node:fs";
import path from "node:path";

import { routes } from "../lib/constants";
import { commandRoutes, phaseNavItems } from "../lib/navigation/routes";
import { listEvidenceEntries } from "../lib/evidence/registry";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP_DIR = path.join(ROOT, "app");

/** Source locations scanned for href literals beyond the nav registries. */
const HREF_SCAN_DIRS = [
  path.join(ROOT, "app"),
  path.join(ROOT, "components/navigation"),
  path.join(ROOT, "components/landing"),
];

type HrefSource = { href: string; source: string };

/** Recursively lists files under `dir` matching `pattern`. */
function walkFiles(dir: string, pattern: RegExp, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkFiles(full, pattern, acc);
    } else if (pattern.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/** Converts an `app/` relative directory to an App Router path. */
function dirToRoute(rel: string): string {
  if (rel === ".") return "/";
  const segments = rel.split(path.sep);
  const route =
    "/" +
    segments
      .map((seg) => {
        if (seg.startsWith("(") && seg.endsWith(")")) return "";
        return seg;
      })
      .filter(Boolean)
      .join("/");
  return route.replace(/\/+/g, "/");
}

/**
 * Builds the set of valid app-router page paths from the `app/` tree.
 * Dynamic `[param]` segments are preserved; optional catch-alls are skipped.
 */
function discoverPageRoutes(): Set<string> {
  const pages = walkFiles(APP_DIR, /^page\.tsx?$/);
  const valid = new Set<string>();

  for (const pageFile of pages) {
    const rel = path.relative(APP_DIR, path.dirname(pageFile));
    valid.add(dirToRoute(rel));
  }

  return valid;
}

/** API route handlers under app/api (route.ts files). */
function discoverApiRoutes(): Set<string> {
  const apiDir = path.join(APP_DIR, "api");
  const handlers = walkFiles(apiDir, /^route\.tsx?$/);
  const valid = new Set<string>();

  for (const routeFile of handlers) {
    const rel = path.relative(apiDir, path.dirname(routeFile));
    const route = rel === "." ? "/api" : `/api/${rel.split(path.sep).join("/")}`;
    valid.add(route);
  }

  return valid;
}

/** Vercel rewrite sources that map to in-app destinations (e.g. CDS discovery). */
function discoverRewriteSources(): Set<string> {
  const vercelPath = path.join(ROOT, "vercel.json");
  if (!fs.existsSync(vercelPath)) return new Set();
  const config = JSON.parse(fs.readFileSync(vercelPath, "utf8")) as {
    rewrites?: Array<{ source: string; destination: string }>;
  };
  const sources = new Set<string>();
  for (const rw of config.rewrites ?? []) {
    const source = rw.source.replace(/:path\*$/, "").replace(/\/$/, "");
    sources.add(source);
  }
  return sources;
}

/** Evidence slugs with static pages from generateStaticParams. */
function evidenceSlugs(): Set<string> {
  return new Set(listEvidenceEntries().map((e) => e.slug));
}

/** Extracts internal href strings from TSX/TS source. */
function extractHrefsFromFile(filePath: string): HrefSource[] {
  const text = fs.readFileSync(filePath, "utf8");
  const rel = path.relative(ROOT, filePath);
  const found: HrefSource[] = [];

  const patterns = [
    /href\s*=\s*["'`](\/[^"'`#?]*)/g,
    /href:\s*["'`](\/[^"'`#?]*)/g,
    /href:\s*`(\$\{[^}]+\}[^`]*|\/[^`#?]*)/g,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const raw = m[1];
      if (!raw.startsWith("/")) continue;
      if (raw.includes("${")) continue;
      found.push({ href: raw, source: rel });
    }
  }

  return found;
}

/** Collects hrefs declared in navigation registries and route constants. */
function registryHrefs(): HrefSource[] {
  const out: HrefSource[] = [];

  for (const [key, value] of Object.entries(routes)) {
    if (typeof value === "string" && value.startsWith("/")) {
      out.push({ href: value, source: `lib/constants.ts#routes.${key}` });
    }
  }

  for (const item of phaseNavItems) {
    out.push({ href: item.href, source: `lib/navigation/routes.ts#phaseNavItems.${item.id}` });
  }

  for (const item of commandRoutes) {
    if (item.external) continue;
    out.push({ href: item.href, source: `lib/navigation/routes.ts#commandRoutes.${item.id}` });
  }

  return out;
}

/** Strips hash and query from an href for route matching. */
function normalizeHref(href: string): { pathname: string; hash?: string } {
  const [pathAndQuery, hashPart] = href.split("#");
  const pathname = pathAndQuery.split("?")[0] || "/";
  return {
    pathname: pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname,
    hash: hashPart ? `#${hashPart}` : undefined,
  };
}

/**
 * Returns true when `pathname` matches a discovered route, including dynamic
 * segments with known slug sets.
 */
function routeExists(
  pathname: string,
  pageRoutes: Set<string>,
  apiRoutes: Set<string>,
  rewriteSources: Set<string>,
  slugs: Set<string>,
): boolean {
  if (pageRoutes.has(pathname)) return true;
  if (apiRoutes.has(pathname)) return true;
  if (rewriteSources.has(pathname)) return true;

  // Hash-only home anchors are always valid on /
  if (pathname === "/") return true;

  const evidenceMatch = pathname.match(/^\/evidence\/([^/]+)$/);
  if (evidenceMatch) {
    return slugs.has(evidenceMatch[1]);
  }

  const patientExplainer = pathname.match(/^\/ins\/patient\/explainer\/([^/]+)$/);
  if (patientExplainer) return true;

  const goldCard = pathname.match(/^\/ins\/provider\/gold-card$/);
  if (goldCard) return pageRoutes.has("/ins/provider/gold-card");

  // Dynamic single-segment fallthrough: check parent static prefix exists
  for (const route of pageRoutes) {
    if (!route.includes("[")) continue;
    const prefix = route.replace(/\/\[[^\]]+\]/g, "");
    if (pathname.startsWith(prefix) && pathname.length > prefix.length) {
      return true;
    }
  }

  return false;
}

function main(): void {
  const pageRoutes = discoverPageRoutes();
  const apiRoutes = discoverApiRoutes();
  const rewriteSources = discoverRewriteSources();
  const slugs = evidenceSlugs();

  const hrefs: HrefSource[] = [...registryHrefs()];

  for (const dir of HREF_SCAN_DIRS) {
    for (const file of walkFiles(dir, /\.(tsx|ts|mdx)$/)) {
      hrefs.push(...extractHrefsFromFile(file));
    }
  }

  const seen = new Set<string>();
  const broken: Array<{ href: string; pathname: string; sources: string[] }> = [];

  for (const { href, source } of hrefs) {
    if (!href.startsWith("/")) continue;
    if (href.startsWith("//")) continue;
    if (seen.has(href)) continue;
    seen.add(href);

    const { pathname } = normalizeHref(href);
    if (!routeExists(pathname, pageRoutes, apiRoutes, rewriteSources, slugs)) {
      const existing = broken.find((b) => b.href === href);
      if (existing) {
        existing.sources.push(source);
      } else {
        broken.push({ href, pathname, sources: [source] });
      }
    }
  }

  console.log(
    `Discovered ${pageRoutes.size} pages, ${apiRoutes.size} API routes, ${rewriteSources.size} rewrite sources, ${slugs.size} evidence slugs.`,
  );
  console.log(`Checked ${seen.size} unique internal hrefs.`);

  if (broken.length > 0) {
    console.error("\nBroken internal links:");
    for (const item of broken) {
      console.error(`  ${item.href} → no route for ${item.pathname}`);
      for (const s of item.sources) {
        console.error(`    - ${s}`);
      }
    }
    process.exit(1);
  }

  console.log("PASS: zero broken internal links.");
}

main();
