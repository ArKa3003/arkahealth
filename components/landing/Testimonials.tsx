"use client";

import { motion, useInView } from "framer-motion";
import { Building2, Quote } from "lucide-react";
import { useRef } from "react";

import { LandingEyebrow } from "@/components/landing/LandingEyebrow";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const testimonials = [
  {
    quote:
      "ARKA is genuinely unlike anything else I've used at the point of order. Having evidence-based imaging guidance surface right in the workflow — with the reasoning shown — saves clinicians countless hours and a real amount of day-to-day stress. It's the rare tool that makes the right decision the easy one.",
    name: "Dr. Michael Glass, MD",
    title: "Physician",
    org: "Stormont Vail Health",
    location: "Topeka, KS",
  },
  {
    quote:
      "If a tool like ARKA is implemented thoughtfully into our clinical systems, it has the potential to change healthcare for the better. It streamlines imaging decisions without getting in the way of the people doing the work — and that's exactly what frontline radiology teams need.",
    name: "Mike Odgren",
    title: "Radiology Assistant",
    org: "Stormont Vail Health",
    location: "Topeka, KS",
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
          What clinicians are saying
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-arka-slate-600"
        >
          What clinicians at Stormont Vail Health say after using ARKA at the point of order.
        </motion.p>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <motion.blockquote
              key={testimonial.name}
              initial={fadeIn.initial}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...fadeIn.transition, delay: 0.15 + index * 0.1 }}
              className="flex flex-col rounded-radius-lg border border-border-subtle bg-surface px-6 py-8 shadow-elevation-2 sm:p-8"
            >
              <Quote className="h-8 w-8 shrink-0 text-arka-teal" aria-hidden />
              <p className="mt-4 flex-1 text-lg leading-relaxed text-arka-slate-800">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-border-subtle pt-6">
                <cite className="not-italic">
                  <span className="block font-semibold text-arka-slate-900">{testimonial.name}</span>
                  <span className="mt-1 block text-arka-slate-600">
                    {testimonial.title} · {testimonial.org}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm text-arka-slate-500">
                    <Building2
                      className="h-3.5 w-3.5 shrink-0 text-arka-slate-400"
                      aria-hidden
                    />
                    {testimonial.location}
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
