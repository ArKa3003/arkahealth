import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { EdPageClient } from "@/components/demos/ed/EdPageClient";
import { getEdCockpitCases } from "@/components/demos/ed/ed-cockpit-cases";
import { precomputeEdEvaluations } from "@/components/demos/ed/ed-scoring";
import { routes } from "@/lib/constants";

/**
 * ARKA-ED emergency department imaging cockpit.
 * Scores are precomputed server-side for instant client render.
 */
export default async function EdPage() {
  const cases = getEdCockpitCases();
  const evaluations = await precomputeEdEvaluations(cases);

  return (
    <div className="min-h-screen bg-arka-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-slate-500">
            <li>
              <Link href={routes.home} className="hover:text-arka-teal-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-arka-slate-400" aria-hidden />
              <span className="font-semibold text-arka-teal-700">ARKA-ED</span>
            </li>
          </ol>
        </nav>

        <p className="mb-4 max-w-3xl text-base font-medium text-arka-slate-600 sm:text-lg">
          Emergency imaging triage — select an incoming case for instant AIIE scoring and
          disposition guidance.
        </p>
      </div>

      <EdPageClient cases={cases} evaluations={evaluations} />
    </div>
  );
}
