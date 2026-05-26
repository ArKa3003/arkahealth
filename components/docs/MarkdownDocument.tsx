'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { markdownToHtml } from '@/lib/docs/markdown-to-html';

export interface MarkdownDocumentProps {
  /** Raw Markdown source. */
  source: string;
  /** Accessible title for the article region. */
  title: string;
}

/**
 * Renders in-repo Markdown as styled HTML for regulatory documentation pages.
 */
export function MarkdownDocument({ source, title }: MarkdownDocumentProps) {
  const router = useRouter();
  const html = markdownToHtml(source);

  return (
    <div className="relative min-h-screen bg-white">
      {/* Close button */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-md transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2"
        aria-label="Close document and go back"
      >
        <X className="h-5 w-5" />
      </button>

      <article
        className="mx-auto max-w-3xl px-4 py-10 pb-16 pt-16"
        aria-label={title}
      >
        {/* Force light mode text colors with explicit overrides */}
        <div
          className="docs-markdown max-w-none [&_h1]:text-slate-900 [&_h2]:text-slate-900 [&_h3]:text-slate-900 [&_h4]:text-slate-900 [&_h5]:text-slate-900 [&_h6]:text-slate-900 [&_p]:text-slate-800 [&_li]:text-slate-800 [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_pre]:bg-slate-50 [&_pre]:border-slate-200 [&_a]:text-blue-700 [&_strong]:text-slate-900"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
