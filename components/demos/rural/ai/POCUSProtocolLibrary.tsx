"use client";

import { POCUS_PROTOCOLS } from "@/lib/demos/rural/ai/pocus-protocols";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function POCUSProtocolLibrary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>POCUS protocol library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {POCUS_PROTOCOLS.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arka-primary/10 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-arka-text-dark">{p.name}</p>
              <p className="text-xs text-arka-text-dark-muted">{p.indication}</p>
            </div>
            <Badge variant="muted">{p.difficulty}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
