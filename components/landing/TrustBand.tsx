"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { MousePointerClick, ShieldCheck } from "lucide-react";
import { routes } from "@/lib/constants";

const regulatoryPoints = [
  "Non-Device CDS under §520(o)(1)(E) — no FDA 510(k), no device timeline. ARKA evaluates whether to order the study; it never analyzes image pixels.",
  "Rules-first and citation-first: every recommendation cites a published guideline (ACR / RAND-UCLA), every ML factor paired with rationale (SHAP).",
  "HIPAA-safe: federated learning moves encrypted model updates, never patient records.",
  "CMS-0057-F ready: real, live Da Vinci CRD/DTR/PAS endpoints in production now (discovery at /.well-known/cds-services), ahead of the Jan 2027 mandate.",
] as const;

const workflowPoints = [
  "Lives inside Epic, Cerner, and Athena via HL7 CDS Hooks — no new app, no second login.",
  "Non-blocking: ARKA informs an order, it cannot stop one. The clinician keeps the final call.",
  "Silent unless a guideline fires — no alert fatigue, no flag-everything noise.",
  "Under 800ms, non-modal, with a one-click neutral override.",
] as const;

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const trustLinkClass =
  "inline-flex min-h-[44px] items-center text-sm font-medium text-arka-navy underline decoration-arka-navy/30 underline-offset-2 hover:decoration-arka-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal focus-visible:ring-offset-2 touch-manipulation";

/**
 * Homepage trust band — regulatory clearance and workflow fit, plus measured validation honesty.
 */
export function TrustBand() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="trust"
      className="scroll-mt-14 border-t border-arka-light bg-arka-bg-light px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="trust-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="trust-heading"
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={fadeIn.transition}
          className="text-center text-2xl font-bold text-arka-text-dark sm:text-3xl"
        >
          Built to clear the two reviews that kill health tech
        </motion.h2>

        <div className="mt-16 grid gap-10 md:grid-cols-2">
          <motion.article
            initial={fadeIn.initial}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...fadeIn.transition, delay: 0.12 }}
            className="rounded-xl border border-arka-light bg-white px-6 py-8 shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-arka-teal/15 text-arka-teal">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-arka-text-dark">
              Regulatory: clears by design
            </h3>

            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-arka-text-dark-muted">
              {regulatoryPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <Link href={routes.regulatoryRationale} className={`mt-4 ${trustLinkClass}`}>
              Read the regulatory rationale →
            </Link>
          </motion.article>

          <motion.article
            initial={fadeIn.initial}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...fadeIn.transition, delay: 0.22 }}
            className="rounded-xl border border-arka-light bg-white px-6 py-8 shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-arka-teal/15 text-arka-teal">
              <MousePointerClick className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-arka-text-dark">
              Workflow: doctors never notice
            </h3>

            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-arka-text-dark-muted">
              {workflowPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </motion.article>
        </div>

        <motion.div
          initial={fadeIn.initial}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...fadeIn.transition, delay: 0.36 }}
          className="mx-auto mt-12 max-w-3xl text-center text-sm text-arka-text-dark-muted"
        >
          <p>
            Measured today: 74% three-class accuracy on our synthetic, ACR-aligned validation cohort
            — real-world AUC is pending pilot data. We publish what we&apos;ve measured and label what
            we&apos;ve modeled.
          </p>
          <Link
            href={routes.cdsHooksDemoValidation}
            className={`mt-2 justify-center ${trustLinkClass}`}
          >
            See the validation dashboard →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
