/**
 * ARKA CDS Hooks sandbox harness: ARKA-INS coverage/final-check/appointment-book and
 * ARKA-CLIN appropriateness (order-select / order-sign) with FDA invariants + HTML report.
 *
 * Prerequisites:
 * - `npm run dev` (or set `CDS_SANDBOX_BASE_URL` to a deployed origin)
 * - Supabase service role env vars so Gold Card / OOP / shoppable paths resolve (`SUPABASE_SERVICE_ROLE_KEY`, etc.)
 * - Migration `010_cds_sandbox_fixtures.sql` applied (Gold Card scenario 1)
 * - `scripts/seed-shoppable-sites.ts` run for CPT `70553` alternative-site data (scenario 2)
 */

import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { evaluateStat } from "@/lib/aiie/stat-gate";
import { OVERUSE_RULES } from "@/lib/aiie/overuse-patterns";
import type { RedundancyAssessment } from "@/lib/aiie/redundancy";
import { isSwallowStudyOrder, triageSwallow } from "@/lib/aiie/swallow-triage";
import { buildDuplicateOrderCard } from "@/lib/cards/duplicate-order-card";
import { buildOveruseCard } from "@/lib/cards/overuse-soft-block-card";
import { buildStatReclassCard } from "@/lib/cards/stat-reclass-card";
import {
  detailIncludesFdaDisclosure,
  FDA_DISCLOSURE_MARKERS,
} from "@/lib/compliance/fda-disclosure";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import {
  cdsHookResponseSchema,
  type ParsedCDSHookResponse,
} from "@/lib/validation/cds-hooks-response";
import type { CDSHookRequest } from "@/lib/types/cds-hooks";
import type {
  Appointment,
  Bundle,
  Coverage,
  Patient,
  Practitioner,
  ServiceRequest,
} from "@/lib/types/fhir";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import { buildCdsRequest } from "@/components/cds-platform/demo/build-cds-request";
import { DEMO_SCENARIOS } from "@/components/cds-platform/demo/scenarios";
import { getCitation } from "@/lib/cds-platform/citations";
import { getFeatureCatalogEntry } from "@/lib/cds-platform/ml/feature-catalog";

const BASE_URL = (process.env.CDS_SANDBOX_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const COVERAGE_PATH = "/api/cds-services/arka-ins-coverage";
const FINAL_CHECK_PATH = "/api/cds-services/arka-ins-final-check";
const APPOINTMENT_PATH = "/api/cds-services/arka-ins-appointment";
const CLIN_SELECT_PATH = "/api/cds-services/arka-clin-appropriateness";
const CLIN_SIGN_PATH = "/api/cds-services/arka-clin-appropriateness-sign";

const GOLD_NPI = process.env.ARKA_SANDBOX_GOLD_NPI ?? "1003000126";
const NON_GOLD_NPI = process.env.ARKA_SANDBOX_NON_GOLD_NPI ?? "1003000127";

const PAYER_REF = "Organization/aetna";
const LATENCY_SAMPLES = 20;
const P95_THRESHOLD_MS = 800;
const CLIN_P95_THRESHOLD_MS = 1500;
const FDA_MARKERS = ["FDA Non-Device", "21st Century Cures Act"];
const SOURCE_LABEL = "ARKA-INS (AIIE v2.0)";
const CLIN_LABEL_PREFIX = "ARKA-CLIN";
const BANNED_DIRECTIVE_VERBS = [
  "cancel",
  "stop",
  "switch to",
  "replace",
  "do not order",
  "must ",
  "require",
  "immediately",
  "urgent action",
] as const;
const SUGGESTION_LABEL_PATTERN = /^Review|^Consider|^Open|^View/;

function percentile95(sortedAsc: number[]): number {
  if (sortedAsc.length === 0) {
    return 0;
  }
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil(0.95 * sortedAsc.length) - 1),
  );
  return sortedAsc[idx];
}

function patientBundle(): Patient {
  return {
    resourceType: "Patient",
    id: "sandbox-patient-1",
    birthDate: "1978-05-12",
    gender: "male",
  };
}

function practitioner(npi: string, name: string): Practitioner {
  return {
    resourceType: "Practitioner",
    id: `sandbox-practitioner-${npi}`,
    name: [{ text: name }],
    identifier: [
      {
        system: "http://hl7.org/fhir/sid/us-npi",
        value: npi,
      },
    ],
  };
}

function coverageHdhp(): Coverage {
  return {
    resourceType: "Coverage",
    id: "sandbox-coverage-1",
    status: "active",
    beneficiary: { reference: "Patient/sandbox-patient-1" },
    payor: [{ reference: PAYER_REF, display: "Aetna" }],
    costToBeneficiary: [
      {
        type: { text: "Deductible" },
        valueMoney: { value: 3000, currency: "USD" },
      },
      {
        type: { text: "Deductible remaining" },
        valueMoney: { value: 1800, currency: "USD" },
      },
      {
        type: { text: "Coinsurance" },
        valueQuantity: { value: 20, unit: "%" },
      },
    ],
  };
}

function serviceRequestBundle(sr: ServiceRequest): Bundle<ServiceRequest> {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [{ resource: sr }],
  };
}

function coverageBundle(c: Coverage): Bundle<Coverage> {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [{ resource: c }],
  };
}

function hookRequest(body: Omit<CDSHookRequest, "hook" | "hookInstance">): CDSHookRequest {
  return {
    ...body,
    hook: "order-select",
    hookInstance: randomUUID(),
    fhirServer: "https://sandbox.cds-hooks.org/fhir",
  };
}

function cloneRequest(req: CDSHookRequest): CDSHookRequest {
  return JSON.parse(JSON.stringify(req)) as CDSHookRequest;
}

/** Scenario 1: Gold-carded provider, MRI lumbar 72148, strong documentation. */
function scenario1Request(): CDSHookRequest {
  const sr: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: "sandbox-sr-gold-lumbar",
    intent: "order",
    status: "draft",
    category: [
      {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/service-request-category", code: "imaging", display: "Imaging" }],
      },
    ],
    code: {
      coding: [
        {
          system: "http://www.ama-assn.org/go/cpt",
          code: "72148",
          display: "MRI lumbar spine without contrast",
        },
      ],
      text: "MRI lumbar spine without contrast",
    },
    subject: { reference: "Patient/sandbox-patient-1" },
    reasonCode: [
      {
        text: "Low back pain with radiculopathy; progressive sensory symptoms in L5 distribution",
      },
    ],
    note: [
      {
        text: "MRI lumbar spine for radiculopathy after 6 weeks PT; progressive neurological exam findings documented.",
      },
    ],
  };

  return hookRequest({
    context: {
      patientId: "sandbox-patient-1",
      userId: `sandbox-practitioner-${GOLD_NPI}`,
      selections: [{ reference: `ServiceRequest/${sr.id}` }],
    },
    prefetch: {
      patient: patientBundle(),
      practitioner: practitioner(GOLD_NPI, "Gold Sandbox MD"),
      coverage: coverageBundle(coverageHdhp()),
      serviceRequest: serviceRequestBundle(sr),
    },
  });
}

/** Scenario 2: Non–gold provider, brain MRI 70553, HDHP with deductible remaining. */
function scenario2Request(): CDSHookRequest {
  const sr: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: "sandbox-sr-brain-hdhp",
    intent: "order",
    status: "draft",
    category: [
      {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/service-request-category", code: "imaging", display: "Imaging" }],
      },
    ],
    code: {
      coding: [
        {
          system: "http://www.ama-assn.org/go/cpt",
          code: "70553",
          display: "MRI brain with contrast",
        },
      ],
      text: "MRI brain with contrast",
    },
    subject: { reference: "Patient/sandbox-patient-1" },
    reasonCode: [
      {
        text: "Chronic headache without focal neuro deficits; no red flags on review",
      },
    ],
    note: [{ text: "Chronic headache; no focal deficits." }],
  };

  return hookRequest({
    context: {
      patientId: "sandbox-patient-1",
      userId: `sandbox-practitioner-${NON_GOLD_NPI}`,
      selections: [{ reference: `ServiceRequest/${sr.id}` }],
    },
    prefetch: {
      patient: patientBundle(),
      practitioner: practitioner(NON_GOLD_NPI, "Non-Gold Sandbox MD"),
      coverage: coverageBundle(coverageHdhp()),
      serviceRequest: serviceRequestBundle(sr),
    },
  });
}

/** Scenario 3: Non–gold provider, CT abdomen 74177, vague indication + prior imaging in note. */
function scenario3Request(): CDSHookRequest {
  const sr: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: "sandbox-sr-ct-vague",
    intent: "order",
    status: "draft",
    category: [
      {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/service-request-category", code: "imaging", display: "Imaging" }],
      },
    ],
    code: {
      coding: [
        {
          system: "http://www.ama-assn.org/go/cpt",
          code: "74177",
          display: "CT abdomen and pelvis with contrast",
        },
      ],
      text: "CT abdomen and pelvis with contrast",
    },
    subject: { reference: "Patient/sandbox-patient-1" },
    reasonCode: [{ text: "Abdominal pain" }],
    note: [
      {
        text: "Prior abdomen CT 2 weeks ago. No conservative management documented.",
      },
    ],
  };

  return hookRequest({
    context: {
      patientId: "sandbox-patient-1",
      userId: `sandbox-practitioner-${NON_GOLD_NPI}`,
      selections: [{ reference: `ServiceRequest/${sr.id}` }],
    },
    prefetch: {
      patient: patientBundle(),
      practitioner: practitioner(NON_GOLD_NPI, "Non-Gold Sandbox MD"),
      coverage: coverageBundle(coverageHdhp()),
      serviceRequest: serviceRequestBundle(sr),
    },
  });
}

async function postCoverage(req: CDSHookRequest): Promise<{ ms: number; json: unknown }> {
  const t0 = performance.now();
  const res = await fetch(`${BASE_URL}${COVERAGE_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const ms = performance.now() - t0;
  const json: unknown = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return { ms, json };
}

function assertFdaAndSource(cards: ParsedCDSHookResponse["cards"]): string | undefined {
  for (const c of cards) {
    if (c.source.label !== SOURCE_LABEL) {
      return `Card source label expected "${SOURCE_LABEL}", got "${c.source.label}"`;
    }
    const d = c.detail ?? "";
    if (!detailIncludesFdaDisclosure(d)) {
      return `Card "${c.summary.slice(0, 40)}" missing canonical FDA disclaimer`;
    }
  }
  return undefined;
}

/** Offline validation of new CDS / CLIN card surfaces (no dev server required). */
function validateOfflineCards(): string | undefined {
  const statGate = evaluateStat({
    snapshot: emptySandboxSnapshot(),
    order: { modality: "CT", procedure: "CT head without contrast", bodyPart: "head" },
    complaint: "chronic headache",
    priority: "stat",
    patientAgeYears: 42,
  });
  const statCard = buildStatReclassCard({
    gate: statGate,
    serviceRequest: {
      resourceType: "ServiceRequest",
      id: "offline-stat-sr",
      intent: "order",
      priority: "stat",
      subject: { reference: "Patient/sandbox-patient-1" },
    },
  });
  if (!detailIncludesFdaDisclosure(statCard.detail)) {
    return "STAT reclass card missing FDA disclosure";
  }

  const redundancy: RedundancyAssessment = {
    severity: "high",
    reason: "Prior lumbar MRI within 14 days.",
    priorStudyId: "img-offline-1",
    daysSincePrior: 14,
    sameCpt: true,
    sameRegionDifferentModality: false,
    priorNormalWithoutRedFlags: true,
    suggestedAction: "BLOCK_SOFT",
  };
  const dupCard = buildDuplicateOrderCard(redundancy);
  if (dupCard.uuid !== "arka-ins-duplicate-order" || !detailIncludesFdaDisclosure(dupCard.detail)) {
    return "Duplicate-order card missing uuid or FDA disclosure";
  }

  const overuseCard = buildOveruseCard(OVERUSE_RULES[0], {
    order: { modality: "MRI", procedure: "MRI lumbar spine", bodyPart: "lumbar", cpt: "72148" },
  });
  const overuseUuid = overuseCard.uuid ?? "";
  if (!overuseUuid.startsWith("arka-ins-overuse-") || !detailIncludesFdaDisclosure(overuseCard.detail)) {
    return "Overuse soft-block card missing FDA disclosure";
  }

  const swallowOrder = {
    modality: "Fluoroscopy",
    procedure: "Video fluoroscopic swallow study (VFSS)",
    bodyPart: "swallow",
  };
  if (!isSwallowStudyOrder(swallowOrder.procedure)) {
    return "Swallow order detector failed for VFSS procedure text";
  }
  const swallow = triageSwallow({
    snapshot: emptySandboxSnapshot(),
    order: swallowOrder,
    complaint: "dysphagia after stroke",
  });
  if (!swallow.recommendation) {
    return "Swallow triage returned empty recommendation";
  }
  if (!detailIncludesFdaDisclosure(FDA_NON_DEVICE_CDS_DISCLOSURE)) {
    return "Swallow triage canonical FDA disclosure missing";
  }

  return undefined;
}

function emptySandboxSnapshot(): PatientRecordSnapshot {
  return {
    patientHash: "sandbox-hash",
    capturedAtIso: new Date().toISOString(),
    ttlSeconds: 1800,
    problems: [],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging: [],
    priorReports: [],
    labs: [],
    vitals: [],
    notes: [],
    codingContext: { activeIcd10: [], activeCpt: [] },
  };
}

function scenarioOrderSignRequest(): CDSHookRequest {
  const req = scenario1Request();
  return { ...req, hook: "order-sign" };
}

function scenarioAppointmentBookRequest(): CDSHookRequest {
  const patient = patientBundle();
  const appointment: Appointment = {
    resourceType: "Appointment",
    id: "sandbox-appt-1",
    status: "booked",
    participant: [
      { actor: { reference: "Patient/sandbox-patient-1" }, status: "accepted" },
      { actor: { reference: "Location/rad-suite-a" }, status: "accepted" },
    ],
    reasonReference: [{ reference: "ServiceRequest/sandbox-sr-gold-lumbar" }],
  };
  const sr = (scenario1Request().prefetch?.serviceRequest as Bundle<ServiceRequest>).entry?.[0]
    ?.resource as ServiceRequest;

  return {
    hook: "appointment-book",
    hookInstance: randomUUID(),
    fhirServer: "https://sandbox.cds-hooks.org/fhir",
    context: {
      patientId: "sandbox-patient-1",
      userId: `sandbox-practitioner-${GOLD_NPI}`,
      appointmentId: "sandbox-appt-1",
    },
    prefetch: {
      patient,
      appointment,
      serviceRequest: serviceRequestBundle(sr),
      coverage: coverageBundle(coverageHdhp()),
    },
  };
}

async function postCdsHook(
  path: string,
  req: CDSHookRequest,
): Promise<{ ms: number; json: unknown; status: number }> {
  const t0 = performance.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const ms = performance.now() - t0;
  const json: unknown = await res.json();
  return { ms, json, status: res.status };
}

function validateScenario1(cards: ParsedCDSHookResponse["cards"]): string | undefined {
  const hasGold = cards.some((c) => c.uuid === "arka-ins-gold-card" || /Gold Card/i.test(c.summary));
  if (!hasGold) {
    return "Expected Gold Card card (uuid arka-ins-gold-card or summary match)";
  }
  const cov = cards.find((c) => c.uuid === "arka-ins-coverage");
  if (!cov?.summary.includes("PA waived") || !cov.summary.includes("Gold Card")) {
    return `Expected coverage summary PA waived + Gold Card; got: ${cov?.summary}`;
  }
  const docGap = cards.some((c) => c.uuid === "arka-ins-doc-gap");
  if (docGap) {
    return "Did not expect Documentation Gap card when Gold Card applies";
  }
  return undefined;
}

function validateScenario2(cards: ParsedCDSHookResponse["cards"]): string | undefined {
  const cov = cards.find((c) => c.uuid === "arka-ins-coverage");
  if (!cov?.summary.includes("PA review likely")) {
    return `Expected CLINICAL_REVIEW coverage copy; got: ${cov?.summary}`;
  }
  const oop = cards.find((c) => c.uuid === "arka-ins-oop");
  if (!oop) {
    return "Expected OOP card (uuid arka-ins-oop)";
  }
  const alt = cards.find((c) => c.uuid === "arka-ins-alt-site");
  const oopCash =
    oop.detail?.includes("Cash-pay comparator") ?? false;
  if (!alt && !oopCash) {
    return "Expected Alternative Site card and/or OOP cash-pay comparator text";
  }
  return undefined;
}

function validateScenario3(cards: ParsedCDSHookResponse["cards"]): string | undefined {
  const cov = cards.find((c) => c.uuid === "arka-ins-coverage");
  if (!cov?.summary.includes("High denial risk")) {
    return `Expected LIKELY_DENY coverage summary; got: ${cov?.summary}`;
  }
  const doc = cards.find((c) => c.uuid === "arka-ins-doc-gap");
  if (!doc) {
    return "Expected Documentation Gap card (uuid arka-ins-doc-gap)";
  }
  const dtr = doc.links?.some((l) => l.type === "smart" && /DTR/i.test(l.label));
  if (!dtr) {
    return "Expected SMART link for DTR on Documentation Gap card";
  }
  return undefined;
}

async function measureP95(req: CDSHookRequest): Promise<{ p95Ms: number; err?: string }> {
  for (let i = 0; i < 2; i += 1) {
    await postCoverage(cloneRequest(req));
  }
  const times: number[] = [];
  for (let i = 0; i < LATENCY_SAMPLES; i += 1) {
    const { ms, json } = await postCoverage(cloneRequest(req));
    const parsed = cdsHookResponseSchema.safeParse(json);
    if (!parsed.success) {
      return { p95Ms: 0, err: parsed.error.message };
    }
    times.push(ms);
  }
  times.sort((a, b) => a - b);
  return { p95Ms: percentile95(times) };
}

interface Row {
  scenario: string;
  shape: "ok" | "fail";
  behavior: "ok" | "fail";
  p95Ms: number;
  latency: "ok" | "fail";
  detail: string;
}

interface ClinMedicalBasis {
  label: string;
  citationId: string;
}

interface ClinRawCard {
  uuid?: string;
  summary: string;
  detail?: string;
  indicator: "info" | "warning" | "critical";
  source: { label: string };
  medicalBasis?: ClinMedicalBasis;
  suggestions?: Array<{ label: string }>;
  overrideReasons?: Array<{ id?: string; code?: string }>;
  extension?: { shapWithRationales?: Array<{ feature: string }> };
}

interface ClinAssertionRow {
  id: string;
  ok: boolean;
  detail: string;
}

function detailHasFdaMarker(detail: string | undefined): boolean {
  if (!detail?.trim()) {
    return false;
  }
  if (detailIncludesFdaDisclosure(detail)) {
    return true;
  }
  const normalized = detail.replace(/\*/g, "");
  return (
    normalized.includes(FDA_NON_DEVICE_CDS_DISCLOSURE) ||
    normalized.includes("Non-Device CDS")
  );
}

function overrideReasonKey(reason: { id?: string; code?: string } | undefined): string | undefined {
  if (!reason) {
    return undefined;
  }
  return reason.id ?? reason.code;
}

/**
 * Validates FDA / CDS platform invariants on a single CLIN card (raw JSON shape).
 */
function assertClinCardInvariants(
  card: ClinRawCard,
  context: string,
): string | undefined {
  if (!card.source.label.startsWith(CLIN_LABEL_PREFIX)) {
    return `${context}: source.label must start with "${CLIN_LABEL_PREFIX}", got "${card.source.label}"`;
  }

  const basis = card.medicalBasis;
  if (!basis?.label?.trim() || !basis.citationId?.trim()) {
    return `${context}: medicalBasis must be present and non-empty`;
  }

  try {
    getCitation(basis.citationId);
  } catch {
    return `${context}: medicalBasis.citationId "${basis.citationId}" not in citation registry`;
  }

  const detail = card.detail ?? "";
  if (!detail.includes(basis.label)) {
    return `${context}: detail must contain medicalBasis.label "${basis.label}"`;
  }

  if (!detailHasFdaMarker(detail)) {
    return `${context}: detail missing FDA Non-Device CDS disclosure`;
  }

  const detailLower = detail.toLowerCase();
  for (const verb of BANNED_DIRECTIVE_VERBS) {
    if (detailLower.includes(verb)) {
      return `${context}: detail contains banned directive phrase "${verb}"`;
    }
  }

  if (card.suggestions) {
    for (const s of card.suggestions) {
      if (!SUGGESTION_LABEL_PATTERN.test(s.label)) {
        return `${context}: suggestion label "${s.label}" must start with Review|Consider|Open|View`;
      }
    }
  }

  const shap = card.extension?.shapWithRationales;
  if (shap) {
    for (const row of shap) {
      if (!getFeatureCatalogEntry(row.feature)) {
        return `${context}: SHAP feature "${row.feature}" not in feature catalog`;
      }
    }
  }

  return undefined;
}

async function postClinHook(
  path: string,
  req: CDSHookRequest,
): Promise<{ ms: number; json: unknown; status: number }> {
  return postCdsHook(path, req);
}

async function runClinScenarioAssertions(
  label: string,
  path: string,
  build: () => CDSHookRequest,
  extra?: (cards: ClinRawCard[]) => string | undefined,
): Promise<{ rows: ClinAssertionRow[]; p95Ms: number }> {
  const rows: ClinAssertionRow[] = [];
  let p95Ms = 0;

  try {
    const { ms, json, status } = await postClinHook(path, build());
    p95Ms = ms;

    if (status < 200 || status >= 300) {
      rows.push({
        id: `${label} HTTP`,
        ok: false,
        detail: `HTTP ${status}: ${JSON.stringify(json)}`,
      });
      return { rows, p95Ms };
    }

    const parsed = cdsHookResponseSchema.safeParse(json);
    rows.push({
      id: `${label} cdsHookResponseSchema`,
      ok: parsed.success,
      detail: parsed.success ? "ok" : parsed.error.message,
    });

    const rawCards = (json as { cards?: ClinRawCard[] }).cards ?? [];
    if (rawCards.length === 0) {
      rows.push({
        id: `${label} cards present`,
        ok: false,
        detail: "expected at least one card",
      });
    }

    for (let i = 0; i < rawCards.length; i += 1) {
      const err = assertClinCardInvariants(rawCards[i], `${label} card[${i}]`);
      rows.push({
        id: `${label} card[${i}] invariants`,
        ok: !err,
        detail: err ?? "ok",
      });
    }

    if (extra) {
      const extraErr = extra(rawCards);
      rows.push({
        id: `${label} scenario expectation`,
        ok: !extraErr,
        detail: extraErr ?? "ok",
      });
    }
  } catch (e) {
    rows.push({
      id: `${label} request`,
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return { rows, p95Ms };
}

async function measureClinP95(build: () => CDSHookRequest): Promise<{ p95Ms: number; err?: string }> {
  for (let i = 0; i < 2; i += 1) {
    await postClinHook(CLIN_SELECT_PATH, JSON.parse(JSON.stringify(build())) as CDSHookRequest);
  }
  const times: number[] = [];
  for (let i = 0; i < LATENCY_SAMPLES; i += 1) {
    const { ms, json, status } = await postClinHook(
      CLIN_SELECT_PATH,
      JSON.parse(JSON.stringify(build())) as CDSHookRequest,
    );
    if (status < 200 || status >= 300) {
      return { p95Ms: 0, err: `HTTP ${status}` };
    }
    const parsed = cdsHookResponseSchema.safeParse(json);
    if (!parsed.success) {
      return { p95Ms: 0, err: parsed.error.message };
    }
    times.push(ms);
  }
  times.sort((a, b) => a - b);
  return { p95Ms: percentile95(times) };
}

function gitHeadSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function writeSandboxHtmlReport(options: {
  insRows: Row[];
  insHookRows: Row[];
  clinRows: ClinAssertionRow[];
  clinP95Ms: number;
  allPass: boolean;
}): string {
  const dateIso = new Date().toISOString().slice(0, 10);
  const reportPath = join(process.cwd(), "logs", `sandbox-validation-report-${dateIso}.html`);
  mkdirSync(join(process.cwd(), "logs"), { recursive: true });

  const insTable = [...options.insRows, ...options.insHookRows]
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.scenario)}</td><td>${r.shape}</td><td>${r.behavior}</td><td>${r.latency}</td><td>${r.p95Ms.toFixed(0)}</td><td>${escapeHtml(r.detail)}</td></tr>`,
    )
    .join("");

  const clinTable = options.clinRows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.id)}</td><td class="${r.ok ? "ok" : "fail"}">${r.ok ? "PASS" : "FAIL"}</td><td>${escapeHtml(r.detail)}</td></tr>`,
    )
    .join("");

  const summary = options.allPass
    ? "All INS and CLIN sandbox assertions passed."
    : "One or more assertions failed — see table rows marked FAIL.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ARKA CDS Hooks Sandbox Validation Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #0f172a; max-width: 960px; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .meta { color: #475569; font-size: 0.9rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 1.25rem; }
    th, td { border: 1px solid #e2e8f0; padding: 0.35rem 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    .ok { color: #15803d; font-weight: 600; }
    .fail { color: #b91c1c; font-weight: 600; }
    .summary { padding: 0.75rem 1rem; background: ${options.allPass ? "#ecfdf5" : "#fef2f2"}; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>ARKA CDS Hooks Sandbox Validation Report</h1>
  <p class="meta">Date: ${dateIso} · Commit: <code>${escapeHtml(gitHeadSha())}</code> · CLIN p95: ${options.clinP95Ms.toFixed(0)} ms (threshold ${CLIN_P95_THRESHOLD_MS} ms)</p>
  <h2>ARKA-INS</h2>
  <table>
    <thead><tr><th>Scenario</th><th>Shape</th><th>Behavior</th><th>Latency</th><th>ms</th><th>Detail</th></tr></thead>
    <tbody>${insTable}</tbody>
  </table>
  <h2>ARKA-CLIN (FDA invariants)</h2>
  <table>
    <thead><tr><th>Assertion</th><th>Result</th><th>Detail</th></tr></thead>
    <tbody>${clinTable}</tbody>
  </table>
  <p class="summary"><strong>Summary:</strong> ${escapeHtml(summary)}</p>
</body>
</html>`;

  writeFileSync(reportPath, html, "utf8");
  return reportPath;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function runHookSmoke(
  label: string,
  path: string,
  build: () => CDSHookRequest,
): Promise<Row> {
  try {
    const { ms, json, status } = await postCdsHook(path, build());
    if (status < 200 || status >= 300) {
      return {
        scenario: label,
        shape: "fail",
        behavior: "fail",
        p95Ms: ms,
        latency: "ok",
        detail: `HTTP ${status}: ${JSON.stringify(json)}`,
      };
    }
    const parsed = cdsHookResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        scenario: label,
        shape: "fail",
        behavior: "fail",
        p95Ms: ms,
        latency: "ok",
        detail: parsed.error.message,
      };
    }
    const srcErr = assertFdaAndSource(parsed.data.cards);
    if (srcErr) {
      return {
        scenario: label,
        shape: "fail",
        behavior: "fail",
        p95Ms: ms,
        latency: "ok",
        detail: srcErr,
      };
    }
    return {
      scenario: label,
      shape: "ok",
      behavior: "ok",
      p95Ms: ms,
      latency: "ok",
      detail: `${parsed.data.cards.length} card(s)`,
    };
  } catch (e) {
    return {
      scenario: label,
      shape: "fail",
      behavior: "fail",
      p95Ms: 0,
      latency: "fail",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main(): Promise<void> {
  const offlineErr = validateOfflineCards();
  if (offlineErr) {
    console.error(`\nFAIL — offline card validation: ${offlineErr}`);
    process.exit(1);
  }
  console.log("\nPASS — offline STAT / duplicate / overuse / swallow-triage card checks");

  const scenarios: Array<{
    name: string;
    build: () => CDSHookRequest;
    validate: (cards: ParsedCDSHookResponse["cards"]) => string | undefined;
  }> = [
    { name: "1 Gold + MRI lumbar 72148", build: scenario1Request, validate: validateScenario1 },
    { name: "2 Non-gold + Brain MRI 70553 HDHP", build: scenario2Request, validate: validateScenario2 },
    { name: "3 Non-gold + CT 74177 poor docs", build: scenario3Request, validate: validateScenario3 },
  ];

  const rows: Row[] = [];

  for (const sc of scenarios) {
    let shape: Row["shape"] = "ok";
    let behavior: Row["behavior"] = "ok";
    let latency: Row["latency"] = "ok";
    let detail = "";
    let p95Val = 0;

    try {
      const req = sc.build();
      const { ms, json } = await postCoverage(req);
      p95Val = ms;

      const parsed = cdsHookResponseSchema.safeParse(json);
      if (!parsed.success) {
        shape = "fail";
        detail = parsed.error.message;
      } else {
        const srcErr = assertFdaAndSource(parsed.data.cards);
        if (srcErr) {
          shape = "fail";
          detail = srcErr;
        }
        const behErr = sc.validate(parsed.data.cards);
        if (behErr) {
          behavior = "fail";
          detail = behErr;
        }
      }

      const { p95Ms, err } = await measureP95(sc.build());
      if (err) {
        latency = "fail";
        detail = detail ? `${detail}; ${err}` : err;
      } else if (p95Ms >= P95_THRESHOLD_MS) {
        latency = "fail";
        detail = detail ? `${detail}; p95 ${p95Ms.toFixed(0)}ms >= ${P95_THRESHOLD_MS}ms` : `p95 ${p95Ms.toFixed(0)}ms`;
      }
      p95Val = p95Ms;
    } catch (e) {
      shape = "fail";
      behavior = "fail";
      latency = "fail";
      detail = e instanceof Error ? e.message : String(e);
    }

    rows.push({
      scenario: sc.name,
      shape,
      behavior,
      p95Ms: p95Val,
      latency,
      detail,
    });
  }

  const w = process.stdout.columns ?? 100;
  const line = "─".repeat(Math.min(w, 90));
  console.log(`\nARKA-INS CDS sandbox harness  →  ${BASE_URL}${COVERAGE_PATH}\n${line}`);
  console.log(
    `${"Scenario".padEnd(36)} | ${"Shape".padEnd(6)} | ${"Behavior".padEnd(8)} | ${"p95 OK".padEnd(6)} | p95 ms`,
  );
  console.log(line);
  for (const r of rows) {
    console.log(
      `${r.scenario.padEnd(36)} | ${r.shape.padEnd(6)} | ${r.behavior.padEnd(8)} | ${r.latency.padEnd(6)} | ${r.p95Ms.toFixed(0)}`,
    );
    if (r.detail) {
      console.log(`  → ${r.detail}`);
    }
  }
  console.log(line);

  const hookRows = await Promise.all([
    runHookSmoke("4 order-sign final-check", FINAL_CHECK_PATH, scenarioOrderSignRequest),
    runHookSmoke("5 appointment-book", APPOINTMENT_PATH, scenarioAppointmentBookRequest),
  ]);

  console.log(`\n${"─".repeat(Math.min(process.stdout.columns ?? 100, 90))}`);
  console.log("Additional CDS Hooks (server)");
  for (const r of hookRows) {
    console.log(
      `${r.scenario.padEnd(36)} | ${r.shape.padEnd(6)} | ${r.behavior.padEnd(8)} | ${r.latency.padEnd(6)} | ${r.p95Ms.toFixed(0)}`,
    );
    if (r.detail) {
      console.log(`  → ${r.detail}`);
    }
  }

  console.log(`\n${"─".repeat(Math.min(process.stdout.columns ?? 100, 90))}`);
  console.log(`ARKA-CLIN CDS sandbox  →  ${BASE_URL}${CLIN_SELECT_PATH}`);

  const clinAssertionRows: ClinAssertionRow[] = [];
  const lbpScenario = DEMO_SCENARIOS["lbp-1"];
  const haScenario = DEMO_SCENARIOS["ha-1"];
  const bellyScenario = DEMO_SCENARIOS.belly;

  const clinRuns = await Promise.all([
    runClinScenarioAssertions(
      "CLIN lbp-1 order-select",
      CLIN_SELECT_PATH,
      () => buildCdsRequest(lbpScenario, "order-select"),
      (cards) =>
        cards.some((c) => c.indicator !== "info")
          ? undefined
          : "lbp-1 order-select: expected at least one card with indicator !== info",
    ),
    runClinScenarioAssertions(
      "CLIN ha-1 order-select",
      CLIN_SELECT_PATH,
      () => buildCdsRequest(haScenario, "order-select"),
    ),
    runClinScenarioAssertions(
      "CLIN belly order-select",
      CLIN_SELECT_PATH,
      () => buildCdsRequest(bellyScenario, "order-select"),
    ),
    runClinScenarioAssertions(
      "CLIN lbp-1 order-sign",
      CLIN_SIGN_PATH,
      () => buildCdsRequest(lbpScenario, "order-sign"),
      (cards) => {
        const match = cards.find(
          (c) =>
            c.indicator === "critical" &&
            overrideReasonKey(c.overrideReasons?.[0]) === "clinical-judgment-unrecorded",
        );
        return match
          ? undefined
          : "lbp-1 order-sign: expected critical card with overrideReasons[0] clinical-judgment-unrecorded";
      },
    ),
  ]);

  for (const run of clinRuns) {
    clinAssertionRows.push(...run.rows);
  }

  const { p95Ms: clinP95Ms, err: clinP95Err } = await measureClinP95(() =>
    buildCdsRequest(lbpScenario, "order-select"),
  );
  clinAssertionRows.push({
    id: "CLIN p95 latency (20× lbp-1 order-select)",
    ok: !clinP95Err && clinP95Ms < CLIN_P95_THRESHOLD_MS,
    detail: clinP95Err
      ? clinP95Err
      : clinP95Ms < CLIN_P95_THRESHOLD_MS
        ? `p95 ${clinP95Ms.toFixed(0)} ms`
        : `p95 ${clinP95Ms.toFixed(0)} ms >= ${CLIN_P95_THRESHOLD_MS} ms`,
  });

  console.log(`${"Scenario / assertion".padEnd(44)} | Result | Detail`);
  console.log("─".repeat(Math.min(process.stdout.columns ?? 100, 90)));
  for (const r of clinAssertionRows) {
    console.log(
      `${r.id.padEnd(44)} | ${(r.ok ? "PASS" : "FAIL").padEnd(6)} | ${r.detail}`,
    );
  }

  const insPass =
    rows.every((r) => r.shape === "ok" && r.behavior === "ok" && r.latency === "ok") &&
    hookRows.every((r) => r.shape === "ok" && r.behavior === "ok");
  const clinPass = clinAssertionRows.every((r) => r.ok);
  const allPass = insPass && clinPass;

  const reportPath = writeSandboxHtmlReport({
    insRows: rows,
    insHookRows: hookRows,
    clinRows: clinAssertionRows,
    clinP95Ms,
    allPass,
  });
  console.log(`\nReport: ${reportPath}`);

  if (!allPass) {
    console.log(
      "\nFAIL — fix Supabase fixtures, CLIN card invariants, or server config (see docs/INS_SANDBOX_TESTING.md).",
    );
    process.exit(1);
  }
  console.log(
    "\nPASS — INS coverage/final-check/appointment-book, CLIN appropriateness FDA invariants, offline card checks.",
  );
  console.log(
    `Summary: INS 3/3 + hooks OK · CLIN ${clinAssertionRows.filter((r) => r.ok).length}/${clinAssertionRows.length} assertions · p95 ${clinP95Ms.toFixed(0)} ms · report ${reportPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
