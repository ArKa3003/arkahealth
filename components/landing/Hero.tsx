"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";

import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
import { buttonVariants } from "@/components/ui/Button";
import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CredibilityStrip = dynamic(
  () =>
    import("@/components/landing/CredibilityStrip").then((m) => ({
      default: m.CredibilityStrip,
    })),
  { ssr: true },
);

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

/** Returns true when viewport is below the sm breakpoint (640px). */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

const heroCopyFade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const skipMotion = prefersReducedMotion === true;
  const isMobile = useIsMobile();

  const copyMotion = (delay: number) =>
    skipMotion
      ? { initial: false as const, animate: heroCopyFade.visible }
      : {
          initial: heroCopyFade.hidden,
          animate: heroCopyFade.visible,
          transition: { ...heroCopyFade.transition, delay },
        };

  return (
    <>
      <section
        className="hero-ambient-gradient bg-grain relative -mt-16 flex min-h-[100dvh] flex-col overflow-hidden bg-surface-dark pt-16"
        aria-label="ARKA hero"
      >
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-6 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <div
              className="relative mx-auto w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[600px]"
              aria-label="ARKA — remARKAbly precise"
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(20,184,166,0.18),transparent)] blur-2xl"
                aria-hidden
              />
              <ArkaAnimatedLogo
                width={600}
                height={675}
                animate
                idleAnimations={!isMobile}
                className="h-auto w-full drop-shadow-[0_0_60px_rgba(20,184,166,0.25)]"
              />
            </div>

            <motion.p
              {...copyMotion(1.6)}
              className="mt-4 font-mono text-xs font-medium uppercase tracking-[0.14em] text-arka-teal-400 sm:mt-5"
            >
              Cutting edge imaging decision support
            </motion.p>

            <motion.h1
              {...copyMotion(1.8)}
              className="mt-3 max-w-3xl text-display font-semibold text-white sm:mt-4"
            >
              Order the right imaging — the first time.
            </motion.h1>

            <motion.p
              {...copyMotion(2.0)}
              className="mx-auto mt-3 max-w-2xl text-body-lg text-arka-slate-300 sm:mt-4"
            >
              ARKA is an evidence-based decision-support engine that guides imaging orders at the
              point of care, then runs the same appropriateness check on the payer side — fewer
              denials, less administrative burden, and the ordering clinician always keeps the final
              call.
            </motion.p>

            <motion.div
              {...copyMotion(2.2)}
              className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-7 sm:flex-row sm:gap-4"
            >
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
            </motion.div>

            <motion.p
              {...copyMotion(2.4)}
              className="mt-3 max-w-2xl text-center text-caption text-arka-slate-500 sm:mt-4"
            >
              Non-Device CDS · No FDA 510(k) · CMS-0057-F ready · the ordering clinician keeps the
              final call.
            </motion.p>
          </div>

          <div className="mx-auto mt-8 w-full max-w-7xl sm:mt-10">
            <HeroSimulation />
          </div>
        </div>
      </section>

      <CredibilityStrip />
    </>
  );
}
