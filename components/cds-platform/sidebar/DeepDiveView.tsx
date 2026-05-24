/**
 * @file DeepDiveView.tsx
 * @description Layer 3 — DEEP DIVE: expandable accordion sections (Full Score, Alternatives, Evidence, Patient Context, Documentation).
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BarChart2, DollarSign } from 'lucide-react';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import type { AlternativeOption } from './AlternativesPanel';
import { MiniWaterfallChart } from './MiniWaterfallChart';
import { CopyableDocumentation } from './CopyableDocumentation';

export interface DeepDiveViewProps {
  prediction: MLPrediction;
  scenario: ClinicalScenario;
  alerts: TieredAlert[];
  alternatives?: AlternativeOption[];
  onOrderInstead?: (alternative: AlternativeOption) => void;
  onInsertIntoNote?: () => void;
  /** Which section(s) are expanded. Keys: 'score' | 'alternatives' | 'evidence' | 'patient' | 'documentation' */
  expandedSections?: Set<string>;
  onSectionToggle?: (section: string, expanded: boolean) => void;
  /** Optional ARIA label */
  'aria-label'?: string;
}

const SECTIONS = [
  { id: 'score', label: 'Full Score Breakdown', summaryKey: 'scoreSummary' },
  { id: 'alternatives', label: 'All Alternatives', summaryKey: 'alternativesSummary' },
  { id: 'evidence', label: 'Evidence & Guidelines', summaryKey: 'evidenceSummary' },
  { id: 'patient', label: 'Patient Context', summaryKey: 'patientSummary' },
  { id: 'documentation', label: 'Clinical Documentation', summaryKey: null },
] as const;

export function DeepDiveView({
  prediction,
  scenario,
  alerts,
  alternatives = [],
  onOrderInstead,
  onInsertIntoNote,
  expandedSections: controlledExpanded,
  onSectionToggle,
  'aria-label': ariaLabel,
}: DeepDiveViewProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(new Set());
  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = (id: string, value: boolean) => {
    if (onSectionToggle) onSectionToggle(id, value);
    else setInternalExpanded((s) => {
      const next = new Set(s);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
  };

  const shapCount = prediction.shapValues?.featureContributions?.length ?? 0;
  const guidelinesCited = alerts.filter((a) => a.evidenceBasis?.length).length;

  const getSummary = (key: string) => {
    switch (key) {
      case 'scoreSummary':
        return shapCount ? `${shapCount} factors` : 'Score breakdown';
      case 'alternativesSummary':
        return alternatives.length ? `${alternatives.length} alternatives` : 'No alternatives';
      case 'evidenceSummary':
        return guidelinesCited ? `${guidelinesCited} guidelines cited` : 'Evidence';
      case 'patientSummary':
        return 'Demographics, conditions, prior imaging';
      default:
        return '';
    }
  };

  return (
    <section
      className="flex flex-col gap-1"
      aria-label={ariaLabel ?? 'Deep dive: full breakdown and documentation'}
    >
      {SECTIONS.map(({ id, label, summaryKey }) => {
        const isExpanded = expanded.has(id);
        const summary = summaryKey ? getSummary(summaryKey) : null;
        return (
          <div
            key={id}
            className="rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-elevated,#fff)] dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-elevated)]"
          >
            <button
              type="button"
              onClick={() => setExpanded(id, !isExpanded)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-[var(--arka-fg,#111827)] hover:bg-[var(--arka-bg-muted,#f3f4f6)] dark:text-[var(--arka-fg)] dark:hover:bg-[var(--arka-bg-muted)]"
              aria-expanded={isExpanded}
              aria-controls={`deep-dive-${id}`}
            >
              <span className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {label}
                {summary && (
                  <span className="text-xs font-normal text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
                    {summary}
                  </span>
                )}
              </span>
            </button>
            <div
              id={`deep-dive-${id}`}
              role="region"
              hidden={!isExpanded}
              className="border-t border-[var(--arka-border,#e5e7eb)] dark:border-[var(--arka-border)]"
            >
              {isExpanded && (
                <div className="p-3">
                  {id === 'score' && <MiniWaterfallChart prediction={prediction} />}
                  {id === 'alternatives' && (
                    <AlternativesList
                      alternatives={alternatives}
                      onOrderInstead={onOrderInstead}
                    />
                  )}
                  {id === 'evidence' && (
                    <EvidenceSection alerts={alerts} />
                  )}
                  {id === 'patient' && (
                    <PatientContextSection scenario={scenario} />
                  )}
                  {id === 'documentation' && (
                    <CopyableDocumentation
                      prediction={prediction}
                      scenario={scenario}
                      onInsertIntoNote={onInsertIntoNote}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function scoreCategory(score: number): string {
  if (score >= 7) return 'Appropriate';
  if (score >= 4) return 'Uncertain';
  return 'Not appropriate';
}

function AlternativesList({
  alternatives,
  onOrderInstead,
}: {
  alternatives: AlternativeOption[];
  onOrderInstead?: (alt: AlternativeOption) => void;
}) {
  const sorted = [...alternatives].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (sorted.length === 0) {
    return <p className="text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">No alternatives available.</p>;
  }
  return (
    <ul className="flex flex-col gap-2" role="list" aria-label="All alternative imaging options">
      {sorted.map((alt, i) => {
        const score = alt.score ?? 0;
        const cat = score > 0 ? scoreCategory(score) : '';
        const displayName = [alt.modality, alt.bodyPart].filter(Boolean).join(' — ') || 'Imaging option';
        return (
          <li
            key={i}
            className="flex flex-col gap-1.5 rounded border border-[var(--arka-border,#e5e7eb)] p-2 dark:border-[var(--arka-border)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">{displayName}</span>
              {score > 0 && (
                <span className="text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
                  {score}/9 — {cat}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
              {alt.radiationComparison && (
                <span className="flex items-center gap-1">
                  <BarChart2 className="h-3.5 w-3.5" aria-hidden /> {alt.radiationComparison}
                </span>
              )}
              {alt.costComparison && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" aria-hidden /> {alt.costComparison}
                </span>
              )}
            </div>
            {onOrderInstead && (
              <button
                type="button"
                onClick={() => onOrderInstead(alt)}
                className="w-full rounded border border-blue-500 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                aria-label={`Order ${displayName} instead`}
              >
                Order Instead
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function EvidenceSection({ alerts }: { alerts: TieredAlert[] }) {
  const withEvidence = alerts.filter((a) => a.evidenceBasis?.trim());
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
        Citations and guideline basis for recommendations.
      </p>
      {withEvidence.length === 0 ? (
        <p className="text-xs italic text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
          No linked guidelines in this context. Recommendations based on ARKA AIIE model and institutional policy.
        </p>
      ) : (
        <ul className="list-inside list-disc space-y-1 text-xs text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
          {withEvidence.map((a) => (
            <li key={a.id}>
              <span className="font-medium">{a.title}</span>: {a.evidenceBasis}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PatientContextSection({ scenario }: { scenario: ClinicalScenario }) {
  const { patientId, age, sex, chiefComplaint, clinicalHistory, pregnancyStatus, contrastAllergy, renalFunction, medications, priorImaging } = scenario;
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <p className="font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">Demographics</p>
        <p className="text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
          {patientId}{age != null ? ` · ${age}y` : ''}{sex ? ` · ${sex}` : ''}
        </p>
      </div>
      {(chiefComplaint || clinicalHistory) && (
        <div>
          <p className="font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">Presentation</p>
          <p className="text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
            {chiefComplaint ?? clinicalHistory ?? '—'}
          </p>
        </div>
      )}
      <div>
        <p className="font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">Safety</p>
        <p className="text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
          Pregnancy: {pregnancyStatus ?? 'unknown'} · Contrast allergy: {contrastAllergy ? 'Yes' : 'No'}
          {renalFunction?.value != null ? ` · eGFR: ${renalFunction.value}` : ''}
        </p>
      </div>
      {medications && (medications.onAnticoagulation || medications.onMetformin) && (
        <div>
          <p className="font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">Medications</p>
          <p className="text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
            {medications.onAnticoagulation && 'Anticoagulation '}
            {medications.onMetformin && 'Metformin'}
          </p>
        </div>
      )}
      {priorImaging && priorImaging.length > 0 && (
        <div>
          <p className="font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">Prior imaging</p>
          <ul className="list-inside list-disc text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
            {priorImaging.slice(0, 5).map((p, i) => (
              <li key={i}>
                {p.modality ?? 'Imaging'} {p.bodyPart ?? ''} — {p.daysAgo} days ago
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
