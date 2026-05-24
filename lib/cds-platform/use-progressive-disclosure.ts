/**
 * @file useProgressiveDisclosure.ts
 * @description React hook for progressive disclosure: level state, section expand/collapse, view/action tracking.
 * Phase 9: Progressive Disclosure System.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getProgressiveDisclosureController,
  type DisclosureLevel,
  type DisclosureContext,
  type DisclosureInteractionEvent,
  DETAILED_DEFAULT_OPEN_SECTIONS,
  DEEP_DIVE_SECTIONS,
} from '@/lib/cds-platform/progressive-disclosure';

const LEVEL_ORDER: DisclosureLevel[] = ['MINIMAL', 'STANDARD', 'DETAILED', 'MAXIMUM'];

export interface UseProgressiveDisclosureOptions {
  /** Context for initial level selection (score, safety, hook, userId) */
  context: DisclosureContext;
  /** Callback for analytics (e.g. send to backend) */
  onAnalytics?: (event: DisclosureInteractionEvent) => void;
}

export interface UseProgressiveDisclosureReturn {
  level: DisclosureLevel;
  setLevel: (level: DisclosureLevel) => void;
  expandSection: (section: string) => void;
  collapseSection: (section: string) => void;
  /** Sections that should be expanded by default for current level (controlled by container) */
  defaultExpandedSections: string[];
  /** Track view start (call when disclosure UI is shown) */
  trackView: () => void;
  /** Track view end with duration (call on unmount or when leaving) */
  trackViewEnd: (durationMs: number) => void;
  /** Track action: override, dismiss, show_more, show_less, expand_section, collapse_section */
  trackAction: (event: DisclosureInteractionEvent) => void;
  /** Whether Scan layer is visible for current level */
  showScan: boolean;
  /** Whether DeepDive layer is visible for current level */
  showDeepDive: boolean;
  /** For DETAILED: first 2 sections open; for MAXIMUM: all. Used as initial expanded set. */
  getInitialExpandedForLevel: (l: DisclosureLevel) => string[];
}

export function useProgressiveDisclosure({
  context,
  onAnalytics,
}: UseProgressiveDisclosureOptions): UseProgressiveDisclosureReturn {
  const controller = getProgressiveDisclosureController();
  const initialLevel = controller.selectInitialLevel(context);
  const [level, setLevelState] = useState<DisclosureLevel>(initialLevel);

  const viewStartRef = useRef<number | null>(null);
  const levelRef = useRef<DisclosureLevel>(initialLevel);
  const userId = context.userId;

  levelRef.current = level;

  const defaultExpandedSections =
    level === 'DETAILED'
      ? [...DETAILED_DEFAULT_OPEN_SECTIONS]
      : level === 'MAXIMUM'
        ? [...DEEP_DIVE_SECTIONS]
        : [];

  const showScan = level === 'STANDARD' || level === 'DETAILED' || level === 'MAXIMUM';
  const showDeepDive = level === 'DETAILED' || level === 'MAXIMUM';

  const setLevel = useCallback(
    (newLevel: DisclosureLevel) => {
      const prev = levelRef.current;
      setLevelState(newLevel);
      levelRef.current = newLevel;
      controller.setUserLevel(userId, newLevel);
      const prevI = LEVEL_ORDER.indexOf(prev);
      const newI = LEVEL_ORDER.indexOf(newLevel);
      const ev: DisclosureInteractionEvent = newI > prevI ? { type: 'show_more' } : { type: 'show_less' };
      controller.recordInteraction(userId, ev);
      onAnalytics?.(ev);
    },
    [userId, controller, onAnalytics]
  );

  const expandSection = useCallback(
    (section: string) => {
      controller.recordInteraction(userId, { type: 'expand_section', section });
      onAnalytics?.({ type: 'expand_section', section });
    },
    [userId, controller, onAnalytics]
  );

  const collapseSection = useCallback(
    (section: string) => {
      controller.recordInteraction(userId, { type: 'collapse_section', section });
      onAnalytics?.({ type: 'collapse_section', section });
    },
    [userId, controller, onAnalytics]
  );

  const trackView = useCallback(() => {
    viewStartRef.current = Date.now();
    controller.recordInteraction(userId, { type: 'view_start' });
    onAnalytics?.({ type: 'view_start' });
  }, [userId, controller, onAnalytics]);

  const trackViewEnd = useCallback(
    (durationMs: number) => {
      viewStartRef.current = null;
      controller.recordInteraction(userId, { type: 'view_end', durationMs });
      onAnalytics?.({ type: 'view_end', durationMs });
    },
    [userId, controller, onAnalytics]
  );

  const trackAction = useCallback(
    (event: DisclosureInteractionEvent) => {
      controller.recordInteraction(userId, event);
      onAnalytics?.(event);
    },
    [userId, controller, onAnalytics]
  );

  const getInitialExpandedForLevel = useCallback((l: DisclosureLevel): string[] => {
    if (l === 'DETAILED') return [...DETAILED_DEFAULT_OPEN_SECTIONS];
    if (l === 'MAXIMUM') return [...DEEP_DIVE_SECTIONS];
    return [];
  }, []);

  // On mount: track view start
  useEffect(() => {
    trackView();
    return () => {
      const start = viewStartRef.current;
      if (start != null) trackViewEnd(Date.now() - start);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: track once per mount

  return {
    level,
    setLevel,
    expandSection,
    collapseSection,
    defaultExpandedSections,
    trackView,
    trackViewEnd,
    trackAction,
    showScan,
    showDeepDive,
    getInitialExpandedForLevel,
  };
}
