"use client";

import { useCallback, useMemo, useState } from "react";
import { FileText, Check, X } from "lucide-react";

import { extractClinicalHistory, type ExtractionResult } from "@/lib/nlp/extractClinicalHistory";
import type { AIIERedFlags } from "@/lib/types/aiie";
import { FDA_COMPLIANCE } from "@/lib/demos/clin/constants/fda-compliance";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

/** Demo form red-flag label for each {@link AIIERedFlags} key surfaced by NLP. */
const RED_FLAG_DEMO_LABELS: Partial<Record<keyof AIIERedFlags, string>> = {
  cancerHistory: "History of cancer",
  neurologicalDeficit: "Neurological deficit",
  fever: "Fever",
  weightLoss: "Unexplained weight loss",
  trauma: "Trauma",
  immunocompromised: "Immunocompromised",
  progressiveSymptoms: "Progressive symptoms",
  ivDrugUse: "IV drug use",
  ageOver50: "Age > 50 with new symptoms",
  bladderBowelDysfunction: "Bladder or bowel dysfunction",
};

type ProposalFieldId =
  | "duration"
  | "symptoms"
  | `redFlag:${keyof AIIERedFlags}`
  | "conservativeCare.tried"
  | "conservativeCare.duration";

export interface DocumentationAssistantCardProps {
  onConfirmDuration: (value: string) => void;
  onConfirmSymptoms: (symptomIds: string[]) => void;
  onConfirmRedFlag: (flag: keyof AIIERedFlags, demoLabel: string) => void;
  onConfirmConservativeTried: (tried: boolean) => void;
  onConfirmConservativeDuration: (duration: string) => void;
  /** Optional: append confirmed note text into clinical history for audit. */
  onAuditNote?: (originalText: string) => void;
}

function confidenceVariant(
  confidence: ExtractionResult["confidence"],
): "success" | "warning" | "info" {
  if (confidence === "high") {
    return "success";
  }
  if (confidence === "medium") {
    return "warning";
  }
  return "info";
}

interface ProposalRow {
  id: ProposalFieldId;
  label: string;
  value: string;
}

function buildProposalRows(result: ExtractionResult): ProposalRow[] {
  const rows: ProposalRow[] = [];

  if (result.duration) {
    rows.push({
      id: "duration",
      label: "Symptom duration",
      value: result.duration,
    });
  }

  if (result.symptoms.length > 0) {
    rows.push({
      id: "symptoms",
      label: "Structured symptoms",
      value: result.symptoms.join(", "),
    });
  }

  for (const [key, present] of Object.entries(result.redFlags) as [keyof AIIERedFlags, boolean][]) {
    if (!present) {
      continue;
    }
    const demoLabel = RED_FLAG_DEMO_LABELS[key];
    rows.push({
      id: `redFlag:${key}`,
      label: demoLabel ?? key,
      value: "Present",
    });
  }

  if (result.conservativeCare?.tried) {
    rows.push({
      id: "conservativeCare.tried",
      label: "Conservative care attempted",
      value: "Yes",
    });
  }

  if (result.conservativeCare?.duration) {
    rows.push({
      id: "conservativeCare.duration",
      label: "Conservative care duration",
      value: result.conservativeCare.duration,
    });
  }

  return rows;
}

/**
 * Client-side documentation assistant: deterministic NLP proposals from pasted notes.
 * Nothing is applied until the clinician confirms each field.
 */
export function DocumentationAssistantCard({
  onConfirmDuration,
  onConfirmSymptoms,
  onConfirmRedFlag,
  onConfirmConservativeTried,
  onConfirmConservativeDuration,
  onAuditNote,
}: DocumentationAssistantCardProps) {
  const [noteText, setNoteText] = useState("");
  const [auditText, setAuditText] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<ProposalFieldId>>(new Set());

  const proposalRows = useMemo(
    () => (extraction ? buildProposalRows(extraction) : []),
    [extraction],
  );

  const pendingRows = useMemo(
    () => proposalRows.filter((row) => !resolvedIds.has(row.id)),
    [proposalRows, resolvedIds],
  );

  const handleExtract = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      setExtraction(null);
      setAuditText(null);
      return;
    }
    setAuditText(trimmed);
    setExtraction(extractClinicalHistory(trimmed));
    setResolvedIds(new Set());
  }, [noteText]);

  const handleConfirm = useCallback(
    (row: ProposalRow) => {
      if (!extraction) {
        return;
      }

      switch (row.id) {
        case "duration":
          if (extraction.duration) {
            onConfirmDuration(extraction.duration);
          }
          break;
        case "symptoms":
          onConfirmSymptoms(extraction.symptoms);
          break;
        case "conservativeCare.tried":
          onConfirmConservativeTried(true);
          break;
        case "conservativeCare.duration":
          if (extraction.conservativeCare?.duration) {
            onConfirmConservativeDuration(extraction.conservativeCare.duration);
          }
          break;
        default: {
          if (row.id.startsWith("redFlag:")) {
            const flag = row.id.replace("redFlag:", "") as keyof AIIERedFlags;
            const demoLabel = RED_FLAG_DEMO_LABELS[flag] ?? row.label;
            onConfirmRedFlag(flag, demoLabel);
          }
          break;
        }
      }

      if (auditText && onAuditNote) {
        onAuditNote(auditText);
      }

      setResolvedIds((prev) => new Set(prev).add(row.id));
    },
    [
      extraction,
      auditText,
      onConfirmDuration,
      onConfirmSymptoms,
      onConfirmRedFlag,
      onConfirmConservativeTried,
      onConfirmConservativeDuration,
      onAuditNote,
    ],
  );

  const handleReject = useCallback((id: ProposalFieldId) => {
    setResolvedIds((prev) => new Set(prev).add(id));
  }, []);

  return (
    <Card className="border-arka-light bg-white">
      <CardHeader>
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-arka-teal flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <CardTitle className="text-arka-text-dark text-base sm:text-lg">
              Documentation assistant
            </CardTitle>
            <p className="text-sm text-arka-text-dark-muted mt-1">
              Paste a clinician note to propose structured history fields. Review and confirm each
              item — nothing is applied until you confirm.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="clin-doc-assistant-note" className="block text-sm font-medium text-arka-text-dark mb-1">
            Clinician note
          </label>
          <textarea
            id="clin-doc-assistant-note"
            rows={4}
            maxLength={2000}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Paste HPI, assessment, or progress note excerpt…"
            className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
          />
          <p className="mt-1 text-xs text-arka-text-dark-soft">{noteText.length}/2000</p>
        </div>

        <Button type="button" variant="secondary" size="sm" onClick={handleExtract}>
          Extract
        </Button>

        {extraction && proposalRows.length > 0 ?
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-arka-text-dark-muted">Extraction confidence:</span>
            <Badge variant={confidenceVariant(extraction.confidence)} size="sm">
              {extraction.confidence}
            </Badge>
          </div>
        : null}

        {extraction && proposalRows.length === 0 ?
          <p className="text-sm text-arka-text-dark-muted" role="status">
            No structured fields were detected in this note. Try adding symptom duration, red flags,
            or conservative-care wording.
          </p>
        : null}

        {pendingRows.length > 0 ?
          <ul className="space-y-3" role="list">
            {pendingRows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-arka-primary/20 bg-white p-4"
              >
                <p className="text-sm font-medium text-arka-text-dark mb-1">{row.label}</p>
                <p className="text-sm text-arka-teal mb-3">
                  Proposed: <span className="font-medium">{row.value}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-1"
                    onClick={() => handleConfirm(row)}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center gap-1"
                    onClick={() => handleReject(row.id)}
                  >
                    <X className="h-4 w-4" aria-hidden />
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        : null}

        {auditText ?
          <details className="text-xs text-arka-text-dark-soft">
            <summary className="cursor-pointer font-medium text-arka-text-dark-muted">
              Source note (audit)
            </summary>
            <p className="mt-2 whitespace-pre-wrap rounded border border-arka-primary/10 bg-arka-pale/50 p-2">
              {auditText}
            </p>
          </details>
        : null}

        <p className="text-xs text-arka-text-dark-soft border-t border-arka-primary/10 pt-3">
          {FDA_COMPLIANCE.BANNER_TEXT}. {FDA_COMPLIANCE.PRINT_AND_COPY_DISCLAIMER}
        </p>
      </CardContent>
    </Card>
  );
}
