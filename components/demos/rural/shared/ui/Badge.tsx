"use client";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "muted" | "demo";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-arka-teal/15 text-arka-teal-700",
        variant === "success" && "bg-success-bg text-success",
        variant === "warning" && "bg-warning-bg text-warning",
        variant === "danger" && "bg-danger-bg text-danger",
        variant === "muted" && "bg-arka-slate-100 text-arka-slate-600",
        variant === "demo" &&
          "bg-arka-slate-100 font-mono text-[10px] uppercase tracking-wide text-arka-slate-600",
        className,
      )}
    >
      {children}
    </span>
  );
}
