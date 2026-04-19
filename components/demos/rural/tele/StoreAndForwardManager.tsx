"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

const rows = [
  { id: "sf1", study: "Mammography screening", status: "Packaged", destination: "Academic hub" },
  { id: "sf2", study: "DEXA", status: "Queued", destination: "Endocrine read pool" },
];

export function StoreAndForwardManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store-and-forward manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-arka-bg-medium/30 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-arka-text-dark">{r.study}</p>
              <p className="text-xs text-arka-text-dark-muted">{r.destination}</p>
            </div>
            <Badge variant="muted">{r.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
