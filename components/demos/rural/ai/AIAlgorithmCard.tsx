"use client";

import type { AIAlgorithm } from "@/lib/demos/rural/types";
import { Card, CardContent } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function AIAlgorithmCard({ algorithm }: { algorithm: AIAlgorithm }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="font-medium text-arka-text-dark">{algorithm.name}</p>
        <p className="text-xs text-arka-text-dark-muted">{algorithm.vendor}</p>
        <div className="flex flex-wrap gap-2">
          {algorithm.supportedModalities.map((m) => (
            <Badge key={m} variant="muted">
              {m}
            </Badge>
          ))}
          <Badge variant={algorithm.ruralValueScore >= 8 ? "success" : "warning"}>Rural value {algorithm.ruralValueScore}/10</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
