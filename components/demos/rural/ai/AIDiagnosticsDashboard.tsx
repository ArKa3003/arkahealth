"use client";

import { RuralDashboardPanel } from "@/components/demos/rural/shared/RuralDashboardPanel";
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
      <RuralDashboardPanel>
        <RuralStatBanner
          stats={[
            { label: "Algorithms (demo)", value: "3", hint: "Demo" },
            { label: "POCUS protocols", value: "3", hint: "Illustrative" },
            { label: "Prelim SLA", value: "< 5m", hint: "Synthetic" },
          ]}
        />
      </RuralDashboardPanel>

      <RuralDashboardPanel delay={0.05}>
        <RuralPriorityAISelector />
      </RuralDashboardPanel>

      <RuralDashboardPanel delay={0.1}>
        <AIMarketplace />
      </RuralDashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuralDashboardPanel delay={0.15}>
          <AIPreliminaryRead />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.2}>
          <POCUSProtocolLibrary />
        </RuralDashboardPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuralDashboardPanel delay={0.25}>
          <POCUSQualityAssist />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.3}>
          <POCUSTeleWorkflow />
        </RuralDashboardPanel>
      </div>
    </div>
  );
}
