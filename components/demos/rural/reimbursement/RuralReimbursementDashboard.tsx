"use client";

import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
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
      <RuralStatBanner
        stats={[
          { label: "Batch queue", value: "2", hint: "Demo orders" },
          { label: "Denial rate (demo)", value: "8%", hint: "Rolling" },
          { label: "Rural adj.", value: "+3%", hint: "Illustrative" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <RuralExemptionDetector />
        <BatchAuthorizationWorkflow />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AlternativeStudyJustifier />
        <RevenueCycleIntelligence />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <PayerMixOptimizer />
        <REHPaymentOptimizer />
        <GrantFundingNavigator />
      </div>
    </div>
  );
}
