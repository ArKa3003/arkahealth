import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        success: "border-transparent bg-success-bg text-success",
        warning: "border-transparent bg-warning-bg text-warning",
        danger: "border-transparent bg-danger-bg text-danger",
        info: "border-transparent bg-info-bg text-info",
        neutral: "border-transparent bg-arka-slate-100 text-arka-slate-700",
        /* Legacy aliases */
        default: "border-transparent bg-arka-slate-100 text-arka-slate-800",
        secondary: "border-transparent bg-arka-slate-200/80 text-arka-slate-700",
        outline: "border-border-strong bg-transparent text-arka-slate-700",
      },
      dot: {
        true: "pl-2",
        false: "",
      },
    },
    defaultVariants: {
      variant: "neutral",
      dot: false,
    },
  },
);

const dotColorMap = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-arka-slate-500",
  default: "bg-arka-slate-500",
  secondary: "bg-arka-slate-500",
  outline: "bg-arka-slate-500",
} as const;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Pill status chip with semantic color variants and optional 6px status dot.
 */
function Badge({ className, variant = "neutral", dot, children, ...props }: BadgeProps) {
  const resolvedVariant = variant ?? "neutral";
  const dotClass = dotColorMap[resolvedVariant];

  return (
    <div className={cn(badgeVariants({ variant: resolvedVariant, dot }), className)} {...props}>
      {dot ? (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
          aria-hidden
        />
      ) : null}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
