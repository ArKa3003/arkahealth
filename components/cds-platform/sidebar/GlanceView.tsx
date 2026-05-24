/**
 * @file GlanceView.tsx
 * @description Layer 1 — GLANCE: visible immediately, no interaction. Max 180px. Traffic light, verdict, safety badge, primary factor.
 */

'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import type { SHAPFeatureContribution } from '@/lib/cds-platform/ml/types';

export interface GlanceViewProps {
  prediction: MLPrediction;
  scenario: ClinicalScenario;
  alerts: TieredAlert[];
  /** Optional ARIA label */
  'aria-label'?: string;
}

function scoreToTrafficLight(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 7) return 'green';
  if (score >= 4) return 'yellow';
  return 'red';
}

function scoreToVerdict(score: number, modality?: string): string {
  const mod = (modality ?? 'order').trim() || 'order';
  if (score >= 7) return `This ${mod} appears appropriate`;
  if (score >= 4) return 'Consider alternatives';
  return 'Not recommended';
}

function getTopShapFactor(prediction: MLPrediction): SHAPFeatureContribution | null {
  const contribs = prediction.shapValues?.featureContributions ?? [];
  if (contribs.length === 0) return null;
  return [...contribs].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))[0] ?? null;
}

function hasSafetyConcerns(scenario: ClinicalScenario, alerts: TieredAlert[]): boolean {
  if (scenario.pregnancyStatus === 'pregnant') return true;
  if (scenario.contrastAllergy) return true;
  const eGFR = scenario.renalFunction?.value;
  if (eGFR != null && eGFR < 60) return true;
  const safetyCategories = ['patient_safety', 'contrast_safety'] as const;
  return alerts.some((a) => safetyCategories.includes(a.category as typeof safetyCategories[number]));
}

export function GlanceView({
  prediction,
  scenario,
  alerts,
  'aria-label': ariaLabel,
}: GlanceViewProps) {
  const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
  const trafficLight = scoreToTrafficLight(score);
  const modality = scenario.proposedImaging?.modality ?? 'Imaging';
  const verdict = scoreToVerdict(score, String(modality));
  const topFactor = getTopShapFactor(prediction);
  const safety = hasSafetyConcerns(scenario, alerts);

  const circleColor =
    trafficLight === 'green'
      ? 'bg-emerald-500'
      : trafficLight === 'yellow'
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <section
      className="flex shrink-0 flex-col gap-2 rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-elevated,#fff)] p-3 dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-elevated)]"
      style={{ maxHeight: 180 }}
      aria-label={ariaLabel ?? 'At-a-glance appropriateness summary'}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${circleColor} text-lg font-bold text-white`}
          role="img"
          aria-label={`Score ${score} out of 9, ${trafficLight}`}
        >
          {score}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
            {verdict}
          </p>
          {safety && (
            <div className="mt-1 flex items-center gap-1.5 text-red-600 dark:text-red-400" role="status" aria-label="Safety concerns present">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-xs font-medium">Safety concerns</span>
            </div>
          )}
        </div>
      </div>
      {topFactor && (
        <p className="text-[13px] font-normal text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
          Primary reason: {topFactor.feature}
        </p>
      )}
    </section>
  );
}
