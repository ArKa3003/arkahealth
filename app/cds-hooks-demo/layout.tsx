import type { Metadata } from "next";

import Link from "next/link";

import { PhaseComplianceBar } from "@/components/shared/PhaseComplianceBar";
import { routes } from "@/lib/constants";

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
    <div className="flex min-h-full flex-1 flex-col bg-arka-navy">
      <PhaseComplianceBar />
      {children}
      <footer className="border-t border-arka-deep px-4 py-4 text-center text-sm text-arka-text-soft">
        <Link
          href={routes.cdsHooksDemoValidation}
          className="text-arka-teal-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          Validation dashboard
        </Link>
        {" · "}
        <Link
          href={`${routes.clinSuite}?view=discovery`}
          className="text-arka-teal-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          CDS Hooks Discovery
        </Link>
      </footer>
    </div>
  );
}
