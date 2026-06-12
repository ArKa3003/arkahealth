"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  Database,
  Layers,
  Sparkles,
  Workflow,
} from "lucide-react";

import { AiieFlowVignette } from "@/components/landing/AiieFlowVignette";
import { CountUpStat } from "@/components/landing/CountUpStat";
import { LandingEyebrow } from "@/components/landing/LandingEyebrow";
import { buttonVariants } from "@/components/ui/Button";
import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const ACR_ITEMS = [
  {
    icon: Layers,
    text: "Static appropriateness tables — Boolean rules tied to limited structured fields.",
  },
  {
    icon: AlertTriangle,
    text: "2.4% voluntary adoption — JACR data show very limited use without mandates.",
  },
  {
    icon: Workflow,
    text: "Lookup happens outside the workflow — clinicians leave the EHR to search PDFs.",
  },
  {
    icon: Database,
    text: "Generic guidance — not patient-specific; cannot incorporate local risk or prior imaging.",
  },
] as const;

const AIIE_ITEMS = [
  {
    icon: Sparkles,
    text: "Patient-specific ML scoring on structured FHIR context at order entry.",
  },
  {
    icon: Workflow,
    text: "In-workflow via CDS Hooks — zero extra clicks inside Epic, Cerner, and Athena.",
  },
  {
    icon: Check,
    text: "SHAP-transparent reasoning per score — every factor attributed and auditable.",
  },
  {
    icon: Check,
    text: "Continuously validated — AUC 0.876–0.942 in published studies.",
  },
  {
    icon: BookOpen,
    text: "Every output linked to the Evidence Library — first-party citations, not black-box labels.",
  },
] as const;

const VS_RING_LENGTH = 2 * Math.PI * 18;

/**
 * Flagship ACR vs AIIE comparison — scroll-built columns, stat strip, dual-path vignette.
 */
export function AiieVsAcrSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;

  const itemVisible = reducedMotion || isInView;

  return (
    <section
      ref={ref}
      id="aiie"
      className="scroll-mt-20 bg-surface-sunken px-4 py-24 md:py-32 sm:px-6 lg:px-8"
      aria-labelledby="aiie-heading"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
        >
          <LandingEyebrow>AIIE Technology</LandingEyebrow>
        </motion.div>
        <motion.h2
          id="aiie-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-h2 font-semibold text-arka-slate-900"
        >
          Introducing AIIE — the ARKA Imaging Intelligence Engine
        </motion.h2>
        <motion.p
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="mx-auto mt-4 max-w-3xl text-center text-body-lg text-arka-slate-600"
        >
          A next-generation clinical decision support system that goes beyond the static ACR
          Appropriateness Criteria you already know — patient-specific, in-workflow, and
          evidence-linked.
        </motion.p>

        {/* Comparison columns */}
        <div className="relative mt-14 lg:mt-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
            {/* Traditional ACR — muted, flat */}
            <motion.div
              initial={fadeIn.initial}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...fadeIn.transition, delay: 0.1 }}
              className="rounded-radius-xl border border-border-subtle bg-arka-slate-100/60 p-6 sm:p-8"
            >
              <h3 className="text-lg font-semibold text-arka-slate-700">
                Traditional ACR
              </h3>
              <p className="mt-1 text-sm text-arka-slate-500">
                Appropriateness Criteria — static, out-of-workflow
              </p>
              <ul className="mt-6 space-y-4">
                {ACR_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.li
                      key={item.text}
                      initial={fadeIn.initial}
                      animate={itemVisible ? { opacity: 1, y: 0 } : fadeIn.initial}
                      transition={{
                        duration: reducedMotion ? 0 : 0.45,
                        delay: reducedMotion ? 0 : 0.15 + index * 0.06,
                        ease: "linear",
                      }}
                      className="flex gap-3"
                    >
                      <Icon
                        className="mt-0.5 h-5 w-5 shrink-0 text-arka-slate-400"
                        aria-hidden
                      />
                      <span className="text-sm leading-relaxed text-arka-slate-600">
                        {item.text}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>

            {/* AIIE — teal accent, glow */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={
                isInView ? { opacity: 1, y: 0, scale: 1.01 } : { opacity: 0, y: 24, scale: 0.98 }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { ...fadeIn.transition, delay: 0.18, type: "spring", stiffness: 120, damping: 18 }
              }
              className={cn(
                "relative rounded-radius-xl border border-arka-teal-500/40 bg-surface p-6 shadow-elevation-2 sm:p-8",
                "ring-1 ring-arka-teal-500/25",
                !reducedMotion && isInView && "shadow-glow-sm",
              )}
            >
              {!reducedMotion && isInView ? (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-radius-xl ring-2 ring-arka-teal-400/30"
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  aria-hidden
                />
              ) : null}
              <h3 className="text-lg font-semibold text-arka-teal-700">
                AIIE — ARKA Imaging Intelligence Engine
              </h3>
              <p className="mt-1 text-sm text-arka-teal-600">
                Patient-specific ML at the point of order
              </p>
              <ul className="mt-6 space-y-4">
                {AIIE_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.li
                      key={item.text}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={
                        itemVisible
                          ? { opacity: 1, y: 0, scale: 1 }
                          : { opacity: 0, y: 12, scale: 0.98 }
                      }
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 140,
                              damping: 16,
                              delay: 0.22 + index * 0.07,
                            }
                      }
                      className="flex gap-3"
                    >
                      <Icon
                        className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal-600"
                        aria-hidden
                      />
                      <span className="text-sm leading-relaxed text-arka-slate-800">
                        {item.text}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </div>

          {/* VS node — lg only */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:flex"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 200, damping: 20, delay: 0.35 }
            }
            aria-hidden
          >
            <div className="relative flex h-12 w-12 items-center justify-center">
              <svg className="absolute inset-0 h-12 w-12 -rotate-90" viewBox="0 0 40 40">
                <motion.circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-arka-teal-500"
                  strokeDasharray={VS_RING_LENGTH}
                  initial={{ strokeDashoffset: VS_RING_LENGTH }}
                  animate={
                    isInView
                      ? { strokeDashoffset: 0 }
                      : { strokeDashoffset: VS_RING_LENGTH }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.8, delay: 0.4, ease: "easeOut" }
                  }
                />
              </svg>
              <span className="relative text-xs font-bold uppercase tracking-wider text-arka-slate-700">
                vs
              </span>
            </div>
          </motion.div>
        </div>

        {/* Stat strip */}
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.4 }}
          className="mt-10 grid grid-cols-1 gap-4 rounded-radius-xl border border-border-subtle bg-surface px-6 py-8 sm:grid-cols-3 sm:gap-6 sm:px-8"
          aria-label="AIIE vs ACR key statistics"
        >
          <div className="text-center sm:text-left">
            <p className="text-2xl font-bold text-arka-slate-500 sm:text-3xl">
              <CountUpStat value={2.4} decimals={1} suffix="%" />
            </p>
            <p className="mt-1 text-sm text-arka-slate-600">
              Voluntary ACR CDS adoption (JACR)
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-2xl font-bold text-arka-teal-600 sm:text-3xl">
              <CountUpStat value={0.876} decimals={3} />
              <span className="text-arka-slate-400">–</span>
              <CountUpStat value={0.942} decimals={3} />
            </p>
            <p className="mt-1 text-sm text-arka-slate-600">
              AIIE AUC in published studies
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-2xl font-bold text-arka-teal-600 sm:text-3xl">
              <CountUpStat value={0} suffix="" />
              <span className="text-arka-slate-900"> extra clicks</span>
            </p>
            <p className="mt-1 text-sm text-arka-slate-600">
              In-workflow at order entry via CDS Hooks
            </p>
          </div>
        </motion.div>

        {/* Flow vignette */}
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.48 }}
          className="mt-12"
        >
          <h3 className="text-center text-lg font-semibold text-arka-slate-900">
            Same order, two paths
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-arka-slate-600">
            Watch the same imaging order evaluated the traditional way versus inline with AIIE.
          </p>
          <div className="mt-6">
            <AiieFlowVignette />
          </div>
        </motion.div>

        {/* CTA row */}
        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.55 }}
          className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <Link
            href={routes.evidence}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "min-h-[44px] touch-manipulation gap-2",
            )}
          >
            Browse the evidence
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={routes.cdsHooksDemo}
            className={cn(
              buttonVariants({ variant: "premium", size: "lg" }),
              "min-h-[44px] touch-manipulation gap-2",
            )}
          >
            See AIIE score live
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
