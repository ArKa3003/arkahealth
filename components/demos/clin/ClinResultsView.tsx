"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb, FileText, Copy } from "lucide-react";
import type { ClinicalScenario, EvaluationResult } from "@/lib/demos/clin/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { ClinAppropriatenessIndicator } from "./ClinAppropriatenessIndicator";
import { FDA_COMPLIANCE } from "@/lib/demos/clin/constants/fda-compliance";

interface ClinResultsViewProps {
  result: EvaluationResult;
  scenario: ClinicalScenario;
  onNewEvaluation: () => void;
  onEvaluate: (scenario: ClinicalScenario) => void;
}

export function ClinResultsView({
  result,
  scenario,
  onNewEvaluation,
  onEvaluate,
}: ClinResultsViewProps) {
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const [shapExpanded, setShapExpanded] = useState(true);
  const [showCitations, setShowCitations] = useState(false);

  const {
    appropriatenessScore,
    trafficLight,
    matchedCriteria,
    reasoning,
    alternatives,
    warnings,
    evidenceLinks,
    confidenceLevel,
    coverageStatus,
    shap,
  } = result;

  const oneLineRecommendation =
    appropriatenessScore.category === "usually-appropriate"
      ? `Imaging appropriate — proceed with ${scenario.proposedImaging.modality}`
      : appropriatenessScore.category === "usually-not-appropriate"
        ? `Consider alternatives before ${scenario.proposedImaging.modality}`
        : `May be appropriate — consider clinical context for ${scenario.proposedImaging.modality}`;

  const maxContribution = shap
    ? Math.max(...shap.factors.map((f) => Math.abs(f.contribution)), 1)
    : 1;

  return (
    <div className="space-y-6 animate-fade-in" role="region" aria-label="Evaluation results">
      {/* Advisory */}
      <div
        className="arka-card rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5"
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm sm:text-base text-amber-200 font-medium">
          <strong className="text-amber-100">Advisory Recommendation:</strong> This recommendation is advisory. Clinical judgment should always prevail. Final imaging decisions remain the responsibility of the ordering healthcare provider.
        </p>
      </div>

      {/* New Evaluation button */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onNewEvaluation}>
          New Evaluation
        </Button>
      </div>

      {/* Score card */}
      <Card variant="elevated">
        <div
          className={`
            p-4 sm:p-6 md:p-8 border-l-4 rounded-t-xl
            ${trafficLight === "green" ? "border-arka-cyan bg-arka-cyan/10" : ""}
            ${trafficLight === "yellow" ? "border-amber-500 bg-amber-500/10" : ""}
            ${trafficLight === "red" ? "border-red-500 bg-red-500/10" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <ClinAppropriatenessIndicator
              trafficLight={trafficLight}
              score={appropriatenessScore.value}
            />
            <div className="text-center w-full">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-arka-text mb-2">
                {oneLineRecommendation}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <Badge variant="info" size="sm">
                  {coverageStatus.replace(/_/g, " ")}
                </Badge>
                <Badge variant="info" size="sm">
                  {confidenceLevel} confidence
                </Badge>
              </div>
              <p className="mt-3 text-sm text-arka-text-muted font-sans">
                This guidance supports clinical decision-making. It does not constitute medical advice or replace physician judgment.
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* AIIE Evidence Basis */}
          <div className="arka-card rounded-lg border border-arka-primary/20 p-4">
            <h3 className="font-semibold text-arka-text mb-2">AIIE Evidence Basis</h3>
            <p className="text-arka-text-muted text-sm sm:text-base mb-2">
              <strong className="text-arka-text">Topic:</strong> {matchedCriteria.topic}
              {matchedCriteria.variant && ` — ${matchedCriteria.variant}`}
            </p>
            <p className="text-arka-text-muted text-sm">
              <strong className="text-arka-text">Based on:</strong> {matchedCriteria.source}
            </p>
          </div>

          {/* Detailed Reasoning (collapsible) */}
          <div className="border-t border-arka-primary/20 pt-4">
            <button
              type="button"
              onClick={() => setReasoningExpanded(!reasoningExpanded)}
              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/5 transition-colors min-h-[44px] text-left"
              aria-expanded={reasoningExpanded}
            >
              <h3 className="font-semibold text-arka-text">
                {reasoningExpanded ? "Hide" : "Show"} Detailed Clinical Reasoning
              </h3>
              <span className="text-arka-text-soft" aria-hidden>
                {reasoningExpanded ? "▼" : "▶"}
              </span>
            </button>
            {reasoningExpanded && (
              <ul className="space-y-2 mt-3 pl-2">
                {reasoning.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-arka-text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-arka-cyan" />
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SHAP Explanation */}
      {shap && (
        <Card>
          <button
            type="button"
            onClick={() => setShapExpanded(!shapExpanded)}
            className="w-full flex items-center justify-between p-4 sm:p-6 gap-2 min-h-[44px] text-left"
            aria-expanded={shapExpanded}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-arka-cyan" aria-hidden />
              <div>
                <h3 className="font-semibold text-arka-text">Why This Score? (SHAP Explanation)</h3>
                <p className="text-sm text-arka-text-soft">Transparent scoring — see how each factor contributed</p>
              </div>
            </div>
            <span className="text-arka-text-soft">{shapExpanded ? "▲" : "▼"}</span>
          </button>
          {shapExpanded && (
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-arka-bg-medium/50 rounded-lg">
                <span className="text-arka-text-muted font-medium">Baseline Score:</span>
                <span className="font-mono font-medium text-arka-text">{shap.baselineScore.toFixed(1)}</span>
              </div>
              <div className="space-y-4">
                {shap.factors.map((factor, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm sm:text-base">
                      <span className="font-medium text-arka-text-muted">{factor.name}</span>
                      <span
                        className={`font-mono font-medium ${
                          factor.contribution > 0
                            ? "text-arka-cyan"
                            : factor.contribution < 0
                              ? "text-red-400"
                              : "text-arka-text-soft"
                        }`}
                      >
                        {factor.contribution > 0 ? "+" : ""}
                        {factor.contribution.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-6 bg-arka-bg-medium rounded relative overflow-hidden">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-arka-primary/30" />
                        <div
                          className={`absolute top-0 h-full ${
                            factor.contribution > 0 ? "bg-arka-cyan/50 left-1/2" : "bg-red-500/50 right-1/2"
                          }`}
                          style={{
                            width: `${(Math.abs(factor.contribution) / maxContribution) * 50}%`,
                            ...(factor.contribution < 0 ? { right: "50%", left: "auto" } : {}),
                          }}
                        />
                      </div>
                      <span className="text-xs text-arka-text-soft w-24 truncate" title={factor.value}>
                        {factor.value}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-arka-text-soft mt-1">{factor.explanation}</p>
                    {showCitations && (
                      <p className="text-xs text-arka-cyan flex items-center gap-1 font-medium mt-1">
                        <FileText className="h-3 w-3" />
                        {factor.evidenceCitation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 bg-arka-bg-medium rounded-lg">
                <span className="text-arka-text-muted">Final Score:</span>
                <span className="font-mono font-bold text-arka-text text-lg">{shap.finalScore} / 9</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCitations(!showCitations)}
                className="text-sm text-arka-cyan hover:underline font-medium flex items-center gap-1 min-h-[44px]"
              >
                <FileText className="h-4 w-4" />
                {showCitations ? "Hide" : "Show"} evidence citations
              </button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-arka-text">Alternative Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-arka-text-muted text-sm sm:text-base mb-4">
              Based on AIIE evidence, consider these alternatives to{" "}
              <strong className="text-arka-text">{scenario.proposedImaging.modality}</strong>:
            </p>
            <div className="space-y-4">
              {alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="arka-card p-4 rounded-lg border border-arka-primary/20 flex flex-col sm:flex-row items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-arka-text">{alt.procedure}</span>
                      <Badge
                        variant={alt.rating >= 7 ? "success" : alt.rating >= 4 ? "warning" : "error"}
                        size="sm"
                      >
                        {alt.rating}/9
                      </Badge>
                    </div>
                    <p className="text-sm text-arka-text-muted mb-2">{alt.reasoning}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-arka-text-soft">Cost: {alt.costComparison}</span>
                      <span className="text-arka-text-soft">Radiation: {alt.radiationComparison}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto shrink-0"
                    onClick={() => {
                      const modality = alt.procedure as ClinicalScenario["proposedImaging"]["modality"];
                      const updated: ClinicalScenario = {
                        ...scenario,
                        proposedImaging: {
                          ...scenario.proposedImaging,
                          modality,
                        },
                      };
                      onEvaluate(updated);
                    }}
                  >
                    Switch to this order
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-arka-text">Alerts & Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    w.severity === "critical"
                      ? "bg-red-500/10 border-red-500/40"
                      : w.severity === "warning"
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-arka-primary/10 border-arka-primary/30"
                  }`}
                  role={w.severity === "critical" ? "alert" : "status"}
                >
                  <Badge
                    variant={
                      w.severity === "critical" ? "error" : w.severity === "warning" ? "warning" : "info"
                    }
                    size="sm"
                  >
                    {w.type.replace(/-/g, " ")}
                  </Badge>
                  <p className="mt-2 text-sm font-medium text-arka-text-muted">{w.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence & Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-arka-text">
            Evidence & Guidelines
            <span className="ml-2 text-sm font-normal text-arka-text-soft">(Independent review source)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-arka-text-muted text-sm mb-4">
            The following resources support this recommendation and allow you to independently verify the clinical basis:
          </p>
          <div className="space-y-2">
            {evidenceLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border border-arka-primary/20 hover:border-arka-cyan/40 hover:bg-arka-cyan/5 transition-colors min-h-[44px]"
              >
                <span className="text-arka-cyan">
                  {link.type === "guideline" ? "📋" : link.type === "study" ? "📄" : "✓"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-arka-cyan hover:underline truncate">{link.title}</p>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-4 p-3 arka-card rounded-lg">
            <p className="text-sm text-arka-text-muted">
              <strong className="text-arka-text">Transparency Notice:</strong> AIIE uses RAND/UCLA methodology with peer-reviewed evidence. All scoring factors are transparent. You maintain complete authority over clinical decisions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Copy justification */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            const text = `CLINICAL JUSTIFICATION FOR IMAGING ORDER\n==========================================\n\nPatient: ${scenario.age} year old ${scenario.sex}\nChief Complaint: ${scenario.chiefComplaint}\nDuration: ${scenario.duration}\nProposed Imaging: ${scenario.proposedImaging.modality} - ${scenario.proposedImaging.bodyPart}\n\nRECOMMENDATION: ${oneLineRecommendation}\n\nAIIE Appropriateness Score: ${appropriatenessScore.value}/9\nConfidence Level: ${confidenceLevel}\nCoverage Status: ${coverageStatus}\n\nGenerated by ARKA Imaging Intelligence Engine (AIIE) Clinical Decision Support\n\n${FDA_COMPLIANCE.PRINT_AND_COPY_DISCLAIMER}`;
            navigator.clipboard.writeText(text);
          }}
        >
          <Copy className="h-4 w-4 mr-2" aria-hidden />
          Copy Clinical Justification
        </Button>
      </div>

      {/* Methodology badge */}
      <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-arka-primary/30 bg-arka-bg-medium/50 px-3 py-2 text-sm text-arka-text-muted">
        <span className="font-semibold text-arka-text">AIIE v{FDA_COMPLIANCE.VERSION.aiie}</span>
        <span aria-hidden>|</span>
        <span>{FDA_COMPLIANCE.VERSION.methodology}</span>
        <span aria-hidden>|</span>
        <span>Evidence: {FDA_COMPLIANCE.VERSION.evidenceUpdate}</span>
      </div>
    </div>
  );
}
