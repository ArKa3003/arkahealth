import dynamic from "next/dynamic";
import { Suspense } from "react";

import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";

const ValidationDashboard = dynamic(
  () => import("@/components/cds-platform/validation/ValidationDashboard"),
  { loading: () => <DemoLoadingSkeleton />, ssr: true },
);

/**
 * Retrospective validation dashboard for CDS platform shareholder / compliance review.
 */
export default function ValidationPage() {
  return (
    <Suspense fallback={<DemoLoadingSkeleton />}>
      <ValidationDashboard />
    </Suspense>
  );
}
