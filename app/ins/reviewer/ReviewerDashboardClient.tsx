"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { MetricCard } from "@/components/ins/MetricCard";
import { CaseDetail } from "@/components/ins/reviewer/CaseDetail";
import { QueueList } from "@/components/ins/reviewer/QueueList";
import { ReviewerActionBar } from "@/components/ins/reviewer/ReviewerActionBar";
import { REVIEWER_DEMO_PROVIDER_ID } from "@/lib/ins/reviewer-queue";
import type { ReviewerQueueCase, ReviewerStatsApiResponse } from "@/lib/ins/reviewer-types";

const SHIFT_KEY = "arka_ins_reviewer_shift_start_ms";

/**
 * RBM reviewer work queue — keyboard j/k navigation and bottom action bar.
 */
export function ReviewerDashboardClient() {
  const searchParams = useSearchParams();
  const providerFromQuery = searchParams.get("providerId")?.trim();

  const [cases, setCases] = React.useState<ReviewerQueueCase[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<ReviewerStatsApiResponse>({
    casesCompletedToday: 0,
    minutesSavedToday: 0,
  });

  const effectiveProviderId =
    providerFromQuery && providerFromQuery.length > 0 ? providerFromQuery : REVIEWER_DEMO_PROVIDER_ID;

  const selectedId = cases[selectedIndex]?.id ?? null;
  const selected = cases[selectedIndex] ?? null;

  const loadQueue = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const u = new URL("/api/ins/reviewer/queue", window.location.origin);
      if (providerFromQuery) u.searchParams.set("providerId", providerFromQuery);
      const res = await fetch(u.toString());
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Failed to load queue");
      }
      const data = (await res.json()) as { cases: ReviewerQueueCase[] };
      setCases(data.cases);
      setSelectedIndex(0);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Failed to load queue");
      setCases([]);
      setSelectedIndex(0);
    } finally {
      setLoading(false);
    }
  }, [providerFromQuery]);

  const loadStats = React.useCallback(async () => {
    try {
      const u = new URL("/api/ins/reviewer/stats", window.location.origin);
      u.searchParams.set("providerId", effectiveProviderId);
      const res = await fetch(u.toString());
      if (!res.ok) return;
      const data = (await res.json()) as ReviewerStatsApiResponse;
      setStats(data);
    } catch {
      /* non-fatal */
    }
  }, [effectiveProviderId]);

  React.useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  React.useEffect(() => {
    void loadStats();
    const id = window.setInterval(() => void loadStats(), 45000);
    return () => window.clearInterval(id);
  }, [loadStats]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(cases.length - 1, i + 1));
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cases.length]);

  const onActionDone = React.useCallback(() => {
    setCases((prev) => {
      const next = prev.filter((c) => c.id !== selectedId);
      setSelectedIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
    void loadStats();
  }, [loadStats, selectedId]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-sunken">
      <DemoModeWatermark />

      <div className="border-b border-border-subtle bg-surface px-4 py-4 sm:px-6 lg:px-8">
        <h1 className="text-h3 font-semibold text-arka-slate-900">Reviewer queue</h1>
        <p className="mt-1 text-caption text-arka-slate-500">
          <kbd className="rounded bg-arka-slate-100 px-1.5 py-0.5 font-mono text-[10px]">j</kbd>
          <kbd className="ml-1 rounded bg-arka-slate-100 px-1.5 py-0.5 font-mono text-[10px]">k</kbd>
          <span className="ml-2">to navigate · CMS-0057-F SLA timers on each case</span>
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Queue depth" value={String(cases.length)} sparkline={[4, 5, 6, 5, 4, cases.length, cases.length]} />
          <MetricCard label="Completed today" value={String(stats.casesCompletedToday)} sparkline={[2, 3, 4, 5, 6, stats.casesCompletedToday, stats.casesCompletedToday]} />
          <MetricCard label="Minutes saved today" value={String(stats.minutesSavedToday)} sparkline={[10, 14, 18, 22, 28, stats.minutesSavedToday, stats.minutesSavedToday]} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        {loadError ? (
          <div className="rounded-radius-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            {loadError}
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-radius-lg border border-border-subtle bg-surface-raised p-12 text-sm text-arka-slate-500">
            Loading queue…
          </div>
        ) : (
          <>
            <QueueList
              cases={cases}
              selectedId={selectedId}
              onSelect={(id) => {
                const idx = cases.findIndex((c) => c.id === id);
                if (idx >= 0) setSelectedIndex(idx);
              }}
              className="lg:max-w-[340px]"
            />
            <CaseDetail caseRow={selected} className="min-h-[50vh] flex-1 rounded-radius-lg border border-border-subtle bg-surface-raised shadow-elevation-1" />
          </>
        )}
      </div>

      <div className="mt-auto">
        <ReviewerActionBar caseRow={selected} onSubmitted={onActionDone} />
      </div>
    </div>
  );
}
