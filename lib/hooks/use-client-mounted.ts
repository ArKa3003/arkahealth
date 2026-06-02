"use client";

import { useEffect, useState } from "react";

/**
 * Returns true after the component has mounted in the browser.
 * Use to defer client-only UI (e.g. Framer Motion / Radix IDs) and avoid hydration mismatches.
 */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
