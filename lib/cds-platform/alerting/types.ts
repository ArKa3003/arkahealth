/**
 * @file types.ts
 * @description Alerting type definitions: tier levels, rule output, acceptance predictor input/output,
 *   tiered alert framework (TieredAlert, AlertTier, AlertCategory, etc.).
 */

import type { CDSSuggestionAction } from '../cds-hooks/types';
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';

// =============================================================================
// Legacy tiered engine (score → info/warning/critical cards)
// =============================================================================

/** Card indicator tier (legacy; maps to CDS card indicator) */
export type CardIndicatorTier = 'info' | 'warning' | 'critical';

/** Single alert from the legacy tiered engine */
export interface Alert {
  tier: CardIndicatorTier;
  code: string;
  summary: string;
  detail?: string;
  /** Optional suggestion label for CDS card */
  suggestionLabel?: string;
  /** Structured evidence basis (required at card-build time; seeded in Phase 2). */
  medicalBasis?: MedicalBasis;
}

/** Input to the legacy tiered engine (score + scenario summary) */
export interface TieredEngineInput {
  score: number;
  /** Optional scenario context for rule conditions */
  scenarioSummary?: Record<string, unknown>;
}

/** Output: list of alerts to show (legacy) */
export interface TieredEngineOutput {
  alerts: Alert[];
}

/** @deprecated Use CardIndicatorTier for legacy Alert; use AlertTierEnum for TieredAlert */
export type AlertTier = CardIndicatorTier;

/** Input to acceptance predictor (e.g. alert + user/context) */
export interface AcceptancePredictorInput {
  alertCode: string;
  tier: CardIndicatorTier | TieredAlertTier;
  /** Optional user or encounter context */
  context?: Record<string, unknown>;
}

/** Predicted likelihood that the clinician will accept the recommendation (0–1) */
export interface AcceptancePredictorOutput {
  acceptanceProbability: number;
}

// =============================================================================
// Tiered Alert Framework (Phase 5)
// =============================================================================

/** Tier 1–4: passive → active info → warning → critical/interruptive */
export enum AlertTierEnum {
  PASSIVE = 'passive',
  ACTIVE_INFO = 'active_info',
  ACTIVE_WARNING = 'warning',
  INTERRUPTIVE = 'critical',
}

/** String value for tier (used in TieredAlert.tier). */
export type TieredAlertTier = `${AlertTierEnum}`;

export enum AlertCategory {
  APPROPRIATENESS = 'appropriateness',
  PATIENT_SAFETY = 'patient_safety',
  DUPLICATE_IMAGING = 'duplicate_imaging',
  CONTRAST_SAFETY = 'contrast_safety',
  RADIATION_EXPOSURE = 'radiation_exposure',
  COST_EFFECTIVENESS = 'cost_effectiveness',
  ALTERNATIVE_AVAILABLE = 'alternative_available',
}

export interface AlertAction {
  label: string;
  type: 'accept_recommendation' | 'view_alternatives' | 'override' | 'defer' | 'cancel_order' | 'modify_order';
  primary: boolean;
  fhirAction?: CDSSuggestionAction;
}

export interface OverrideOption {
  code: string;
  display: string;
  requiresDocumentation: boolean;
  documentationPrompt?: string;
}

export interface TieredAlert {
  id: string;
  tier: TieredAlertTier;
  category: AlertCategory;
  title: string;
  message: string;
  detail?: string;
  clinicalContext: string;
  actionRequired: boolean;
  actions: AlertAction[];
  overrideOptions?: OverrideOption[];
  displayDuration?: number;
  suppressible: boolean;
  suppressionKey?: string;
  evidenceBasis: string;
  predictedAcceptanceRate?: number;
}

export interface AlertEngineConfig {
  /** Max alerts per hook invocation (unless all Tier 4). Default 3. */
  maxAlerts?: number;
  /** If predicted acceptance &lt; this, downgrade WARNING to ACTIVE_INFO (non-safety). Default 0.1. */
  acceptanceDowngradeThreshold?: number;
  /** Suppress duplicate suppressionKey within session. Default true. */
  suppressDuplicates?: boolean;
}

/** Standard override reason codes for audit (Tier 4 order-sign). */
export const STANDARD_OVERRIDE_OPTIONS: OverrideOption[] = [
  { code: 'CLIN_JUDGE', display: 'Clinical judgment — benefits outweigh risks', requiresDocumentation: false },
  { code: 'ADD_INFO', display: 'Additional clinical information not captured in system', requiresDocumentation: true, documentationPrompt: 'Please document the additional information.' },
  { code: 'RAD_CONSULT', display: 'Discussed with radiologist', requiresDocumentation: true, documentationPrompt: 'Radiologist name or reference.' },
  { code: 'PT_PREF', display: 'Patient preference after informed discussion', requiresDocumentation: false },
  { code: 'EMERGENCY', display: 'Emergency/time-sensitive clinical situation', requiresDocumentation: false },
  { code: 'PROTOCOL', display: 'Following institutional protocol', requiresDocumentation: true, documentationPrompt: 'Protocol reference or name.' },
];
