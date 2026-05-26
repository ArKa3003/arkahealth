import type { Metadata } from 'next';

import { MarkdownDocument } from '@/components/docs/MarkdownDocument';
import { readRepoMarkdown } from '@/lib/docs/read-doc';

export const metadata: Metadata = {
  title: 'Model Card',
  description:
    'ARKA Imaging Appropriateness XGBoost model card — intended use, training data, metrics, and limitations.',
};

/**
 * Renders `ml-service/MODEL_CARD.md` at `/docs/model-card`.
 */
export default async function ModelCardPage() {
  const source = await readRepoMarkdown('ml-service/MODEL_CARD.md');

  return <MarkdownDocument source={source} title="ARKA ML model card" />;
}
