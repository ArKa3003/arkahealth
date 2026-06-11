"use client";

import * as React from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

import type { ObservabilitySnapshot, TimeSeriesPoint } from "@/lib/server/metrics-counters";
import { cn } from "@/lib/utils";

const REFRESH_MS = 30_000;

type SparklineSpec = {
  id: string;
  title: string;
  subtitle: string;
  unit: "per_min" | "percent";
  pick: (s: ObservabilitySnapshot["series"]) => TimeSeriesPoint[];
};

const SPARKLINES: SparklineSpec[] = [
  {
    id: "aiie",
    title: "AIIE scores",
    subtitle: "requests / min",
    unit: "per_min",
    pick: (s) => s.aiieScoresPerMin,
  },
  {
    id: "overuse",
    title: "Overuse cards",
    subtitle: "emitted / min",
    unit: "per_min",
    pick: (s) => s.overuseCardsPerMin,
  },
  {
    id: "stat",
    title: "STAT reclass",
    subtitle: "cards / min",
    unit: "per_min",
    pick: (s) => s.statReclassPerMin,
  },
  {
    id: "sched",
    title: "Scheduling SLA",
    subtitle: "breaches / min",
    unit: "per_min",
    pick: (s) => s.schedulingBreachesPerMin,
  },
  {
    id: "mnai",
    title: "MNAI green",
    subtitle: "tier rate %",
    unit: "percent",
    pick: (s) => s.mnaiGreenRate,
  },
  {
    id: "autofill",
    title: "Autofill",
    subtitle: "acceptance %",
    unit: "percent",
    pick: (s) => s.autofillAcceptanceRate,
  },
];

function latestValue(points: TimeSeriesPoint[], unit: SparklineSpec["unit"]): string {
  const last = points.length > 0 ? points[points.length - 1]?.value ?? 0 : 0;
  if (unit === "percent") {
    return `${last.toFixed(1)}%`;
  }
  return `${last}`;
}

function MiniSparkline({
  points,
  strokeClass,
}: {
  points: TimeSeriesPoint[];
  strokeClass: string;
}) {
  const data = points.map((p) => ({ v: p.value }));
  if (data.length === 0) {
    return <div className="h-10 w-full rounded bg-slate-100" aria-hidden />;
  }
  return (
    <div className="h-10 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            dot={false}
            strokeWidth={2}
            stroke={
              strokeClass === "stroke-arka-teal" ? "#0d9488"
              : strokeClass === "stroke-emerald-600" ? "#059669"
              : "#0284c7"
            }
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Pinned INS platform health card — six sparklines refreshed every 30s.
 */
export function ObservabilityCard({ className }: { className?: string }) {
  const [snapshot, setSnapshot] = React.useState<ObservabilitySnapshot | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const res = await fetch("/api/ins/observability", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "default",
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json && typeof json === "object" && "error" in json &&
          typeof (json as { error: unknown }).error === "string" ?
            (json as { error: string }).error
          : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setSnapshot(json as ObservabilitySnapshot);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load observability");
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const boot = window.setTimeout(() => void load(true), 0);
    const id = window.setInterval(() => {
      void load(true);
    }, REFRESH_MS);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [load]);

  const series = snapshot?.series;

  return (
    <section
      className={cn(
        "arka-card sticky top-2 z-20 rounded-xl border border-arka-teal/25 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-5",
        className,
      )}
      aria-labelledby="ins-observability-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-arka-teal" aria-hidden />
          <div>
            <h2
              id="ins-observability-heading"
              className="text-sm font-semibold text-arka-text-dark sm:text-base"
            >
              Platform observability
            </h2>
            <p className="text-xs text-arka-text-dark-muted">
              Live counters — {snapshot?.windowMinutes ?? 60}m window
              {snapshot?.cachedAt ?
                ` · cached ${new Date(snapshot.cachedAt).toLocaleTimeString()}`
              : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          disabled={refreshing}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-arka-light px-2.5 py-1.5 text-xs font-medium text-arka-text-dark-muted transition hover:border-arka-teal/40 hover:text-arka-teal disabled:opacity-50"
          aria-label="Refresh observability metrics"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden />
          Refresh
        </button>
      </div>

      {error ?
        <p className="mb-3 text-sm text-amber-800" role="status">
          {error}
        </p>
      : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SPARKLINES.map((spec, idx) => {
          const points = series ? spec.pick(series) : [];
          const stroke =
            idx % 3 === 0 ? "stroke-arka-teal"
            : idx % 3 === 1 ? "stroke-emerald-600"
            : "stroke-sky-600";
          return (
            <div
              key={spec.id}
              className="rounded-lg border border-arka-light/80 bg-slate-50/80 px-2.5 py-2"
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] font-medium text-arka-text-dark leading-tight">
                  {spec.title}
                </span>
                <span className="text-xs font-semibold tabular-nums text-arka-teal-600">
                  {latestValue(points, spec.unit)}
                </span>
              </div>
              <p className="mb-1 text-[10px] text-arka-text-dark-muted">{spec.subtitle}</p>
              <MiniSparkline points={points} strokeClass={stroke} />
            </div>
          );
        })}
      </div>

    </section>
  );
}
