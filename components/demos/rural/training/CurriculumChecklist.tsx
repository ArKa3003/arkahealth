"use client";

import * as React from "react";
import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RURAL_CERTIFICATION_TRACKS } from "@/lib/demos/rural/constants";
import { cn } from "@/lib/utils";

/** Demo completion state — first track partially complete. */
const DEMO_MODULE_PROGRESS: Record<string, number> = {
  "rural-imaging-appropriateness": 14,
  "rural-emergency-imaging": 6,
  "pocus-rural-provider": 0,
  "teleradiology-quality": 4,
};

/**
 * Certification curriculum checklist with per-track progress indicators.
 */
export function CurriculumChecklist() {
  const [completedModules, setCompletedModules] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    RURAL_CERTIFICATION_TRACKS.forEach((track) => {
      const done = DEMO_MODULE_PROGRESS[track.id] ?? 0;
      for (let i = 0; i < done; i += 1) {
        initial.add(`${track.id}-module-${i}`);
      }
    });
    return initial;
  });

  const toggleModule = (key: string) => {
    setCompletedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-h3">Certification curriculum</CardTitle>
        <p className="text-caption text-arka-slate-500">
          Track CME progress across rural imaging certification paths (demo state persists in session).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {RURAL_CERTIFICATION_TRACKS.map((track) => {
          const moduleKeys = Array.from({ length: track.cases }, (_, i) => `${track.id}-module-${i}`);
          const completedCount = moduleKeys.filter((k) => completedModules.has(k)).length;
          const pct = Math.round((completedCount / track.cases) * 100);

          return (
            <div
              key={track.id}
              className="rounded-radius-lg border border-border-subtle bg-surface-raised p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-arka-slate-900">{track.name}</h3>
                  <p className="mt-0.5 text-xs text-arka-slate-600">{track.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{track.specialty}</Badge>
                  <Badge variant={pct === 100 ? "success" : pct > 0 ? "info" : "neutral"} dot>
                    {completedCount}/{track.cases} modules
                  </Badge>
                </div>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-full bg-arka-slate-100">
                <div
                  className="h-full rounded-full bg-arka-teal-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${track.name} progress`}
                />
              </div>

              <ul className="grid gap-1.5 sm:grid-cols-2">
                {moduleKeys.map((key, index) => {
                  const done = completedModules.has(key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => toggleModule(key)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-radius-md px-2 py-1.5 text-left text-xs transition-colors",
                          done
                            ? "bg-success-bg text-arka-slate-800"
                            : "text-arka-slate-600 hover:bg-surface-sunken",
                        )}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-arka-slate-400" aria-hidden />
                        )}
                        <span>
                          Module {index + 1}
                          <span className="ml-1 text-arka-slate-500">
                            · {(track.credits / track.cases).toFixed(1)} CME
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-2 text-xs text-arka-slate-500">
                {track.credits} total CME credits · {pct}% complete
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
