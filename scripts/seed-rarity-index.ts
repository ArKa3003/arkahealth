/**
 * Seeds ~100k ins_validation_events rarity dimensions and benchmarks MV refresh.
 *
 * Run: `tsx --env-file=.env.local scripts/seed-rarity-index.ts`
 */

import { performance } from "node:perf_hooks";

import { createClient } from "@supabase/supabase-js";

import {
  buildCptCombo,
  buildIcd10Combo,
  buildRedFlagCombo,
  buildAgeSexRegionKey,
} from "@/lib/aiie/interesting-case";
import { buildDemoRarityIndex } from "@/lib/aiie/rarity-demo-index";
import { buildGoldCardPriorImagingSnapshot } from "@/lib/ins/gold-card-prior-imaging-demo";
import type { AIIEOrder } from "@/lib/types/aiie";

const TARGET_ROWS = 100_000;
const CHUNK = 500;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

  const demoIndex = buildDemoRarityIndex();
  const rand = mulberry32(8808);
  const now = Date.now();
  const rows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < TARGET_ROWS; i++) {
    const template = demoIndex[i % demoIndex.length]!;
    const t = now - rand() * 300 * 86400000;
    const snapshot = buildGoldCardPriorImagingSnapshot(template.cpt_combo.split("+")[0] ?? "71260");
    if (template.icd10_combo.includes("G93")) {
      snapshot.codingContext.activeIcd10 = ["G93.41", "C79.31", "D49.6"];
    } else {
      snapshot.codingContext.activeIcd10 = ["M54.5", "M54.16"];
    }
    const order: AIIEOrder = {
      cpt: template.cpt_combo.split("+")[0],
      modality: "CT",
      procedure: "Benchmark order",
    };
    const { age_bucket, sex, region_bucket } = buildAgeSexRegionKey({
      ageYears: 45,
      sex: template.sex === "male" ? "male" : "female",
      regionBucket: template.region_bucket,
    });

    rows.push({
      event_type: "gold_card_check",
      occurred_at: new Date(t).toISOString(),
      icd10_combo: buildIcd10Combo(snapshot),
      cpt_combo: buildCptCombo(snapshot, order),
      age_bucket,
      sex,
      region_bucket,
      redflag_combo: buildRedFlagCombo(
        template.redflag_combo === "none" ?
          undefined
        : {
            cancerHistory: template.redflag_combo.includes("cancerHistory"),
            neurologicalDeficit: template.redflag_combo.includes("neurologicalDeficit"),
            progressiveSymptoms: template.redflag_combo.includes("progressiveSymptoms"),
            ageOver50: template.redflag_combo.includes("ageOver50"),
            fever: false,
            weightLoss: false,
            trauma: false,
            immunocompromised: false,
            ivDrugUse: false,
            osteoporosis: false,
            ageUnder18: false,
            bladderBowelDysfunction: false,
            suddenOnset: false,
          },
      ),
      metadata: { rarity_seed: true, index: i },
    });
  }

  console.log(`[seed-rarity-index] Inserting ${TARGET_ROWS} validation events…`);
  for (let i = 0; i < rows.length; i += CHUNK) {
    const part = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("ins_validation_events").insert(part);
    if (error) {
      throw new Error(`insert failed at ${i}: ${error.message}`);
    }
  }

  const t0 = performance.now();
  const { error: refreshErr } = await supabase.rpc("refresh_ins_rarity_index_mv");
  const elapsedMs = performance.now() - t0;

  if (refreshErr) {
    console.warn(
      `[seed-rarity-index] refresh_ins_rarity_index_mv failed (${refreshErr.message}). ` +
        "Apply migration 022 or run REFRESH MATERIALIZED VIEW public.ins_rarity_index;",
    );
  } else {
    console.log(
      `[seed-rarity-index] REFRESH ins_rarity_index completed in ${elapsedMs.toFixed(0)} ms ` +
        `(target <10s at 100k rows).`,
    );
  }
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
