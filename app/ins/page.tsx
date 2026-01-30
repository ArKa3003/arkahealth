"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, ChevronDown, Shield, Stethoscope, GraduationCap } from "lucide-react";
import { Suspense } from "react";
import { routes } from "@/lib/constants";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";
import { DEMO_STEPS_10 } from "@/lib/demos/ins/constants";
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
import { AnalysisTimeoutBanner } from "@/components/demos/ins/AnalysisTimeoutBanner";
import { Button } from "@/components/demos/ins/ui/Button";
import { cn } from "@/lib/utils";

const DEMO_DATA_UNAVAILABLE = typeof patients === "undefined" || typeof imagingOrders === "undefined" || patients.length === 0 || imagingOrders.length === 0;

type ScenarioMode = "standard" | "high-risk" | "gold-card";
const SCENARIO_INDEX: Record<ScenarioMode, number> = { standard: 0, "high-risk": 1, "gold-card": 2 };

const CROSS_LINKS = [
  { href: routes.clin, label: "ARKA-CLIN", icon: Stethoscope },
  { href: routes.ed, label: "ARKA-ED", icon: GraduationCap },
] as const;

function StepFallback() {
  return (
    <div className="min-h-[320px] flex items-center justify-center" role="status" aria-live="polite">
      <div className="animate-pulse text-arka-text-soft">Loading step…</div>
    </div>
  );
}

function DemoModeSelector({ value, onChange }: { value: ScenarioMode; onChange: (m: ScenarioMode) => void }) {
  const modes: { id: ScenarioMode; label: string; description: string }[] = [
    { id: "standard", label: "Standard Flow", description: "Typical approval" },
    { id: "high-risk", label: "High-Risk Case", description: "Appeal prediction in action" },
    { id: "gold-card", label: "Gold Card Provider", description: "Auto-bypass flow" },
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
            "flex flex-col items-start px-4 py-2.5 rounded-lg border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-deep focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark",
            value === m.id ? "border-arka-deep bg-arka-deep/10" : "border-white/10 hover:border-arka-deep/30 bg-arka-bg-medium/50"
          )}
        >
          <span className={cn("font-medium text-sm", value === m.id ? "text-arka-deep" : "text-arka-text-muted")}>{m.label}</span>
          <span className="text-xs text-arka-text-soft">{m.description}</span>
        </button>
      ))}
    </div>
  );
}

function InsDemoContent() {
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
  const showEmptyState = currentStep >= 2 && !selectedPatient && !isAnalyzing;

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
      case 1: return <PatientIntake />;
      case 2: return <OrderEntry />;
      case 3: return <PreSubmissionAnalyzer onGoBack={() => goToStep(2)} />;
      case 4: return <AppealRiskPredictor onGoBack={() => goToStep(3)} onResetDemo={handleReset} />;
      case 5: return <DocumentationAssistant onGoBack={() => goToStep(4)} />;
      case 6: return <RBMCriteriaMapper onGoBack={() => goToStep(5)} />;
      case 7: return <GoldCardCheck onGoBack={() => goToStep(6)} />;
      case 8: return <CMSComplianceCheck onGoBack={() => goToStep(7)} />;
      case 9: return <HITLReview onGoBack={() => goToStep(8)} />;
      case 10: return <SubmitAppealStep onGoBack={() => goToStep(9)} onReset={handleReset} />;
      default: return null;
    }
  };

  if (DEMO_DATA_UNAVAILABLE) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
        <DemoErrorState
          variant="demo-data-unavailable"
          onResetDemo={() => { resetDemo(); initializeScenario(SCENARIO_INDEX[scenarioMode]); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Demo mode */}
      <div className="arka-card rounded-xl border border-arka-deep/20 px-4 py-4 lg:px-6">
        <p className="text-xs font-medium text-arka-text-soft uppercase tracking-wide mb-2">Demo mode</p>
        <DemoModeSelector value={scenarioMode} onChange={handleModeChange} />
        <p className="text-xs text-arka-text-soft mt-2" role="note">Demonstration only — not for clinical use.</p>
      </div>

      {/* Two-column: sidebar + main */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
        <EnhancedSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepSelect={goToStep}
          onReset={handleReset}
          totalSteps={10}
        />

        <main className="flex-1 min-w-0" id="demo-main" aria-label="Demo content">
          <h1 className="sr-only">ARKA-INS Utilization Management Demo</h1>
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
                <Suspense fallback={<StepFallback />}>{renderStep()}</Suspense>
              </motion.div>
            </AnimatePresence>
          )}

          <nav className="mt-8 flex items-center justify-between border-t border-white/10 pt-6" aria-label="Demo step navigation">
            <Button variant="secondary" size="md" onClick={previousStep} disabled={isFirst} leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden />} aria-label="Previous step">
              Previous
            </Button>
            <span className="text-sm text-arka-text-soft" aria-live="polite">Step {currentStep} of 10</span>
            <Button variant="primary" size="md" onClick={nextStep} disabled={isLast} rightIcon={<ChevronRight className="h-4 w-4" aria-hidden />} aria-label="Next step">
              Next
            </Button>
          </nav>
        </main>
      </div>
    </div>
  );
}

export default function InsPage() {
  const [aboutOpen, setAboutOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-arka-bg-dark"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-text-soft">
            <li>
              <Link href={routes.home} className="text-arka-text-soft hover:text-arka-cyan transition-colors">Home</Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-arka-text-soft/60" aria-hidden />
              <span className="text-arka-deep font-medium">ARKA-INS</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-semibold text-arka-text">
            ARKA-INS: Utilization Management
          </h1>
          <p className="mt-2 text-arka-text-muted font-sans text-base sm:text-lg max-w-2xl">
            Insurance prior authorization and imaging appropriateness. Run through the RBM workflow with patient selection,
            order entry, pre-submission analysis, denial risk prediction, documentation assistance, and appeal generation.
          </p>
        </header>

        {/* Cross-links */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-arka-text-soft">Other demos:</span>
          {CROSS_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-lg border border-arka-deep/30 bg-arka-deep/5 px-3 py-2 text-arka-cyan transition hover:border-arka-deep hover:bg-arka-deep/10"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* About ARKA-INS panel */}
        <section className="mb-6 sm:mb-8" aria-labelledby="about-arka-ins-heading">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            className="arka-card w-full flex items-center justify-between gap-4 rounded-xl border border-arka-deep/20 p-4 text-left transition-all hover:border-arka-deep/40"
            aria-expanded={aboutOpen}
            aria-controls="about-arka-ins-panel"
            id="about-arka-ins-heading"
          >
            <span className="flex items-center gap-2 font-semibold text-arka-text">
              <Shield className="h-5 w-5 text-arka-deep" aria-hidden />
              About ARKA-INS
            </span>
            <ChevronDown className={cn("h-5 w-5 shrink-0 text-arka-text-soft transition-transform", aboutOpen && "rotate-180")} aria-hidden />
          </button>
          <motion.div
            id="about-arka-ins-panel"
            initial={false}
            animate={{ height: aboutOpen ? "auto" : 0, opacity: aboutOpen ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="arka-card mt-2 rounded-xl border border-arka-deep/20 p-4 sm:p-6 space-y-4 text-arka-text-muted text-sm">
              <p>
                <strong className="text-arka-text">RBM workflow benefits.</strong> ARKA-INS guides prior authorization through evidence-based RBM (Radiology Benefit Management) criteria. 
                You get pre-submission analysis, documentation gap identification, and criteria mapping so submissions are complete before they reach the payer.
              </p>
              <p>
                <strong className="text-arka-text">Prior authorization assistance.</strong> The demo includes denial risk prediction, AI-generated clinical justification, 
                and appeal letter generation. For high-risk cases you see mitigation steps; for denied cases you can generate a structured appeal with cited guidelines.
              </p>
              <p>
                <strong className="text-arka-text">Connection to clinical and educational insights.</strong> ARKA-INS aligns with ARKA-CLIN (imaging appropriateness) and ARKA-ED (education). 
                Appropriate ordering and strong documentation improve approval rates; learning from denial patterns and criteria strengthens future submissions.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Demo content */}
        <InsDemoContent />
      </div>
    </motion.div>
  );
}
