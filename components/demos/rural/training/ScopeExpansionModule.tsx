"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Progress } from "@/components/demos/rural/shared/ui/Progress";

export function ScopeExpansionModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scope expansion module</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-arka-text-dark-muted">Progress toward expanded bedside ultrasound privileges (demo).</p>
        <Progress value={65} />
        <p className="text-xs text-arka-text-dark-muted">65% complete</p>
      </CardContent>
    </Card>
  );
}
