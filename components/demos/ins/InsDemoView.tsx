"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Suspense } from "react";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";
import { patients, imagingOrders } from "@/lib/demos/ins/mock-data";
import { EnhancedSidebar } from "@/components/demos/ins/EnhancedSidebar";
import { PatientIntake } from "@/components/demos/ins/PatientIntake";
import { OrderEntry } from "@/components/demos/ins/OrderEntry";
import { PreSubmissionAnalyzer } from "@/components/demos/ins/PreSubmissionAnalyzer";
import { AppealRiskPredictor } from "@/components/demos/ins/AppealRiskPredictor";
import { DocumentationAssistant } from "@/components/demos/ins/DocumentationAssistant";
import { RBMCriteriaMapper } from "@/components/demos/ins/RBMCriteriaMapper";
import { GoldCardCheck } from "@/components/demos/ins/GoldCardCheck";
import { CMSComplianceCheck } from "@/components/demos/ins/CMSComplianceCheck";
import { HITLReview } from "@/components/demos/ins/HITLReview";
import { SubmitAppealStep } from "@/components/demos/ins/SubmitAppealStep";
import { DemoErrorState } from "@/components/demos/ins/DemoErrorState";
import { DemoEmptyState } from "@/components/demos/ins/DemoEmptyState";
import { Button } from "@/components/demos/ins/ui/Button";
import { cn } from "@/lib/utils";

const DEMO_DATA_UNAVAILABLE =
  typeof patients === "undefined" ||
  typeof imagingOrders === "undefined" ||
  patients.length === 0 ||
  imagingOrders.length === 0;

type ScenarioMode = "standard" | "high-risk" | "gold-card";
const SCENARIO_INDEX: Record<ScenarioMode, number> = {
  standard: 0,
  "high-risk": 1,
  "gold-card": 2,
};

function StepFallback() {
  return (
    <div
      className="min-h-[320px] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="animate-pulse text-arka-text-soft">Loading step…</div>
    </div>
  );
}

function DemoModeSelector({
  value,
  onChange,
}: {
  value: ScenarioMode;
  onChange: (m: ScenarioMode) => void;
}) {
  const modes: { id: ScenarioMode; label: string; description: string }[] = [
    { id: "standard", label: "Standard Flow", description: "Typical approval" },
    {
      id: "high-risk",
      label: "High-Risk Case",
      description: "Appeal prediction in action",
    },
    {
      id: "gold-card",
      label: "Gold Card Provider",
      description: "Auto-bypass flow",
    },
  ];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Demo mode">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={value === m.id}
          className={cn(
            "flex flex-col items-start px-4 py-2.5 rounded-lg border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark",
            value === m.id
              ? "border-arka-deep bg-arka-deep/10"
              : "border-white/10 hover:border-arka-deep/30 bg-arka-bg-medium/50"
          )}
        >
          <span
            className={cn(
              "font-medium text-sm",
              value === m.id ? "text-arka-deep" : "text-arka-text-muted"
            )}
          >
            {m.label}
          </span>
          <span className="text-xs text-arka-text-soft">{m.description}</span>
        </button>
      ))}
    </div>
  );
}

export function InsDemoView() {
  const [scenarioMode, setScenarioMode] = React.useState<ScenarioMode>("standard");

  const {
    currentStep,
    completedSteps,
    goToStep,
    previousStep,
    nextStep,
    resetDemo,
    initializeScenario,
    selectedPatient,
    processing,
  } = useInsDemoStore();

  const isAnalyzing = processing.isAnalyzing || processing.isGenerating;
  const isFirst = currentStep === 1;
  const isLast = currentStep === 10;
  const showEmptyState =
    currentStep >= 2 && !selectedPatient && !isAnalyzing;

  React.useEffect(() => {
    if (!DEMO_DATA_UNAVAILABLE) initializeScenario(SCENARIO_INDEX.standard);
  }, [initializeScenario]);

  const handleModeChange = React.useCallback(
    (mode: ScenarioMode) => {
      setScenarioMode(mode);
      initializeScenario(SCENARIO_INDEX[mode]);
    },
    [initializeScenario]
  );

  const handleReset = React.useCallback(() => {
    resetDemo();
    initializeScenario(SCENARIO_INDEX[scenarioMode]);
  }, [resetDemo, initializeScenario, scenarioMode]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PatientIntake />;
      case 2:
        return <OrderEntry />;
      case 3:
        return <PreSubmissionAnalyzer onGoBack={() => goToStep(2)} />;
      case 4:
        return (
          <AppealRiskPredictor
            onGoBack={() => goToStep(3)}
            onResetDemo={handleReset}
          />
        );
      case 5:
        return <DocumentationAssistant onGoBack={() => goToStep(4)} />;
      case 6:
        return <RBMCriteriaMapper onGoBack={() => goToStep(5)} />;
      case 7:
        return <GoldCardCheck onGoBack={() => goToStep(6)} />;
      case 8:
        return <CMSComplianceCheck onGoBack={() => goToStep(7)} />;
      case 9:
        return <HITLReview onGoBack={() => goToStep(8)} />;
      case 10:
        return (
          <SubmitAppealStep
            onGoBack={() => goToStep(9)}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  if (DEMO_DATA_UNAVAILABLE) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
        <DemoErrorState
          variant="demo-data-unavailable"
          onResetDemo={() => {
            resetDemo();
            initializeScenario(SCENARIO_INDEX[scenarioMode]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="arka-card rounded-xl border border-arka-deep/20 px-4 py-4 lg:px-6">
        <p className="text-xs font-medium text-arka-text-soft uppercase tracking-wide mb-2">
          Demo mode
        </p>
        <DemoModeSelector value={scenarioMode} onChange={handleModeChange} />
        <p className="text-xs text-arka-text-soft mt-2" role="note">
          Demonstration only — not for clinical use.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
        <EnhancedSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepSelect={goToStep}
          onReset={handleReset}
          totalSteps={10}
        />

        <main
          className="flex-1 min-w-0"
          id="demo-main"
          aria-label="ARKA-INS demo content"
        >
          <h2 className="sr-only">Utilization Management Demo Steps</h2>
          {showEmptyState ? (
            <DemoEmptyState onGoToStep1={() => goToStep(1)} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Suspense fallback={<StepFallback />}>
                  {renderStep()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          )}

          <nav
            className="mt-8 flex items-center justify-between border-t border-white/10 pt-6"
            aria-label="Demo step navigation"
          >
            <Button
              variant="secondary"
              size="md"
              onClick={previousStep}
              disabled={isFirst}
              leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden />}
              aria-label="Previous step"
            >
              Previous
            </Button>
            <span
              className="text-sm text-arka-text-soft"
              aria-live="polite"
            >
              Step {currentStep} of 10
            </span>
            <Button
              variant="primary"
              size="md"
              onClick={nextStep}
              disabled={isLast}
              rightIcon={<ChevronRight className="h-4 w-4" aria-hidden />}
              aria-label="Next step"
            >
              Next
            </Button>
          </nav>
        </main>
      </div>
    </div>
  );
}
