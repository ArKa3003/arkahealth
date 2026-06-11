"use client";

import * as React from "react";
import { Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { estimateNetRevenue } from "@/lib/demos/rural/reimbursement/revenue-analytics";

const PAYER_OPTIONS = [
  { id: "medicare", label: "Medicare", baseRate: 98 },
  { id: "medicaid", label: "Medicaid", baseRate: 62 },
  { id: "commercial", label: "Commercial", baseRate: 145 },
] as const;

/**
 * Interactive net-revenue calculator for rural imaging studies (demo).
 */
export function RuralRevenueCalculator() {
  const [volume, setVolume] = React.useState(120);
  const [payerId, setPayerId] = React.useState<(typeof PAYER_OPTIONS)[number]["id"]>("medicare");
  const [denialRate, setDenialRate] = React.useState(8);
  const [ruralAdj, setRuralAdj] = React.useState(3);

  const payer = PAYER_OPTIONS.find((p) => p.id === payerId) ?? PAYER_OPTIONS[0];
  const grossCharges = volume * payer.baseRate;
  const netRevenue = estimateNetRevenue(
    grossCharges,
    denialRate / 100,
    ruralAdj / 100,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-h3">
          <Calculator className="h-5 w-5 text-arka-teal-600" aria-hidden />
          Net revenue calculator
        </CardTitle>
        <p className="text-caption text-arka-slate-500">
          Estimate monthly imaging revenue after denials and rural adjustments (illustrative).
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-arka-slate-600">Monthly study volume</span>
            <input
              type="number"
              min={1}
              max={2000}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value) || 0)}
              className="w-full rounded-radius-md border border-border-strong bg-surface px-3 py-2 text-sm tabular-nums text-arka-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-arka-slate-600">Primary payer mix</span>
            <select
              value={payerId}
              onChange={(e) =>
                setPayerId(e.target.value as (typeof PAYER_OPTIONS)[number]["id"])
              }
              className="w-full rounded-radius-md border border-border-strong bg-surface px-3 py-2 text-sm text-arka-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              {PAYER_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} (~${p.baseRate}/study)
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="flex justify-between text-xs font-medium text-arka-slate-600">
              <span>Denial rate</span>
              <span className="tabular-nums">{denialRate}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={25}
              value={denialRate}
              onChange={(e) => setDenialRate(Number(e.target.value))}
              className="w-full accent-arka-teal-600"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="flex justify-between text-xs font-medium text-arka-slate-600">
              <span>Rural adjustment</span>
              <span className="tabular-nums">+{ruralAdj}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={8}
              value={ruralAdj}
              onChange={(e) => setRuralAdj(Number(e.target.value))}
              className="w-full accent-arka-teal-600"
            />
          </label>
        </div>

        <div className="rounded-radius-lg border border-arka-teal-200 bg-arka-teal-50 p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-arka-slate-600">
                Estimated net revenue
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-arka-slate-900">
                ${netRevenue.toLocaleString()}
              </p>
            </div>
            <div className="text-right text-xs text-arka-slate-600">
              <p>
                Gross: <span className="tabular-nums font-medium">${grossCharges.toLocaleString()}</span>
              </p>
              <p className="mt-0.5">After {denialRate}% denials · +{ruralAdj}% rural adj.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
