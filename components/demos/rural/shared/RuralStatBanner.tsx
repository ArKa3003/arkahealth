"use client";

import { Card, CardContent } from "@/components/demos/rural/shared/ui/Card";

export function RuralStatBanner({
  stats,
}: {
  stats: { label: string; value: string; hint?: string }[];
}) {
  return (
    <Card className="border-arka-teal/25 bg-gradient-to-r from-arka-teal/5 to-transparent">
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-arka-text-dark-muted">{s.label}</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-arka-text-dark">{s.value}</p>
            {s.hint ? <p className="mt-0.5 text-xs text-arka-text-dark-muted">{s.hint}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
