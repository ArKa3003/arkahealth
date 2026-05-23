/**
 * Prometheus-style counters backed by `ins_counters` (no PHI in labels).
 */

import { createAdminClient } from "@/lib/supabase/admin";

/** One minute bucket for sparkline rendering. */
export interface TimeSeriesPoint {
  /** ISO-8601 minute bucket start (UTC). */
  ts: string;
  /** Event count in the bucket, or rate percent (0–100) for derived series. */
  value: number;
}

/** Snapshot returned by the observability API (cached server-side). */
export interface ObservabilitySnapshot {
  windowMinutes: number;
  cachedAt: string;
  series: {
    aiieScoresPerMin: TimeSeriesPoint[];
    overuseCardsPerMin: TimeSeriesPoint[];
    statReclassPerMin: TimeSeriesPoint[];
    schedulingBreachesPerMin: TimeSeriesPoint[];
    mnaiGreenRate: TimeSeriesPoint[];
    autofillAcceptanceRate: TimeSeriesPoint[];
  };
}

const DEFAULT_WINDOW_MINUTES = 60;
const CACHE_TTL_MS = 25_000;

/** Allowed label keys (no patient identifiers). */
const SAFE_LABEL_KEYS = new Set([
  "modality",
  "rule_id",
  "tier",
  "source",
  "status",
]);

const PHI_LABEL_KEY = /patient|mrn|name|dob|ssn|email|phone|address|hash/i;
const PHI_VALUE = /@|\b\d{3}-\d{2}-\d{4}\b|^[A-Za-z]+,\s*[A-Za-z]+/;

let snapshotCache: { at: number; body: ObservabilitySnapshot } | null = null;

/**
 * Sanitizes counter labels — drops unsafe keys/values; never throws.
 *
 * @param labels - Optional Prometheus-style labels.
 */
export function sanitizeCounterLabels(
  labels?: Record<string, string>,
): Record<string, string> {
  if (!labels) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(labels)) {
    const k = key.trim();
    const v = raw.trim();
    if (!k || !v || k.length > 64 || v.length > 128) {
      continue;
    }
    if (!SAFE_LABEL_KEYS.has(k) || PHI_LABEL_KEY.test(k) || PHI_VALUE.test(v)) {
      continue;
    }
    if (!/^[a-z0-9_.-]+$/i.test(v)) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

/**
 * Records one counter increment (append-only row). Fails silently when Supabase is unset.
 *
 * @param counter - Counter name (e.g. `aiie_score_requests`).
 * @param labels - Optional non-PHI labels (`modality`, `rule_id`, …).
 */
export async function bump(
  counter: string,
  labels?: Record<string, string>,
): Promise<void> {
  const name = counter.trim();
  if (!name || name.length > 128) {
    return;
  }

  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return;
  }

  const safeLabels = sanitizeCounterLabels(labels);
  const { error: insertErr } = await supabase.from("ins_counters").insert({
    counter_name: name,
    labels: safeLabels,
  });

  if (insertErr) {
    console.warn("[ins_counters]", insertErr.message);
  }
}

type CounterRow = { recorded_at: string };

/**
 * Per-minute event counts for a counter (all label combinations summed).
 *
 * @param counter - Counter name.
 * @param windowMinutes - Lookback window in minutes.
 */
export async function readTimeSeries(
  counter: string,
  windowMinutes: number,
): Promise<TimeSeriesPoint[]> {
  const window = Math.min(Math.max(Math.floor(windowMinutes), 1), 24 * 60);
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return fillMinuteBuckets([], window);
  }

  const since = new Date(Date.now() - window * 60_000).toISOString();
  const { data, error: qErr } = await supabase
    .from("ins_counters")
    .select("recorded_at")
    .eq("counter_name", counter.trim())
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  if (qErr || !data) {
    return fillMinuteBuckets([], window);
  }

  const buckets = new Map<string, number>();
  for (const row of data as CounterRow[]) {
    const bucket = floorToMinuteIso(row.recorded_at);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return fillMinuteBuckets(
    [...buckets.entries()].map(([ts, value]) => ({ ts, value })),
    window,
  );
}

/**
 * Per-minute rate (0–100) from numerator / denominator counters.
 *
 * @param numeratorCounter - Events counted in the numerator.
 * @param denominatorCounter - Events counted in the denominator.
 * @param windowMinutes - Lookback window in minutes.
 */
export async function readRateTimeSeries(
  numeratorCounter: string,
  denominatorCounter: string,
  windowMinutes: number,
): Promise<TimeSeriesPoint[]> {
  const [num, den] = await Promise.all([
    readTimeSeries(numeratorCounter, windowMinutes),
    readTimeSeries(denominatorCounter, windowMinutes),
  ]);
  return num.map((n, i) => {
    const d = den[i]?.value ?? 0;
    const rate = d > 0 ? Math.round((n.value / d) * 1000) / 10 : 0;
    return { ts: n.ts, value: rate };
  });
}

function floorToMinuteIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

function fillMinuteBuckets(
  sparse: TimeSeriesPoint[],
  windowMinutes: number,
): TimeSeriesPoint[] {
  const byTs = new Map(sparse.map((p) => [p.ts, p.value]));
  const end = new Date();
  end.setUTCSeconds(0, 0);
  const points: TimeSeriesPoint[] = [];
  for (let i = windowMinutes - 1; i >= 0; i -= 1) {
    const bucket = new Date(end.getTime() - i * 60_000);
    bucket.setUTCSeconds(0, 0);
    const ts = bucket.toISOString();
    points.push({ ts, value: byTs.get(ts) ?? 0 });
  }
  return points;
}

/**
 * Builds demo sparkline data when Supabase is unavailable (no PHI).
 *
 * @param windowMinutes - Number of minute buckets.
 */
export function buildOfflineObservabilitySnapshot(
  windowMinutes: number = DEFAULT_WINDOW_MINUTES,
): ObservabilitySnapshot {
  const end = new Date();
  end.setUTCSeconds(0, 0);
  const mkCount = (base: number, variance: number): TimeSeriesPoint[] =>
    Array.from({ length: windowMinutes }, (_, i) => {
      const bucket = new Date(end.getTime() - (windowMinutes - 1 - i) * 60_000);
      bucket.setUTCSeconds(0, 0);
      return {
        ts: bucket.toISOString(),
        value: Math.max(0, Math.round(base + Math.sin(i / 4) * variance)),
      };
    });

  const mkRate = (base: number): TimeSeriesPoint[] =>
    Array.from({ length: windowMinutes }, (_, i) => {
      const bucket = new Date(end.getTime() - (windowMinutes - 1 - i) * 60_000);
      bucket.setUTCSeconds(0, 0);
      return {
        ts: bucket.toISOString(),
        value: Math.min(100, Math.max(0, base + (i % 7) - 3)),
      };
    });

  return {
    windowMinutes,
    cachedAt: new Date().toISOString(),
    series: {
      aiieScoresPerMin: mkCount(4, 2),
      overuseCardsPerMin: mkCount(1, 1),
      statReclassPerMin: mkCount(2, 1),
      schedulingBreachesPerMin: mkCount(0, 1),
      mnaiGreenRate: mkRate(64),
      autofillAcceptanceRate: mkRate(78),
    },
  };
}

/**
 * Aggregates all INS observability sparkline series (cached ~25s for sub-250ms API reads).
 *
 * @param windowMinutes - Lookback window (default 60).
 */
export async function buildObservabilitySnapshot(
  windowMinutes: number = DEFAULT_WINDOW_MINUTES,
): Promise<ObservabilitySnapshot> {
  const now = Date.now();
  if (snapshotCache && now - snapshotCache.at < CACHE_TTL_MS) {
    return snapshotCache.body;
  }

  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    const body = buildOfflineObservabilitySnapshot(windowMinutes);
    snapshotCache = { at: now, body };
    return body;
  }

  const [
    aiieScoresPerMin,
    overuseCardsPerMin,
    statReclassPerMin,
    schedulingBreachesPerMin,
    mnaiGreenRate,
    autofillAcceptanceRate,
  ] = await Promise.all([
    readTimeSeries("aiie_score_requests", windowMinutes),
    readTimeSeries("overuse_card_emitted", windowMinutes),
    readTimeSeries("stat_reclass_card_emitted", windowMinutes),
    readTimeSeries("scheduling_intent_breached", windowMinutes),
    readRateTimeSeries("mnai_tier_green", "mnai_tier_scored", windowMinutes),
    readRateTimeSeries("autofill_field_accepted", "autofill_field_decided", windowMinutes),
  ]);

  const body: ObservabilitySnapshot = {
    windowMinutes,
    cachedAt: new Date().toISOString(),
    series: {
      aiieScoresPerMin,
      overuseCardsPerMin,
      statReclassPerMin,
      schedulingBreachesPerMin,
      mnaiGreenRate,
      autofillAcceptanceRate,
    },
  };

  snapshotCache = { at: now, body };
  return body;
}

/** Clears the in-process observability cache (for tests). */
export function clearObservabilityCache(): void {
  snapshotCache = null;
}
