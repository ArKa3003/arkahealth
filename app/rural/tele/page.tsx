import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";
import { RuralPhaseChrome } from "@/components/demos/rural/shared/RuralPhaseChrome";

const TeleDashboard = dynamic(
  () => import("@/components/demos/rural/tele/TeleDashboard").then((m) => m.TeleDashboard),
  { loading: () => <DemoLoadingSkeleton />, ssr: true },
);

export const metadata: Metadata = {
  title: "ARKA-TELE | Teleradiology Orchestration",
  description:
    "Intelligent teleradiology orchestration with AI triage, clinical context packaging, and multi-provider routing.",
};

export default function TelePage() {
  return (
    <RuralPhaseChrome areaId="tele">
      <TeleDashboard />
    </RuralPhaseChrome>
  );
}
