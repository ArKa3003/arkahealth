import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";

const RuralCDSDemo = dynamic(
  () => import("@/components/demos/rural/cds/RuralCDSDemo").then((m) => m.RuralCDSDemo),
  { loading: () => <DemoLoadingSkeleton />, ssr: true }
);

export const metadata: Metadata = {
  title: "ARKA-RURAL CDS | Resource-Aware Clinical Decision Support",
  description:
    "Dual-score appropriateness engine with CAS + RAAS for resource-constrained rural imaging settings.",
};

export default function RuralCDSPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <RuralCDSDemo />
    </div>
  );
}
