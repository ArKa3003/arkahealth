import type { Metadata } from "next";
import { Suspense } from "react";

import { PatientExplainerClient } from "@/components/ins/patient/PatientExplainerClient";

export const metadata: Metadata = {
  title: "Your imaging costs | ARKA-INS",
  description:
    "Plain-language cost transparency: what your imaging test is, what you may pay, deductible progress, and nearby options.",
};

/**
 * Patient-facing explainer for an imaging order — link with query params for CPT, ZIP, and payer in demos.
 */
export default function InsPatientExplainerOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-slate-50 px-4 text-sm text-slate-600">
          Loading cost information…
        </div>
      }
    >
      <PatientExplainerClient />
    </Suspense>
  );
}
