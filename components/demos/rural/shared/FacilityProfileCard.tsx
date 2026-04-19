"use client";

import type { FacilityProfile } from "@/lib/demos/rural/types";
import { facilityCtSliceCount, facilityHasMri, nearestHubTransferMinutes } from "@/lib/demos/rural/facility-profiles";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function FacilityProfileCard({ facility }: { facility: FacilityProfile }) {
  const mri = facilityHasMri(facility);
  const ctSlices = facilityCtSliceCount(facility);
  const hubEta = nearestHubTransferMinutes(facility);
  const radCount = facility.staffing.radiologists.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{facility.name}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{facility.type.replace(/-/g, " ")}</Badge>
          <Badge variant="muted">{facility.location.state}</Badge>
          <Badge variant="muted">{facility.networkRole}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-arka-text-dark-muted sm:grid-cols-2">
        <p>
          <span className="font-medium text-arka-text-dark">Designations:</span>{" "}
          {facility.designation.length ? facility.designation.join(", ") : "—"}
        </p>
        <p>
          <span className="font-medium text-arka-text-dark">Status:</span> {facility.operationalStatus.replace(/-/g, " ")}
        </p>
        <p>
          <span className="font-medium text-arka-text-dark">MRI:</span> {mri ? "Yes" : "No"}
        </p>
        <p>
          <span className="font-medium text-arka-text-dark">CT:</span> {ctSlices !== null ? `${ctSlices}-slice` : "None"}
        </p>
        <p>
          <span className="font-medium text-arka-text-dark">Ultrasound:</span>{" "}
          {facility.equipment.some((e) => e.modality === "Ultrasound") ? "Yes" : "No"}
        </p>
        <p>
          <span className="font-medium text-arka-text-dark">Hub transfer (est.):</span> {hubEta} min
        </p>
        <p>
          <span className="font-medium text-arka-text-dark">Radiologists (listed):</span> {radCount}
        </p>
      </CardContent>
    </Card>
  );
}
