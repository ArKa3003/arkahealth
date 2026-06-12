"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BellOff,
  Clock,
  FileX,
  RefreshCw,
  Repeat,
} from "lucide-react";

import { LandingEyebrow } from "@/components/landing/LandingEyebrow";

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

type PainPoint = (typeof painPoints)[number];

function PainPointCard({
  point,
  index,
  isInView,
}: {
  point: PainPoint;
  index: number;
  isInView: boolean;
}) {
  const Icon = point.icon;
  return (
    <motion.div
      initial={fadeIn.initial}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        ...fadeIn.transition,
        delay: 0.12 + index * 0.1,
      }}
      className="relative rounded-radius-lg border border-border-subtle bg-surface px-6 py-8 shadow-elevation-2 transition-all duration-300 hover:-translate-y-1"
    >
      <span className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-arka-teal text-xs font-bold text-white">
        {index + 1}
      </span>
      <span className="mt-2 flex h-12 w-12 items-center justify-center rounded-radius-md bg-arka-teal/15 text-arka-teal">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-h3 text-arka-slate-900">{point.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-arka-slate-600">{point.body}</p>
    </motion.div>
  );
}

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
      className="scroll-mt-14 bg-surface-sunken px-4 py-24 md:py-32 sm:px-6 lg:px-8"
      aria-labelledby="the-problem-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
        >
          <LandingEyebrow>The denial loop</LandingEyebrow>
        </motion.div>
        <motion.h2
          id="the-problem-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-h2 font-semibold text-arka-slate-900"
        >
          The work got done. The money didn&apos;t show up.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-body-lg text-arka-slate-600"
        >
          Every imaging team knows this loop. ARKA breaks it.
        </motion.p>

        <div className="mt-16 flex flex-col gap-6 md:hidden">
          {painPoints.map((point, i) => (
            <div key={point.title}>
              <PainPointCard point={point} index={i} isInView={isInView} />
              {i < painPoints.length - 1 ? (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-7 w-7 text-arka-teal" aria-hidden />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-2">
                  <ArrowUp className="h-7 w-7 text-arka-teal" aria-hidden />
                  <p className="text-xs text-arka-slate-600">loops back to the start</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 hidden gap-x-6 gap-y-6 md:grid md:grid-cols-[1fr_auto_1fr] md:grid-rows-[auto_auto_auto]">
          <PainPointCard point={painPoints[0]} index={0} isInView={isInView} />
          <div className="flex items-center justify-center self-center">
            <ArrowRight className="h-7 w-7 text-arka-teal" aria-hidden />
          </div>
          <PainPointCard point={painPoints[1]} index={1} isInView={isInView} />

          <div className="flex items-center justify-center self-center">
            <ArrowUp className="h-7 w-7 text-arka-teal" aria-hidden />
          </div>
          <div className="flex flex-col items-center justify-center gap-1 px-2 py-4">
            <RefreshCw className="h-6 w-6 text-arka-teal" aria-hidden />
            <span className="text-center text-xs font-semibold uppercase tracking-wider text-arka-teal">
              THE DENIAL LOOP
            </span>
          </div>
          <div className="flex items-center justify-center self-center">
            <ArrowDown className="h-7 w-7 text-arka-teal" aria-hidden />
          </div>

          <PainPointCard point={painPoints[3]} index={3} isInView={isInView} />
          <div className="flex items-center justify-center self-center">
            <ArrowLeft className="h-7 w-7 text-arka-teal" aria-hidden />
          </div>
          <PainPointCard point={painPoints[2]} index={2} isInView={isInView} />
        </div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.56 }}
          className="mx-auto mt-12 max-w-3xl text-center font-medium text-arka-slate-900"
        >
          ~86% of imaging denials are avoidable. The fix has to happen where the order is placed —
          not in the billing office six weeks later.
        </motion.p>
      </div>
    </section>
  );
}
