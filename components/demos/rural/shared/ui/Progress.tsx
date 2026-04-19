"use client";

import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  max = 100,
  className,
}: {
  value?: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-arka-bg-medium", className)}>
      <div
        className="h-full rounded-full bg-arka-teal transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
