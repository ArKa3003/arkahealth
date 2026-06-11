import type { Metadata } from "next";
import { NetworkManagerDashboardLoader } from "@/components/demos/rural/network/NetworkManagerDashboardLoader";
import { RuralPhaseChrome } from "@/components/demos/rural/shared/RuralPhaseChrome";

export const metadata: Metadata = {
  title: "Network Manager | Hub-and-Spoke",
  description:
    "Configure and manage hub-and-spoke imaging networks with shared equipment, protocols, and quality standards.",
};

export default function NetworkPage() {
  return (
    <RuralPhaseChrome areaId="network">
      <NetworkManagerDashboardLoader />
    </RuralPhaseChrome>
  );
}
