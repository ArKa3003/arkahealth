/**
 * Seeds `arka_lake.imaging_orders` (when below target) and times `institution_benchmarks` reads.
 * Target: 1M rows; benchmarks MV should answer within 500 ms after refresh.
 *
 * Run: `tsx --env-file=.env.local scripts/benchmark-imaging-datalake.ts`
 */

import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const TARGET_ROWS = 1_000_000;
const BATCH = 1000;
const INSTITUTION = "bench-institution";
const BENCHMARK_MS_BUDGET = 500;

function hashSeed(seed: string): string {
  return createHash("sha256").update(seed, "utf8").digest("hex");
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const lake = supabase.schema("arka_lake");

  const { count, error: countErr } = await lake
    .from("imaging_orders")
    .select("id", { count: "exact", head: true });

  if (countErr) {
    throw new Error(`count imaging_orders: ${countErr.message}`);
  }

  const existing = count ?? 0;
  if (existing < TARGET_ROWS) {
    console.log(`[datalake-bench] Seeding ${TARGET_ROWS - existing} rows (had ${existing})…`);
    const cpts = ["72148", "73721", "74177", "70553", "71260"];
    const buckets = ["18-44", "45-64", "65-84"] as const;
    const toInsert = TARGET_ROWS - existing;
    for (let offset = 0; offset < toInsert; offset += BATCH) {
      const batch: Array<Record<string, unknown>> = [];
      const n = Math.min(BATCH, toInsert - offset);
      for (let i = 0; i < n; i++) {
        const idx = existing + offset + i;
        batch.push({
          institution_id: INSTITUTION,
          order_hash: hashSeed(`lake-order-${idx}`),
          patient_hash: hashSeed(`lake-patient-${INSTITUTION}:${idx % 50_000}`),
          age_bucket: buckets[idx % buckets.length],
          sex: idx % 2 === 0 ? "female" : "male",
          icd10: ["M54.5"],
          cpt: cpts[idx % cpts.length],
          modality: "CT",
          body_part: "spine",
          appropriateness: 40 + (idx % 55),
          denial_risk: idx % 90,
          prior_imaging_within_30d: idx % 17 === 0,
          mnai_tier: ["green", "amber", "red"][idx % 3],
          report_conclusion_redacted: idx % 100 === 0 ? "No acute process." : null,
        });
      }
      const { error } = await lake.from("imaging_orders").insert(batch);
      if (error) {
        throw new Error(`insert batch at ${offset}: ${error.message}`);
      }
      if (offset % 50_000 === 0 && offset > 0) {
        console.log(`[datalake-bench] …${offset + n} rows`);
      }
    }
  } else {
    console.log(`[datalake-bench] imaging_orders already has ${existing} rows — skip seed.`);
  }

  const { error: refreshErr } = await supabase.rpc("refresh_institution_benchmarks_mv");
  if (refreshErr) {
    throw new Error(
      `refresh institution_benchmarks: ${refreshErr.message}. Apply migration 030 and grant execute.`,
    );
  }

  const start = performance.now();
  const { data, error } = await lake
    .from("institution_benchmarks")
    .select("*")
    .eq("institution_id", INSTITUTION);
  const elapsed = performance.now() - start;

  if (error) {
    throw new Error(`benchmarks select: ${error.message}`);
  }

  console.log(
    `[datalake-bench] institution_benchmarks: ${data?.length ?? 0} rows in ${elapsed.toFixed(1)} ms`,
  );
  if (elapsed > BENCHMARK_MS_BUDGET) {
    console.warn(
      `[datalake-bench] WARN: exceeded ${BENCHMARK_MS_BUDGET} ms budget (got ${elapsed.toFixed(1)} ms)`,
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
