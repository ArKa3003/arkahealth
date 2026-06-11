"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  INS_CHART_COLORS,
  INS_CHART_MARGIN,
  InsChartTooltip,
} from "./ins-chart-theme";

export type PayerDashboardChartsProps = {
  funnelData: Array<{ stage: string; count: number }>;
  paretoData: Array<{ reason: string; count: number }>;
};

/**
 * Lazy-loaded Recharts pair for the INS payer dashboard (funnel + Pareto).
 * Kept out of the main client bundle to improve LCP on /ins/dashboard.
 */
export function PayerDashboardCharts({ funnelData, paretoData }: PayerDashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1">
        <h2 className="text-sm font-semibold text-arka-slate-900">Approval funnel</h2>
        <p className="mt-0.5 text-caption text-arka-slate-500">Submitted → AIIE → disposition (30d)</p>
        <div className="mt-4 h-64 min-h-64 w-full" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
            <BarChart data={funnelData} layout="vertical" margin={INS_CHART_MARGIN}>
              <CartesianGrid stroke={INS_CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="stage"
                width={110}
                tick={{ fill: INS_CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<InsChartTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={INS_CHART_COLORS.funnel[i % INS_CHART_COLORS.funnel.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1">
        <h2 className="text-sm font-semibold text-arka-slate-900">Denial reasons (Pareto)</h2>
        <p className="mt-0.5 text-caption text-arka-slate-500">AIIE factor-specific, not boilerplate</p>
        <div className="mt-4 h-64 min-h-64 w-full" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
            <BarChart data={paretoData} margin={{ ...INS_CHART_MARGIN, left: 0, bottom: 4 }}>
              <CartesianGrid stroke={INS_CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="reason"
                tick={{ fill: INS_CHART_COLORS.axis, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={52}
              />
              <YAxis hide />
              <Tooltip content={<InsChartTooltip />} />
              <Bar dataKey="count" fill={INS_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
