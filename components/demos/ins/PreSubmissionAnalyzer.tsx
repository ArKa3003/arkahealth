"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileSearch, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Badge } from "@/components/demos/ins/ui/Badge";
import { Button } from "@/components/demos/ins/ui/Button";
import { Progress } from "@/components/demos/ins/ui/Progress";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";
import { cn } from "@/lib/utils";

export function PreSubmissionAnalyzer({ onGoBack }: { onGoBack?: () => void }) {
  const { preSubmissionAnalysis, currentOrderId, processing, simulatePreSubmissionAnalysis, completeStep, nextStep } = useInsDemoStore();

  React.useEffect(() => {
    if (!preSubmissionAnalysis && currentOrderId && !processing.isAnalyzing) {
      simulatePreSubmissionAnalysis();
    }
  }, [preSubmissionAnalysis, currentOrderId, processing.isAnalyzing, simulatePreSubmissionAnalysis]);

  const handleContinue = () => {
    completeStep(3);
    nextStep();
  };

  if (processing.isAnalyzing) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-arka-text">Pre-Submission Analysis</h2>
        <Card variant="default">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <FileSearch className="h-12 w-12 text-arka-deep animate-pulse" />
              <p className="text-arka-text-muted font-medium">{processing.processingMessage ?? "Analyzing..."}</p>
              <Progress value={processing.processingProgress} max={100} size="md" className="w-full max-w-xs" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!preSubmissionAnalysis) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-arka-text">Pre-Submission Analysis</h2>
        <Card variant="default">
          <CardContent className="p-8 text-center text-arka-text-soft">
            No analysis yet. Run analysis (or wait for auto-run).
          </CardContent>
        </Card>
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Go Back</Button>}
      </div>
    );
  }

  const scoreColor = preSubmissionAnalysis.documentationScore >= 80 ? "emerald" : preSubmissionAnalysis.documentationScore >= 50 ? "amber" : "red";
  const severityColor = (s: string) => (s === "critical" ? "error" : s === "major" ? "warning" : "info");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-arka-text">Pre-Submission Analysis</h2>
          <p className="text-arka-text-soft text-sm">Documentation completeness and readiness for submission.</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>

      <Card variant="default">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-arka-deep" />
            Documentation Score
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold", scoreColor === "emerald" && "bg-emerald-600 text-white", scoreColor === "amber" && "bg-amber-500 text-arka-bg-dark", scoreColor === "red" && "bg-red-600 text-white")}>
              {preSubmissionAnalysis.documentationScore}
            </div>
            <div>
              <p className="text-arka-text-muted text-sm">Ready for submission</p>
              <Badge status={preSubmissionAnalysis.readyForSubmission ? "success" : "warning"} variant="solid" size="md" className="mt-1">
                {preSubmissionAnalysis.readyForSubmission ? "Yes" : "No — address gaps first"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {preSubmissionAnalysis.gaps.length > 0 && (
        <Card variant="default">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Documentation Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {preSubmissionAnalysis.gaps.map((gap) => (
                <li key={gap.id} className={cn("p-3 rounded-lg border", severityColor(gap.severity) === "error" && "border-red-500/30 bg-red-500/5", severityColor(gap.severity) === "warning" && "border-amber-500/30 bg-amber-500/5", severityColor(gap.severity) === "info" && "border-arka-deep/30 bg-arka-deep/5")}>
                  <Badge status={severityColor(gap.severity) as "error" | "warning" | "info"} variant="subtle" size="sm" className="mb-2">{gap.severity}</Badge>
                  <p className="text-sm text-arka-text">{gap.description}</p>
                  <p className="text-xs text-arka-text-soft mt-1">{gap.suggestedAction}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {preSubmissionAnalysis.suggestions.length > 0 && (
        <Card variant="default">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-arka-cyan" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {preSubmissionAnalysis.suggestions.slice(0, 5).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-arka-text-muted">
                  <ChevronRight className="h-4 w-4 text-arka-deep flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        <Button variant="primary" size="md" onClick={handleContinue}>Continue to Appeal Risk Prediction</Button>
      </div>
    </div>
  );
}
