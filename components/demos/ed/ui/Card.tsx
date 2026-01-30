"use client";

import { type ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "bordered" | "elevated";
}

export function Card({
  children,
  className,
  variant = "default",
}: CardProps) {
  return (
    <div
      className={clsx(
        "arka-card rounded-xl p-4 sm:p-6 transition-all duration-200",
        "bg-arka-bg-medium/50 border border-arka-primary/20",
        variant === "bordered" && "border-arka-cyan/30",
        variant === "elevated" && "shadow-glow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mb-4 sm:mb-6 border-b border-arka-primary/20 pb-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={clsx(
        "text-lg sm:text-xl font-heading font-semibold text-arka-text",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("text-arka-text-muted text-sm sm:text-base", className)}>{children}</div>;
}
