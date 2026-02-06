"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Target, Zap, Shield } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Precision that never misses",
    description:
      "Evidence-based imaging appropriateness at the point of care. Every recommendation is calibrated to hit the mark.",
  },
  {
    icon: Zap,
    title: "Speed without compromise",
    description:
      "Instant CDS guidance so clinicians can order with confidence. No waiting, no guesswork.",
  },
  {
    icon: Shield,
    title: "Trust built on evidence",
    description:
      "Guidelines and criteria you can rely on. ARKA aligns with leading clinical standards.",
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
      className="scroll-mt-14 border-t border-arka-light bg-arka-bg-alt px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="why-arka-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="why-arka-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text-dark sm:text-3xl"
        >
          Why ARKA?
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-arka-text-dark-muted"
        >
          Like Gungnir – Odin&apos;s spear that never misses – ARKA delivers precision
          you can trust. One platform, one standard of care.
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
                className="flex flex-col items-center rounded-xl border border-arka-light bg-white px-6 py-8 text-center shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-arka-teal/40 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-arka-teal focus-visible:outline-offset-2 active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-arka-teal/15 text-arka-teal">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-arka-text-dark">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-arka-text-dark-muted">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
