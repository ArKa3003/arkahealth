"use client";

import type { PopulationMetric } from "@/lib/demos/rural/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

const metrics: PopulationMetric[] = [
  { id: "m1", label: "Screening adherence", value: 62, unit: "%", trend: "up" },
  { id: "m2", label: "Transfer for advanced imaging", value: 18, unit: "/1000", trend: "flat" },
];

export function PopulationHealthAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Population health analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arka-light bg-arka-bg-alt px-3 py-2 text-sm text-arka-text-dark">
            <span className="text-arka-text-dark">{m.label}</span>
            <span className="font-medium text-arka-text-dark">
              {m.value}
              {m.unit}
            </span>
            <Badge variant="muted">{m.trend}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
