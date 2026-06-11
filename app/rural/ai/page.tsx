import type { Metadata } from "next";
import { AIDiagnosticsDashboard } from "@/components/demos/rural/ai/AIDiagnosticsDashboard";
import { RuralPhaseChrome } from "@/components/demos/rural/shared/RuralPhaseChrome";

export const metadata: Metadata = {
  title: "AI Diagnostics | ARKA-RURAL",
  description:
    "Curated AI marketplace, POCUS protocol library, and AI-assisted preliminary reads for rural workflows.",
};

export default function RuralAiPage() {
  return (
    <RuralPhaseChrome areaId="ai">
      <AIDiagnosticsDashboard />
    </RuralPhaseChrome>
  );
}
