/**
 * Hits ARKA-INS CDS Hooks `order-select` (`arka-ins-coverage`) with realistic payloads,
 * validates CDS Hooks 2.0–shaped responses, checks scenario expectations, and measures latency.
 *
 * Prerequisites:
 * - `npm run dev` (or set `CDS_SANDBOX_BASE_URL` to a deployed origin)
 * - Supabase service role env vars so Gold Card / OOP / shoppable paths resolve (`SUPABASE_SERVICE_ROLE_KEY`, etc.)
 * - Migration `010_cds_sandbox_fixtures.sql` applied (Gold Card scenario 1)
 * - `scripts/seed-shoppable-sites.ts` run for CPT `70553` alternative-site data (scenario 2)
 */

import { randomUUID } from "node:crypto";

import {
  cdsHookResponseSchema,
  type ParsedCDSHookResponse,
} from "@/lib/validation/cds-hooks-response";
import type { CDSHookRequest } from "@/lib/types/cds-hooks";
import type {
  Bundle,
  Coverage,
  Patient,
  Practitioner,
  ServiceRequest,
} from "@/lib/types/fhir";

const BASE_URL = (process.env.CDS_SANDBOX_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const COVERAGE_PATH = "/api/cds-services/arka-ins-coverage";

const GOLD_NPI = process.env.ARKA_SANDBOX_GOLD_NPI ?? "1003000126";
const NON_GOLD_NPI = process.env.ARKA_SANDBOX_NON_GOLD_NPI ?? "1003000127";

const PAYER_REF = "Organization/aetna";
const LATENCY_SAMPLES = 20;
const P95_THRESHOLD_MS = 800;
const FDA_MARKERS = ["FDA Non-Device", "21st Century Cures Act"];
const SOURCE_LABEL = "ARKA-INS (AIIE v2.0)";

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
    if (!FDA_MARKERS.some((m) => d.includes(m))) {
      return `Card "${c.summary.slice(0, 40)}" missing FDA disclaimer markers`;
    }
  }
  return undefined;
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

async function main(): Promise<void> {
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

  const allPass = rows.every((r) => r.shape === "ok" && r.behavior === "ok" && r.latency === "ok");
  if (!allPass) {
    console.log("\nFAIL — fix Supabase fixtures, seed data, or server config (see docs/INS_SANDBOX_TESTING.md).");
    process.exit(1);
  }
  console.log("\nPASS — all scenarios within CDS shape, behavior, and p95 budget.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
