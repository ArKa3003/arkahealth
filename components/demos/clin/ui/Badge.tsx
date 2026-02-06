"use client";

import { type ReactNode } from "react";
import { clsx } from "clsx";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "infoOnLight";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        variant === "default" && "bg-arka-bg-medium text-arka-text-soft",
        variant === "success" &&
          "bg-arka-cyan/20 text-arka-cyan border border-arka-cyan/40",
        variant === "warning" &&
          "bg-amber-500/20 text-amber-800 border border-amber-500/40",
        variant === "error" &&
          "bg-red-500/20 text-red-900 border border-red-500/40",
        variant === "info" &&
          "bg-arka-primary/20 text-arka-light border border-arka-primary/40",
        variant === "infoOnLight" &&
          "bg-slate-200/90 text-slate-800 border border-slate-300",
        size === "sm" && "px-2 py-0.5 text-sm",
        size === "md" && "px-3 py-1 text-base",
        className
      )}
      role="status"
    >
      {children}
    </span>
  );
}
