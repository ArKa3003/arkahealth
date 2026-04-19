"use client";

import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-light disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-arka-teal text-white hover:bg-arka-teal/90",
        variant === "secondary" &&
          "border border-arka-primary/25 bg-white text-arka-text-dark hover:border-arka-teal/40",
        variant === "ghost" && "text-arka-teal hover:bg-arka-teal/10",
        className
      )}
      {...props}
    />
  );
}
