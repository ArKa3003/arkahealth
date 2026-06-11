import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { ComplianceBar } from "@/components/shared/ComplianceBar";
import { evidenceEntriesByRegion } from "@/lib/evidence/registry";

export const metadata: Metadata = {
  title: "Evidence not found | AIIE Evidence",
};

/**
 * Designed not-found page for unknown evidence slugs — clinical card links must
 * never dead-end, so the full evidence index is offered as the recovery path.
 */
export default function EvidenceNotFound() {
  const groups = evidenceEntriesByRegion();

  return (
    <div className="min-h-screen bg-surface">
      <ComplianceBar />

      <div className="mx-auto max-w-3xl px-4 py-12 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-radius-lg border border-border-subtle bg-surface-sunken p-8 text-center">
          <SearchX className="mx-auto h-10 w-10 text-arka-teal-600" aria-hidden />
          <p className="mt-4 font-mono text-xs font-medium uppercase tracking-[0.12em] text-arka-teal-600">
            AIIE Evidence
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-arka-slate-900">
            That evidence page doesn&apos;t exist
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-arka-slate-600">
            The slug you followed isn&apos;t in the current AIIE evidence registry — it may have
            been renamed in a newer Knowledge Matrix release. Every active evidence topic is
            listed below.
          </p>
          <Link
            href="/evidence"
            className="mt-5 inline-flex items-center rounded-radius-md bg-arka-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-arka-teal-700"
          >
            Browse the evidence library
          </Link>
        </div>

        <div className="mt-12 space-y-10">
          {groups.map((group) => (
            <section key={group.region} aria-label={group.label}>
              <h2 className="border-b border-border-subtle pb-2 text-lg font-semibold text-arka-slate-900">
                {group.label}
              </h2>
              <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {group.entries.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/evidence/${entry.slug}`}
                      className="text-sm leading-snug text-arka-teal-700 underline decoration-arka-teal-700/30 underline-offset-2 hover:text-arka-teal-600 hover:decoration-arka-teal-600"
                    >
                      {entry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
