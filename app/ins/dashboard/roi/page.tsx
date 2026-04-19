import type { Metadata } from "next";

import { RoiDashboardClient } from "@/components/ins/roi/RoiDashboardClient";

export const metadata: Metadata = {
  title: "ROI / Validation | ARKA-INS",
  description:
    "Payer and health-system ROI metrics: PA automation, administrative burden reduction, OOP transparency, and CMS-0057-F compliance.",
};

/**
 * Executive-facing validation dashboard (Bloomberg-style density) backed by `GET /api/ins/validation/metrics`.
 */
export default function InsRoiDashboardPage() {
  return <RoiDashboardClient />;
}
