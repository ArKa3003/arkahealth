/**
 * @file InformationHierarchy.tsx
 * @description Orchestrates Glance (Layer 1), Scan (Layer 2), and Deep Dive (Layer 3). Manages expand/collapse and analytics.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import type { Nudge } from './NudgeDisplay';
import type { AlternativeOption } from './AlternativesPanel';
import { GlanceView } from './GlanceView';
import { ScanView } from './ScanView';
import { DeepDiveView } from './DeepDiveView';

export type HierarchyLayer = 'glance' | 'scan' | 'deep_dive';

export interface HierarchyAnalyticsEvent {
  layer: HierarchyLayer;
  section?: string;
  action: 'view' | 'expand' | 'collapse';
}

export interface InformationHierarchyProps {
  prediction: MLPrediction;
  scenario: ClinicalScenario;
  alerts: TieredAlert[];
  nudges?: Nudge[];
  alternatives?: AlternativeOption[];
  onOrderInstead?: (alternative: AlternativeOption) => void;
  onInsertIntoNote?: () => void;
  /** Analytics: which layers/sections the clinician interacts with */
  onLayerInteraction?: (event: HierarchyAnalyticsEvent) => void;
  /** Optional ARIA label */
  'aria-label'?: string;
}

export function InformationHierarchy({
  prediction,
  scenario,
  alerts,
  nudges = [],
  alternatives = [],
  onOrderInstead,
  onInsertIntoNote,
  onLayerInteraction,
  'aria-label': ariaLabel,
}: InformationHierarchyProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleSectionToggle = useCallback(
    (section: string, expanded: boolean) => {
      setExpandedSections((s) => {
        const next = new Set(s);
        if (expanded) next.add(section); else next.delete(section);
        return next;
      });
      onLayerInteraction?.({
        layer: 'deep_dive',
        section,
        action: expanded ? 'expand' : 'collapse',
      });
    },
    [onLayerInteraction]
  );

  return (
    <article
      className="flex flex-col gap-3"
      aria-label={ariaLabel ?? 'Cognitive load-optimized information hierarchy'}
    >
      <div
        className="shrink-0"
        role="region"
        aria-label="Glance summary"
        onFocus={() => onLayerInteraction?.({ layer: 'glance', action: 'view' })}
      >
        <GlanceView prediction={prediction} scenario={scenario} alerts={alerts} />
      </div>

      <div
        className="shrink-0"
        role="region"
        aria-label="Scan factors and flags"
        onFocus={() => onLayerInteraction?.({ layer: 'scan', action: 'view' })}
      >
        <ScanView
          prediction={prediction}
          scenario={scenario}
          alternatives={alternatives}
        />
      </div>

      <div
        role="region"
        aria-label="Deep dive details"
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
    </article>
  );
}
