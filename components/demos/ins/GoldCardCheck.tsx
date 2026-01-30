"use client";

import * as React from "react";
import { Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Button } from "@/components/demos/ins/ui/Button";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

export function GoldCardCheck({ onGoBack }: { onGoBack?: () => void }) {
  const { completeStep, nextStep } = useInsDemoStore();

  const handleContinue = () => {
    completeStep(7);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-arka-text">Gold Card Check</h2>
          <p className="text-arka-text-soft text-sm">Eligibility for expedited or bypass prior auth.</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>
      <Card variant="default">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-arka-deep" />
            Gold Card Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-arka-text-muted text-sm">
            This demo step shows where Gold Card eligibility would be evaluated by payer (e.g., UHC, Aetna, BCBS). 
            Providers meeting approval-rate and volume thresholds may qualify for auto-approval or expedited review.
          </p>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        <Button variant="primary" size="md" onClick={handleContinue}>Continue to CMS Compliance</Button>
      </div>
    </div>
  );
}
