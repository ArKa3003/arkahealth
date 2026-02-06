"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { value: "~40%", label: "Average PA review time reduction" },
  { value: "~25%", label: "Appeal rate reduction (transparent rationale)" },
  { value: "~35%", label: "Auto-approval rate for clearly appropriate studies" },
];

export function AIIEForUtilizationManagementSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="aiie-for-utilization-management"
      className="mt-10 sm:mt-14 pt-10 sm:pt-12 border-t border-arka-light"
      aria-labelledby="aiie-um-heading"
    >
      <motion.span
        className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-arka-teal/15 text-arka-teal border border-arka-teal/30 mb-4"
        aria-hidden
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35 }}
      >
        Technology
      </motion.span>

      <motion.h2
        id="aiie-um-heading"
        className="text-2xl sm:text-3xl font-heading font-semibold text-arka-text-dark mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        AIIE for Utilization Management
      </motion.h2>

      <motion.div
        className="space-y-3 mb-6 sm:mb-8 max-w-3xl"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <p className="text-arka-text-dark-muted text-base sm:text-lg">
          <strong className="text-arka-text-dark">AIIE (ARKA Imaging Intelligence Engine)</strong>{" "}
          applies the same clinical appropriateness methodology used by ordering physicians. This
          creates alignment between clinical and payer perspectives—evidence-based, transparent,
          and auditable.
        </p>
      </motion.div>

      {/* Key stats - data-driven aesthetic */}
      <motion.div
        className="rounded-xl bg-arka-bg-dark border border-arka-deep p-5 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-arka-text mb-4">Key metrics for RBMs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-bold text-arka-teal">{stat.value}</div>
              <div className="text-xs sm:text-sm text-arka-text-soft mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
