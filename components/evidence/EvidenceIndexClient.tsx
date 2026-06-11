"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

/** Serializable index row for one evidence entry. */
export interface EvidenceIndexItem {
  slug: string;
  title: string;
  summary: string;
  lastReviewed: string;
}

/** Serializable index group (body region). */
export interface EvidenceIndexGroup {
  region: string;
  label: string;
  entries: EvidenceIndexItem[];
}

export interface EvidenceIndexClientProps {
  groups: EvidenceIndexGroup[];
}

/**
 * Searchable AIIE evidence index grouped by body region. Filters on title,
 * summary, and slug as the user types.
 */
export function EvidenceIndexClient({ groups }: EvidenceIndexClientProps) {
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? groups
        .map((group) => ({
          ...group,
          entries: group.entries.filter(
            (entry) =>
              entry.title.toLowerCase().includes(q) ||
              entry.summary.toLowerCase().includes(q) ||
              entry.slug.includes(q) ||
              group.label.toLowerCase().includes(q),
          ),
        }))
        .filter((group) => group.entries.length > 0)
    : groups;

  const total = filtered.reduce((sum, group) => sum + group.entries.length, 0);

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-arka-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search evidence topics — e.g. headache, appendicitis, low back pain"
          aria-label="Search evidence topics"
          className="w-full rounded-radius-md border border-border-subtle bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-arka-slate-900 placeholder:text-arka-slate-400 focus:border-arka-teal-500 focus:outline-none focus:ring-2 focus:ring-arka-teal-500/30"
        />
      </div>
      <p className="mt-2 text-caption text-arka-slate-500" role="status">
        {total} topic{total === 1 ? "" : "s"}
        {q ? ` matching “${query.trim()}”` : " across the AIIE Knowledge Matrix"}
      </p>

      {total === 0 ? (
        <div className="mt-10 rounded-radius-lg border border-border-subtle bg-surface-sunken p-8 text-center">
          <p className="font-medium text-arka-slate-800">No topics match that search.</p>
          <p className="mt-1 text-sm text-arka-slate-600">
            Try a body region (e.g. &ldquo;chest&rdquo;) or a presentation (e.g. &ldquo;renal
            colic&rdquo;).
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {filtered.map((group) => (
            <section key={group.region} aria-label={group.label}>
              <h2 className="border-b border-border-subtle pb-2 text-lg font-semibold text-arka-slate-900">
                {group.label}
                <span className="ml-2 align-middle font-mono text-xs font-normal text-arka-slate-500">
                  {group.entries.length}
                </span>
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.entries.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/evidence/${entry.slug}`}
                      className="block h-full rounded-radius-md border border-border-subtle bg-surface-raised p-4 transition-colors hover:border-arka-teal-400"
                    >
                      <span className="block text-sm font-semibold leading-snug text-arka-slate-900">
                        {entry.title}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-caption leading-relaxed text-arka-slate-600">
                        {entry.summary}
                      </span>
                      <span className="mt-2 block font-mono text-[10px] uppercase tracking-wide text-arka-slate-400">
                        Reviewed {entry.lastReviewed}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
