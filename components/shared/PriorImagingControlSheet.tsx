"use client";

import * as React from "react";
import { ExternalLink, FileText } from "lucide-react";

import { FDANonDeviceBanner } from "@/components/shared/compliance/FDANonDeviceBanner";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildPriorImagingControlSheetRows } from "@/lib/aiie/control-sheet-rows";
import { evaluateRedundancy } from "@/lib/aiie/redundancy";
import type { AIIEOrder } from "@/lib/types/aiie";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import { cn } from "@/lib/utils";

export interface PriorImagingControlSheetProps {
  snapshot: PatientRecordSnapshot;
  proposed: AIIEOrder;
  onOverride: (reason: string) => void;
  /** Read-only mini layout for INS provider drawer. */
  variant?: "full" | "mini";
  /** Product context for FDA footer strip. */
  product?: "CLIN" | "INS";
}

const CONTROL_SHEET_MARK = "arka-control-sheet-mount";

function isControlSheetEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ARKA_CONTROL_SHEET !== "off";
}

function formatCapturedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRowDate(iso?: string): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function actionPillClass(action: string): string {
  switch (action) {
    case "BLOCK_SOFT":
      return "bg-red-100 text-red-900 border-red-200";
    case "DISCUSS":
      return "bg-amber-100 text-amber-900 border-amber-200";
    default:
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
  }
}

function actionLabel(action: string): string {
  switch (action) {
    case "BLOCK_SOFT":
      return "Review before order";
    case "DISCUSS":
      return "Discuss with patient";
    default:
      return "Proceed";
  }
}

function rowHighlightClass(severity: string): string {
  if (severity === "high") {
    return "bg-red-50/90 border-l-4 border-l-red-500";
  }
  if (severity === "medium") {
    return "bg-amber-50/80 border-l-4 border-l-amber-500";
  }
  return "border-l-4 border-l-transparent";
}

/**
 * At-a-glance prior imaging control sheet for CLIN and INS order flows.
 * Powered by {@link PatientRecordSnapshot.priorImaging} from async FHIR scrape (A.1).
 */
export function PriorImagingControlSheet({
  snapshot,
  proposed,
  onOverride,
  variant = "full",
  product = "CLIN",
}: PriorImagingControlSheetProps) {
  const [overrideReason, setOverrideReason] = React.useState("");
  const [reportOpen, setReportOpen] = React.useState(false);
  const [activeReport, setActiveReport] = React.useState<{
    reportId?: string;
    excerpt?: string;
    modality?: string;
    date?: string;
  } | null>(null);

  React.useEffect(() => {
    if (typeof performance === "undefined") {
      return;
    }
    performance.mark(`${CONTROL_SHEET_MARK}-start`);
    performance.mark(`${CONTROL_SHEET_MARK}-end`);
    performance.measure(
      "arka-control-sheet-render",
      `${CONTROL_SHEET_MARK}-start`,
      `${CONTROL_SHEET_MARK}-end`,
    );
  }, []);

  const rows = React.useMemo(
    () => buildPriorImagingControlSheetRows(snapshot, proposed),
    [snapshot, proposed],
  );
  const assessment = React.useMemo(
    () => evaluateRedundancy(proposed, snapshot),
    [proposed, snapshot],
  );

  const isMini = variant === "mini";
  const count = snapshot.priorImaging.length;

  if (count === 0) {
    return (
      <section
        className="rounded-xl border border-arka-primary/20 bg-arka-bg-light p-4 text-sm text-arka-text-dark-muted"
        aria-label="Prior imaging control sheet"
      >
        <h2 className="text-base font-semibold text-arka-text-dark">Prior imaging on file</h2>
        <p className="mt-2">No prior imaging studies were found in the connected record export.</p>
        <p className="mt-1 text-xs">Last export: {formatCapturedAt(snapshot.capturedAtIso)}</p>
        <div className="mt-4">
          <FDANonDeviceBanner product={product} className="rounded-lg border text-xs" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-arka-primary/20 bg-arka-bg-light shadow-sm",
        isMini ? "p-3" : "p-4 sm:p-5",
      )}
      aria-label="Prior imaging control sheet"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-arka-primary/15 pb-3">
        <div>
          <h2 className="text-base font-semibold text-arka-text-dark sm:text-lg">
            Prior imaging on file
            <span className="ml-2 font-normal text-arka-text-dark-muted">({count})</span>
          </h2>
          <p className="mt-1 text-xs text-arka-text-dark-muted">
            Last export: {formatCapturedAt(snapshot.capturedAtIso)}
          </p>
        </div>
      </header>

      <div className={cn("mt-4 gap-4", isMini ? "space-y-3" : "grid lg:grid-cols-[1fr_240px]")}>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-arka-text-dark-muted">
              <tr className="border-b border-arka-primary/15">
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Modality</th>
                <th className="px-2 py-2 font-medium">Anatomic region</th>
                <th className="px-2 py-2 font-medium">CPT</th>
                <th className="px-2 py-2 font-medium">Indication</th>
                <th className="px-2 py-2 font-medium">Impression</th>
                <th className="px-2 py-2 font-medium sr-only">Report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.study.id ?? row.dateIso}
                  className={cn(
                    "border-b border-arka-primary/10 hover:bg-white/60",
                    rowHighlightClass(row.redundancy.severity),
                  )}
                >
                  <td className="px-2 py-2 whitespace-nowrap text-arka-text-dark">
                    {formatRowDate(row.dateIso)}
                  </td>
                  <td className="px-2 py-2 text-arka-text-dark">{row.modalityLabel}</td>
                  <td className="px-2 py-2 text-arka-text-dark">{row.region}</td>
                  <td className="px-2 py-2 font-mono text-xs text-arka-text-dark">{row.cpt ?? "—"}</td>
                  <td className="px-2 py-2 max-w-[200px] truncate text-arka-text-dark-muted" title={row.indicationSummary}>
                    {row.indicationSummary}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                        row.impression === "normal" && "bg-emerald-50 text-emerald-800 border-emerald-200",
                        row.impression === "abnormal" && "bg-red-50 text-red-800 border-red-200",
                        row.impression === "equivocal" && "bg-amber-50 text-amber-800 border-amber-200",
                        row.impression === "unknown" && "bg-slate-100 text-slate-700 border-slate-200",
                      )}
                      title={
                        row.reportId ?
                          `DiagnosticReport.id: ${row.reportId}`
                        : "No linked DiagnosticReport"
                      }
                    >
                      {row.impression}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-arka-teal hover:underline text-xs font-medium min-h-[44px] min-w-[44px] justify-center"
                      aria-label="Open prior report"
                      onClick={() => {
                        setActiveReport({
                          reportId: row.reportId,
                          excerpt: row.reportExcerpt,
                          modality: row.modalityLabel,
                          date: row.dateIso,
                        });
                        setReportOpen(true);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isMini && (
          <aside className="rounded-lg border border-arka-primary/20 bg-white/80 p-4 space-y-3 h-fit">
            <h3 className="text-sm font-semibold text-arka-text-dark">Redundancy summary</h3>
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                actionPillClass(assessment.suggestedAction),
              )}
            >
              {actionLabel(assessment.suggestedAction)}
            </span>
            <p className="text-sm text-arka-text-dark-muted leading-relaxed">{assessment.reason}</p>
            <label className="block text-xs font-medium text-arka-text-dark-muted" htmlFor="control-sheet-override">
              Override rationale (required if proceeding despite overlap)
            </label>
            <textarea
              id="control-sheet-override"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-arka-primary/25 bg-arka-bg-light px-3 py-2 text-sm text-arka-text-dark placeholder:text-arka-text-dark-muted focus:outline-none focus:ring-2 focus:ring-arka-teal/40"
              placeholder="Document clinical reason to proceed…"
            />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={!overrideReason.trim()}
              onClick={() => onOverride(overrideReason.trim())}
            >
              Proceed with documented override
            </Button>
          </aside>
        )}

        {isMini && (
          <div className="rounded-lg border border-arka-primary/15 bg-white/70 px-3 py-2 text-xs text-arka-text-dark-muted">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 font-semibold mr-2",
                actionPillClass(assessment.suggestedAction),
              )}
            >
              {actionLabel(assessment.suggestedAction)}
            </span>
            {assessment.reason}
          </div>
        )}
      </div>

      <footer className="mt-4 pt-3 border-t border-arka-primary/15">
        <FDANonDeviceBanner product={product} className="rounded-lg border text-xs" />
      </footer>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-arka-teal" aria-hidden />
              Prior report (de-identified)
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-500">
            {activeReport?.modality} · {formatRowDate(activeReport?.date)}
            {activeReport?.reportId ?
              <span className="block font-mono mt-1">DiagnosticReport/{activeReport.reportId}</span>
            : null}
          </p>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap">
            {activeReport?.excerpt ?? "No conclusion text available in this export."}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/**
 * Feature-flagged wrapper used by CLIN and INS demos.
 */
export function PriorImagingControlSheetGate(
  props: PriorImagingControlSheetProps & { enabled?: boolean },
): React.ReactElement | null {
  const enabled = props.enabled ?? isControlSheetEnabled();
  if (!enabled) {
    return null;
  }
  return <PriorImagingControlSheet {...props} />;
}
