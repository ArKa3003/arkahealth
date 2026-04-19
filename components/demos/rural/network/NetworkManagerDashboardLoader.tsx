"use client";

import dynamic from "next/dynamic";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";

const NetworkManagerDashboard = dynamic(
  () => import("@/components/demos/rural/network/NetworkManagerDashboard").then((m) => m.NetworkManagerDashboard),
  { loading: () => <DemoLoadingSkeleton />, ssr: false }
);

export function NetworkManagerDashboardLoader() {
  return <NetworkManagerDashboard />;
}
