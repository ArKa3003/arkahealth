import type { Metadata } from "next";

import { ComplianceBar } from "@/components/shared/ComplianceBar";
import { EvidenceIndexClient } from "@/components/evidence/EvidenceIndexClient";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import { MATRIX_VERSION } from "@/lib/aiie/knowledge-matrix";
import { evidenceEntriesByRegion } from "@/lib/evidence/registry";

export const metadata: Metadata = {
  title: "AIIE Evidence Library",
  description:
    "The first-party evidence registry behind every ARKA Imaging Intelligence Engine recommendation — plain-language syntheses with citations to published guidelines and peer-reviewed literature, grouped by body region.",
  alternates: { canonical: "/evidence" },
};

/**
 * AIIE evidence index — searchable, grouped by body region. Every evidence
 * link emitted by CDS cards and phase UIs resolves into this library.
 */
export default function EvidenceIndexPage() {
  const groups = evidenceEntriesByRegion().map((group) => ({
    region: group.region,
    label: group.label,
    entries: group.entries.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
      lastReviewed: entry.lastReviewed,
    })),
  }));

  return (
    <div className="min-h-screen bg-surface">
      <ComplianceBar />

      <div className="mx-auto max-w-5xl px-4 py-12 pb-20 sm:px-6 lg:px-8">
        <header className="mb-10 border-b border-border-subtle pb-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-arka-teal-600">
            AIIE Evidence
          </p>
          <h1 className="mt-3 text-display text-arka-slate-900">Evidence library</h1>
          <p className="mt-4 max-w-2xl text-body-lg text-arka-slate-600">
            Every recommendation from the ARKA Imaging Intelligence Engine links here — a
            plain-language synthesis per clinical scenario, with the underlying society
            guidelines, USPSTF statements, and peer-reviewed literature cited beneath. Knowledge
            Matrix v{MATRIX_VERSION}.
          </p>
        </header>

        <EvidenceIndexClient groups={groups} />

        <div
          role="note"
          className="mt-14 rounded-radius-md border border-border-subtle bg-surface-sunken px-4 py-3 text-caption leading-relaxed text-arka-slate-600"
        >
          {FDA_NON_DEVICE_CDS_DISCLOSURE}
        </div>
      </div>
    </div>
  );
}
