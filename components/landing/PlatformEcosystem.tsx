"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { routes } from "@/lib/constants";

type Phase = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accentColor: string;
  liveDemo?: boolean;
};

const phases: Phase[] = [
  {
    id: "clin-suite",
    title: "ARKA-CLIN",
    subtitle: "Standalone + EHR-Embedded (CDS Hooks) · For Clinicians",
    description:
      "Two views, one engine: the standalone clinician web app and ARKA running inside a simulated Epic chart via HL7 CDS Hooks. The provider-side appropriateness + denial-risk engine — evidence-based ordering guidance at the point of care.",
    href: routes.clinSuite,
    icon: Stethoscope,
    accentColor: "#14B8A6",
    liveDemo: true,
  },
  {
    id: "ed",
    title: "ARKA-ED",
    subtitle: "For Medical Students & Residents",
    description:
      "An interactive learning platform for mastering radiology protocols and imaging appropriateness criteria — training clinicians to order appropriately and filling the gap left by the repealed PAMA AUC mandate.",
    href: routes.ed,
    icon: GraduationCap,
    accentColor: "#14B8A6",
  },
  {
    id: "ins",
    title: "ARKA-INS",
    subtitle: "For Radiology Benefit Managers",
    description:
      "The same engine on the payer's side: CMS-0057-F Da Vinci PAS, shipping today. Streamlined utilization review that ensures appropriate imaging while reducing administrative burden.",
    href: routes.ins,
    icon: ShieldCheck,
    accentColor: "#0F172A",
  },
  {
    id: "rural",
    title: "Rural Platform",
    subtitle: "Rural Imaging Crisis",
    description:
      "Resource-aware decision support for low-capacity and rural sites — teleradiology, training, reimbursement, network, AI, and population intelligence for rural imaging access.",
    href: routes.rural,
    icon: MapPin,
    accentColor: "#0d9488",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const HUB = { x: 300, y: 108 };
const NODES = [
  { label: "CLIN", x: 300, y: 28 },
  { label: "ED", x: 548, y: 108 },
  { label: "INS", x: 300, y: 188 },
  { label: "RURAL", x: 52, y: 108 },
] as const;

/**
 * Unified platform section — shared knowledge base hub and four phase demos.
 */
export function PlatformEcosystem() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="platform"
      className="scroll-mt-14 border-t border-arka-light bg-white px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="platform-ecosystem-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="platform-ecosystem-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text-dark sm:text-3xl"
        >
          One engine. One shared knowledge base. Four phases.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-3xl text-center text-arka-text-dark-muted"
        >
          ARKA is a single decision engine with a shared knowledge base. Insights
          from each phase inform and improve the others — the same math runs on
          both sides of the prior-auth wall, from the clinician&apos;s order to the
          payer&apos;s review. Explore the four phases below.
        </motion.p>

        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.14 }}
          className="mx-auto mt-12 max-w-xl"
        >
          <p className="sr-only">
            ARKA shared knowledge base connects four phases: CLIN for clinicians,
            ED for medical students and residents, INS for radiology benefit
            managers, and RURAL for rural imaging access.
          </p>
          <svg
            viewBox="0 0 600 240"
            className="mx-auto h-auto w-full max-h-[260px] text-arka-teal"
            aria-hidden
          >
            {NODES.map((node) => (
              <line
                key={node.label}
                x1={HUB.x}
                y1={HUB.y}
                x2={node.x}
                y2={node.y}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeOpacity={0.45}
              />
            ))}
            {NODES.map((node) => (
              <g key={node.label}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={28}
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-arka-text-dark text-[11px] font-semibold"
                  style={{ fontSize: node.label === "RURAL" ? 9 : 11 }}
                >
                  {node.label}
                </text>
              </g>
            ))}
            <circle
              cx={HUB.x}
              cy={HUB.y}
              r={36}
              fill="white"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <text
              x={HUB.x}
              y={HUB.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-arka-text-dark text-sm font-bold"
              style={{ fontSize: 14 }}
            >
              ARKA
            </text>
            <text
              x={HUB.x}
              y={HUB.y + 52}
              textAnchor="middle"
              className="fill-arka-teal text-[10px] font-semibold tracking-widest"
              style={{ fontSize: 10, letterSpacing: "0.12em" }}
            >
              SHARED KNOWLEDGE BASE
            </text>
          </svg>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {phases.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={phase.id}
                initial={fadeIn.initial}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  ...fadeIn.transition,
                  delay: 0.2 + i * 0.1,
                }}
              >
                <Link
                  href={phase.href}
                  className="group relative flex flex-col rounded-xl border border-arka-light bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-arka-teal focus-visible:outline-offset-2"
                >
                  {phase.liveDemo ? (
                    <span className="absolute right-4 top-4 rounded-full border border-arka-cyan/60 bg-arka-cyan/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-arka-cyan">
                      Live Demo
                    </span>
                  ) : null}
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: phase.accentColor }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-arka-text-dark">
                    {phase.title}
                  </h3>
                  <p
                    className="mt-1 text-sm font-medium"
                    style={{ color: phase.accentColor }}
                  >
                    {phase.subtitle}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-arka-text-dark-muted">
                    {phase.description}
                  </p>
                  <span
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: phase.accentColor }}
                  >
                    Enter Demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.65 }}
          className="mx-auto mt-12 max-w-3xl text-center font-medium text-arka-text-dark"
        >
          At ~$0.30–$0.50 PMPM, a modeled ~2.3× first-year return — and the same
          engine reaches into the ~$10B appropriateness layer of American medicine.
        </motion.p>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.72 }}
          className="mx-auto mt-3 max-w-3xl text-center text-xs text-arka-text-dark-muted"
        >
          Modeled estimate; full sourced ranges in the{" "}
          <Link href={routes.roi} className="text-arka-teal underline">
            ROI breakdown
          </Link>
          .
        </motion.p>
      </div>
    </section>
  );
}
