"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { BarChart3, FileText, PlayCircle, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
import { routes } from "@/lib/constants";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const valueProps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: FileText,
    title: "Save your Action Plans",
    description:
      "Revisit and edit ROI action plans from /action-plan instead of rebuilding them.",
  },
  {
    icon: PlayCircle,
    title: "Pick up demos where you left off",
    description: "Persistent state across ARKA-CLIN, ARKA-ED and ARKA-INS sandboxes.",
  },
  {
    icon: BarChart3,
    title: "Access the Validation Dashboard",
    description: "Full CDS validation metrics and regulatory artifacts (/cds-hooks-demo/validation).",
  },
  {
    icon: Sparkles,
    title: "Early access",
    description:
      "New AIIE knowledge-matrix releases and CMS-0057-F tooling before public launch.",
  },
];

/**
 * Left panel for the sign-in split layout — logo and account value props.
 */
export function SignInValuePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      className="hero-ambient-gradient bg-grain relative hidden min-h-full flex-col justify-between overflow-hidden bg-surface-dark px-10 py-12 lg:flex lg:w-[45%] xl:px-14"
      aria-hidden={false}
    >
      <div className="relative z-10 flex flex-col items-center pt-4">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(20,184,166,0.16),transparent)] blur-2xl"
          aria-hidden
        />
        <ArkaAnimatedLogo
          width={280}
          height={315}
          animate={!prefersReducedMotion}
          idleAnimations={!prefersReducedMotion}
          className="mx-auto"
        />
      </div>

      <div className="relative z-10 mt-8">
        <motion.p
          initial={prefersReducedMotion ? false : fadeIn.initial}
          animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-sm font-semibold uppercase tracking-wider text-arka-teal-300"
        >
          Your ARKA account
        </motion.p>
        <motion.h2
          initial={prefersReducedMotion ? false : fadeIn.initial}
          animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: prefersReducedMotion ? 0 : 0.05 }}
          className="mt-2 text-h3 font-semibold text-white"
        >
          Everything else stays open
        </motion.h2>
        <motion.p
          initial={prefersReducedMotion ? false : fadeIn.initial}
          animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: prefersReducedMotion ? 0 : 0.1 }}
          className="mt-2 max-w-md text-base text-arka-slate-300"
        >
          No paywall on evidence or docs — sign in to save work and unlock member-only surfaces.
        </motion.p>

        <ul className="mt-8 space-y-5">
          {valueProps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.title}
                initial={prefersReducedMotion ? false : fadeIn.initial}
                animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={{
                  ...fadeIn.transition,
                  delay: prefersReducedMotion ? 0 : 0.15 + index * 0.08,
                }}
                className="flex gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-radius-md bg-arka-teal-500/15 text-arka-teal-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-base font-semibold text-white">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-arka-slate-300">
                    {item.description}
                  </span>
                </span>
              </motion.li>
            );
          })}
        </ul>

        <footer className="relative z-10 mt-10 border-t border-white/10 pt-6">
          <Link
            href={routes.security}
            className="inline-flex min-h-[44px] touch-manipulation items-center gap-2 text-sm font-medium text-arka-slate-400 transition-colors hover:text-arka-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            Security &amp; Compliance
          </Link>
        </footer>
      </div>
    </div>
  );
}
