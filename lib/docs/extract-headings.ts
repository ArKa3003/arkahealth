/**
 * Slugifies heading text for in-page anchor links.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export type DocHeading = {
  id: string;
  label: string;
  level: number;
};

/**
 * Extracts h2/h3 headings from raw Markdown for table-of-contents navigation.
 */
export function extractMarkdownHeadings(source: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;
    const level = match[1]!.length;
    const raw = match[2]!.replace(/\*\*/g, "").trim();
    headings.push({
      id: slugifyHeading(raw),
      label: raw,
      level,
    });
  }

  return headings;
}
