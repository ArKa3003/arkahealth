"use client";

import { clsx } from "clsx";

interface ClinAppropriatenessIndicatorProps {
  trafficLight: "green" | "yellow" | "red";
  score: number;
}

const config = {
  green: {
    label: "APPROPRIATE",
    bg: "bg-arka-cyan/30 border-arka-cyan",
    text: "text-arka-cyan",
    icon: "✓",
  },
  yellow: {
    label: "MAY BE APPROPRIATE",
    bg: "bg-amber-500/20 border-amber-500/50",
    text: "text-amber-800",
    icon: "?",
  },
  red: {
    label: "NOT APPROPRIATE",
    bg: "bg-red-500/20 border-red-500/50",
    text: "text-red-900",
    icon: "✗",
  },
};

export function ClinAppropriatenessIndicator({
  trafficLight,
  score,
}: ClinAppropriatenessIndicatorProps) {
  const c = config[trafficLight];
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={clsx(
          "flex flex-col items-center justify-center min-h-[120px] min-w-[120px] h-[130px] w-[130px] sm:h-[140px] sm:w-[140px] rounded-full border-4 shadow-lg p-2",
          c.bg,
          c.text
        )}
        role="status"
        aria-label={c.label}
      >
        <span className="text-3xl sm:text-4xl font-bold">{c.icon}</span>
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide mt-0.5">
          {c.label}
        </span>
      </div>
      {score > 0 ? (
        <div className="text-center">
          <span className="text-xl sm:text-2xl font-bold text-slate-800">
            {score} <span className="text-slate-600 font-semibold">/9</span>
          </span>
        </div>
      ) : (
        <div className="text-slate-600 text-lg font-bold">N/A</div>
      )}
    </div>
  );
}
