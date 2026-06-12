"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ClinicalScenario } from "@/lib/demos/clin/types";
import { getAllDemoScenarios } from "@/lib/demos/clin/demo-scenarios";
import {
  deriveActiveProblems,
  deriveAllergies,
  displayHashedMrn,
  getScenarioSeverity,
  type ScenarioSeverity,
} from "./clin-cockpit-utils";

const severityDot: Record<ScenarioSeverity, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export interface PatientContextRailProps {
  scenario: ClinicalScenario | null;
  selectedScenarioKey: string | null;
  onSelectScenario: (key: string) => void;
  className?: string;
}

/**
 * Left rail — patient context card and searchable scenario picker.
 */
export function PatientContextRail({
  scenario,
  selectedScenarioKey,
  onSelectScenario,
  className,
}: PatientContextRailProps) {
  const [query, setQuery] = React.useState("");
  const scenarios = getAllDemoScenarios();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scenarios;
    return scenarios.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [scenarios, query]);

  return (
    <aside
      className={cn("flex flex-col gap-4 lg:w-[320px] lg:shrink-0", className)}
      aria-label="Patient context and scenarios"
    >
      <Card className="animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Patient context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scenario ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-lg font-semibold text-arka-slate-900">
                  {scenario.age}y {scenario.sex === "male" ? "M" : scenario.sex === "female" ? "F" : "X"}
                </span>
                <Badge variant="neutral" className="font-mono text-[10px]">
                  {displayHashedMrn(scenario.patientId)}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-arka-slate-500 mb-1">
                  Active problems
                </p>
                <ul className="space-y-1">
                  {deriveActiveProblems(scenario).map((problem) => (
                    <li
                      key={problem}
                      className="text-caption text-arka-slate-700 before:mr-1.5 before:text-arka-teal-500 before:content-['•']"
                    >
                      {problem}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-arka-slate-500 mb-1">
                  Allergies
                </p>
                {deriveAllergies(scenario).length > 0 ? (
                  <ul className="space-y-1">
                    {deriveAllergies(scenario).map((allergy) => (
                      <li key={allergy} className="text-caption text-danger">
                        {allergy}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption text-arka-slate-500">NKDA</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-caption text-arka-slate-500">
              Select a demo scenario or compose an order to populate patient context.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col animate-fade-in-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Demo scenarios</CardTitle>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-arka-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scenarios…"
              aria-label="Search demo scenarios"
              className={cn(
                "h-11 min-h-[44px] w-full rounded-radius-md border border-border-subtle bg-surface pl-9 pr-3 text-sm touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
              )}
            />
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
          <ul className="space-y-1" role="listbox" aria-label="Demo scenarios">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-caption text-arka-slate-500" role="status">
                No scenarios match your search.
              </li>
            ) : null}
            {filtered.map(({ key, title, description }) => {
              const severity = getScenarioSeverity(title);
              const selected = selectedScenarioKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelectScenario(key)}
                    className={cn(
                      "w-full rounded-radius-md border px-3 py-2.5 text-left transition-colors min-h-[44px]",
                      selected
                        ? "border-arka-teal-400 bg-arka-teal-50"
                        : "border-transparent hover:border-border-subtle hover:bg-surface-sunken",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", severityDot[severity])}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-arka-slate-900 leading-snug">{title}</p>
                        <p className="mt-0.5 text-[11px] text-arka-slate-500 line-clamp-2">{description}</p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
