"use client";

import { MetricCard } from "@/components/ins/MetricCard";

type RuralStat = {
  label: string;
  value: string;
  hint?: string;
};

/**
 * Row of metric tiles for rural sub-area dashboards — uses shared MetricCard primitive.
 */
export function RuralStatBanner({ stats }: { stats: RuralStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <MetricCard
          key={s.label}
          label={s.label}
          value={s.value}
          delta={
            s.hint
              ? { value: s.hint, direction: "neutral", positiveIsGood: true }
              : undefined
          }
        />
      ))}
    </div>
  );
}
