"use client";

import { cn } from "@/lib/utils";

export function Select({
  className,
  id,
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-arka-text-dark-muted">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={cn(
          "w-full min-h-[44px] rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-sm text-arka-text-dark shadow-sm focus:border-arka-teal focus:outline-none focus:ring-2 focus:ring-arka-teal/30 dark:bg-arka-bg-medium/80",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
