import type { Metadata } from "next";
import { Suspense } from "react";

import { ProviderDashboardClient } from "@/components/ins/provider/ProviderDashboardClient";

export const metadata: Metadata = {
  title: "Provider Dashboard | ARKA-INS",
  description:
    "Provider and scheduler hub: gold card portfolio and unified order lifecycle for in-flight imaging orders.",
};

/**
 * Provider / scheduler dashboard — gold card portfolio and order lifecycle tabs.
 */
export default function InsProviderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-slate-100 text-sm text-slate-600">
          Loading provider dashboard…
        </div>
      }
    >
      <ProviderDashboardClient />
    </Suspense>
  );
}
