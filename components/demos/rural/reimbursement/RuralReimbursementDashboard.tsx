"use client";

import { RuralDashboardPanel } from "@/components/demos/rural/shared/RuralDashboardPanel";
import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
import { RuralRateTable } from "@/components/demos/rural/reimbursement/RuralRateTable";
import { RuralRevenueCalculator } from "@/components/demos/rural/reimbursement/RuralRevenueCalculator";
import { RuralExemptionDetector } from "@/components/demos/rural/reimbursement/RuralExemptionDetector";
import { AlternativeStudyJustifier } from "@/components/demos/rural/reimbursement/AlternativeStudyJustifier";
import { BatchAuthorizationWorkflow } from "@/components/demos/rural/reimbursement/BatchAuthorizationWorkflow";
import { RevenueCycleIntelligence } from "@/components/demos/rural/reimbursement/RevenueCycleIntelligence";
import { PayerMixOptimizer } from "@/components/demos/rural/reimbursement/PayerMixOptimizer";
import { REHPaymentOptimizer } from "@/components/demos/rural/reimbursement/REHPaymentOptimizer";
import { GrantFundingNavigator } from "@/components/demos/rural/reimbursement/GrantFundingNavigator";

export function RuralReimbursementDashboard() {
  return (
    <div className="space-y-6">
      <RuralDashboardPanel>
        <RuralStatBanner
          stats={[
            { label: "Batch queue", value: "2", hint: "Demo" },
            { label: "Denial rate (demo)", value: "8%", hint: "Illustrative" },
            { label: "Rural adj.", value: "+3%", hint: "Synthetic" },
          ]}
        />
      </RuralDashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuralDashboardPanel delay={0.05}>
          <RuralRateTable />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.1}>
          <RuralRevenueCalculator />
        </RuralDashboardPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuralDashboardPanel delay={0.15}>
          <RuralExemptionDetector />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.2}>
          <BatchAuthorizationWorkflow />
        </RuralDashboardPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuralDashboardPanel delay={0.25}>
          <AlternativeStudyJustifier />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.3}>
          <RevenueCycleIntelligence />
        </RuralDashboardPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RuralDashboardPanel delay={0.35}>
          <PayerMixOptimizer />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.4}>
          <REHPaymentOptimizer />
        </RuralDashboardPanel>
        <RuralDashboardPanel delay={0.45}>
          <GrantFundingNavigator />
        </RuralDashboardPanel>
      </div>
    </div>
  );
}
