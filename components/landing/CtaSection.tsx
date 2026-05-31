"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

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
      className="scroll-mt-14 border-t border-arka-light bg-arka-bg-alt px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          id="cta-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-2xl font-bold text-arka-text-dark sm:text-3xl"
        >
          Find out what you&apos;re leaving on the table.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mt-4 text-arka-text-dark-muted"
        >
          ARKA recovers revenue you&apos;re already losing to denials, speeds up
          your highest-margin service line, and reduces the admin burden doing
          it — without changing how your physicians order.
        </motion.p>
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="#revenue"
            className="arka-button-primary inline-flex min-h-[44px] items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-light touch-manipulation"
          >
            See the revenue model
          </Link>
          <Link
            href="#solutions"
            className="arka-button-secondary inline-flex min-h-[44px] items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-light touch-manipulation"
          >
            Explore the platform
          </Link>
        </motion.div>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.22 }}
          className="mt-6 text-xs text-arka-text-soft/70"
        >
          remARKAbly precise — and remarkably profitable.
        </motion.p>
      </div>
    </section>
  );
}
