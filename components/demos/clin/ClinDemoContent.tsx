"use client";

import { useCallback, useState } from "react";
import { Shield } from "lucide-react";

import { evaluateImaging } from "@/lib/demos/clin/evaluate-imaging";
import { getDemoScenario } from "@/lib/demos/clin/demo-scenarios";
import type { ClinicalScenario, EvaluationResult } from "@/lib/demos/clin/types";
import { FDA_COMPLIANCE } from "@/lib/demos/clin/constants/fda-compliance";
import { PatientContextRail } from "./cockpit/PatientContextRail";
import { OrderComposer } from "./cockpit/OrderComposer";
import { ResultsRail } from "./cockpit/ResultsRail";
import { MobileResultsSheet } from "./cockpit/MobileResultsSheet";
import { EVALUATION_STEPS, STEP_DURATION_MS } from "./cockpit/clin-cockpit-utils";

const DEFAULT_EXAMPLE_KEY = "lbp-inappropriate";

/**
 * Three-zone clinician cockpit — presentation layer over evaluate-imaging pipeline.
 */
export function ClinDemoContent() {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loadedScenario, setLoadedScenario] = useState<ClinicalScenario | null>(null);
  const [draftScenario, setDraftScenario] = useState<ClinicalScenario | null>(null);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const displayScenario = draftScenario ?? loadedScenario;

  const runEvaluation = useCallback(async (scenario: ClinicalScenario) => {
    setHasStarted(true);
    setIsEvaluating(true);
    setEvaluationStep(0);
    setLoadedScenario(scenario);
    setResult(null);

    for (let step = 0; step <= EVALUATION_STEPS.length; step += 1) {
      setEvaluationStep(step);
      if (step < EVALUATION_STEPS.length) {
        await new Promise((r) => setTimeout(r, STEP_DURATION_MS));
      }
    }

    const evaluationResult = evaluateImaging(scenario);
    setResult(evaluationResult);
    setIsEvaluating(false);
  }, []);

  const handleSelectScenario = useCallback(
    (key: string) => {
      const scenario = getDemoScenario(key);
      if (!scenario) return;
      setSelectedScenarioKey(key);
      setLoadedScenario(scenario);
      setHasStarted(true);
      setResult(null);
    },
    [],
  );

  const handleLoadExample = useCallback(() => {
    handleSelectScenario(DEFAULT_EXAMPLE_KEY);
  }, [handleSelectScenario]);

  const handleNewEvaluation = useCallback(() => {
    setResult(null);
    setLoadedScenario(null);
    setDraftScenario(null);
    setSelectedScenarioKey(null);
    setHasStarted(false);
  }, []);

  const showEmptyState = !hasStarted && !loadedScenario;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-radius-lg border border-arka-teal-200 bg-arka-teal-50 px-3 py-2.5">
        <Shield className="h-4 w-4 shrink-0 text-arka-teal-600" aria-hidden />
        <span className="text-center text-caption font-medium text-arka-slate-700 sm:text-left">
          {FDA_COMPLIANCE.BANNER_TEXT}
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5 pb-20 lg:pb-0">
        <PatientContextRail
          scenario={displayScenario}
          selectedScenarioKey={selectedScenarioKey}
          onSelectScenario={handleSelectScenario}
        />

        <OrderComposer
          scenario={loadedScenario}
          onScenarioDraftChange={setDraftScenario}
          onEvaluate={runEvaluation}
          isEvaluating={isEvaluating}
          evaluationStep={evaluationStep}
          showEmptyState={showEmptyState}
          onLoadExample={handleLoadExample}
        />

        <div className="hidden lg:block">
          <ResultsRail
            result={result}
            scenario={loadedScenario}
            isLoading={isEvaluating}
            onNewEvaluation={handleNewEvaluation}
            onSwitchOrder={runEvaluation}
          />
        </div>
      </div>

      <MobileResultsSheet
        result={result}
        scenario={loadedScenario}
        isLoading={isEvaluating}
        onNewEvaluation={handleNewEvaluation}
        onSwitchOrder={runEvaluation}
      />
    </div>
  );
}
