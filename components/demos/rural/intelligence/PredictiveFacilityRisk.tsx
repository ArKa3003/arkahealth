"use client";

import { predictFacilityRisk } from "@/lib/demos/rural/intelligence/facility-risk-model";
import { facilityHasMri, radiologistFteEstimate } from "@/lib/demos/rural/facility-profiles";
import { useSelectedFacility } from "@/lib/demos/rural/rural-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

function riskBadgeVariant(band: "green" | "amber" | "red"): "success" | "warning" | "danger" {
  if (band === "green") return "success";
  if (band === "amber") return "warning";
  return "danger";
}

export function PredictiveFacilityRisk() {
  const facility = useSelectedFacility();
  const model = predictFacilityRisk({
    staffingFTE: radiologistFteEstimate(facility),
    modalityGaps: facilityHasMri(facility) ? 0 : 1,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Predictive facility risk</CardTitle>
        <Badge variant={riskBadgeVariant(model.band)}>
          {model.band.toUpperCase()} · {model.score}
        </Badge>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Demo model using staffing FTE and modality gaps for {facility.name}.</p>
      </CardContent>
    </Card>
  );
}
