"use client";

import { ClipboardList, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";

export interface ClinEmptyStateProps {
  onLoadExample: () => void;
}

/**
 * Zero-state when no case is loaded — explains workflow with example loader.
 */
export function ClinEmptyState({ onLoadExample }: ClinEmptyStateProps) {
  return (
    <Card className="border-dashed border-border-strong bg-surface-sunken/30 animate-fade-in-up">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-arka-teal-100">
          <ClipboardList className="h-7 w-7 text-arka-teal-600" aria-hidden />
        </div>
        <h2 className="text-h3 font-semibold text-arka-slate-900">
          Clinician cockpit ready
        </h2>
        <p className="mt-2 max-w-md text-body text-arka-slate-600">
          Select a demo scenario from the left rail, or compose an imaging order in the center panel.
          AIIE returns an appropriateness score, factor breakdown, and evidence-linked recommendations.
        </p>
        <ol className="mt-6 max-w-sm space-y-2 text-left text-caption text-arka-slate-600">
          <li className="flex gap-2">
            <span className="font-semibold text-arka-teal-700">1.</span>
            Load patient context from a scenario or manual entry
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-arka-teal-700">2.</span>
            Compose modality, body part, and indication
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-arka-teal-700">3.</span>
            Review AIIE score and factor breakdown in the results panel
          </li>
        </ol>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="mt-8"
          onClick={onLoadExample}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Load example case
        </Button>
      </CardContent>
    </Card>
  );
}
