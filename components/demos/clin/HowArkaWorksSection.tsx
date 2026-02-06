"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Database,
  Cpu,
  FileOutput,
  BookOpen,
  UserCheck,
  Search,
  Info,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export function HowArkaWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="how-arka-works"
      className="mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-arka-primary/20"
      aria-labelledby="how-arka-works-heading"
    >
      <motion.h2
        id="how-arka-works-heading"
        className="text-2xl sm:text-3xl font-heading font-semibold text-arka-text-dark mb-4"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35 }}
      >
        How ARKA Works
      </motion.h2>

      <motion.p
        className="text-arka-text-dark-muted text-base sm:text-lg max-w-3xl mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        ARKA (Imaging Intelligence Engine) helps healthcare providers decide when imaging is appropriate.
        You enter a clinical scenario; ARKA applies evidence-based rules and returns a score with a clear
        explanation. Below is the high-level flow and the FDA Non-Device CDS criteria ARKA satisfies.
      </motion.p>

      {/* Workflow diagram - 3 columns */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: {
            transition: { staggerChildren: 0.12, delayChildren: 0.1 },
          },
          hidden: {},
        }}
      >
        {[
          {
            icon: Database,
            title: "Data Input",
            body: "Clinical scenario (complaint, duration, red flags, proposed imaging) is entered by the provider or pulled from the EHR.",
            color: "arka-cyan",
          },
          {
            icon: Cpu,
            title: "AIIE Processing",
            body: "AIIE applies weighted clinical factors from peer-reviewed literature to compute an appropriateness score (1-9) and explanation.",
            color: "arka-teal",
          },
          {
            icon: FileOutput,
            title: "Recommendation Output",
            body: "You see a score, category (Usually Appropriate / May Be Appropriate / Usually Not Appropriate), and factor-level explanation.",
            color: "arka-cyan",
          },
        ].map((col, i) => (
          <motion.div
            key={col.title}
            variants={fadeInUp}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="arka-card rounded-xl border border-arka-primary/20 p-5 sm:p-6 hover:border-arka-cyan/30 hover:shadow-glow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-arka-cyan/15 text-arka-cyan">
                <col.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-arka-text-dark text-lg">{col.title}</h3>
            </div>
            <p className="text-sm sm:text-base text-arka-text-dark-muted">{col.body}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* FDA Non-Device CDS Criteria - 4 boxes */}
      <motion.h3
        className="text-xl font-heading font-semibold text-arka-text-dark mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        FDA Non-Device CDS Criteria
      </motion.h3>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
          hidden: {},
        }}
      >
        {[
          {
            icon: Database,
            title: "Data Input Criterion",
            body: "Clinical scenario and proposed imaging are the inputs; no hidden data drives the recommendation.",
          },
          {
            icon: BookOpen,
            title: "Medical Information Criterion",
            body: "Recommendations are based on medical information (evidence, guidelines, clinical factors) you provide.",
          },
          {
            icon: UserCheck,
            title: "HCP Recommendations Criterion",
            body: "Output is intended to support, not replace, healthcare professional decision-making.",
          },
          {
            icon: Search,
            title: "Independent Review Criterion",
            body: "Users can independently verify the basis (literature, factor weights, explanation) for each recommendation.",
          },
        ].map((box) => (
          <motion.div
            key={box.title}
            variants={fadeInUp}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="arka-card rounded-xl border border-arka-primary/20 p-4 sm:p-5 flex gap-3"
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

      {/* Info callout */}
      <motion.div
        className="arka-card rounded-xl border border-arka-cyan/30 bg-arka-cyan/5 p-4 sm:p-5 mb-8 flex gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.35 }}
      >
        <Info className="h-5 w-5 shrink-0 text-arka-cyan mt-0.5" aria-hidden />
        <p className="text-sm sm:text-base text-arka-text-dark-muted">
          AIIE uses a proprietary scoring methodology based on RAND/UCLA appropriateness methods and
          peer-reviewed literature. Every recommendation shows exactly <strong className="text-arka-text-dark">WHY</strong> it was made.
        </p>
      </motion.div>

      {/* AIIE Scoring Methodology - numbered 1-4 */}
      <motion.h3
        className="text-xl font-heading font-semibold text-arka-text-dark mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.4 }}
      >
        The AIIE Scoring Methodology
      </motion.h3>
      <motion.ol
        className="space-y-5"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.45 } },
          hidden: {},
        }}
      >
        {[
          {
            title: "Start with Baseline Score",
            body: 'Every evaluation starts at 5.0 (neutral). This represents "we don\'t know yet" — neither appropriate nor inappropriate until we assess the clinical factors.',
          },
          {
            title: "Apply Weighted Clinical Factors",
            body: "Each clinical factor (red flags, duration, age, prior workup) has an evidence-based weight derived from peer-reviewed literature. Factors either increase (+) or decrease (-) the appropriateness score. Example: Cancer history → +3.0 points (Deyo & Diehl, JAMA 1988)",
          },
          {
            title: "Calculate Final Score (1-9)",
            body: "All factor contributions sum to produce a final score, capped between 1 and 9. 7-9: Usually Appropriate (green). 4-6: May Be Appropriate (yellow). 1-3: Usually Not Appropriate (red).",
          },
          {
            title: "Show SHAP-Style Explanation",
            body: "Unlike black-box systems, AIIE shows exactly which factors contributed to the score and by how much. This satisfies FDA Non-Device CDS Criterion 4 (independent review).",
          },
        ].map((step, i) => (
          <motion.li
            key={step.title}
            variants={fadeInUp}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="arka-card rounded-xl border border-arka-primary/20 p-4 sm:p-5 flex gap-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-arka-teal text-white font-bold text-sm">
              {i + 1}
            </div>
            <div>
              <h4 className="font-semibold text-arka-text-dark mb-1">{step.title}</h4>
              <p className="text-sm text-arka-text-dark-muted">{step.body}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}
