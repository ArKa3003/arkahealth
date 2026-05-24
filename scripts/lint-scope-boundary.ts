/**
 * Fails CI if Non-Device CDS in-scope code imports DICOM viewer paths.
 * Enforces the function boundary declared in docs/SCOPE_BOUNDARY.md.
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

/** Out-of-scope paths — any import resolving here fails the lint. */
const OUT_OF_SCOPE = [
  "lib/viewer/",
  "app/api/ins/viewer/",
  "components/shared/ReferenceViewer",
] as const;

const IMPORT_RE =
  /(?:import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?|import\s*\(\s*)["']([^"']+)["']/g;

/**
 * Recursively lists `.ts` / `.tsx` files under a project-relative directory.
 */
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

/**
 * Normalizes an import specifier to a project-relative path (handles `@/` alias).
 */
function resolveImportPath(specifier: string): string {
  const path = specifier.startsWith("@/") ? specifier.slice(2) : specifier;
  return path.replace(/\.(tsx?|jsx?)$/, "");
}

/**
 * Returns true when a normalized import path targets an out-of-scope boundary.
 */
function isOutOfScope(specifier: string): boolean {
  const path = resolveImportPath(specifier);

  if (path.startsWith("lib/viewer/") || path === "lib/viewer") {
    return true;
  }
  if (path.startsWith("app/api/ins/viewer/") || path === "app/api/ins/viewer") {
    return true;
  }
  if (path === "components/shared/ReferenceViewer") {
    return true;
  }

  return OUT_OF_SCOPE.some(
    (prefix) => path.startsWith(prefix) || path === prefix.replace(/\/$/, ""),
  );
}

/**
 * Collects all in-scope TypeScript files per docs/SCOPE_BOUNDARY.md.
 */
function collectInScopeFiles(): string[] {
  const files = new Set<string>(IN_SCOPE_FILES);
  for (const dir of IN_SCOPE_DIRS) {
    for (const f of listTsFiles(dir)) {
      files.add(f);
    }
  }
  return [...files];
}

/**
 * Computes 1-based line number for a match index in file content.
 */
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
      if (!spec || !isOutOfScope(spec)) {
        continue;
      }
      const line = lineNumberAt(content, match.index ?? 0);
      violations.push(`FAIL  ${file}:${line}  imports out-of-scope ${spec}`);
    }
  }

  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exit(1);
  }
  console.log("lint:scope — no in-scope imports from out-of-scope paths");
}

main();
