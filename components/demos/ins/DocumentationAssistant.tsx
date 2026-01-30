"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Button } from "@/components/demos/ins/ui/Button";
import { Progress } from "@/components/demos/ins/ui/Progress";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

export function DocumentationAssistant({ onGoBack }: { onGoBack?: () => void }) {
  const { generatedJustification, currentOrderId, processing, simulateJustificationGeneration, completeStep, nextStep } = useInsDemoStore();

  React.useEffect(() => {
    if (!generatedJustification && currentOrderId && !processing.isGenerating) {
      simulateJustificationGeneration();
    }
  }, [generatedJustification, currentOrderId, processing.isGenerating, simulateJustificationGeneration]);

  const handleContinue = () => {
    completeStep(5);
    nextStep();
  };

  if (processing.isGenerating) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-arka-text">Documentation Assistant</h2>
        <Card variant="default">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 text-arka-deep animate-pulse" />
              <p className="text-arka-text-muted font-medium">{processing.processingMessage ?? "Generating justification..."}</p>
              <Progress value={processing.processingProgress} max={100} size="md" className="w-full max-w-xs" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!generatedJustification) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-arka-text">Documentation Assistant</h2>
        <Card variant="default">
          <CardContent className="p-8 text-center text-arka-text-soft">Generating...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-arka-text">Documentation Assistant</h2>
          <p className="text-arka-text-soft text-sm">AI-generated clinical justification.</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>
      <Card variant="default">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-arka-deep" />
            Clinical Justification ({generatedJustification.wordCount} words)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-arka-text-muted whitespace-pre-wrap">{generatedJustification.narrative}</p>
          </div>
          {generatedJustification.keyPoints.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-arka-text-soft">
              {generatedJustification.keyPoints.map((k, i) => (
                <li key={i}>• {k}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        <Button variant="primary" size="md" onClick={handleContinue}>Continue to RBM Criteria Mapping</Button>
      </div>
    </div>
  );
}
