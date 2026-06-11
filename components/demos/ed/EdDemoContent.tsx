"use client";

import * as React from "react";

import type { EdCockpitCase } from "./ed-cockpit-cases";
import type { EdCaseEvaluationBundle } from "./ed-cockpit-utils";
import { EdDeptHeader } from "./EdDeptHeader";
import { IncomingCasesBoard } from "./IncomingCasesBoard";
import { EdResultsPanel } from "./EdResultsPanel";

export interface EdDemoContentProps {
  cases: EdCockpitCase[];
  evaluations: Record<string, EdCaseEvaluationBundle>;
}

/**
 * ED split-view cockpit — incoming board + instant AIIE results panel.
 */
export function EdDemoContent({ cases, evaluations }: EdDemoContentProps) {
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(
    cases[0]?.caseId ?? null,
  );
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const selectedCase = cases.find((c) => c.caseId === selectedCaseId) ?? null;
  const evaluation = selectedCaseId ? evaluations[selectedCaseId] ?? null : null;

  const handleSelectCase = React.useCallback((caseId: string) => {
    if (caseId === selectedCaseId) return;
    setIsTransitioning(true);
    setSelectedCaseId(caseId);
    window.setTimeout(() => setIsTransitioning(false), 140);
  }, [selectedCaseId]);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <EdDeptHeader />

      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          <div className="lg:w-[300px] lg:shrink-0">
            <IncomingCasesBoard
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={handleSelectCase}
            />
          </div>

          <div className="min-w-0 flex-1">
            <EdResultsPanel
              cockpitCase={selectedCase}
              evaluation={evaluation}
              isTransitioning={isTransitioning}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
