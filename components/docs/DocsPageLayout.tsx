"use client";

import * as React from "react";
import Link from "next/link";

import type { DocHeading } from "@/lib/docs/extract-headings";
import { cn } from "@/lib/utils";

export type DocsPageLayoutProps = {
  title: string;
  description?: string;
  lastUpdated?: string;
  /** Pre-built TOC entries; when omitted, headings are collected from the article on mount. */
  toc?: DocHeading[];
  children: React.ReactNode;
  className?: string;
};

/**
 * Long-form docs shell — prose typography, sticky table of contents, scroll progress via layout bar.
 */
export function DocsPageLayout({
  title,
  description,
  lastUpdated,
  toc: tocProp,
  children,
  className,
}: DocsPageLayoutProps) {
  const articleRef = React.useRef<HTMLElement>(null);
  const [activeId, setActiveId] = React.useState<string>("");
  const [toc, setToc] = React.useState<DocHeading[]>(tocProp ?? []);

  React.useEffect(() => {
    if (tocProp?.length) {
      setToc(tocProp);
      return;
    }

    const article = articleRef.current;
    if (!article) return;

    const nodes = article.querySelectorAll<HTMLElement>("h2[id], h3[id]");
    const entries: DocHeading[] = [];
    nodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      const level = tag === "h3" ? 3 : 2;
      entries.push({
        id: node.id,
        label: node.textContent?.trim() ?? node.id,
        level,
      });
    });
    setToc(entries);
  }, [tocProp, children]);

  React.useEffect(() => {
    if (!toc.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id) setActiveId(id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  const tocNav =
    toc.length > 0 ? (
      <nav aria-label="Table of contents">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.12em] text-arka-teal-600">
          On this page
        </p>
        <ul className="space-y-1.5">
          {toc.map((item) => (
            <li key={item.id} className={item.level === 3 ? "pl-3" : undefined}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block text-sm leading-snug transition-colors",
                  activeId === item.id
                    ? "font-medium text-arka-teal-700"
                    : "text-arka-slate-600 hover:text-arka-slate-900",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    ) : null;

  return (
    <div className={cn("min-h-screen bg-surface", className)}>
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20 pt-12 sm:px-6 lg:px-8">
        {tocNav ? (
          <details className="mb-8 rounded-radius-lg border border-border-subtle bg-surface-sunken p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium text-arka-slate-800">
              Table of contents
            </summary>
            <div className="mt-3">{tocNav}</div>
          </details>
        ) : null}

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[240px_minmax(0,1fr)]">
          {tocNav ? (
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
                {tocNav}
                <div className="mt-8 border-t border-border-subtle pt-4">
                  <Link
                    href="/trust"
                    className="text-sm font-medium text-arka-teal-700 hover:text-arka-teal-600"
                  >
                    Trust center →
                  </Link>
                </div>
              </div>
            </aside>
          ) : null}

          <article ref={articleRef} className="docs-prose min-w-0 max-w-3xl">
            <header className="mb-10 border-b border-border-subtle pb-8">
              <h1 className="text-display text-arka-slate-900">{title}</h1>
              {description ? (
                <p className="mt-4 text-body-lg text-arka-slate-600">{description}</p>
              ) : null}
              {lastUpdated ? (
                <p className="mt-3 text-caption text-arka-slate-500">Last updated: {lastUpdated}</p>
              ) : null}
            </header>
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
