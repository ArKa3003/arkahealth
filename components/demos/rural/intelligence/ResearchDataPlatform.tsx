"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function ResearchDataPlatform() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research data platform</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Federated cohort builder for rural imaging outcomes with IRB-ready export stubs (demo).</p>
      </CardContent>
    </Card>
  );
}
