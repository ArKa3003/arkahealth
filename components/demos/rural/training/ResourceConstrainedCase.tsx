"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function ResourceConstrainedCase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource-constrained case</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>
          Simulated 16-slice CT with oral contrast only — walk through appropriateness, radiation tradeoffs, and
          when to escalate to hub MRI.
        </p>
      </CardContent>
    </Card>
  );
}
