"use client";

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { BookOpen, Landmark } from "lucide-react";

import type { ReviewerHistoryRow, ReviewerQueueCase } from "@/lib/ins/reviewer-types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { Badge } from "@/components/demos/ins/ui/Badge";

export interface CaseDetailProps {
  caseRow: ReviewerQueueCase | null;
  className?: string;
}

function AiieScoreGauge({ score }: { score: number }) {
  const segments = 9;
  const clamped = Math.min(9, Math.max(1, Math.round(score)));
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={`AIIE appropriateness score ${clamped} out of 9`}
    >
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={cn("h-8 w-3 rounded-sm transition-colors", i < clamped ? "bg-arka-teal" : "bg-slate-200")}
        />
      ))}
    </div>
  );
}

function FactorBars({ factors, mode }: { factors: { id: string; label: string; contribution: number }[]; mode: "pos" | "neg" }) {
  const max = Math.max(...factors.map((f) => Math.abs(f.contribution)), 0.0001);
  return (
    <ul className="space-y-3">
      {factors.map((f) => (
        <li key={f.id}>
          <div className="mb-1 flex justify-between gap-2 text-xs text-slate-600">
            <span className="leading-snug">{f.label}</span>
            <span className="shrink-0 font-mono text-slate-800">
              {f.contribution > 0 ? "+" : ""}
              {f.contribution.toFixed(1)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-2 rounded-full", mode === "pos" ? "bg-emerald-500" : "bg-rose-500")}
              style={{ width: `${(Math.abs(f.contribution) / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/**
 * Center column: tabbed case detail (clinical, coverage, OOP, DTR, history).
 */
export function CaseDetail({ caseRow, className }: CaseDetailProps) {
  const [history, setHistory] = React.useState<ReviewerHistoryRow[] | null>(null);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  React.useEffect(() => {
    if (!caseRow) {
      const t = window.setTimeout(() => setHistory(null), 0);
      return () => window.clearTimeout(t);
    }
    const ac = new AbortController();
    const boot = window.setTimeout(() => {
      setHistoryLoading(true);
      setHistoryError(null);
    }, 0);
    const u = new URL("/api/ins/reviewer/history", window.location.origin);
    u.searchParams.set("providerId", caseRow.providerId);
    u.searchParams.set("cptCode", caseRow.cptCode);
    u.searchParams.set("payerId", caseRow.payerId);
    fetch(u.toString(), { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          throw new Error(j.error ?? "History request failed");
        }
        return res.json() as Promise<{ rows: ReviewerHistoryRow[] }>;
      })
      .then((data) => {
        setHistory(data.rows);
      })
      .catch((e: unknown) => {
        if ((e as Error).name === "AbortError") return;
        setHistoryError(e instanceof Error ? e.message : "Unable to load history");
        setHistory([]);
      })
      .finally(() => setHistoryLoading(false));

    return () => {
      window.clearTimeout(boot);
      ac.abort();
    };
  }, [caseRow]);

  if (!caseRow) {
    return (
      <section
        className={cn("flex min-h-[320px] flex-1 items-center justify-center bg-white p-6 text-sm text-slate-500", className)}
      >
        Select a case from the queue to review.
      </section>
    );
  }

  const pos = [...caseRow.clinical.positiveFactors]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
  const neg = [...caseRow.clinical.negativeFactors]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  return (
    <section className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-white", className)}>
      <Tabs.Root defaultValue="clinical" className="flex min-h-0 flex-1 flex-col">
        <Tabs.List
          className="flex shrink-0 flex-wrap gap-1 border-b border-slate-200 bg-slate-50/90 px-2 py-2"
          aria-label="Case sections"
        >
          {(
            [
              ["clinical", "Clinical"],
              ["coverage", "Coverage"],
              ["oop", "OOP"],
              ["documentation", "Documentation"],
              ["history", "History"],
            ] as const
          ).map(([value, label]) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-slate-600 outline-none transition-colors",
                "hover:bg-white hover:text-slate-900",
                "data-[state=active]:bg-white data-[state=active]:text-arka-teal data-[state=active]:shadow-sm",
                "focus-visible:ring-2 focus-visible:ring-arka-teal/40",
              )}
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="clinical" className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-xl space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AIIE score (1–9)</p>
              <div className="mt-2 flex items-end gap-4">
                <AiieScoreGauge score={caseRow.clinical.score} />
                <span className="text-3xl font-semibold text-slate-900">{caseRow.clinical.score}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                At most seven factors shown below (Miller guideline); full factor engine output is available to ARKA
                auditors.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-emerald-800">Top positive contributions</h3>
                <FactorBars factors={pos} mode="pos" />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-rose-800">Top negative contributions</h3>
                <FactorBars factors={neg} mode="neg" />
              </div>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BookOpen className="h-4 w-4 text-arka-teal" aria-hidden />
                Guideline citations
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {caseRow.clinical.guidelineCitations.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="coverage" className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-xl space-y-4">
            <Card variant="default">
              <CardHeader compact>
                <CardTitle as="h3" className="text-base">
                  Parsed coverage
                </CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Plan:</span> {caseRow.coverage.planName}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Member (masked):</span>{" "}
                  {caseRow.coverage.memberIdMasked}
                </p>
                <p className="leading-relaxed">{caseRow.coverage.parsedSummary}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge status={caseRow.coverage.paRequired ? "warning" : "success"} variant="subtle" size="sm">
                    PA {caseRow.coverage.paRequired ? "required" : "not required"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader compact>
                <CardTitle as="h3" className="flex items-center gap-2 text-base">
                  <Landmark className="h-4 w-4 text-arka-teal" aria-hidden />
                  Gold Card status
                </CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Eligible:</span>{" "}
                  {caseRow.coverage.goldCardEligible ? "Yes" : "No"}
                </p>
                {caseRow.coverage.goldCardScore !== undefined && (
                  <p>
                    <span className="font-medium text-slate-900">Gold card score:</span>{" "}
                    {caseRow.coverage.goldCardScore}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="oop" className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-xl space-y-4 text-sm text-slate-700">
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Patient responsibility</h3>
              <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Deductible remaining</dt>
                  <dd className="font-mono text-slate-900">{formatUsd(caseRow.oop.deductibleRemainingUsd)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Coinsurance</dt>
                  <dd className="font-mono text-slate-900">{caseRow.oop.coinsurancePct}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Est. patient pay</dt>
                  <dd className="font-mono font-semibold text-slate-900">{formatUsd(caseRow.oop.estimatedPatientPayUsd)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Cash-pay comparator</dt>
                  <dd className="font-mono text-slate-900">{formatUsd(caseRow.oop.cashPayComparatorUsd)}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Alternative sites</h3>
              <ul className="mt-2 space-y-2">
                {caseRow.oop.alternativeSites.map((s) => (
                  <li key={s.name} className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{s.name}</span>
                      <span className="text-xs text-slate-500">{s.distanceMiles} mi</span>
                    </div>
                    <p className="mt-1 font-mono text-sm text-slate-800">Cash {formatUsd(s.cashPriceUsd)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="documentation" className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-xl">
            <p className="mb-3 text-sm text-slate-600">
              DTR questionnaire (read-only). Responses reflect prefetch-backed initials where available.
            </p>
            <ul className="space-y-3">
              {caseRow.dtr.items.map((item) => (
                <li key={item.linkId} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-sm font-medium text-slate-900">{item.text}</p>
                  <p className="mt-1 text-xs uppercase text-slate-500">Type: {item.type}</p>
                  {item.prefilled !== undefined && (
                    <p className="mt-2 rounded border border-dashed border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800">
                      {item.prefilled || "—"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Tabs.Content>

        <Tabs.Content value="history" className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-xl text-sm">
            {historyLoading && <p className="text-slate-500">Loading PA history…</p>}
            {historyError && <p className="text-rose-700">{historyError}</p>}
            {!historyLoading && history && history.length === 0 && (
              <p className="text-slate-600">No prior rows in `ins_pa_history` for this provider, CPT, and payer yet.</p>
            )}
            {!historyLoading && history && history.length > 0 && (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {history.map((h, i) => (
                  <li key={`${h.submittedAt}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="text-slate-600">{new Date(h.submittedAt).toLocaleString()}</span>
                    <Badge
                      status={h.decision === "denied" ? "error" : "success"}
                      variant="subtle"
                      size="sm"
                      className="capitalize"
                    >
                      {h.decision.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
