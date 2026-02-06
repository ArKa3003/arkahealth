"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Inbox,
  Cpu,
  BookOpen,
  FileCheck,
  Clock,
  Scale,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const WORKFLOW_STEPS = [
  {
    icon: Inbox,
    title: "Receive Prior Authorization Request",
    bullets: [
      "Imaging order details automatically parsed from incoming PA requests",
      "Patient demographics, clinical indication, and proposed study extracted",
    ],
  },
  {
    icon: Cpu,
    title: "AIIE Automated Pre-Screen",
    bullets: [
      "AIIE instantly evaluates appropriateness using the same clinical criteria as ARKA-CLIN",
      "Clear-cut appropriate cases (score 7-9) can be auto-approved",
      "Clear-cut inappropriate cases (score 1-3) flagged for review with specific reasons",
    ],
  },
  {
    icon: BookOpen,
    title: "Evidence-Based Review Support",
    bullets: [
      "For borderline cases (score 4-6), reviewers see exactly which factors influenced the score",
      "Literature citations provided for each clinical factor",
      "Reduces reviewer research time and ensures consistency",
    ],
  },
  {
    icon: FileCheck,
    title: "Transparent Decision Documentation",
    bullets: [
      "Every approval/denial includes itemized clinical rationale",
      "Audit trail for compliance and appeals",
      "Reduces appeal overturn rates by documenting evidence upfront",
    ],
  },
];

const BENEFITS = [
  {
    icon: Clock,
    title: "Reduce Review Time",
    body: "Automated pre-screening handles routine cases",
  },
  {
    icon: Scale,
    title: "Improve Consistency",
    body: "Same evidence-based criteria across all reviewers",
  },
  {
    icon: MessageSquare,
    title: "Lower Appeal Rates",
    body: "Transparent reasoning reduces provider disputes",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Ready",
    body: "Full audit trail and documentation",
  },
];

export function HowArkaInsWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="how-arka-ins-works"
      className="mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-arka-primary/20"
      aria-labelledby="how-arka-ins-works-heading"
    >
      <motion.h2
        id="how-arka-ins-works-heading"
        className="text-2xl sm:text-3xl font-heading font-semibold text-arka-text-dark mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35 }}
      >
        How ARKA-INS Works for RBMs
      </motion.h2>

      <motion.p
        className="text-arka-text-dark-muted text-base sm:text-lg max-w-3xl mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        Streamlining utilization management with transparent, evidence-based decisioning.
      </motion.p>

      {/* Workflow steps - numbered */}
      <motion.ol
        className="space-y-5 mb-10"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
          hidden: {},
        }}
      >
        {WORKFLOW_STEPS.map((step, i) => (
          <motion.li
            key={step.title}
            variants={fadeInUp}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="arka-card rounded-xl border border-arka-primary/20 p-4 sm:p-5 flex gap-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-arka-teal/15 text-arka-teal">
              <step.icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-arka-teal text-white font-bold text-xs">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-arka-text-dark text-base sm:text-lg">
                  {step.title}
                </h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-arka-text-dark-muted">
                {step.bullets.map((bullet, j) => (
                  <li key={j}>{bullet}</li>
                ))}
              </ul>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      {/* Benefits callout boxes */}
      <motion.h3
        className="text-xl font-heading font-semibold text-arka-text-dark mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        Benefits for RBMs
      </motion.h3>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
          hidden: {},
        }}
      >
        {BENEFITS.map((box) => (
          <motion.div
            key={box.title}
            variants={fadeInUp}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="arka-card rounded-xl border border-arka-primary/20 p-4 sm:p-5 flex gap-3 hover:border-arka-teal/30 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-arka-teal/15 text-arka-teal">
              <box.icon className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h4 className="font-semibold text-arka-text-dark text-sm sm:text-base mb-1">
                {box.title}
              </h4>
              <p className="text-sm text-arka-text-dark-muted">{box.body}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
