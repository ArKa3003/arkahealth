"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { routes } from "@/lib/constants";
import { REVIEWER_DEMO_PROVIDER_ID } from "@/lib/ins/reviewer-queue";
import type { ReviewerQueueCase, ReviewerStatsApiResponse } from "@/lib/ins/reviewer-types";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { ActionPanel } from "@/components/ins/reviewer/ActionPanel";
import { CaseDetail } from "@/components/ins/reviewer/CaseDetail";
import { QueueList } from "@/components/ins/reviewer/QueueList";

const SHIFT_KEY = "arka_ins_reviewer_shift_start_ms";

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * RBM reviewer dashboard — three-column behavioral design surface (queue, detail, actions).
 */
export function ReviewerDashboardClient() {
  const searchParams = useSearchParams();
  const providerFromQuery = searchParams.get("providerId")?.trim();

  const [cases, setCases] = React.useState<ReviewerQueueCase[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [stats, setStats] = React.useState<ReviewerStatsApiResponse>({ casesCompletedToday: 0, minutesSavedToday: 0 });

  const [shiftSeconds, setShiftSeconds] = React.useState(0);

  const effectiveProviderId =
    providerFromQuery && providerFromQuery.length > 0 ? providerFromQuery : REVIEWER_DEMO_PROVIDER_ID;

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
      setSelectedId((id) => {
        if (id && data.cases.some((c) => c.id === id)) return id;
        return data.cases[0]?.id ?? null;
      });
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Failed to load queue");
      setCases([]);
      setSelectedId(null);
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
    if (typeof window === "undefined") return;
    let start = sessionStorage.getItem(SHIFT_KEY);
    if (!start) {
      start = String(Date.now());
      sessionStorage.setItem(SHIFT_KEY, start);
    }
    const t0 = Number(start);
    const tick = () => setShiftSeconds(Math.floor((Date.now() - t0) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const onActionDone = React.useCallback(() => {
    const rid = selectedId;
    if (!rid) return;
    setCases((prev) => {
      const next = prev.filter((c) => c.id !== rid);
      const sel = next[0]?.id ?? null;
      queueMicrotask(() => setSelectedId(sel));
      return next;
    });
    void loadStats();
  }, [loadStats, selectedId]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <DemoModeWatermark />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <Link href={routes.ins} className="text-arka-teal hover:underline">
                ARKA-INS
              </Link>
              <span className="text-slate-400"> / Reviewer</span>
            </p>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">ARKA-INS Reviewer Dashboard</h1>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 sm:text-right">
            <div>
              <dt className="text-xs text-slate-500">Time on shift</dt>
              <dd className="font-mono font-medium text-slate-900">{formatElapsed(shiftSeconds)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Cases completed today</dt>
              <dd className="font-mono font-medium text-slate-900">{stats.casesCompletedToday}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Minutes saved today</dt>
              <dd className="font-mono font-medium text-slate-900">{stats.minutesSavedToday}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-4">
        {loadError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {loadError}
          </div>
        )}

        <div className="flex min-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-12 text-sm text-slate-500">Loading queue…</div>
          ) : (
            <>
              <QueueList cases={cases} selectedId={selectedId} onSelect={setSelectedId} />
              <CaseDetail caseRow={selected} />
              <ActionPanel caseRow={selected} onSubmitted={onActionDone} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
