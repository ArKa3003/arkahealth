"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/**
 * Standalone headline section moved out of the Hero.
 * "You did the scan. Now get paid for it." + the prior-auth framing paragraph.
 */
export function GetPaidSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="get-paid"
      className="scroll-mt-14 border-t border-arka-deep/40 bg-gradient-to-b from-arka-navy to-arka-bg-medium px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="get-paid-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="mx-auto max-w-2xl text-base leading-relaxed text-arka-text-soft sm:text-lg"
        >
          When appropriateness is documented at the moment of order — on the clinician side and the
          payer side — imaging teams stop losing revenue to avoidable denials.
        </motion.p>
        <motion.h2
          id="get-paid-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.06 }}
          className="mt-6 text-3xl font-bold text-arka-text sm:mt-8 sm:text-4xl"
        >
          You did the scan. Now get paid for it.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-arka-text-soft"
        >
          Imaging prior-auth denials run 20–40% — and ~86% of them were avoidable. ARKA is one engine
          that runs on both sides of the prior-auth wall — the doctor&apos;s and the payer&apos;s —
          documenting the clinical justification at the moment the order is placed, inside Epic,
          Cerner, and Athena, in under 800ms, without adding a single click. Clean claims go out the
          first time.
        </motion.p>
      </div>
    </section>
  );
}
