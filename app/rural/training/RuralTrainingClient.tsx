"use client";

import dynamic from "next/dynamic";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";

const RuralTrainingHub = dynamic(
  () =>
    import("@/components/demos/rural/training/RuralTrainingHub").then((m) => m.RuralTrainingHub),
  { loading: () => <DemoLoadingSkeleton />, ssr: true }
);

export function RuralTrainingClient() {
  return (
    <div className="py-2 sm:py-4">
      <RuralTrainingHub />
    </div>
  );
}
