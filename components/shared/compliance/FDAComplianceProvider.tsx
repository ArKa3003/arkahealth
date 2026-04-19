"use client";

import * as React from "react";

import { AIIEEvidenceModal } from "./AIIEEvidenceModal";
import { EvidenceModalProvider, useEvidenceModal } from "./evidence-modal-context";
import { FDANonDeviceBanner } from "./FDANonDeviceBanner";

function GlobalEvidenceModal() {
  const { open, setOpen } = useEvidenceModal();
  return <AIIEEvidenceModal open={open} onOpenChange={setOpen} />;
}

/**
 * Root wrapper: shared FDA strip, evidence modal state, and mounted modal for ARKA-CLIN / ARKA-INS / ARKA-ED.
 */
export function FDAComplianceProvider({ children }: { children: React.ReactNode }) {
  return (
    <EvidenceModalProvider>
      <FDANonDeviceBanner />
      {children}
      <GlobalEvidenceModal />
    </EvidenceModalProvider>
  );
}
