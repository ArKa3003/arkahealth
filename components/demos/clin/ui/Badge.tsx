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
        variant === "default" && "bg-arka-bg-alt text-arka-text-dark-muted border border-arka-light",
        variant === "success" &&
          "bg-arka-teal-100 text-arka-teal-800 border border-arka-teal-300",
        variant === "warning" &&
          "bg-amber-500/20 text-amber-800 border border-amber-500/40",
        variant === "error" &&
          "bg-red-500/20 text-red-900 border border-red-500/40",
        variant === "info" &&
          "bg-arka-teal-50 text-arka-teal-800 border border-arka-teal-200",
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
