"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { CountUpStat } from "@/components/landing/CountUpStat";
import { LandingEyebrow } from "@/components/landing/LandingEyebrow";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/lib/constants";

const stats = [
  {
    id: "recovery",
    display: (
      <>
        <CountUpStat value={3.5} prefix="~$" suffix="M" decimals={1} className="text-4xl font-bold text-arka-teal-400 sm:text-5xl" />
      </>
    ),
    label: "recovered/yr in avoidable imaging denials*",
  },
  {
    id: "avoidable",
    display: (
      <CountUpStat value={86} suffix="%" className="text-4xl font-bold text-arka-teal-400 sm:text-5xl" />
    ),
    label: "of imaging denials are avoidable",
  },
  {
    id: "latency",
    display: (
      <span className="text-4xl font-bold tabular-nums text-arka-teal-400 sm:text-5xl">&lt;800ms</span>
    ),
    label: "to score an order, in-flow, no extra click",
  },
  {
    id: "autoclear",
    display: (
      <CountUpStat
        value={35}
        suffix="–40%"
        className="text-4xl font-bold text-arka-teal-400 sm:text-5xl"
      />
    ),
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
      className="scroll-mt-14 bg-surface-dark px-4 py-24 md:py-32 sm:px-6 lg:px-8"
      aria-labelledby="revenue-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
        >
          <LandingEyebrow dark>Modeled economics</LandingEyebrow>
        </motion.div>
        <motion.h2
          id="revenue-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-h2 font-semibold text-white"
        >
          The math a CFO can sign
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-body-lg text-arka-slate-300"
        >
          Modeled for a regional hospital group running ~120,000 advanced imaging studies a year —
          the conservative case.
        </motion.p>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
              initial={fadeIn.initial}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                ...fadeIn.transition,
                delay: 0.12 + i * 0.1,
              }}
            >
              <Card
                variant="dark"
                className="relative overflow-hidden border-white/10 bg-surface-dark-raised text-center"
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border-[6px] border-arka-teal-500/20"
                  aria-hidden
                />
                <CardContent className="relative p-6 pt-8">
                  <div className="flex justify-center">{stat.display}</div>
                  <p className="mt-3 text-sm leading-relaxed text-arka-slate-400">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.52 }}
          className="mx-auto mt-12 max-w-2xl text-center text-arka-slate-300"
        >
          One guideline-redirected order: ~$1,180 avoided.* Scale that across 120,000 studies and
          the conservative recovery is ~$3.5M/yr — plus roughly ~$0.5M in faster throughput on your
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
              className="flex gap-3 text-sm leading-relaxed text-arka-slate-300"
            >
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal-400" aria-hidden />
              <span>{lever}</span>
            </motion.li>
          ))}
        </ul>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.92 }}
          className="mx-auto mt-10 max-w-2xl text-center text-sm text-arka-slate-400"
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
            href={routes.roi}
            className="arka-button-primary inline-flex min-h-[44px] items-center justify-center px-8 py-3 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark touch-manipulation"
          >
            See the full ROI breakdown
          </Link>
        </motion.div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 1.08 }}
          className="mx-auto mt-8 max-w-3xl text-center text-xs text-arka-slate-500"
        >
          *Modeled, conservative estimate using published CAQH, KFF, MGMA, AMA, and ACR figures;
          aggressive case ~1.5×. ARKA is Non-Device CDS — figures are decision-support economics,
          not a guarantee of outcomes.
        </motion.p>
      </div>
    </section>
  );
}
