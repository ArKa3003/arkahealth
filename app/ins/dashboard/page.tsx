import type { Metadata } from "next";

import { InsDashboardPageClient } from "@/components/ins/dashboard/InsDashboardPageClient";

export const metadata: Metadata = {
  title: "Payer Dashboard | ARKA-INS",
  description:
    "Utilization management dashboard: auth volume, auto-approval rate, decision funnel, and recent AIIE-aligned dispositions.",
};

/**
 * Payer-grade utilization dashboard — metric grid, charts, and recent decisions drawer.
 */
export default function InsPayerDashboardPage() {
  return <InsDashboardPageClient />;
}
