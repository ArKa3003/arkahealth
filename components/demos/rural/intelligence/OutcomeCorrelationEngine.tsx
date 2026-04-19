"use client";

import { correlateDelayToOutcome } from "@/lib/demos/rural/intelligence/outcome-correlation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function OutcomeCorrelationEngine() {
  const risk = correlateDelayToOutcome(75);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Outcome correlation</CardTitle>
        <Badge variant={risk === "elevated" ? "warning" : "success"}>{risk} risk</Badge>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Transfer delay 75 minutes vs composite outcomes — illustrative association (demo).</p>
      </CardContent>
    </Card>
  );
}
