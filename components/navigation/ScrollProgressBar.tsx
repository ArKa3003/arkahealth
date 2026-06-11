"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { showsScrollProgress } from "@/lib/navigation/routes";

/**
 * Thin teal viewport scroll progress indicator for docs and long-form pages.
 */
export function ScrollProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const enabled = showsScrollProgress(pathname);

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-0.5 safe-area-left safe-area-right"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label="Page scroll progress"
    >
      <div
        className="h-full bg-arka-teal-500 motion-reduce:transition-none transition-[width] duration-100"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
