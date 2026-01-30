"use client";

import { clsx } from "clsx";

export interface RadiationBadgeProps {
  doseMsv: number;
  className?: string;
}

function getLevel(msv: number): "none" | "low" | "moderate" | "high" {
  if (msv <= 0) return "none";
  if (msv < 1) return "low";
  if (msv < 10) return "moderate";
  return "high";
}

export function RadiationBadge({ doseMsv, className }: RadiationBadgeProps) {
  const level = getLevel(doseMsv);
  const label =
    level === "none"
      ? "None"
      : level === "low"
        ? "<1 mSv"
        : level === "moderate"
          ? "1–10 mSv"
          : ">10 mSv";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
        level === "none" && "bg-emerald-500/20 text-emerald-300",
        level === "low" && "bg-arka-cyan/20 text-arka-cyan",
        level === "moderate" && "bg-amber-500/20 text-amber-300",
        level === "high" && "bg-red-500/20 text-red-300",
        className
      )}
    >
      {doseMsv > 0 ? `${doseMsv} mSv` : label}
    </span>
  );
}
