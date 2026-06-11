"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface ScoreRingProps {
  /** AIIE appropriateness score from 1 (low) to 9 (high). */
  score: number;
  /** Outer diameter in pixels. */
  size?: number;
  /** Optional label below the score (e.g. "AIIE"). */
  label?: string;
  /** Animate stroke on mount / score change. */
  animate?: boolean;
  className?: string;
}

type ScoreBand = "danger" | "warning" | "success";

/** Maps score 1–9 to clinical status band. */
function scoreBand(score: number): ScoreBand {
  if (score <= 3) return "danger";
  if (score <= 6) return "warning";
  return "success";
}

const strokeColors: Record<ScoreBand, string> = {
  danger: "#DC2626",
  warning: "#D97706",
  success: "#059669",
};

const trackColors: Record<ScoreBand, string> = {
  danger: "#FEE2E2",
  warning: "#FEF3C7",
  success: "#D1FAE5",
};

/**
 * Signature AIIE circular gauge — animated SVG ring with accessible meter semantics.
 */
export function ScoreRing({
  score,
  size = 120,
  label = "AIIE",
  animate = true,
  className,
}: ScoreRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.min(9, Math.max(1, Math.round(score)));
  const band = scoreBand(clamped);
  const stroke = strokeColors[band];
  const track = trackColors[band];

  const strokeWidth = Math.max(6, Math.round(size * 0.08));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamped / 9;
  const center = size / 2;

  const shouldAnimate = animate && !prefersReducedMotion;
  const compact = size < 48;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={1}
      aria-valuemax={9}
      aria-label={`${label} score ${clamped} out of 9`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block overflow-visible"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            shouldAnimate
              ? { strokeDashoffset: circumference }
              : { strokeDashoffset: circumference * (1 - progress) }
          }
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={
            shouldAnimate
              ? { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0 }
          }
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden
      >
        <span
          className={cn(
            "tabular-nums font-semibold leading-none text-arka-slate-900",
            compact ? "text-[11px]" : "text-h2",
          )}
        >
          {clamped}
        </span>
        {!compact ? (
          <span className="mt-0.5 text-caption text-arka-slate-500">/9</span>
        ) : null}
        {label && !compact ? (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-arka-slate-400">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
