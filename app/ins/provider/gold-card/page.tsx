import type { Metadata } from "next";
import { Suspense } from "react";

import { GoldCardDashboardClient } from "@/components/ins/provider/GoldCardDashboardClient";

export const metadata: Metadata = {
  title: "Gold Card Portfolio | ARKA-INS",
  description:
    "Provider gold card portfolio: CPT × payer eligibility, Wilson scores, PA avoidance, and administrative time saved.",
};

/**
 * Provider-facing gold card dashboard — SMART-launched in production; demo via `?providerId=` query.
 */
export default function InsProviderGoldCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-slate-100 text-sm text-slate-600">
          Loading gold card portfolio…
        </div>
      }
    >
      <GoldCardDashboardClient />
    </Suspense>
  );
}
