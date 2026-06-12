"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DOCUMENT_LIBRARY,
  MILESTONES,
  type MilestoneState,
} from "@/lib/security/compliance-data";

const DOCUMENT_COVERAGE = [...DOCUMENT_LIBRARY]
  .map(({ series, items }) => ({ series, count: items.length }))
  .sort((a, b) => b.count - a.count);

const COVERAGE_ARIA_LABEL = DOCUMENT_COVERAGE.map(
  ({ series, count }) => `${series} ${count} document${count === 1 ? "" : "s"}`,
).join(", ");

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
  },
  labelStyle: { color: "#0f172a", fontWeight: 600 },
  itemStyle: { color: "#475569" },
  cursor: { fill: "rgba(20,184,166,0.06)" },
} as const;

function MilestoneNode({ state }: { state: MilestoneState }) {
  if (state === "done") {
    return (
      <div
        className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-arka-teal-500 bg-arka-teal-500"
        aria-hidden
      >
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (state === "active") {
    return (
      <div className="relative h-4 w-4" aria-hidden>
        <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-arka-teal-500 opacity-40 motion-reduce:animate-none" />
        <span className="relative block h-4 w-4 rounded-full border-2 border-arka-teal-500 bg-white" />
      </div>
    );
  }

  return (
    <div
      className="h-4 w-4 rounded-full border-2 border-border-strong bg-white"
      aria-hidden
    />
  );
}

/**
 * Certification roadmap timeline and compliance document coverage chart for /security.
 */
export function CertificationTimeline() {
  const [chartReady, setChartReady] = React.useState(false);

  React.useEffect(() => {
    setChartReady(true);
  }, []);

  return (
    <section id="timeline" className="scroll-mt-24 bg-arka-bg-light py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-bold text-arka-text-dark">
            Where we are on the road to certification
          </h2>
          <p className="mt-3 text-arka-text-dark-muted">
            Published timeline, no vague &apos;coming soon&apos;: these are the same dates in our
            board-approved roadmap (ARKA-RDY-004).
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-5 lg:gap-12">
          <div className="min-w-0 lg:col-span-3">
            <ol aria-label="Certification milestones" className="relative">
              <div
                className="absolute bottom-2 left-[7px] top-2 w-px bg-border-strong"
                aria-hidden
              />
              {MILESTONES.map((milestone) => (
                <li
                  key={`${milestone.quarter}-${milestone.title}`}
                  className="relative pb-8 pl-8 last:pb-0"
                >
                  <div className="absolute left-0 top-0.5">
                    <MilestoneNode state={milestone.state} />
                  </div>
                  <p className="font-mono text-xs uppercase tracking-wide text-arka-teal-700">
                    {milestone.quarter}
                  </p>
                  <p className="font-semibold text-arka-text-dark">{milestone.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-arka-text-dark-muted">
                    {milestone.detail}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white p-6">
              <h3 className="font-semibold text-arka-text-dark">Compliance package coverage</h3>
              <p className="mt-1 text-sm text-arka-text-dark-muted">
                21 controlled documents by series
              </p>

              <div
                className="mt-4 min-h-[260px] min-w-0 overflow-hidden"
                role="img"
                aria-label={`Compliance package coverage: ${COVERAGE_ARIA_LABEL}`}
              >
                {chartReady ? (
                  <ResponsiveContainer width="100%" height={260} minWidth={0}>
                    <BarChart
                      data={DOCUMENT_COVERAGE}
                      layout="vertical"
                      margin={{ top: 4, right: 32, left: 0, bottom: 4 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="series"
                        width={72}
                        tick={{ fill: "#475569", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar
                        dataKey="count"
                        fill="#14B8A6"
                        radius={[0, 6, 6, 0]}
                        barSize={18}
                        name="Documents"
                      >
                        <LabelList
                          dataKey="count"
                          position="right"
                          fill="#0F172A"
                          fontSize={12}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] animate-pulse rounded-lg bg-arka-bg-alt motion-reduce:animate-none" />
                )}
              </div>

              <table className="sr-only">
                <caption>Compliance package coverage by document series</caption>
                <thead>
                  <tr>
                    <th scope="col">Series</th>
                    <th scope="col">Document count</th>
                  </tr>
                </thead>
                <tbody>
                  {DOCUMENT_COVERAGE.map(({ series, count }) => (
                    <tr key={series}>
                      <td>{series}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-2 text-xs text-arka-text-dark-soft">
                Index: ARKA-IDX-000 · Package shared under NDA — see Documents below.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
