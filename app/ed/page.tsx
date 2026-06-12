import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { EdPageClient } from "@/components/demos/ed/EdPageClient";
import {
  getEdCockpitCases,
  getEdPracticeCases,
} from "@/components/demos/ed/ed-cockpit-cases";
import { precomputeEdEvaluations } from "@/components/demos/ed/ed-scoring";
import { routes } from "@/lib/constants";

/**
 * ARKA-ED — guided practice scenarios (default) and simulated live queue cockpit.
 */
export default async function EdPage() {
  const cockpitCases = getEdCockpitCases();
  const practiceCases = getEdPracticeCases();
  const evaluations = await precomputeEdEvaluations(practiceCases);

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-1">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-slate-600">
            <li>
              <Link
                href={routes.home}
                className="transition-colors hover:text-arka-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-arka-slate-400" aria-hidden />
              <span className="font-semibold text-arka-teal-700">ARKA-ED</span>
            </li>
          </ol>
        </nav>
      </div>

      <EdPageClient
        cockpitCases={cockpitCases}
        practiceCases={practiceCases}
        evaluations={evaluations}
      />
    </>
  );
}
