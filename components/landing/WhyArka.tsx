"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, ShieldCheck, MousePointerClick } from "lucide-react";

import { LandingEyebrow } from "@/components/landing/LandingEyebrow";

const benefits = [
  {
    icon: TrendingUp,
    title: "Recover revenue you already earned",
    description:
      "ARKA documents medical necessity at the point of order, so claims go out clean. Modeled recovery: ~$3.5M/yr in avoidable imaging denials for a mid-sized system.*",
  },
  {
    icon: ShieldCheck,
    title: "Pass every regulation by design",
    description:
      "Non-Device CDS under §520(o)(1)(E) — no FDA 510(k). HIPAA-safe federated learning, no raw PHI moved. A CMS-0057-F Da Vinci PAS endpoint shipping in production today.",
  },
  {
    icon: MousePointerClick,
    title: "Zero change to the doctor's workflow",
    description:
      "Non-blocking, in-flow, under 800ms, inside Epic, Cerner, and Athena. Silent unless a guideline fires. 35–40% of orders auto-clear and never enter a queue. No new screen, ever.",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function WhyArka() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="why-arka"
      className="scroll-mt-14 bg-surface px-4 py-24 md:py-32 sm:px-6 lg:px-8"
      aria-labelledby="why-arka-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
        >
          <LandingEyebrow>Value proposition</LandingEyebrow>
        </motion.div>
        <motion.h2
          id="why-arka-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-h2 font-semibold text-arka-slate-900"
        >
          How ARKA pays for itself
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-body-lg text-arka-slate-600"
        >
          Three reasons a CFO signs — and a physician never notices.
        </motion.p>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={fadeIn.initial}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  ...fadeIn.transition,
                  delay: 0.12 + i * 0.1,
                }}
                className="flex flex-col items-center rounded-radius-lg border border-border-subtle bg-surface-raised px-6 py-8 text-center shadow-elevation-2 transition-all duration-300 hover:-translate-y-2 hover:border-arka-teal/40 hover:shadow-elevation-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arka-teal focus-visible:outline-offset-2 active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-radius-md bg-arka-teal/15 text-arka-teal">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-h3 text-arka-slate-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-arka-slate-600">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-arka-slate-500">
          *Modeled estimate; sourced ranges in ARKA&apos;s revenue model. ARKA is decision support
          — the ordering clinician retains the final decision.
        </p>
      </div>
    </section>
  );
}
