"use client";

import { MetricCard } from "@/components/ins/MetricCard";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

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
        <div key={s.label} className="relative">
          <MetricCard label={s.label} value={s.value} />
          {s.hint ? (
            <div className="pointer-events-none absolute right-3 top-3">
              <Badge variant="demo">{s.hint}</Badge>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
