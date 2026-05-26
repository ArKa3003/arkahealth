import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

type Finding = {
  file: string;
  line: number;
  text: string;
};

type CheckResult = {
  title: string;
  okText: string;
  failText: string;
  findings: Finding[];
};

function isCommentOnlyLine(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('*/');
}

function hasRipgrep(): boolean {
  const res = spawnSync('rg', ['--version'], { encoding: 'utf8' });
  return res.status === 0;
}

function parseRgLine(line: string): Finding | null {
  // Expected: path:line:text  (ripgrep default with -n --no-heading)
  const first = line.indexOf(':');
  if (first < 0) return null;
  const second = line.indexOf(':', first + 1);
  if (second < 0) return null;
  const file = line.slice(0, first);
  const lineNum = Number(line.slice(first + 1, second));
  if (!Number.isFinite(lineNum)) return null;
  const text = line.slice(second + 1);
  return { file, line: lineNum, text };
}

function runRipgrep(pattern: string, targets: string[], extraArgs: string[] = []): Finding[] {
  const args = ['--line-number', '--no-heading', '--color', 'never', ...extraArgs, pattern, ...targets];
  const res = spawnSync('rg', args, { encoding: 'utf8' });

  if (res.status === 0) {
    const lines = res.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map(parseRgLine).filter((x): x is Finding => x !== null);
  }

  // ripgrep status: 1 = no matches, 2 = error
  if (res.status === 1) return [];

  const err = (res.stderr || res.stdout || '').trim();
  throw new Error(`ripgrep failed for pattern ${JSON.stringify(pattern)}: ${err || `exit ${res.status}`}`);
}

function walkFiles(root: string, allowExts: Set<string>, out: string[] = []): string[] {
  const entries = readdirSync(root, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.next') continue;
    const full = path.join(root, ent.name);
    if (ent.isDirectory()) {
      walkFiles(full, allowExts, out);
      continue;
    }
    if (!ent.isFile()) continue;
    const ext = path.extname(ent.name);
    if (allowExts.has(ext)) out.push(full);
  }
  return out;
}

function scanFileLines(filePath: string, regex: RegExp): Finding[] {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const findings: Finding[] = [];
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i] ?? '';
    if (regex.test(text)) {
      findings.push({ file: filePath, line: i + 1, text });
    }
  }
  return findings;
}

function nodeFallbackSearch(
  pattern: RegExp,
  targets: string[],
  allowExts: Set<string> | null
): Finding[] {
  const files: string[] = [];
  for (const t of targets) {
    const st = statSync(t);
    if (st.isFile()) {
      files.push(t);
      continue;
    }
    if (st.isDirectory()) {
      walkFiles(t, allowExts ?? new Set<string>(), files);
    }
  }

  const findings: Finding[] = [];
  for (const f of files) findings.push(...scanFileLines(f, pattern));
  return findings;
}

function uniqFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const f of findings) {
    const key = `${f.file}:${f.line}:${f.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));
}

function withoutCommentOnlyFindings(findings: Finding[]): Finding[] {
  return findings.filter((f) => !isCommentOnlyLine(f.text));
}

function formatFinding(f: Finding): string {
  return `${f.file}:${f.line}: ${f.text}`.trimEnd();
}

function printCheck(result: CheckResult): void {
  if (result.findings.length === 0) {
    console.log(`✓ ${result.title}: clean (0 ${result.okText})`);
    return;
  }
  console.log(`✗ ${result.title}: FAILED (${result.findings.length} ${result.failText})`);
  for (const f of result.findings) console.log(`- ${formatFinding(f)}`);
}

function main(): void {
  const useRg = hasRipgrep();

  const checks: CheckResult[] = [];

  // (a) feature-engineer.ts forbidden patterns (file-local)
  const featureEngineerFile = path.join(process.cwd(), 'lib/cds-platform/ml/feature-engineer.ts');
  const fePatterns = [
    'presentedForm',
    'DiagnosticReport.*\\.presentedForm',
    'Media\\b',
    'ImagingStudy\\.series',
    'DICOM',
    'pixel',
  ];

  const feFindings = uniqFindings(
    fePatterns.flatMap((p) => {
      if (useRg) return runRipgrep(p, [featureEngineerFile]);
      return nodeFallbackSearch(new RegExp(p), [featureEngineerFile], null);
    })
  );

  checks.push({
    title: 'Criterion 1 — feature-engineer',
    okText: 'image/signal references',
    failText: 'image/signal references',
    findings: sortFindings(withoutCommentOnlyFindings(feFindings)),
  });

  // (b) requirements.txt forbidden python deps (file-local)
  const requirementsFile = path.join(process.cwd(), 'ml-service/requirements.txt');
  const pyDepPattern = '(scipy\\.signal|pydicom|wfdb|pylibjpeg|opencv|cv2)';
  const pyFindings = useRg
    ? runRipgrep(pyDepPattern, [requirementsFile])
    : nodeFallbackSearch(new RegExp(pyDepPattern), [requirementsFile], null);

  checks.push({
    title: 'Criterion 1 — requirements.txt',
    okText: 'forbidden Python libs',
    failText: 'forbidden Python libs',
    findings: sortFindings(uniqFindings(pyFindings)),
  });

  // (c) scope-boundary forbidden imports (dirs)
  const importPattern =
    `import.*from.*['"](dicom-parser|pydicom|opencv)['"]` +
    `|import.*from.*lib/viewer/` +
    `|import.*from.*api/ins/viewer/`;

  const scopeDirs = [
    path.join(process.cwd(), 'lib/cds-platform'),
    path.join(process.cwd(), 'app/api/cds-services'),
    path.join(process.cwd(), 'lib/cards'),
    path.join(process.cwd(), 'lib/aiie'),
  ];

  const scopeFindings = useRg
    ? runRipgrep(importPattern, scopeDirs)
    : nodeFallbackSearch(
      new RegExp(importPattern),
      scopeDirs,
      new Set<string>(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
    );

  checks.push({
    title: 'Scope boundary',
    okText: 'cross-imports between CDS and viewer code',
    failText: 'cross-imports between CDS and viewer code',
    findings: sortFindings(uniqFindings(scopeFindings)),
  });

  // (d) marketing copy forbidden phrases (repo-wide but constrained to extensions)
  const marketingPattern = '(FDA approved|FDA cleared|FDA registered|FDA certified|FDA endorsed)';
  const marketingFindings = useRg
    ? runRipgrep(marketingPattern, [process.cwd()], [
      '--ignore-case',
      '--glob',
      '*.{md,ts,tsx}',
      '--glob',
      '!scripts/regulatory-checks.ts',
    ])
    : nodeFallbackSearch(
      new RegExp(marketingPattern, 'i'),
      [process.cwd()],
      new Set<string>(['.md', '.ts', '.tsx'])
    );

  checks.push({
    title: 'Marketing copy',
    okText: `"FDA approved/cleared/..." instances`,
    failText: `"FDA approved/cleared/..." instances`,
    findings: sortFindings(
      uniqFindings(marketingFindings).filter((f) => !f.file.endsWith(path.join('scripts', 'regulatory-checks.ts')))
    ),
  });

  for (const c of checks) printCheck(c);

  const failed = checks.filter((c) => c.findings.length > 0);
  if (failed.length > 0) {
    console.log('Regulatory checks failed.');
    process.exitCode = 1;
    return;
  }

  console.log('All regulatory checks passed.');
}

main();
