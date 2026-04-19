"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import type { FacilityProfile } from "@/lib/demos/rural/types";
import { getDemoFacilitiesByRole } from "@/lib/demos/rural/facility-profiles";

function avgUtilization(f: FacilityProfile): number {
  if (!f.equipment.length) return 0;
  return Math.round(f.equipment.reduce((a, e) => a + e.utilizationRate, 0) / f.equipment.length);
}

function totalStudiesPerDay(f: FacilityProfile): number {
  return f.equipment.reduce((a, e) => a + e.averageStudiesPerDay, 0);
}

function doseReadyPercent(f: FacilityProfile): number {
  if (!f.equipment.length) return 0;
  const n = f.equipment.filter((e) => e.doseReductionCapable).length;
  return Math.round((100 * n) / f.equipment.length);
}

type SharedQualityDashboardProps = {
  hub?: FacilityProfile;
  spoke?: FacilityProfile;
};

export function SharedQualityDashboard({ hub: hubProp, spoke: spokeProp }: SharedQualityDashboardProps) {
  const hub = hubProp ?? getDemoFacilitiesByRole("hub")[0]!;
  const spoke = spokeProp ?? getDemoFacilitiesByRole("spoke")[0]!;

  const rows = [
    {
      label: "Avg modality utilization",
      hub: `${avgUtilization(hub)}%`,
      spoke: `${avgUtilization(spoke)}%`,
    },
    {
      label: "Estimated daily imaging throughput",
      hub: `${totalStudiesPerDay(hub)} studies`,
      spoke: `${totalStudiesPerDay(spoke)} studies`,
    },
    {
      label: "Dose-reduction capable systems",
      hub: `${doseReadyPercent(hub)}%`,
      spoke: `${doseReadyPercent(spoke)}%`,
    },
    {
      label: "On-site radiologist FTE (proxy)",
      hub: `${hub.staffing.radiologists.length ? "≥1" : "Tele-heavy"}`,
      spoke: `${spoke.staffing.radiologists.length ? "Limited" : "Tele-heavy"}`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared quality standards</CardTitle>
        <p className="mt-1 text-sm text-arka-text-dark-muted">
          Side-by-side view using demo registry data for {hub.name} (hub) vs {spoke.name} (spoke).
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-0">
        <table className="w-full min-w-[320px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-arka-primary/15 text-xs uppercase tracking-wide text-arka-text-dark-muted">
              <th className="py-2 pr-4 font-medium">Metric</th>
              <th className="py-2 pr-4 font-medium text-arka-teal">Hub</th>
              <th className="py-2 font-medium">Spoke</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-arka-primary/10 last:border-0">
                <td className="py-2.5 pr-4 text-arka-text-dark">{row.label}</td>
                <td className="py-2.5 pr-4 text-arka-text-dark">{row.hub}</td>
                <td className="py-2.5 text-arka-text-dark">{row.spoke}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
