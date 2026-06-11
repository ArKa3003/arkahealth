"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "rounded-radius-md transition-[box-shadow,transform,background-color,border-color,color] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-arka-teal-600 text-white shadow-elevation-1",
          "hover:bg-arka-teal-500 hover:shadow-elevation-2",
          "active:scale-[0.98] motion-reduce:active:scale-100",
        ].join(" "),
        secondary: [
          "border border-border-strong bg-surface text-arka-slate-700 shadow-elevation-1",
          "hover:bg-surface-raised hover:shadow-elevation-2",
          "active:scale-[0.98] motion-reduce:active:scale-100",
        ].join(" "),
        ghost: [
          "text-arka-slate-700",
          "hover:bg-arka-slate-100 hover:text-arka-slate-900",
          "active:bg-arka-slate-200 motion-reduce:active:scale-100",
        ].join(" "),
        destructive: [
          "bg-danger text-white shadow-elevation-1",
          "hover:bg-danger/90 hover:shadow-elevation-2",
          "active:scale-[0.98] motion-reduce:active:scale-100",
        ].join(" "),
        premium: [
          "bg-arka-slate-900 text-white shadow-elevation-1",
          "hover:shadow-elevation-2 hover:shadow-glow-sm",
          "active:scale-[0.98] motion-reduce:active:scale-100",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows inline spinner; label stays in DOM (invisible) to prevent layout shift. */
  loading?: boolean;
  /** @deprecated Use `loading` — kept for compatibility. */
  isLoading?: boolean;
}

/**
 * Primary action control with premium variants, loading state, and keyboard focus rings.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      isLoading,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isBusy = loading ?? isLoading ?? false;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isBusy}
        aria-busy={isBusy || undefined}
        {...props}
      >
        <span
          className={cn(
            "inline-grid items-center justify-center [grid-template-columns:1fr] [grid-template-rows:1fr]",
            size === "icon" ? "h-full w-full" : "min-w-[1ch]",
          )}
        >
          <span
            className={cn(
              "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 tabular-nums",
              isBusy && "invisible",
            )}
          >
            {children}
          </span>
          {isBusy ? (
            <Loader2
              className="col-start-1 row-start-1 h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ) : null}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
