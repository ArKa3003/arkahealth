"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function POCUSQualityAssist() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>POCUS quality assist</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Real-time clip grading for probe orientation and lung curtain completeness (demo).</p>
      </CardContent>
    </Card>
  );
}
