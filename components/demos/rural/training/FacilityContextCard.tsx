"use client";

import { Building2, MapPin, Radio, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import type { RuralCase } from "@/lib/demos/rural/types";

export function FacilityContextCard({ caseData }: { caseData: RuralCase }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-arka-teal" aria-hidden />
          Facility context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-arka-text-dark-muted">
        <p className="font-medium text-arka-text-dark">{caseData.setting}</p>

        <div>
          <p className="mb-1 flex items-center gap-1.5 font-medium text-arka-text-dark">
            <Radio className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Available on-site
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {caseData.availableEquipment.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 font-medium text-arka-text-dark">
            <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden />
            Not available
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {caseData.unavailableEquipment.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-arka-primary/10 bg-arka-bg-light/80 p-3">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-arka-text-dark">
            <MapPin className="h-3.5 w-3.5 text-arka-teal" aria-hidden />
            Nearest advanced imaging
          </p>
          <p className="text-arka-text-dark">{caseData.nearestAdvancedImaging.facility}</p>
          <p className="mt-1 text-xs">
            ~{caseData.nearestAdvancedImaging.distance} mi ·{" "}
            {caseData.nearestAdvancedImaging.modalities.join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
