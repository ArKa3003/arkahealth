"use client";

import * as React from "react";
import { Send, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Button } from "@/components/demos/ins/ui/Button";
import { Progress } from "@/components/demos/ins/ui/Progress";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

export function SubmitAppealStep({ onGoBack, onReset }: { onGoBack?: () => void; onReset?: () => void }) {
  const { generatedAppeal, currentOrderId, processing, simulateAppealGeneration, completeStep } = useInsDemoStore();

  React.useEffect(() => {
    if (!generatedAppeal && currentOrderId && !processing.isGenerating) {
      simulateAppealGeneration();
    }
  }, [generatedAppeal, currentOrderId, processing.isGenerating, simulateAppealGeneration]);

  if (processing.isGenerating) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">Submit / Appeal Generator</h2>
        <Card variant="default">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 text-arka-deep animate-pulse" />
              <p className="text-slate-700 font-medium">{processing.processingMessage ?? "Generating appeal..."}</p>
              <Progress value={processing.processingProgress} max={100} size="md" className="w-full max-w-xs" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showAppeal = generatedAppeal && (generatedAppeal.orderId === currentOrderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-900">Submit / Appeal Generator</h2>
          <p className="text-slate-600 text-sm">Submit prior auth or generate appeal letter.</p>
        </div>
        {onGoBack && <Button variant="ghost" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>

      {showAppeal ? (
        <Card variant="default">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-arka-deep" />
              Appeal Letter ({generatedAppeal.appealType})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{generatedAppeal.letterContent}</p>
            </div>
            {generatedAppeal.citedGuidelines?.length > 0 && (
              <p className="text-xs text-slate-600 mt-4">Cited: {generatedAppeal.citedGuidelines.join("; ")}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card variant="default">
          <CardContent className="p-8 text-center">
            <Send className="h-12 w-12 text-arka-deep mx-auto mb-4" />
            <p className="text-slate-700 text-sm">
              For this scenario you can submit the prior auth request or generate an appeal if the case was denied. 
              Demo complete.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {onGoBack && <Button variant="secondary" size="md" onClick={onGoBack}>Back</Button>}
        {onReset && (
          <Button variant="primary" size="md" onClick={onReset} leftIcon={<Send className="h-4 w-4" />}>
            Reset & Start Over
          </Button>
        )}
      </div>
    </div>
  );
}
