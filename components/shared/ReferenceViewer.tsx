"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { FDANonDeviceBanner } from "@/components/shared/compliance/FDANonDeviceBanner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Checklist } from "@/lib/viewer/checklist-types";
import { matchProjections } from "@/lib/viewer/projection-matcher";
import { useReferenceViewerStore } from "@/lib/viewer/reference-viewer-store";
import type { PriorImagingStudy } from "@/lib/types/record-snapshot";

export interface ReferenceViewerProps {
  /** Active study for juxtaposition. */
  currentStudy: PriorImagingStudy;
  /** All patient prior imaging rows (including current). */
  allStudies: PriorImagingStudy[];
  /** Region-specific systematic checklist. */
  checklist: Checklist;
  /** SHA-256 patient hash for proxied thumbnails. */
  patientHash: string;
  product?: "CLIN" | "INS";
}

function studyKey(study: PriorImagingStudy): string {
  return study.id ?? study.studyUid ?? "unknown";
}

function formatStudyDate(iso?: string): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Maps FHIR modality display/code strings to compact badges (CT, MRI, US, XR). */
function modalityBadges(modality: string[]): string[] {
  const out = new Set<string>();
  for (const raw of modality) {
    const m = raw.toUpperCase();
    if (m.includes("CT") || m === "CT") {
      out.add("CT");
    } else if (m.includes("MR") || m.includes("MRI")) {
      out.add("MRI");
    } else if (m.includes("US") || m.includes("ULTRASOUND")) {
      out.add("US");
    } else if (
      m.includes("XR") ||
      m.includes("DX") ||
      m.includes("RADIOGRAPH") ||
      m.includes("X-RAY")
    ) {
      out.add("XR");
    } else if (raw.trim()) {
      out.add(raw.trim().slice(0, 8));
    }
  }
  return [...out];
}

interface StudyMetadataCardProps {
  label: string;
  study: PriorImagingStudy;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function StudyMetadataCard({ label, study }: StudyMetadataCardProps) {
  const badges = modalityBadges(study.modality);
  const bodyPart = study.bodySite?.trim() || "—";
  const accession = study.accessionNumber?.trim() || "—";
  const orderingProvider = study.orderingProvider?.trim() || "—";

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{label}</CardTitle>
          <span className="text-xs text-slate-600">{formatStudyDate(study.startedIso)}</span>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {badges.length > 0 ?
            badges.map((b) => (
              <Badge key={b} variant="secondary">
                {b}
              </Badge>
            ))
          : <Badge variant="outline">—</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <MetadataRow label="Body part" value={bodyPart} />
        <MetadataRow label="Accession" value={accession} />
        <MetadataRow label="Ordering provider" value={orderingProvider} />
        {study.view ?
          <MetadataRow label="View" value={study.view} />
        : null}
        <div className="mt-auto pt-2">
          {/* TODO(ehr-integration): replace href with runtime deep-link from EHR integration layer */}
          <a
            href="#"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300",
              "bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50",
            )}
          >
            Open in EHR
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Non-diagnostic reference viewer: juxtaposes current and matched-prior study metadata with a systematic checklist.
 */
export function ReferenceViewer({
  currentStudy,
  allStudies,
  checklist,
  patientHash: _patientHash,
  product = "INS",
}: ReferenceViewerProps) {
  const matches = React.useMemo(
    () => matchProjections(currentStudy, allStudies),
    [currentStudy, allStudies],
  );
  const bestPrior = React.useMemo(() => {
    const top = matches[0];
    if (!top) {
      return undefined;
    }
    return allStudies.find((s) => studyKey(s) === top.priorStudyId);
  }, [matches, allStudies]);

  const checked = useReferenceViewerStore((s) => s.checked);
  const toggleItem = useReferenceViewerStore((s) => s.toggleItem);
  const resetForChecklist = useReferenceViewerStore((s) => s.resetForChecklist);

  React.useEffect(() => {
    resetForChecklist(checklist);
  }, [checklist, resetForChecklist]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = Number(e.key);
      if (idx < 1 || idx > 9) {
        return;
      }
      const item = checklist.items[idx - 1];
      if (!item) {
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      toggleItem(item.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checklist.items, toggleItem]);

  const liveMessage = `${matches.length} prior projection match${matches.length === 1 ? "" : "es"} for reference review.`;

  return (
    <div className="flex h-full min-h-[480px] flex-col gap-3">
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      <div className="sticky top-0 z-10 space-y-2 rounded-md border border-amber-300/80 bg-amber-50 px-3 py-2 shadow-sm">
        <p className="text-sm font-semibold text-amber-950">
          Reference viewer — not for diagnostic interpretation. Use your certified PACS or EHR
          image viewer for diagnosis.
        </p>
        <FDANonDeviceBanner product={product} className="text-xs" />
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <StudyMetadataCard label="Current study" study={currentStudy} />
            {bestPrior ?
              <div className="flex flex-col gap-2">
                <StudyMetadataCard label="Best-matched prior" study={bestPrior} />
                {matches[0] ?
                  <p className="text-xs text-slate-600">{matches[0].rationale}</p>
                : null}
              </div>
            : <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                No prior study meets projection match threshold (≥ 0.6).
              </div>
            }
          </div>
        </div>

        <aside
          className="flex flex-col gap-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-3"
          aria-label={`${checklist.region} systematic checklist`}
        >
          <h3 className="text-sm font-semibold text-slate-900">{checklist.region} checklist</h3>
          <p className="text-xs text-slate-500">
            Keys 1–9 toggle items. {liveMessage}
          </p>
          <ul className="space-y-2">
            {checklist.items.map((item, index) => (
              <li key={item.id}>
                <label className="flex cursor-pointer gap-2 rounded-md border border-transparent px-1 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[item.id])}
                    onChange={() => toggleItem(item.id)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-keyshortcuts={`${index + 1}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">
                      <span className="mr-1 text-slate-400">{index + 1}.</span>
                      {item.label}
                    </span>
                    <span className="block text-xs text-slate-500">{item.anchor}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
