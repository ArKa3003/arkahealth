"use client";

import { nextAvailableSlots } from "@/lib/demos/rural/network/mobile-scheduler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function MobileUnitScheduler() {
  const slots = nextAvailableSlots();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile unit scheduler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {slots.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arka-primary/10 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-arka-text-dark">{s.day}</p>
              <p className="text-xs text-arka-text-dark-muted">{s.location}</p>
            </div>
            <Badge variant={s.booked ? "warning" : "success"}>{s.booked ? "Booked" : "Open"}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
