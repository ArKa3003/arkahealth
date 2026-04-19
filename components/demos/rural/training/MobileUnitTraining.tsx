"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function MobileUnitTraining() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile unit training</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Checklists for generator safety, patient selection in field settings, and handoff to hub radiology.</p>
      </CardContent>
    </Card>
  );
}
