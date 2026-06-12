"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

const PAYERS = [
  { id: "medicare", label: "Medicare", rate: 98 },
  { id: "medicaid", label: "Medicaid", rate: 62 },
  { id: "commercial", label: "Commercial", rate: 145 },
] as const;

export function PayerMixOptimizer() {
  const [mix, setMix] = useState({ medicare: 55, medicaid: 25, commercial: 20 });

  const blendedRate = useMemo(() => {
    const total =
      (mix.medicare * PAYERS[0].rate +
        mix.medicaid * PAYERS[1].rate +
        mix.commercial * PAYERS[2].rate) /
      100;
    return Math.round(total);
  }, [mix]);

  const updateMix = (id: keyof typeof mix, value: number) => {
    setMix((current) => ({ ...current, [id]: value }));
  };

  const totalPct = mix.medicare + mix.medicaid + mix.commercial;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Payer mix optimizer</CardTitle>
        <Badge variant="demo">Illustrative</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-arka-text-dark-muted">
        {PAYERS.map((payer) => {
          const key = payer.id as keyof typeof mix;
          return (
            <label key={payer.id} className="block space-y-1.5">
              <span className="flex justify-between text-xs font-medium text-arka-slate-600">
                <span>{payer.label}</span>
                <span className="tabular-nums">{mix[key]}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={mix[key]}
                onChange={(e) => updateMix(key, Number(e.target.value))}
                className="w-full accent-arka-teal-600"
                aria-label={`${payer.label} share`}
              />
            </label>
          );
        })}

        <div className="rounded-lg border border-arka-teal-200 bg-arka-teal-50 px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-arka-slate-600">
            Blended reimbursement
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-arka-slate-900">
            ${blendedRate}/study
          </p>
          <p className="mt-1 text-xs">
            Mix total {totalPct}%
            {totalPct !== 100 ? " — normalize in production" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
