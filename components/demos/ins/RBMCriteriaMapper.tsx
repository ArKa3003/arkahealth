"use client";

import * as React from "react";
import { BookOpen, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Badge } from "@/components/demos/ins/ui/Badge";
import { Button } from "@/components/demos/ins/ui/Button";
import { Progress } from "@/components/demos/ins/ui/Progress";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

export function RBMCriteriaMapper({ onGoBack }: { onGoBack?: () => void }) {
  const { rbmCriteriaMatch, currentOrderId, processing, simulateCriteriaMatching, completeStep, nextStep } = useInsDemoStore();

  React.useEffect(() => {
    if (!rbmCriteriaMatch && currentOrderId && !processing.isAnalyzing) {
      simulateCriteriaMatching();
    }
  }, [rbmCriteriaMatch, currentOrderId, processing.isAnalyzing, simulateCriteriaMatching]);

  const handleContinue = () => {
    completeStep(6);
    nextStep();
  };

  if (processing.isAnalyzing) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">RBM Criteria Mapping</h2>
        <Card variant="default">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <BookOpen className="h-12 w-12 text-arka-deep animate-pulse" />
              <p className="text-slate-700 font-medium">{processing.processingMessage ?? "Loading criteria..."}</p>
              <Progress value={processing.processingProgress} max={100} size="md" className="w-full max-w-xs" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!rbmCriteriaMatch) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">RBM Criteria Mapping</h2>
        <Card variant="default">
          <CardContent className="p-8 text-center text-slate-600">Loading...</CardContent>
        </Card>
      </div>
    );
  }

  const allCriteria = [...rbmCriteriaMatch.matchedCriteria, ...rbmCriteriaMatch.unmatchedCriteria];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-900">RBM Criteria Mapping</h2>
          <p className="text-slate-600 text-sm">{rbmCriteriaMatch.specificGuideline} — {rbmCriteriaMatch.guidelineReference}</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>
      <Card variant="default">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-arka-deep" />
            Match Score: {rbmCriteriaMatch.overallMatchScore}%
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-700 text-sm mb-4">
            Requirements met: {rbmCriteriaMatch.requirementsMetCount} / {rbmCriteriaMatch.requirementsTotalCount}
          </p>
          <ul className="space-y-2">
            {allCriteria.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-start gap-3 p-2 rounded-lg border border-white/10">
                {c.matched ? <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm text-slate-800">{c.description}</p>
                  {c.evidenceProvided && <p className="text-xs text-slate-600 mt-1">Evidence: {c.evidenceProvided}</p>}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        <Button variant="primary" size="md" onClick={handleContinue}>Continue to Gold Card Check</Button>
      </div>
    </div>
  );
}
