/**
 * @file SidebarLayout.tsx
 * @description Root container for the CDS non-modal sidebar (380px). Header, scrollable content, footer.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import { SidebarHeader, type TrafficLightStatus } from './SidebarHeader';
import { AlertCard } from './AlertCard';
import { QuickActions } from './QuickActions';
import { OverrideDialog } from './OverrideDialog';
import { ProgressiveContainer } from './ProgressiveContainer';
import { AlternativesPanel, type AlternativeOption } from './AlternativesPanel';
import { STANDARD_OVERRIDE_OPTIONS } from '@/lib/cds-platform/alerting/types';

export interface SidebarLayoutProps {
  alerts: TieredAlert[];
  scenario: ClinicalScenario;
  prediction: MLPrediction;
  /** Optional patient display name (from EHR); falls back to patientId */
  patientName?: string;
  /** Alternative imaging options with optional scores */
  alternatives?: AlternativeOption[];
  /** Loading state */
  loading?: boolean;
  /** Error state message */
  error?: string | null;
  /** Callbacks for quick actions */
  onAcceptOrder?: () => void;
  onViewAlternatives?: () => void;
  onOverrideAndContinue?: () => void;
  onCancelOrder?: () => void;
  /** Called when user orders an alternative (create new ServiceRequest, delete original) */
  onOrderInstead?: (alternative: AlternativeOption) => void;
  /** Submit override reason (e.g. create FHIR DocumentReference for audit) */
  onOverrideSubmit?: (payload: { code: string; documentation?: string }) => void;
  /** Insert assessment into EHR note (SMART on FHIR). When provided, "Insert into Note" is shown in Clinical Documentation. */
  onInsertIntoNote?: () => void;
  /** Theme: light | dark; defaults to inherit from EHR */
  theme?: 'light' | 'dark';
  /** Optional: track which hierarchy layers the clinician interacts with (analytics). */
  onLayerInteraction?: (event: { layer: 'glance' | 'scan' | 'deep_dive'; section?: string; action: 'view' | 'expand' | 'collapse' }) => void;
  /** CDS hook for progressive disclosure (order-select | order-sign). */
  hook?: 'order-select' | 'order-sign';
  /** Clinician userId from CDS context (for adaptive disclosure). */
  userId?: string;
}

function scoreToTrafficLight(score: number): TrafficLightStatus {
  if (score >= 7) return 'green';
  if (score >= 4) return 'yellow';
  return 'red';
}

function orderSummaryFromScenario(scenario: ClinicalScenario): string {
  const p = scenario.proposedImaging;
  if (!p) return '—';
  const parts = [p.modality, p.bodyPart].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

export function SidebarLayout({
  alerts,
  scenario,
  prediction,
  patientName,
  alternatives = [],
  loading = false,
  error = null,
  onAcceptOrder,
  onViewAlternatives,
  onOverrideAndContinue,
  onCancelOrder,
  onOrderInstead,
  onOverrideSubmit,
  onInsertIntoNote,
  onLayerInteraction,
  theme,
  hook = 'order-select',
  userId,
}: SidebarLayoutProps) {
  const [overrideAlertId, setOverrideAlertId] = useState<string | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  const displayAlerts = useMemo(
    () => alerts.filter((a) => !dismissedAlertIds.has(a.id)),
    [alerts, dismissedAlertIds]
  );
  const overrideAlert = overrideAlertId ? alerts.find((a) => a.id === overrideAlertId) : null;
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const trafficLight = scoreToTrafficLight(score);
  const orderSummary = orderSummaryFromScenario(scenario);
  const patientDisplayName = patientName ?? scenario.patientId ?? '—';

  const handleDismiss = (id: string) => setDismissedAlertIds((s) => new Set(s).add(id));
  const handleOverride = (id: string) => setOverrideAlertId(id);
  const handleOverrideSubmit = (payload: { code: string; documentation?: string }) => {
    onOverrideSubmit?.(payload);
    setOverrideAlertId(null);
  };

  if (loading) {
    return (
      <aside
        className="flex w-[380px] flex-col bg-[var(--arka-bg,#fff)] text-[var(--arka-fg,#111827)] dark:bg-[var(--arka-bg)] dark:text-[var(--arka-fg)]"
        style={{ width: 380 }}
        role="complementary"
        aria-label="CDS recommendations loading"
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--arka-fg-muted,#6b7280)]" aria-hidden />
          <p className="text-sm text-[var(--arka-fg-muted,#6b7280)]">Loading recommendations…</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside
        className="flex w-[380px] flex-col bg-[var(--arka-bg,#fff)] text-[var(--arka-fg,#111827)] dark:bg-[var(--arka-bg)] dark:text-[var(--arka-fg)]"
        style={{ width: 380 }}
        role="complementary"
        aria-label="CDS recommendations error"
      >
        <SidebarHeader
          patientName={patientDisplayName}
          age={scenario.age}
          sex={scenario.sex}
          orderSummary={orderSummary}
          trafficLight="red"
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <AlertCircle className="h-10 w-10 text-red-500" aria-hidden />
          <p className="text-center text-sm font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
            Something went wrong
          </p>
          <p className="text-center text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
            {error}
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`flex w-[380px] flex-col overflow-hidden rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg,#fff)] text-[var(--arka-fg,#111827)] dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg)] dark:text-[var(--arka-fg)] ${theme === 'dark' ? 'dark' : ''}`}
      style={{ width: 380 }}
      role="complementary"
      aria-label="CDS recommendations"
    >
      <div className="sticky top-0 z-10 shrink-0">
        <SidebarHeader
          patientName={patientDisplayName}
          age={scenario.age}
          sex={scenario.sex}
          orderSummary={orderSummary}
          trafficLight={trafficLight}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
        <ProgressiveContainer
          prediction={prediction}
          scenario={scenario}
          alerts={alerts}
          alternatives={alternatives}
          onOrderInstead={onOrderInstead}
          onInsertIntoNote={onInsertIntoNote}
          hook={hook}
          userId={userId}
          onLayerInteraction={onLayerInteraction}
        />
        {displayAlerts.length === 0 && !overrideAlert && (
          <p className="py-2 text-center text-sm text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
            No alerts at this time.
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          {displayAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onOverride={handleOverride}
              showOverrideButton
            />
          ))}
        </div>
        {overrideAlert && (
          <OverrideDialog
            options={overrideAlert.overrideOptions ?? STANDARD_OVERRIDE_OPTIONS}
            onSubmit={handleOverrideSubmit}
            onGoBack={() => setOverrideAlertId(null)}
            alertTitle={overrideAlert.title}
          />
        )}
      </div>

      <div className="sticky bottom-0 z-10 shrink-0">
        <QuickActions
          score={score}
          onAcceptOrder={onAcceptOrder}
          onViewAlternatives={onViewAlternatives}
          onOverrideAndContinue={onOverrideAndContinue}
          onCancelOrder={onCancelOrder}
        />
      </div>
    </aside>
  );
}
