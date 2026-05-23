"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";

import {
  isSwallowStudyOrder,
  triageSwallow,
  type SwallowModality,
  type SwallowTriageAssessment,
} from "@/lib/aiie/swallow-triage";
import type { AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export interface SwallowTriageCardProps {
  snapshot: PatientRecordSnapshot;
  order: AIIEOrder;
  complaint: string;
  patientHash: string;
  /** Called when clinician swaps the demo order to FEES bedside. */
  onUseFeesBedside?: () => void;
  /** Called when clinician confirms final modality choice for the order. */
  onClinicianChoice?: (choice: SwallowModality) => void;
}

const MODALITY_LABELS: Record<SwallowModality, string> = {
  VFSS: "VFSS (video fluoroscopic swallow study)",
  FEES: "FEES (bedside fiberoptic endoscopic evaluation)",
  bedside_sle: "Clinical bedside swallow evaluation",
  unknown: "Not specified",
};

function modalityBadgeVariant(
  modality: SwallowModality,
  disagrees: boolean,
): "success" | "warning" | "info" {
  if (disagrees) {
    return "warning";
  }
  if (modality === "bedside_sle") {
    return "info";
  }
  return "success";
}

/**
 * Surfaces VFSS vs FEES vs bedside triage when the order is a swallow instrumental study.
 */
export function SwallowTriageCard({
  snapshot,
  order,
  complaint,
  patientHash,
  onUseFeesBedside,
  onClinicianChoice,
}: SwallowTriageCardProps) {
  const assessment = useMemo(
    () => triageSwallow({ snapshot, order, complaint }),
    [snapshot, order, complaint],
  );

  const [clinicianChoice, setClinicianChoice] = useState<SwallowModality | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [logError, setLogError] = useState<string | null>(null);

  const isSwallowOrder = isSwallowStudyOrder(order.procedure);

  const effectiveChoice = clinicianChoice ?? assessment.proposed;
  const requiresOverride =
    effectiveChoice === "VFSS" &&
    assessment.recommendation === "FEES" &&
    assessment.disagreesWithProposed;

  const persistOverride = useCallback(
    async (choice: SwallowModality, reason?: string) => {
      setLogStatus("saving");
      setLogError(null);
      try {
        const res = await fetch("/api/ins/swallow-overrides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientHash,
            proposed: assessment.proposed,
            recommended: assessment.recommendation,
            clinicianChoice: choice,
            overrideReason: reason,
          }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Failed to record override.");
        }
        setLogStatus("saved");
      } catch (err) {
        setLogStatus("error");
        setLogError(err instanceof Error ? err.message : "Failed to record override.");
      }
    },
    [assessment, patientHash],
  );

  const handleUseFees = useCallback(() => {
    setClinicianChoice("FEES");
    onUseFeesBedside?.();
    onClinicianChoice?.("FEES");
    void persistOverride("FEES");
  }, [onUseFeesBedside, onClinicianChoice, persistOverride]);

  const handleConfirmVfss = useCallback(() => {
    if (requiresOverride && overrideReason.trim().length === 0) {
      return;
    }
    setClinicianChoice("VFSS");
    onClinicianChoice?.("VFSS");
    void persistOverride("VFSS", overrideReason.trim() || undefined);
  }, [requiresOverride, overrideReason, onClinicianChoice, persistOverride]);

  if (!isSwallowOrder) {
    return null;
  }

  return (
    <SwallowTriageCardContent
      assessment={assessment}
      effectiveChoice={effectiveChoice}
      requiresOverride={requiresOverride}
      overrideReason={overrideReason}
      onOverrideReasonChange={setOverrideReason}
      logStatus={logStatus}
      logError={logError}
      onUseFees={handleUseFees}
      onConfirmVfss={handleConfirmVfss}
      showFeesSwap={
        assessment.recommendation === "FEES" &&
        (assessment.proposed === "VFSS" || assessment.proposed === "unknown")
      }
    />
  );
}

interface SwallowTriageCardContentProps {
  assessment: SwallowTriageAssessment;
  effectiveChoice: SwallowModality;
  requiresOverride: boolean;
  overrideReason: string;
  onOverrideReasonChange: (value: string) => void;
  logStatus: "idle" | "saving" | "saved" | "error";
  logError: string | null;
  onUseFees: () => void;
  onConfirmVfss: () => void;
  showFeesSwap: boolean;
}

function SwallowTriageCardContent({
  assessment,
  effectiveChoice,
  requiresOverride,
  overrideReason,
  onOverrideReasonChange,
  logStatus,
  logError,
  onUseFees,
  onConfirmVfss,
  showFeesSwap,
}: SwallowTriageCardContentProps) {
  return (
    <Card className="border-amber-400/50 bg-amber-50/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <CardTitle className="text-arka-text-dark text-base sm:text-lg">
              Swallow study triage (VFSS vs FEES vs bedside)
            </CardTitle>
            <p className="text-sm text-arka-text-dark-muted mt-1">{assessment.rationale}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-arka-primary/15 bg-white p-3">
            <p className="text-xs font-medium text-arka-text-dark-soft mb-1">Proposed order</p>
            <Badge
              variant={modalityBadgeVariant(assessment.proposed, assessment.disagreesWithProposed)}
              size="sm"
            >
              {MODALITY_LABELS[assessment.proposed]}
            </Badge>
          </div>
          <div className="rounded-lg border border-arka-teal/30 bg-white p-3">
            <p className="text-xs font-medium text-arka-text-dark-soft mb-1">ARKA recommends</p>
            <Badge variant="success" size="sm">
              {MODALITY_LABELS[assessment.recommendation]}
            </Badge>
          </div>
        </div>

        {assessment.disagreesWithProposed ?
          <p className="text-sm text-amber-900" role="status">
            The ordered study may exceed the recommended first step. Quality committees can trend
            overrides when VFSS is kept despite a FEES-first recommendation.
          </p>
        : null}

        <ul className="text-xs text-arka-text-dark-muted space-y-1" role="list">
          {assessment.supportingFactors.map((f) => (
            <li key={f.id}>
              <span className="font-medium">{f.name}:</span> {f.evidenceCitation}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          {showFeesSwap ?
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="inline-flex items-center gap-1"
              onClick={onUseFees}
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden />
              Use FEES bedside instead
            </Button>
          : null}
          {requiresOverride ?
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={overrideReason.trim().length === 0 || logStatus === "saving"}
              onClick={onConfirmVfss}
            >
              Keep VFSS (log override)
            </Button>
          : null}
        </div>

        {requiresOverride ?
          <div>
            <label
              htmlFor="swallow-override-reason"
              className="block text-sm font-medium text-arka-text-dark mb-1"
            >
              Override rationale <span className="text-red-600">*</span>
            </label>
            <textarea
              id="swallow-override-reason"
              rows={2}
              maxLength={512}
              value={overrideReason}
              onChange={(e) => onOverrideReasonChange(e.target.value)}
              placeholder="e.g. posterior fossa stroke, failed bedside screen, patient unable to participate in FEES"
              className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark text-sm"
              aria-required
            />
            <p className="mt-1 text-xs text-arka-text-dark-soft">
              Required when keeping VFSS after FEES was recommended. No patient identifiers are stored.
            </p>
          </div>
        : null}

        {effectiveChoice !== assessment.proposed && logStatus === "saved" ?
          <p className="text-xs text-arka-teal" role="status">
            Choice recorded for quality trending ({MODALITY_LABELS[effectiveChoice]}).
          </p>
        : null}
        {logError ?
          <p className="text-xs text-red-600" role="alert">
            {logError}
          </p>
        : null}

        <p className="text-xs text-arka-text-dark-soft border-t border-arka-primary/10 pt-3">
          {FDA_NON_DEVICE_CDS_DISCLOSURE}
        </p>
      </CardContent>
    </Card>
  );
}
