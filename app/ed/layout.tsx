import type { Metadata } from "next";

import { PhaseComplianceBar } from "@/components/shared/PhaseComplianceBar";

export const metadata: Metadata = {
  title: "ARKA-ED | Emergency Imaging Triage",
  description:
    "Emergency department imaging cockpit. Instant AIIE scoring, red-flag callouts, and disposition guidance for incoming cases.",
  openGraph: {
    title: "ARKA-ED | ARKA Health",
    description:
      "ED imaging triage with instant AIIE appropriateness scoring and STAT pathway detection.",
  },
};

export default function EdLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PhaseComplianceBar />
      {children}
    </>
  );
}
