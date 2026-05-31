"use client";

import { motion, useInView } from "framer-motion";
import {
  Clock,
  Gauge,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { Cell, Pie, PieChart } from "recharts";

import {
  ASSUMPTIONS,
  CITATIONS,
  HEADLINE_STATS,
  RESULTS,
  WATERFALL,
  formatUsd,
} from "@/lib/roi/roi-model";

const CHART_TEAL = "#14B8A6";
const CHART_SLATE = "#475569";
const GRID_STROKE = "#1E293B";
const TICK_FILL = "#E2E8F0";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

function useFadeInRef() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return { ref, isInView };
}

function FadeSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, isInView } = useFadeInRef();
  return (
    <motion.div
      ref={ref}
      initial={fadeIn.initial}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={fadeIn.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function citationFootnote(id: string): number {
  const index = CITATIONS.findIndex((c) => c.id === id);
  return index >= 0 ? index + 1 : 0;
}

const ASSUMPTION_ROWS: { label: string; value: string }[] = [
  {
    label: "Advanced imaging studies / yr",
    value: ASSUMPTIONS.annualAdvancedStudies.toLocaleString(),
  },
  {
    label: "Prior-auth denial rate (conservative)",
    value: `${ASSUMPTIONS.denialRatePct}% (published range 20–40%)`,
  },
  {
    label: "Share of denials that are avoidable",
    value: `${ASSUMPTIONS.avoidablePct}%`,
  },
  {
    label: "Blended value at risk per avoidable order",
    value: formatUsd(ASSUMPTIONS.blendedValuePerOrder),
  },
  {
    label: "Orders ARKA converts to clean pays (conservative)",
    value: `${RESULTS.ordersRecovered.toLocaleString()} (${ASSUMPTIONS.arkaCaptureOfStudiesPct}% of studies)`,
  },
  {
    label: "Cost to rework one denied claim",
    value: formatUsd(ASSUMPTIONS.reworkCostPerClaim),
  },
  {
    label: "Throughput recovery (highest-margin line)",
    value: formatUsd(ASSUMPTIONS.throughputRecovery),
  },
];

const VALUE_LEVERS = [
  {
    title: "Denial recovery",
    body: WATERFALL[0].note,
    icon: TrendingUp,
  },
  {
    title: "Rework labor avoided",
    body: WATERFALL[1].note,
    icon: Clock,
  },
  {
    title: "Throughput defense",
    body: WATERFALL[2].note,
    icon: Gauge,
  },
  {
    title: "Admin redirected",
    body:
      "When the clinician's documentation is complete, clean orders clear payer review without a queue.",
    icon: ShieldCheck,
  },
] as const;

const INDUSTRY_CALLOUTS = [
  {
    figure: "Fewer than 1%",
    rest: "of denied in-network claims are ever appealed.",
    source: "KFF 2023",
    citationId: "kff-2023",
  },
  {
    figure: "Physicians spend ~13 hours/week",
    rest: "on prior authorization.",
    source: "AMA 2024",
    citationId: "ama-survey",
  },
  {
    figure: "~18%",
    rest: "of Medicare Advantage payment denials reviewed were improper.",
    source: "HHS OIG",
    citationId: "oig-ma",
  },
  {
    figure: "86%",
    rest: "of denials are potentially avoidable (34% unequivocally avoidable).",
    source: "Change Healthcare 2020",
    citationId: "change-healthcare",
  },
] as const;

const modeledAnnualCost = Math.round(
  RESULTS.grossRecovery / ASSUMPTIONS.modeledFirstYearReturnX,
);

const COST_COMPARISON = [
  { name: "ARKA annual cost", value: modeledAnnualCost },
  { name: "Modeled gross recovery", value: Math.round(RESULTS.grossRecovery) },
] as const;

type WaterfallRow = { name: string; value: number; note: string };

/**
 * Client-rendered ROI breakdown page with Recharts visualizations.
 */
export function RoiPageClient() {
  const waterfallData: WaterfallRow[] = WATERFALL.map((w) => ({ ...w }));

  return (
    <div className="min-h-screen bg-arka-bg-dark text-arka-text-soft">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* 1 — Hero */}
        <header className="border-b border-arka-deep/50 pb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-arka-teal">
            ARKA ROI MODEL · CONSERVATIVE CASE
          </p>
          <h1 className="mt-4 text-3xl font-bold text-arka-text sm:text-5xl">
            The math a CFO can sign
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-arka-text-soft sm:text-lg">
            Modeled for a regional hospital group running ~120,000 advanced imaging studies a
            year. Every figure is a conservative estimate built on published CAQH, KFF, MGMA, AMA,
            ACR, Change Healthcare, and Johns Hopkins data — sourced at the bottom of this page.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block text-sm font-medium text-arka-cyan transition-colors hover:text-white"
          >
            ← Back to home
          </Link>
        </header>

        {/* 2 — Headline stats */}
        <FadeSection className="mt-14">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {HEADLINE_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-arka-deep/60 bg-arka-bg-medium/40 p-6"
              >
                <p className="text-4xl font-bold text-arka-cyan sm:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm text-arka-text-soft">{stat.label}</p>
              </div>
            ))}
          </div>
        </FadeSection>

        {/* 3 — Recovery waterfall */}
        <FadeSection className="mt-16">
          <h2 className="text-2xl font-bold text-arka-text sm:text-3xl">
            Where the ~$3.5M comes from
          </h2>
          <div className="mt-8 w-full">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={waterfallData} margin={{ top: 28, right: 8, left: 8, bottom: 48 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={72}
                />
                <YAxis
                  tick={{ fill: TICK_FILL, fontSize: 12 }}
                  tickFormatter={(v: number) => formatUsd(v)}
                />
                <Tooltip
                  formatter={(value, _name, item) => {
                    const row = item as { payload?: WaterfallRow };
                    return [formatUsd(Number(value ?? 0)), row.payload?.note ?? ""];
                  }}
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid rgba(30,41,59,0.8)",
                    borderRadius: "8px",
                    color: "#E2E8F0",
                    maxWidth: "280px",
                  }}
                  labelStyle={{ color: "#E2E8F0", fontWeight: 600 }}
                />
                <Bar dataKey="value" fill={CHART_TEAL} radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(label) => formatUsd(Number(label))}
                    fill={TICK_FILL}
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 rounded-xl border border-arka-teal/30 bg-arka-bg-medium/50 px-5 py-4 text-center text-lg font-semibold text-arka-text">
            Modeled gross recovery: {formatUsd(RESULTS.grossRecovery)} / yr
          </p>
        </FadeSection>

        {/* 4 — How the model works */}
        <FadeSection className="mt-16">
          <h2 className="text-2xl font-bold text-arka-text sm:text-3xl">How the model works</h2>
          <dl className="mt-8 overflow-hidden rounded-xl border border-arka-deep/60 bg-arka-bg-medium/30">
            {ASSUMPTION_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid gap-2 px-5 py-4 sm:grid-cols-2 sm:gap-6 ${
                  i < ASSUMPTION_ROWS.length - 1 ? "border-b border-arka-deep/40" : ""
                }`}
              >
                <dt className="text-sm text-arka-text-soft">{row.label}</dt>
                <dd className="text-sm font-semibold text-arka-text sm:text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </FadeSection>

        {/* 5 — Four value levers */}
        <FadeSection className="mt-16">
          <h2 className="text-2xl font-bold text-arka-text sm:text-3xl">Four value levers</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {VALUE_LEVERS.map((lever) => {
              const Icon = lever.icon;
              return (
                <div
                  key={lever.title}
                  className="rounded-xl border border-arka-deep/60 bg-arka-bg-medium/40 p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-arka-teal/20 text-arka-teal">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-arka-text">{lever.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-arka-text-soft">{lever.body}</p>
                </div>
              );
            })}
          </div>
        </FadeSection>

        {/* 6 — Pricing & return */}
        <FadeSection className="mt-16">
          <div className="rounded-xl border border-arka-deep/60 bg-arka-bg-medium/40 px-6 py-8 text-center">
            <p className="text-lg font-semibold text-arka-text sm:text-xl">
              Priced at ~${ASSUMPTIONS.pmpmLow.toFixed(2)}–${ASSUMPTIONS.pmpmHigh.toFixed(2)} PMPM
              — a modeled ~{ASSUMPTIONS.modeledFirstYearReturnX}× first-year return.
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:justify-center">
            <div className="h-[260px] w-full max-w-sm">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[...COST_COMPARISON]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {[...COST_COMPARISON].map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0 ? CHART_SLATE : CHART_TEAL}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatUsd(Number(value ?? 0))}
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "1px solid rgba(30,41,59,0.8)",
                      borderRadius: "8px",
                      color: "#E2E8F0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-sm text-arka-text-soft">
              {COST_COMPARISON.map((row, index) => (
                <li key={row.name} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: index === 0 ? CHART_SLATE : CHART_TEAL }}
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-arka-text">{row.name}:</span>{" "}
                    {formatUsd(row.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-center text-sm text-arka-text-soft">
            Modeled ARKA annual cost ({formatUsd(modeledAnnualCost)}) vs. modeled gross recovery (
            {formatUsd(RESULTS.grossRecovery)}) at ~{ASSUMPTIONS.modeledFirstYearReturnX}× return.
          </p>
        </FadeSection>

        {/* 7 — Industry context */}
        <FadeSection className="mt-16">
          <h2 className="text-xl font-bold text-arka-text sm:text-2xl">Industry context</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRY_CALLOUTS.map((item) => {
              const cite = CITATIONS.find((c) => c.id === item.citationId);
              const footnote = citationFootnote(item.citationId);
              return (
                <div
                  key={item.citationId}
                  className="rounded-xl border border-arka-deep/60 bg-arka-bg-medium/30 p-5"
                >
                  <p className="text-sm leading-relaxed text-arka-text-soft">
                    <span className="font-bold text-arka-text">{item.figure}</span> {item.rest}
                    {footnote > 0 ? (
                      <sup className="ml-0.5 text-arka-cyan">
                        <a href={`#source-${item.citationId}`} className="hover:text-white">
                          {footnote}
                        </a>
                      </sup>
                    ) : null}
                  </p>
                  {cite ? (
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-xs font-medium text-arka-cyan hover:text-white"
                    >
                      {item.source} ↗
                    </a>
                  ) : (
                    <span className="mt-3 inline-block text-xs text-arka-text-soft">
                      {item.source}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </FadeSection>

        {/* 8 — Sources */}
        <FadeSection className="mt-16 border-t border-arka-deep/50 pt-12">
          <h2 className="text-2xl font-bold text-arka-text">Sources</h2>
          <ol className="mt-8 list-decimal space-y-6 pl-5">
            {CITATIONS.map((cite, index) => (
              <li key={cite.id} id={`source-${cite.id}`} className="scroll-mt-24 pl-2">
                <p className="font-semibold text-arka-text">
                  {index + 1}. {cite.label}
                </p>
                <p className="mt-1 text-sm text-arka-text-soft">{cite.detail}</p>
                <a
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block break-all text-sm text-arka-cyan hover:text-white"
                >
                  {cite.url}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-xs text-arka-text-soft/60">
            Modeled, conservative estimate. ARKA is Non-Device CDS — figures are decision-support
            economics, not a guarantee of outcomes. Aggressive case ≈ 1.5× the conservative
            figures.
          </p>
        </FadeSection>
      </div>
    </div>
  );
}
