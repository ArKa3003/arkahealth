"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function POCUSTeleWorkflow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>POCUS tele workflow</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Package stills + loop to tele-sonography read pool with escalation triggers (demo).</p>
      </CardContent>
    </Card>
  );
}
