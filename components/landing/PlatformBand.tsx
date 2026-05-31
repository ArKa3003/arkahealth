"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  GraduationCap,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

const surfaces = [
  {
    icon: Stethoscope,
    title: "ARKA-CLIN",
    body: "The provider-side appropriateness + denial-risk engine — what the demo shows.",
  },
  {
    icon: ShieldCheck,
    title: "ARKA-INS",
    body: "The same engine on the payer's side: CMS-0057-F Da Vinci PAS, shipping today.",
  },
  {
    icon: GraduationCap,
    title: "ARKA-ED",
    body: "Trains residents to order appropriately — filling the gap left by the repealed PAMA AUC mandate.",
  },
  {
    icon: MapPin,
    title: "ARKA RURAL",
    body: "Resource-aware decision support for low-capacity and rural sites.",
  },
] as const;

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/**
 * Homepage platform band — imaging as wedge, one engine across four surfaces.
 * Modeled PMPM/ROI figures are conservative estimates, not measured outcomes.
 */
export function PlatformBand() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="platform"
      className="scroll-mt-14 border-t border-arka-bg-dark bg-arka-bg-medium px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="platform-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text sm:text-3xl"
        >
          Imaging is the wedge, not the whole company
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-arka-text-soft"
        >
          One decision engine, four surfaces — the same math on both sides of the
          prior-auth wall.
        </motion.p>

        <div className="mt-16 grid gap-10 sm:grid-cols-2">
          {surfaces.map((surface, i) => {
            const Icon = surface.icon;
            return (
              <motion.div
                key={surface.title}
                initial={fadeIn.initial}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  ...fadeIn.transition,
                  delay: 0.12 + i * 0.1,
                }}
                className="rounded-xl border border-arka-bg-dark bg-arka-bg-dark/60 px-6 py-8"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-arka-teal/15 text-arka-teal">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-arka-text">
                  {surface.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-arka-text-soft">
                  {surface.body}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.56 }}
          className="mx-auto mt-12 max-w-3xl text-center font-medium text-arka-text"
        >
          At ~$0.30–$0.50 PMPM, a modeled ~2.3× first-year return* — and the same
          engine reaches into the ~$10B appropriateness layer of American medicine.
        </motion.p>

        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.64 }}
          className="mx-auto mt-4 max-w-3xl text-center text-xs text-arka-text-soft/60"
        >
          *Modeled estimate; sourced ranges in ARKA&apos;s revenue model.
        </motion.p>
      </div>
    </section>
  );
}
