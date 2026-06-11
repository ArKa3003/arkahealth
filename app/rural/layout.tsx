import type { Metadata } from "next";
import { RuralSidebar } from "@/components/demos/rural/shared/RuralSidebar";
import { RuralMobileNav } from "@/components/demos/rural/shared/RuralMobileNav";
import { PhaseComplianceBar } from "@/components/shared/PhaseComplianceBar";

export const metadata: Metadata = {
  title: "Rural Imaging Solutions",
  description:
    "ARKA Health rural imaging platform — resource-aware CDS, teleradiology orchestration, and hub-and-spoke network management for 60M+ rural Americans.",
  openGraph: {
    title: "ARKA Health | Rural Imaging Solutions",
    description:
      "Transforming medical imaging access for rural America with AI-powered clinical decision support.",
  },
};

export default function RuralLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-0 w-full flex-1 bg-arka-bg-light">
      <RuralSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <RuralMobileNav />
        <PhaseComplianceBar />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
