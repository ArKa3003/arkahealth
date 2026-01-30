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
      className="border-t border-arka-deep/50 bg-arka-bg-dark px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          id="cta-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-2xl font-bold text-arka-text sm:text-3xl"
        >
          Ready to experience precision?
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mt-4 text-arka-text-soft"
        >
          Explore the ARKA ecosystem and see how evidence-based CDS can
          transform your imaging workflow.
        </motion.p>
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="#solutions"
            className="arka-button-primary inline-flex items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark"
          >
            Explore solutions
          </Link>
          <Link
            href="#ecosystem"
            className="arka-button-secondary inline-flex items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark"
          >
            View ecosystem
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
