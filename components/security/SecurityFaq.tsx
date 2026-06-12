"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { FAQ } from "@/lib/security/compliance-data";
import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Security diligence FAQ accordion for /security.
 */
export function SecurityFaq() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-24 bg-arka-bg-light py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-bold text-arka-text-dark">Straight answers</h2>
          <p className="mt-3 text-arka-text-dark-muted">
            The questions clinicians, CISOs, and investors actually ask — answered the way we
            answer them in diligence.
          </p>
        </header>

        <div className="mt-10 max-w-3xl">
          {FAQ.map(({ q, a }, index) => {
            const isOpen = openIndex === index;
            const buttonId = `security-faq-${index}`;
            const panelId = `security-faq-panel-${index}`;

            return (
              <div
                key={q}
                className="mb-3 overflow-hidden rounded-xl border border-border-subtle bg-white"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left font-medium text-arka-text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arka-teal-500"
                >
                  {q}
                  <ChevronDown
                    className={cn(
                      "ml-4 h-4 w-4 shrink-0 text-arka-text-dark-muted transition-transform duration-200 motion-reduce:transition-none",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen && !prefersReducedMotion}
                  className={cn(
                    "overflow-hidden px-5",
                    prefersReducedMotion
                      ? isOpen
                        ? "pb-4"
                        : "hidden"
                      : cn(
                          "transition-[max-height,opacity] duration-200 motion-reduce:transition-none",
                          isOpen ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0",
                        ),
                  )}
                >
                  <p className="text-sm leading-relaxed text-arka-text-dark-muted">{a}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 max-w-3xl text-sm text-arka-text-dark-muted">
          Looking for our FDA regulatory posture (Non-Device CDS analysis, Pre-Sub package)?
          That lives in the{" "}
          <Link
            href={routes.trust}
            className="font-medium text-arka-teal-800 underline underline-offset-4"
          >
            Trust Center
          </Link>{" "}
          →
        </p>
      </div>
    </section>
  );
}
