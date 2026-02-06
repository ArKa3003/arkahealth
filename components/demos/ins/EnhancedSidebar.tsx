"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/demos/ins/ui/Button";
import { Progress } from "@/components/demos/ins/ui/Progress";
import { DEMO_STEPS_10 } from "@/lib/demos/ins/constants";
import { routes } from "@/lib/constants";

export interface EnhancedSidebarProps {
  currentStep: number;
  completedSteps: number[];
  onStepSelect: (step: number) => void;
  onReset: () => void;
  totalSteps?: number;
  className?: string;
}

export function EnhancedSidebar({
  currentStep,
  completedSteps,
  onStepSelect,
  onReset,
  totalSteps = 10,
  className,
}: EnhancedSidebarProps) {
  const progress = (currentStep / totalSteps) * 100;
  const steps = DEMO_STEPS_10;
  const minutesRemaining = Math.max(1, Math.ceil((totalSteps - currentStep) * 0.8));

  return (
    <aside
      className={cn(
        "flex flex-col w-full lg:w-72 lg:min-w-[288px]",
        "bg-arka-bg-medium/80 border-r border-white/10 rounded-r-xl",
        "lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)]",
        className
      )}
    >
      <div className="p-4 border-b border-white/10">
        <Link href={routes.home} className="flex items-center gap-2 font-heading text-lg font-semibold text-white no-underline">
          <span className="text-teal-300">ARKA</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold text-arka-bg-dark bg-arka-teal rounded text-white">INS</span>
        </Link>
        <p className="text-xs text-slate-300 mt-1">Utilization Management</p>
      </div>

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-200">Step {currentStep} of {totalSteps}</span>
          <span className="text-slate-400">~{minutesRemaining} min left</span>
        </div>
        <Progress value={progress} max={100} size="sm" className="[&>div]:bg-arka-bg-dark" />
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Demo steps">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepSelect(step.id)}
              className={cn(
                "w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-deep focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark",
                isCurrent && "bg-arka-deep/20 ring-1 ring-arka-deep/40",
                !isCurrent && "hover:bg-white/5",
                isCompleted && !isCurrent && "text-slate-400"
              )}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Step ${step.id}: ${step.name}${isCompleted ? ", completed" : isCurrent ? ", current step" : ""}`}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCompleted && !isCurrent && "bg-emerald-600 text-white",
                  isCurrent && "bg-arka-deep text-white",
                  !isCompleted && !isCurrent && "bg-arka-bg-dark text-slate-400"
                )}
              >
                {isCompleted && !isCurrent ? <Check className="h-3.5 w-3.5" /> : step.id}
              </span>
              <span className={cn("flex-1 min-w-0 text-sm font-medium truncate", isCurrent ? "text-slate-100" : "text-slate-300")}>
                {step.name}
              </span>
              {step.isNew && (
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800">
                  <Sparkles className="h-2.5 w-2.5" /> NEW
                </span>
              )}
              {isCurrent && (
                <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
                  <ChevronRight className="h-4 w-4 text-arka-deep shrink-0" />
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Button variant="ghost" size="sm" fullWidth onClick={onReset} className="text-slate-400" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} aria-label="Reset demo">
          Reset Demo
        </Button>
      </div>
    </aside>
  );
}
