"use client";

import { AI_ALGORITHMS } from "@/lib/demos/rural/ai/marketplace-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function RuralPriorityAISelector() {
  const high = AI_ALGORITHMS.filter((a) => a.ruralValueScore >= 8);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rural priority selector</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <ul className="list-inside list-disc space-y-1">
          {high.map((a) => (
            <li key={a.id}>{a.name}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
