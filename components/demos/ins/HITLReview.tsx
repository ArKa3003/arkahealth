"use client";

import * as React from "react";
import { UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Button } from "@/components/demos/ins/ui/Button";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

export function HITLReview({ onGoBack }: { onGoBack?: () => void }) {
  const { completeStep, nextStep } = useInsDemoStore();

  const handleContinue = () => {
    completeStep(9);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-arka-text">Human-in-the-Loop Review</h2>
          <p className="text-arka-text-soft text-sm">Clinical reviewer sign-off before final decision.</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>
      <Card variant="default">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-arka-deep" />
            Review Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-arka-text-muted text-sm">
            Cases requiring human review (e.g., AI-recommended approvals, high-risk denials) are routed to a qualified 
            reviewer. This step represents the reviewer confirming or overriding the AI recommendation and documenting the decision.
          </p>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        <Button variant="primary" size="md" onClick={handleContinue}>Continue to Submit / Appeal</Button>
      </div>
    </div>
  );
}
