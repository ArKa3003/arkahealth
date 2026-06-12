"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Check,
  DatabaseBackup,
  FileSearch,
  GitBranch,
  KeyRound,
  Lock,
  Network,
  type LucideIcon,
} from "lucide-react";

import { CountUpStat } from "@/components/landing/CountUpStat";
import { CONTROL_PILLARS, HARD_NUMBERS } from "@/lib/security/compliance-data";

const ICON_MAP: Record<(typeof CONTROL_PILLARS)[number]["icon"], LucideIcon> = {
  Lock,
  KeyRound,
  FileSearch,
  DatabaseBackup,
  Network,
  GitBranch,
};

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type AnimatableStat = { value: number; suffix?: string };

/**
 * Returns count-up config for purely numeric HARD_NUMBERS values; null for static strings.
 */
function getAnimatableStat(raw: string): AnimatableStat | null {
  if (raw === "0") return { value: 0 };
  if (raw === "21") return { value: 21 };
  if (raw === "100%") return { value: 100, suffix: "%" };
  return null;
}

function HardNumberValue({ raw }: { raw: string }) {
  const prefersReducedMotion = useReducedMotion();
  const animatable = getAnimatableStat(raw);
  const className = "text-3xl font-bold text-arka-teal-400 md:text-4xl";

  if (animatable && !prefersReducedMotion) {
    return (
      <CountUpStat
        value={animatable.value}
        suffix={animatable.suffix ?? ""}
        className={className}
      />
    );
  }

  return <span className={`tabular-nums ${className}`}>{raw}</span>;
}

type PillarCardProps = {
  pillar: (typeof CONTROL_PILLARS)[number];
  index: number;
};

function PillarCard({ pillar, index }: PillarCardProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px" });
  const prefersReducedMotion = useReducedMotion();
  const Icon = ICON_MAP[pillar.icon];
  const delay = prefersReducedMotion ? 0 : index * 0.06;

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? false : fadeIn.initial}
      animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
      transition={{ ...fadeIn.transition, delay }}
      className="flex h-full flex-col rounded-2xl border border-border-subtle bg-white p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-arka-teal-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-arka-teal-50 text-arka-teal-600"
        aria-hidden
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>

      <h3 className="mt-4 font-semibold text-arka-text-dark">{pillar.title}</h3>

      <ul className="mt-3 space-y-2">
        {pillar.points.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-arka-text-dark-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-arka-teal-600" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

/**
 * Control pillars grid and hard-numbers stat band for /security.
 */
export function ControlPillars() {
  return (
    <section id="controls" className="scroll-mt-24">
      <div className="bg-surface py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="max-w-3xl">
            <h2 className="text-3xl font-bold text-arka-text-dark">
              The controls behind the claims
            </h2>
            <p className="mt-3 text-arka-text-dark-muted">
              Every pillar below maps to an adopted policy with a document number — not a slide.
              Auditors get the policy; you get the summary.
            </p>
          </header>

          <div className="mt-10 grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CONTROL_PILLARS.map((pillar, index) => (
              <PillarCard key={pillar.id} pillar={pillar} index={index} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-arka-bg-dark py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-3 lg:grid-cols-6">
            {HARD_NUMBERS.map((stat) => (
              <div key={stat.label}>
                <dd className="m-0">
                  <HardNumberValue raw={stat.value} />
                </dd>
                <dt className="mx-auto mt-2 max-w-[160px] text-xs leading-snug text-arka-text-soft">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
