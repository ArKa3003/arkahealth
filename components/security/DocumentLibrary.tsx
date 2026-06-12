"use client";

import { Download, FileText } from "lucide-react";

import { CONTACTS, DOCUMENT_LIBRARY } from "@/lib/security/compliance-data";

const SECURITY_PACKAGE_MAILTO = `mailto:${CONTACTS.security}?subject=${encodeURIComponent("ARKA security diligence package request")}`;

/**
 * Controlled document library and diligence request CTA for /security.
 */
export function DocumentLibrary() {
  return (
    <section id="documents" className="scroll-mt-24 bg-surface py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-bold text-arka-text-dark">
            The documentation, itemized
          </h2>
          <p className="mt-3 text-arka-text-dark-muted">
            Hospital security questionnaires go faster when the answers are already written
            down. Every document below is version-controlled, officer-approved, and available
            under NDA.
          </p>
        </header>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-arka-teal-200 bg-arka-teal-50 p-5">
            <h3 className="font-semibold text-arka-text-dark">Data Security Overview (PDF)</h3>
            <p className="mt-1 text-sm text-arka-text-dark-muted">
              One-page summary — no NDA needed.
            </p>
            <a
              href={CONTACTS.overviewPdf}
              download
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-arka-teal-500 px-4 py-2 text-sm font-semibold text-arka-slate-950 transition hover:bg-arka-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download
            </a>
          </article>

          <article className="rounded-2xl border border-border-subtle bg-arka-bg-alt p-5">
            <h3 className="font-semibold text-arka-text-dark">
              Compliance &amp; Regulatory Dossier (PDF)
            </h3>
            <p className="mt-1 text-sm text-arka-text-dark-muted">
              FDA posture, regulatory timeline, and program overview.
            </p>
            <a
              href="/ARKA-Compliance-Dossier.pdf"
              download
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-arka-text-dark transition hover:bg-arka-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Download
            </a>
          </article>
        </div>

        <div className="mt-10">
          {DOCUMENT_LIBRARY.map(({ series, items }) => (
            <div
              key={series}
              className="mb-4 overflow-hidden rounded-2xl border border-border-subtle"
            >
              <div className="flex items-center justify-between bg-arka-bg-alt px-5 py-3">
                <h3 className="font-semibold text-arka-text-dark">{series}</h3>
                <span className="rounded-full border border-border-subtle bg-white px-2 py-0.5 text-xs text-arka-text-dark-muted">
                  {items.length}
                </span>
              </div>
              <ul className="divide-y divide-border-subtle">
                {items.map(({ no, title }) => (
                  <li key={no} className="flex items-baseline gap-4 px-5 py-2.5">
                    <span className="w-32 shrink-0 font-mono text-xs text-arka-teal-700">
                      {no}
                    </span>
                    <span className="text-sm text-arka-text-dark">{title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-arka-bg-dark p-8 md:flex md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">
              Running vendor security review?
            </p>
            <p className="mt-1 text-sm text-arka-text-soft">
              Request the full package and a completed security questionnaire seed. Typical
              turnaround: 2 business days.
            </p>
          </div>
          <a
            href={SECURITY_PACKAGE_MAILTO}
            className="mt-4 inline-flex shrink-0 rounded-lg bg-arka-teal-500 px-6 py-3 font-semibold text-arka-slate-950 transition hover:bg-arka-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark md:mt-0"
          >
            Request full package
          </a>
        </div>
      </div>
    </section>
  );
}
