"use client";

import * as React from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MetricDeltaDirection = "up" | "down" | "neutral";

export interface MetricCardProps {
  label: string;
  value: string;
  /** Percent or absolute change vs prior period — display only. */
  delta?: {
    value: string;
    direction: MetricDeltaDirection;
    /** When true, "up" is good (green); when false, "up" is bad (red). */
    positiveIsGood?: boolean;
  };
  /** Up to 7 points for the sparkline (values only). */
  sparkline?: number[];
  loading?: boolean;
  className?: string;
}

function deltaColors(
  direction: MetricDeltaDirection,
  positiveIsGood: boolean,
): string {
  if (direction === "neutral") return "text-arka-slate-500 bg-arka-slate-100";
  const good =
    (direction === "up" && positiveIsGood) || (direction === "down" && !positiveIsGood);
  return good ? "text-success bg-success-bg" : "text-danger bg-danger-bg";
}

function MiniSparkline({ points }: { points: number[] }) {
  const data = points.map((v, i) => ({ i, v }));
  if (data.length === 0) {
    return <div className="h-8 w-full" aria-hidden />;
  }
  return (
    <div className="h-8 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            dot={false}
            strokeWidth={2}
            stroke="#14B8A6"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Standard INS metric tile — label, tabular value, delta chip, and 7-point sparkline.
 */
export function MetricCard({
  label,
  value,
  delta,
  sparkline = [],
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1",
          className,
        )}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-20" />
        <Skeleton className="mt-3 h-4 w-16" />
        <Skeleton className="mt-4 h-8 w-full" />
      </div>
    );
  }

  const spark = sparkline.slice(-7);
  while (spark.length < 7 && spark.length > 0) {
    spark.unshift(spark[0] ?? 0);
  }

  return (
    <div
      className={cn(
        "rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2",
        className,
      )}
    >
      <p className="text-caption font-medium text-arka-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-arka-slate-900">
          {value}
        </p>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
              deltaColors(delta.direction, delta.positiveIsGood ?? true),
            )}
          >
            {delta.direction === "up" ? (
              <ArrowUp className="h-3 w-3" aria-hidden />
            ) : delta.direction === "down" ? (
              <ArrowDown className="h-3 w-3" aria-hidden />
            ) : null}
            {delta.value}
          </span>
        ) : null}
      </div>
      {spark.length > 0 ? (
        <div className="mt-3">
          <MiniSparkline points={spark} />
        </div>
      ) : null}
    </div>
  );
}
