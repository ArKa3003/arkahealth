"use client";

import { estimateNetRevenue } from "@/lib/demos/rural/reimbursement/revenue-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function RevenueCycleIntelligence() {
  const net = estimateNetRevenue(1_200_000, 0.08, 0.03);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue cycle intelligence</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>
          Estimated net (demo): <span className="font-semibold text-arka-text-dark">${net.toLocaleString()}</span> after
          denial rate and rural adj.
        </p>
      </CardContent>
    </Card>
  );
}
