"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { EVALUATION_STEPS } from "./clin-cockpit-utils";

export interface EvaluationStepTrackerProps {
  /** Zero-based index of the active step; steps before this show checkmarks. */
  activeStep: number;
  className?: string;
}

/**
 * Four-step inline evaluation tracker with checkmark morph (~300ms per step).
 */
export function EvaluationStepTracker({ activeStep, className }: EvaluationStepTrackerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ol
      className={cn("space-y-3", className)}
      aria-label="Evaluation progress"
      aria-live="polite"
    >
      {EVALUATION_STEPS.map((label, index) => {
        const complete = index < activeStep;
        const current = index === activeStep;
        const pending = index > activeStep;

        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-radius-md border px-4 py-3 transition-colors duration-200",
              complete && "border-success/30 bg-success-bg",
              current && "border-arka-teal-300 bg-arka-teal-50",
              pending && "border-border-subtle bg-surface-sunken/50",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                complete && "border-success bg-success text-white",
                current && "border-arka-teal-500 bg-arka-teal-500 text-white",
                pending && "border-arka-slate-300 bg-surface text-arka-slate-400",
              )}
              aria-hidden
            >
              {complete ? (
                <motion.span
                  initial={prefersReducedMotion ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </motion.span>
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                complete && "text-success",
                current && "text-arka-teal-800",
                pending && "text-arka-slate-500",
              )}
            >
              {label}
              {current ? "…" : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
