"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function REHPaymentOptimizer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rural Emergency Hospital (REH) payment optimizer</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Align high-yield imaging schedules with REH payment mechanics (conceptual demo).</p>
      </CardContent>
    </Card>
  );
}
