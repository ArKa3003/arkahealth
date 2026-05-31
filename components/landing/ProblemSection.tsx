"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BellOff, Clock, FileX, Repeat } from "lucide-react";

const painPoints = [
  {
    icon: FileX,
    title: "The denial nobody saw coming",
    body: "The scan was justified. The auth bounced six weeks later over one line of documentation no one asked for — and now it's a write-off. Prior-auth denial rates on advanced imaging run 20–40%.",
  },
  {
    icon: Repeat,
    title: "The appeal you can't afford to file",
    body: "Roughly half of denied claims are never reworked — the appeal costs more staff time than the claim is worth. So the hospital eats earned revenue, and a nurse loses hours to a payer hold line.",
  },
  {
    icon: Clock,
    title: "The backlog on your best-margin line",
    body: "Imaging is one of the highest-margin service lines you run. Every order stuck waiting on auth is a scan not completed this month — slow approvals are slow revenue.",
  },
  {
    icon: BellOff,
    title: "The tool everyone deletes in a week",
    body: "The last 'AI' tool flagged everything, interrupted every order, and added five clicks. The team clicked past it until it was switched off. Sound familiar?",
  },
] as const;

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/**
 * Homepage "groan" section — names imaging revenue-cycle pain in clinicians' and rev-cycle teams' own words.
 */
export function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="the-problem"
      className="scroll-mt-14 border-t border-arka-light bg-arka-bg-alt px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="the-problem-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="the-problem-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text-dark sm:text-3xl"
        >
          The work got done. The money didn&apos;t show up.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-arka-text-dark-muted"
        >
          Every imaging team knows this loop. ARKA breaks it.
        </motion.p>

        <div className="mt-16 grid gap-10 sm:grid-cols-2">
          {painPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={fadeIn.initial}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  ...fadeIn.transition,
                  delay: 0.12 + i * 0.1,
                }}
                className="rounded-xl border border-arka-light bg-white px-6 py-8 shadow-card transition-all duration-300 hover:-translate-y-1"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-arka-teal/15 text-arka-teal">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-arka-text-dark">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-arka-text-dark-muted">
                  {point.body}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.56 }}
          className="mx-auto mt-12 max-w-3xl text-center font-medium text-arka-text-dark"
        >
          ~86% of imaging denials are avoidable. The fix has to happen where the order is placed —
          not in the billing office six weeks later.
        </motion.p>
      </div>
    </section>
  );
}
