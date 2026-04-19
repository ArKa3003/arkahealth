"use client";

import { progressTowardGoal, sumCredits } from "@/lib/demos/rural/training/cme-tracker";
import { RURAL_CASES } from "@/lib/demos/rural/training/rural-cases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Progress } from "@/components/demos/rural/shared/ui/Progress";

const DEFAULT_CME_GOAL_HOURS = 20;

export function CMETracker() {
  const goal = DEFAULT_CME_GOAL_HOURS;
  const completed = sumCredits(RURAL_CASES.map((c) => c.cmeCredits));
  const pct = progressTowardGoal(completed, goal);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CME tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-arka-text-dark-muted">
          Demo credits earned: <span className="font-medium text-arka-text-dark">{completed.toFixed(2)}</span> /{" "}
          {goal} hrs goal
        </p>
        <Progress value={pct} max={100} />
      </CardContent>
    </Card>
  );
}
