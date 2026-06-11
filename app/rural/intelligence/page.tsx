import type { Metadata } from "next";
import { RuralIntelligenceDashboard } from "@/components/demos/rural/intelligence/RuralIntelligenceDashboard";
import { RuralPhaseChrome } from "@/components/demos/rural/shared/RuralPhaseChrome";

export const metadata: Metadata = {
  title: "Rural Intelligence | ARKA-RURAL",
  description:
    "Imaging desert mapping, outcome correlation, predictive facility risk, and research-ready exports.",
};

export default function RuralIntelligencePage() {
  return (
    <RuralPhaseChrome areaId="intelligence">
      <RuralIntelligenceDashboard />
    </RuralPhaseChrome>
  );
}
