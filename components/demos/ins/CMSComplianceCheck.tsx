"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Button } from "@/components/demos/ins/ui/Button";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

export function CMSComplianceCheck({ onGoBack }: { onGoBack?: () => void }) {
  const { completeStep, nextStep } = useInsDemoStore();

  const handleContinue = () => {
    completeStep(8);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-900">CMS Compliance Verification</h2>
          <p className="text-slate-600 text-sm">Urgent/standard decision timelines and reporting readiness.</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>
      <Card variant="default">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-arka-deep" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-700 text-sm">
            CMS requires urgent decisions within 72 hours and standard within 7 days. This step verifies SLA compliance 
            and public reporting readiness (approval/denial rates, appeal outcomes, average decision times).
          </p>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        <Button variant="primary" size="md" onClick={handleContinue}>Continue to HITL Review</Button>
      </div>
    </div>
  );
}
