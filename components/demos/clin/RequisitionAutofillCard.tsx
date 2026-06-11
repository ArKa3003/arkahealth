"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileSearch, Check, X } from "lucide-react";

import { scoreOrder } from "@/lib/aiie/scoring-engine";
import {
  applyAutofillToInput,
  type AutofillProposal,
  type AutofillProposalField,
} from "@/lib/aiie/requisition-autofill";
import type { AIIEInput, AIIEScore } from "@/lib/types/aiie";
import { FDA_COMPLIANCE } from "@/lib/demos/clin/constants/fda-compliance";
import { bumpCounter } from "@/lib/client/metrics-counters";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export interface RequisitionAutofillCardProps {
  proposal: AutofillProposal;
  baseInput: AIIEInput;
  /** Called when the clinician confirms a single proposed field. */
  onConfirmField: (field: AutofillProposalField) => void;
  /** Called when the clinician rejects a proposed field. */
  onRejectField: (path: string) => void;
  /** Paths already confirmed or rejected (hidden from the proposal list). */
  resolvedPaths: ReadonlySet<string>;
}

function pathLabel(path: string): string {
  switch (path) {
    case "clinicalFactors.duration":
      return "Symptom duration";
    case "clinicalFactors.symptoms":
      return "Structured symptoms";
    case "clinicalFactors.conservativeManagementTried":
      return "Conservative care attempted";
    case "clinicalFactors.conservativeManagementDuration":
      return "Conservative care duration";
    default:
      return path;
  }
}

function confidenceVariant(
  confidence: AutofillProposalField["confidence"],
): "success" | "warning" | "info" {
  if (confidence === "high") {
    return "success";
  }
  if (confidence === "medium") {
    return "warning";
  }
  return "info";
}

/**
 * Surfaces deterministic autofill proposals from the record snapshot; nothing is applied until confirmed.
 */
export function RequisitionAutofillCard({
  proposal,
  baseInput,
  onConfirmField,
  onRejectField,
  resolvedPaths,
}: RequisitionAutofillCardProps) {
  const [previewInput, setPreviewInput] = useState<AIIEInput>(baseInput);
  const [previewScore, setPreviewScore] = useState<AIIEScore | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const pendingFields = useMemo(
    () => proposal.fields.filter((f) => !resolvedPaths.has(f.path)),
    [proposal.fields, resolvedPaths],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setPreviewInput(baseInput), 0);
    return () => window.clearTimeout(t);
  }, [baseInput]);

  useEffect(() => {
    if (pendingFields.length === 0) {
      const t = window.setTimeout(() => setPreviewScore(null), 0);
      return () => window.clearTimeout(t);
    }
    let cancelled = false;
    const boot = window.setTimeout(() => setPreviewLoading(true), 0);
    void scoreOrder(previewInput).then((score) => {
      if (!cancelled) {
        setPreviewScore(score);
        setPreviewLoading(false);
      }
    });
    return () => {
      cancelled = true;
      window.clearTimeout(boot);
    };
  }, [previewInput, pendingFields.length]);

  const handleConfirm = useCallback(
    (field: AutofillProposalField) => {
      const next = applyAutofillToInput(previewInput, field.path, field.value);
      setPreviewInput(next);
      bumpCounter("autofill_field_accepted");
      bumpCounter("autofill_field_decided");
      onConfirmField(field);
    },
    [previewInput, onConfirmField],
  );

  if (pendingFields.length === 0) {
    return null;
  }

  return (
    <Card className="border-arka-cyan/40 bg-arka-pale/30">
      <CardHeader>
        <div className="flex items-start gap-3">
          <FileSearch className="h-5 w-5 text-arka-teal flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <CardTitle className="text-arka-text-dark text-base sm:text-lg">
              Incomplete requisition — proposed fill-ins
            </CardTitle>
            <p className="text-sm text-arka-text-dark-muted mt-1">
              ARKA found documentation in the patient record that may complete this order. Review each
              field and confirm or reject — nothing is applied until you confirm.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3" role="list">
          {pendingFields.map((field) => (
            <li
              key={`${field.path}-${field.value}`}
              className="rounded-lg border border-arka-cyan/25 bg-white p-4 ring-2 ring-arka-cyan/15"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-medium text-arka-text-dark">
                  {pathLabel(field.path)}
                </span>
                <Badge variant={confidenceVariant(field.confidence)} size="sm">
                  {field.confidence} confidence
                </Badge>
                <Badge variant="infoOnLight" size="sm">
                  {field.source.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm text-arka-text-dark font-medium mb-1">
                Proposed: <span className="text-arka-teal">{field.value}</span>
              </p>
              <p className="text-xs text-arka-text-dark-muted mb-3">
                <span className="font-medium">Citation:</span> {field.citation}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="inline-flex items-center gap-1"
                  onClick={() => handleConfirm(field)}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Confirm
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="inline-flex items-center gap-1"
                  onClick={() => {
                    bumpCounter("autofill_field_rejected");
                    bumpCounter("autofill_field_decided");
                    onRejectField(field.path);
                  }}
                >
                  <X className="h-4 w-4" aria-hidden />
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {previewScore ?
          <p className="text-xs text-arka-text-dark-muted" role="status">
            Preview appropriateness after confirmed fields:{" "}
            <strong>{previewScore.clinicalScore}/9</strong>
            {previewLoading ? " (updating…)" : null}
          </p>
        : null}

        <p className="text-xs text-arka-text-dark-soft border-t border-arka-primary/10 pt-3">
          {FDA_COMPLIANCE.BANNER_TEXT}. {FDA_COMPLIANCE.PRINT_AND_COPY_DISCLAIMER}
        </p>
      </CardContent>
    </Card>
  );
}
