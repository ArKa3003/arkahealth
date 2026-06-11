import type { Metadata } from "next";
import { RuralPhaseChrome } from "@/components/demos/rural/shared/RuralPhaseChrome";
import { RuralTrainingClient } from "./RuralTrainingClient";

export const metadata: Metadata = {
  title: "Rural Training | ARKA-ED",
  description:
    "Rural-specific case library with CME tracking for resource-constrained imaging decision-making.",
};

export default function RuralTrainingPage() {
  return (
    <RuralPhaseChrome areaId="training">
      <RuralTrainingClient />
    </RuralPhaseChrome>
  );
}
