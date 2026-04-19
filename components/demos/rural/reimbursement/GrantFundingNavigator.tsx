"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

const grants = [
  { id: "g1", name: "HRSA rural imaging access", match: "High" },
  { id: "g2", name: "State telehealth bridge", match: "Medium" },
];

export function GrantFundingNavigator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grant funding navigator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {grants.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg border border-arka-primary/10 px-3 py-2 text-sm">
            <span className="text-arka-text-dark">{g.name}</span>
            <Badge variant="muted">{g.match} fit</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
