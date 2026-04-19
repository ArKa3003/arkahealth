import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";

const TeleDashboard = dynamic(
  () => import("@/components/demos/rural/tele/TeleDashboard").then((m) => m.TeleDashboard),
  { loading: () => <DemoLoadingSkeleton /> }
);

export const metadata: Metadata = {
  title: "ARKA-TELE | Teleradiology Orchestration",
  description:
    "Intelligent teleradiology orchestration with AI triage, clinical context packaging, and multi-provider routing.",
};

export default function TelePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <TeleDashboard />
    </div>
  );
}
