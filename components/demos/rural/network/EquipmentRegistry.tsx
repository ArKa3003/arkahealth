"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

const equipment = [
  { id: "e1", name: "CT 64", site: "Lakeside", status: "Online" },
  { id: "e2", name: "Portable XR", site: "Mobile Alpha", status: "Transit" },
];

export function EquipmentRegistry() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment registry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {equipment.map((e) => (
          <div key={e.id} className="flex justify-between gap-2 rounded-lg border border-arka-light bg-arka-bg-alt px-3 py-2 text-arka-text-dark">
            <span className="text-arka-text-dark">{e.name}</span>
            <span className="text-arka-text-dark-muted">
              {e.site} · {e.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
