/**
 * ARKA-INS validation / ROI metrics helpers for the ROI dashboard.
 * Pure functions — database access lives in the API route.
 */

/** AMA physician PA burden baseline: 13 hours per week (minutes). */
export const AMA_PHYSICIAN_PA_MINUTES_PER_WEEK = 13 * 60;

/** MGMA-style average administrative cost per appeal (USD). */
export const MGMA_APPEAL_COST_USD = 25;

/** Annual productive minutes per FTE (52 weeks × 40 hours). */
export const ANNUAL_MINUTES_PER_FTE = 60 * 2080;

/** CMS-0057-F standard review window (hours). */
export const CMS0057_STANDARD_HOURS = 72;

/** CMS-0057-F expedited review window (hours). */
export const CMS0057_EXPEDITED_HOURS = 24;

/** High patient OOP threshold for financial toxicity proxy (USD). */
export const HIGH_OOP_USD_THRESHOLD = 1000;

/** Modeled USD per avoided inappropriate imaging episode (facility + professional proxy). */
export const INAPPROPRIATE_IMAGING_AVOIDANCE_USD = 850;

/** Modeled fully loaded admin labor rate for time savings (USD per minute). */
export const ADMIN_LABOR_USD_PER_MINUTE = 0.85;

/** AIIE clinical score below which imaging may be inappropriate without mitigation. */
export const LOW_CLINICAL_SCORE_THRESHOLD = 4;

export interface DateRangeBounds {
  /** Inclusive range start (ISO-8601). */
  startIso: string;
  /** Exclusive range end (ISO-8601). */
  endIso: string;
  /** Calendar days in [start, end). */
  days: number;
}

export interface ValidationEventInput {
  event_type: string;
  minutes_saved: number | null;
  amount_usd: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface PaHistoryInput {
  submitted_at: string;
  decision_at: string | null;
  appeal_filed: boolean;
  appeal_overturned: boolean;
  pas_response: Record<string, unknown> | null;
}

export interface BurdenReductionMetrics {
  totalMinutesSaved: number;
  fteEquivalent: number;
  /** Percent of one physician’s AMA weekly PA-minute baseline represented by savings in this period (aggregate may exceed 100%). */
  benchmarkComparisonPercent: number;
}

export interface CostAvoidanceMetrics {
  paDenialsPrevented: number;
  appealCostsAvoided: number;
  oopSavingsRealized: number;
  inappropriateImagingAvoided: number;
}

/** USD components for stacked “cost avoidance” visualization. */
export interface CostAvoidanceStackUsd {
  appealCostsAvoided: number;
  inappropriateImagingAvoidedUsd: number;
  adminLaborAvoidedUsd: number;
}

/** Per-payer ROI row for executive tables. */
export interface PayerRoiRow {
  payerId: string;
  pasProcessed: number;
  autoApprovalRate: number;
  avgDecisionTimeHours: number | null;
  appealOverturnRate: number | null;
  estAnnualSavingsUsd: number;
}

/** Weekly bucket for administrative burden chart (ISO week start, UTC). */
export interface WeeklyMinutesPoint {
  weekStart: string;
  minutesSaved: number;
}

/** Histogram bucket for patient OOP exposure. */
export interface OopHistogramBucket {
  label: string;
  minUsd: number;
  maxUsd: number | null;
  count: number;
}

/** OOP transparency / shoppable impact summary. */
export interface OopTransparencyMetrics {
  cheaperSiteRerouteCount: number;
  totalOopSavingsUsd: number;
  histogram: OopHistogramBucket[];
}

export interface PayerROIMetrics {
  autoApprovalRate: number;
  avgTimeToDecisionHours: number | null;
  cms0057fComplianceRate: number;
  /** ARKA always attaches factor-specific denial rows; fixed at 100 for product positioning. */
  denialSpecificityScore: number;
}

export interface ClinicalQualityMetrics {
  appealOverturnRate: number | null;
  providerSatisfactionProxy: Record<string, number>;
  /** Percent of high-OOP presentations where the patient deferred (0–100). */
  patientFinancialToxicityProxy: number | null;
}

export interface RoiSummaryRow {
  month_start: string;
  total_savings_usd: number | string | null;
  total_minutes_saved: number | string | null;
  pas_avoided_count: number | string | null;
}

export interface DailyTimeSeriesPoint {
  date: string;
  minutesSaved: number;
  savingsUsd: number;
  pasAvoided: number;
  eventsCount: number;
}

/** Daily MNAI green-tier rate from `ins_aiie_audit` (percent 0–100). */
export interface MnaiGreenRatePoint {
  date: string;
  /** Share of scored orders with `mnai_tier = green` that day. */
  rate: number;
  sampleSize: number;
}

export interface MonthlyRoiPoint {
  monthStart: string;
  totalSavingsUsd: number;
  totalMinutesSaved: number;
  pasAvoidedCount: number;
}

/** Full GET /api/ins/validation/metrics response body. */
export interface ValidationMetricsApiResponse {
  range: { startIso: string; endIso: string; days: number };
  filters: { payerId?: string; providerId?: string; specialty?: string; cptModality?: string };
  administrativeBurdenReduction: BurdenReductionMetrics;
  costAvoidance: CostAvoidanceMetrics;
  payerROI: PayerROIMetrics;
  clinicalQuality: ClinicalQualityMetrics;
  timeSeries: {
    daily: DailyTimeSeriesPoint[];
    monthlyRoi: MonthlyRoiPoint[];
    weeklyMinutesLast12: WeeklyMinutesPoint[];
    mnaiGreenRate: MnaiGreenRatePoint[];
  };
  costAvoidanceStackUsd: CostAvoidanceStackUsd;
  payerBreakdown: PayerRoiRow[];
  oopTransparency: OopTransparencyMetrics;
  kpis: {
    totalPaAutoApproved: number;
    totalMinutesSaved: number;
    oopSavingsRealizedUsd: number;
    cms0057fComplianceRate: number;
  };
}

/**
 * Administrative burden reduction from summed minutes and AMA benchmark.
 *
 * @param totalMinutesSaved - Sum of `minutes_saved` in range.
 * @param rangeDays - Number of days in the reporting window.
 * @returns Typed burden metrics.
 */
export function computeBurdenReduction(
  totalMinutesSaved: number,
  rangeDays: number,
): BurdenReductionMetrics {
  const safeDays = Math.max(rangeDays, 1);
  const baselineMinutesForOneFte = AMA_PHYSICIAN_PA_MINUTES_PER_WEEK * (safeDays / 7);
  const fteEquivalent = totalMinutesSaved / ANNUAL_MINUTES_PER_FTE;
  const benchmarkComparisonPercent =
    baselineMinutesForOneFte > 0 ? (totalMinutesSaved / baselineMinutesForOneFte) * 100 : 0;

  return {
    totalMinutesSaved,
    fteEquivalent,
    benchmarkComparisonPercent,
  };
}

function numFromMetadata(meta: Record<string, unknown> | null | undefined, key: string): number | null {
  if (!meta || typeof meta !== "object") {
    return null;
  }
  const v = meta[key];
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Cost-avoidance metrics from validation events.
 *
 * @param events - Validation rows in range.
 * @returns Cost avoidance aggregates.
 */
export function computeCostAvoidance(events: ValidationEventInput[]): CostAvoidanceMetrics {
  let paDenialsPrevented = 0;
  let oopSavingsRealized = 0;
  let inappropriateImagingAvoided = 0;

  for (const e of events) {
    if (e.event_type === "dtr_denial_risk_reduced") {
      paDenialsPrevented += 1;
    }
    if (e.event_type === "oop_savings_realized") {
      oopSavingsRealized += Number(e.amount_usd ?? 0);
    }
    if (e.event_type === "alternative_imaging_avoided") {
      const cs = numFromMetadata(e.metadata ?? null, "clinicalScore");
      if (cs !== null && cs < LOW_CLINICAL_SCORE_THRESHOLD) {
        inappropriateImagingAvoided += 1;
      }
    }
  }

  const appealCostsAvoided = paDenialsPrevented * MGMA_APPEAL_COST_USD;

  return {
    paDenialsPrevented,
    appealCostsAvoided,
    oopSavingsRealized,
    inappropriateImagingAvoided,
  };
}

function hoursBetween(submittedAt: string, decisionAt: string | null): number | null {
  if (!decisionAt) {
    return null;
  }
  const a = Date.parse(submittedAt);
  const b = Date.parse(decisionAt);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return null;
  }
  return (b - a) / (1000 * 60 * 60);
}

function isExpeditedPasResponse(pas: Record<string, unknown> | null): boolean {
  if (!pas || typeof pas !== "object") {
    return false;
  }
  const ext = pas.extension;
  if (Array.isArray(ext)) {
    for (const x of ext) {
      if (x && typeof x === "object" && "url" in x && String((x as { url?: string }).url).includes("expedited")) {
        return Boolean((x as { valueBoolean?: boolean }).valueBoolean);
      }
    }
  }
  if (pas.cmsExpeditedReview === true) {
    return true;
  }
  if (pas.priority === "expedited") {
    return true;
  }
  return false;
}

/**
 * Payer-facing ROI metrics from validation events and PA history.
 *
 * @param paAvoidedGold - Count of `pa_avoided_by_gold_card` events.
 * @param paAvoidedCrd - Count of `pa_avoided_by_crd` events.
 * @param totalPaVolume - Total PA adjudications (e.g. `ins_pa_history` rows in range).
 * @param paRows - PA history rows in range for timing and compliance.
 * @returns Payer ROI metrics.
 */
export function computePayerROI(
  paAvoidedGold: number,
  paAvoidedCrd: number,
  totalPaVolume: number,
  paRows: PaHistoryInput[],
): PayerROIMetrics {
  const autoNum = paAvoidedGold + paAvoidedCrd;
  const autoApprovalRate = totalPaVolume > 0 ? autoNum / totalPaVolume : 0;

  const hoursList: number[] = [];
  let compliant = 0;
  let decided = 0;

  for (const row of paRows) {
    const h = hoursBetween(row.submitted_at, row.decision_at);
    if (h === null) {
      continue;
    }
    decided += 1;
    hoursList.push(h);
    const expedited = isExpeditedPasResponse(row.pas_response);
    const limit = expedited ? CMS0057_EXPEDITED_HOURS : CMS0057_STANDARD_HOURS;
    if (h <= limit) {
      compliant += 1;
    }
  }

  const avgTimeToDecisionHours =
    hoursList.length > 0 ? hoursList.reduce((s, x) => s + x, 0) / hoursList.length : null;

  const cms0057fComplianceRate = decided > 0 ? compliant / decided : 0;

  return {
    autoApprovalRate,
    avgTimeToDecisionHours,
    cms0057fComplianceRate,
    denialSpecificityScore: 100,
  };
}

/**
 * Clinical quality proxies from PA appeals and validation events.
 *
 * @param events - Validation rows (e.g. `provider_override`, `patient_deferred_high_oop`).
 * @param paRows - PA history for appeal rates.
 * @returns Clinical quality metrics.
 */
export function computeClinicalQuality(
  events: ValidationEventInput[],
  paRows: PaHistoryInput[],
): ClinicalQualityMetrics {
  let appealFiled = 0;
  let appealOverturned = 0;
  for (const row of paRows) {
    if (row.appeal_filed) {
      appealFiled += 1;
      if (row.appeal_overturned) {
        appealOverturned += 1;
      }
    }
  }

  const appealOverturnRate =
    appealFiled > 0 ? appealOverturned / appealFiled : null;

  const providerSatisfactionProxy: Record<string, number> = {};
  for (const e of events) {
    if (e.event_type !== "provider_override") {
      continue;
    }
    const meta = e.metadata;
    const rc =
      meta && typeof meta === "object" && "reasonCode" in meta && typeof (meta as { reasonCode?: unknown }).reasonCode === "string" ?
        String((meta as { reasonCode: string }).reasonCode).trim()
      : "";
    const reason = rc !== "" ? rc : "unspecified";
    providerSatisfactionProxy[reason] = (providerSatisfactionProxy[reason] ?? 0) + 1;
  }

  let highOopDeferred = 0;
  let highOopPresented = 0;
  for (const e of events) {
    const est = numFromMetadata(e.metadata ?? null, "estimatedOopUsd");
    if (est === null || est <= HIGH_OOP_USD_THRESHOLD) {
      continue;
    }
    highOopPresented += 1;
    if (e.event_type === "patient_deferred_high_oop") {
      highOopDeferred += 1;
    }
  }

  const patientFinancialToxicityProxy =
    highOopPresented > 0 ? (highOopDeferred / highOopPresented) * 100 : null;

  return {
    appealOverturnRate,
    providerSatisfactionProxy,
    patientFinancialToxicityProxy,
  };
}

/**
 * Sums minutes saved from events (null-safe).
 *
 * @param events - Validation events.
 * @returns Total minutes.
 */
export function sumMinutesSaved(events: ValidationEventInput[]): number {
  let t = 0;
  for (const e of events) {
    t += e.minutes_saved ?? 0;
  }
  return t;
}

/**
 * Aggregates daily time-series points for charting.
 *
 * @param events - Validation events in range.
 * @param range - Bounds used to fill missing days with zeros.
 * @returns One row per calendar day (UTC date).
 */
export function buildDailyTimeSeries(
  events: Array<ValidationEventInput & { occurred_at: string }>,
  range: DateRangeBounds,
): DailyTimeSeriesPoint[] {
  const start = new Date(range.startIso);
  const end = new Date(range.endIso);
  const byDay = new Map<string, DailyTimeSeriesPoint>();

  for (let d = new Date(start); d < end; d = new Date(d.getTime() + 86400000)) {
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, {
      date: key,
      minutesSaved: 0,
      savingsUsd: 0,
      pasAvoided: 0,
      eventsCount: 0,
    });
  }

  for (const e of events) {
    const day = e.occurred_at.slice(0, 10);
    const row = byDay.get(day);
    if (!row) {
      continue;
    }
    row.minutesSaved += e.minutes_saved ?? 0;
    if (e.event_type === "oop_savings_realized" || e.event_type === "appeal_won") {
      row.savingsUsd += Number(e.amount_usd ?? 0);
    }
    if (e.event_type === "pa_avoided_by_gold_card" || e.event_type === "pa_avoided_by_crd") {
      row.pasAvoided += 1;
    }
    row.eventsCount += 1;
  }

  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface AiieAuditRowInput {
  created_at: string;
  mnai_tier: string | null;
  cpt: string | null;
}

/**
 * Daily MNAI green-tier rate for coding / QI dashboards.
 *
 * @param rows - `ins_aiie_audit` rows in range (tier and CPT only).
 * @param range - Bounds used to fill missing days with zero samples.
 * @returns One point per calendar day (UTC).
 */
export function buildMnaiGreenRateTimeSeries(
  rows: AiieAuditRowInput[],
  range: DateRangeBounds,
): MnaiGreenRatePoint[] {
  const start = new Date(range.startIso);
  const end = new Date(range.endIso);
  const byDay = new Map<string, { green: number; total: number }>();

  for (let d = new Date(start); d < end; d = new Date(d.getTime() + 86400000)) {
    byDay.set(d.toISOString().slice(0, 10), { green: 0, total: 0 });
  }

  for (const row of rows) {
    if (!row.mnai_tier) {
      continue;
    }
    const day = row.created_at.slice(0, 10);
    const bucket = byDay.get(day);
    if (!bucket) {
      continue;
    }
    bucket.total += 1;
    if (row.mnai_tier === "green") {
      bucket.green += 1;
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { green, total }]) => ({
      date,
      rate: total > 0 ? (green / total) * 100 : 0,
      sampleSize: total,
    }));
}

/**
 * Normalizes materialized-view rows for JSON output.
 *
 * @param rows - Rows from `mv_ins_roi_summary`.
 * @returns Monthly ROI points.
 */
export function mapRoiSummaryRows(rows: RoiSummaryRow[]): MonthlyRoiPoint[] {
  return rows.map((r) => ({
    monthStart: r.month_start,
    totalSavingsUsd: Number(r.total_savings_usd ?? 0),
    totalMinutesSaved: Number(r.total_minutes_saved ?? 0),
    pasAvoidedCount: Number(r.pas_avoided_count ?? 0),
  }));
}

/**
 * Monthly ROI buckets from raw events (used when payer/provider filters are applied — MV is unfiltered).
 *
 * @param events - Validation events including `occurred_at` and `event_type`.
 * @returns One point per UTC calendar month present in the data.
 */
export function aggregateMonthlyRoiFromEvents(
  events: Array<
    ValidationEventInput & { occurred_at: string; event_type: string }
  >,
): MonthlyRoiPoint[] {
  const map = new Map<
    string,
    { totalSavingsUsd: number; totalMinutesSaved: number; pasAvoidedCount: number }
  >();

  for (const e of events) {
    const d = new Date(e.occurred_at);
    if (!Number.isFinite(d.getTime())) {
      continue;
    }
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`;
    const cur = map.get(key) ?? {
      totalSavingsUsd: 0,
      totalMinutesSaved: 0,
      pasAvoidedCount: 0,
    };
    cur.totalMinutesSaved += e.minutes_saved ?? 0;
    if (e.event_type === "oop_savings_realized" || e.event_type === "appeal_won") {
      cur.totalSavingsUsd += Number(e.amount_usd ?? 0);
    }
    if (e.event_type === "pa_avoided_by_gold_card" || e.event_type === "pa_avoided_by_crd") {
      cur.pasAvoidedCount += 1;
    }
    map.set(key, cur);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthStart, v]) => ({
      monthStart,
      totalSavingsUsd: v.totalSavingsUsd,
      totalMinutesSaved: v.totalMinutesSaved,
      pasAvoidedCount: v.pasAvoidedCount,
    }));
}

/**
 * Maps CPT code to high-level imaging modality for dashboard filters (heuristic, not billing advice).
 *
 * @param cpt - CPT string.
 * @param modality - Selected modality from the ROI dashboard filter.
 * @returns Whether the CPT plausibly matches the modality bucket.
 */
export function cptMatchesImagingModality(cpt: string, modality: string): boolean {
  const d = cpt.replace(/\D/g, "");
  if (d.length < 3) {
    return false;
  }
  const p3 = d.slice(0, 3);
  switch (modality) {
    case "MRI":
      return ["705", "721", "737", "732"].includes(p3);
    case "CT":
      return ["704", "712", "741", "735", "740"].includes(p3);
    case "Ultrasound":
      return d.startsWith("76") || ["767", "768", "769"].includes(p3);
    case "X-ray":
      return ["720", "730", "731"].includes(p3);
    case "PET-CT":
      return ["788", "786"].includes(p3);
    case "Nuclear Medicine":
      return ["780", "781", "782", "783"].includes(p3);
    default:
      return true;
  }
}

function startOfWeekMondayUtc(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - diff);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/**
 * Rolling weekly minutes saved for chart overlay (UTC weeks, Monday start).
 *
 * @param events - Validation events with timestamps.
 * @param endIso - End of reporting window (exclusive in API — use same reference as range).
 * @param weeks - Number of weeks (default 12).
 * @returns One point per week, oldest first.
 */
export function buildWeeklyMinutesLastNWeeks(
  events: Array<ValidationEventInput & { occurred_at: string }>,
  endIso: string,
  weeks = 12,
): WeeklyMinutesPoint[] {
  const endWeekStart = startOfWeekMondayUtc(new Date(endIso));
  const bucketKeys: string[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = new Date(endWeekStart.getTime() - i * 7 * 86400000);
    bucketKeys.push(ws.toISOString());
  }
  const map = new Map<string, number>();
  for (const k of bucketKeys) {
    map.set(k, 0);
  }
  for (const e of events) {
    const ws = startOfWeekMondayUtc(new Date(e.occurred_at));
    const key = ws.toISOString();
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + (e.minutes_saved ?? 0));
    }
  }
  return bucketKeys.map((weekStart) => ({ weekStart, minutesSaved: map.get(weekStart) ?? 0 }));
}

/**
 * USD stacks for reimbursement visualization (appeals + imaging + labor).
 *
 * @param ca - Cost avoidance counts from {@link computeCostAvoidance}.
 * @param totalMinutesSaved - Sum of minutes in window.
 * @returns Three-stack USD series.
 */
export function computeCostAvoidanceStackUsd(
  ca: CostAvoidanceMetrics,
  totalMinutesSaved: number,
): CostAvoidanceStackUsd {
  return {
    appealCostsAvoided: ca.appealCostsAvoided,
    inappropriateImagingAvoidedUsd: ca.inappropriateImagingAvoided * INAPPROPRIATE_IMAGING_AVOIDANCE_USD,
    adminLaborAvoidedUsd: totalMinutesSaved * ADMIN_LABOR_USD_PER_MINUTE,
  };
}

/**
 * Per-payer ROI table metrics.
 *
 * @param paRows - PA adjudications in range.
 * @param eventRows - Validation events in range (with payer_id).
 * @param rangeDays - Days in reporting window.
 * @returns Sortable payer rows.
 */
export function computePayerBreakdown(
  paRows: Array<PaHistoryInput & { payer_id: string }>,
  eventRows: Array<
    ValidationEventInput & {
      payer_id: string | null;
      event_type: string;
      occurred_at: string;
      amount_usd?: number | null;
      minutes_saved?: number | null;
      metadata?: Record<string, unknown> | null;
    }
  >,
  rangeDays: number,
): PayerRoiRow[] {
  const payerIds = new Set<string>();
  for (const p of paRows) {
    payerIds.add(p.payer_id);
  }
  for (const e of eventRows) {
    if (e.payer_id) {
      payerIds.add(e.payer_id);
    }
  }
  const rows: PayerRoiRow[] = [];
  const safeDays = Math.max(rangeDays, 1);

  for (const payerId of [...payerIds].sort()) {
    const pas = paRows.filter((p) => p.payer_id === payerId);
    const pasProcessed = pas.length;
    const autoCount = eventRows.filter(
      (e) =>
        e.payer_id === payerId &&
        (e.event_type === "pa_avoided_by_gold_card" || e.event_type === "pa_avoided_by_crd"),
    ).length;
    const autoApprovalRate = pasProcessed > 0 ? autoCount / pasProcessed : 0;

    const hoursList: number[] = [];
    let appealFiled = 0;
    let appealOverturned = 0;
    for (const row of pas) {
      const h = hoursBetween(row.submitted_at, row.decision_at);
      if (h !== null) {
        hoursList.push(h);
      }
      if (row.appeal_filed) {
        appealFiled += 1;
        if (row.appeal_overturned) {
          appealOverturned += 1;
        }
      }
    }
    const avgDecisionTimeHours =
      hoursList.length > 0 ? hoursList.reduce((a, b) => a + b, 0) / hoursList.length : null;
    const appealOverturnRate = appealFiled > 0 ? appealOverturned / appealFiled : null;

    let payerMinutes = 0;
    let payerOop = 0;
    let payerInapp = 0;
    let payerDenialPrevented = 0;
    for (const e of eventRows) {
      if (e.payer_id !== payerId) {
        continue;
      }
      payerMinutes += e.minutes_saved ?? 0;
      if (e.event_type === "oop_savings_realized") {
        payerOop += Number(e.amount_usd ?? 0);
      }
      if (e.event_type === "alternative_imaging_avoided") {
        const cs = numFromMetadata(e.metadata ?? null, "clinicalScore");
        if (cs !== null && cs < LOW_CLINICAL_SCORE_THRESHOLD) {
          payerInapp += 1;
        }
      }
      if (e.event_type === "dtr_denial_risk_reduced") {
        payerDenialPrevented += 1;
      }
    }
    const periodUsd =
      payerDenialPrevented * MGMA_APPEAL_COST_USD +
      payerInapp * INAPPROPRIATE_IMAGING_AVOIDANCE_USD +
      payerOop +
      payerMinutes * ADMIN_LABOR_USD_PER_MINUTE;
    const estAnnualSavingsUsd = (periodUsd / safeDays) * 365;

    rows.push({
      payerId,
      pasProcessed,
      autoApprovalRate,
      avgDecisionTimeHours,
      appealOverturnRate,
      estAnnualSavingsUsd,
    });
  }

  return rows.sort((a, b) => b.estAnnualSavingsUsd - a.estAnnualSavingsUsd);
}

/**
 * OOP histogram and shoppable / reroute counters from validation events.
 *
 * @param events - Validation events in range.
 * @returns Histogram buckets and reroute totals.
 */
export function computeOopTransparency(events: ValidationEventInput[]): OopTransparencyMetrics {
  let cheaperSiteRerouteCount = 0;
  let totalOopSavingsUsd = 0;
  const buckets: OopHistogramBucket[] = [
    { label: "$0–250", minUsd: 0, maxUsd: 250, count: 0 },
    { label: "$250–500", minUsd: 250, maxUsd: 500, count: 0 },
    { label: "$500–1k", minUsd: 500, maxUsd: 1000, count: 0 },
    { label: "$1k–3k", minUsd: 1000, maxUsd: 3000, count: 0 },
    { label: "$3k+", minUsd: 3000, maxUsd: null, count: 0 },
  ];

  for (const e of events) {
    if (e.event_type === "oop_savings_realized") {
      totalOopSavingsUsd += Number(e.amount_usd ?? 0);
      const meta = e.metadata;
      if (
        meta &&
        typeof meta === "object" &&
        "cheaperSiteReroute" in meta &&
        (meta as { cheaperSiteReroute?: boolean }).cheaperSiteReroute === true
      ) {
        cheaperSiteRerouteCount += 1;
      }
    }
    if (e.event_type === "oop_estimate_presented" || e.event_type === "oop_savings_realized") {
      const est =
        numFromMetadata(e.metadata ?? null, "estimatedOopUsd") ??
        (e.event_type === "oop_savings_realized" ? Number(e.amount_usd ?? 0) : null);
      if (est !== null && Number.isFinite(est)) {
        for (const b of buckets) {
          if (b.maxUsd === null) {
            if (est >= b.minUsd) {
              b.count += 1;
              break;
            }
          } else if (est >= b.minUsd && est < b.maxUsd) {
            b.count += 1;
            break;
          }
        }
      }
    }
  }

  return { cheaperSiteRerouteCount, totalOopSavingsUsd, histogram: buckets };
}
