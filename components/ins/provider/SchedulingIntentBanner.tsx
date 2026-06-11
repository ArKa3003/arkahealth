"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";

type SchedulingDashboard = {
  pendingCount: number;
  slaOnTrackPercent: number;
  breaches: Array<{ orderHash: string; cpt: string | null; slaExpiredAt: string }>;
};

function truncateHash(hash: string): string {
  if (hash.length <= 12) {
    return hash;
  }
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Scheduling-team widget: pending queue volume, SLA on-track %, and breach list (hashed order id + CPT only).
 */
export function SchedulingIntentBanner() {
  const [data, setData] = React.useState<SchedulingDashboard | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/ins/scheduling/intents`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Failed to load scheduling intents");
      }
      const json = (await res.json()) as SchedulingDashboard;
      setData(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load scheduling queue");
      setData(null);
    }
  }, []);

  React.useEffect(() => {
    const boot = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [load]);

  const pending = data?.pendingCount ?? 0;
  const onTrack = data?.slaOnTrackPercent ?? 100;
  const breaches = data?.breaches ?? [];
  const onTrackTone =
    onTrack >= 85 ? "text-emerald-700" : onTrack >= 60 ? "text-amber-700" : "text-red-700";

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Scheduling intent queue"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarClock className="h-4 w-4 text-sky-600" aria-hidden />
            Real-time order capture
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Post–order-sign intents with 72h scheduling SLA. Reconciled against FHIR{" "}
            <code className="rounded bg-slate-100 px-1">Appointment</code>; no PHI in queue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs font-medium text-sky-700 hover:text-sky-900"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{pending}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            SLA on track
          </p>
          <p className={`mt-1 flex items-center gap-1 text-2xl font-semibold tabular-nums ${onTrackTone}`}>
            {onTrack >= 85 ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
            )}
            {onTrack}%
          </p>
        </div>
      </div>

      {breaches.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700">
            SLA breaches ({breaches.length})
          </h3>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
            {breaches.map((b) => (
              <li
                key={`${b.orderHash}-${b.slaExpiredAt}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-red-100 bg-red-50/60 px-2 py-1.5 text-slate-800"
              >
                <span className="font-mono" title={b.orderHash}>
                  {truncateHash(b.orderHash)}
                  {b.cpt ? (
                    <span className="ml-2 rounded bg-white px-1 font-sans text-slate-600">
                      CPT {b.cpt}
                    </span>
                  ) : null}
                </span>
                <span className="text-slate-500">{formatWhen(b.slaExpiredAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">No SLA breaches in the current window.</p>
      )}
    </section>
  );
}
