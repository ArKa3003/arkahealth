/**
 * @file acceptance-predictor.ts
 * @description Phase 12: Alert acceptance rate prediction model. Predicts whether a clinician
 *   will accept or override a CDS alert to reduce alert fatigue (tier/presentation adjustment).
 */

import type { TieredAlert, AlertCategory } from './types';
import { AlertCategory as Category, AlertTierEnum } from './types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';

// =============================================================================
// Types
// =============================================================================

/** Context about the clinician and session for acceptance prediction */
export interface ClinicianContext {
  clinicianId?: string;
  clinicianSpecialty: string;
  clinicianExperienceLevel: 'attending' | 'resident' | 'fellow';
  clinicianOverrideHistory: number; // 0–1
  clinicianAlertFatigue: number; // Alerts seen in last hour
  timeOfDay: number; // 0–23
  dayOfWeek: number; // 0–6
  /** Optional: concurrent alerts in this response (for fatigue) */
  numberOfConcurrentAlerts?: number;
  /** Optional: alerts already shown this session */
  priorAlertCountThisSession?: number;
  /** Optional: system-wide acceptance for this alert type */
  sameAlertTypeAcceptanceRate?: number;
  /** Optional: acceptance for this indication */
  sameIndicationAcceptanceRate?: number;
}

/** Extracted features for the acceptance prediction model */
export interface AcceptanceFeatures {
  alertTier: number; // 1–4
  alertCategory: string;
  appropriatenessScore: number;
  scoreConfidence: number;
  numberOfConcurrentAlerts: number;
  clinicalUrgency: number; // 0–3
  isEmergencyDepartment: boolean;
  patientAcuity: number;
  clinicianSpecialty: string;
  clinicianExperienceLevel: string;
  clinicianOverrideHistory: number;
  clinicianAlertFatigue: number;
  timeOfDay: number;
  dayOfWeek: number;
  sameAlertTypeAcceptanceRate: number;
  sameIndicationAcceptanceRate: number;
  priorAlertCountThisSession: number;
}

/** Recommendation for how to present the alert */
export type AcceptanceRecommendation = 'show_as_is' | 'downgrade_tier' | 'suppress' | 'enhance_nudge';

/** Output of the acceptance prediction */
export interface AcceptancePrediction {
  acceptanceProbability: number;
  confidenceInterval: [number, number];
  keyDrivers: string[];
  recommendation: AcceptanceRecommendation;
}

/** Single recorded outcome for adaptive learning */
interface AlertOutcome {
  alertId: string;
  accepted: boolean;
  overrideReason?: string;
  category: string;
  clinicianId?: string;
  timestamp: number;
}

/** Analytics exported by the predictor */
export interface AcceptanceAnalytics {
  overallAcceptanceRate: number;
  acceptanceByCategory: Record<string, number>;
  acceptanceByClinician: Record<string, number>;
  acceptanceByTimeOfDay: number[];
  suppressionRate: number;
  adjustmentRate: number;
  alertFatigueIndex: number;
  topOverrideReasons: Array<{ reason: string; count: number }>;
}

// =============================================================================
// Helpers
// =============================================================================

const TIER_TO_NUM: Record<string, number> = {
  [AlertTierEnum.PASSIVE]: 1,
  [AlertTierEnum.ACTIVE_INFO]: 2,
  [AlertTierEnum.ACTIVE_WARNING]: 3,
  [AlertTierEnum.INTERRUPTIVE]: 4,
};

const SAFETY_CATEGORIES = new Set<string>([
  Category.PATIENT_SAFETY,
  Category.CONTRAST_SAFETY,
]);

function parseAppropriatenessScoreFromAlert(alert: TieredAlert): { score: number; confidence: number } {
  const evidence = alert.evidenceBasis ?? '';
  const match = evidence.match(/score\s+(\d+)\s*\/\s*9/i) ?? evidence.match(/(\d+)\s*\/\s*9/);
  if (match) {
    const score = Math.max(1, Math.min(9, parseInt(match[1], 10)));
    return { score, confidence: 0.85 };
  }
  return { score: 5, confidence: 0.5 };
}

function urgencyToNumber(urgency: string | undefined): number {
  if (!urgency) return 0;
  const u = String(urgency).toLowerCase();
  if (u === 'routine') return 0;
  if (u === 'urgent') return 1;
  if (u === 'asap') return 2;
  if (u === 'stat') return 3;
  return 0;
}

// =============================================================================
// AlertAcceptancePredictor
// =============================================================================

const ROLLING_MAX = 500;
const DEFAULT_ACCEPTANCE_RATE = 0.5;

export class AlertAcceptancePredictor {
  private outcomes: AlertOutcome[] = [];
  private suppressionCount = 0;
  private adjustmentCount = 0;
  private totalPredictionCount = 0;

  /**
   * Extract features for acceptance prediction from alert, scenario, and clinician context.
   */
  extractAcceptanceFeatures(
    alert: TieredAlert,
    scenario: ClinicalScenario,
    clinicianContext: ClinicianContext
  ): AcceptanceFeatures {
    const { score: appropriatenessScore, confidence: scoreConfidence } =
      parseAppropriatenessScoreFromAlert(alert);
    const urgency = scenario.proposedImaging?.urgency;
    const clinicalUrgency = urgencyToNumber(urgency);
    const isED = (scenario as Record<string, unknown>).isEmergencyDepartment === true;
    const patientAcuity = Math.min(
      3,
      clinicalUrgency + (scenario.redFlags?.length ? 1 : 0)
    );
    const concurrent = clinicianContext.numberOfConcurrentAlerts ?? 0;
    const priorInSession = clinicianContext.priorAlertCountThisSession ?? 0;

    return {
      alertTier: TIER_TO_NUM[alert.tier] ?? 2,
      alertCategory: alert.category,
      appropriatenessScore,
      scoreConfidence,
      numberOfConcurrentAlerts: concurrent,
      clinicalUrgency,
      isEmergencyDepartment: isED,
      patientAcuity,
      clinicianSpecialty: clinicianContext.clinicianSpecialty,
      clinicianExperienceLevel: clinicianContext.clinicianExperienceLevel,
      clinicianOverrideHistory: clinicianContext.clinicianOverrideHistory,
      clinicianAlertFatigue: clinicianContext.clinicianAlertFatigue,
      timeOfDay: clinicianContext.timeOfDay,
      dayOfWeek: clinicianContext.dayOfWeek,
      sameAlertTypeAcceptanceRate: clinicianContext.sameAlertTypeAcceptanceRate ?? DEFAULT_ACCEPTANCE_RATE,
      sameIndicationAcceptanceRate: clinicianContext.sameIndicationAcceptanceRate ?? DEFAULT_ACCEPTANCE_RATE,
      priorAlertCountThisSession: priorInSession,
    };
  }

  /**
   * Rule-based prediction of acceptance probability and presentation recommendation.
   */
  predictAcceptance(features: AcceptanceFeatures): AcceptancePrediction {
    const drivers: string[] = [];
    const isSafety = SAFETY_CATEGORIES.has(features.alertCategory);

    // Safety alerts: high acceptance unless repeated override pattern
    if (isSafety) {
      let prob = 0.88;
      if (features.clinicianOverrideHistory > 0.7) {
        prob = 0.75;
        drivers.push('Clinician has high override history for safety alerts');
      } else {
        drivers.push('Safety alert — high baseline acceptance');
      }
      const ci: [number, number] = [Math.max(0, prob - 0.08), Math.min(1, prob + 0.08)];
      return {
        acceptanceProbability: prob,
        confidenceInterval: ci,
        keyDrivers: drivers,
        recommendation: 'show_as_is',
      };
    }

    // Duplicate imaging
    if (features.alertCategory === Category.DUPLICATE_IMAGING) {
      let prob = 0.7;
      const evidence = features.sameAlertTypeAcceptanceRate;
      if (evidence > 0.6) {
        prob += 0.1;
        drivers.push('Exact/similar duplicate — higher acceptance when same study');
      } else if (evidence < 0.4) {
        prob -= 0.2;
        drivers.push('Different body site interpretation — lower acceptance');
      }
      prob = this.applyTimeAndSessionPenalties(prob, features, drivers);
      const ci: [number, number] = [Math.max(0, prob - 0.1), Math.min(1, prob + 0.1)];
      return {
        acceptanceProbability: Math.max(0, Math.min(1, prob)),
        confidenceInterval: ci,
        keyDrivers: drivers,
        recommendation: this.recommendationFromProbability(prob, isSafety),
      };
    }

    // Appropriateness score 7–9 (confirming appropriate)
    if (features.appropriatenessScore >= 7 && features.appropriatenessScore <= 9) {
      const prob = 0.95;
      drivers.push('High appropriateness score — confirming appropriate');
      const ci: [number, number] = [0.9, 1];
      return {
        acceptanceProbability: prob,
        confidenceInterval: ci,
        keyDrivers: drivers,
        recommendation: 'show_as_is',
      };
    }

    // Appropriateness score 1–3 (inappropriate)
    if (features.appropriatenessScore >= 1 && features.appropriatenessScore <= 3) {
      let prob = 0.6;
      if (features.scoreConfidence >= 0.8) {
        prob += 0.1;
        drivers.push('Strong evidence (high confidence)');
      }
      if (features.clinicianOverrideHistory > 0.6) {
        prob -= 0.15;
        drivers.push('Clinician has high override rate');
      }
      if (features.numberOfConcurrentAlerts > 2) {
        const penalty = 0.1 * (features.numberOfConcurrentAlerts - 2);
        prob -= Math.min(0.2, penalty);
        drivers.push('Multiple concurrent alerts');
      }
      const fatiguePenalty = 0.05 * Math.max(0, features.priorAlertCountThisSession);
      prob -= Math.min(0.15, fatiguePenalty);
      if (fatiguePenalty > 0) drivers.push('Session alert fatigue');
      prob = this.applyTimeAndSessionPenalties(prob, features, drivers);
      const ci: [number, number] = [Math.max(0, prob - 0.12), Math.min(1, prob + 0.12)];
      return {
        acceptanceProbability: Math.max(0, Math.min(1, prob)),
        confidenceInterval: ci,
        keyDrivers: drivers,
        recommendation: this.recommendationFromProbability(prob, isSafety),
      };
    }

    // Appropriateness score 4–6 (uncertain)
    if (features.appropriatenessScore >= 4 && features.appropriatenessScore <= 6) {
      let prob = 0.35;
      if (features.sameIndicationAcceptanceRate > 0.5 || features.sameAlertTypeAcceptanceRate > 0.5) {
        prob += 0.15;
        drivers.push('Clear alternative available / indication often accepted');
      }
      if (features.isEmergencyDepartment) {
        prob -= 0.1;
        drivers.push('ED setting — time pressure');
      }
      if (features.clinicianOverrideHistory > 0.6) {
        prob -= 0.1;
        drivers.push('Clinician has high override rate');
      }
      prob = this.applyTimeAndSessionPenalties(prob, features, drivers);
      const ci: [number, number] = [Math.max(0, prob - 0.12), Math.min(1, prob + 0.12)];
      return {
        acceptanceProbability: Math.max(0, Math.min(1, prob)),
        confidenceInterval: ci,
        keyDrivers: drivers,
        recommendation: this.recommendationFromProbability(prob, isSafety),
      };
    }

    // Radiation, cost, alternative_available, etc.
    let prob = 0.5;
    prob = this.applyTimeAndSessionPenalties(prob, features, drivers);
    const ci: [number, number] = [Math.max(0, prob - 0.15), Math.min(1, prob + 0.15)];
    return {
      acceptanceProbability: Math.max(0, Math.min(1, prob)),
      confidenceInterval: ci,
      keyDrivers: drivers.length ? drivers : ['Default heuristic'],
      recommendation: this.recommendationFromProbability(prob, isSafety),
    };
  }

  private applyTimeAndSessionPenalties(
    prob: number,
    features: AcceptanceFeatures,
    drivers: string[]
  ): number {
    // Time-of-day penalty: 2am–6am
    const hour = features.timeOfDay;
    if (hour >= 2 && hour <= 6) {
      prob -= 0.05;
      drivers.push('Late night shift — fatigue');
    }
    // Session fatigue: beyond 3 alerts
    if (features.priorAlertCountThisSession > 3) {
      const penalty = 0.03 * (features.priorAlertCountThisSession - 3);
      prob -= Math.min(0.2, penalty);
      if (!drivers.some((d) => d.includes('Session'))) {
        drivers.push('Session alert fatigue');
      }
    }
    return prob;
  }

  private recommendationFromProbability(
    prob: number,
    _isSafety: boolean
  ): AcceptanceRecommendation {
    if (prob > 0.8) return 'show_as_is';
    if (prob < 0.05) return 'suppress';
    if (prob < 0.15) return 'downgrade_tier';
    if (prob >= 0.15 && prob <= 0.5) return 'enhance_nudge';
    return 'show_as_is';
  }

  /**
   * Record outcome for adaptive learning (in-memory rolling store).
   */
  recordOutcome(alertId: string, accepted: boolean, overrideReason?: string): void {
    const outcome: AlertOutcome = {
      alertId,
      accepted,
      overrideReason,
      category: '', // Caller can enrich; we infer from alerts when used with category
      timestamp: Date.now(),
    };
    this.outcomes.push(outcome);
    if (this.outcomes.length > ROLLING_MAX) {
      this.outcomes = this.outcomes.slice(-ROLLING_MAX);
    }
  }

  /**
   * Record outcome with category and optional clinician for analytics.
   */
  recordOutcomeWithContext(
    alertId: string,
    accepted: boolean,
    category: AlertCategory,
    overrideReason?: string,
    clinicianId?: string
  ): void {
    this.outcomes.push({
      alertId,
      accepted,
      overrideReason,
      category,
      clinicianId,
      timestamp: Date.now(),
    });
    if (this.outcomes.length > ROLLING_MAX) {
      this.outcomes = this.outcomes.slice(-ROLLING_MAX);
    }
  }

  /**
   * Get rolling acceptance rate for a category, optionally for a specific clinician.
   */
  getHistoricalAcceptanceRate(category: AlertCategory, clinicianId?: string): number {
    const filtered = this.outcomes.filter(
      (o) => o.category === category && (clinicianId == null || o.clinicianId === clinicianId)
    );
    if (filtered.length === 0) return DEFAULT_ACCEPTANCE_RATE;
    const accepted = filtered.filter((o) => o.accepted).length;
    return accepted / filtered.length;
  }

  /** Record that a prediction led to suppression (for analytics). */
  recordSuppression(): void {
    this.suppressionCount++;
    this.totalPredictionCount++;
  }

  /** Record that a prediction led to tier adjustment (for analytics). */
  recordAdjustment(): void {
    this.adjustmentCount++;
    this.totalPredictionCount++;
  }

  /** Record that a prediction was made (for analytics). */
  recordPrediction(): void {
    this.totalPredictionCount++;
  }

  /**
   * Export analytics for dashboards and tuning.
   */
  getAcceptanceAnalytics(): AcceptanceAnalytics {
    const byCategory: Record<string, number> = {};
    const byClinician: Record<string, number> = {};
    const byHour = new Array<number>(24).fill(0);
    const hourCounts = new Array<number>(24).fill(0);
    const overrideReasonCounts: Record<string, number> = {};

    let acceptedTotal = 0;
    for (const o of this.outcomes) {
      if (o.accepted) acceptedTotal++;
      if (o.category) {
        if (!byCategory[o.category]) byCategory[o.category] = 0;
        byCategory[o.category]++;
      }
      if (o.clinicianId) {
        if (!byClinician[o.clinicianId]) byClinician[o.clinicianId] = 0;
        byClinician[o.clinicianId]++;
      }
      const hour = new Date(o.timestamp).getHours();
      byHour[hour] += o.accepted ? 1 : 0;
      hourCounts[hour]++;
      if (o.overrideReason) {
        overrideReasonCounts[o.overrideReason] = (overrideReasonCounts[o.overrideReason] ?? 0) + 1;
      }
    }

    const overallAcceptanceRate =
      this.outcomes.length > 0 ? acceptedTotal / this.outcomes.length : 0;

    const acceptanceByCategory: Record<string, number> = {};
    for (const cat of Object.keys(byCategory)) {
      const total = this.outcomes.filter((o) => o.category === cat).length;
      const accepted = this.outcomes.filter((o) => o.category === cat && o.accepted).length;
      acceptanceByCategory[cat] = total > 0 ? accepted / total : 0;
    }

    const acceptanceByClinician: Record<string, number> = {};
    for (const cid of Object.keys(byClinician)) {
      const total = this.outcomes.filter((o) => o.clinicianId === cid).length;
      const accepted = this.outcomes.filter((o) => o.clinicianId === cid && o.accepted).length;
      acceptanceByClinician[cid] = total > 0 ? accepted / total : 0;
    }

    const acceptanceByTimeOfDay = byHour.map((a, i) =>
      hourCounts[i] > 0 ? a / hourCounts[i] : 0
    );

    const suppressionRate =
      this.totalPredictionCount > 0 ? this.suppressionCount / this.totalPredictionCount : 0;
    const adjustmentRate =
      this.totalPredictionCount > 0 ? this.adjustmentCount / this.totalPredictionCount : 0;

    const alertFatigueIndex =
      this.outcomes.length > 0
        ? Math.min(
            1,
            this.outcomes.filter((o) => !o.accepted).length / Math.max(1, this.outcomes.length) * 1.2
          )
        : 0;

    const topOverrideReasons = Object.entries(overrideReasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      overallAcceptanceRate,
      acceptanceByCategory,
      acceptanceByClinician,
      acceptanceByTimeOfDay,
      suppressionRate,
      adjustmentRate,
      alertFatigueIndex,
      topOverrideReasons,
    };
  }
}

// =============================================================================
// Integration: adjust alert tier from prediction
// =============================================================================

/**
 * Whether the alert should be suppressed from display based on acceptance prediction.
 * Callers should omit the alert from the displayed list when this returns true.
 */
export function shouldSuppressAlert(
  alert: TieredAlert,
  prediction: AcceptancePrediction
): boolean {
  const isSafety =
    alert.category === Category.PATIENT_SAFETY || alert.category === Category.CONTRAST_SAFETY;
  if (isSafety) return false;
  return prediction.acceptanceProbability < 0.05 && prediction.recommendation === 'suppress';
}

/**
 * Adjust alert tier based on acceptance prediction. Never suppresses or downgrades
 * safety alerts (patient_safety, contrast_safety). When recommendation is 'suppress',
 * use shouldSuppressAlert() to omit the alert from the displayed list.
 */
export function adjustAlertTier(
  alert: TieredAlert,
  prediction: AcceptancePrediction
): TieredAlert {
  const isSafety =
    alert.category === Category.PATIENT_SAFETY || alert.category === Category.CONTRAST_SAFETY;
  if (isSafety) return alert;

  const prob = prediction.acceptanceProbability;

  if (prob < 0.05 && prediction.recommendation === 'suppress') {
    return { ...alert, tier: AlertTierEnum.PASSIVE as TieredAlert['tier'], suppressible: true };
  }

  if (prob < 0.15 && prediction.recommendation === 'downgrade_tier') {
    if (alert.tier === (AlertTierEnum.ACTIVE_WARNING as TieredAlert['tier'])) {
      return { ...alert, tier: AlertTierEnum.ACTIVE_INFO as TieredAlert['tier'] };
    }
  }

  if (prediction.recommendation === 'enhance_nudge' && alert.detail) {
    return {
      ...alert,
      message: alert.message + ' Consider reviewing evidence before overriding.',
      detail: alert.detail,
    };
  }

  return alert;
}
