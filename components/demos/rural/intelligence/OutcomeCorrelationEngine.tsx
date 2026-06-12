"use client";

import { useState } from "react";

import { correlateDelayToOutcome } from "@/lib/demos/rural/intelligence/outcome-correlation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function OutcomeCorrelationEngine() {
  const [delayMinutes, setDelayMinutes] = useState(75);
  const risk = correlateDelayToOutcome(delayMinutes);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Outcome correlation</CardTitle>
        <Badge variant={risk === "elevated" ? "warning" : "success"}>{risk} risk</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-arka-text-dark-muted">
        <label className="block space-y-2">
          <span className="flex justify-between text-xs font-medium text-arka-slate-600">
            <span>Transfer delay (minutes)</span>
            <span className="tabular-nums">{delayMinutes}</span>
          </span>
          <input
            type="range"
            min={15}
            max={180}
            step={5}
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(Number(e.target.value))}
            className="w-full accent-arka-teal-600"
            aria-label="Transfer delay in minutes"
          />
        </label>
        <p>
          Transfer delay {delayMinutes} minutes vs composite outcomes — illustrative association (demo).
        </p>
      </CardContent>
    </Card>
  );
}
