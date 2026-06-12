import Link from "next/link";

import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface DemoViewSwitcherProps {
  current: "standalone" | "embedded" | "combined";
  /** When "dark", label copy uses light-on-navy tokens (cards stay on white surfaces). */
  tone?: "light" | "dark";
}

const VIEWS = [
  {
    id: "standalone" as const,
    title: "Standalone Web App",
    subtitle: "ARKA-CLIN",
    description: "The ARKA product, used directly by a clinician in a browser.",
    href: `${routes.clinSuite}?view=standalone`,
    cta: "Open standalone view",
  },
  {
    id: "embedded" as const,
    title: "Embedded in EHR via CDS Hooks",
    subtitle: "CDS Hooks Live Demo",
    description:
      "The same engine, surfaced inside a simulated Epic chart via the HL7 CDS Hooks open standard.",
    href: `${routes.clinSuite}?view=embedded`,
    cta: "Open EHR-embedded view",
  },
  {
    id: "combined" as const,
    title: "Both Views Side-by-Side",
    subtitle: "ARKA-CLIN Suite",
    description: "Standalone + EHR-embedded + CDS Hooks discovery on a single page.",
    href: `${routes.clinSuite}?view=discovery`,
    cta: "Open ARKA-CLIN Suite",
  },
] as const;

/**
 * Side-by-side comparison strip linking the standalone CLIN demo and the CDS Hooks EHR demo.
 */
export function DemoViewSwitcher({ current, tone = "light" }: DemoViewSwitcherProps) {
  return (
    <section aria-label="Two views, one engine" className="mb-6 sm:mb-8">
      <p
        className={cn(
          "mb-3 text-sm font-medium uppercase tracking-wide",
          tone === "dark" ? "text-arka-slate-300" : "text-arka-text-dark-muted",
        )}
      >
        Two views, one engine
      </p>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {VIEWS.map((view) => {
          const isActive = view.id === current;

          return (
            <article
              key={view.id}
              className={cn(
                "arka-card flex flex-col rounded-xl border border-arka-primary/20 p-4 sm:p-5",
                isActive && "ring-2 ring-arka-cyan",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <h2 className="text-base font-semibold text-arka-text-dark sm:text-lg">{view.title}</h2>
              <p className="mt-0.5 text-sm font-medium text-arka-teal-700">{view.subtitle}</p>
              <p className="mt-2 flex-1 text-sm text-arka-text-dark-muted">{view.description}</p>
              <Link
                href={view.href}
                className={cn(
                  "mt-4 inline-flex w-fit min-h-[44px] touch-manipulation items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
                  isActive
                    ? "border-arka-teal-600/60 bg-arka-teal-50 text-arka-teal-800"
                    : "border-arka-teal/40 bg-arka-teal/5 text-arka-teal-800 hover:border-arka-teal/60 hover:bg-arka-teal/10",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive ? "Current view" : view.cta}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
