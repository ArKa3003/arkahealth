"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps a table (or any wide content) for horizontal scrolling on mobile.
 * Shows a scroll hint when content overflows.
 */
export function TableScrollWrapper({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    };
    check();
    el.addEventListener("scroll", check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [children]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="u-scroll-x-wrapper w-full">
        <div
          ref={ref}
          className="u-scroll-x min-w-0 overflow-x-auto overflow-y-hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label={ariaLabel}
        >
          {children}
        </div>
      </div>
      {canScrollRight && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 flex w-12 items-center justify-end bg-gradient-to-l from-arka-bg-medium to-transparent md:hidden"
          aria-hidden
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-arka-cyan/20 text-arka-cyan">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      )}
    </div>
  );
}
