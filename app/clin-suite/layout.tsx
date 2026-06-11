import type { Metadata } from "next";

import { PhaseComplianceBar } from "@/components/shared/PhaseComplianceBar";

export const metadata: Metadata = {
  title: "ARKA-CLIN Suite | Standalone + EHR-Embedded",
  description:
    "Two views, one engine. ARKA-CLIN as a standalone web app and ARKA-CLIN embedded inside an EHR via HL7 CDS Hooks — on a single page.",
  openGraph: {
    title: "ARKA-CLIN Suite | ARKA Health",
    description:
      "Standalone web app and CDS Hooks EHR-embedded demo side-by-side, plus CDS Hooks discovery and validation.",
  },
};

export default function ClinSuiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PhaseComplianceBar />
      {children}
    </>
  );
}
