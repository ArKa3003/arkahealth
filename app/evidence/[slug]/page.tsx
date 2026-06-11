import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ComplianceBar } from "@/components/shared/ComplianceBar";
import { Badge } from "@/components/ui/badge";
import { MATRIX_VERSION } from "@/lib/aiie/knowledge-matrix";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import {
  EVIDENCE_REGION_LABELS,
  EVIDENCE_REGISTRY,
  getEvidenceEntry,
  resolveEvidenceSlug,
} from "@/lib/evidence/registry";

interface EvidencePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-renders every canonical registry slug at build time.
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return Object.keys(EVIDENCE_REGISTRY).map((slug) => ({ slug }));
}

/**
 * SEO metadata from the registry entry.
 */
export async function generateMetadata({ params }: EvidencePageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonical = resolveEvidenceSlug(slug);
  const entry = canonical ? getEvidenceEntry(canonical) : null;
  if (!entry) {
    return { title: "AIIE Evidence" };
  }
  return {
    title: `${entry.title} | AIIE Evidence`,
    description: entry.summary,
    alternates: { canonical: `/evidence/${entry.slug}` },
    openGraph: {
      title: entry.title,
      description: entry.clinicalBottomLine,
      type: "article",
    },
  };
}

/**
 * AIIE Evidence detail page — the first-party landing target for every
 * evidence link emitted by CDS cards and phase UIs. Aliases redirect to the
 * canonical slug; unknown slugs render the designed not-found page.
 */
export default async function EvidenceDetailPage({ params }: EvidencePageProps) {
  const { slug } = await params;
  const canonical = resolveEvidenceSlug(slug);
  if (!canonical) notFound();
  if (canonical !== slug) redirect(`/evidence/${canonical}`);

  const entry = getEvidenceEntry(canonical);
  if (!entry) notFound();

  const related = entry.relatedSlugs
    .map((relatedSlug) => getEvidenceEntry(relatedSlug))
    .filter((relatedEntry): relatedEntry is NonNullable<typeof relatedEntry> => relatedEntry !== null);

  return (
    <div className="min-h-screen bg-surface">
      <ComplianceBar />

      <div className="mx-auto max-w-3xl px-4 py-12 pb-20 sm:px-6 lg:px-8">
        <Link
          href="/evidence"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-arka-teal-700 hover:text-arka-teal-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Evidence library
        </Link>

        <header className="mt-6 border-b border-border-subtle pb-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-arka-teal-600">
            AIIE Evidence
          </p>
          <h1 className="mt-3 text-display text-arka-slate-900">{entry.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{EVIDENCE_REGION_LABELS[entry.region]}</Badge>
            <Badge variant="info">Last reviewed {entry.lastReviewed}</Badge>
            <Badge variant="outline">Knowledge Matrix v{MATRIX_VERSION}</Badge>
          </div>
        </header>

        <section aria-labelledby="bottom-line-heading" className="mt-8">
          <div className="rounded-radius-lg border border-arka-teal-200 bg-arka-teal-50 p-5">
            <h2
              id="bottom-line-heading"
              className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-arka-teal-700"
            >
              Clinical bottom line
            </h2>
            <p className="mt-2 text-body-lg font-medium leading-relaxed text-arka-slate-900">
              {entry.clinicalBottomLine}
            </p>
          </div>
        </section>

        <section aria-labelledby="summary-heading" className="mt-10">
          <h2 id="summary-heading" className="text-xl font-semibold text-arka-slate-900">
            Summary
          </h2>
          <p className="mt-3 leading-relaxed text-arka-slate-700">{entry.summary}</p>
        </section>

        <section aria-labelledby="key-points-heading" className="mt-10">
          <h2 id="key-points-heading" className="text-xl font-semibold text-arka-slate-900">
            Key points
          </h2>
          <ul className="mt-4 space-y-3">
            {entry.keyPoints.map((point) => (
              <li key={point} className="flex gap-3 text-arka-slate-700">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-arka-teal-500"
                  aria-hidden
                />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="citations-heading" className="mt-10">
          <h2 id="citations-heading" className="text-xl font-semibold text-arka-slate-900">
            Citations
          </h2>
          <p className="mt-2 text-sm text-arka-slate-600">
            The AIIE synthesis above is ARKA-authored; the sources below are the underlying
            external literature.
          </p>
          <ol className="mt-4 space-y-4">
            {entry.citations.map((citation) => (
              <li
                key={citation.url}
                className="rounded-radius-md border border-border-subtle bg-surface-raised p-4"
              >
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-start gap-2 font-medium text-arka-teal-700 hover:text-arka-teal-600"
                >
                  <span className="leading-snug underline decoration-arka-teal-700/30 underline-offset-2 group-hover:decoration-arka-teal-600">
                    {citation.label}
                  </span>
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                </a>
                <p className="mt-1.5 text-sm text-arka-slate-600">
                  {citation.source} · {citation.year}
                  {citation.doi ? (
                    <span className="ml-2 font-mono text-xs text-arka-slate-500">
                      doi:{citation.doi}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {related.length > 0 ? (
          <section aria-labelledby="related-heading" className="mt-10">
            <h2 id="related-heading" className="text-xl font-semibold text-arka-slate-900">
              Related evidence
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {related.map((relatedEntry) => (
                <Link
                  key={relatedEntry.slug}
                  href={`/evidence/${relatedEntry.slug}`}
                  className="inline-flex items-center rounded-full border border-arka-teal-200 bg-arka-teal-50 px-3 py-1.5 text-sm font-medium text-arka-teal-700 transition-colors hover:border-arka-teal-400 hover:text-arka-teal-600"
                >
                  {relatedEntry.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div
          role="note"
          className="mt-12 rounded-radius-md border border-border-subtle bg-surface-sunken px-4 py-3 text-caption leading-relaxed text-arka-slate-600"
        >
          {FDA_NON_DEVICE_CDS_DISCLOSURE}
        </div>
      </div>
    </div>
  );
}
