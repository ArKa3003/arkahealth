"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InsButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: [
    "bg-arka-deep text-white",
    "hover:bg-arka-deep/90 hover:shadow-lg hover:shadow-arka-deep/25",
    "active:bg-arka-deep/95",
    "focus-visible:ring-arka-deep",
  ].join(" "),
  secondary: [
    "bg-transparent text-slate-700 border-2 border-arka-deep/50",
    "hover:border-arka-deep hover:text-arka-cyan hover:bg-arka-deep/10",
    "active:bg-arka-deep/20",
    "focus-visible:ring-arka-deep",
  ].join(" "),
  success: [
    "bg-emerald-600 text-white",
    "hover:bg-emerald-500 focus-visible:ring-emerald-500",
  ].join(" "),
  warning: [
    "bg-amber-500 text-arka-bg-dark",
    "hover:bg-amber-400 focus-visible:ring-amber-500",
  ].join(" "),
  danger: [
    "bg-red-600 text-white",
    "hover:bg-red-500 focus-visible:ring-red-500",
  ].join(" "),
  ghost: [
    "bg-transparent text-slate-600",
    "hover:bg-arka-pale hover:text-arka-cyan",
    "focus-visible:ring-arka-deep",
  ].join(" "),
};

const sizeStyles = {
  sm: "min-h-[44px] h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "min-h-[44px] h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "min-h-[44px] h-12 px-6 text-base gap-2.5 rounded-lg",
};

const iconSizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

const Button = React.forwardRef<HTMLButtonElement, InsButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15, ease: "easeOut" }}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={cn("animate-spin", iconSizes[size])} />
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className={cn("flex-shrink-0", iconSizes[size])}>{leftIcon}</span>}
            {children}
            {rightIcon && <span className={cn("flex-shrink-0", iconSizes[size])}>{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);
Button.displayName = "InsButton";

export { Button };
