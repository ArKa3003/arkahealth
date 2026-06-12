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

import { LandingEyebrow } from "@/components/landing/LandingEyebrow";
import { PlatformOrbit } from "@/components/landing/PlatformOrbit";
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
      className="scroll-mt-20 bg-surface px-4 py-24 md:py-32 sm:px-6 lg:px-8"
      aria-labelledby="platform-ecosystem-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
        >
          <LandingEyebrow>Platform</LandingEyebrow>
        </motion.div>
        <motion.h2
          id="platform-ecosystem-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-h2 font-semibold text-arka-slate-900"
        >
          One engine. One shared knowledge base. Four phases.
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-3xl text-center text-arka-slate-600"
        >
          ARKA is a single decision engine with a shared knowledge base. Insights from each phase
          inform and improve the others — the same math runs on both sides of the prior-auth wall,
          from the clinician&apos;s order to the payer&apos;s review. Explore the four phases below.
        </motion.p>

        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.14 }}
          className="mx-auto mt-14"
        >
          <PlatformOrbit />
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
                  className="group relative flex flex-col rounded-radius-lg border border-border-subtle bg-surface-raised p-6 shadow-elevation-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-elevation-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arka-teal focus-visible:outline-offset-2"
                >
                  {phase.liveDemo ? (
                    <span className="absolute right-4 top-4 rounded-full border border-arka-cyan/60 bg-arka-cyan/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-arka-cyan">
                      Live Demo
                    </span>
                  ) : null}
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-radius-md text-white"
                    style={{ backgroundColor: phase.accentColor }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-h3 text-arka-slate-900">{phase.title}</h3>
                  <p className="mt-1 text-sm font-medium" style={{ color: phase.accentColor }}>
                    {phase.subtitle}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-arka-slate-600">
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
          className="mx-auto mt-12 max-w-3xl text-center font-medium text-arka-slate-900"
        >
          At ~$0.30–$0.50 PMPM, a modeled ~2.3× first-year return — and the same engine reaches into
          the ~$10B appropriateness layer of American medicine.
        </motion.p>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.72 }}
          className="mx-auto mt-3 max-w-3xl text-center text-xs text-arka-slate-500"
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
