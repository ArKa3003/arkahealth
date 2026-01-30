"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, Shield, Stethoscope, GraduationCap } from "lucide-react";
import { routes } from "@/lib/constants";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";
import { cn } from "@/lib/utils";

const InsDemoView = dynamic(
  () => import("@/components/demos/ins/InsDemoView").then((m) => m.InsDemoView),
  { loading: () => <DemoLoadingSkeleton /> }
);

const CROSS_LINKS = [
  { href: routes.clin, label: "ARKA-CLIN", icon: Stethoscope },
  { href: routes.ed, label: "ARKA-ED", icon: GraduationCap },
] as const;

export default function InsPage() {
  const [aboutOpen, setAboutOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-arka-bg-dark"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-text-soft">
            <li>
              <Link href={routes.home} className="text-arka-text-soft hover:text-arka-cyan transition-colors">Home</Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-arka-text-soft/60" aria-hidden />
              <span className="text-arka-deep font-medium">ARKA-INS</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-semibold text-arka-text">
            ARKA-INS: Utilization Management
          </h1>
          <p className="mt-2 text-arka-text-muted font-sans text-base sm:text-lg max-w-2xl">
            Insurance prior authorization and imaging appropriateness. Run through the RBM workflow with patient selection,
            order entry, pre-submission analysis, denial risk prediction, documentation assistance, and appeal generation.
          </p>
        </header>

        {/* Cross-links */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-arka-text-soft">Other demos:</span>
          {CROSS_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-lg border border-arka-deep/30 bg-arka-deep/5 px-3 py-2 text-arka-cyan transition hover:border-arka-deep hover:bg-arka-deep/10"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* About ARKA-INS panel */}
        <section className="mb-6 sm:mb-8" aria-labelledby="about-arka-ins-heading">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            className="arka-card w-full flex min-h-[44px] items-center justify-between gap-4 rounded-xl border border-arka-deep/20 p-4 text-left transition-all hover:border-arka-deep/40 touch-manipulation"
            aria-expanded={aboutOpen}
            aria-controls="about-arka-ins-panel"
            id="about-arka-ins-heading"
          >
            <span className="flex items-center gap-2 font-semibold text-arka-text">
              <Shield className="h-5 w-5 text-arka-deep" aria-hidden />
              About ARKA-INS
            </span>
            <ChevronDown className={cn("h-5 w-5 shrink-0 text-arka-text-soft transition-transform", aboutOpen && "rotate-180")} aria-hidden />
          </button>
          <motion.div
            id="about-arka-ins-panel"
            initial={false}
            animate={{ height: aboutOpen ? "auto" : 0, opacity: aboutOpen ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="arka-card mt-2 rounded-xl border border-arka-deep/20 p-4 sm:p-6 space-y-4 text-arka-text-muted text-sm">
              <p>
                <strong className="text-arka-text">RBM workflow benefits.</strong> ARKA-INS guides prior authorization through evidence-based RBM (Radiology Benefit Management) criteria. 
                You get pre-submission analysis, documentation gap identification, and criteria mapping so submissions are complete before they reach the payer.
              </p>
              <p>
                <strong className="text-arka-text">Prior authorization assistance.</strong> The demo includes denial risk prediction, AI-generated clinical justification, 
                and appeal letter generation. For high-risk cases you see mitigation steps; for denied cases you can generate a structured appeal with cited guidelines.
              </p>
              <p>
                <strong className="text-arka-text">Connection to clinical and educational insights.</strong> ARKA-INS aligns with ARKA-CLIN (imaging appropriateness) and ARKA-ED (education). 
                Appropriate ordering and strong documentation improve approval rates; learning from denial patterns and criteria strengthens future submissions.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Demo content (lazy-loaded) */}
        <InsDemoView />
      </div>
    </motion.div>
  );
}
