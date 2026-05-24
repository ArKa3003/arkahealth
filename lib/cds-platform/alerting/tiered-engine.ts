/**
 * @file tiered-engine.ts
 * @description Tiered alert classification (info / warning / critical) from score and rules.
 *   Phase 5: TieredAlertEngine class for tiered alert framework and alert fatigue management.
 */

import { v4 as uuidv4 } from 'uuid';
import type { TieredEngineInput, TieredEngineOutput, Alert, CardIndicatorTier } from './types';
import type { AlertEngineConfig, TieredAlert } from './types';
import {
  AlertTierEnum as TierEnum,
  AlertCategory as Category,
  STANDARD_OVERRIDE_OPTIONS,
} from './types';
import { evaluateRules } from './rules';
import type { MLPrediction } from '../ml/types';
import type { ClinicalScenario } from '@/lib/cds-platform/types';

// -----------------------------------------------------------------------------
// TieredAlertEngine (Phase 5)
// -----------------------------------------------------------------------------

const DEFAULT_MAX_ALERTS = 3;
const ACCEPTANCE_DOWNGRADE_THRESHOLD = 0.1;
const PEDIATRIC_AGE_YEARS = 18;
const CT_STUDIES_WARNING_THRESHOLD = 3;
const DUPLICATE_DAYS_EXACT = 7;
const DUPLICATE_DAYS_SAME_MODALITY = 30;
const DUPLICATE_DAYS_DIFFERENT_MODALITY = 14;

/** In-memory session suppression keys (caller may pass a Set to persist). */
const defaultSuppressedKeys = new Set<string>();

/**
 * Tiered alerting framework: classifies alerts by severity and manages alert fatigue.
 */
export class TieredAlertEngine {
  private config: Required<Pick<AlertEngineConfig, 'maxAlerts' | 'acceptanceDowngradeThreshold' | 'suppressDuplicates'>>;
  private suppressedKeys: Set<string>;

  constructor(config: AlertEngineConfig = {}) {
    this.config = {
      maxAlerts: config.maxAlerts ?? DEFAULT_MAX_ALERTS,
      acceptanceDowngradeThreshold: config.acceptanceDowngradeThreshold ?? ACCEPTANCE_DOWNGRADE_THRESHOLD,
      suppressDuplicates: config.suppressDuplicates ?? true,
    };
    this.suppressedKeys = defaultSuppressedKeys;
  }

  /**
   * Main entry: takes prediction + scenario + hook type, returns prioritized TieredAlerts.
   */
  generateAlerts(
    prediction: MLPrediction,
    scenario: ClinicalScenario,
    hookType: 'order-select' | 'order-sign'
  ): TieredAlert[] {
    const alerts: TieredAlert[] = [];

    const appropriateness = this.classifyAppropriatenessAlert(prediction, scenario, hookType);
    alerts.push(appropriateness);

    const safety = this.generateSafetyAlerts(scenario);
    alerts.push(...safety);

    const duplicate = this.generateDuplicateAlert(scenario);
    if (duplicate) alerts.push(duplicate);

    const contrast = this.generateContrastAlert(scenario);
    if (contrast) alerts.push(contrast);

    const radiation = this.generateRadiationAlert(scenario);
    if (radiation) alerts.push(radiation);

    const alternative = this.generateAlternativeAlert(prediction, scenario);
    if (alternative) alerts.push(alternative);

    let result = this.applySuppressionRules(alerts);
    result = this.prioritizeAlerts(result);
    result = this.limitAlertCount(result, this.config.maxAlerts);
    return result;
  }

  private classifyAppropriatenessAlert(
    prediction: MLPrediction,
    scenario: ClinicalScenario,
    hookType: 'order-select' | 'order-sign'
  ): TieredAlert {
    const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
    const modality = scenario.proposedImaging?.modality ?? 'Imaging';
    const indication = scenario.proposedImaging?.indication ?? scenario.chiefComplaint ?? 'this indication';
    let tier: TieredAlert['tier'];
    let title: string;
    let message: string;
    let detail: string | undefined;
    let actionRequired: boolean;
    let actions: TieredAlert['actions'];
    let overrideOptions: TieredAlert['overrideOptions'];
    let suppressible: boolean;
    const evidenceBasis = `AIIE/ML appropriateness score ${score}/9.`;
    let predictedAcceptanceRate: number | undefined;

    if (score >= 7 && score <= 9) {
      tier = TierEnum.PASSIVE as TieredAlert['tier'];
      title = 'Order appears appropriate';
      message = `This imaging order appears appropriate for the clinical scenario (score ${score}/9).`;
      detail = 'High appropriateness score. Proceed if clinically indicated.';
      actionRequired = false;
      actions = [{ label: 'Continue', type: 'accept_recommendation', primary: true }];
      overrideOptions = undefined;
      suppressible = true;
    } else if (score >= 4 && score <= 6) {
      if (hookType === 'order-select') {
        tier = TierEnum.ACTIVE_INFO as TieredAlert['tier'];
        title = 'Uncertainty in appropriateness';
        message = `Moderate appropriateness (score ${score}/9). Consider alternatives.`;
        detail = 'Review clinical indication and alternative imaging or non-imaging options.';
        actionRequired = false;
        actions = [
          { label: 'View alternatives', type: 'view_alternatives', primary: true },
          { label: 'Continue', type: 'override', primary: false },
        ];
        overrideOptions = undefined;
        suppressible = true;
      } else {
        tier = TierEnum.ACTIVE_WARNING as TieredAlert['tier'];
        title = 'Acknowledgment recommended';
        message = `Moderate appropriateness (score ${score}/9). Please acknowledge before signing.`;
        detail = 'Consider alternatives or document reason to proceed.';
        actionRequired = true;
        actions = [
          { label: 'View alternatives', type: 'view_alternatives', primary: true },
          { label: 'Override', type: 'override', primary: false },
        ];
        overrideOptions = STANDARD_OVERRIDE_OPTIONS;
        suppressible = false;
      }
      predictedAcceptanceRate = undefined;
    } else {
      if (hookType === 'order-select') {
        tier = TierEnum.ACTIVE_WARNING as TieredAlert['tier'];
        title = 'Reconsider order';
        message = `Low appropriateness (score ${score}/9). Strong recommendation to reconsider.`;
        detail = 'Evidence suggests lower appropriateness. Consider alternative imaging or non-imaging workup.';
        actionRequired = true;
        actions = [
          { label: 'View alternatives', type: 'view_alternatives', primary: true },
          { label: 'Modify order', type: 'modify_order', primary: false },
          { label: 'Override', type: 'override', primary: false },
        ];
        overrideOptions = undefined;
        suppressible = false;
      } else {
        tier = TierEnum.INTERRUPTIVE as TieredAlert['tier'];
        title = 'Signing blocked';
        message = `Low appropriateness (score ${score}/9). Override reason required to sign.`;
        detail = 'Document override reason. Consider alternatives or non-imaging workup.';
        actionRequired = true;
        actions = [
          { label: 'View alternatives', type: 'view_alternatives', primary: true },
          { label: 'Override with reason', type: 'override', primary: true },
        ];
        overrideOptions = STANDARD_OVERRIDE_OPTIONS;
        suppressible = false;
      }
      predictedAcceptanceRate = undefined;
    }

    return {
      id: uuidv4(),
      tier,
      category: Category.APPROPRIATENESS,
      title,
      message,
      detail,
      clinicalContext: `${modality} for ${indication}.`,
      actionRequired,
      actions,
      overrideOptions,
      displayDuration: tier === TierEnum.PASSIVE ? 5000 : undefined,
      suppressible,
      suppressionKey: `appropriateness_${score}_${hookType}`,
      evidenceBasis,
      predictedAcceptanceRate,
    };
  }

  private generateSafetyAlerts(scenario: ClinicalScenario): TieredAlert[] {
    const alerts: TieredAlert[] = [];
    const mod = String(scenario.proposedImaging?.modality ?? '').toLowerCase();
    const isPregnant = scenario.pregnancyStatus === 'pregnant';
    const eGFR = scenario.renalFunction?.value;
    const hasContrastAllergy = scenario.contrastAllergy === true;

    if (isPregnant && (mod.includes('ct') || mod.includes('x-ray') || mod.includes('fluoroscopy') || mod.includes('nuclear') || mod.includes('pet'))) {
      alerts.push(this.buildSafetyAlert(
        'PREGNANCY_RADIATION',
        TierEnum.INTERRUPTIVE,
        'Pregnancy and radiation imaging',
        'Patient may be pregnant. This study involves radiation with potential risk to the fetus.',
        'Consider pregnancy status, shielding, or alternative (e.g. MRI, ultrasound).',
        false
      ));
    }

    if (isPregnant && (mod.includes('mri') && mod.includes('gadolinium'))) {
      alerts.push(this.buildSafetyAlert(
        'PREGNANCY_GADOLINIUM',
        TierEnum.ACTIVE_WARNING as TieredAlert['tier'],
        'Pregnancy and gadolinium',
        'Gadolinium crosses the placenta. Use only if benefit clearly outweighs risk.',
        'Discuss with patient and document rationale.',
        false
      ));
    }

    if (hasContrastAllergy && (mod.includes('contrast') || mod.includes('iodinated') || mod.includes('gadolinium'))) {
      alerts.push(this.buildSafetyAlert(
        'CONTRAST_ALLERGY',
        TierEnum.INTERRUPTIVE,
        'Contrast allergy',
        'Contrast allergy or prior reaction documented. This study may use contrast.',
        'Verify contrast is not contraindicated. Consider premedication or alternative modality.',
        false
      ));
    }

    if (eGFR != null && eGFR < 30 && (mod.includes('contrast') || mod.includes('iodinated'))) {
      alerts.push(this.buildSafetyAlert(
        'EGFR_SEVERE_CONTRAST',
        TierEnum.INTERRUPTIVE,
        'Severe renal impairment and contrast',
        'eGFR < 30. Iodinated contrast poses significant nephrotoxicity risk.',
        'Consider alternative imaging or nephrology consultation.',
        false
      ));
    }

    if (eGFR != null && eGFR >= 30 && eGFR < 60 && (mod.includes('contrast') || mod.includes('iodinated'))) {
      alerts.push(this.buildSafetyAlert(
        'EGFR_MODERATE_CONTRAST',
        TierEnum.ACTIVE_WARNING as TieredAlert['tier'],
        'Moderate renal impairment and contrast',
        'eGFR 30–59. Moderate risk with iodinated contrast.',
        'Consider hydration and monitoring; document benefit vs risk.',
        false
      ));
    }

    return alerts;
  }

  private buildSafetyAlert(
    code: string,
    tier: TieredAlert['tier'],
    title: string,
    message: string,
    detail: string,
    suppressible: boolean
  ): TieredAlert {
    return {
      id: uuidv4(),
      tier,
      category: Category.PATIENT_SAFETY,
      title,
      message,
      detail,
      clinicalContext: 'Patient safety.',
      actionRequired: tier === TierEnum.INTERRUPTIVE,
      actions: [
        { label: 'Acknowledge', type: 'override', primary: true },
        { label: 'Cancel order', type: 'cancel_order', primary: false },
      ],
      overrideOptions: tier === TierEnum.INTERRUPTIVE ? STANDARD_OVERRIDE_OPTIONS : undefined,
      suppressible,
      suppressionKey: `safety_${code}`,
      evidenceBasis: 'Clinical safety rules.',
    };
  }

  private generateDuplicateAlert(scenario: ClinicalScenario): TieredAlert | null {
    const prior = scenario.priorImaging ?? [];
    const proposed = scenario.proposedImaging;
    if (!proposed?.modality || !proposed?.bodyPart) return null;

    const mod = String(proposed.modality).toLowerCase();
    const body = String(proposed.bodyPart).toLowerCase();

    for (const p of prior) {
      const pMod = String(p.modality ?? '').toLowerCase();
      const pBody = String(p.bodyPart ?? '').toLowerCase();
      const daysAgo = p.daysAgo ?? 0;

      if (pMod === mod && pBody === body && daysAgo <= DUPLICATE_DAYS_EXACT) {
        return {
          id: uuidv4(),
          tier: TierEnum.INTERRUPTIVE as TieredAlert['tier'],
          category: Category.DUPLICATE_IMAGING,
          title: 'Possible duplicate imaging',
          message: `Same study (${proposed.modality}, ${proposed.bodyPart}) was performed within the last ${daysAgo} days.`,
          detail: 'Very likely duplicate. Confirm clinical need or cancel.',
          clinicalContext: 'Prior imaging within 7 days.',
          actionRequired: true,
          actions: [
            { label: 'Cancel order', type: 'cancel_order', primary: true },
            { label: 'Override', type: 'override', primary: false },
          ],
          overrideOptions: STANDARD_OVERRIDE_OPTIONS,
          suppressible: false,
          suppressionKey: `dup_exact_${mod}_${body}`,
          evidenceBasis: 'Prior imaging same modality and body site within 7 days.',
        };
      }
    }

    for (const p of prior) {
      const pMod = String(p.modality ?? '').toLowerCase();
      const pBody = String(p.bodyPart ?? '').toLowerCase();
      const daysAgo = p.daysAgo ?? 0;
      if (pMod === mod && pBody === body && daysAgo <= DUPLICATE_DAYS_SAME_MODALITY) {
        return {
          id: uuidv4(),
          tier: TierEnum.ACTIVE_WARNING as TieredAlert['tier'],
          category: Category.DUPLICATE_IMAGING,
          title: 'Possible duplicate (same modality, body site)',
          message: `Similar study within 30 days. Confirm need.`,
          detail: 'Same modality and body site within 30 days.',
          clinicalContext: 'Prior imaging.',
          actionRequired: true,
          actions: [
            { label: 'View prior', type: 'view_alternatives', primary: false },
            { label: 'Override', type: 'override', primary: true },
          ],
          overrideOptions: STANDARD_OVERRIDE_OPTIONS,
          suppressible: true,
          suppressionKey: `dup_same_${mod}_${body}`,
          evidenceBasis: 'Same modality and body site within 30 days.',
        };
      }
    }

    for (const p of prior) {
      const pBody = String(p.bodyPart ?? '').toLowerCase();
      const daysAgo = p.daysAgo ?? 0;
      if (pBody === body && daysAgo <= DUPLICATE_DAYS_DIFFERENT_MODALITY) {
        return {
          id: uuidv4(),
          tier: TierEnum.ACTIVE_INFO as TieredAlert['tier'],
          category: Category.DUPLICATE_IMAGING,
          title: 'Recent imaging of same body site',
          message: `Different modality imaging of same body site within 14 days.`,
          detail: 'Informational: same body site, different modality.',
          clinicalContext: 'Prior imaging.',
          actionRequired: false,
          actions: [{ label: 'Continue', type: 'accept_recommendation', primary: true }],
          displayDuration: 5000,
          suppressible: true,
          suppressionKey: `dup_body_${body}`,
          evidenceBasis: 'Same body site, different modality within 14 days.',
        };
      }
    }

    return null;
  }

  private generateContrastAlert(scenario: ClinicalScenario): TieredAlert | null {
    const mod = String(scenario.proposedImaging?.modality ?? '').toLowerCase();
    if (!mod.includes('contrast') && !mod.includes('iodinated') && !mod.includes('gadolinium')) return null;
    if (scenario.contrastAllergy || (scenario.renalFunction?.value != null && scenario.renalFunction.value < 60)) {
      return null;
    }
    return null;
  }

  private generateRadiationAlert(scenario: ClinicalScenario): TieredAlert | null {
    const mod = String(scenario.proposedImaging?.modality ?? '').toLowerCase();
    const age = scenario.age ?? 0;
    const prior = scenario.priorImaging ?? [];
    const ctCount = prior.filter((p) => String(p.modality ?? '').toLowerCase().includes('ct')).length;
    const isPediatric = age > 0 && age < PEDIATRIC_AGE_YEARS;

    if ((mod.includes('ct') || mod.includes('nuclear')) && isPediatric) {
      return {
        id: uuidv4(),
        tier: TierEnum.ACTIVE_WARNING as TieredAlert['tier'],
        category: Category.RADIATION_EXPOSURE,
        title: 'Pediatric radiation exposure',
        message: 'CT or nuclear medicine in a pediatric patient. Elevated radiation sensitivity.',
        detail: 'Consider dose reduction and alternative modalities when appropriate.',
        clinicalContext: `Patient age ${age} years.`,
        actionRequired: true,
        actions: [
          { label: 'View alternatives', type: 'view_alternatives', primary: true },
          { label: 'Override', type: 'override', primary: false },
        ],
        overrideOptions: STANDARD_OVERRIDE_OPTIONS,
        suppressible: false,
        suppressionKey: 'radiation_pediatric',
        evidenceBasis: 'Pediatric patient; radiation sensitivity.',
      };
    }

    if (mod.includes('ct') && ctCount >= CT_STUDIES_WARNING_THRESHOLD) {
      return {
        id: uuidv4(),
        tier: TierEnum.ACTIVE_WARNING as TieredAlert['tier'],
        category: Category.RADIATION_EXPOSURE,
        title: 'Cumulative CT exposure',
        message: `Multiple CT studies in past 12 months (${ctCount}+). Consider cumulative exposure.`,
        detail: 'Review necessity and alternatives.',
        clinicalContext: 'Prior CT studies.',
        actionRequired: true,
        actions: [
          { label: 'Continue', type: 'override', primary: true },
          { label: 'View alternatives', type: 'view_alternatives', primary: false },
        ],
        overrideOptions: STANDARD_OVERRIDE_OPTIONS,
        suppressible: true,
        suppressionKey: 'radiation_multiple_ct',
        evidenceBasis: 'Multiple CT studies in 12 months.',
      };
    }

    return null;
  }

  private generateAlternativeAlert(prediction: MLPrediction, scenario: ClinicalScenario): TieredAlert | null {
    const score = Math.round(Math.max(1, Math.min(9, prediction.score)));
    if (score >= 7) return null;
    const modality = scenario.proposedImaging?.modality ?? 'Imaging';
    const indication = scenario.proposedImaging?.indication ?? scenario.chiefComplaint ?? 'indication';
    return {
      id: uuidv4(),
      tier: TierEnum.ACTIVE_INFO as TieredAlert['tier'],
      category: Category.ALTERNATIVE_AVAILABLE,
      title: 'Alternative imaging available',
      message: `Consider alternative modalities or non-imaging workup for ${indication}.`,
      detail: `Current order: ${modality}. Evidence suggests reviewing alternatives.`,
      clinicalContext: `${modality} for ${indication}.`,
      actionRequired: false,
      actions: [
        { label: 'View alternatives', type: 'view_alternatives', primary: true },
        { label: 'Continue', type: 'accept_recommendation', primary: false },
      ],
      suppressible: true,
      suppressionKey: 'alternative_available',
      evidenceBasis: `Appropriateness score ${score}/9.`,
      predictedAcceptanceRate: undefined,
    };
  }

  private applySuppressionRules(alerts: TieredAlert[]): TieredAlert[] {
    const threshold = this.config.acceptanceDowngradeThreshold;
    let result = alerts.map((a) => {
      if (
        a.tier === (TierEnum.ACTIVE_WARNING as TieredAlert['tier']) &&
        a.category !== Category.PATIENT_SAFETY &&
        a.predictedAcceptanceRate != null &&
        a.predictedAcceptanceRate < threshold
      ) {
        return { ...a, tier: TierEnum.ACTIVE_INFO as TieredAlert['tier'] };
      }
      return a;
    });

    if (!this.config.suppressDuplicates) return result;
    const seen = new Set<string>();
    return result.filter((a) => {
      if (!a.suppressionKey) return true;
      if (a.suppressible && seen.has(a.suppressionKey)) return false;
      if (a.suppressionKey) seen.add(a.suppressionKey);
      if (a.suppressible && this.suppressedKeys.has(a.suppressionKey)) return false;
      return true;
    });
  }

  private prioritizeAlerts(alerts: TieredAlert[]): TieredAlert[] {
    const tierOrder: Record<TieredAlert['tier'], number> = {
      [TierEnum.INTERRUPTIVE]: 0,
      [TierEnum.ACTIVE_WARNING]: 1,
      [TierEnum.ACTIVE_INFO]: 2,
      [TierEnum.PASSIVE]: 3,
    };
    const categoryOrder: Record<Category, number> = {
      [Category.PATIENT_SAFETY]: 0,
      [Category.APPROPRIATENESS]: 1,
      [Category.DUPLICATE_IMAGING]: 2,
      [Category.RADIATION_EXPOSURE]: 3,
      [Category.CONTRAST_SAFETY]: 4,
      [Category.COST_EFFECTIVENESS]: 5,
      [Category.ALTERNATIVE_AVAILABLE]: 6,
    };
    return [...alerts].sort((a, b) => {
      const t = tierOrder[a.tier] - tierOrder[b.tier];
      if (t !== 0) return t;
      return categoryOrder[a.category] - categoryOrder[b.category];
    });
  }

  private limitAlertCount(alerts: TieredAlert[], maxAlerts: number): TieredAlert[] {
    const allTier4 = alerts.every((a) => a.tier === TierEnum.INTERRUPTIVE);
    if (allTier4) return alerts;
    return alerts.slice(0, maxAlerts);
  }
}

// -----------------------------------------------------------------------------
// Legacy API (runTieredEngine, getHighestTier)
// -----------------------------------------------------------------------------

/**
 * Classifies alerts into tiers and returns the list to show in CDS cards (legacy).
 * @param input - Score and optional scenario summary
 * @returns TieredEngineOutput with alerts array
 */
export function runTieredEngine(input: TieredEngineInput): TieredEngineOutput {
  const alerts = evaluateRules(input.score, input.scenarioSummary);
  const byTier = (a: Alert, b: Alert) => {
    const order: Record<CardIndicatorTier, number> = { critical: 0, warning: 1, info: 2 };
    return order[a.tier] - order[b.tier];
  };
  return { alerts: [...alerts].sort(byTier) };
}

/**
 * Returns the highest tier in a list of alerts (critical > warning > info).
 * @param alerts - Array of alerts
 * @returns Highest CardIndicatorTier or 'info'
 */
export function getHighestTier(alerts: Alert[]): CardIndicatorTier {
  if (alerts.some((a) => a.tier === 'critical')) return 'critical';
  if (alerts.some((a) => a.tier === 'warning')) return 'warning';
  return 'info';
}
