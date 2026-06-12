"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft, Clock, Flame, Target } from "lucide-react";

import { ClinicalVignette } from "@/components/demos/ed/ClinicalVignette";
import type { EdCockpitCase } from "@/components/demos/ed/ed-cockpit-cases";
import type { EdCaseEvaluationBundle } from "@/components/demos/ed/ed-cockpit-utils";
import { vitalsChips } from "@/components/demos/ed/ed-cockpit-utils";
import { HintButton, HintSystem } from "@/components/demos/ed/HintSystem";
import { LearningModeToggle } from "@/components/demos/ed/LearningModeToggle";
import { OrderingInterface } from "@/components/demos/ed/OrderingInterface";
import {
  PracticeFeedbackPanel,
  PracticeSummary,
} from "@/components/demos/ed/PracticeFeedbackPanel";
import { TimerBadge, TimeUpModal } from "@/components/demos/ed/QuizTimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { useLearningMode } from "@/lib/demos/ed/hooks/use-learning-mode";
import {
  acrRatingForSelection,
  appendPracticeResult,
  DIFFICULTY_EST_MINUTES,
  getImagingOptionsForCase,
  getPracticeRatingsForCase,
  isPracticeAnswerCorrect,
  loadPracticeProgress,
  savePracticeProgress,
  type PracticeSessionProgress,
} from "@/lib/demos/ed/practice-utils";
import type { CaseMode } from "@/lib/demos/ed/types";
import { cn } from "@/lib/utils";

const QUIZ_DURATION = 5 * 60;
const MAX_HINTS = 3;
const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type PracticePhase = "picker" | "active" | "summary";

export interface PracticeModeProps {
  cases: EdCockpitCase[];
  evaluations: Record<string, EdCaseEvaluationBundle>;
}

const DIFFICULTY_LABEL: Record<
  EdCockpitCase["case"]["difficulty"],
  string
> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/**
 * Guided practice flow — scenario picker, vignette quiz, AIIE feedback, session score.
 */
export function PracticeMode({ cases, evaluations }: PracticeModeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<PracticePhase>("picker");
  const [activeCaseId, setActiveCaseId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<PracticeSessionProgress>({
    answeredCaseIds: [],
    results: [],
    streak: 0,
    bestStreak: 0,
  });
  const [selectedImaging, setSelectedImaging] = React.useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [showHintPanel, setShowHintPanel] = React.useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = React.useState(false);
  const [quizTimeRemaining, setQuizTimeRemaining] = React.useState(QUIZ_DURATION);
  const [quizTimerRunning, setQuizTimerRunning] = React.useState(false);
  const [showCompletionPulse, setShowCompletionPulse] = React.useState(false);
  const [submitSnapshot, setSubmitSnapshot] = React.useState<{
    isCorrect: boolean;
    acrRating: number;
  } | null>(null);

  const pickerRef = React.useRef<HTMLElement>(null);
  const pickerInView = useInView(pickerRef, { once: true, margin: "-80px" });

  const {
    mode,
    setMode,
    hintsUsed,
    revealHint,
    resetHints,
    startTimer,
    stopTimer,
    reset: resetLearningMode,
  } = useLearningMode({
    initialMode: "learning",
    maxHints: MAX_HINTS,
    quizDuration: QUIZ_DURATION,
    persistMode: false,
  });

  React.useEffect(() => {
    setProgress(loadPracticeProgress());
  }, []);

  React.useEffect(() => {
    savePracticeProgress(progress);
  }, [progress]);

  React.useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  React.useEffect(() => {
    if (phase !== "active" || isSubmitted) {
      setQuizTimerRunning(false);
      return;
    }
    if (mode === "quiz") {
      setQuizTimeRemaining(QUIZ_DURATION);
      setQuizTimerRunning(true);
    } else {
      setQuizTimerRunning(false);
    }
  }, [phase, mode, isSubmitted, activeCaseId]);

  React.useEffect(() => {
    if (!quizTimerRunning || isSubmitted) return;
    const interval = window.setInterval(() => {
      setQuizTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowTimeUpModal(true);
          setQuizTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [quizTimerRunning, isSubmitted]);

  const activeCase = cases.find((entry) => entry.caseId === activeCaseId) ?? null;
  const evaluation = activeCaseId ? evaluations[activeCaseId] ?? null : null;
  const imagingOptions = activeCase
    ? getImagingOptionsForCase(activeCase.case.id)
    : [];
  const ratings = activeCase ? getPracticeRatingsForCase(activeCase.case.id) : [];

  const correctCount = progress.results.filter((result) => result.isCorrect).length;

  const handleSelectScenario = (caseId: string) => {
    setActiveCaseId(caseId);
    setPhase("active");
    setSelectedImaging([]);
    setIsSubmitted(false);
    setSubmitSnapshot(null);
    resetHints();
    resetLearningMode();
    setShowHintPanel(false);
  };

  const handleSingleSelection = (ids: string[]) => {
    if (isSubmitted) return;
    setSelectedImaging(ids.length > 0 ? [ids[ids.length - 1]] : []);
  };

  const handleSubmit = () => {
    if (!activeCase || !evaluation) return;

    setQuizTimerRunning(false);
    setShowTimeUpModal(false);

    const isCorrect = isPracticeAnswerCorrect(activeCase.case, selectedImaging);
    const acrRating = acrRatingForSelection(ratings, selectedImaging, activeCase.case);

    setSubmitSnapshot({ isCorrect, acrRating });
    setIsSubmitted(true);

    const nextProgress = appendPracticeResult(progress, {
      caseId: activeCase.caseId,
      selectedImagingId: selectedImaging[0] ?? "none",
      isCorrect,
      acrRating,
      answeredAt: Date.now(),
    });
    setProgress(nextProgress);
  };

  const handleTryAgain = () => {
    setSelectedImaging([]);
    setIsSubmitted(false);
    setSubmitSnapshot(null);
    resetHints();
    if (mode === "quiz") {
      setQuizTimeRemaining(QUIZ_DURATION);
      setQuizTimerRunning(true);
    }
  };

  const handleNextScenario = () => {
    const next = cases.find(
      (entry) => !progress.answeredCaseIds.includes(entry.caseId),
    );

    if (next) {
      handleSelectScenario(next.caseId);
      return;
    }

    setShowCompletionPulse(true);
    setPhase("summary");
    window.setTimeout(() => setShowCompletionPulse(false), 1400);
  };

  const handleBackToPicker = () => {
    setPhase("picker");
    setActiveCaseId(null);
    setIsSubmitted(false);
    setSubmitSnapshot(null);
    setSelectedImaging([]);
  };

  const handleRestartSession = () => {
    const empty: PracticeSessionProgress = {
      answeredCaseIds: [],
      results: [],
      streak: 0,
      bestStreak: 0,
    };
    setProgress(empty);
    savePracticeProgress(empty);
    handleBackToPicker();
  };

  const hasNextScenario = cases.some(
    (entry) => !progress.answeredCaseIds.includes(entry.caseId),
  );

  const hintsAvailable = activeCase?.case.hints?.length ?? 0;

  return (
    <>
      <TimeUpModal isOpen={showTimeUpModal} onSubmit={handleSubmit} />

      {phase === "active" ? (
        <div
          className="sticky top-[var(--site-nav-height,64px)] z-20 -mx-4 border-b border-border-subtle bg-surface/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          aria-label="Session score"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToPicker}
              className="min-h-[44px] touch-manipulation gap-2 text-arka-slate-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All scenarios
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border-subtle bg-surface-sunken px-3 py-1.5 text-sm font-semibold text-arka-slate-900">
                <Target className="h-4 w-4 text-arka-teal-600" aria-hidden />
                {progress.results.length > 0
                  ? `${correctCount}/${progress.results.length} correct`
                  : "Session in progress"}
              </span>
              {progress.streak > 0 ? (
                <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-arka-teal-200 bg-arka-teal-50 px-3 py-1.5 text-sm font-semibold text-arka-teal-800">
                  <Flame className="h-4 w-4" aria-hidden />
                  {progress.streak} streak
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {phase === "picker" ? (
          <motion.section
            key="picker"
            ref={pickerRef}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8"
            aria-labelledby="practice-picker-heading"
          >
            <motion.div
              initial={fadeIn.initial}
              animate={pickerInView ? { opacity: 1, y: 0 } : {}}
              transition={fadeIn.transition}
            >
              <h2
                id="practice-picker-heading"
                className="text-h2 font-semibold text-arka-slate-900"
              >
                Choose a practice scenario
              </h2>
              <p className="mt-2 max-w-2xl text-arka-slate-600">
                Each vignette mirrors a real ED presentation. Pick the imaging you would order,
                then compare your choice to AIIE scoring and ACR evidence.{" "}
                <Link
                  href="/#aiie"
                  className="font-medium text-arka-teal-700 underline decoration-arka-teal-300 underline-offset-2 transition-colors hover:text-arka-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
                >
                  What is AIIE?
                </Link>
              </p>
            </motion.div>

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cases.map((entry, index) => {
                const answered = progress.answeredCaseIds.includes(entry.caseId);
                const result = progress.results.find(
                  (item) => item.caseId === entry.caseId,
                );
                const chips = vitalsChips(entry.case).slice(0, 3);

                return (
                  <motion.li
                    key={entry.caseId}
                    initial={fadeIn.initial}
                    animate={pickerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      ...fadeIn.transition,
                      delay: prefersReducedMotion ? 0 : 0.08 + index * 0.06,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectScenario(entry.caseId)}
                      className={cn(
                        "flex h-full w-full flex-col rounded-radius-lg border border-border-subtle bg-surface p-5 text-left shadow-elevation-1 transition-[box-shadow,border-color] hover:border-arka-teal-300 hover:shadow-elevation-2",
                        "min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
                        answered && "border-arka-teal-200",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant={answered ? "success" : "secondary"}>
                          {DIFFICULTY_LABEL[entry.case.difficulty]}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-arka-slate-500">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          ~{DIFFICULTY_EST_MINUTES[entry.case.difficulty]} min
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-arka-slate-900">
                        {entry.case.chief_complaint}
                      </h3>
                      <p className="mt-1 text-sm text-arka-slate-600">
                        {entry.case.patient_age}y{" "}
                        {entry.case.patient_sex === "male" ? "M" : "F"} ·{" "}
                        {entry.case.title}
                      </p>
                      {chips.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {chips.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium text-arka-slate-700"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {result ? (
                        <p className="mt-3 text-sm font-semibold text-arka-teal-700">
                          {result.isCorrect ? "Completed · Correct" : "Completed · Review"}
                        </p>
                      ) : null}
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            {progress.results.length >= 3 ? (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCompletionPulse(true);
                    setPhase("summary");
                  }}
                  className="min-h-[44px] touch-manipulation"
                >
                  View session summary ({correctCount}/{progress.results.length})
                </Button>
              </div>
            ) : null}
          </motion.section>
        ) : null}

        {phase === "active" && activeCase && evaluation ? (
          <motion.div
            key={`active-${activeCase.caseId}`}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-h3 font-semibold text-arka-slate-900">
                  {activeCase.case.title}
                </h2>
                <p className="mt-1 text-sm text-arka-slate-600">
                  {activeCase.case.chief_complaint}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mode === "quiz" && !isSubmitted ? (
                  <TimerBadge remaining={quizTimeRemaining} />
                ) : null}
                {mode === "learning" && !isSubmitted && hintsAvailable > 0 ? (
                  <HintButton
                    hintsAvailable={hintsAvailable}
                    hintsUsed={hintsUsed}
                    onClick={() => setShowHintPanel((open) => !open)}
                    disabled={isSubmitted}
                  />
                ) : null}
                <LearningModeToggle
                  mode={mode}
                  onModeChange={setMode}
                  disabled={isSubmitted}
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="rounded-radius-lg border border-border-subtle bg-surface-sunken p-4 sm:p-6">
                <AnimatePresence initial={false}>
                  {showHintPanel && mode === "learning" && !isSubmitted ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                      className="mb-4 overflow-hidden"
                    >
                      <HintSystem
                        hints={activeCase.case.hints ?? []}
                        maxHints={MAX_HINTS}
                        hintsRevealed={hintsUsed}
                        onRevealHint={revealHint}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <ClinicalVignette
                  caseData={activeCase.case}
                  mode={mode}
                  hintsRevealed={hintsUsed}
                  onRevealHint={revealHint}
                />
              </div>

              <div className="rounded-radius-lg border border-border-subtle bg-surface shadow-elevation-1 overflow-hidden min-h-[480px]">
                <AnimatePresence mode="wait" initial={false}>
                  {isSubmitted && submitSnapshot ? (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 sm:p-6"
                    >
                      <PracticeFeedbackPanel
                        caseData={activeCase.case}
                        selectedImagingIds={selectedImaging}
                        imagingOptions={imagingOptions}
                        ratings={ratings}
                        evaluation={evaluation}
                        isCorrect={submitSnapshot.isCorrect}
                        acrRating={submitSnapshot.acrRating}
                        onNextScenario={handleNextScenario}
                        onTryAgain={handleTryAgain}
                        hasNextScenario={hasNextScenario}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ordering"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full min-h-[480px]"
                    >
                      <OrderingInterface
                        imagingOptions={imagingOptions}
                        selectedImaging={selectedImaging}
                        onSelectionChange={handleSingleSelection}
                        onSubmit={handleSubmit}
                        mode={mode as CaseMode}
                        disabled={isSubmitted}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : null}

        {phase === "summary" ? (
          <motion.div
            key="summary"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-10 sm:px-6 lg:px-8"
          >
            <PracticeSummary
              results={progress.results}
              cases={cases}
              onRestart={handleRestartSession}
              onBackToPicker={handleBackToPicker}
              showCompletionPulse={showCompletionPulse}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
