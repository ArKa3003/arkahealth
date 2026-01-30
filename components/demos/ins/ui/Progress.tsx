"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ProgressSize = "sm" | "md" | "lg";

export interface InsProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  max?: number;
  size?: ProgressSize;
  showLabel?: boolean;
  labelPosition?: "top" | "right";
  label?: string;
  indicatorClassName?: string;
  animated?: boolean;
}

const sizeStyles: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  InsProgressProps
>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = "md",
      showLabel = false,
      labelPosition = "right",
      label,
      indicatorClassName,
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const trackHeight = sizeStyles[size];
    return (
      <div
        className={cn(
          "flex items-center gap-3",
          labelPosition === "top" && "flex-col items-start gap-1.5",
          className
        )}
      >
        {showLabel && labelPosition === "top" && (
          <div className="flex justify-between w-full">
            {label && <span className="text-sm text-arka-text-soft">{label}</span>}
            <span className="text-sm font-medium text-arka-text-muted">{Math.round(percentage)}%</span>
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          value={value}
          max={max}
          className={cn("relative overflow-hidden rounded-full bg-arka-bg-medium flex-1 w-full", trackHeight)}
          {...props}
        >
          <ProgressPrimitive.Indicator asChild>
            <motion.div
              className={cn("h-full rounded-full bg-arka-deep", indicatorClassName)}
              initial={animated ? { width: 0 } : { width: `${percentage}%` }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: animated ? 0.6 : 0, ease: "easeOut" }}
            />
          </ProgressPrimitive.Indicator>
        </ProgressPrimitive.Root>
        {showLabel && labelPosition === "right" && (
          <span className="text-sm font-medium text-arka-text-muted">{label ?? `${Math.round(percentage)}%`}</span>
        )}
      </div>
    );
  }
);
Progress.displayName = "InsProgress";

export { Progress };
