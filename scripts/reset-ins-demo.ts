/**
 * Truncates core ARKA-INS aggregate tables and re-runs `runSeedInsDemoData` for investor demos.
 *
 * Run: `npm run reset:ins` (requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */

import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { runSeedInsDemoData } from "./seed-ins-demo-data";

const NIL = "00000000-0000-0000-0000-000000000000";

async function truncateInsDemoTables(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = [
    "ins_validation_events",
    "ins_pa_history",
    "ins_gold_card_scores",
    "ins_oop_estimates",
  ] as const;

  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq("id", NIL);
    if (error) {
      throw new Error(`${t} truncate: ${error.message}`);
    }
  }
}

async function main(): Promise<void> {
  await truncateInsDemoTables();
  await runSeedInsDemoData();
  console.log("[reset-ins-demo] Truncate + seed complete.");
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
