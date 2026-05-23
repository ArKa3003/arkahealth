/**
 * Idempotent ARKA-INS demo dataset for Supabase (service role).
 *
 * Run: `npm run seed:ins` (requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *
 * Cash price anchors for shoppable rows (illustrative; verify current rates before production use):
 * - Green Imaging publishes all-inclusive self-pay imaging prices on their public national list.
 * - RadiologyAssist publishes bundled cash imaging pricing for common outpatient studies by market.
 * - CMS Hospital Price Transparency (45 CFR § 180.20) machine-readable files expose hospital charges and
 *   payer-specific negotiated amounts; third-party aggregators normalize cross-facility comparisons.
 */

import { createHash } from "crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  buildAgeSexRegionKey,
  buildCptCombo,
  buildIcd10Combo,
  buildRedFlagCombo,
} from "@/lib/aiie/interesting-case";
import { buildGoldCardPriorImagingSnapshot } from "@/lib/ins/gold-card-prior-imaging-demo";
import { REVIEWER_DEMO_PROVIDER_ID } from "@/lib/ins/reviewer-queue";
import type { AIIEOrder } from "@/lib/types/aiie";

const DEMO_NAME_PREFIX = "[ARKA-DEMO]";
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/** Mirrors `lib/aiie/gold-card.ts` Wilson lower bound (conservative approval proportion). */
const Z = 1.96;
function wilsonLowerBound(successes: number, trials: number): number {
  if (trials <= 0) {
    return 0;
  }
  const p = successes / trials;
  const z2 = Z * Z;
  const denom = 1 + z2 / trials;
  const center = p + z2 / (2 * trials);
  const margin = Z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);
  return Math.max(0, Math.min(1, (center - margin) / denom));
}

const MIN_SAMPLE = 10;
const ELIGIBILITY_MIN_SAMPLE = 20;
const ELIGIBILITY_MIN_RATE = 0.9;
const CACHE_VALIDITY_DAYS = 30;

type PaDecision = "approved" | "denied" | "pended" | "auto_approved";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
}

/** Seeded shuffle — uses mulberry32 for deterministic demo rows. */
function shuffleArray<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rand = mulberry32(seed);
  shuffleInPlace(out, rand);
  return out;
}

const CPT_POOL = ["72148", "73721", "74177", "70553", "71260"] as const;
const PAYER_POOL = ["uhc", "bcbs-tx", "aetna", "cigna", "humana"] as const;

const SPECIALTIES = [
  "Diagnostic Radiology",
  "Interventional Radiology",
  "Neuroradiology",
  "Musculoskeletal Radiology",
  "Emergency Radiology",
  "Cardiac Imaging",
  "Body Imaging",
  "Breast Imaging",
  "Pediatric Radiology",
  "Nuclear Medicine",
  "Radiation Oncology",
  "Abdominal Imaging",
  "Thoracic Imaging",
  "Vascular Imaging",
  "Women's Imaging",
] as const;

const STATES = ["MO", "TX", "AZ", "GA", "NY", "KS", "CA", "FL", "CO", "WA", "OR", "IL", "NC", "TN", "OH"] as const;

function providerNpis(): string[] {
  return Array.from({ length: 15 }, (_, i) => String(1999999001 + i));
}

function providerIds(): string[] {
  const base = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a";
  const suffixes = ["11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f"];
  return suffixes.map((s) => `${base}${s}`);
}

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

function patientHash(seed: string): string {
  return createHash("sha256").update(seed, "utf8").digest("hex");
}

function demoOrderHash(index: number): string {
  return patientHash(`arka-ins-lifecycle-demo|order|${index}`);
}

const LIFECYCLE_LINKED_COUNT = 80;
const SCHEDULING_STATUSES = ["pending", "in_progress", "scheduled", "sla_breached", "cancelled"] as const;

interface ProviderSeedRow {
  id: string;
  npi: string;
  name: string;
  specialty: string;
  organization: string;
  state: string;
}

function buildProviders(): ProviderSeedRow[] {
  const npis = providerNpis();
  const ids = providerIds();
  assert(ids[0] === REVIEWER_DEMO_PROVIDER_ID, "First demo provider must match reviewer demo UUID.");
  return ids.map((id, i) => ({
    id,
    npi: npis[i]!,
    name: `ARKA Demo Provider ${i + 1}`,
    specialty: SPECIALTIES[i % SPECIALTIES.length]!,
    organization: `Demo Imaging Group ${(i % 5) + 1}`,
    state: STATES[i % STATES.length]!,
  }));
}

function buildDecisionList(): PaDecision[] {
  const out: PaDecision[] = [];
  for (let i = 0; i < 325; i++) {
    out.push("approved");
  }
  for (let i = 0; i < 50; i++) {
    out.push("auto_approved");
  }
  for (let i = 0; i < 50; i++) {
    out.push("pended");
  }
  for (let i = 0; i < 75; i++) {
    out.push("denied");
  }
  assert(out.length === 500, "decision list must be 500");
  return shuffleArray(out, 20260419);
}

type SiteType = "hospital" | "imaging_center" | "freestanding" | "cash_pay";

interface ShoppableSeed {
  name: string;
  address: string;
  site_type: SiteType;
  cpt_code: string;
  cash_price: number;
  negotiated_rate: number;
  in_network_payers: string[];
  quality_score: number;
  avg_wait_days: number;
  lat: number;
  lng: number;
}

/**
 * Representative cash/allowed amounts (USD) for executive demos — see file header for public sources.
 * Values are rounded for readability; not a quote or guarantee of member liability.
 */
function buildShoppableSites(): ShoppableSeed[] {
  const metros: Array<{
    city: string;
    st: string;
    lat: number;
    lng: number;
    priceTier: number;
  }> = [
    { city: "Kansas City", st: "MO", lat: 39.0997, lng: -94.5786, priceTier: 1 },
    { city: "Dallas", st: "TX", lat: 32.7767, lng: -96.797, priceTier: 1.02 },
    { city: "Phoenix", st: "AZ", lat: 33.4484, lng: -112.074, priceTier: 0.98 },
    { city: "Atlanta", st: "GA", lat: 33.749, lng: -84.388, priceTier: 1.05 },
    { city: "New York", st: "NY", lat: 40.7128, lng: -74.006, priceTier: 1.12 },
  ];

  const cpts: Array<{ code: string; modality: "mri" | "ct"; baseCash: number; baseNeg: number }> = [
    { code: "72148", modality: "mri", baseCash: 525, baseNeg: 1480 },
    { code: "73721", modality: "mri", baseCash: 595, baseNeg: 1620 },
    { code: "74177", modality: "ct", baseCash: 285, baseNeg: 780 },
    { code: "70553", modality: "mri", baseCash: 725, baseNeg: 2100 },
    { code: "71260", modality: "ct", baseCash: 315, baseNeg: 860 },
  ];

  const sites: ShoppableSeed[] = [];
  let idx = 0;
  for (const m of metros) {
    for (let k = 0; k < 10; k++) {
      const c = cpts[idx % cpts.length]!;
      idx++;
      const jitter = (n: number) => n + (k - 5) * 7 + (idx % 4) * 3;
      const siteTypes: SiteType[] = ["imaging_center", "freestanding", "hospital", "cash_pay", "imaging_center", "freestanding", "hospital", "imaging_center", "freestanding", "hospital"];
      const stype = siteTypes[k] ?? "imaging_center";
      const cash = Math.round(jitter(c.baseCash * m.priceTier));
      const neg = Math.round(jitter(c.baseNeg * m.priceTier * 0.95));
      sites.push({
        name: `${DEMO_NAME_PREFIX} ${m.city} ${c.modality.toUpperCase()} — Site ${k + 1}`,
        address: `${120 + k * 11} Imaging Blvd, ${m.city}, ${m.st}`,
        site_type: stype,
        cpt_code: c.code,
        cash_price: cash,
        negotiated_rate: neg,
        in_network_payers: ["uhc", "bcbs-tx", "aetna"],
        quality_score: 78 + (idx % 15),
        avg_wait_days: 2 + (idx % 5),
        lat: m.lat + (k - 5) * 0.02,
        lng: m.lng + (k - 5) * 0.02,
      });
    }
  }
  assert(sites.length === 50, "expected 50 shoppable sites");
  return sites;
}

interface GoldAggKey {
  provider_id: string;
  cpt_code: string;
  payer_id: string;
}

function aggregateGold(rows: Array<{ provider_id: string; cpt_code: string; payer_id: string; decision: PaDecision }>): Map<
  string,
  { successes: number; trials: number }
> {
  const map = new Map<string, { successes: number; trials: number }>();
  for (const r of rows) {
    const k: GoldAggKey = {
      provider_id: r.provider_id,
      cpt_code: r.cpt_code,
      payer_id: r.payer_id,
    };
    const key = `${k.provider_id}|${k.cpt_code}|${k.payer_id}`;
    const cur = map.get(key) ?? { successes: 0, trials: 0 };
    cur.trials += 1;
    if (r.decision === "approved" || r.decision === "auto_approved") {
      cur.successes += 1;
    }
    map.set(key, cur);
  }
  return map;
}

async function upsertGoldScores(
  supabase: SupabaseClient,
  agg: Map<string, { successes: number; trials: number }>,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const validUntil = new Date(Date.now() + CACHE_VALIDITY_DAYS * 86400000).toISOString();

  const rows: Array<Record<string, unknown>> = [];
  for (const [key, v] of agg) {
    const [provider_id, cpt_code, payer_id] = key.split("|");
    assert(Boolean(provider_id && cpt_code && payer_id), "aggregate key");
    const sampleSize = v.trials;
    if (sampleSize < MIN_SAMPLE) {
      continue;
    }
    const approvalRate = v.successes / sampleSize;
    const wilsonPct = Math.round(wilsonLowerBound(v.successes, sampleSize) * 100);
    const eligible = sampleSize >= ELIGIBILITY_MIN_SAMPLE && approvalRate >= ELIGIBILITY_MIN_RATE;
    rows.push({
      provider_id,
      cpt_code,
      payer_id,
      approval_rate: approvalRate,
      sample_size: sampleSize,
      score: wilsonPct,
      eligible,
      computed_at: nowIso,
      valid_until: validUntil,
    });
  }

  const chunk = 50;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const { error } = await supabase.from("ins_gold_card_scores").upsert(part, {
      onConflict: "provider_id,cpt_code,payer_id",
    });
    if (error) {
      throw new Error(`ins_gold_card_scores upsert: ${error.message}`);
    }
  }
}

function buildValidationEvents(
  providerIds: string[],
  rand: () => number,
): Array<{
  event_type: string;
  provider_id: string | null;
  payer_id: string | null;
  amount_usd: number | null;
  minutes_saved: number | null;
  occurred_at: string;
  icd10_combo: string;
  cpt_combo: string;
  age_bucket: string;
  sex: string;
  region_bucket: string;
  redflag_combo: string;
}> {
  const types = [
    "pa_submitted",
    "pa_avoided_by_gold_card",
    "pa_avoided_by_crd",
    "appeal_won",
    "oop_savings_realized",
    "provider_time_saved",
    "gold_card_check",
    "oop_estimate_presented",
  ] as const;

  const out: Array<{
    event_type: string;
    provider_id: string | null;
    payer_id: string | null;
    amount_usd: number | null;
    minutes_saved: number | null;
    occurred_at: string;
    icd10_combo: string;
    cpt_combo: string;
    age_bucket: string;
    sex: string;
    region_bucket: string;
    redflag_combo: string;
  }> = [];

  const now = Date.now();
  const ms12 = 365 * 86400000;

  for (let i = 0; i < 200; i++) {
    const t = now - (i / 200) * ms12 * (0.85 + rand() * 0.12);
    const progress = 1 - i / 200;
    const provider_id = providerIds[Math.floor(rand() * providerIds.length)]!;
    const payer_id = PAYER_POOL[Math.floor(rand() * PAYER_POOL.length)]!;
    const event_type = types[i % types.length]!;
    const baseAmt = 120 + progress * 420;
    const amount_usd =
      event_type === "oop_savings_realized" || event_type === "appeal_won" ? Math.round(baseAmt + rand() * 180) : null;
    const minutes_saved =
      event_type === "provider_time_saved" || event_type === "pa_avoided_by_gold_card" ?
        Math.round(12 + rand() * 28)
      : event_type === "pa_submitted" ? Math.round(10 + rand() * 15)
      : null;

    const cpt_code = CPT_POOL[i % CPT_POOL.length]!;
    const snapshot = buildGoldCardPriorImagingSnapshot(cpt_code);
    const order: AIIEOrder = {
      cpt: cpt_code,
      modality: "MRI",
      procedure: `Demo ${cpt_code}`,
    };
    const { age_bucket, sex, region_bucket } = buildAgeSexRegionKey({
      ageYears: 40 + (i % 25),
      sex: i % 2 === 0 ? "female" : "male",
      regionBucket: STATES[i % STATES.length],
    });

    out.push({
      event_type,
      provider_id,
      payer_id,
      amount_usd,
      minutes_saved,
      occurred_at: new Date(t).toISOString(),
      icd10_combo: buildIcd10Combo(snapshot),
      cpt_combo: buildCptCombo(snapshot, order),
      age_bucket,
      sex,
      region_bucket,
      redflag_combo: buildRedFlagCombo(
        i % 17 === 0 ?
          {
            cancerHistory: true,
            neurologicalDeficit: true,
            fever: false,
            weightLoss: false,
            trauma: false,
            immunocompromised: false,
            ivDrugUse: false,
            osteoporosis: false,
            ageOver50: true,
            ageUnder18: false,
            progressiveSymptoms: true,
            bladderBowelDysfunction: false,
            suddenOnset: false,
          }
        : undefined,
      ),
    });
  }
  return out;
}

/**
 * Exported for `reset-ins-demo.ts`; idempotent full seed.
 */
export async function runSeedInsDemoData(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const providers = buildProviders();
  const providerIdList = providers.map((p) => p.id);

  const { error: pErr } = await supabase.from("ins_providers").upsert(
    providers.map((p) => ({
      id: p.id,
      npi: p.npi,
      name: p.name,
      specialty: p.specialty,
      organization: p.organization,
      state: p.state,
    })),
    { onConflict: "npi" },
  );
  if (pErr) {
    throw new Error(`ins_providers upsert: ${pErr.message}`);
  }

  const { error: delPaErr } = await supabase.from("ins_pa_history").delete().in("provider_id", providerIdList);
  if (delPaErr) {
    throw new Error(`ins_pa_history delete: ${delPaErr.message}`);
  }

  const { error: delGoldErr } = await supabase.from("ins_gold_card_scores").delete().in("provider_id", providerIdList);
  if (delGoldErr) {
    throw new Error(`ins_gold_card_scores delete: ${delGoldErr.message}`);
  }

  const { error: delValErr } = await supabase.from("ins_validation_events").delete().in("provider_id", providerIdList);
  if (delValErr) {
    throw new Error(`ins_validation_events delete: ${delValErr.message}`);
  }

  const { error: delAuditErr } = await supabase
    .from("ins_aiie_audit")
    .delete()
    .contains("factor_payload", { lifecycle_demo: true });
  if (delAuditErr) {
    throw new Error(`ins_aiie_audit delete: ${delAuditErr.message}`);
  }

  const { error: delSchedErr } = await supabase.from("ins_scheduling_intent").delete().neq("id", NIL_UUID);
  if (delSchedErr) {
    throw new Error(`ins_scheduling_intent delete: ${delSchedErr.message}`);
  }

  const { data: demoSites, error: demoSiteFetchErr } = await supabase
    .from("ins_shoppable_sites")
    .select("id")
    .like("name", `${DEMO_NAME_PREFIX}%`);
  if (demoSiteFetchErr) {
    throw new Error(`ins_shoppable_sites select: ${demoSiteFetchErr.message}`);
  }
  const demoSiteIds = (demoSites ?? []).map((r: { id: string }) => r.id);
  if (demoSiteIds.length > 0) {
    const { error: delOopErr } = await supabase.from("ins_oop_estimates").delete().in("site_id", demoSiteIds);
    if (delOopErr) {
      throw new Error(`ins_oop_estimates delete: ${delOopErr.message}`);
    }
  }

  const { error: delShErr } = await supabase.from("ins_shoppable_sites").delete().like("name", `${DEMO_NAME_PREFIX}%`);
  if (delShErr) {
    throw new Error(`ins_shoppable_sites delete: ${delShErr.message}`);
  }

  const shoppable = buildShoppableSites();
  const { data: insertedSites, error: shErr } = await supabase.from("ins_shoppable_sites").insert(shoppable).select("id");
  if (shErr) {
    throw new Error(`ins_shoppable_sites insert: ${shErr.message}`);
  }
  const siteIds = (insertedSites ?? []).map((r: { id: string }) => r.id);
  assert(siteIds.length === 50, "inserted shoppable sites");

  const decisions = buildDecisionList();
  const rand = mulberry32(9001);

  const paRows: Array<{
    provider_id: string;
    patient_hash: string;
    cpt_code: string;
    icd10_codes: string[];
    payer_id: string;
    aiie_clinical_score: number;
    aiie_denial_risk: number;
    submitted_at: string;
    decision_at: string;
    decision: PaDecision;
    appeal_filed: boolean;
    appeal_overturned: boolean;
    order_hash?: string;
  }> = [];

  let deniedCounter = 0;

  for (let i = 0; i < 500; i++) {
    const decision = decisions[i]!;
    const provider_id = providerIdList[i % providerIdList.length]!;
    const cpt_code = CPT_POOL[i % CPT_POOL.length]!;
    const payer_id = PAYER_POOL[i % PAYER_POOL.length]!;
    const submitted = new Date(Date.now() - rand() * 365 * 86400000).toISOString();
    const decision_at = new Date(new Date(submitted).getTime() + (12 + rand() * 60) * 3600000).toISOString();

    let appeal_filed = false;
    let appeal_overturned = false;
    if (decision === "denied") {
      deniedCounter += 1;
      appeal_filed = deniedCounter <= 45;
      appeal_overturned = deniedCounter <= 18;
    }

    const row: (typeof paRows)[number] = {
      provider_id,
      patient_hash: patientHash(`arka-ins-demo|${i}|${provider_id}|${cpt_code}|${payer_id}`),
      cpt_code,
      icd10_codes: ["M54.16", "M54.5"],
      payer_id,
      aiie_clinical_score: Math.round(30 + rand() * 60) / 10,
      aiie_denial_risk: Math.round(rand() * 85),
      submitted_at: submitted,
      decision_at,
      decision,
      appeal_filed,
      appeal_overturned,
    };
    if (i < LIFECYCLE_LINKED_COUNT) {
      row.order_hash = demoOrderHash(i);
    }
    paRows.push(row);
  }

  const chunk = 100;
  for (let i = 0; i < paRows.length; i += chunk) {
    const part = paRows.slice(i, i + chunk);
    const { error: paInsErr } = await supabase.from("ins_pa_history").insert(part);
    if (paInsErr) {
      throw new Error(`ins_pa_history insert: ${paInsErr.message}`);
    }
  }

  const agg = aggregateGold(
    paRows.map((r) => ({
      provider_id: r.provider_id,
      cpt_code: r.cpt_code,
      payer_id: r.payer_id,
      decision: r.decision,
    })),
  );
  await upsertGoldScores(supabase, agg);

  const validationRows = buildValidationEvents(providerIdList, mulberry32(4242));
  const { error: vErr } = await supabase.from("ins_validation_events").insert(validationRows);
  if (vErr) {
    throw new Error(`ins_validation_events insert: ${vErr.message}`);
  }

  const oopRows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 40; i++) {
    const site_id = siteIds[i % siteIds.length]!;
    const cpt_code = CPT_POOL[i % CPT_POOL.length]!;
    const payer_id = PAYER_POOL[i % PAYER_POOL.length]!;
    const row: Record<string, unknown> = {
      cpt_code,
      payer_id,
      plan_id: `demo-plan-${payer_id}`,
      site_id,
      negotiated_rate: 780 + (i % 7) * 40,
      cash_price: 520 + (i % 9) * 25,
      patient_deductible_remaining: 900,
      estimated_patient_responsibility: 210 + (i % 5) * 18,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    if (i < LIFECYCLE_LINKED_COUNT) {
      row.order_hash = demoOrderHash(i);
    }
    oopRows.push(row);
  }
  const { error: oopErr } = await supabase.from("ins_oop_estimates").insert(oopRows);
  if (oopErr) {
    throw new Error(`ins_oop_estimates insert: ${oopErr.message}`);
  }

  const auditRows = Array.from({ length: LIFECYCLE_LINKED_COUNT }, (_, i) => {
    const oh = demoOrderHash(i);
    const ph = patientHash(`arka-ins-lifecycle-demo|patient|${i}`);
    const cpt = CPT_POOL[i % CPT_POOL.length]!;
    return {
      order_hash: oh,
      patient_hash: ph,
      icd10: ["M54.5"],
      cpt,
      clinical_score: 45 + (i % 40),
      mnai_tier: ["low", "moderate", "high"][i % 3],
      denial_risk: 10 + (i % 70),
      factor_payload: { lifecycle_demo: true, index: i },
    };
  });
  const { error: auditErr } = await supabase.from("ins_aiie_audit").insert(auditRows);
  if (auditErr) {
    throw new Error(`ins_aiie_audit insert: ${auditErr.message}`);
  }

  const slaBase = Date.now() + 72 * 3600000;
  const schedRows = Array.from({ length: LIFECYCLE_LINKED_COUNT }, (_, i) => ({
    order_hash: demoOrderHash(i),
    patient_hash: patientHash(`arka-ins-lifecycle-demo|patient|${i}`),
    sla_expires_at: new Date(slaBase + i * 3600000).toISOString(),
    status: SCHEDULING_STATUSES[i % SCHEDULING_STATUSES.length],
    cpt: CPT_POOL[i % CPT_POOL.length],
    modality: i % 2 === 0 ? "MRI" : "CT",
    body_part: "Spine",
  }));
  const { error: schedErr } = await supabase.from("ins_scheduling_intent").insert(schedRows);
  if (schedErr) {
    throw new Error(`ins_scheduling_intent insert: ${schedErr.message}`);
  }

  const { error: refreshErr } = await supabase.rpc("refresh_ins_roi_summary_mv");
  if (refreshErr) {
    console.warn(
      `[seed-ins-demo-data] ROI materialized view refresh failed (${refreshErr.message}). ` +
        "Apply migration 011 or run: REFRESH MATERIALIZED VIEW public.mv_ins_roi_summary;",
    );
  }

  const { error: rarityRefreshErr } = await supabase.rpc("refresh_ins_rarity_index_mv");
  if (rarityRefreshErr) {
    console.warn(
      `[seed-ins-demo-data] Rarity index refresh failed (${rarityRefreshErr.message}). ` +
        "Apply migration 022 or run: REFRESH MATERIALIZED VIEW public.ins_rarity_index;",
    );
  }

  console.log(
    `[seed-ins-demo-data] Done: ${providers.length} providers, ${paRows.length} PA rows, ${shoppable.length} sites, ${validationRows.length} validation events, ${oopRows.length} OOP rows, ${LIFECYCLE_LINKED_COUNT} lifecycle-linked orders.`,
  );
}

const isMainModule =
  typeof process.argv[1] === "string" &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMainModule) {
  runSeedInsDemoData().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
