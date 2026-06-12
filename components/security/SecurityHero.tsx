"use client";

import { Download, Mail } from "lucide-react";

import {
  CONTACTS,
  STATUS_PILLS,
  type FrameworkStatus,
} from "@/lib/security/compliance-data";
import { cn } from "@/lib/utils";

const PILL_STYLES: Record<
  FrameworkStatus,
  { pill: string; dot: string }
> = {
  "in-force": {
    pill: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  "in-progress": {
    pill: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
  roadmap: {
    pill: "border-slate-400/40 bg-slate-400/10 text-slate-300",
    dot: "bg-slate-400",
  },
};

/**
 * Full-bleed trust-center hero for /security — navy band, status pills, dual CTAs.
 */
export function SecurityHero() {
  return (
    <div className="relative overflow-hidden bg-arka-bg-dark pt-28 pb-20 md:pb-24">
      <div
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-arka-teal-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-arka-teal-300">
          TRUST CENTER · SECURITY & COMPLIANCE
        </p>

        <h1 className="mt-4 max-w-3xl text-4xl font-bold text-white md:text-5xl">
          Built for hospital security review.
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-arka-text-soft">
          ARKA ships with the controls, documentation, and evidence trail your CISO will ask
          about — adopted now, before our first byte of PHI, not retrofitted after.
          Synthetic-data demo. Encryption everywhere. A 21-document compliance package ready
          for diligence.
        </p>

        <ul
          aria-label="Compliance program status"
          className="mt-8 flex flex-wrap gap-3"
        >
          {STATUS_PILLS.map(({ label, status }) => {
            const styles = PILL_STYLES[status];
            return (
              <li key={label}>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium",
                    styles.pill,
                  )}
                >
                  <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 motion-reduce:animate-none",
                        styles.dot,
                      )}
                    />
                    <span className={cn("relative h-2 w-2 rounded-full", styles.dot)} />
                  </span>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href={CONTACTS.overviewPdf}
            download
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-arka-teal-500 px-6 py-3 font-semibold text-arka-slate-950 transition hover:bg-arka-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download Data Security Overview (PDF)
          </a>
          <a
            href={`mailto:${CONTACTS.security}?subject=ARKA security diligence package request`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-white transition hover:border-arka-teal-400 hover:text-arka-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Request diligence package
          </a>
        </div>

        <p className="mt-6 max-w-2xl text-sm text-arka-text-soft/70">
          We describe our posture exactly as it is: HIPAA program in force; SOC 2 and HITRUST
          e1 in progress on a published timeline. No certification claims before the
          certificate exists.
        </p>
      </div>
    </div>
  );
}
