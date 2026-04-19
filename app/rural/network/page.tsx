import type { Metadata } from "next";
import { NetworkManagerDashboardLoader } from "@/components/demos/rural/network/NetworkManagerDashboardLoader";

export const metadata: Metadata = {
  title: "Network Manager | Hub-and-Spoke",
  description:
    "Configure and manage hub-and-spoke imaging networks with shared equipment, protocols, and quality standards.",
};

export default function NetworkPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <NetworkManagerDashboardLoader />
    </div>
  );
}
