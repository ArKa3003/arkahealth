"use client";

import { demoNetwork } from "@/lib/demos/rural/network/hub-spoke-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function HubSpokeConfigurator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hub-and-spoke configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {demoNetwork.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arka-primary/10 px-3 py-2 text-sm">
            <span className="font-medium text-arka-text-dark">{n.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="muted">{n.role}</Badge>
              <span className="text-xs text-arka-text-dark-muted">{n.distanceMiles} mi</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
