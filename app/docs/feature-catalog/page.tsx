import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

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
export default function FeatureCatalogPage() {
  return (
    <div className="relative min-h-screen scroll-smooth bg-white">
      <article
        className="mx-auto max-w-3xl px-4 py-10 pb-20 pt-12"
        aria-label="ARKA Feature Rationale Catalogue"
      >
        <header className="border-b border-arka-primary/15 pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            ARKA Feature Rationale Catalogue
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            This page documents every machine-learning feature used by ARKA-CLIN appropriateness
            scoring: the clinical rationale for each feature&apos;s inclusion in the model, and the
            published or regulatory citation that supports it. Context-dependent features are
            documented here on ARKA; guideline-anchored features link to their external authority
            sources.
          </p>
        </header>

        <nav className="mt-8 rounded-lg border border-arka-primary/10 bg-arka-bg-light/60 p-4" aria-label="Table of contents">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-arka-teal">
            Table of contents
          </h2>
          <ol className="mt-3 columns-1 gap-x-6 text-sm sm:columns-2">
            {FEATURE_ENTRIES.map(([featureName, entry]) => (
              <li key={featureName} className="mb-1.5 break-inside-avoid">
                <a
                  href={`#${featureName}`}
                  className="text-arka-cyan underline-offset-2 hover:text-arka-teal hover:underline"
                >
                  {entry.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-12">
          {FEATURE_ENTRIES.map(([featureName, entry]) => (
            <FeatureSection key={featureName} featureName={featureName} entry={entry} />
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-slate-500">
          <Link href="/docs/regulatory-rationale" className="text-arka-cyan hover:underline">
            Regulatory rationale memo
          </Link>
          {' · '}
          <Link href="/docs/model-card" className="text-arka-cyan hover:underline">
            ML model card
          </Link>
        </p>
      </article>
    </div>
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
