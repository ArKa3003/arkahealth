import Link from "next/link";

import { CdsDemoClient } from "@/components/cds-platform/demo/CdsDemoClient";
import { DemoViewSwitcher } from "@/components/shared/demos/DemoViewSwitcher";
import { routes } from "@/lib/constants";

/**
 * CDS Hooks live shareholder demo page.
 */
export default function CdsHooksDemoPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <DemoViewSwitcher current="embedded" />

      <header className="mx-auto mb-8 max-w-4xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          CDS Hooks Live Demo — ARKA Inside an EHR (Epic / Cerner Simulation)
        </h1>
        <p className="mt-4 text-base leading-relaxed text-arka-text-soft">
          This is the same ARKA engine you saw in ARKA-CLIN, but rendered the way a clinician would actually see it:
          as a sidebar card inside their EHR while they draft an imaging order. The left panel is a mock Epic chart
          (EpicSim™). The right sidebar is ARKA&apos;s CDS Hooks card. The JSON panel below shows the live FHIR /
          CDS Hooks v1.0 traffic between the EHR and ARKA&apos;s service endpoint, demonstrating real interoperability
          under the HL7 CDS Hooks standard. Every recommendation card is anchored in a published guideline.
          Patient-specific ML refinement (XGBoost + SHAP) is shown as a transparent ancillary layer. Designed to meet
          the four criteria for Non-Device CDS under FD&amp;C Act §520(o)(1)(E).
        </p>
      </header>

      <div className="arka-card mx-auto mb-6 max-w-4xl rounded-xl border border-arka-cyan/30 px-4 py-3 text-center text-sm text-arka-text-soft sm:text-base">
        Looking for the ARKA standalone web app view instead?{" "}
        <Link href={routes.clin} className="font-medium text-arka-cyan hover:underline">
          Open ARKA-CLIN →
        </Link>
      </div>

      <CdsDemoClient />
    </div>
  );
}
