/**
 * Fails if Non-Device CDS in-scope code imports DICOM viewer / pixel paths.
 * See docs/SCOPE_BOUNDARY.md.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const IN_SCOPE_DIRS = [
  "app/api/cds-services",
  "lib/cds-platform",
  "lib/cards",
  "lib/aiie",
  "app/cds-hooks-demo",
] as const;

const IN_SCOPE_FILES = ["scripts/test-cds-sandbox.ts"] as const;

/** Import targets that must not appear from in-scope CDS code. */
const FORBIDDEN_PREFIXES = [
  "lib/viewer/dicom-",
  "lib/viewer/fetch-study-dicom",
  "lib/viewer/thumbnail-cache",
  "app/api/ins/viewer/",
  "dicom-parser",
];

const IMPORT_RE =
  /(?:import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?|import\s*\(\s*)["']([^"']+)["']/g;

function listTsFiles(dir: string): string[] {
  const abs = join(ROOT, dir);
  let st: ReturnType<typeof statSync>;
  try {
    st = statSync(abs);
  } catch {
    return [];
  }
  if (!st.isDirectory()) {
    return [];
  }
  const out: string[] = [];
  for (const name of readdirSync(abs)) {
    const p = join(abs, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      out.push(...listTsFiles(relative(ROOT, p)));
    } else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) {
      out.push(relative(ROOT, p));
    }
  }
  return out;
}

function resolveImportPath(specifier: string): string {
  if (specifier.startsWith("@/")) {
    return specifier.slice(2);
  }
  return specifier;
}

function isForbidden(specifier: string): boolean {
  const path = resolveImportPath(specifier);
  if (FORBIDDEN_PREFIXES.some((p) => path.includes(p) || path.startsWith(p))) {
    return true;
  }
  if (path === "lib/viewer/dicom-phi-scrub" || path === "lib/viewer/dicom-to-webp") {
    return true;
  }
  return false;
}

function collectInScopeFiles(): string[] {
  const files = new Set<string>();
  for (const f of IN_SCOPE_FILES) {
    files.add(f);
  }
  for (const dir of IN_SCOPE_DIRS) {
    for (const f of listTsFiles(dir)) {
      files.add(f);
    }
  }
  return [...files];
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function main(): void {
  const violations: string[] = [];

  for (const file of collectInScopeFiles()) {
    const abs = join(ROOT, file);
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    for (const match of content.matchAll(IMPORT_RE)) {
      const spec = match[1];
      if (!spec || !isForbidden(spec)) {
        continue;
      }
      const line = lineNumberAt(content, match.index ?? 0);
      violations.push(`FAIL  ${file}:${line}  imports forbidden ${spec}`);
    }
  }

  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exit(1);
  }
  console.log("lint:scope — no CDS imports of DICOM pixel paths");
}

main();
