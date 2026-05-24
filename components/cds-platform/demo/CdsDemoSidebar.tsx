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
  onAboutRecommendation: () => void;
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
  onAboutRecommendation,
  signPending = false,
  onSignAnywayWithReason,
}: CdsDemoSidebarProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const alt = scenario.alternativeWithBasis;
  const guidelineShort = medicalBasis.label.split('—')[0]?.trim() ?? medicalBasis.label;

  const asideClass =
    'flex w-full flex-col rounded-xl border border-arka-light bg-white shadow-sm lg:w-[40%] lg:min-w-[320px] lg:max-w-[420px]';

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.aside
          key="loading"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 10, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`${asideClass} min-h-[420px] items-center justify-center p-6`}
          aria-live="polite"
          aria-busy="true"
          aria-label="ARKA CDS recommendations loading"
        >
          <Loader2 className="h-8 w-8 animate-spin text-arka-muted" />
          <p className="mt-2 text-sm text-arka-muted">Evaluating order…</p>
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
      <header className="border-b border-arka-primary/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-arka-text-dark-muted">ARKA Sidebar</p>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {emptyCards ? (
          <p className="rounded-lg border border-arka-primary/10 bg-arka-bg-light p-3 text-sm text-arka-muted">
            No guideline-anchored concerns for this order
          </p>
        ) : (
          <>
            <section aria-labelledby="primary-basis-heading">
              <h2 id="primary-basis-heading" className="text-xs font-bold uppercase tracking-wide text-arka-teal">
                Primary basis
              </h2>
              <p className="mt-2 text-sm font-medium text-arka-text-dark">{medicalBasis.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-arka-text-dark">{medicalBasis.rationale}</p>
              <a
                href={medicalBasis.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-arka-cyan underline-offset-2 hover:text-arka-teal"
              >
                View citation
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </section>

            <hr className="border-arka-primary/10" />

            <section aria-labelledby="refinement-heading">
              <h2 id="refinement-heading" className="text-xs font-medium text-arka-text-dark-muted">
                Patient-specific refinement
              </h2>
              <p className="mt-2 text-2xl font-semibold text-arka-text-dark">
                ARKA risk: {score}/9
              </p>
              <p className="mt-1 text-xs text-arka-text-dark-muted">Top factors (SHAP)</p>
              <ShapFactorsBlock rows={shapRows} />
            </section>

            <div className="flex flex-col gap-2">
              {alt && !showReviewPanel && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-left text-sm"
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
                variant="ghost"
                className="w-full border border-arka-primary/20 text-sm"
                onClick={onOverride}
                aria-label="Document override with reason"
              >
                Document override with reason
              </Button>
              {signPending && onSignAnywayWithReason && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-sm"
                  onClick={onSignAnywayWithReason}
                  aria-label="Sign anyway with reason"
                >
                  Sign anyway with reason
                </Button>
              )}
            </div>
          </>
        )}

        <section className="mt-auto border-t border-arka-primary/10 pt-4" aria-labelledby="disclosure-heading">
          <h2 id="disclosure-heading" className="text-xs font-medium text-arka-muted">
            Disclosure
          </h2>
          <p className="mt-2 text-xs text-arka-muted">
            Supports, not replaces clinical judgment. FDA Non-Device CDS under FD&amp;C Act §520(o)(1)(E).
          </p>
          <button
            type="button"
            onClick={() => {
              setAboutOpen((o) => !o);
              onAboutRecommendation();
            }}
            className="mt-2 text-xs text-arka-cyan underline-offset-2 hover:text-arka-teal"
            aria-expanded={aboutOpen}
          >
            About this recommendation
          </button>
          {aboutOpen && (
            <div className="mt-2 space-y-2 rounded border border-arka-primary/10 bg-arka-bg-light p-3 text-xs text-arka-muted">
              <p>{medicalBasis.rationale}</p>
              <p>
                Citation:{' '}
                <a href={medicalBasis.url} className="text-arka-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                  {medicalBasis.label}
                </a>
              </p>
              <p>
                <a href="/docs/MODEL_CARD.md" className="text-arka-cyan hover:underline">
                  MODEL_CARD.md
                </a>
                {' · '}
                <a href="/docs/REGULATORY_RATIONALE_MEMO.md" className="text-arka-cyan hover:underline">
                  REGULATORY_RATIONALE_MEMO.md
                </a>
              </p>
            </div>
          )}
        </section>
      </div>

      {overrideDialogOpen && (
        <div className="border-t border-arka-primary/10 p-2">
          <OverrideDialog
            options={OVERRIDE_OPTIONS}
            onSubmit={(payload) => {
              onOverrideSubmit(payload);
              onOverrideDialogClose();
            }}
            onGoBack={onOverrideDialogClose}
            alertTitle="CDS recommendation"
          />
        </div>
      )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
