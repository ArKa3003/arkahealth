"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="border-t border-arka-deep/50 bg-arka-bg-medium/50 px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-4xl">
        <motion.h2
          id="testimonials-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text sm:text-3xl"
        >
          Trusted by clinicians
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-arka-text-soft"
        >
          Social proof and testimonials — coming soon.
        </motion.p>
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.15 }}
          className="mt-12 flex flex-col items-center justify-center rounded-xl border border-arka-deep/40 border-dashed bg-arka-bg-dark/60 px-8 py-16 text-center"
        >
          <Quote className="h-12 w-12 text-arka-cyan/30" aria-hidden />
          <p className="mt-4 text-sm font-medium text-arka-text-soft">
            Testimonials placeholder
          </p>
          <p className="mt-1 text-xs text-arka-text-soft/70">
            Quotes and logos will go here
          </p>
        </motion.div>
      </div>
    </section>
  );
}
