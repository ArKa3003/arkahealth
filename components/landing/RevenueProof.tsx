"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { routes } from "@/lib/constants";

const stats = [
  {
    value: "~$3.5M",
    label: "recovered/yr in avoidable imaging denials*",
  },
  {
    value: "86%",
    label: "of imaging denials are avoidable",
  },
  {
    value: "<800ms",
    label: "to score an order, in-flow, no extra click",
  },
  {
    value: "35–40%",
    label: "of orders auto-clear and never hit a queue",
  },
] as const;

const levers = [
  "Denial recovery — clean documentation at the point of order converts would-be denials to clean pays.",
  "Rework labor avoided — fewer denials means fewer appeals to staff.",
  "Throughput defense — faster approvals shorten the backlog on your highest-margin line (~$0.5M*).",
  "Admin redirected — when the clinician's documentation is complete, clean orders clear payer review without a queue.",
] as const;

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/**
 * Homepage revenue proof strip — modeled CFO math the hero CTA scrolls to.
 * Figures are conservative modeled estimates; not measured outcomes.
 */
export function RevenueProof() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="revenue"
      className="scroll-mt-14 bg-gradient-hero px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="revenue-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="revenue-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text sm:text-3xl"
        >
          The math a CFO can sign
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-arka-text-soft"
        >
          Modeled for a regional hospital group running ~120,000 advanced imaging studies a year —
          the conservative case.
        </motion.p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={fadeIn.initial}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                ...fadeIn.transition,
                delay: 0.12 + i * 0.1,
              }}
              className="text-center"
            >
              <p className="text-4xl font-bold text-arka-cyan sm:text-5xl">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-arka-text-soft">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.52 }}
          className="mx-auto mt-12 max-w-2xl text-center text-arka-text-soft"
        >
          One guideline-redirected order: ~$1,180 avoided.* Scale that across 120,000 studies and the
          conservative recovery is ~$3.5M/yr — plus roughly ~$0.5M in faster throughput on your
          highest-margin line.
        </motion.p>

        <ul className="mx-auto mt-10 max-w-2xl space-y-4">
          {levers.map((lever, i) => (
            <motion.li
              key={lever}
              initial={fadeIn.initial}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                ...fadeIn.transition,
                delay: 0.6 + i * 0.08,
              }}
              className="flex gap-3 text-sm leading-relaxed text-arka-text-soft"
            >
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal"
                aria-hidden
              />
              <span>{lever}</span>
            </motion.li>
          ))}
        </ul>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.92 }}
          className="mx-auto mt-10 max-w-2xl text-center text-sm text-arka-text-soft"
        >
          Priced at ~$0.30–$0.50 PMPM — a modeled ~2.3× first-year return.*
        </motion.p>

        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 1.0 }}
          className="mt-8 flex justify-center"
        >
          <Link
            href={routes.ins}
            className="arka-button-primary inline-flex min-h-[44px] items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark touch-manipulation"
          >
            See the full ROI breakdown
          </Link>
        </motion.div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 1.08 }}
          className="mx-auto mt-8 max-w-3xl text-center text-xs text-arka-text-soft/60"
        >
          *Modeled, conservative estimate using published CAQH, KFF, MGMA, AMA, and ACR figures;
          aggressive case ~1.5×. ARKA is Non-Device CDS — figures are decision-support economics,
          not a guarantee of outcomes.
        </motion.p>
      </div>
    </section>
  );
}
