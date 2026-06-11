"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableScrollWrapperProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Wraps a table (or any wide content) for horizontal scrolling on mobile.
 * Shows a scroll hint when content overflows.
 */
export function TableScrollWrapper({
  children,
  className,
  "aria-label": ariaLabel,
}: TableScrollWrapperProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    };

    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [children]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="u-scroll-x-wrapper w-full rounded-radius-md border border-border-subtle bg-surface">
        <div
          ref={ref}
          className="u-scroll-x min-w-0 overflow-x-auto overflow-y-hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label={ariaLabel}
          tabIndex={canScrollRight ? 0 : undefined}
        >
          {children}
        </div>
      </div>
      {canScrollRight ? (
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 bottom-0 flex w-14 items-center justify-end md:hidden",
            "bg-gradient-to-l from-surface via-surface/80 to-transparent",
          )}
          aria-hidden
        >
          <span className="mr-1 flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-raised text-arka-teal-600 shadow-elevation-1">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      ) : null}
    </div>
  );
}
