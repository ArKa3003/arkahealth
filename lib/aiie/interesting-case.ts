import type { AIIEOrder, AIIERedFlags, AIIESex } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import { buildDemoRarityIndex } from "@/lib/aiie/rarity-demo-index";
import { createAdminClient } from "@/lib/supabase/admin";

/** Marginal rarity dimension keys used in the weighted score. */
export type RarityDimension = "icd10_combo" | "cpt_combo" | "age_sex_region" | "redflag_combo";

/** Driver row explaining which dimension pushed the case into the tail. */
export type RarityDriver = {
  dimension: RarityDimension;
  contribution: number;
  examples?: string[];
};

/** Output of the interesting-case anomaly detector. */
export type RarityAssessment = {
  rarityScore: number;
  percentile: number;
  drivers: RarityDriver[];
  interesting: boolean;
  reasoning: string;
  /** Total validation events in the 365-day rarity corpus when known. */
  corpusTotal?: number;
};

/** Optional demographics for age/sex/region marginal keys (never stored as PHI). */
export type RarityDemographics = {
  ageYears: number;
  sex: AIIESex;
  regionBucket?: string;
};

type RarityIndexRow = {
  icd10_combo: string;
  cpt_combo: string;
  age_bucket: string;
  sex: string;
  region_bucket: string;
  redflag_combo: string;
  occurrences: number;
};

type RarityKeys = {
  icd10_combo: string;
  cpt_combo: string;
  age_sex_region: string;
  redflag_combo: string;
  age_bucket: string;
  sex: string;
  region_bucket: string;
};

const ALPHA = 0.35;
const BETA = 0.3;
const GAMMA = 0.2;
const DELTA = 0.15;
const INTERESTING_PERCENTILE = 0.9;
const LAPLACE = 1;

type MarginalMaps = {
  icd10: Map<string, number>;
  cpt: Map<string, number>;
  ageSexRegion: Map<string, number>;
  redflag: Map<string, number>;
  total: number;
};

/**
 * Maps age in years to a coarse bucket for frequency tables.
 *
 * @param ageYears - Patient age in years.
 */
export function ageBucketFromYears(ageYears: number): string {
  if (!Number.isFinite(ageYears) || ageYears < 0) {
    return "unknown";
  }
  if (ageYears < 18) {
    return "0-17";
  }
  if (ageYears < 40) {
    return "18-39";
  }
  if (ageYears < 65) {
    return "40-64";
  }
  return "65+";
}

/**
 * Builds a stable ICD-10 combination key from snapshot coding context.
 *
 * @param snapshot - Normalized patient record snapshot.
 */
export function buildIcd10Combo(snapshot: PatientRecordSnapshot): string {
  const codes: string[] = [];
  if (snapshot.codingContext.admissionIcd10) {
    codes.push(snapshot.codingContext.admissionIcd10);
  }
  codes.push(...(snapshot.codingContext.activeIcd10 ?? []));
  for (const p of snapshot.problems) {
    if (p.icd10) {
      codes.push(p.icd10);
    }
  }
  const unique = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].sort();
  return unique.length > 0 ? unique.join("+") : "none";
}

/**
 * Builds a CPT combination key from the order and snapshot procedure codes.
 *
 * @param snapshot - Normalized patient record snapshot.
 * @param order - Proposed imaging order.
 */
export function buildCptCombo(snapshot: PatientRecordSnapshot, order: AIIEOrder): string {
  const codes: string[] = [];
  if (order.cpt?.trim()) {
    codes.push(order.cpt.trim());
  }
  codes.push(...(snapshot.codingContext.activeCpt ?? []));
  for (const r of snapshot.priorReports) {
    if (r.procedureCode?.trim()) {
      codes.push(r.procedureCode.trim());
    }
  }
  const unique = [...new Set(codes.map((c) => c.trim()).filter(Boolean))].sort();
  return unique.length > 0 ? unique.join("+") : "none";
}

/**
 * Builds age × sex × region bucket key for demographic rarity.
 *
 * @param demographics - Optional structured demographics; defaults when absent.
 */
export function buildAgeSexRegionKey(demographics?: RarityDemographics): {
  age_bucket: string;
  sex: string;
  region_bucket: string;
  age_sex_region: string;
} {
  const age_bucket =
    demographics && Number.isFinite(demographics.ageYears) ?
      ageBucketFromYears(demographics.ageYears)
    : "unknown";
  const sex = demographics?.sex ?? "unknown";
  const region_bucket = demographics?.regionBucket?.trim() || "unspecified";
  return {
    age_bucket,
    sex,
    region_bucket,
    age_sex_region: `${age_bucket}|${sex}|${region_bucket}`,
  };
}

/**
 * Builds a red-flag combination key from structured red-flag booleans.
 *
 * @param redFlags - AIIE red-flag set when available at scoring time.
 */
export function buildRedFlagCombo(redFlags?: AIIERedFlags): string {
  if (!redFlags) {
    return "none";
  }
  const active: string[] = [];
  for (const [key, value] of Object.entries(redFlags)) {
    if (value === true) {
      active.push(key);
    }
  }
  active.sort();
  return active.length > 0 ? active.join("+") : "none";
}

/**
 * Dimension payload stored on `ins_validation_events` (no PHI).
 *
 * @param snapshot - Record snapshot used for coding keys.
 * @param order - Proposed order.
 * @param demographics - Optional age/sex/region for marginal keys.
 * @param redFlags - Optional red flags for marginal keys.
 */
export function buildRarityEventDimensions(
  snapshot: PatientRecordSnapshot,
  order: AIIEOrder,
  demographics?: RarityDemographics,
  redFlags?: AIIERedFlags,
): {
  icd10_combo: string;
  cpt_combo: string;
  age_bucket: string;
  sex: string;
  region_bucket: string;
  redflag_combo: string;
} {
  const icd10_combo = buildIcd10Combo(snapshot);
  const cpt_combo = buildCptCombo(snapshot, order);
  const { age_bucket, sex, region_bucket } = buildAgeSexRegionKey(demographics);
  const redflag_combo = buildRedFlagCombo(redFlags);
  return { icd10_combo, cpt_combo, age_bucket, sex, region_bucket, redflag_combo };
}

/**
 * Strips identifiers and contact fields from a snapshot before teaching-queue storage.
 *
 * @param snapshot - Source snapshot (already PHI-scrubbed at ingest).
 */
export function redactSnapshotForTeaching(snapshot: PatientRecordSnapshot): Record<string, unknown> {
  const {
    patientHash: _ph,
    ...rest
  } = snapshot;
  return {
    ...rest,
    patientHash: "[redacted]",
    problems: rest.problems.map((p) => ({
      ...p,
      display: scrubDisplay(p.display),
    })),
    medications: rest.medications.map((m) => ({
      ...m,
      display: scrubDisplay(m.display),
    })),
    allergies: rest.allergies.map((a) => ({
      ...a,
      display: scrubDisplay(a.display),
    })),
    encounters: rest.encounters.map((e) => ({
      ...e,
      reasonDisplay: e.reasonDisplay ? scrubDisplay(e.reasonDisplay) : undefined,
    })),
    priorImaging: rest.priorImaging.map((im) => ({
      ...im,
      description: im.description ? scrubDisplay(im.description) : undefined,
    })),
    priorReports: rest.priorReports.map((r) => ({
      ...r,
      conclusionExcerpt: r.conclusionExcerpt ? scrubDisplay(r.conclusionExcerpt) : undefined,
    })),
    notes: rest.notes.map((n) => ({
      ...n,
      description: n.description ? scrubDisplay(n.description) : undefined,
    })),
  };
}

function scrubDisplay(text: string): string {
  return text
    .replace(/\b(?:MRN|medical record|patient id|dob|date of birth)\s*[:#]?\s*\S+/gi, "[redacted]")
    .trim();
}

function buildRarityKeys(
  snapshot: PatientRecordSnapshot,
  order: AIIEOrder,
  demographics?: RarityDemographics,
  redFlags?: AIIERedFlags,
): RarityKeys {
  const icd10_combo = buildIcd10Combo(snapshot);
  const cpt_combo = buildCptCombo(snapshot, order);
  const { age_bucket, sex, region_bucket, age_sex_region } = buildAgeSexRegionKey(demographics);
  const redflag_combo = buildRedFlagCombo(redFlags);
  return { icd10_combo, cpt_combo, age_sex_region, redflag_combo, age_bucket, sex, region_bucket };
}

/**
 * Negative log-base-2 probability from a count table with Laplace smoothing.
 *
 * @param count - Observed count for the key.
 * @param total - Total observations in the corpus.
 * @param vocabularySize - Distinct keys in the marginal (minimum 1).
 */
export function rRarity(count: number, total: number, vocabularySize: number): number {
  const safeTotal = Math.max(total, 1);
  const vocab = Math.max(vocabularySize, 1);
  const pr = (count + LAPLACE) / (safeTotal + LAPLACE * vocab);
  return -Math.log2(pr);
}

function buildMarginals(rows: RarityIndexRow[]): MarginalMaps {
  const icd10 = new Map<string, number>();
  const cpt = new Map<string, number>();
  const ageSexRegion = new Map<string, number>();
  const redflag = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    const n = row.occurrences;
    total += n;
    icd10.set(row.icd10_combo, (icd10.get(row.icd10_combo) ?? 0) + n);
    cpt.set(row.cpt_combo, (cpt.get(row.cpt_combo) ?? 0) + n);
    const asr = `${row.age_bucket}|${row.sex}|${row.region_bucket}`;
    ageSexRegion.set(asr, (ageSexRegion.get(asr) ?? 0) + n);
    redflag.set(row.redflag_combo, (redflag.get(row.redflag_combo) ?? 0) + n);
  }

  return { icd10, cpt, ageSexRegion, redflag, total };
}

function weightedRarityScore(marginals: MarginalMaps, keys: RarityKeys): number {
  const rIcd = rRarity(marginals.icd10.get(keys.icd10_combo) ?? 0, marginals.total, marginals.icd10.size);
  const rCpt = rRarity(marginals.cpt.get(keys.cpt_combo) ?? 0, marginals.total, marginals.cpt.size);
  const rAsr = rRarity(
    marginals.ageSexRegion.get(keys.age_sex_region) ?? 0,
    marginals.total,
    marginals.ageSexRegion.size,
  );
  const rRf = rRarity(marginals.redflag.get(keys.redflag_combo) ?? 0, marginals.total, marginals.redflag.size);
  return ALPHA * rIcd + BETA * rCpt + GAMMA * rAsr + DELTA * rRf;
}

async function loadRarityIndexRows(): Promise<{ rows: RarityIndexRow[]; error: string | null }> {
  const { data: supabase, error: clientError } = createAdminClient();
  if (clientError || !supabase) {
    return { rows: [], error: clientError?.message ?? "Supabase admin client unavailable" };
  }

  const { data, error } = await supabase.from("ins_rarity_index").select(
    "icd10_combo, cpt_combo, age_bucket, sex, region_bucket, redflag_combo, occurrences",
  );

  if (error) {
    return { rows: [], error: error.message };
  }

  const rows: RarityIndexRow[] = (data ?? []).map((r) => ({
    icd10_combo: String(r.icd10_combo),
    cpt_combo: String(r.cpt_combo),
    age_bucket: String(r.age_bucket),
    sex: String(r.sex),
    region_bucket: String(r.region_bucket),
    redflag_combo: String(r.redflag_combo),
    occurrences: Number(r.occurrences) || 0,
  }));

  return { rows, error: null };
}

/**
 * Computes weighted rarity from an in-memory index (used by tests and offline fallbacks).
 *
 * @param rows - Materialized rarity index rows.
 * @param keys - Dimension keys for the current case.
 * @param redflagCounts - Optional separate red-flag marginal counts keyed by combo string.
 */
export function assessRarityFromIndex(rows: RarityIndexRow[], keys: RarityKeys): RarityAssessment {
  const marginals = buildMarginals(rows);

  const icdCount = marginals.icd10.get(keys.icd10_combo) ?? 0;
  const cptCount = marginals.cpt.get(keys.cpt_combo) ?? 0;
  const asrCount = marginals.ageSexRegion.get(keys.age_sex_region) ?? 0;
  const rfCount = marginals.redflag.get(keys.redflag_combo) ?? 0;

  const rIcd = rRarity(icdCount, marginals.total, marginals.icd10.size);
  const rCpt = rRarity(cptCount, marginals.total, marginals.cpt.size);
  const rAsr = rRarity(asrCount, marginals.total, marginals.ageSexRegion.size);
  const rRf = rRarity(rfCount, marginals.total, Math.max(marginals.redflag.size, 1));

  const rarityScore = ALPHA * rIcd + BETA * rCpt + GAMMA * rAsr + DELTA * rRf;

  const jointScores: number[] = rows.map((row) =>
    weightedRarityScore(marginals, {
      icd10_combo: row.icd10_combo,
      cpt_combo: row.cpt_combo,
      age_sex_region: `${row.age_bucket}|${row.sex}|${row.region_bucket}`,
      redflag_combo: row.redflag_combo,
      age_bucket: row.age_bucket,
      sex: row.sex,
      region_bucket: row.region_bucket,
    }),
  );

  const sorted = [...jointScores, rarityScore].sort((a, b) => a - b);
  const rank = sorted.findIndex((s) => s >= rarityScore - 1e-9);
  const percentile = sorted.length <= 1 ? 0.5 : rank / (sorted.length - 1);

  const drivers: RarityDriver[] = (
    [
      {
        dimension: "icd10_combo" as const,
        contribution: ALPHA * rIcd,
        examples: keys.icd10_combo.split("+").filter((c) => c !== "none"),
      },
      {
        dimension: "cpt_combo" as const,
        contribution: BETA * rCpt,
        examples: keys.cpt_combo.split("+").filter((c) => c !== "none"),
      },
      {
        dimension: "age_sex_region" as const,
        contribution: GAMMA * rAsr,
        examples: [keys.age_sex_region],
      },
      {
        dimension: "redflag_combo" as const,
        contribution: DELTA * rRf,
        examples: keys.redflag_combo === "none" ? [] : keys.redflag_combo.split("+"),
      },
    ] satisfies RarityDriver[]
  ).sort((a, b) => b.contribution - a.contribution);

  const interesting = percentile >= INTERESTING_PERCENTILE;
  const totalOrders = marginals.total;
  const reasoning = interesting
    ? `Rare clinical and imaging combination (top ${Math.round((1 - percentile) * 100)}% tail; score ${rarityScore.toFixed(2)} across ${totalOrders.toLocaleString()} indexed orders).`
    : `Combination within typical volume for the last 365 days (percentile ${(percentile * 100).toFixed(0)}; score ${rarityScore.toFixed(2)}).`;

  return {
    rarityScore: Math.round(rarityScore * 1000) / 1000,
    percentile: Math.round(percentile * 1000) / 1000,
    drivers,
    interesting,
    reasoning,
    corpusTotal: marginals.total,
  };
}

/**
 * Identifies unusually rare ICD/CPT/demographic/red-flag combinations using the
 * rolling `ins_rarity_index` materialized view. Never reads or returns PHI.
 *
 * @param snapshot - De-identified record snapshot.
 * @param order - Proposed imaging order.
 * @param demographics - Optional age/sex/region for demographic marginal.
 * @param redFlags - Optional structured red flags for the red-flag marginal.
 */
export async function computeRarityScore(
  snapshot: PatientRecordSnapshot,
  order: AIIEOrder,
  demographics?: RarityDemographics,
  redFlags?: AIIERedFlags,
): Promise<RarityAssessment> {
  const keys = buildRarityKeys(snapshot, order, demographics, redFlags);
  const loaded = await loadRarityIndexRows();
  const rows = loaded.rows.length > 0 ? loaded.rows : buildDemoRarityIndex();
  const usedDemoFallback = loaded.rows.length === 0;

  const assessment = assessRarityFromIndex(rows, keys);
  if (usedDemoFallback && loaded.error) {
    return {
      ...assessment,
      reasoning: `${assessment.reasoning} (demo rarity corpus; live index: ${loaded.error})`,
    };
  }
  return assessment;
}

/**
 * Plain-language tooltip line for a rarity driver.
 *
 * @param driver - Scoring driver row.
 * @param totalOrders - Corpus size from the rarity index.
 * @param comboLabel - Human label for the dimension combo.
 * @param comboCount - Observed count for this combo in the last 365 days.
 */
export function formatRarityDriverPlainEnglish(
  driver: RarityDriver,
  totalOrders: number,
  comboLabel: string,
  comboCount: number,
): string {
  const dimLabel =
    driver.dimension === "icd10_combo" ? "ICD-10"
    : driver.dimension === "cpt_combo" ? "CPT"
    : driver.dimension === "age_sex_region" ? "Demographics"
    : "Red flags";
  return `Rare ${dimLabel} combination: ${comboLabel} observed ${comboCount} time${comboCount === 1 ? "" : "s"} in 365 days out of ${totalOrders.toLocaleString()} orders.`;
}
