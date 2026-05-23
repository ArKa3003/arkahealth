import { createAdminClient } from "@/lib/supabase/admin";

import { composeReferenceQuery } from "@/lib/retrieval/compose-query";
import { searchRadiopaedia } from "@/lib/retrieval/radiopaedia-client";
import { searchWebmdCorpus } from "@/lib/retrieval/webmd-client";
import { embedAndStore } from "@/lib/retrieval/vector-index";
import type { ReferenceDoc } from "@/lib/retrieval/types";

export interface ReferenceCacheCombo {
  cpt: string;
  bodyPart: string;
  complaint: string;
}

export interface RefreshReferenceCacheResult {
  combosProcessed: number;
  radiopaediaStored: number;
  webmdStored: number;
  errors: string[];
}

const DEFAULT_COMBOS: ReferenceCacheCombo[] = [
  { cpt: "72148", bodyPart: "lumbar spine", complaint: "uncomplicated low back pain" },
  { cpt: "70553", bodyPart: "brain", complaint: "chronic headache without red flags" },
  { cpt: "73721", bodyPart: "knee", complaint: "degenerative joint disease" },
];

/**
 * Pulls frequent CPT+region pairs from validation events (metadata) for cache warming.
 *
 * @param limit - Max combinations (default 200).
 * @returns Distinct combos for background refresh.
 */
export async function loadTopReferenceCombos(limit = 200): Promise<ReferenceCacheCombo[]> {
  const { data: client, error } = createAdminClient();
  if (error || !client) {
    return DEFAULT_COMBOS;
  }

  const { data: rows } = await client
    .from("ins_validation_events")
    .select("metadata")
    .order("occurred_at", { ascending: false })
    .limit(5000);

  const seen = new Set<string>();
  const combos: ReferenceCacheCombo[] = [];

  for (const row of rows ?? []) {
    const meta = (row as { metadata?: Record<string, unknown> }).metadata ?? {};
    const cpt = String(meta.cpt ?? meta.cptCode ?? "").trim();
    const bodyPart = String(meta.bodyPart ?? meta.region ?? meta.anatomicRegion ?? "").trim();
    const complaint = String(meta.complaint ?? meta.chiefComplaint ?? meta.indication ?? "").trim();
    if (!cpt && !bodyPart && !complaint) {
      continue;
    }
    const key = `${cpt}|${bodyPart}|${complaint}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    combos.push({
      cpt: cpt || "unknown",
      bodyPart: bodyPart || "general",
      complaint: complaint || "imaging appropriateness",
    });
    if (combos.length >= limit) {
      break;
    }
  }

  return combos.length > 0 ? combos : DEFAULT_COMBOS;
}

/**
 * Nightly / cron worker: Radiopaedia + WebMD corpus → pgvector cache (not for CDS hooks).
 *
 * @param options - Optional combo override and max count.
 * @returns Summary counts and non-fatal error messages.
 */
export async function refreshReferenceCache(options?: {
  combos?: ReferenceCacheCombo[];
  maxCombos?: number;
}): Promise<RefreshReferenceCacheResult> {
  const maxCombos = options?.maxCombos ?? 200;
  const combos = (options?.combos ?? (await loadTopReferenceCombos(maxCombos))).slice(0, maxCombos);
  const errors: string[] = [];
  let radiopaediaStored = 0;
  let webmdStored = 0;

  for (const combo of combos) {
    const query = composeReferenceQuery(combo);

    const radio = await searchRadiopaedia(query);
    if (radio.error) {
      errors.push(`radiopaedia:${combo.cpt}:${radio.error.code}`);
      if (radio.error.code === "upstream_rate_limited") {
        break;
      }
    } else {
      for (const hit of radio.data) {
        const doc: ReferenceDoc = {
          source: "radiopaedia",
          title: hit.title,
          excerpt: hit.excerpt,
          url: hit.url,
          tags: hit.tags,
          licensing: hit.licensing,
          fetchedAt: hit.fetchedAt,
        };
        await embedAndStore(doc);
        radiopaediaStored += 1;
      }
    }

    const webmd = await searchWebmdCorpus(query);
    if (webmd.error) {
      errors.push(`webmd:${combo.cpt}:${webmd.error.code}`);
    } else {
      for (const hit of webmd.data) {
        const doc: ReferenceDoc = {
          source: "webmd",
          title: hit.title,
          excerpt: hit.excerpt,
          url: hit.url,
          tags: hit.tags,
          licensing: hit.licensing,
          fetchedAt: hit.fetchedAt,
        };
        await embedAndStore(doc);
        webmdStored += 1;
      }
    }
  }

  return {
    combosProcessed: combos.length,
    radiopaediaStored,
    webmdStored,
    errors,
  };
}
