"use client";

import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
import { AIMarketplace } from "@/components/demos/rural/ai/AIMarketplace";
import { RuralPriorityAISelector } from "@/components/demos/rural/ai/RuralPriorityAISelector";
import { AIPreliminaryRead } from "@/components/demos/rural/ai/AIPreliminaryRead";
import { POCUSProtocolLibrary } from "@/components/demos/rural/ai/POCUSProtocolLibrary";
import { POCUSQualityAssist } from "@/components/demos/rural/ai/POCUSQualityAssist";
import { POCUSTeleWorkflow } from "@/components/demos/rural/ai/POCUSTeleWorkflow";

export function AIDiagnosticsDashboard() {
  return (
    <div className="space-y-6">
      <RuralStatBanner
        stats={[
          { label: "Algorithms (demo)", value: "3", hint: "Marketplace" },
          { label: "POCUS protocols", value: "3", hint: "Library" },
          { label: "Prelim SLA", value: "< 5m", hint: "Illustrative" },
        ]}
      />
      <RuralPriorityAISelector />
      <AIMarketplace />
      <div className="grid gap-6 lg:grid-cols-2">
        <AIPreliminaryRead />
        <POCUSProtocolLibrary />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <POCUSQualityAssist />
        <POCUSTeleWorkflow />
      </div>
    </div>
  );
}
