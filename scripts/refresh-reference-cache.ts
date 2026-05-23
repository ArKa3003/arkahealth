/**
 * Nightly reference cache refresh (Radiopaedia + curated WebMD corpus → pgvector).
 *
 * Run: `npm run refresh:reference-cache` (requires Supabase service role + optional RADIOPAEDIA_ACCESS_TOKEN).
 */

import { refreshReferenceCache } from "@/lib/retrieval/refresh-cache";

async function main(): Promise<void> {
  const result = await refreshReferenceCache({ maxCombos: 200 });
  console.log(
    JSON.stringify(
      {
        ok: true,
        combosProcessed: result.combosProcessed,
        radiopaediaStored: result.radiopaediaStored,
        webmdStored: result.webmdStored,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 20),
      },
      null,
      2,
    ),
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ ok: false, error: message }));
  process.exit(1);
});
