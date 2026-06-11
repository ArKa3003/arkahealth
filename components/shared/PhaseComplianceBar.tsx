"use client";

import { ComplianceBar } from "@/components/shared/ComplianceBar";

/**
 * Page-level compliance band inserted at the top of ARKA phase route layouts.
 */
export function PhaseComplianceBar() {
  return <ComplianceBar mode="page" />;
}
