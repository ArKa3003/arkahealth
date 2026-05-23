"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ClipboardCheck, TrendingUp, Award, Receipt, Plug } from "lucide-react";
import { routes } from "@/lib/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const CORE_PLATFORM_CARDS = [
  {
    title: "RBM Reviewer Dashboard",
    subtitle: "Three-column non-modal workflow · Behavioral design deliverables",
    icon: ClipboardCheck,
    href: `${routes.ins}/reviewer`,
    badge: "Live demo",
    external: false,
  },
  {
    title: "ROI & Validation Dashboard",
    subtitle: "Administrative burden · Cost avoidance · Payer ROI · CMS-0057-F compliance",
    icon: TrendingUp,
    href: `${routes.ins}/dashboard/roi`,
    badge: "Investor view",
    external: false,
  },
  {
    title: "Provider Gold Card Portfolio",
    subtitle: "Forward-looking gold card eligibility · Next milestone tracker",
    icon: Award,
    href: `${routes.ins}/provider`,
    badge: "Differentiator",
    external: false,
  },
  {
    title: "Patient OOP Cost Explainer",
    subtitle: "Good Faith Estimate · Cash-pay comparator · 4th-grade reading level",
    icon: Receipt,
    href: `${routes.ins}/patient/explainer/demo-order-001`,
    badge: "Patient-facing",
    external: false,
  },
  {
    title: "CDS Hooks Discovery (Developer)",
    subtitle: "Live unified discovery endpoint · Da Vinci CRD/DTR/PAS",
    icon: Plug,
    href: "/api/cds-services",
    badge: "Developer",
    external: true,
  },
] as const;

/**
 * FDA-aligned banner and five-card grid for ARKA-INS core platform routes (CDS Hooks + AIIE).
 */
export function InsCorePlatformSection() {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="ins-core-platform"
      className="mt-10 sm:mt-14 pt-10 sm:pt-12 border-t border-arka-primary/20"
      aria-labelledby="ins-core-platform-heading"
    >
      <motion.div
        className="w-full rounded-xl border border-arka-teal/25 bg-arka-teal/10 px-4 py-4 sm:px-6 sm:py-5 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35 }}
        role="note"
      >
        <p className="text-center text-sm sm:text-base text-arka-text-dark font-medium leading-relaxed">
          ARKA-INS Core Platform — Built on HL7 Da Vinci CRD/DTR/PAS, sharing the AIIE scoring engine with ARKA-CLIN. FDA
          Non-Device CDS compliant. CMS-0057-F ready for January 2027.
        </p>
      </motion.div>

      <motion.h2
        id="ins-core-platform-heading"
        className="text-xl sm:text-2xl font-heading font-semibold text-arka-text-dark mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        Core Platform — CDS Hooks + AIIE
      </motion.h2>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
          hidden: {},
        }}
      >
        {CORE_PLATFORM_CARDS.map((card) => {
          const Icon = card.icon;
          const inner = (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-arka-teal/15 text-arka-teal">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-arka-text-dark text-sm sm:text-base leading-snug">{card.title}</span>
                  <span className="inline-flex rounded-full border border-arka-teal/30 bg-arka-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-arka-teal">
                    {card.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-arka-text-dark-muted leading-snug">{card.subtitle}</p>
              </div>
            </>
          );

          return (
            <motion.div key={card.title} variants={fadeInUp} transition={{ duration: 0.35, ease: "easeOut" }}>
              {card.external ? (
                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arka-card group flex h-full rounded-xl border border-arka-primary/20 p-4 sm:p-5 gap-3 transition-colors hover:border-arka-teal/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-light"
                >
                  {inner}
                </a>
              ) : (
                <Link
                  href={card.href}
                  className="arka-card group flex h-full rounded-xl border border-arka-primary/20 p-4 sm:p-5 gap-3 transition-colors hover:border-arka-teal/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-light"
                >
                  {inner}
                </Link>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
