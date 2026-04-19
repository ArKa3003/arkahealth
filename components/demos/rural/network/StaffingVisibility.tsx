"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function StaffingVisibility() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staffing visibility</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Technologist and locum coverage windows across spokes (demo calendar placeholder).</p>
      </CardContent>
    </Card>
  );
}
