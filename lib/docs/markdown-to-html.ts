/**
 * Minimal Markdown → HTML for in-repo regulatory docs (headings, lists, links, code, emphasis).
 * Used by `/docs/*` server pages; not a general-purpose Markdown implementation.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-800 underline hover:text-blue-900">$1</a>');
  return out;
}

/**
 * Converts a subset of Markdown to HTML safe for {@link dangerouslySetInnerHTML}.
 *
 * @param source - Raw Markdown file contents.
 */
export function markdownToHtml(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (line.startsWith('```')) {
      const fence = line.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]?.startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i += 1;
      }
      i += 1;
      const langClass = fence ? ` class="language-${escapeHtml(fence)}"` : '';
      html.push(
        `<pre class="my-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900"><code${langClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`,
      );
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const tag = `h${Math.min(level, 6)}`;
      const sizes: Record<number, string> = {
        1: 'text-3xl font-bold mt-10 mb-4',
        2: 'text-2xl font-semibold mt-8 mb-3',
        3: 'text-xl font-semibold mt-6 mb-2',
        4: 'text-lg font-medium mt-4 mb-2',
        5: 'text-base font-medium mt-3 mb-1',
        6: 'text-sm font-medium mt-2 mb-1',
      };
      const content = line.replace(/^#+\s*/, '');
      html.push(
        `<${tag} class="${sizes[level] ?? sizes[2]} text-slate-900 dark:text-slate-100">${inlineMarkdown(content)}</${tag}>`,
      );
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      html.push('<hr class="my-8 border-slate-200 dark:border-slate-700" />');
      i += 1;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^[-*]\s+/, ''));
        i += 1;
      }
      html.push(
        `<ul class="my-4 list-disc space-y-2 pl-6 text-slate-800 dark:text-slate-200">${items
          .map((item) => `<li>${inlineMarkdown(item)}</li>`)
          .join('')}</ul>`,
      );
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? '';
      if (
        current.trim() === '' ||
        current.startsWith('```') ||
        /^#{1,6}\s/.test(current) ||
        /^[-*]\s/.test(current) ||
        /^---+$/.test(current.trim())
      ) {
        break;
      }
      paraLines.push(current);
      i += 1;
    }
    html.push(
      `<p class="my-3 leading-relaxed text-slate-800 dark:text-slate-200">${inlineMarkdown(paraLines.join(' '))}</p>`,
    );
  }

  return html.join('\n');
}
