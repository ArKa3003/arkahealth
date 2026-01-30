"use client";

import { ArkaSpinner } from "@/components/ui/ArkaSpinner";

/**
 * Loading skeleton for demo pages (CLIN, ED, INS).
 * Matches PhaseCards layout: 3 cards with icon, title, subtitle, description.
 * Shown while demo components are lazy-loaded.
 */
export function DemoLoadingSkeleton() {
  return (
    <div
      className="min-h-[420px] rounded-xl border border-arka-primary/20 bg-arka-bg-medium/50 p-6 sm:p-8 opacity-90"
      role="status"
      aria-live="polite"
      aria-label="Loading demo"
    >
      <div className="space-y-6">
        {/* Header block */}
        <div className="flex flex-col gap-2">
          <div className="h-6 w-48 rounded bg-arka-primary/20 animate-pulse" />
          <div className="h-4 w-full max-w-md rounded bg-arka-primary/10 animate-pulse" />
          <div className="h-4 w-2/3 max-w-sm rounded bg-arka-primary/10 animate-pulse" />
        </div>
        {/* Card skeletons matching PhaseCards: 3 cards, same grid */}
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex min-h-[220px] flex-col rounded-xl border border-arka-deep/40 bg-arka-bg-medium/80 p-6 shadow-sm"
            >
              <div className="h-11 w-11 shrink-0 rounded-lg bg-arka-primary/25 animate-pulse" />
              <div className="mt-4 h-5 w-32 rounded bg-arka-primary/20 animate-pulse" />
              <div className="mt-1 h-4 w-28 rounded bg-arka-primary/15 animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-arka-primary/10 animate-pulse" />
                <div className="h-3 w-4/5 rounded bg-arka-primary/10 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-arka-primary/10 animate-pulse" />
              </div>
              <div className="mt-5 h-4 w-24 rounded bg-arka-cyan/20 animate-pulse" />
            </div>
          ))}
        </div>
        {/* Centered ARKA spinner */}
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <ArkaSpinner size="md" />
          <span className="text-sm font-medium text-arka-text-soft">
            Loading demo…
          </span>
        </div>
      </div>
    </div>
  );
}
