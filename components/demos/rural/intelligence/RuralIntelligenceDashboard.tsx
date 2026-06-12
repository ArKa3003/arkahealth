"use client";

import { RuralDashboardPanel } from "@/components/demos/rural/shared/RuralDashboardPanel";
import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
import { ImagingDesertMap } from "@/components/demos/rural/intelligence/ImagingDesertMap";
import { OutcomeCorrelationEngine } from "@/components/demos/rural/intelligence/OutcomeCorrelationEngine";
import { PredictiveFacilityRisk } from "@/components/demos/rural/intelligence/PredictiveFacilityRisk";
import { PopulationHealthAnalytics } from "@/components/demos/rural/intelligence/PopulationHealthAnalytics";
import { ResearchDataPlatform } from "@/components/demos/rural/intelligence/ResearchDataPlatform";

export function RuralIntelligenceDashboard() {
  return (
    <div className="space-y-6">
      <RuralDashboardPanel>
        <RuralStatBanner
          stats={[
            { label: "Regions tracked", value: "3", hint: "Demo" },
            { label: "Outcome model", value: "v0.1", hint: "Illustrative" },
            { label: "Data freshness", value: "24h", hint: "Synthetic" },
          ]}
        />
      </RuralDashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuralDashboardPanel delay={0.05}>
          <OutcomeCorrelationEngine />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.1}>
          <PredictiveFacilityRisk />
        </RuralDashboardPanel>
      </div>

      <RuralDashboardPanel delay={0.15}>
        <ImagingDesertMap />
      </RuralDashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuralDashboardPanel delay={0.2}>
          <PopulationHealthAnalytics />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.25}>
          <ResearchDataPlatform />
        </RuralDashboardPanel>
      </div>
    </div>
  );
}
