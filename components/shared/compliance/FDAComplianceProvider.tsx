"use client";

import * as React from "react";

import { AIIEEvidenceModal } from "./AIIEEvidenceModal";
import { FDAAcknowledgmentModal } from "./FDAAcknowledgmentModal";
import { EvidenceModalProvider, useEvidenceModal } from "./evidence-modal-context";

function GlobalEvidenceModal() {
  const { open, setOpen } = useEvidenceModal();
  return <AIIEEvidenceModal open={open} onOpenChange={setOpen} />;
}

/**
 * Root wrapper: one-time FDA acknowledgment modal, evidence modal state, and mounted modal for ARKA-CLIN / ARKA-INS / ARKA-ED.
 */
export function FDAComplianceProvider({ children }: { children: React.ReactNode }) {
  return (
    <EvidenceModalProvider>
      {children}
      <GlobalEvidenceModal />
      <FDAAcknowledgmentModal />
    </EvidenceModalProvider>
  );
}
