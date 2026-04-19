"use client";

import { detectApplicableExemptions } from "@/lib/demos/rural/reimbursement/exemption-db";
import { useSelectedFacility } from "@/lib/demos/rural/rural-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function RuralExemptionDetector() {
  const facility = useSelectedFacility();
  const applicable = detectApplicableExemptions(facility.designation);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rural exemption detector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {applicable.length === 0 ? (
          <p className="text-sm text-arka-text-dark-muted">No matching payer exemptions for this facility&apos;s designations.</p>
        ) : (
          applicable.map((r) => (
            <div key={r.id} className="rounded-lg border border-arka-primary/10 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-arka-text-dark">{r.payerName}</p>
                <Badge variant={r.autoDetectable ? "success" : "muted"}>{r.autoDetectable ? "Auto-detectable" : "Review"}</Badge>
              </div>
              <p className="mt-1 text-xs text-arka-text-dark-muted">{r.exemptionType.replace(/-/g, " ")}</p>
              <p className="mt-1 text-arka-text-dark-muted">{r.description}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
