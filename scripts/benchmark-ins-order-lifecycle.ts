/**
 * Seeds a large `ins_aiie_audit` set (when empty) and times lifecycle reads.
 * For EXPLAIN ANALYZE, run `supabase/benchmarks/order_lifecycle_explain.sql` against Postgres.
 *
 * Run: `tsx --env-file=.env.local scripts/benchmark-ins-order-lifecycle.ts`
 */

import { createHash } from "crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const TARGET_ROWS = 100_000;
const BATCH = 500;

function orderHash(seed: string): string {
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

  const { count, error: countErr } = await supabase
    .from("ins_aiie_audit")
    .select("id", { count: "exact", head: true });

  if (countErr) {
    throw new Error(`count ins_aiie_audit: ${countErr.message}`);
  }

  const existing = count ?? 0;
  if (existing < TARGET_ROWS) {
    console.log(`[benchmark] Seeding ${TARGET_ROWS - existing} audit rows (had ${existing})…`);
    const toInsert = TARGET_ROWS - existing;
    for (let offset = 0; offset < toInsert; offset += BATCH) {
      const batch: Array<Record<string, unknown>> = [];
      const n = Math.min(BATCH, toInsert - offset);
      for (let i = 0; i < n; i++) {
        const idx = existing + offset + i;
        const oh = orderHash(`bench-order-${idx}`);
        const ph = orderHash(`bench-patient-${idx % 5000}`);
        batch.push({
          order_hash: oh,
          patient_hash: ph,
          icd10: ["M54.5"],
          cpt: ["72148", "73721", "74177", "70553", "71260"][idx % 5],
          clinical_score: 40 + (idx % 55),
          mnai_tier: ["low", "moderate", "high"][idx % 3],
          denial_risk: idx % 90,
          factor_payload: { bench: true, idx },
        });
      }
      const { error } = await supabase.from("ins_aiie_audit").insert(batch);
      if (error) {
        throw new Error(`insert batch at ${offset}: ${error.message}`);
      }
    }
  } else {
    console.log(`[benchmark] ins_aiie_audit already has ${existing} rows — skip seed.`);
  }

  const start = performance.now();
  const { data, error } = await supabase
    .from("ins_order_lifecycle")
    .select("*")
    .order("audit_at", { ascending: false })
    .range(0, 49);
  const elapsed = performance.now() - start;

  if (error) {
    throw new Error(`lifecycle select: ${error.message}`);
  }

  console.log(
    `[benchmark] Page-1 lifecycle query returned ${data?.length ?? 0} rows in ${elapsed.toFixed(1)} ms`,
  );
  if (elapsed > 200) {
    console.warn("[benchmark] WARN: exceeded 200 ms target — apply migration 033 indexes and run EXPLAIN ANALYZE.");
  } else {
    console.log("[benchmark] OK: under 200 ms target for first page.");
  }
}

const isMainModule =
  typeof process.argv[1] === "string" &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMainModule) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
