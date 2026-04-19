/**
 * Zustand store for ARKA-INS validation / ROI metrics (dashboard).
 */

import { create } from "zustand";

import type { ValidationMetricsApiResponse } from "@/lib/validation/metrics";

export type MetricsTimeRange = "7d" | "30d" | "90d" | "365d";

export interface MetricsFilters {
  timeRange: MetricsTimeRange;
  payerId: string;
  providerId: string;
  /** Matches `ins_providers.specialty` when set. */
  specialty: string;
  /** Imaging modality bucket for CPT heuristic filtering. */
  cptModality: string;
}

interface MetricsState {
  data: ValidationMetricsApiResponse | null;
  error: string | null;
  loading: boolean;
  filters: MetricsFilters;
  lastFetchedAt: number | null;
  setFilters: (partial: Partial<MetricsFilters>) => void;
  fetchMetrics: () => Promise<void>;
  reset: () => void;
}

const defaultFilters: MetricsFilters = {
  timeRange: "30d",
  payerId: "",
  providerId: "",
  specialty: "",
  cptModality: "",
};

/** Query string for `GET /api/ins/validation/metrics` and `GET /api/ins/validation/drilldown` (shared filters). */
export function buildMetricsQueryString(f: MetricsFilters): string {
  const p = new URLSearchParams();
  p.set("timeRange", f.timeRange);
  if (f.payerId.trim() !== "") {
    p.set("payerId", f.payerId.trim());
  }
  if (f.providerId.trim() !== "") {
    p.set("providerId", f.providerId.trim());
  }
  if (f.specialty.trim() !== "") {
    p.set("specialty", f.specialty.trim());
  }
  if (f.cptModality.trim() !== "") {
    p.set("cptModality", f.cptModality.trim());
  }
  return p.toString();
}

/**
 * Fetches ROI metrics from `GET /api/ins/validation/metrics`.
 *
 * @param filters - Query filters.
 * @returns Parsed JSON or throws on non-OK response.
 */
export async function fetchValidationMetrics(
  filters: MetricsFilters,
): Promise<ValidationMetricsApiResponse> {
  const qs = buildMetricsQueryString(filters);
  const res = await fetch(`/api/ins/validation/metrics?${qs}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json && typeof (json as { error: unknown }).error === "string" ?
        (json as { error: string }).error
      : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return json as ValidationMetricsApiResponse;
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  data: null,
  error: null,
  loading: false,
  filters: { ...defaultFilters },
  lastFetchedAt: null,
  setFilters: (partial) => {
    set((s) => ({ filters: { ...s.filters, ...partial } }));
  },
  fetchMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchValidationMetrics(get().filters);
      set({ data, loading: false, lastFetchedAt: Date.now(), error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load metrics";
      set({ loading: false, error: message });
    }
  },
  reset: () => {
    set({
      data: null,
      error: null,
      loading: false,
      filters: { ...defaultFilters },
      lastFetchedAt: null,
    });
  },
}));

/** Administrative burden slice (memo-friendly selector). */
export function selectAdministrativeBurden(
  s: MetricsState,
): ValidationMetricsApiResponse["administrativeBurdenReduction"] | null {
  return s.data?.administrativeBurdenReduction ?? null;
}

/** Cost avoidance slice. */
export function selectCostAvoidance(s: MetricsState): ValidationMetricsApiResponse["costAvoidance"] | null {
  return s.data?.costAvoidance ?? null;
}

/** Payer ROI slice. */
export function selectPayerROI(s: MetricsState): ValidationMetricsApiResponse["payerROI"] | null {
  return s.data?.payerROI ?? null;
}

/** Clinical quality slice. */
export function selectClinicalQuality(s: MetricsState): ValidationMetricsApiResponse["clinicalQuality"] | null {
  return s.data?.clinicalQuality ?? null;
}

/** Charting series (daily + monthly ROI). */
export function selectTimeSeries(
  s: MetricsState,
): ValidationMetricsApiResponse["timeSeries"] | null {
  return s.data?.timeSeries ?? null;
}

/** Report range and active filters from the last response. */
export function selectRangeAndFilters(s: MetricsState): {
  range: ValidationMetricsApiResponse["range"] | null;
  filters: ValidationMetricsApiResponse["filters"];
} {
  return {
    range: s.data?.range ?? null,
    filters: s.data?.filters ?? {},
  };
}
