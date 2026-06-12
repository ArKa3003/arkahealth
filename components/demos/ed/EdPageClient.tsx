"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, GraduationCap } from "lucide-react";

import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";
import type { EdCockpitCase } from "@/components/demos/ed/ed-cockpit-cases";
import type { EdCaseEvaluationBundle } from "@/components/demos/ed/ed-cockpit-utils";
import {
  loadEdPageMode,
  saveEdPageMode,
  type EdPageMode,
} from "@/lib/demos/ed/practice-utils";
import { cn } from "@/lib/utils";

const PracticeMode = dynamic(
  () => import("@/components/demos/ed/PracticeMode").then((m) => m.PracticeMode),
  { loading: () => <DemoLoadingSkeleton />, ssr: false },
);

const EdDemoContent = dynamic(
  () => import("@/components/demos/ed/EdDemoContent").then((m) => m.EdDemoContent),
  { loading: () => <DemoLoadingSkeleton />, ssr: false },
);

export interface EdPageClientProps {
  cockpitCases: EdCockpitCase[];
  practiceCases: EdCockpitCase[];
  evaluations: Record<string, EdCaseEvaluationBundle>;
}

const MODES: Array<{
  id: EdPageMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "practice",
    label: "Practice scenarios",
    shortLabel: "Practice",
    description: "Sample vignettes with scored answers",
    icon: GraduationCap,
  },
  {
    id: "queue",
    label: "Live ED queue",
    shortLabel: "Live queue",
    description: "Simulated department view",
    icon: Activity,
  },
];

/**
 * ARKA-ED client shell — practice mode (default) and live queue cockpit.
 */
export function EdPageClient({
  cockpitCases,
  practiceCases,
  evaluations,
}: EdPageClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [pageMode, setPageMode] = React.useState<EdPageMode>("practice");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setPageMode(loadEdPageMode());
    setHydrated(true);
  }, []);

  const handleModeChange = (mode: EdPageMode) => {
    setPageMode(mode);
    saveEdPageMode(mode);
  };

  return (
    <div className="min-h-full flex-1 bg-surface-sunken">
      <div className="border-b border-border-subtle bg-surface">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-h1 font-semibold text-arka-slate-900">
            ARKA-ED — Imaging Appropriateness Training
          </h1>
          <p className="mt-3 max-w-3xl text-base text-arka-slate-600 sm:text-lg">
            Work through real ED presentations. Choose the imaging you&apos;d order, then see
            how AIIE scores every option — with the evidence.
          </p>

          <div
            className="mt-6 inline-flex w-full max-w-xl rounded-radius-md border border-border-subtle bg-surface-sunken p-1 sm:w-auto"
            role="tablist"
            aria-label="ARKA-ED experience mode"
          >
            {MODES.map((mode) => {
              const isActive = pageMode === mode.id;
              const Icon = mode.icon;

              return (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleModeChange(mode.id)}
                  className={cn(
                    "relative flex min-h-[44px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-radius-sm px-4 py-2 text-sm font-semibold transition-colors sm:flex-row sm:gap-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                    isActive
                      ? "text-arka-teal-800"
                      : "text-arka-slate-600 hover:text-arka-slate-900",
                  )}
                >
                  {isActive && hydrated ? (
                    <motion.span
                      layoutId="ed-mode-pill"
                      className="absolute inset-0 rounded-radius-sm bg-surface shadow-elevation-1"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 32 }
                      }
                      aria-hidden
                    />
                  ) : null}
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="sm:hidden">{mode.shortLabel}</span>
                    <span className="hidden sm:inline">{mode.label}</span>
                  </span>
                  <span className="relative z-10 hidden text-xs font-normal text-arka-slate-500 lg:inline">
                    {mode.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {hydrated ? (
        pageMode === "practice" ? (
          <PracticeMode cases={practiceCases} evaluations={evaluations} />
        ) : (
          <EdDemoContent cases={cockpitCases} evaluations={evaluations} />
        )
      ) : (
        <DemoLoadingSkeleton />
      )}
    </div>
  );
}
