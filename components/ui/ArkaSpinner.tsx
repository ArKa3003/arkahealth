"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ArkaSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Accessible label when spinner conveys progress; omit when decorative. */
  label?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
} as const;

/**
 * Branded ARKA loading spinner with subtle elevation ring.
 */
export function ArkaSpinner({ size = "md", className, label }: ArkaSpinnerProps) {
  const sizePx = sizeMap[size];
  const decorative = !label;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      role={decorative ? "presentation" : "status"}
      aria-hidden={decorative ? true : undefined}
      aria-label={label}
    >
      <span
        className="absolute inset-0 rounded-full bg-arka-teal-500/10 blur-sm motion-reduce:blur-none"
        aria-hidden
      />
      <Image
        src="/arka-spinner.svg"
        alt=""
        width={sizePx}
        height={sizePx}
        className="arka-spinner-img relative h-auto w-auto drop-shadow-sm"
        unoptimized
      />
    </span>
  );
}
