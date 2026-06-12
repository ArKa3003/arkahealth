"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronDown, FileText } from "lucide-react";

import { FRAMEWORKS, type FrameworkStatus } from "@/lib/security/compliance-data";
import { cn } from "@/lib/utils";

const STATUS_BADGE_STYLES: Record<FrameworkStatus, string> = {
  "in-force": "bg-success-bg text-success",
  "in-progress": "bg-warning-bg text-warning",
  roadmap: "bg-arka-bg-alt text-arka-text-dark-muted",
};

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type FrameworkCardProps = {
  framework: (typeof FRAMEWORKS)[number];
  index: number;
};

function FrameworkCard({ framework, index }: FrameworkCardProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px" });
  const prefersReducedMotion = useReducedMotion();
  const delay = prefersReducedMotion ? 0 : index * 0.08;

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? false : fadeIn.initial}
      animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
      transition={{ ...fadeIn.transition, delay }}
      className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="pr-4 text-lg font-semibold text-arka-text-dark">{framework.name}</h3>
        <span
          className={cn(
            "shrink-0 self-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
            STATUS_BADGE_STYLES[framework.status],
          )}
        >
          {framework.statusLabel}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-arka-text-dark-muted">
        {framework.summary}
      </p>

      <details className="group mt-3 marker:hidden">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-arka-teal-700">
          What this means
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden
          />
        </summary>
        <p className="mt-2 text-sm text-arka-text-dark-muted">{framework.detail}</p>
      </details>

      <p className="mt-auto flex items-center gap-1.5 pt-4 font-mono text-xs text-arka-text-dark-soft">
        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {framework.docRef}
      </p>
    </motion.article>
  );
}

/**
 * Framework compliance cards for /security — renders FRAMEWORKS verbatim.
 */
export function FrameworkCards() {
  return (
    <section id="frameworks" className="scroll-mt-24 bg-arka-bg-light py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-bold text-arka-text-dark">Compliance at a glance</h2>
          <p className="mt-3 text-arka-text-dark-muted">
            Four frameworks, one program. Statuses below are kept deliberately exact — they
            update the day an artifact is issued, and never before.
          </p>
        </header>

        <div className="mt-10 grid auto-rows-fr gap-6 md:grid-cols-2">
          {FRAMEWORKS.map((framework, index) => (
            <FrameworkCard key={framework.id} framework={framework} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
