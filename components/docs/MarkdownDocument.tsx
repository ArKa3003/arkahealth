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
  const html = markdownToHtml(source);

  return (
    <article
      className="mx-auto max-w-3xl px-4 py-10 pb-16"
      aria-label={title}
    >
      <div
        className="docs-markdown max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
