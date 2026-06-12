"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

const DEFAULT_REH_PAYMENT = 285_625.9;

export function REHPaymentOptimizer() {
  const [monthlyReh, setMonthlyReh] = useState(DEFAULT_REH_PAYMENT);
  const [imagingRevenue, setImagingRevenue] = useState(42_000);
  const [highYieldDays, setHighYieldDays] = useState(8);

  const margin = useMemo(() => imagingRevenue - monthlyReh * 0.12, [imagingRevenue, monthlyReh]);
  const breakEvenDays = useMemo(
    () => Math.max(1, Math.ceil((monthlyReh * 0.12) / (imagingRevenue / 30))),
    [monthlyReh, imagingRevenue],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Rural Emergency Hospital (REH) payment optimizer</CardTitle>
        <Badge variant="demo">Demo</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-arka-text-dark-muted">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-arka-slate-600">Monthly REH facility payment ($)</span>
          <input
            type="number"
            min={100000}
            step={1000}
            value={monthlyReh}
            onChange={(e) => setMonthlyReh(Number(e.target.value) || 0)}
            className="w-full rounded-radius-md border border-border-strong bg-surface px-3 py-2 tabular-nums text-arka-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="flex justify-between text-xs font-medium text-arka-slate-600">
            <span>Imaging revenue / month</span>
            <span className="tabular-nums">${imagingRevenue.toLocaleString()}</span>
          </span>
          <input
            type="range"
            min={10000}
            max={120000}
            step={1000}
            value={imagingRevenue}
            onChange={(e) => setImagingRevenue(Number(e.target.value))}
            className="w-full accent-arka-teal-600"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="flex justify-between text-xs font-medium text-arka-slate-600">
            <span>High-yield mobile days / month</span>
            <span className="tabular-nums">{highYieldDays}</span>
          </span>
          <input
            type="range"
            min={2}
            max={20}
            value={highYieldDays}
            onChange={(e) => setHighYieldDays(Number(e.target.value))}
            className="w-full accent-arka-teal-600"
          />
        </label>

        <div className="rounded-lg border border-arka-light bg-arka-bg-alt px-3 py-3">
          <p>
            Estimated imaging margin after REH overhead share:{" "}
            <span className={`font-semibold tabular-nums ${margin >= 0 ? "text-success" : "text-danger"}`}>
              ${Math.round(margin).toLocaleString()}
            </span>
          </p>
          <p className="mt-1 text-xs">
            Break-even imaging days ≈ {breakEvenDays} · scheduling {highYieldDays} high-yield days (demo model)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
