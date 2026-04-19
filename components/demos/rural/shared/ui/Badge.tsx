"use client";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "success" | "warning" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-arka-teal/15 text-arka-teal",
        variant === "success" && "bg-emerald-500/15 text-emerald-300",
        variant === "warning" && "bg-amber-500/15 text-amber-200",
        variant === "muted" && "bg-white/5 text-arka-text-dark-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
