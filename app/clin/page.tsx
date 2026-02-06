"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Stethoscope, GraduationCap, Shield } from "lucide-react";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";
import { routes } from "@/lib/constants";
import { useState } from "react";

const ClinDemoContent = dynamic(
  () => import("@/components/demos/clin/ClinDemoContent").then((m) => m.ClinDemoContent),
  { loading: () => <DemoLoadingSkeleton /> }
);

const HowArkaWorksSection = dynamic(
  () => import("@/components/demos/clin/HowArkaWorksSection").then((m) => m.HowArkaWorksSection),
  { ssr: true }
);

const QUICK_LINKS = [
  { href: routes.ed, label: "ARKA-ED", icon: GraduationCap },
  { href: routes.ins, label: "ARKA-INS", icon: Shield },
] as const;

export default function ClinPage() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-arka-bg-light"
    >
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-text-dark-muted">
            <li>
              <Link
                href={routes.home}
                className="text-arka-text-dark-muted hover:text-arka-teal transition-colors"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-arka-text-dark-soft" aria-hidden />
              <span className="text-arka-teal">ARKA-CLIN</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-semibold text-arka-text-dark">
            ARKA-CLIN: Clinical Decision Support
          </h1>
          <p className="mt-2 text-arka-text-dark-muted font-sans text-base sm:text-lg max-w-2xl">
            Evidence-based imaging appropriateness evaluation powered by the ARKA Imaging Intelligence Engine (AIIE).
          </p>
        </header>

        {/* Collapsible About ARKA-CLIN */}
        <section className="mb-6 sm:mb-8" aria-labelledby="about-arka-clin-heading">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            className="arka-card w-full flex min-h-[44px] items-center justify-between gap-4 rounded-xl border border-arka-primary/20 p-4 text-left transition-all hover:border-arka-cyan/30 touch-manipulation"
            aria-expanded={aboutOpen}
            aria-controls="about-arka-clin-panel"
            id="about-arka-clin-heading"
          >
            <span className="flex items-center gap-2 font-semibold text-arka-text-dark">
              <Stethoscope className="h-5 w-5 text-arka-teal" aria-hidden />
              About ARKA-CLIN
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-arka-text-dark-muted transition-transform ${aboutOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          <motion.div
            id="about-arka-clin-panel"
            initial={false}
            animate={{ height: aboutOpen ? "auto" : 0, opacity: aboutOpen ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="arka-card mt-2 rounded-xl border border-arka-light p-4 sm:p-6 space-y-4 font-sans text-arka-text-dark-muted">
              <div>
                <h3 className="font-semibold text-arka-text-dark mb-1">What it does</h3>
                <p className="text-sm sm:text-base">
                  ARKA-CLIN provides real-time clinical decision support for imaging appropriateness. 
                  Enter a clinical scenario or choose a demo case to receive an evidence-based appropriateness 
                  score (1–9), transparent factor breakdown (SHAP-style), alternatives, and links to peer-reviewed evidence.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-arka-text-dark mb-1">Who it&apos;s for</h3>
                <p className="text-sm sm:text-base">
                  Ordering physicians, radiologists, and healthcare organizations who want to align 
                  imaging orders with guidelines (e.g., ACR, RAND/UCLA) and reduce unnecessary imaging 
                  while supporting appropriate studies.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-arka-text-dark mb-1">How it fits in the ecosystem</h3>
                <p className="text-sm sm:text-base">
                  ARKA-CLIN is the core CDS module in the ARKA suite. It feeds into <strong className="text-arka-text-dark">ARKA-ED</strong> (emergency 
                  department workflow) and <strong className="text-arka-text-dark">ARKA-INS</strong> (prior auth and payer alignment). 
                  Together they support ordering, workflow, and reimbursement with one evidence base.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Demo content (Evaluate → Results) */}
        <ClinDemoContent />

        {/* How ARKA Works */}
        <HowArkaWorksSection />

        {/* Quick links to other demos */}
        <footer className="mt-12 sm:mt-16 pt-8 border-t border-arka-primary/20">
          <p className="text-sm font-medium text-arka-text-dark-muted mb-3">
            Also explore:{" "}
            <Link href={routes.ed} className="text-arka-teal hover:underline">
              ARKA-ED
            </Link>
            {" | "}
            <Link href={routes.ins} className="text-arka-teal hover:underline">
              ARKA-INS
            </Link>
          </p>
          <ul className="flex flex-wrap gap-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 rounded-lg border border-arka-teal/40 bg-arka-teal/5 px-4 py-2.5 text-sm font-medium text-arka-teal hover:bg-arka-teal/10 hover:border-arka-teal/60 transition-colors"
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
