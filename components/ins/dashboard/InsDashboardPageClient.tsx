"use client";

import dynamic from "next/dynamic";

const PayerDashboardClient = dynamic(
  () =>
    import("@/components/ins/dashboard/PayerDashboardClient").then((m) => ({
      default: m.PayerDashboardClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[480px] animate-pulse bg-surface-sunken"
        aria-busy="true"
        aria-label="Loading dashboard"
      />
    ),
  },
);

/** Client boundary for /ins/dashboard — defers Recharts and metrics store. */
export function InsDashboardPageClient() {
  return <PayerDashboardClient />;
}
