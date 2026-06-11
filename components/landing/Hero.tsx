"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Play } from "lucide-react";

import { buttonVariants } from "@/components/ui/Button";
const CredibilityStrip = dynamic(
  () =>
    import("@/components/landing/CredibilityStrip").then((m) => ({
      default: m.CredibilityStrip,
    })),
  { ssr: true },
);
import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

const HeroSimulation = dynamic(
  () =>
    import("@/components/landing/HeroSimulation").then((m) => ({
      default: m.HeroSimulation,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto h-[280px] w-full max-w-2xl animate-pulse rounded-radius-xl border border-white/10 bg-surface-dark-raised"
        aria-hidden
      />
    ),
  },
);

export function Hero() {
  return (
    <>
      <section
        className="hero-ambient-gradient bg-grain relative flex min-h-[100dvh] flex-col overflow-hidden bg-surface-dark"
        aria-label="ARKA hero"
      >
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-24 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-arka-teal-400">
              Cutting edge imaging decision support
            </p>

            <h1 className="mt-5 max-w-3xl text-display font-semibold text-white">
              Order the right imaging — the first time.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-body-lg text-arka-slate-300">
              ARKA is an evidence-based decision-support engine that guides imaging orders at the
              point of care, then runs the same appropriateness check on the payer side — fewer
              denials, less administrative burden, and the ordering clinician always keeps the final
              call.
            </p>

            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="#revenue"
                className={cn(
                  buttonVariants({ variant: "premium", size: "lg" }),
                  "min-h-[44px] touch-manipulation",
                )}
              >
                See the revenue model
              </Link>
              <Link
                href={routes.cdsHooksDemo}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "min-h-[44px] border border-white/20 text-white hover:bg-white/10 hover:text-white touch-manipulation",
                )}
              >
                <Play className="h-4 w-4" aria-hidden />
                See ARKA live in an EHR
              </Link>
            </div>

            <p className="mt-4 max-w-2xl text-center text-caption text-arka-slate-500">
              Non-Device CDS · No FDA 510(k) · CMS-0057-F ready · the ordering clinician keeps the
              final call.
            </p>
          </div>

          <div className="mx-auto mt-12 w-full max-w-7xl sm:mt-16">
            <HeroSimulation />
          </div>
        </div>
      </section>

      <CredibilityStrip />
    </>
  );
}
