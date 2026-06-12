"use client";

import { useState } from "react";

import type { PopulationMetric } from "@/lib/demos/rural/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

const metrics: PopulationMetric[] = [
  { id: "m1", label: "Screening adherence", value: 62, unit: "%", trend: "up" },
  { id: "m2", label: "Transfer for advanced imaging", value: 18, unit: "/1000", trend: "flat" },
];

function trendBadgeVariant(trend: PopulationMetric["trend"]): "success" | "muted" | "warning" {
  if (trend === "up") return "success";
  if (trend === "down") return "warning";
  return "muted";
}

export function PopulationHealthAnalytics() {
  const [region, setRegion] = useState("all");

  const filtered = metrics.map((m) =>
    region === "delta" && m.id === "m1" ? { ...m, value: 41 } : m,
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Population health analytics</CardTitle>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-radius-md border border-border-strong bg-surface px-2 py-1.5 text-xs text-arka-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
          aria-label="Filter by region"
        >
          <option value="all">All tracked regions</option>
          <option value="delta">Mississippi Delta</option>
        </select>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arka-light bg-arka-bg-alt px-3 py-2 text-sm text-arka-text-dark"
          >
            <span>{m.label}</span>
            <span className="font-medium tabular-nums">
              {m.value}
              {m.unit}
            </span>
            <Badge variant={trendBadgeVariant(m.trend)}>{m.trend}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
