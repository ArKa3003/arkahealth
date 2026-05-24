/**
 * @file ProgressiveContainer.tsx
 * @description Wraps InformationHierarchy with progressive disclosure: shows/hides layers by level, Show More/Less, animations.
 * Phase 9: Progressive Disclosure System.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import type { AlternativeOption } from './AlternativesPanel';
import type { Nudge } from './NudgeDisplay';
import type { DisclosureContext, DisclosureLevel, HookType } from '@/lib/cds-platform/progressive-disclosure';
import { useProgressiveDisclosure } from '@/lib/cds-platform/use-progressive-disclosure';
import { GlanceView } from './GlanceView';
import { ScanView } from './ScanView';
import { DeepDiveView } from './DeepDiveView';
import type { HierarchyAnalyticsEvent } from './InformationHierarchy';

export interface ProgressiveContainerProps {
  prediction: MLPrediction;
  scenario: ClinicalScenario;
  alerts: TieredAlert[];
  nudges?: Nudge[];
  alternatives?: AlternativeOption[];
  onOrderInstead?: (alternative: AlternativeOption) => void;
  onInsertIntoNote?: () => void;
  /** For disclosure: hook and optional user */
  hook?: HookType;
  userId?: string;
  /** Analytics: hierarchy and disclosure events */
  onLayerInteraction?: (event: HierarchyAnalyticsEvent) => void;
  onDisclosureAnalytics?: (event: { type: string; [key: string]: unknown }) => void;
  'aria-label'?: string;
}

const LEVEL_ORDER: DisclosureLevel[] = ['MINIMAL', 'STANDARD', 'DETAILED', 'MAXIMUM'];

function nextLevel(current: DisclosureLevel): DisclosureLevel | null {
  const i = LEVEL_ORDER.indexOf(current);
  return i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1]! : null;
}

function prevLevel(current: DisclosureLevel): DisclosureLevel | null {
  const i = LEVEL_ORDER.indexOf(current);
  return i > 0 ? LEVEL_ORDER[i - 1]! : null;
}

function hasSafetyFlags(scenario: ClinicalScenario, alerts: TieredAlert[]): boolean {
  if (scenario.pregnancyStatus === 'pregnant') return true;
  if (scenario.contrastAllergy) return true;
  const eGFR = scenario.renalFunction?.value;
  if (eGFR != null && eGFR < 60) return true;
  const safetyCategories = ['patient_safety', 'contrast_safety'] as const;
  return alerts.some((a) => safetyCategories.includes(a.category as (typeof safetyCategories)[number]));
}

export function ProgressiveContainer({
  prediction,
  scenario,
  alerts,
  nudges = [],
  alternatives = [],
  onOrderInstead,
  onInsertIntoNote,
  hook = 'order-select',
  userId,
  onLayerInteraction,
  onDisclosureAnalytics,
  'aria-label': ariaLabel,
}: ProgressiveContainerProps) {
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const context: DisclosureContext = {
    score,
    hasSafetyFlags: hasSafetyFlags(scenario, alerts),
    hook,
    userId,
  };

  const {
    level,
    setLevel,
    showScan,
    showDeepDive,
    expandSection,
    collapseSection,
    getInitialExpandedForLevel,
  } = useProgressiveDisclosure({
    context,
    onAnalytics: onDisclosureAnalytics,
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(getInitialExpandedForLevel(level)));

  // Sync default expanded when level changes
  useEffect(() => {
    setExpandedSections(new Set(getInitialExpandedForLevel(level)));
  }, [level, getInitialExpandedForLevel]);

  const handleSectionToggle = useCallback(
    (section: string, expanded: boolean) => {
      setExpandedSections((s) => {
        const next = new Set(s);
        if (expanded) next.add(section);
        else next.delete(section);
        return next;
      });
      if (expanded) expandSection(section);
      else collapseSection(section);
      onLayerInteraction?.({
        layer: 'deep_dive',
        section,
        action: expanded ? 'expand' : 'collapse',
      });
    },
    [expandSection, collapseSection, onLayerInteraction]
  );

  const handleShowMore = useCallback(() => {
    const next = nextLevel(level);
    if (next) setLevel(next);
  }, [level, setLevel]);

  const handleShowLess = useCallback(() => {
    const prev = prevLevel(level);
    if (prev) setLevel(prev);
  }, [level, setLevel]);

  const canShowMore = nextLevel(level) !== null;
  const canShowLess = prevLevel(level) !== null;

  return (
    <article
      className="flex flex-col gap-3"
      aria-label={ariaLabel ?? 'Progressive disclosure information hierarchy'}
    >
      {/* Glance — always visible */}
      <div
        className="shrink-0"
        role="region"
        aria-label="Glance summary"
        onFocus={() => onLayerInteraction?.({ layer: 'glance', action: 'view' })}
      >
        <GlanceView prediction={prediction} scenario={scenario} alerts={alerts} />
      </div>

      {/* Scan — STANDARD and above, with smooth height animation */}
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: showScan ? 400 : 0 }}
        role="region"
        aria-label="Scan factors and flags"
        aria-hidden={!showScan}
        onFocus={() => onLayerInteraction?.({ layer: 'scan', action: 'view' })}
      >
        <ScanView
          prediction={prediction}
          scenario={scenario}
          alternatives={alternatives}
        />
      </div>

      {/* Deep dive — DETAILED and MAXIMUM, with smooth height animation */}
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: showDeepDive ? 1200 : 0 }}
        role="region"
        aria-label="Deep dive details"
        aria-hidden={!showDeepDive}
        onFocus={() => onLayerInteraction?.({ layer: 'deep_dive', action: 'view' })}
      >
        <DeepDiveView
            prediction={prediction}
            scenario={scenario}
            alerts={alerts}
            alternatives={alternatives}
            onOrderInstead={onOrderInstead}
            onInsertIntoNote={onInsertIntoNote}
            expandedSections={expandedSections}
            onSectionToggle={handleSectionToggle}
          />
      </div>

      {/* Show More / Show Less */}
      <div className="flex items-center justify-center gap-2 border-t border-[var(--arka-border,#e5e7eb)] pt-2 dark:border-[var(--arka-border)]">
        {canShowMore && (
          <button
            type="button"
            onClick={handleShowMore}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--arka-fg-muted,#6b7280)] hover:bg-[var(--arka-bg-muted,#f3f4f6)] hover:text-[var(--arka-fg,#111827)] dark:hover:bg-[var(--arka-bg-muted)] dark:hover:text-[var(--arka-fg)]"
            aria-label="Show more details"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
            Show more
          </button>
        )}
        {canShowLess && (
          <button
            type="button"
            onClick={handleShowLess}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--arka-fg-muted,#6b7280)] hover:bg-[var(--arka-bg-muted,#f3f4f6)] hover:text-[var(--arka-fg,#111827)] dark:hover:bg-[var(--arka-bg-muted)] dark:hover:text-[var(--arka-fg)]"
            aria-label="Show less"
          >
            <ChevronUp className="h-4 w-4" aria-hidden />
            Show less
          </button>
        )}
      </div>
    </article>
  );
}
