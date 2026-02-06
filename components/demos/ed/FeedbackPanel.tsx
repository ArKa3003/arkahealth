"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import { ACRRatingBadge, ACRRatingScale } from "./ACRRatingBadge";
import { RadiationBadge } from "./RadiationBadge";
import { clsx } from "clsx";
import type { ACRCategory, ClinicalPearl, ImagingOption, Reference } from "@/lib/demos/ed/types";

export interface FeedbackData {
  selectedImaging: string[];
  imagingOptions: ImagingOption[];
  acrRating: number | null;
  ratingCategory: ACRCategory | null;
  isCorrect: boolean;
  score: number;
  optimalImaging: string[];
  optimalAcrRating?: number;
  explanation: string;
  teachingPoints: string[];
  clinicalPearls?: ClinicalPearl[] | null;
  references?: Reference[];
  rationale?: string;
}

export interface FeedbackPanelProps {
  feedback: FeedbackData;
  onTryAgain?: () => void;
  onNextCase?: () => void;
  onReviewCase?: () => void;
  canTryAgain?: boolean;
  showAllOptions?: boolean;
  allRatings?: Array<{ imagingOptionId: string; acrRating: number; rationale: string }>;
  className?: string;
}

export function FeedbackPanel({
  feedback,
  onTryAgain,
  onNextCase,
  onReviewCase,
  canTryAgain = true,
  showAllOptions = false,
  allRatings = [],
  className,
}: FeedbackPanelProps) {
  const [showAllComparison, setShowAllComparison] = React.useState(false);
  const [animatedScore, setAnimatedScore] = React.useState(0);

  const selectedOptions = feedback.imagingOptions.filter((opt) =>
    feedback.selectedImaging.includes(opt.id)
  );
  const optimalOptions = feedback.imagingOptions.filter((opt) =>
    feedback.optimalImaging.includes(opt.id)
  );

  React.useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.floor(eased * feedback.score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [feedback.score]);

  const getResultMessage = () => {
    if (feedback.score >= 90) return "Excellent!";
    if (feedback.score >= 70) return "Good Thinking!";
    if (feedback.score >= 50) return "Getting There";
    return "Let's Review";
  };

  const ResultIcon = feedback.isCorrect
    ? CheckCircle
    : feedback.ratingCategory === "may-be-appropriate"
      ? AlertTriangle
      : XCircle;

  const resultBgClass = feedback.isCorrect
    ? "from-arka-cyan/40 to-arka-primary/40"
    : feedback.ratingCategory === "may-be-appropriate"
      ? "from-amber-500/40 to-orange-500/40"
      : "from-red-500/40 to-rose-500/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("flex flex-col h-full overflow-y-auto p-4 space-y-4", className)}
    >
      {/* Result Header */}
      <div
        className={clsx(
          "rounded-xl p-6 text-center relative overflow-hidden bg-gradient-to-br",
          resultBgClass,
          "border border-arka-primary/20"
        )}
      >
        <ResultIcon className="w-12 h-12 mx-auto mb-3 text-white" />
        <h3 className="text-xl font-bold text-white mb-1">{getResultMessage()}</h3>
        <div className="flex items-center justify-center gap-2 text-slate-200">
          <span className="text-3xl font-bold text-white">{animatedScore}</span>
          <span className="text-lg">/100</span>
        </div>
      </div>

      {/* ACR Rating Scale */}
      {feedback.acrRating != null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ACR Appropriateness Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <ACRRatingScale
              userRating={feedback.acrRating}
              optimalRating={feedback.optimalAcrRating}
              showLegend
              showLabels
            />
          </CardContent>
        </Card>
      )}

      {/* Your Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Your Selection</span>
            {feedback.acrRating != null && (
              <ACRRatingBadge rating={feedback.acrRating} size="sm" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedOptions.length > 0 ? (
            <>
              {selectedOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
                >
                  <span className="font-medium text-slate-900">{opt.short_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      ${opt.typical_cost_usd.toLocaleString()}
                    </span>
                    <RadiationBadge doseMsv={opt.radiation_msv} />
                  </div>
                </div>
              ))}
              {feedback.rationale && (
                <p className="text-sm text-slate-600 italic pt-2 border-t border-slate-200">
                  &ldquo;{feedback.rationale}&rdquo;
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-600">No Imaging Selected</p>
          )}
        </CardContent>
      </Card>

      {/* Better Choice (if not correct) */}
      {!feedback.isCorrect && optimalOptions.length > 0 && (
        <Card variant="bordered" className="border-teal-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-teal-700">
              <Star className="w-4 h-4" />
              Better Choice
              {feedback.optimalAcrRating != null && (
                <ACRRatingBadge rating={feedback.optimalAcrRating} size="sm" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {optimalOptions.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-slate-900">{opt.short_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">
                    ${opt.typical_cost_usd.toLocaleString()}
                  </span>
                  <RadiationBadge doseMsv={opt.radiation_msv} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            Why?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {feedback.explanation}
          </p>
        </CardContent>
      </Card>

      {/* Teaching Points */}
      {feedback.teachingPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-teal-600" />
              Key Teaching Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {feedback.teachingPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* All Options Comparison */}
      {showAllOptions && allRatings.length > 0 && (
        <Card>
          <button
            type="button"
            onClick={() => setShowAllComparison(!showAllComparison)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-xl"
          >
            <span className="font-medium text-slate-900">All Options Comparison</span>
            {showAllComparison ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          <AnimatePresence>
            {showAllComparison && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="pt-0">
                  <TableScrollWrapper aria-label="ACR ratings comparison" className="rounded-lg">
                    <table className="w-full min-w-[360px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 font-medium text-slate-700">
                            Option
                          </th>
                          <th className="text-center py-2 px-2 font-medium text-slate-700">
                            ACR
                          </th>
                          <th className="text-right py-2 px-2 font-medium text-slate-700">
                            Cost
                          </th>
                          <th className="text-right py-2 px-2 font-medium text-slate-700">
                            Radiation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...allRatings]
                          .sort((a, b) => b.acrRating - a.acrRating)
                          .map((rating) => {
                            const opt = feedback.imagingOptions.find(
                              (o) => o.id === rating.imagingOptionId
                            );
                            if (!opt) return null;
                            const isUserChoice = feedback.selectedImaging.includes(opt.id);
                            return (
                              <tr
                                key={opt.id}
                                className={clsx(
                                  "border-b border-slate-200 min-h-[44px]",
                                  isUserChoice && "bg-teal-50"
                                )}
                              >
                                <td className="py-2 px-2">
                                  <span className={clsx(isUserChoice && "font-medium text-slate-900")}>
                                    {opt.short_name}
                                    {isUserChoice && (
                                      <Badge variant="success" size="sm" className="ml-2">
                                        You
                                      </Badge>
                                    )}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <ACRRatingBadge rating={rating.acrRating} size="sm" />
                                </td>
                                <td className="py-2 px-2 text-right text-slate-600">
                                  ${opt.typical_cost_usd.toLocaleString()}
                                </td>
                                <td className="py-2 px-2 text-right text-slate-600">
                                  {opt.radiation_msv} mSv
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </TableScrollWrapper>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        {canTryAgain && onTryAgain && (
          <Button variant="outline" onClick={onTryAgain} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        {onReviewCase && (
          <Button variant="ghost" onClick={onReviewCase} className="gap-2">
            Review Case
          </Button>
        )}
        {onNextCase && (
          <Button onClick={onNextCase} className="gap-2">
            Next Case
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
