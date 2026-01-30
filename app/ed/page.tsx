"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, GraduationCap, Stethoscope, Shield } from "lucide-react";
import { EdDemoContent } from "@/components/demos/ed/EdDemoContent";
import { routes } from "@/lib/constants";
import { useState } from "react";

const QUICK_LINKS = [
  { href: routes.clin, label: "ARKA-CLIN", icon: Stethoscope },
  { href: routes.ins, label: "ARKA-INS", icon: Shield },
] as const;

export default function EdPage() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-arka-bg-dark"
    >
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-text-soft">
            <li>
              <Link
                href={routes.home}
                className="text-arka-text-soft hover:text-arka-cyan transition-colors"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-arka-text-soft/60" aria-hidden />
              <span className="text-arka-cyan">ARKA-ED</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-semibold text-arka-text">
            ARKA-ED: Educational Platform
          </h1>
          <p className="mt-2 text-arka-text-muted font-sans text-base sm:text-lg max-w-2xl">
            Case-based learning for imaging appropriateness. Practice with clinical vignettes,
            select imaging, and get evidence-based feedback aligned with ACR criteria.
          </p>
        </header>

        {/* Collapsible About ARKA-ED */}
        <section className="mb-6 sm:mb-8" aria-labelledby="about-arka-ed-heading">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            className="arka-card w-full flex items-center justify-between gap-4 rounded-xl border border-arka-primary/20 p-4 text-left transition-all hover:border-arka-cyan/30"
            aria-expanded={aboutOpen}
            aria-controls="about-arka-ed-panel"
            id="about-arka-ed-heading"
          >
            <span className="flex items-center gap-2 font-semibold text-arka-text">
              <GraduationCap className="h-5 w-5 text-arka-cyan" aria-hidden />
              About ARKA-ED
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-arka-text-soft transition-transform ${aboutOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          <motion.div
            id="about-arka-ed-panel"
            initial={false}
            animate={{ height: aboutOpen ? "auto" : 0, opacity: aboutOpen ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="arka-card mt-2 rounded-xl border border-arka-primary/20 p-4 sm:p-6 space-y-4 font-sans text-arka-text-muted">
              <div>
                <h3 className="font-semibold text-arka-text mb-1">Learning objectives</h3>
                <p className="text-sm sm:text-base">
                  ARKA-ED helps learners apply ACR Appropriateness Criteria to real clinical
                  scenarios. By the end of a case, you will have practiced selecting appropriate
                  imaging (or no imaging), understood the evidence behind the rating, and seen
                  how teaching points and clinical pearls support decision-making.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-arka-text mb-1">Target audience</h3>
                <p className="text-sm sm:text-base">
                  <strong className="text-arka-text">Students and residents</strong> in emergency
                  medicine, internal medicine, family medicine, surgery, and radiology—as well as
                  attendings who want to refresh imaging appropriateness—can use ARKA-ED in
                  learning or quiz mode to build and test their skills.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-arka-text mb-1">How insights inform ARKA-CLIN protocols</h3>
                <p className="text-sm sm:text-base">
                  The same evidence base and scoring logic that power ARKA-ED cases feed into{" "}
                  <strong className="text-arka-text">ARKA-CLIN</strong> clinical decision support.
                  What you learn here (e.g., when to order stress testing vs. CTA in chest pain)
                  aligns with the appropriateness scores and recommendations that clinicians see
                  at the point of order in ARKA-CLIN, keeping education and practice consistent.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Demo content (Case list → Case viewer) */}
        <EdDemoContent />

        {/* Cross-links to other demos */}
        <footer className="mt-12 sm:mt-16 pt-8 border-t border-arka-primary/20">
          <p className="text-sm font-medium text-arka-text-soft mb-3">
            Also explore:{" "}
            <Link href={routes.clin} className="text-arka-cyan hover:underline">
              ARKA-CLIN
            </Link>
            {" | "}
            <Link href={routes.ins} className="text-arka-cyan hover:underline">
              ARKA-INS
            </Link>
          </p>
          <ul className="flex flex-wrap gap-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 rounded-lg border border-arka-cyan/40 bg-arka-cyan/5 px-4 py-2.5 text-sm font-medium text-arka-cyan hover:bg-arka-cyan/10 hover:border-arka-cyan/60 transition-colors"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </motion.div>
  );
}
