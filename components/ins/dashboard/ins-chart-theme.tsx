"use client";

/** ARKA-teal ramp for INS charts. */
export const INS_CHART_COLORS = {
  primary: "#14B8A6",
  primaryLight: "#5EEAD4",
  primaryDark: "#0D9488",
  grid: "rgba(15, 23, 42, 0.06)",
  axis: "#64748B",
  funnel: ["#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF", "#14B8A6", "#0D9488"],
} as const;

export const INS_CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };

type InsChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
  valueFormatter?: (value: number) => string;
};

/**
 * Dark tooltip matching the design-system tooltip primitive.
 */
export function InsChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: InsChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const raw = typeof entry?.value === "number" ? entry.value : Number(entry?.value ?? 0);
  const formatted = valueFormatter ? valueFormatter(raw) : String(raw);

  return (
    <div className="rounded-radius-md border border-arka-slate-700 bg-arka-slate-900 px-3 py-2 text-xs text-arka-slate-100 shadow-elevation-3">
      {label ? <p className="mb-1 font-medium text-arka-slate-300">{label}</p> : null}
      <p className="tabular-nums font-semibold text-white">{formatted}</p>
    </div>
  );
}
