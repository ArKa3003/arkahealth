"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Stethoscope, BookOpen } from "lucide-react";
import { Button } from "./ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";
import { ClinicalVignette } from "./ClinicalVignette";
import { OrderingInterface } from "./OrderingInterface";
import { FeedbackPanel, type FeedbackData } from "./FeedbackPanel";
import { LearningModeToggle } from "./LearningModeToggle";
import { HintSystem, HintButton } from "./HintSystem";
import { TimerBadge, TimeUpModal } from "./QuizTimer";
import { useLearningMode } from "@/lib/demos/ed/hooks/use-learning-mode";
import { clsx } from "clsx";
import type {
  Case,
  ImagingOption,
  CaseImagingRating,
  CaseMode,
} from "@/lib/demos/ed/types";

export interface CaseViewerProps {
  caseData: Case;
  imagingOptions: ImagingOption[];
  imagingRatings: CaseImagingRating[];
  onBack?: () => void;
  className?: string;
}

const QUIZ_DURATION = 5 * 60;
const MAX_HINTS = 3;

export function CaseViewer({
  caseData,
  imagingOptions,
  imagingRatings,
  onBack,
  className,
}: CaseViewerProps) {
  const router = useRouter();
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
    persistMode: true,
  });

  const [selectedImaging, setSelectedImaging] = React.useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [feedbackData, setFeedbackData] = React.useState<FeedbackData | null>(null);
  const [activeTab, setActiveTab] = React.useState("case");
  const [showHintPanel, setShowHintPanel] = React.useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = React.useState(false);
  const [quizTimeRemaining, setQuizTimeRemaining] = React.useState(QUIZ_DURATION);
  const [quizTimerRunning, setQuizTimerRunning] = React.useState(false);

  React.useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  React.useEffect(() => {
    if (mode === "quiz" && !isSubmitted) {
      setQuizTimeRemaining(QUIZ_DURATION);
      setQuizTimerRunning(true);
    } else {
      setQuizTimerRunning(false);
    }
  }, [mode, isSubmitted]);

  React.useEffect(() => {
    if (!quizTimerRunning || isSubmitted) return;
    const interval = setInterval(() => {
      setQuizTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowTimeUpModal(true);
          setQuizTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizTimerRunning, isSubmitted]);

  const handleSubmit = () => {
    setQuizTimerRunning(false);
    setShowTimeUpModal(false);

    let bestRating: CaseImagingRating | null = null;
    let acrRating = 1;

    if (selectedImaging.includes("no-imaging")) {
      const optimalIsNone = caseData.optimal_imaging.length === 0;
      acrRating = optimalIsNone ? 9 : 1;
    } else if (selectedImaging.length > 0) {
      const selectedRatings = imagingRatings.filter((r) =>
        selectedImaging.includes(r.imaging_option_id)
      );
      if (selectedRatings.length > 0) {
        bestRating = selectedRatings.reduce((best, curr) =>
          curr.acr_rating > best.acr_rating ? curr : best
        );
        acrRating = bestRating.acr_rating;
      }
    }

    const baseScore = Math.round((acrRating / 9) * 100);
    const hintPenalty = mode === "learning" ? hintsUsed * 5 : 0;
    const score = Math.max(0, baseScore - hintPenalty);
    const isCorrect = acrRating >= 7;

    let ratingCategory: "usually-appropriate" | "may-be-appropriate" | "usually-not-appropriate" | null = null;
    if (acrRating >= 7) ratingCategory = "usually-appropriate";
    else if (acrRating >= 4) ratingCategory = "may-be-appropriate";
    else ratingCategory = "usually-not-appropriate";

    let optimalAcrRating = 9;
    if (caseData.optimal_imaging.length > 0) {
      const optimalRatings = imagingRatings.filter((r) =>
        caseData.optimal_imaging.includes(r.imaging_option_id)
      );
      if (optimalRatings.length > 0) {
        optimalAcrRating = Math.max(...optimalRatings.map((r) => r.acr_rating));
      }
    }

    const feedback: FeedbackData = {
      selectedImaging,
      imagingOptions,
      acrRating,
      ratingCategory,
      isCorrect,
      score,
      optimalImaging: caseData.optimal_imaging,
      optimalAcrRating,
      explanation: caseData.explanation,
      teachingPoints: caseData.teaching_points,
      clinicalPearls: caseData.clinical_pearls,
      references: caseData.references,
      rationale: bestRating?.rationale,
    };

    setFeedbackData(feedback);
    setIsSubmitted(true);
    setActiveTab("order");
  };

  const handleTryAgain = () => {
    setSelectedImaging([]);
    setIsSubmitted(false);
    setFeedbackData(null);
    resetHints();
    setActiveTab("order");
    if (mode === "quiz") {
      setQuizTimeRemaining(QUIZ_DURATION);
      setQuizTimerRunning(true);
    }
  };

  const handleNextCase = () => {
    if (onBack) onBack();
    else router.push("/ed");
  };

  const handleReviewCase = () => {
    setActiveTab("case");
  };

  const hintsAvailable = caseData.hints?.length ?? 0;

  return (
    <>
      <TimeUpModal isOpen={showTimeUpModal} onSubmit={handleSubmit} />

      <div className={clsx("flex flex-col min-h-[70vh] bg-arka-bg-dark", className)}>
        <header className="border-b border-arka-primary/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack ?? (() => router.push("/ed"))}
              className="text-arka-text-muted shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-1 shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-6 w-px bg-arka-primary/20 hidden sm:block" />
            <h1 className="font-semibold text-arka-text line-clamp-1 text-sm sm:text-base truncate">
              {caseData.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {mode === "quiz" && !isSubmitted && (
              <TimerBadge remaining={quizTimeRemaining} />
            )}
            {mode === "learning" && !isSubmitted && hintsAvailable > 0 && (
              <HintButton
                hintsAvailable={hintsAvailable}
                hintsUsed={hintsUsed}
                onClick={() => setShowHintPanel(!showHintPanel)}
                disabled={isSubmitted}
              />
            )}
            <LearningModeToggle
              mode={mode}
              onModeChange={setMode}
              disabled={isSubmitted}
            />
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Desktop: split */}
          <div className="hidden lg:flex flex-1 min-h-0">
            <div className="w-[60%] border-r border-slate-200 overflow-y-auto bg-slate-50">
              <div className="p-6">
                <ClinicalVignette
                  caseData={caseData}
                  mode={mode}
                  hintsRevealed={hintsUsed}
                  onRevealHint={revealHint}
                />
              </div>
            </div>
            <div className="w-[40%] flex flex-col bg-white min-h-0 border-l border-slate-200">
              <AnimatePresence>
                {showHintPanel && mode === "learning" && !isSubmitted && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-arka-primary/20 overflow-hidden"
                  >
                    <div className="p-4">
                      <HintSystem
                        hints={caseData.hints ?? []}
                        maxHints={MAX_HINTS}
                        hintsRevealed={hintsUsed}
                        onRevealHint={revealHint}
                        disabled={false}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex-1 overflow-y-auto min-h-0">
                <AnimatePresence mode="wait">
                  {isSubmitted && feedbackData ? (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full"
                    >
                      <FeedbackPanel
                        feedback={feedbackData}
                        onTryAgain={mode === "learning" ? handleTryAgain : undefined}
                        onNextCase={handleNextCase}
                        onReviewCase={handleReviewCase}
                        canTryAgain={mode === "learning"}
                        showAllOptions={mode === "learning"}
                        allRatings={imagingRatings.map((r) => ({
                          imagingOptionId: r.imaging_option_id,
                          acrRating: r.acr_rating,
                          rationale: r.rationale,
                        }))}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ordering"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full"
                    >
                      <OrderingInterface
                        imagingOptions={imagingOptions}
                        selectedImaging={selectedImaging}
                        onSelectionChange={setSelectedImaging}
                        onSubmit={handleSubmit}
                        mode={mode as CaseMode}
                        disabled={isSubmitted}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile: tabs */}
          <div className="lg:hidden flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList variant="segmented" className="mx-4 mt-4">
                <TabsTrigger value="case" className="flex-1 gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Case
                </TabsTrigger>
                <TabsTrigger value="order" className="flex-1 gap-2">
                  <BookOpen className="w-4 h-4" />
                  {isSubmitted ? "Feedback" : "Order"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="case" className="flex-1 overflow-y-auto p-4 mt-2">
                {mode === "learning" && !isSubmitted && hintsAvailable > 0 && (
                  <div className="mb-4">
                    <HintSystem
                      hints={caseData.hints ?? []}
                      maxHints={MAX_HINTS}
                      hintsRevealed={hintsUsed}
                      onRevealHint={revealHint}
                      disabled={false}
                    />
                  </div>
                )}
                <ClinicalVignette
                  caseData={caseData}
                  mode={mode}
                  hintsRevealed={hintsUsed}
                  onRevealHint={revealHint}
                />
              </TabsContent>

              <TabsContent value="order" className="flex-1 flex flex-col mt-2 min-h-0 data-[state=inactive]:hidden">
                <AnimatePresence mode="wait">
                  {isSubmitted && feedbackData ? (
                    <FeedbackPanel
                      key="feedback"
                      feedback={feedbackData}
                      onTryAgain={mode === "learning" ? handleTryAgain : undefined}
                      onNextCase={handleNextCase}
                      onReviewCase={handleReviewCase}
                      canTryAgain={mode === "learning"}
                      showAllOptions={mode === "learning"}
                      allRatings={imagingRatings.map((r) => ({
                        imagingOptionId: r.imaging_option_id,
                        acrRating: r.acr_rating,
                        rationale: r.rationale,
                      }))}
                    />
                  ) : (
                    <div key="ordering" className="flex-1 min-h-0 flex flex-col">
                      <OrderingInterface
                        imagingOptions={imagingOptions}
                        selectedImaging={selectedImaging}
                        onSelectionChange={setSelectedImaging}
                        onSubmit={handleSubmit}
                        mode={mode as CaseMode}
                        disabled={isSubmitted}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
