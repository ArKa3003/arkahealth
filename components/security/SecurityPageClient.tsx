"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { CertificationTimeline } from "@/components/security/CertificationTimeline";
import { ControlPillars } from "@/components/security/ControlPillars";
import { DocumentLibrary } from "@/components/security/DocumentLibrary";
import { FrameworkCards } from "@/components/security/FrameworkCards";
import { SecurityFaq } from "@/components/security/SecurityFaq";
import { SecurityHero } from "@/components/security/SecurityHero";
import { CONTACTS, DEMO_LAST_VERIFIED } from "@/lib/security/compliance-data";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "frameworks", label: "Frameworks" },
  { id: "controls", label: "Controls" },
  { id: "timeline", label: "Timeline" },
  { id: "documents", label: "Documents" },
  { id: "demo-data", label: "Demo data" },
  { id: "faq", label: "FAQ" },
] as const;

/**
 * Security & Compliance marketing page with sticky in-page navigation.
 */
export function SecurityPageClient() {
  const [activeId, setActiveId] = React.useState<string>(SECTIONS[0].id);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id) setActiveId(id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleSectionClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    setActiveId(id);
  };

  return (
    <div className="bg-surface">
      <section id="hero" className="scroll-mt-24">
        <SecurityHero />
      </section>

      <nav
        aria-label="Page sections"
        className="sticky top-16 z-10 border-b border-arka-light bg-surface/95 backdrop-blur-sm"
      >
        <div className="mx-auto hidden max-w-7xl gap-8 px-4 sm:px-6 lg:flex lg:px-8">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(event) => handleSectionClick(event, id)}
              className={cn(
                "border-b-2 py-3 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                activeId === id
                  ? "border-arka-teal-600 text-arka-teal-600"
                  : "border-transparent text-arka-text-dark-muted hover:text-arka-teal-600",
              )}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <FrameworkCards />

      <ControlPillars />

      <CertificationTimeline />

      <DocumentLibrary />

      <section
        id="demo-data"
        className="scroll-mt-24 border-y border-arka-teal-200 bg-arka-teal-50 py-20"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <ShieldCheck className="mx-auto h-10 w-10 text-arka-teal-600" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold text-arka-text-dark">
            Zero PHI in the demo — by design, verified quarterly
          </h2>
          <p className="mt-3 text-arka-text-dark-muted">
            Every patient, scenario, and record in the ARKA demonstration environment is
            synthetic. Seed records carry an [ARKA-DEMO] marker, fixtures come from our
            synthetic-data generator, CI guards block production data sources from demo code
            paths, and the officer-signed attestation (ARKA-DEMO-001) is re-verified every
            quarter. If you spot anything that looks real, tell us:{" "}
            <a
              href={`mailto:${CONTACTS.security}`}
              className="font-medium text-arka-teal-800 underline underline-offset-4"
            >
              {CONTACTS.security}
            </a>{" "}
            — it isn&apos;t, but we treat reports as incidents anyway.
          </p>
          <p className="mt-4 font-mono text-xs text-arka-text-dark-soft">
            Last verification: {DEMO_LAST_VERIFIED}
          </p>
        </div>
      </section>

      <SecurityFaq />
    </div>
  );
}
