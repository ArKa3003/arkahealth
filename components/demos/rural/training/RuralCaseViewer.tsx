"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Stethoscope } from "lucide-react";
import { Button } from "@/components/demos/ed/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/demos/ed/ui/Tabs";
import { OrderingInterface } from "@/components/demos/ed/OrderingInterface";
import { FeedbackPanel, type FeedbackData } from "@/components/demos/ed/FeedbackPanel";
import { RuralClinicalVignette } from "@/components/demos/rural/training/RuralClinicalVignette";
import {
  ruralImagingOptionsToEdOptions,
  ruralOptionsToCaseImagingRatings,
} from "@/lib/demos/rural/training/map-rural-to-ed";
import { clsx } from "clsx";
import type { CaseImagingRating } from "@/lib/demos/ed/types";
import type { RuralCase } from "@/lib/demos/rural/types";

export interface RuralCaseViewerProps {
  caseData: RuralCase;
  onBack: () => void;
  className?: string;
}

export function RuralCaseViewer({ caseData, onBack, className }: RuralCaseViewerProps) {
  const imagingOptions = React.useMemo(
    () => ruralImagingOptionsToEdOptions(caseData.imagingOptions),
    [caseData.imagingOptions]
  );
  const imagingRatings = React.useMemo(
    () => ruralOptionsToCaseImagingRatings(caseData.id, caseData.imagingOptions),
    [caseData.id, caseData.imagingOptions]
  );

  const [selectedImaging, setSelectedImaging] = React.useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [feedbackData, setFeedbackData] = React.useState<FeedbackData | null>(null);
  const [activeTab, setActiveTab] = React.useState("case");

  const handleSubmit = () => {
    let acrRating: number | null = null;
    let bestRating: CaseImagingRating | null = null;

    if (selectedImaging.includes("no-imaging")) {
      acrRating = 1;
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

    const baseScore =
      acrRating != null ? Math.round((acrRating / 9) * 100) : 0;
    const score = Math.max(0, baseScore);

    const isOptimalLocal = selectedImaging.includes(caseData.optimalLocalChoice);
    const isCorrect = isOptimalLocal;

    let ratingCategory: FeedbackData["ratingCategory"] = "usually-not-appropriate";
    if (acrRating != null) {
      if (acrRating >= 7) ratingCategory = "usually-appropriate";
      else if (acrRating >= 4) ratingCategory = "may-be-appropriate";
      else ratingCategory = "usually-not-appropriate";
    }

    const optimalLocalOpt = caseData.imagingOptions.find(
      (o) => o.id === caseData.optimalLocalChoice
    );
    const optimalAcrRating = optimalLocalOpt?.casRating ?? 9;

    const selectedRuralIds = selectedImaging.filter((id) => id !== "no-imaging");
    const selectedRuralOpts = caseData.imagingOptions.filter((o) =>
      selectedRuralIds.includes(o.id)
    );
    const primaryRural =
      selectedRuralOpts.length <= 1
        ? selectedRuralOpts[0]
        : selectedRuralOpts.reduce((a, b) => (a.casRating >= b.casRating ? a : b));

    let explanation =
      primaryRural?.feedback.explanation ??
      caseData.teachingPoints[0]?.content ??
      caseData.clinicalPearls[0] ??
      "";

    if (selectedImaging.includes("no-imaging")) {
      explanation =
        "No imaging was selected. In this scenario, further evaluation with locally available studies (e.g., POCUS) is typically indicated when PE remains in the differential after clinical and lab assessment.";
    }

    if (
      !isCorrect &&
      selectedImaging.includes(caseData.optimalOverallChoice) &&
      caseData.optimalOverallChoice !== caseData.optimalLocalChoice
    ) {
      explanation += `\n\nAt this facility, CTPA is not available; the best local next step is ${optimalLocalOpt?.study ?? "POCUS"} to stratify risk and guide transfer.`;
    }

    const teachingPoints = caseData.teachingPoints.map((tp) => `${tp.title}: ${tp.content}`);

    const feedback: FeedbackData = {
      selectedImaging,
      imagingOptions,
      acrRating,
      ratingCategory,
      isCorrect,
      score,
      optimalImaging: [caseData.optimalLocalChoice],
      optimalAcrRating,
      explanation,
      teachingPoints,
      clinicalPearls: caseData.clinicalPearls.map((c) => ({
        content: c,
        category: "clinical-pearl",
      })),
      references: caseData.references.map((r) => ({
        title: r,
        source: "Reference list",
        year: 2026,
      })),
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
    setActiveTab("order");
  };

  const handleNextCase = () => {
    onBack();
  };

  const handleReviewCase = () => {
    setActiveTab("case");
  };

  return (
    <div className={clsx("flex min-h-[60vh] flex-col bg-arka-bg-dark", className)}>
      <header className="flex flex-shrink-0 items-center justify-between border-b border-arka-primary/20 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="shrink-0 text-arka-text-muted"
          >
            <ArrowLeft className="mr-1 h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="hidden h-6 w-px bg-arka-primary/20 sm:block" />
          <h1 className="truncate text-sm font-semibold text-arka-text sm:text-base">
            {caseData.title}
          </h1>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden min-h-0 flex-1 lg:flex">
          <div className="w-[58%] min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
            <div className="p-6">
              <RuralClinicalVignette caseData={caseData} />
            </div>
          </div>
          <div className="flex w-[42%] min-h-0 flex-col border-l border-slate-200 bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto">
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
                      onTryAgain={handleTryAgain}
                      onNextCase={handleNextCase}
                      onReviewCase={handleReviewCase}
                      canTryAgain
                      showAllOptions
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
                      mode="learning"
                      disabled={isSubmitted}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList variant="segmented" className="mx-4 mt-4">
              <TabsTrigger value="case" className="flex-1 gap-2">
                <Stethoscope className="h-4 w-4" />
                Case
              </TabsTrigger>
              <TabsTrigger value="order" className="flex-1 gap-2">
                <BookOpen className="h-4 w-4" />
                {isSubmitted ? "Feedback" : "Order"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="case" className="mt-2 flex-1 overflow-y-auto p-4">
              <RuralClinicalVignette caseData={caseData} />
            </TabsContent>

            <TabsContent
              value="order"
              className="mt-2 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
            >
              <AnimatePresence mode="wait">
                {isSubmitted && feedbackData ? (
                  <FeedbackPanel
                    key="feedback"
                    feedback={feedbackData}
                    onTryAgain={handleTryAgain}
                    onNextCase={handleNextCase}
                    onReviewCase={handleReviewCase}
                    canTryAgain
                    showAllOptions
                    allRatings={imagingRatings.map((r) => ({
                      imagingOptionId: r.imaging_option_id,
                      acrRating: r.acr_rating,
                      rationale: r.rationale,
                    }))}
                  />
                ) : (
                  <div key="ordering" className="flex min-h-0 flex-1 flex-col">
                    <OrderingInterface
                      imagingOptions={imagingOptions}
                      selectedImaging={selectedImaging}
                      onSelectionChange={setSelectedImaging}
                      onSubmit={handleSubmit}
                      mode="learning"
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
  );
}
