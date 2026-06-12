import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { routes } from "@/lib/constants";
import {
  RURAL_ROUTES,
  getRuralAreaById,
  type RuralAreaId,
} from "@/lib/demos/rural/constants";
import { cn } from "@/lib/utils";

type RuralPhaseChromeProps = {
  areaId: RuralAreaId;
  children: React.ReactNode;
  className?: string;
};

/**
 * Standard phase chrome for ARKA-RURAL sub-area pages: breadcrumb + eyebrow header.
 * ComplianceBar is rendered by app/rural/layout.tsx.
 */
export function RuralPhaseChrome({ areaId, children, className }: RuralPhaseChromeProps) {
  const area = getRuralAreaById(areaId);

  return (
    <div className={cn("space-y-6 sm:space-y-8", className)}>
      <nav aria-label="Breadcrumb" className="text-sm font-medium text-arka-text-dark-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={routes.home} className="transition-colors hover:text-arka-teal">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 shrink-0 text-arka-text-dark-soft" aria-hidden />
            <Link href={RURAL_ROUTES.hub} className="transition-colors hover:text-arka-teal">
              ARKA-RURAL
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 shrink-0 text-arka-text-dark-soft" aria-hidden />
            <span className="font-medium text-arka-teal">{area.title}</span>
          </li>
        </ol>
      </nav>

      <header
        id={`rural-phase-${areaId}`}
        className="relative z-10 scroll-mt-[8.5rem] md:scroll-mt-24"
      >
        <p className="mb-2 overflow-visible font-mono text-xs font-medium uppercase tracking-[0.12em] text-arka-teal-600 sm:tracking-[0.14em]">
          {area.eyebrow}
        </p>
        <h1 className="font-heading text-2xl font-semibold text-arka-text-dark sm:text-3xl lg:text-4xl">
          {area.title}
        </h1>
        <p className="mt-2 max-w-3xl text-base text-arka-text-dark-muted sm:text-lg">
          {area.description}
        </p>
      </header>

      {children}
    </div>
  );
}
