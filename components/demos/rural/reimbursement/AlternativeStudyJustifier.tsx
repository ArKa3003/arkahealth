"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

const SCENARIOS = [
  {
    id: "mri-wait",
    label: "MRI unavailable within 72h",
    unavailable: "MRI",
    alternative: "CT lumbar + targeted ultrasound",
  },
  {
    id: "pet-transfer",
    label: "PET-CT requires transfer",
    unavailable: "PET-CT",
    alternative: "CT chest/abdomen/pelvis with contrast",
  },
] as const;

export function AlternativeStudyJustifier() {
  const [scenarioId, setScenarioId] = useState<(typeof SCENARIOS)[number]["id"]>("mri-wait");

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  const justification = useMemo(
    () =>
      `At this rural site, ${scenario.unavailable} is not available within a clinically acceptable window. ` +
      `Per resource-adjusted appropriateness, ${scenario.alternative} is proposed as the highest-yield local pathway ` +
      `consistent with ACR-aligned conservative management, with documented follow-up if symptoms persist.`,
    [scenario],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Alternative study justifier</CardTitle>
        <Badge variant="demo">Demo</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-arka-text-dark-muted">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-arka-slate-600">Constraint scenario</span>
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value as (typeof SCENARIOS)[number]["id"])}
            className="w-full rounded-radius-md border border-border-strong bg-surface px-3 py-2 text-arka-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-arka-light bg-arka-bg-alt px-3 py-3 text-arka-text-dark">
          <p className="text-xs font-medium uppercase tracking-wide text-arka-slate-600">
            Draft justification
          </p>
          <p className="mt-2 leading-relaxed">{justification}</p>
        </div>
      </CardContent>
    </Card>
  );
}
