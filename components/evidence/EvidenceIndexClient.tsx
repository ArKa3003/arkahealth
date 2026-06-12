"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FileSearch, Search } from "lucide-react";

import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  totalTopics: number;
}

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

function regionAnchorId(region: string): string {
  return `region-${region}`;
}

type EvidenceSectionProps = {
  group: EvidenceIndexGroup;
  sectionIndex: number;
};

function EvidenceSection({ group, sectionIndex }: EvidenceSectionProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();
  const delay = prefersReducedMotion ? 0 : sectionIndex * 0.08;

  return (
    <motion.section
      ref={ref}
      id={regionAnchorId(group.region)}
      aria-labelledby={`${regionAnchorId(group.region)}-heading`}
      initial={prefersReducedMotion ? false : fadeIn.initial}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...fadeIn.transition, delay }}
      className="scroll-mt-32"
    >
      <h2
        id={`${regionAnchorId(group.region)}-heading`}
        className="border-b border-border-subtle pb-2 text-lg font-semibold text-arka-slate-900"
      >
        <a
          href={`#${regionAnchorId(group.region)}`}
          className="group inline-flex items-baseline gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
        >
          {group.label}
          <span className="align-middle font-mono text-xs font-normal text-arka-slate-500">
            {group.entries.length}
          </span>
        </a>
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {group.entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`${routes.evidence}/${entry.slug}`}
              className={cn(
                "block h-full rounded-radius-md border border-border-subtle bg-surface-raised p-4",
                "transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none",
                "hover:-translate-y-0.5 hover:border-arka-teal-400 hover:shadow-elevation-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
              )}
            >
              <span className="block text-sm font-semibold leading-snug text-arka-slate-900">
                {entry.title}
              </span>
              <span className="mt-1.5 line-clamp-2 block text-caption leading-relaxed text-arka-slate-600">
                {entry.summary}
              </span>
              <span className="mt-2 block font-mono text-xs uppercase tracking-wide text-arka-slate-500">
                Reviewed {entry.lastReviewed}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

/**
 * Searchable AIIE evidence index grouped by body region. Filters on title,
 * summary, and slug as the user types.
 */
export function EvidenceIndexClient({ groups, totalTopics }: EvidenceIndexClientProps) {
  const [query, setQuery] = React.useState("");
  const [activeSection, setActiveSection] = React.useState("");
  const prefersReducedMotion = useReducedMotion();

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

  const visibleCount = filtered.reduce((sum, group) => sum + group.entries.length, 0);
  const showToc = !q && filtered.length > 0;

  React.useEffect(() => {
    if (!showToc) return;

    const sectionIds = filtered.map((group) => regionAnchorId(group.region));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id) setActiveSection(id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filtered, showToc]);

  const handleTocClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    setActiveSection(id);
  };

  const tocNav = showToc ? (
    <nav aria-label="On this page">
      <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.12em] text-arka-teal-600">
        On this page
      </p>
      <ul className="space-y-1.5">
        {filtered.map((group) => {
          const id = regionAnchorId(group.region);
          return (
            <li key={group.region}>
              <a
                href={`#${id}`}
                onClick={(event) => handleTocClick(event, id)}
                className={cn(
                  "block text-sm leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                  activeSection === id
                    ? "font-medium text-arka-teal-700"
                    : "text-arka-slate-600 hover:text-arka-slate-900",
                )}
              >
                {group.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  ) : null;

  return (
    <div className="xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-12">
      {tocNav ? (
        <>
          <details className="mb-6 rounded-radius-lg border border-border-subtle bg-surface-sunken p-4 xl:hidden">
            <summary className="cursor-pointer text-sm font-medium text-arka-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500">
              On this page
            </summary>
            <div className="mt-3">{tocNav}</div>
          </details>
          <aside className="hidden xl:block">
            <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
              {tocNav}
            </div>
          </aside>
        </>
      ) : null}

      <div className="min-w-0">
        <div className="sticky top-16 z-10 -mx-4 border-b border-border-subtle bg-surface/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
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
              aria-describedby="evidence-search-status"
              className="w-full rounded-radius-md border border-border-subtle bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-arka-slate-900 placeholder:text-arka-slate-400 focus:border-arka-teal-500 focus:outline-none focus:ring-2 focus:ring-arka-teal-500/30"
            />
          </div>
          <p
            id="evidence-search-status"
            className="mt-2 text-caption text-arka-slate-500"
            aria-live="polite"
            aria-atomic="true"
          >
            {visibleCount} topic{visibleCount === 1 ? "" : "s"}
            {q ? ` matching “${query.trim()}”` : ` of ${totalTopics} across the AIIE Knowledge Matrix`}
          </p>

          <Link
            href={routes.featureCatalog}
            className="mt-4 flex min-h-[44px] touch-manipulation items-center gap-3 rounded-radius-md border border-border-subtle bg-surface-sunken px-4 py-3 text-sm text-arka-slate-700 transition-colors hover:border-arka-teal-300 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
          >
            <FileSearch className="h-4 w-4 shrink-0 text-arka-teal-600" aria-hidden />
            <span>
              Looking for the ML feature documentation behind ARKA-CLIN scoring?{" "}
              <span className="font-medium text-arka-teal-700">Feature Rationale Catalogue →</span>
            </span>
          </Link>

          <p className="mt-3 text-caption">
            <Link
              href={routes.security}
              className="text-arka-slate-500 transition-colors hover:text-arka-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
            >
              Security &amp; Compliance →
            </Link>
          </p>
        </div>

        {visibleCount === 0 ? (
          <div className="mt-10 rounded-radius-lg border border-border-subtle bg-surface-sunken p-8 text-center">
            <p className="font-medium text-arka-slate-800">No topics match that search.</p>
            <p className="mt-1 text-sm text-arka-slate-600">
              Try a body region (e.g. &ldquo;chest&rdquo;) or a presentation (e.g. &ldquo;renal
              colic&rdquo;).
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {filtered.map((group, index) => (
              <EvidenceSection key={group.region} group={group} sectionIndex={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
