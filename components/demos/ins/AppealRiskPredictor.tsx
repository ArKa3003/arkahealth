"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Gauge, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Badge } from "@/components/demos/ins/ui/Badge";
import { Button } from "@/components/demos/ins/ui/Button";
import { Progress } from "@/components/demos/ins/ui/Progress";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

export function AppealRiskPredictor({ onGoBack, onResetDemo }: { onGoBack?: () => void; onResetDemo?: () => void }) {
  const { denialPrediction, currentOrderId, processing, simulateDenialPrediction, completeStep, nextStep } = useInsDemoStore();

  React.useEffect(() => {
    if (!denialPrediction && currentOrderId && !processing.isAnalyzing) {
      simulateDenialPrediction();
    }
  }, [denialPrediction, currentOrderId, processing.isAnalyzing, simulateDenialPrediction]);

  const handleContinue = () => {
    completeStep(4);
    nextStep();
  };

  if (processing.isAnalyzing) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">Appeal Risk Prediction</h2>
        <Card variant="default">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Gauge className="h-12 w-12 text-arka-deep animate-pulse" />
              <p className="text-slate-700 font-medium">{processing.processingMessage ?? "Running prediction..."}</p>
              <Progress value={processing.processingProgress} max={100} size="md" className="w-full max-w-xs" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!denialPrediction) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">Appeal Risk Prediction</h2>
        <Card variant="default">
          <CardContent className="p-8 text-center text-slate-600">Running prediction...</CardContent>
        </Card>
      </div>
    );
  }

  const riskStatus = denialPrediction.riskLevel === "low" ? "success" : denialPrediction.riskLevel === "medium" ? "warning" : "error";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-900">Appeal Risk Prediction</h2>
          <p className="text-slate-600 text-sm">AI denial risk and recommendations.</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>

      <Card variant="default">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-arka-deep" />
            Denial Risk: {denialPrediction.overallRisk}%
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Badge status={riskStatus} variant="solid" size="lg">{denialPrediction.riskLevel}</Badge>
            <span className="text-slate-600 text-sm">Confidence: {denialPrediction.confidenceScore}%</span>
            <span className="text-slate-600 text-sm">Predicted: {denialPrediction.predictedOutcome}</span>
          </div>
          <p className="text-slate-700 text-sm mt-2">Similar cases: {denialPrediction.similarCasesApproved} approved, {denialPrediction.similarCasesDenied} denied.</p>
        </CardContent>
      </Card>

      {denialPrediction.factors.length > 0 && (
        <Card variant="default">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {denialPrediction.factors.slice(0, 5).map((f) => (
                <li key={f.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-sm font-medium text-slate-800">{f.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{f.description}</p>
                  {f.isAddressable && <p className="text-xs text-arka-cyan mt-1">Mitigation: {f.mitigationStrategy}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {denialPrediction.recommendations.length > 0 && (
        <Card variant="default">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {denialPrediction.recommendations.slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <ChevronRight className="h-4 w-4 text-arka-deep flex-shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        <Button variant="primary" size="md" onClick={handleContinue}>Continue to Documentation Assistant</Button>
      </div>
    </div>
  );
}
