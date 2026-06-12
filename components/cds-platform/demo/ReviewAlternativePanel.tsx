'use client';

/**
 * @file ReviewAlternativePanel.tsx
 * @description Review surface for a guideline-consistent alternative (substitution stays in EHR chart).
 */

import { useEffect, useId, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';
import type { FHIRServiceRequest } from '@/lib/cds-platform/fhir/resources';

export interface ReviewAlternativePanelProps {
  alternative: FHIRServiceRequest;
  basis: MedicalBasis;
  considerations: string[];
  onAcceptToChart: () => void;
  onDismiss: () => void;
}

interface AlternativeOrderDetail {
  cpt: string;
  modality: string;
  bodyPart: string;
  prep: string;
  radiation: string | null;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Extracts compact order fields from a draft ServiceRequest for review display.
 *
 * @param sr - Alternative FHIR ServiceRequest.
 */
function summarizeAlternativeOrder(sr: FHIRServiceRequest): AlternativeOrderDetail {
  const cpt =
    sr.code?.coding?.find((c) => c.system?.includes('cpt') || c.code)?.code ??
    sr.code?.coding?.[0]?.code ??
    '—';
  const display =
    sr.code?.text ?? sr.code?.coding?.[0]?.display ?? 'Alternative study';
  const bodyPart = sr.bodySite?.[0]?.text ?? sr.bodySite?.[0]?.coding?.[0]?.display ?? '—';

  const noteText = (sr.note ?? []).map((n) => n.text ?? '').join(' ');
  const modalityFromNote = noteText.match(/Modality:\s*([^.;]+)/i)?.[1]?.trim();
  const radiationFromNote = noteText.match(/Expected radiation:\s*([^.;]+)/i)?.[1]?.trim();

  const modality =
    modalityFromNote ??
    sr.category?.[0]?.coding?.[0]?.display ??
    inferModalityFromDisplay(display);

  const prep = sr.patientInstruction?.trim() || 'None documented';

  let radiation: string | null = radiationFromNote ?? null;
  if (!radiation) {
    const inferred = inferRadiationFromModality(modality, display);
    radiation = inferred;
  }

  return { cpt, modality, bodyPart, prep, radiation };
}

/**
 * @param display - CPT display text.
 */
function inferModalityFromDisplay(display: string): string {
  const d = display.toLowerCase();
  if (d.includes('mri')) return 'MRI';
  if (d.includes('ct')) return 'CT';
  if (d.includes('ultrasound') || d.includes(' us ')) return 'Ultrasound';
  if (d.includes('x-ray') || d.includes('xray') || d.includes('radiograph')) return 'X-ray';
  if (d.includes('physical therapy') || d.includes('pt ')) return 'Physical therapy';
  return display;
}

/**
 * @param modality - Resolved modality label.
 * @param display - Order display text.
 */
function inferRadiationFromModality(modality: string, display: string): string | null {
  const m = `${modality} ${display}`.toLowerCase();
  if (m.includes('physical therapy') || m.includes('pt ')) {
    return 'Not applicable (no ionizing radiation)';
  }
  if (m.includes('ultrasound') || m.includes('mri')) {
    return 'None (no ionizing radiation)';
  }
  if (m.includes('x-ray') || m.includes('radiograph')) {
    return '~0.005 mSv effective dose (approx.)';
  }
  if (m.includes('ct')) {
    return 'Ionizing radiation — site-specific dose per protocol';
  }
  return null;
}

/**
 * Slide-over review panel for an alternative order (not auto-submitted to FHIR).
 */
export function ReviewAlternativePanel({
  alternative,
  basis,
  considerations,
  onAcceptToChart,
  onDismiss,
}: ReviewAlternativePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const detail = summarizeAlternativeOrder(alternative);
  const displayName =
    alternative.code?.text ??
    alternative.code?.coding?.[0]?.display ??
    'Alternative imaging';

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusables = (): HTMLElement[] =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = getFocusables();
    focusables[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = getFocusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onDismiss]);

  return (
    <div
      ref={panelRef}
      className="rounded-lg border border-arka-teal/30 bg-arka-pale/30 p-4 dark:bg-arka-teal/10"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-label="Review alternative imaging"
    >
      <h3 id={headingId} className="text-sm font-semibold text-arka-text-dark">
        Alternative imaging consistent with {basis.label}
      </h3>

      <p className="mt-3 text-sm text-arka-text-dark-muted">{basis.rationale}</p>
      <a
        href={basis.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm text-arka-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan"
      >
        View citation ↗
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>

      <div
        className="mt-4 rounded-md border border-arka-primary/15 bg-white/80 p-3 text-xs dark:bg-arka-bg-dark/40"
        aria-label="Alternative order summary"
      >
        <p className="font-medium text-arka-text-dark">{displayName}</p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-arka-text-dark-muted">
          <dt className="font-medium text-arka-text-dark-soft">CPT</dt>
          <dd>{detail.cpt}</dd>
          <dt className="font-medium text-arka-text-dark-soft">Modality</dt>
          <dd>{detail.modality}</dd>
          <dt className="font-medium text-arka-text-dark-soft">Body part</dt>
          <dd>{detail.bodyPart}</dd>
          <dt className="font-medium text-arka-text-dark-soft">Prep</dt>
          <dd>{detail.prep}</dd>
          {detail.radiation !== null && (
            <>
              <dt className="font-medium text-arka-text-dark-soft">Radiation</dt>
              <dd>{detail.radiation}</dd>
            </>
          )}
        </dl>
      </div>

      <section className="mt-4" aria-labelledby={`${headingId}-considerations`}>
        <h4
          id={`${headingId}-considerations`}
          className="text-xs font-bold uppercase tracking-wide text-arka-teal-700"
        >
          Considerations
        </h4>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-arka-text-dark-muted">
          {considerations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          className="w-full bg-arka-teal focus-visible:ring-2 focus-visible:ring-arka-cyan"
          onClick={onAcceptToChart}
        >
          Open in chart to substitute
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full focus-visible:ring-2 focus-visible:ring-arka-cyan"
          onClick={onDismiss}
        >
          Keep original order
        </Button>
      </div>
    </div>
  );
}
