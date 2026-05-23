"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { FDANonDeviceBanner } from "@/components/ins/FDANonDeviceBanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import type { OrderLifecyclePage, OrderLifecycleRow } from "@/lib/ins/order-lifecycle";
import { cn } from "@/lib/utils";

const COL_WIDTHS = {
  order: "w-[11rem]",
  cpt: "w-[4.5rem]",
  aiie: "w-[7rem]",
  scheduling: "w-[7.5rem]",
  coverage: "w-[7rem]",
  pa: "w-[7rem]",
  oop: "w-[6rem]",
} as const;

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function formatMoney(n: number | null): string {
  if (n == null || Number.isNaN(n)) {
    return "—";
  }
  return `$${n.toFixed(0)}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type PillTone = "neutral" | "success" | "warning" | "error" | "info";

function StatusPill({
  label,
  tone = "neutral",
  title,
}: {
  label: string;
  tone?: PillTone;
  title?: string;
}) {
  const toneClass: Record<PillTone, string> = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-900",
    error: "bg-red-50 text-red-800",
    info: "bg-sky-50 text-sky-900",
  };
  return (
    <span
      title={title}
      className={cn(
        "inline-block max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        toneClass[tone],
      )}
    >
      {label}
    </span>
  );
}

function aiiePill(row: OrderLifecycleRow): { label: string; tone: PillTone } {
  const score = row.clinicalScore;
  const tier = row.mnaiTier ?? "—";
  if (score == null) {
    return { label: tier, tone: "neutral" };
  }
  const tone: PillTone = score >= 70 ? "success" : score >= 50 ? "warning" : "error";
  return { label: `${score} · ${tier}`, tone };
}

function schedulingPill(row: OrderLifecycleRow): { label: string; tone: PillTone } {
  const s = row.schedulingStatus;
  if (!s) {
    return { label: "none", tone: "neutral" };
  }
  if (s === "scheduled") {
    return { label: s, tone: "success" };
  }
  if (s === "sla_breached" || s === "cancelled") {
    return { label: s.replace("_", " "), tone: "error" };
  }
  if (s === "in_progress") {
    return { label: "in progress", tone: "info" };
  }
  return { label: s, tone: "warning" };
}

function coveragePill(row: OrderLifecycleRow): { label: string; tone: PillTone } {
  const s = row.coverageStatus;
  if (s === "verified" || s === "covered") {
    return { label: s, tone: "success" };
  }
  if (s === "not_covered") {
    return { label: s.replace("_", " "), tone: "error" };
  }
  if (s === "pending_review") {
    return { label: "pending", tone: "warning" };
  }
  return { label: s.replace("_", " "), tone: "neutral" };
}

function paPill(row: OrderLifecycleRow): { label: string; tone: PillTone } {
  const s = row.paStatus;
  if (!s) {
    return { label: "none", tone: "neutral" };
  }
  if (s === "approved" || s === "auto_approved") {
    return { label: s === "auto_approved" ? "auto" : s, tone: "success" };
  }
  if (s === "denied") {
    return { label: s, tone: "error" };
  }
  return { label: s, tone: "warning" };
}

function oopPill(row: OrderLifecycleRow): { label: string; tone: PillTone } {
  const amt = row.estimatedPatientResponsibility;
  if (amt == null) {
    return { label: "—", tone: "neutral" };
  }
  return { label: formatMoney(amt), tone: "info" };
}

function LifecycleDetailDrawer({
  row,
  open,
  onOpenChange,
}: {
  row: OrderLifecycleRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed right-0 top-0 h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 rounded-none border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:rounded-none"
        aria-describedby={row ? "lifecycle-detail-desc" : undefined}
      >
        <DialogHeader>
          <DialogTitle>Order lifecycle (read-only)</DialogTitle>
          <DialogDescription id="lifecycle-detail-desc">
            De-identified hashes only. Ordering clinician retains responsibility for all decisions.
          </DialogDescription>
        </DialogHeader>
        {row ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Order hash</dt>
              <dd className="mt-0.5 font-mono text-xs break-all text-slate-800">{row.orderHash}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Patient hash</dt>
              <dd className="mt-0.5 font-mono text-xs break-all text-slate-800">{row.patientHash}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">CPT</dt>
                <dd className="mt-0.5 font-mono">{row.cpt ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">AIIE scored</dt>
                <dd className="mt-0.5">{formatDate(row.auditAt)}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Clinical score</dt>
                <dd className="mt-0.5">{row.clinicalScore ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">MNAI tier</dt>
                <dd className="mt-0.5">{row.mnaiTier ?? "—"}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Scheduling</dt>
              <dd className="mt-0.5">
                {row.schedulingStatus ?? "—"}
                {row.slaExpiresAt ? ` · SLA ${formatDate(row.slaExpiresAt)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Coverage</dt>
              <dd className="mt-0.5">{row.coverageStatus}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Prior authorization</dt>
              <dd className="mt-0.5">
                {row.paStatus ?? "—"}
                {row.paDecisionAt ? ` · ${formatDate(row.paDecisionAt)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Est. patient responsibility</dt>
              <dd className="mt-0.5">{formatMoney(row.estimatedPatientResponsibility)}</dd>
            </div>
          </dl>
        ) : null}
        <p className="mt-6 text-[11px] leading-snug text-slate-500">
          This recommendation is provided by ARKA Imaging Intelligence Engine, an FDA Non-Device Clinical
          Decision Support tool under the 21st Century Cures Act. The ordering clinician retains full
          responsibility for the final decision.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dense order lifecycle table for provider and scheduler dashboards (hashed ids only).
 */
export function OrderLifecycleTable() {
  const [data, setData] = React.useState<OrderLifecyclePage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [cptFilter, setCptFilter] = React.useState("");
  const [daysBack, setDaysBack] = React.useState(30);
  const [selected, setSelected] = React.useState<OrderLifecycleRow | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [focusIndex, setFocusIndex] = React.useState(0);
  const rowRefs = React.useRef<Array<HTMLTableRowElement | null>>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const url = new URL("/api/ins/lifecycle", base);
      url.searchParams.set("page", String(page));
      url.searchParams.set("daysBack", String(daysBack));
      if (statusFilter.trim()) {
        url.searchParams.set("status", statusFilter.trim());
      }
      if (cptFilter.trim()) {
        url.searchParams.set("cpt", cptFilter.trim());
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const json = (await res.json()) as OrderLifecyclePage;
      setData(json);
      setFocusIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load lifecycle rows.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, cptFilter, daysBack]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const rows = data?.rows ?? [];

  const openRow = (row: OrderLifecycleRow, index: number) => {
    setSelected(row);
    setFocusIndex(index);
    setDrawerOpen(true);
  };

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
    if (rows.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(rows.length - 1, focusIndex + 1);
      setFocusIndex(next);
      rowRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(0, focusIndex - 1);
      setFocusIndex(prev);
      rowRefs.current[prev]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const row = rows[focusIndex];
      if (row) {
        openRow(row, focusIndex);
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusIndex(0);
      rowRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = rows.length - 1;
      setFocusIndex(last);
      rowRefs.current[last]?.focus();
    }
  };

  return (
    <div className="min-h-[50vh] bg-slate-50">
      <FDANonDeviceBanner product="INS" />
      <DemoModeWatermark />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Order lifecycle</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Single-pane view of in-flight imaging orders: AIIE score, scheduling, coverage, PA, and OOP
            estimate. Identifiers are SHA-256 hashes only.
          </p>
        </header>

        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Status
            <input
              type="text"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              placeholder="e.g. pending"
              className="w-32 rounded border border-slate-200 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            CPT
            <input
              type="text"
              value={cptFilter}
              onChange={(e) => {
                setPage(1);
                setCptFilter(e.target.value);
              }}
              placeholder="72148"
              className="w-24 rounded border border-slate-200 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Days back
            <select
              value={daysBack}
              onChange={(e) => {
                setPage(1);
                setDaysBack(Number(e.target.value));
              }}
              className="rounded border border-slate-200 px-2 py-1 text-sm"
            >
              <option value={7}>7</option>
              <option value={30}>30</option>
              <option value={90}>90</option>
              <option value={365}>365</option>
            </select>
          </label>
          {loading ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading…
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <TableScrollWrapper className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className={cn("px-2 py-2", COL_WIDTHS.order)} scope="col">
                  Order
                </th>
                <th className={cn("px-2 py-2", COL_WIDTHS.cpt)} scope="col">
                  CPT
                </th>
                <th className={cn("px-2 py-2", COL_WIDTHS.aiie)} scope="col">
                  AIIE
                </th>
                <th className={cn("px-2 py-2", COL_WIDTHS.scheduling)} scope="col">
                  Scheduling
                </th>
                <th className={cn("px-2 py-2", COL_WIDTHS.coverage)} scope="col">
                  Coverage
                </th>
                <th className={cn("px-2 py-2", COL_WIDTHS.pa)} scope="col">
                  PA
                </th>
                <th className={cn("px-2 py-2", COL_WIDTHS.oop)} scope="col">
                  OOP
                </th>
              </tr>
            </thead>
            <tbody onKeyDown={handleTableKeyDown}>
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No in-flight orders match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const aiie = aiiePill(row);
                  const sched = schedulingPill(row);
                  const cov = coveragePill(row);
                  const pa = paPill(row);
                  const oop = oopPill(row);
                  return (
                    <tr
                      key={row.orderHash}
                      ref={(el) => {
                        rowRefs.current[i] = el;
                      }}
                      tabIndex={i === focusIndex ? 0 : -1}
                      className={cn(
                        "cursor-pointer border-b border-slate-100 outline-none hover:bg-slate-50 focus:bg-arka-teal/5 focus:ring-2 focus:ring-inset focus:ring-arka-teal",
                      )}
                      onClick={() => openRow(row, i)}
                      onFocus={() => setFocusIndex(i)}
                      aria-label={`Order ${truncateHash(row.orderHash)}`}
                    >
                      <td className={cn("px-2 py-2 font-mono text-xs", COL_WIDTHS.order)}>
                        {truncateHash(row.orderHash)}
                      </td>
                      <td className={cn("px-2 py-2 font-mono text-xs", COL_WIDTHS.cpt)}>
                        {row.cpt ?? "—"}
                      </td>
                      <td className={cn("px-2 py-2", COL_WIDTHS.aiie)}>
                        <StatusPill label={aiie.label} tone={aiie.tone} />
                      </td>
                      <td className={cn("px-2 py-2", COL_WIDTHS.scheduling)}>
                        <StatusPill label={sched.label} tone={sched.tone} title={row.slaExpiresAt ?? undefined} />
                      </td>
                      <td className={cn("px-2 py-2", COL_WIDTHS.coverage)}>
                        <StatusPill label={cov.label} tone={cov.tone} />
                      </td>
                      <td className={cn("px-2 py-2", COL_WIDTHS.pa)}>
                        <StatusPill label={pa.label} tone={pa.tone} />
                      </td>
                      <td className={cn("px-2 py-2", COL_WIDTHS.oop)}>
                        <StatusPill label={oop.label} tone={oop.tone} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScrollWrapper>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {data?.page ?? page} · {data?.total ?? 0} orders
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Prev
            </button>
            <button
              type="button"
              disabled={!data?.hasMore || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <LifecycleDetailDrawer
        row={selected}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) {
            rowRefs.current[focusIndex]?.focus();
          }
        }}
      />
    </div>
  );
}
