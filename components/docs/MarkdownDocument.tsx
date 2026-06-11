"use client";

import { markdownToHtml } from "@/lib/docs/markdown-to-html";
import { extractMarkdownHeadings } from "@/lib/docs/extract-headings";
import { DocsPageLayout } from "@/components/docs/DocsPageLayout";

export interface MarkdownDocumentProps {
  /** Raw Markdown source. */
  source: string;
  /** Accessible title for the article region. */
  title: string;
  description?: string;
  lastUpdated?: string;
}

/**
 * Renders in-repo Markdown as styled HTML for regulatory documentation pages.
 */
export function MarkdownDocument({ source, title, description, lastUpdated }: MarkdownDocumentProps) {
  const html = markdownToHtml(source);
  const toc = extractMarkdownHeadings(source);

  return (
    <DocsPageLayout title={title} description={description} lastUpdated={lastUpdated} toc={toc}>
      <div className="docs-markdown" dangerouslySetInnerHTML={{ __html: html }} />
    </DocsPageLayout>
  );
}
