import type { Metadata } from "next";
import { RuralPhaseChrome } from "@/components/demos/rural/shared/RuralPhaseChrome";
import { RuralReimbursementDashboard } from "@/components/demos/rural/reimbursement/RuralReimbursementDashboard";

export const metadata: Metadata = {
  title: "Reimbursement Optimizer | ARKA-RURAL",
  description:
    "Rural exemption detection, batch authorization, REH payment optimization, and revenue intelligence.",
};

export default function RuralReimbursementPage() {
  return (
    <RuralPhaseChrome areaId="reimbursement">
      <RuralReimbursementDashboard />
    </RuralPhaseChrome>
  );
}
