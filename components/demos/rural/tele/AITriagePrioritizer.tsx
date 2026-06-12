"use client";

import { assignProviderQueue, demoTeleStudies } from "@/lib/demos/rural/tele/routing-engine";
import { getFacilityById } from "@/lib/demos/rural/facility-profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function AITriagePrioritizer() {
  const ordered = assignProviderQueue(demoTeleStudies);
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI triage prioritizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ordered.map((s) => {
          const site = getFacilityById(s.facilityId)?.name ?? s.facilityId;
          const pri = s.aiTriageResult?.priority ?? "routine";
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arka-primary/10 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-arka-text-dark">
                  {s.modality} · {s.bodyPart}
                </p>
                <p className="text-xs text-arka-text-dark-muted">{site}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pri === "critical" ? "danger" : pri === "urgent" ? "warning" : "muted"}>
                  {pri}
                </Badge>
                <span className="text-xs text-arka-text-dark-muted">{s.status}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
