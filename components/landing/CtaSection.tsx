"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/Button";
import { LandingEyebrow } from "@/components/landing/LandingEyebrow";
import { cn } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function CtaSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="cta"
      className="scroll-mt-14 bg-grain relative bg-surface-dark px-4 py-24 md:py-32 sm:px-6 lg:px-8"
      aria-labelledby="cta-heading"
    >
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
        >
          <LandingEyebrow dark>Get started</LandingEyebrow>
        </motion.div>
        <motion.h2
          id="cta-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-h2 font-semibold text-white"
        >
          Find out what you&apos;re leaving on the table.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mt-4 text-body-lg text-arka-slate-300"
        >
          ARKA recovers revenue you&apos;re already losing to denials, speeds up your
          highest-margin service line, and reduces the admin burden doing it — without changing how
          your physicians order.
        </motion.p>
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.15 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <Link
            href="/evidence"
            className={cn(
              buttonVariants({ variant: "premium", size: "lg" }),
              "min-h-[44px] touch-manipulation",
            )}
          >
            Evidence & Compliance
          </Link>
          <Link
            href="/action-plan"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "min-h-[44px] touch-manipulation border border-arka-teal-400 text-arka-teal-300 hover:bg-arka-teal-400/10 hover:text-arka-teal-300",
            )}
          >
            Action Plan
          </Link>
        </motion.div>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.22 }}
          className="mt-6 text-xs text-arka-slate-400"
        >
          remARKAbly precise — and remarkably profitable.
        </motion.p>
      </div>
    </section>
  );
}
