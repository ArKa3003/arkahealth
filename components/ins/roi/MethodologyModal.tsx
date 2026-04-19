"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export interface MethodologyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Citations for ROI dashboard metrics (AMA PA burden, MGMA appeals, CMS-0057-F, AIIE evidence).
 */
export function MethodologyModal({ open, onOpenChange }: MethodologyModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(100%,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-6 text-slate-200 shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-white">Methodology & citations</Dialog.Title>
            <Dialog.Close
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <ul className="list-inside list-disc space-y-3 text-sm leading-relaxed marker:text-arka-teal">
            <li>
              <span className="font-medium text-slate-100">Administrative burden baseline:</span> AMA Prior
              Authorization Physician Survey — modeled physician time on PA at{" "}
              <span className="whitespace-nowrap text-amber-200/90">13 hours/week</span> (weekly reference line on the
              burden chart).
            </li>
            <li>
              <span className="font-medium text-slate-100">Appeal cost proxy:</span> MGMA-style administrative cost
              estimate of <span className="text-amber-200/90">$25 per appeal avoided</span> applied to DTR denial-risk
              reduction episodes.
            </li>
            <li>
              <span className="font-medium text-slate-100">Decision SLA:</span> CMS-0057-F Final Rule — standard 72h /
              expedited 24h windows used to score compliance on adjudicated PAs in{" "}
              <code className="rounded bg-slate-800 px-1 text-xs">ins_pa_history</code>.
            </li>
            <li>
              <span className="font-medium text-slate-100">Clinical engine:</span> AIIE evidence framework — RAND/UCLA
              appropriateness methods plus GRADE-style factor transparency (see AIIE evidence link).
            </li>
            <li>
              <span className="font-medium text-slate-100">Labor avoidance:</span> fully loaded admin labor rate per
              minute applied to summed <code className="rounded bg-slate-800 px-1 text-xs">minutes_saved</code> on
              validation events (see stack USD footnote on chart).
            </li>
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
