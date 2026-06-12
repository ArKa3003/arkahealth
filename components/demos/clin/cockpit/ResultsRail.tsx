"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRightLeft, CheckCircle2, Copy, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ClinicalScenario, EvaluationResult } from "@/lib/demos/clin/types";
import { clinicalScenarioToAIIEOrder } from "@/lib/demos/clin/clin-aiie-order";
import { buildClinDemoRecordSnapshot } from "@/lib/demos/clin/clin-record-snapshot";
import { detectIncidentals, incidentalFindingKey } from "@/lib/aiie/incidentals";
import { IncidentalFollowupCard } from "@/components/shared/IncidentalFollowupCard";
import { PriorImagingControlSheetGate } from "@/components/shared/PriorImagingControlSheet";
import { FDA_COMPLIANCE } from "@/lib/demos/clin/constants/fda-compliance";
import { routes } from "@/lib/constants";
import { DenialRiskGauge } from "./DenialRiskGauge";
import { ShapFactorBreakdown } from "./ShapFactorBreakdown";
import { getRecommendationState } from "./clin-cockpit-utils";

export interface ResultsRailProps {
  result: EvaluationResult | null;
  scenario: ClinicalScenario | null;
  isLoading: boolean;
  onNewEvaluation: () => void;
  onSwitchOrder: (scenario: ClinicalScenario) => void;
  compact?: boolean;
  className?: string;
}

const stateStyles = {
  appropriate: {
    border: "border-l-success",
    bg: "bg-success-bg",
    icon: CheckCircle2,
    iconClass: "text-success",
    label: "Appropriate",
  },
  conditional: {
    border: "border-l-warning",
    bg: "bg-warning-bg",
    icon: AlertTriangle,
    iconClass: "text-warning",
    label: "Conditionally appropriate",
  },
  "low-value": {
    border: "border-l-danger",
    bg: "bg-danger-bg",
    icon: AlertTriangle,
    iconClass: "text-danger",
    label: "Low-value order",
  },
} as const;

/**
 * Right rail — AIIE score ring, denial-risk gauge, SHAP breakdown, recommendation card.
 */
export function ResultsRail({
  result,
  scenario,
  isLoading,
  onNewEvaluation,
  onSwitchOrder,
  compact = false,
  className,
}: ResultsRailProps) {
  const [dismissedIncidentalKeys, setDismissedIncidentalKeys] = React.useState<Set<string>>(() => new Set());
  const [incidentalStatus, setIncidentalStatus] = React.useState<string | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
  const [priorImagingOverride, setPriorImagingOverride] = React.useState<string | null>(null);

  const recordSnapshot = React.useMemo(
    () => (scenario ? buildClinDemoRecordSnapshot(scenario) : null),
    [scenario],
  );
  const incidentalFindings = React.useMemo(
    () => (recordSnapshot ? detectIncidentals(recordSnapshot) : []),
    [recordSnapshot],
  );

  if (isLoading) {
    return (
      <aside
        className={cn("space-y-4 lg:w-[360px] lg:shrink-0", className)}
        aria-label="Evaluation results loading"
        aria-busy="true"
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Skeleton className="h-[160px] w-[160px] rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 py-5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
          </CardContent>
        </Card>
      </aside>
    );
  }

  if (!result || !scenario) {
    return (
      <aside
        className={cn("lg:w-[360px] lg:shrink-0", className)}
        aria-label="Evaluation results"
      >
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-caption text-arka-slate-500">
              Results appear here after you evaluate an order.
            </p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  const state = getRecommendationState(result);
  const styles = stateStyles[state];
  const StateIcon = styles.icon;
  const topAlternative = result.alternatives[0];
  const opposingFactors =
    result.shap?.factors.filter((f) => f.contribution < 0 || f.direction === "opposes") ?? [];

  const oneLineRecommendation =
    result.appropriatenessScore.category === "usually-appropriate"
      ? `Proceed with ${scenario.proposedImaging.modality}`
      : result.appropriatenessScore.category === "usually-not-appropriate"
        ? `Reconsider ${scenario.proposedImaging.modality}`
        : `Clinical judgment needed for ${scenario.proposedImaging.modality}`;

  return (
    <aside
      className={cn("space-y-4 lg:w-[360px] lg:shrink-0", className)}
      aria-label="Evaluation results"
      role="region"
    >
      {recordSnapshot ? (
        <PriorImagingControlSheetGate
          snapshot={recordSnapshot}
          proposed={clinicalScenarioToAIIEOrder(scenario)}
          product="CLIN"
          onOverride={(reason) => setPriorImagingOverride(reason)}
        />
      ) : null}

      {incidentalFindings
        .filter((f) => !dismissedIncidentalKeys.has(incidentalFindingKey(f)))
        .map((finding) => (
          <IncidentalFollowupCard
            key={incidentalFindingKey(finding)}
            finding={finding}
            onDismiss={() =>
              setDismissedIncidentalKeys((prev) => new Set(prev).add(incidentalFindingKey(finding)))
            }
            onSchedule={() =>
              setIncidentalStatus(`Follow-up scheduled for ${finding.category} incidental finding.`)
            }
          />
        ))}

      {incidentalStatus ? (
        <p className="sr-only" role="status" aria-live="polite">
          {incidentalStatus}
        </p>
      ) : null}
      {priorImagingOverride ? (
        <p className="rounded-radius-md border border-border-subtle bg-surface-sunken px-3 py-2 text-caption text-arka-slate-700" role="status">
          Prior imaging override recorded: {priorImagingOverride}
        </p>
      ) : null}

      <Card className={cn("border-l-4 animate-fade-in-up", styles.border, styles.bg)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StateIcon className={cn("h-5 w-5", styles.iconClass)} aria-hidden />
              <CardTitle className="text-base">{styles.label}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={onNewEvaluation}
              aria-label="New evaluation"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <ScoreRing score={result.appropriatenessScore.value} size={compact ? 120 : 160} animate />
            <p className="text-center text-sm font-medium text-arka-slate-800">{oneLineRecommendation}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="info" dot>
                {result.confidenceLevel} confidence
              </Badge>
              <Badge variant="neutral">
                {result.coverageStatus.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>

          <DenialRiskGauge aiieScore={result.appropriatenessScore.value} />

          {state === "conditional" && opposingFactors.length > 0 ? (
            <div className="rounded-radius-md border border-warning/30 bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-warning mb-2">
                Conditions to consider
              </p>
              <ul className="space-y-1.5">
                {opposingFactors.slice(0, 4).map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-caption text-arka-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                    {factor.explanation}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {state === "low-value" && topAlternative ? (
            <div className="rounded-radius-md border border-danger/30 bg-surface p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-danger">
                Recommended alternative
              </p>
              <p className="text-sm font-medium text-arka-slate-900">{topAlternative.procedure}</p>
              <p className="text-caption text-arka-slate-600">{topAlternative.reasoning}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  const modality = topAlternative.procedure as ClinicalScenario["proposedImaging"]["modality"];
                  onSwitchOrder({
                    ...scenario,
                    proposedImaging: {
                      ...scenario.proposedImaging,
                      modality,
                    },
                  });
                }}
              >
                <ArrowRightLeft className="h-4 w-4" aria-hidden />
                Switch order
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result.shap ? <ShapFactorBreakdown shap={result.shap} /> : null}

      {result.warnings.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.warnings.slice(0, compact ? 2 : 5).map((w, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-radius-md border px-3 py-2 text-caption",
                  w.severity === "critical" && "border-danger/30 bg-danger-bg text-danger",
                  w.severity === "warning" && "border-warning/30 bg-warning-bg text-arka-slate-800",
                  w.severity === "info" && "border-border-subtle bg-surface-sunken text-arka-slate-700",
                )}
                role={w.severity === "critical" ? "alert" : "status"}
              >
                {w.message}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px] touch-manipulation"
            onClick={async () => {
              const text = `AIIE Score: ${result.appropriatenessScore.value}/9 — ${oneLineRecommendation}\n${FDA_COMPLIANCE.PRINT_AND_COPY_DISCLAIMER}`;
              try {
                await navigator.clipboard.writeText(text);
                setCopyStatus("Justification copied to clipboard.");
              } catch {
                setCopyStatus("Copy failed — select text manually.");
              }
            }}
          >
            <Copy className="h-4 w-4" aria-hidden />
            Copy justification
          </Button>
          {copyStatus ? (
            <span className="sr-only" role="status" aria-live="polite">
              {copyStatus}
            </span>
          ) : null}
          <Link
            href={routes.featureCatalog}
            className="inline-flex min-h-[44px] touch-manipulation items-center rounded-radius-md border border-border-strong px-3 text-xs font-medium text-arka-slate-700 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
          >
            Feature catalog
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
