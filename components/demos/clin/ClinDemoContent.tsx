"use client";

import { useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { evaluateImaging } from "@/lib/demos/clin/evaluate-imaging";
import { getDemoScenario, getAllDemoScenarios } from "@/lib/demos/clin/demo-scenarios";
import type { ClinicalScenario } from "@/lib/demos/clin/types";
import type { EvaluationResult } from "@/lib/demos/clin/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { FDA_COMPLIANCE } from "@/lib/demos/clin/constants/fda-compliance";
import { ClinResultsView } from "./ClinResultsView";
import { ClinicalScenarioForm } from "./ClinicalScenarioForm";

export function ClinDemoContent() {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [currentScenario, setCurrentScenario] = useState<ClinicalScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNewEvaluation = useCallback(() => {
    setResult(null);
    setCurrentScenario(null);
  }, []);

  const handleEvaluate = async (scenario: ClinicalScenario) => {
    setIsLoading(true);
    setCurrentScenario(scenario);
    await new Promise((r) => setTimeout(r, 500));
    const evaluationResult = evaluateImaging(scenario);
    setResult(evaluationResult);
    setIsLoading(false);
  };

  const scenarios = getAllDemoScenarios();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* FDA Banner */}
      <div className="arka-card flex flex-wrap items-center justify-center gap-2 rounded-xl border border-arka-cyan/30 bg-arka-bg-alt py-2.5 px-3 sm:px-4">
        <Shield className="h-4 w-4 flex-shrink-0 text-arka-cyan" aria-hidden />
        <span className="text-center text-sm font-medium text-arka-text-dark-muted sm:text-left">
          {FDA_COMPLIANCE.BANNER_TEXT}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-arka-cyan border-t-transparent" />
          <p className="text-arka-text-dark-muted font-medium">Analyzing scenario...</p>
          <div className="arka-card h-48 w-full max-w-2xl animate-pulse rounded-xl opacity-60" />
        </div>
      ) : result && currentScenario ? (
        <ClinResultsView
          result={result}
          scenario={currentScenario}
          onNewEvaluation={handleNewEvaluation}
          onEvaluate={handleEvaluate}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          <section aria-labelledby="evaluation-title">
            <h2
              id="evaluation-title"
              className="text-xl sm:text-2xl font-heading font-semibold text-arka-text-dark mb-2"
            >
              Imaging Appropriateness Evaluation
            </h2>
            <p className="text-arka-text-dark-muted text-base">
              Choose a demo scenario or enter a clinical scenario below to receive evidence-based recommendations from the ARKA Imaging Intelligence Engine (AIIE).
            </p>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-arka-text-dark">Quick Demo Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {scenarios.map(({ key, title, description }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const scenario = getDemoScenario(key);
                      if (scenario) handleEvaluate(scenario);
                    }}
                    className="arka-card text-left p-4 rounded-xl border border-arka-primary/20 bg-arka-bg-alt hover:border-arka-cyan/40 hover:bg-arka-pale transition-all min-h-[44px] w-full touch-manipulation"
                  >
                    <h4 className="font-medium text-arka-text-dark mb-1 text-base">{title}</h4>
                    <p className="text-sm text-arka-text-dark-muted">{description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <ClinicalScenarioForm onEvaluate={handleEvaluate} />
        </div>
      )}
    </div>
  );
}
