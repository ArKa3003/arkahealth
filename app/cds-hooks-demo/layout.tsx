import type { Metadata } from "next";

import { PhaseComplianceBar } from "@/components/shared/PhaseComplianceBar";

/**
 * CDS Hooks live demo route metadata. The visible wrapper is a <div>, not
 * a <main>, because the root layout already provides a top-level <main>
 * via MainWithDemoNav. Nested <main> caused blank-on-first-nav hydration bug.
 */
export const metadata: Metadata = {
  title: "ARKA CDS Hooks · Live Demo",
  description:
    "Live CDS Hooks 2.0 integration demo: guideline-anchored imaging appropriateness with transparent ML refinement, designed for FDA Non-Device CDS under the 21st Century Cures Act.",
  openGraph: {
    title: "ARKA CDS Hooks · Live Demo",
    description:
      "Shareholder demo of citation-first CDS Hooks cards at the point of imaging order entry.",
  },
};

export default function CdsHooksDemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-arka-navy">
      <PhaseComplianceBar />
      {children}
    </div>
  );
}
