"use client";

import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
import { ImagingDesertMap } from "@/components/demos/rural/intelligence/ImagingDesertMap";
import { OutcomeCorrelationEngine } from "@/components/demos/rural/intelligence/OutcomeCorrelationEngine";
import { PredictiveFacilityRisk } from "@/components/demos/rural/intelligence/PredictiveFacilityRisk";
import { PopulationHealthAnalytics } from "@/components/demos/rural/intelligence/PopulationHealthAnalytics";
import { ResearchDataPlatform } from "@/components/demos/rural/intelligence/ResearchDataPlatform";

export function RuralIntelligenceDashboard() {
  return (
    <div className="space-y-6">
      <RuralStatBanner
        stats={[
          { label: "Regions tracked", value: "3", hint: "Demo" },
          { label: "Outcome model", value: "v0.1", hint: "Illustrative" },
          { label: "Data freshness", value: "24h", hint: "Synthetic" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <OutcomeCorrelationEngine />
        <PredictiveFacilityRisk />
      </div>
      <ImagingDesertMap />
      <div className="grid gap-6 lg:grid-cols-2">
        <PopulationHealthAnalytics />
        <ResearchDataPlatform />
      </div>
    </div>
  );
}
