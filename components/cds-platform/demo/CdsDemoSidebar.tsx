'use client';

/**
 * @file CdsDemoSidebar.tsx
 * @description FDA citation-first CDS sidebar for the live demo (primary basis before ML refinement).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import { STANDARD_OVERRIDE_REASONS } from '@/lib/cds-platform/alerting/override-reasons';
import type { OverrideOption } from '@/lib/cds-platform/alerting/types';
import { OverrideDialog } from '@/components/cds-platform/sidebar/OverrideDialog';
import { ReviewAlternativePanel } from './ReviewAlternativePanel';
import { ShapFactorsBlock } from './ShapFactorsBlock';
import type { ShapRowWithRationale } from './demo-response';
import { routes } from '@/lib/constants';
import type { DemoScenario } from './scenarios';

const OVERRIDE_OPTIONS: OverrideOption[] = STANDARD_OVERRIDE_REASONS.map((r) => ({
  code: r.id,
  display: r.label,
  requiresDocumentation: r.id === 'other',
  documentationPrompt: r.id === 'other' ? 'Briefly describe the clinical context (optional for QI).' : undefined,
}));

export interface CdsDemoSidebarProps {
  scenario: DemoScenario;
  medicalBasis: MedicalBasis;
  prediction: MLPrediction;
  shapRows: ShapRowWithRationale[];
  loading?: boolean;
  emptyCards?: boolean;
  onReviewAlternative: () => void;
  onOverride: () => void;
  showReviewPanel: boolean;
  onCloseReviewPanel: () => void;
  onOpenAlternativeInChart: () => void;
  overrideDialogOpen: boolean;
  onOverrideDialogClose: () => void;
  onOverrideSubmit: (payload: { code: string; documentation?: string }) => void;
  /** Active CDS hook driving the sidebar (order-select vs order-sign). */
  activeHook?: 'order-select' | 'order-sign';
  signPending?: boolean;
  onSignAnywayWithReason?: () => void;
}

/**
 * Citation-first ARKA sidebar (primary basis → patient-specific refinement → actions).
 */
export function CdsDemoSidebar({
  scenario,
  medicalBasis,
  prediction,
  shapRows,
  loading = false,
  emptyCards = false,
  onReviewAlternative,
  onOverride,
  showReviewPanel,
  onCloseReviewPanel,
  onOpenAlternativeInChart,
  overrideDialogOpen,
  onOverrideDialogClose,
  onOverrideSubmit,
  activeHook = 'order-select',
  signPending = false,
  onSignAnywayWithReason,
}: CdsDemoSidebarProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const alt = scenario.alternativeWithBasis;
  const guidelineShort = medicalBasis.label.split('—')[0]?.trim() ?? medicalBasis.label;

  const asideClass =
    'flex min-w-0 w-full flex-col rounded-xl border border-slate-200 !bg-white text-slate-900 shadow-sm md:rounded-none md:rounded-r-xl md:border-0 md:shadow-none';

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.aside
          key="loading"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 10, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`${asideClass} items-center justify-center p-6`}
          aria-live="polite"
          aria-busy="true"
          aria-label="ARKA CDS recommendations loading"
        >
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          <p className="mt-2 text-sm text-slate-600">Evaluating order…</p>
        </motion.aside>
      ) : (
        <motion.aside
          key="content"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 10, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={asideClass}
          aria-live="polite"
          aria-label="ARKA CDS recommendations"
        >
      <header className="shrink-0 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          ARKA Sidebar
        </p>
        <p className="mt-0.5 text-xs text-slate-600">CDS Hooks · {activeHook}</p>
      </header>

      {overrideDialogOpen ? (
        <div className="flex flex-col p-3">
          <OverrideDialog
            options={OVERRIDE_OPTIONS}
            onSubmit={onOverrideSubmit}
            onGoBack={onOverrideDialogClose}
            alertTitle="CDS recommendation"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          {emptyCards ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              No guideline-anchored concerns for this order
            </p>
          ) : (
            <>
              <section aria-labelledby="primary-basis-heading">
                <h2 id="primary-basis-heading" className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Primary basis
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-900">{medicalBasis.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {medicalBasis.rationale}
                </p>
                <a
                  href={medicalBasis.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-700 underline-offset-2 hover:text-teal-900 hover:underline"
                >
                  View citation
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </section>

              <hr className="border-slate-200" />

              <section aria-labelledby="refinement-heading">
                <h2 id="refinement-heading" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Patient-specific refinement
                </h2>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  ARKA risk: {score}/9
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">Top factors (SHAP)</p>
                <ShapFactorsBlock rows={shapRows} />
              </section>

              <div className="flex flex-col gap-2">
                {alt && !showReviewPanel && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full border-slate-300 bg-white text-left text-sm text-slate-800 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={onReviewAlternative}
                    aria-label={`Review alternative imaging consistent with ${guidelineShort}`}
                  >
                    Review alternative imaging consistent with {guidelineShort}.
                  </Button>
                )}
                {showReviewPanel && alt && (
                  <ReviewAlternativePanel
                    alternative={alt.alternative}
                    basis={alt.basis}
                    considerations={alt.considerations}
                    onAcceptToChart={onOpenAlternativeInChart}
                    onDismiss={onCloseReviewPanel}
                  />
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full border-slate-300 bg-slate-50 text-left text-sm text-slate-800 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500"
                  onClick={onOverride}
                  aria-label="Document override with reason"
                >
                  Document override with reason
                </Button>
                {signPending && onSignAnywayWithReason && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full border-slate-300 bg-white text-sm text-slate-800 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={onSignAnywayWithReason}
                    aria-label="Sign anyway with reason"
                  >
                    Sign anyway with reason
                  </Button>
                )}
              </div>
            </>
          )}

          <section className="shrink-0 border-t border-slate-200 pt-3" aria-labelledby="disclosure-heading">
            <h2 id="disclosure-heading" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Disclosure
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Supports, not replaces clinical judgment. FDA Non-Device CDS under FD&amp;C Act §520(o)(1)(E).
            </p>
            <button
              type="button"
              onClick={() => setAboutOpen((o) => !o)}
              className="mt-2 text-xs font-medium text-teal-700 underline-offset-2 hover:text-teal-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-expanded={aboutOpen}
            >
              About this recommendation
            </button>
            {aboutOpen && (
              <div className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p>{medicalBasis.rationale}</p>
                <p>
                  Citation:{' '}
                  <a href={medicalBasis.url} className="font-medium text-teal-700 hover:underline" target="_blank" rel="noopener noreferrer">
                    {medicalBasis.label}
                  </a>
                </p>
                <p>
                  <a href={routes.modelCard} className="font-medium text-teal-700 hover:underline">
                    Model card
                  </a>
                  {' · '}
                  <a href={routes.regulatoryRationale} className="font-medium text-teal-700 hover:underline">
                    Regulatory rationale
                  </a>
                </p>
              </div>
            )}
          </section>
        </div>
      )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
