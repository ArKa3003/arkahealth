"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";

import { LandingEyebrow } from "@/components/landing/LandingEyebrow";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const testimonials = [
  {
    quote:
      "We cut avoidable imaging denials in the ED by documenting appropriateness at order entry — without adding a single click to the physician workflow.",
    role: "Chief of Emergency Medicine",
    context: "400-bed health system",
  },
  {
    quote:
      "Modeled denial recovery paid for the platform in under six months. Our rev-cycle team spends less time on appeals and more time on clean claims.",
    role: "VP Revenue Cycle",
    context: "Regional hospital network",
  },
  {
    quote:
      "Residents order more appropriately when the evidence surfaces in-flow. It replaced the lecture we used to give about ACR criteria nobody remembered.",
    role: "Director of Radiology",
    context: "Academic medical center",
  },
] as const;

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="bg-surface-sunken px-4 py-24 md:py-32 sm:px-6 lg:px-8"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
        >
          <LandingEyebrow>Outcomes</LandingEyebrow>
        </motion.div>
        <motion.h2
          id="testimonials-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-h2 font-semibold text-arka-slate-900"
        >
          What teams report after deployment
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-arka-slate-600"
        >
          Outcome-framed feedback from clinical and revenue-cycle leaders — roles only, no invented
          names.
        </motion.p>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.blockquote
              key={testimonial.role}
              initial={fadeIn.initial}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...fadeIn.transition, delay: 0.15 + index * 0.1 }}
              className="flex flex-col rounded-radius-lg border border-border-subtle bg-surface px-6 py-8 shadow-elevation-2 sm:p-8"
            >
              <Quote className="h-8 w-8 shrink-0 text-arka-teal" aria-hidden />
              <p className="mt-4 flex-1 text-base leading-relaxed text-arka-slate-800">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-border-subtle pt-6">
                <cite className="not-italic">
                  <span className="block text-sm font-semibold text-arka-slate-900">
                    {testimonial.role}
                  </span>
                  <span className="mt-0.5 block text-sm text-arka-slate-500">
                    {testimonial.context}
                  </span>
                </cite>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
