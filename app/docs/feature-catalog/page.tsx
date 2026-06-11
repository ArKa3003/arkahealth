import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { DocsPageLayout } from '@/components/docs/DocsPageLayout';

import {
  FEATURE_CATALOG,
  type FeatureCatalogEntry,
  type WeightDirection,
} from '@/lib/cds-platform/ml/feature-catalog';
import type { AuthorityClass } from '@/lib/cds-platform/cds-hooks/medical-basis';
import { getCitation } from '@/lib/cds-platform/citations';

export const metadata: Metadata = {
  title: 'Feature Rationale Catalogue',
  description:
    'Clinician-facing rationale and citations for every ML feature used by ARKA-CLIN appropriateness scoring.',
};

const FEATURE_ENTRIES = Object.entries(FEATURE_CATALOG);

/**
 * Human-readable authority class label for catalogue badges.
 */
function formatAuthorityClass(authorityClass: AuthorityClass): string {
  const labels: Partial<Record<AuthorityClass, string>> = {
    guideline: 'Guideline',
    context_dependent: 'Context-dependent',
    uspstf: 'USPSTF',
    cms_lcd: 'CMS LCD',
    choosing_wisely: 'Choosing Wisely',
    specialty_society: 'Specialty society',
    systematic_review: 'Systematic review',
    rct: 'RCT',
    fda_labeling: 'FDA labeling',
  };
  return labels[authorityClass] ?? authorityClass.replace(/_/g, ' ');
}

/**
 * Weight-direction badge symbol for catalogue display.
 */
function weightDirectionSymbol(direction: WeightDirection): string {
  if (direction === 'increases_appropriateness') return '+';
  if (direction === 'decreases_appropriateness') return '−';
  return '◇';
}

function weightDirectionLabel(direction: WeightDirection): string {
  if (direction === 'increases_appropriateness') return 'Increases appropriateness';
  if (direction === 'decreases_appropriateness') return 'Decreases appropriateness';
  return 'Context-dependent';
}

/**
 * Renders the FDA Criterion 4 Feature Rationale Catalogue at `/docs/feature-catalog`.
 */
const CATALOG_TOC = FEATURE_ENTRIES.map(([featureName, entry]) => ({
  id: featureName,
  label: entry.label,
  level: 2,
}));

export default function FeatureCatalogPage() {
  return (
    <DocsPageLayout
      title="ARKA Feature Rationale Catalogue"
      description="Every machine-learning feature used by ARKA-CLIN appropriateness scoring — clinical rationale and published citations for FDA Criterion 4 independent review."
      toc={CATALOG_TOC}
    >
      <div className="space-y-12">
        {FEATURE_ENTRIES.map(([featureName, entry]) => (
          <FeatureSection key={featureName} featureName={featureName} entry={entry} />
        ))}
      </div>

      <p className="mt-12 text-center text-caption text-arka-slate-500">
        <Link href="/docs/regulatory-rationale">Regulatory rationale memo</Link>
        {' · '}
        <Link href="/docs/model-card">ML model card</Link>
        {' · '}
        <Link href="/trust">Trust center</Link>
      </p>
    </DocsPageLayout>
  );
}

interface FeatureSectionProps {
  featureName: string;
  entry: FeatureCatalogEntry;
}

function FeatureSection({ featureName, entry }: FeatureSectionProps) {
  const citation = getCitation(entry.citationId);
  const weightSymbol = weightDirectionSymbol(entry.weightDirection);

  return (
    <section
      id={featureName}
      className="snap-start scroll-mt-24 rounded-xl border border-arka-primary/10 bg-white p-6 shadow-sm"
      aria-labelledby={`heading-${featureName}`}
    >
        <h2
          id={`heading-${featureName}`}
          className="text-xl font-semibold text-slate-900"
        >
          {entry.label}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-arka-teal/40 bg-arka-teal/10 px-2.5 py-0.5 text-xs font-medium text-arka-teal">
            {formatAuthorityClass(entry.authorityClass)}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Source: {entry.sourceResource}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full border border-arka-primary/20 bg-arka-bg-light px-2.5 py-0.5 text-xs font-medium text-slate-700"
            title={weightDirectionLabel(entry.weightDirection)}
          >
            <span className="font-mono text-sm leading-none" aria-hidden>
              {weightSymbol}
            </span>
            {weightDirectionLabel(entry.weightDirection)}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-800">{entry.rationale}</p>

        <p className="mt-3 text-xs text-slate-500">
          Last clinical review: {entry.lastClinicalReviewISO}
        </p>

        <p className="mt-3">
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-arka-cyan hover:text-arka-teal hover:underline"
          >
            View underlying citation
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </p>

        <aside className="mt-4 rounded-lg border border-arka-cyan/20 bg-arka-cyan/5 p-4 text-sm leading-relaxed text-slate-700">
          <p className="font-medium text-slate-900">Why this contributes to the SHAP score</p>
          <p className="mt-1">
            The SHAP attribution shown on an ARKA CDS card for this feature is its contribution to
            that specific patient&apos;s predicted appropriateness score. Values are computed by the
            XGBoost model using SHAP (SHapley Additive exPlanations) against the training feature
            distribution—not a separate clinical rule.
          </p>
        </aside>
    </section>
  );
}
