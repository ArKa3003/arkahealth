"use client";

import { peerReviewRate, turnaroundPercentile } from "@/lib/demos/rural/tele/quality-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function QualityAssuranceDashboard() {
  const tat = turnaroundPercentile(42);
  const peer = peerReviewRate(1200);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality assurance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-arka-text-dark-muted">
        <p>
          Turnaround benchmark (42 min): <span className="font-medium text-arka-text-dark">{tat}th percentile</span>{" "}
          (demo)
        </p>
        <p>
          Suggested peer-review cases this month:{" "}
          <span className="font-medium text-arka-text-dark">{peer}</span>
        </p>
      </CardContent>
    </Card>
  );
}
