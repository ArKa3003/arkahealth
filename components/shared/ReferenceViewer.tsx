"use client";

import * as React from "react";

import { FDANonDeviceBanner } from "@/components/shared/compliance/FDANonDeviceBanner";
import type { Checklist } from "@/lib/viewer/checklist-types";
import { matchProjections } from "@/lib/viewer/projection-matcher";
import { useReferenceViewerStore } from "@/lib/viewer/reference-viewer-store";
import type { PriorImagingStudy } from "@/lib/types/record-snapshot";
import { cn } from "@/lib/utils";

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

type PaneMode = "side-by-side" | "overlay";

function studyKey(study: PriorImagingStudy): string {
  return study.id ?? study.studyUid ?? "unknown";
}

function thumbnailUrl(patientHash: string, study: PriorImagingStudy): string {
  const uid = study.id ?? study.studyUid ?? "";
  const qs = new URLSearchParams({ patientHash });
  return `/api/ins/viewer/image/${encodeURIComponent(uid)}?${qs.toString()}`;
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

interface StudyPaneProps {
  label: string;
  study: PriorImagingStudy;
  patientHash: string;
  mode: PaneMode;
  paired?: boolean;
}

function StudyPane({ label, study, patientHash, mode, paired = false }: StudyPaneProps) {
  const src = thumbnailUrl(patientHash, study);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium text-slate-800">{label}</span>
        <span>{formatStudyDate(study.startedIso)}</span>
      </div>
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-md border border-slate-200 bg-slate-950",
          paired && mode === "side-by-side" && "min-h-[220px]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${label} reference thumbnail (non-diagnostic)`}
          className={cn(
            "h-full w-full object-contain",
            mode === "overlay" && paired && "opacity-60 mix-blend-difference",
          )}
        />
        {mode === "overlay" && paired ?
          <div className="pointer-events-none absolute inset-0 bg-slate-900/20" aria-hidden />
        : null}
      </div>
      <p className="text-[10px] text-slate-500">
        {study.modality.join(", ")}
        {study.view ? ` · ${study.view}` : ""}
        {study.bodySite ? ` · ${study.bodySite}` : ""}
      </p>
    </div>
  );
}

/**
 * Non-diagnostic reference viewer: juxtaposes current and matched-prior projections with a systematic checklist.
 */
export function ReferenceViewer({
  currentStudy,
  allStudies,
  checklist,
  patientHash,
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
    return allStudies.find(
      (s) => studyKey(s) === top.priorStudyId,
    );
  }, [matches, allStudies]);

  const [leftMode, setLeftMode] = React.useState<PaneMode>("side-by-side");
  const [rightMode, setRightMode] = React.useState<PaneMode>("side-by-side");

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
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {liveMessage}
      </div>

      <div className="sticky top-0 z-10 space-y-2 rounded-md border border-amber-300/80 bg-amber-50 px-3 py-2 shadow-sm">
        <p className="text-sm font-semibold text-amber-950">
          Reference viewer — not for diagnostic interpretation. Pixel data may be compressed; use your
          certified PACS viewer for diagnosis.
        </p>
        <FDANonDeviceBanner product={product} className="text-xs" />
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <StudyPane
                label="Current study"
                study={currentStudy}
                patientHash={patientHash}
                mode={leftMode}
                paired={Boolean(bestPrior)}
              />
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <span>Display</span>
                <select
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  value={leftMode}
                  onChange={(e) => setLeftMode(e.target.value as PaneMode)}
                  aria-label="Current study display mode"
                >
                  <option value="side-by-side">Show side-by-side</option>
                  <option value="overlay">Show overlay (difference shade)</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              {bestPrior ?
                <>
                  <StudyPane
                    label="Best-matched prior"
                    study={bestPrior}
                    patientHash={patientHash}
                    mode={rightMode}
                    paired
                  />
                  {matches[0] ?
                    <p className="text-xs text-slate-600">{matches[0].rationale}</p>
                  : null}
                </>
              : <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                  No prior study meets projection match threshold (≥ 0.6).
                </div>
              }
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <span>Display</span>
                <select
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  value={rightMode}
                  onChange={(e) => setRightMode(e.target.value as PaneMode)}
                  aria-label="Prior study display mode"
                  disabled={!bestPrior}
                >
                  <option value="side-by-side">Show side-by-side</option>
                  <option value="overlay">Show overlay (difference shade)</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <aside
          className="flex flex-col gap-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-3"
          aria-label={`${checklist.region} systematic checklist`}
        >
          <h3 className="text-sm font-semibold text-slate-900">
            {checklist.region} checklist
          </h3>
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
