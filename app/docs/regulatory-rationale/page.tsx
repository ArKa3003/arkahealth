import type { Metadata } from 'next';

import { MarkdownDocument } from '@/components/docs/MarkdownDocument';
import { readRepoMarkdown } from '@/lib/docs/read-doc';

export const metadata: Metadata = {
  title: 'Regulatory Rationale',
  description:
    'ARKA Non-Device Clinical Decision Support regulatory rationale memo (FD&C Act §520(o)(1)(E)).',
};

/**
 * Renders `docs/REGULATORY_RATIONALE_MEMO.md` at `/docs/regulatory-rationale`.
 */
export default async function RegulatoryRationalePage() {
  const source = await readRepoMarkdown('docs/REGULATORY_RATIONALE_MEMO.md');

  return <MarkdownDocument source={source} title="ARKA regulatory rationale memo" />;
}
