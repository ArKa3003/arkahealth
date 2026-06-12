import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CdsDemoClient } from "@/components/cds-platform/demo/CdsDemoClient";
import { DemoViewSwitcher } from "@/components/shared/demos/DemoViewSwitcher";
import { routes } from "@/lib/constants";

/**
 * CDS Hooks live shareholder demo page.
 */
export default function CdsHooksDemoPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-text-soft">
          <li>
            <Link
              href={routes.home}
              className="transition-colors hover:text-arka-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-arka-slate-400" aria-hidden />
            <Link
              href={`${routes.clinSuite}?view=embedded`}
              className="transition-colors hover:text-arka-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              ARKA-CLIN Suite
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-arka-slate-400" aria-hidden />
            <span className="font-semibold text-arka-teal-300">CDS Hooks Live Demo</span>
          </li>
        </ol>
      </nav>

      <DemoViewSwitcher current="embedded" tone="dark" />

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

      <div className="arka-card mx-auto mb-6 max-w-4xl rounded-xl border border-arka-cyan/30 px-4 py-3 text-center text-sm text-arka-slate-700 sm:text-base">
        Looking for the ARKA standalone web app view instead?{" "}
        <Link
          href={`${routes.clinSuite}?view=standalone`}
          className="font-medium text-arka-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          Open ARKA-CLIN Suite →
        </Link>
        {" · "}
        <Link
          href={`${routes.clinSuite}?view=discovery`}
          className="font-medium text-arka-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          CDS Hooks Discovery →
        </Link>
      </div>

      <CdsDemoClient />
    </div>
  );
}
