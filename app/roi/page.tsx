import type { Metadata } from "next";
import { RoiPageClient } from "@/components/roi/RoiPageClient";

const ROI_DESCRIPTION =
  "ARKA ROI model — the conservative case for a regional hospital group running ~120,000 advanced imaging studies a year. Modeled denial recovery, rework labor avoided, and throughput defense, built on published CAQH, KFF, MGMA, AMA, ACR, Change Healthcare, and Johns Hopkins figures.";

export const metadata: Metadata = {
  title: "ROI Breakdown",
  description: ROI_DESCRIPTION,
  openGraph: {
    title: "ARKA — The math a CFO can sign",
    description: ROI_DESCRIPTION,
  },
};

export default function RoiPage() {
  return <RoiPageClient />;
}
