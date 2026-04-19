"use client";

import { generatePreliminaryRead } from "@/lib/demos/rural/ai/preliminary-read";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function AIPreliminaryRead() {
  const text = generatePreliminaryRead("CT", "No acute hemorrhage detected on non-contrast series");
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI preliminary read</CardTitle>
      </CardHeader>
      <CardContent className="rounded-lg bg-arka-bg-medium/40 p-3 font-mono text-xs text-arka-text-dark-muted">
        {text}
      </CardContent>
    </Card>
  );
}
