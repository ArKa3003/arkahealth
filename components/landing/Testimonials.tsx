"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";

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

/** Derives two-letter initials from a clinician name (strips honorifics and credentials). */
function getInitials(name: string): string {
  const cleaned = name
    .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
    .replace(/,\s*(MD|DO|PhD).*$/i, "")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
}

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="border-t border-arka-light bg-white px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="testimonials-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text-dark sm:text-3xl"
        >
          Trusted by clinicians
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-arka-text-dark-muted"
        >
          Early feedback from clinicians and radiology teams using ARKA.
        </motion.p>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <motion.blockquote
              key={testimonial.name}
              initial={fadeIn.initial}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...fadeIn.transition, delay: 0.15 + index * 0.1 }}
              className="flex flex-col rounded-xl border border-arka-light bg-white p-6 shadow-card sm:p-8"
            >
              <Quote
                className="h-8 w-8 shrink-0 text-arka-teal"
                aria-hidden
              />
              <p className="mt-4 flex-1 text-base leading-relaxed text-arka-text-dark">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="mt-6 flex items-center gap-4 border-t border-arka-light pt-6">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-arka-navy text-sm font-semibold text-arka-text"
                  aria-hidden
                >
                  {getInitials(testimonial.name)}
                </div>
                <div>
                  <cite className="not-italic">
                    <span className="block font-semibold text-arka-text-dark">
                      {testimonial.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-arka-text-dark-soft">
                      {testimonial.title} · {testimonial.org}
                    </span>
                    <span className="block text-sm text-arka-text-dark-soft">
                      {testimonial.location}
                    </span>
                  </cite>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
