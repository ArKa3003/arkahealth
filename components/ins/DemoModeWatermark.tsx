"use client";

import { isDemoModeClient } from "@/lib/demo/demo-mode";

/**
 * Subtle fixed label when `NEXT_PUBLIC_DEMO_MODE=true` (pair with server `DEMO_MODE`).
 */
export function DemoModeWatermark() {
  if (!isDemoModeClient()) {
    return null;
  }
  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-[100] rounded border border-amber-400/70 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-950 shadow-sm backdrop-blur-sm"
      aria-hidden
    >
      Demo
    </div>
  );
}
