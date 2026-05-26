/**
 * FDA Non-Device CDS card invariant linter.
 * STANDALONE: reads sandbox-fixtures/cards/*.json (CI default).
 * LIVE: when CDS_SANDBOX_BASE_URL is set, POSTs demo scenarios to CLIN CDS services.
 * --emit-fixtures: fetch live cards and write fixtures (run locally with dev server).
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { CITATIONS, getCitation } from "@/lib/cds-platform/citations";
import { getFeatureCatalogEntry } from "@/lib/cds-platform/ml/feature-catalog";
import type { MedicalBasis } from "@/lib/cds-platform/cds-hooks/medical-basis";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import { buildCdsRequest } from "@/components/cds-platform/demo/build-cds-request";
import {
  DEMO_SCENARIOS,
  type DemoScenarioId,
} from "@/components/cds-platform/demo/scenarios";

// keep in sync with docs/CDS_CARD_LANGUAGE_STYLE_GUIDE.md
const BANNED_VERBS_AND_PHRASES = [
  "cancel",
  "stop",
  "switch to",
  "switch",
  "replace",
  "do not order",
  "must",
  "require",
  "required",
  "immediately",
  "urgent action",
  "you should",
  "you must",
] as const;

const FIXTURES_DIR = join(process.cwd(), "sandbox-fixtures", "cards");
const SOURCE_LABEL_PREFIX = /^ARKA-/;
const SOURCE_ENGINE_VERSION = /\bv\d+\.\d+/;
const SUGGESTION_LABEL_PATTERN = /^(Review|Consider|Open|View)/;

const CLIN_SELECT_PATH = "/api/cds-services/arka-clin-appropriateness";
const CLIN_SIGN_PATH = "/api/cds-services/arka-clin-appropriateness-sign";

const ARKA_SCORE_MARKERS: RegExp[] = [
  /\*\*Score:\*\*/i,
  /\*\*Top factors \(SHAP\):\*\*/i,
  /AIIE rule-based scoring/i,
  /Model confidence:/i,
  /\bappropriateness score\b/i,
];

const SERVICE_EMIT_LOC: Record<string, string> = {
  "arka-clin-appropriateness": "app/api/cds-services/arka-clin-appropriateness/route.ts:93",
  "arka-clin-appropriateness-sign":
    "app/api/cds-services/arka-clin-appropriateness-sign/route.ts:91",
};

interface LintCard {
  uuid?: string;
  summary: string;
  detail?: string;
  indicator: string;
  source: { label: string };
  medicalBasis?: MedicalBasis;
  suggestions?: Array<{ label: string }>;
  extension?: { shapWithRationales?: Array<{ feature: string }> };
}

interface CardFixtureFile {
  service: string;
  scenarioId: string;
  hook: "order-select" | "order-sign";
  emittedFrom: string;
  cards: LintCard[];
}

interface CollectedCard {
  card: LintCard;
  service: string;
  scenarioId: string;
  cardIndex: number;
  emittedFrom: string;
}

interface AssertionOutcome {
  message: string;
  level: "fail" | "warn";
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wholeWordPattern(phrase: string): RegExp {
  const parts = phrase.trim().split(/\s+/).map(escapeRegExp);
  return new RegExp(`\\b${parts.join("\\s+")}\\b`, "i");
}

function isDaVinciAllowlisted(card: LintCard, emittedFrom: string): boolean {
  return (
    /da\s*vinci/i.test(card.source.label) || emittedFrom.replace(/\\/g, "/").includes("lib/davinci/")
  );
}

/** Clinical body only — mandatory FDA footer may contain phrases like "not replace". */
function detailForLanguageLint(detail: string): string {
  const fdaIdx = detail.indexOf(FDA_NON_DEVICE_CDS_DISCLOSURE);
  if (fdaIdx >= 0) {
    return detail.slice(0, fdaIdx);
  }
  const sectionIdx = detail.indexOf("FD&C Act §520(o)(1)(E)");
  if (sectionIdx >= 0) {
    return detail.slice(0, sectionIdx);
  }
  return detail;
}

function findBannedPhrase(detail: string): string | undefined {
  const normalized = detailForLanguageLint(detail).replace(/\*/g, "");
  for (const phrase of BANNED_VERBS_AND_PHRASES) {
    const pattern = wholeWordPattern(phrase);
    if (!pattern.test(normalized)) {
      continue;
    }
    if (phrase === "stop") {
      if (/\bstop-loss\b/i.test(normalized) || /\bOOP stop\b/i.test(normalized)) {
        continue;
      }
    }
    if (phrase === "must" && /\bmust\s+include\b/i.test(normalized)) {
      continue;
    }
    if (phrase === "required" && /\brequired\s+by\s+payer\b/i.test(normalized)) {
      continue;
    }
    if (phrase === "require" && /\brequired\s+by\s+payer\b/i.test(normalized)) {
      continue;
    }
    if (phrase === "immediately" && /^CRITICAL:/im.test(normalized)) {
      continue;
    }
    if (phrase === "switch" && /\bswitch\s+to\b/i.test(normalized)) {
      continue;
    }
    return phrase;
  }
  return undefined;
}

function firstArkaScoreIndex(detail: string): number {
  let earliest = -1;
  for (const marker of ARKA_SCORE_MARKERS) {
    const match = marker.exec(detail);
    if (match && match.index >= 0) {
      if (earliest < 0 || match.index < earliest) {
        earliest = match.index;
      }
    }
  }
  return earliest;
}

function assertCardInvariants(
  card: LintCard,
  emittedFrom: string,
): AssertionOutcome[] {
  const outcomes: AssertionOutcome[] = [];
  const loc = emittedFrom;

  if (!SOURCE_LABEL_PREFIX.test(card.source.label)) {
    outcomes.push({
      level: "fail",
      message: `card.source.label must match /^ARKA-/, got "${card.source.label}" (${loc})`,
    });
  }
  if (!SOURCE_ENGINE_VERSION.test(card.source.label)) {
    outcomes.push({
      level: "fail",
      message: `card.source.label must declare an engine version matching /\\bv\\d+\\.\\d+/ (e.g., 'v2.0') (${loc})`,
    });
  }

  const basis = card.medicalBasis;
  if (!basis?.label?.trim()) {
    outcomes.push({
      level: "fail",
      message: `card.medicalBasis.label is required and non-empty (${loc})`,
    });
  }
  if (!basis?.rationale?.trim() || basis.rationale.trim().length < 40) {
    outcomes.push({
      level: "fail",
      message: `card.medicalBasis.rationale must be >= 40 characters (${loc})`,
    });
  }
  if (!basis?.citationId?.trim()) {
    outcomes.push({
      level: "fail",
      message: `card.medicalBasis.citationId is required (${loc})`,
    });
  }
  if (!basis?.url?.trim()) {
    outcomes.push({
      level: "fail",
      message: `card.medicalBasis.url is required (${loc})`,
    });
  }
  if (!basis?.authorityClass) {
    outcomes.push({
      level: "fail",
      message: `card.medicalBasis.authorityClass is required (${loc})`,
    });
  }
  if (!basis?.lastClinicalReviewISO?.trim()) {
    outcomes.push({
      level: "fail",
      message: `card.medicalBasis.lastClinicalReviewISO is required (${loc})`,
    });
  }

  if (basis?.citationId) {
    try {
      getCitation(basis.citationId);
    } catch {
      outcomes.push({
        level: "fail",
        message: `getCitation("${basis.citationId}") failed — not in CITATIONS (${loc})`,
      });
    }
    if (!CITATIONS[basis.citationId] && basis.citationId !== "context_dependent") {
      outcomes.push({
        level: "fail",
        message: `citationId "${basis.citationId}" missing from CITATIONS registry (${loc})`,
      });
    }
  }

  const detail = card.detail ?? "";
  if (basis?.label && !detail.includes(basis.label)) {
    outcomes.push({
      level: "fail",
      message: `card.detail must contain medicalBasis.label "${basis.label}" (${loc})`,
    });
  }
  if (basis?.label && detail.includes(basis.label)) {
    const labelIndex = detail.indexOf(basis.label);
    const scoreIndex = firstArkaScoreIndex(detail);
    if (scoreIndex >= 0 && labelIndex > scoreIndex) {
      outcomes.push({
        level: "fail",
        message: `medicalBasis.label must appear before ARKA-derived score markers (${loc})`,
      });
    }
  }

  const hasFdaMarker =
    detail.includes("FD&C Act §520(o)(1)(E)") ||
    detail.includes(FDA_NON_DEVICE_CDS_DISCLOSURE);
  if (!hasFdaMarker) {
    outcomes.push({
      level: "fail",
      message: `card.detail missing FDA disclosure (§520(o)(1)(E) or FDA_NON_DEVICE_CDS_DISCLOSURE) (${loc})`,
    });
  }

  const banned = findBannedPhrase(detail);
  if (banned) {
    const allowlisted = isDaVinciAllowlisted(card, emittedFrom);
    outcomes.push({
      level: allowlisted ? "warn" : "fail",
      message: `card.detail contains banned phrase "${banned}"${allowlisted ? " (Da Vinci allowlist — audit)" : ""} (${loc})`,
    });
  }

  if (card.suggestions) {
    for (const suggestion of card.suggestions) {
      if (!SUGGESTION_LABEL_PATTERN.test(suggestion.label)) {
        outcomes.push({
          level: "fail",
          message: `suggestion.label "${suggestion.label}" must match /^(Review|Consider|Open|View)/ (${loc})`,
        });
      }
    }
  }

  const shap = card.extension?.shapWithRationales;
  if (shap) {
    for (const row of shap) {
      if (!getFeatureCatalogEntry(row.feature)) {
        outcomes.push({
          level: "fail",
          message: `SHAP feature "${row.feature}" not in feature catalog (${loc})`,
        });
      }
    }
  }

  return outcomes;
}

function ensureFixturesDir(): void {
  mkdirSync(FIXTURES_DIR, { recursive: true });
}

function fixtureFilename(service: string, scenarioId: string): string {
  return `${service}__${scenarioId}.json`;
}

function loadFixtureCards(): CollectedCard[] {
  ensureFixturesDir();
  const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));
  const collected: CollectedCard[] = [];

  for (const file of files) {
    const raw = readFileSync(join(FIXTURES_DIR, file), "utf8");
    const parsed = JSON.parse(raw) as CardFixtureFile;
    const emittedFrom =
      parsed.emittedFrom ??
      SERVICE_EMIT_LOC[parsed.service] ??
      `sandbox-fixtures/cards/${file}`;
    parsed.cards.forEach((card, cardIndex) => {
      collected.push({
        card,
        service: parsed.service,
        scenarioId: parsed.scenarioId,
        cardIndex,
        emittedFrom,
      });
    });
  }

  return collected;
}

async function fetchLiveCards(): Promise<CardFixtureFile[]> {
  const baseUrl = process.env.CDS_SANDBOX_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("CDS_SANDBOX_BASE_URL is required for LIVE / --emit-fixtures mode");
  }

  const scenarioIds = Object.keys(DEMO_SCENARIOS) as DemoScenarioId[];
  const fixtures: CardFixtureFile[] = [];

  for (const scenarioId of scenarioIds) {
    const scenario = DEMO_SCENARIOS[scenarioId];

    const selectReq = buildCdsRequest(scenario, "order-select");
    const selectRes = await fetch(`${baseUrl}${CLIN_SELECT_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectReq),
    });
    const selectJson = (await selectRes.json()) as { cards?: LintCard[] };
    if (!selectRes.ok) {
      throw new Error(
        `POST ${CLIN_SELECT_PATH} (${scenarioId}) HTTP ${selectRes.status}: ${JSON.stringify(selectJson)}`,
      );
    }
    fixtures.push({
      service: "arka-clin-appropriateness",
      scenarioId,
      hook: "order-select",
      emittedFrom: SERVICE_EMIT_LOC["arka-clin-appropriateness"],
      cards: selectJson.cards ?? [],
    });

    const signReq = buildCdsRequest(scenario, "order-sign");
    const signRes = await fetch(`${baseUrl}${CLIN_SIGN_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signReq),
    });
    const signJson = (await signRes.json()) as { cards?: LintCard[] };
    if (!signRes.ok) {
      throw new Error(
        `POST ${CLIN_SIGN_PATH} (${scenarioId}) HTTP ${signRes.status}: ${JSON.stringify(signJson)}`,
      );
    }
    fixtures.push({
      service: "arka-clin-appropriateness-sign",
      scenarioId,
      hook: "order-sign",
      emittedFrom: SERVICE_EMIT_LOC["arka-clin-appropriateness-sign"],
      cards: signJson.cards ?? [],
    });
  }

  return fixtures;
}

function writeFixtures(fixtures: CardFixtureFile[]): void {
  ensureFixturesDir();
  for (const fixture of fixtures) {
    const path = join(FIXTURES_DIR, fixtureFilename(fixture.service, fixture.scenarioId));
    writeFileSync(path, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  }
}

function flattenFixtures(fixtures: CardFixtureFile[]): CollectedCard[] {
  const collected: CollectedCard[] = [];
  for (const fixture of fixtures) {
    fixture.cards.forEach((card, cardIndex) => {
      collected.push({
        card,
        service: fixture.service,
        scenarioId: fixture.scenarioId,
        cardIndex,
        emittedFrom: fixture.emittedFrom,
      });
    });
  }
  return collected;
}

function printReport(
  results: Array<{
    index: number;
    service: string;
    scenarioId: string;
    pass: boolean;
    failures: string[];
    warnings: string[];
  }>,
): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  for (const row of results) {
    if (row.pass) {
      passed += 1;
      console.log(`Card ${row.index} (${row.service}, ${row.scenarioId}): PASS`);
    } else {
      failed += 1;
      console.log(`Card ${row.index} (${row.service}, ${row.scenarioId}): FAIL`);
      for (const msg of row.failures) {
        console.log(`  - ${msg}`);
      }
    }
    for (const warn of row.warnings) {
      console.log(`  ! WARNING: ${warn}`);
    }
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

async function main(): Promise<void> {
  const emitFixtures = process.argv.includes("--emit-fixtures");
  const liveMode = Boolean(process.env.CDS_SANDBOX_BASE_URL);

  if (emitFixtures) {
    const fixtures = await fetchLiveCards();
    writeFixtures(fixtures);
    console.log(`Wrote ${fixtures.length} fixture file(s) to ${FIXTURES_DIR}`);
    return;
  }

  let collected: CollectedCard[];
  if (liveMode) {
    const fixtures = await fetchLiveCards();
    collected = flattenFixtures(fixtures);
    console.log(`LIVE mode: ${collected.length} card(s) from ${process.env.CDS_SANDBOX_BASE_URL}\n`);
  } else {
    collected = loadFixtureCards();
    if (collected.length === 0) {
      console.error(
        `No cards in ${FIXTURES_DIR}. Run: npm run dev && npm run fixtures:cards`,
      );
      process.exit(1);
    }
    console.log(`STANDALONE mode: ${collected.length} card(s) from fixtures\n`);
  }

  const reportRows: Array<{
    index: number;
    service: string;
    scenarioId: string;
    pass: boolean;
    failures: string[];
    warnings: string[];
  }> = [];

  collected.forEach((entry, i) => {
    const outcomes = assertCardInvariants(entry.card, entry.emittedFrom);
    const failures = outcomes.filter((o) => o.level === "fail").map((o) => o.message);
    const warnings = outcomes.filter((o) => o.level === "warn").map((o) => o.message);
    const cardLabel = entry.card.uuid ?? entry.card.summary.slice(0, 48);
    if (failures.length > 0) {
      failures.unshift(`card "${cardLabel}" [index ${entry.cardIndex}]`);
    }
    reportRows.push({
      index: i + 1,
      service: entry.service,
      scenarioId: entry.scenarioId,
      pass: failures.length === 0,
      failures,
      warnings,
    });
  });

  const { failed } = printReport(reportRows);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
