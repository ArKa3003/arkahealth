"use client";

import * as React from "react";

export type EvidenceModalContextValue = {
  /** Whether the AIIE evidence / compliance modal is open. */
  open: boolean;
  /** Sets modal open state. */
  setOpen: (open: boolean) => void;
};

const EvidenceModalContext = React.createContext<EvidenceModalContextValue | null>(null);

/**
 * Provides shared state for opening the global AIIE evidence modal from the FDA banner, footer, and dashboards.
 */
export function EvidenceModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo(() => ({ open, setOpen }), [open]);
  return <EvidenceModalContext.Provider value={value}>{children}</EvidenceModalContext.Provider>;
}

/**
 * Returns evidence modal open state. Must be used within {@link EvidenceModalProvider}.
 */
export function useEvidenceModalOptional(): EvidenceModalContextValue | null {
  return React.useContext(EvidenceModalContext);
}

export function useEvidenceModal(): EvidenceModalContextValue {
  const ctx = useEvidenceModalOptional();
  if (!ctx) {
    throw new Error("useEvidenceModal must be used within EvidenceModalProvider");
  }
  return ctx;
}
