"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Stethoscope,
  GraduationCap,
  Shield,
  ArrowRight,
} from "lucide-react";

const cards = [
  {
    id: "clin",
    title: "ARKA-CLIN",
    subtitle: "For Medical Professionals",
    description:
      "AI-powered clinical decision support for radiologists and physicians. Optimize imaging protocols with precision.",
    href: "/clin",
    icon: Stethoscope,
    accentColor: "#5B9BD5",
    Decorative: ScanLinesPattern,
    patternId: "scan-lines",
  },
  {
    id: "ed",
    title: "ARKA-ED",
    subtitle: "For Medical Students & Residents",
    description:
      "Interactive learning platform for mastering radiology protocols and imaging appropriateness criteria.",
    href: "/ed",
    icon: GraduationCap,
    accentColor: "#00D9FF",
    Decorative: NeuralPattern,
    patternId: "neural",
  },
  {
    id: "ins",
    title: "ARKA-INS",
    subtitle: "For Radiology Benefit Managers",
    description:
      "Streamlined utilization review tools ensuring appropriate imaging while reducing administrative burden.",
    href: "/ins",
    icon: Shield,
    accentColor: "#2C5F8D",
    Decorative: DocumentPattern,
    patternId: "document",
  },
] as const;

function ScanLinesPattern({ id: patternId }: { id: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-[0.06]"
      aria-hidden
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width="100%"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

function NeuralPattern({ id: patternId }: { id: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-[0.07]"
      aria-hidden
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="24" cy="16" r="1.5" fill="currentColor" />
            <circle cx="16" cy="28" r="1.5" fill="currentColor" />
            <circle cx="32" cy="8" r="1.5" fill="currentColor" />
            <line
              x1="8"
              y1="8"
              x2="24"
              y2="16"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <line
              x1="24"
              y1="16"
              x2="16"
              y2="28"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

function DocumentPattern({ id: patternId }: { id: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-[0.06]"
      aria-hidden
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width="24"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="4"
              y1="6"
              x2="20"
              y2="6"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <line
              x1="4"
              y1="12"
              x2="16"
              y2="12"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <line
              x1="4"
              y1="18"
              x2="20"
              y2="18"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <path
              d="M8 22 L10 26 L14 22 L16 26"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

export function PhaseCards() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="solutions"
      ref={ref}
      className="border-t border-arka-deep/50 bg-arka-bg-medium/40 px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="phase-cards-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="phase-cards-heading"
          className="text-center text-2xl font-bold text-arka-text sm:text-3xl"
        >
          Explore the platform
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-arka-text-soft">
          Three modules, one ecosystem. Click to open each demo.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = card.icon;
            const Decorative = card.Decorative;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.45,
                  delay: i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex min-h-0"
              >
                <Link
                  href={card.href}
                  className="group relative flex min-h-full w-full flex-col rounded-xl border border-arka-deep/40 bg-arka-bg-medium/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[var(--card-accent)] hover:shadow-[0_0_24px_6px_var(--card-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-arka-cyan focus-visible:outline-offset-2"
                  style={
                    {
                      "--card-accent": card.accentColor,
                      "--card-glow": `${card.accentColor}40`,
                    } as React.CSSProperties
                  }
                >
                  <Decorative id={`${card.id}-${card.patternId}`} />
                  <span
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: card.accentColor }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="relative mt-4 text-lg font-semibold text-arka-text">
                    {card.title}
                  </h3>
                  <p
                    className="relative mt-1 text-sm font-medium"
                    style={{ color: card.accentColor }}
                  >
                    {card.subtitle}
                  </p>
                  <p className="relative mt-3 flex-1 text-sm leading-relaxed text-arka-text-soft">
                    {card.description}
                  </p>
                  <span
                    className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-colors group-hover:opacity-90"
                    style={{ color: card.accentColor }}
                  >
                    Enter Demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
