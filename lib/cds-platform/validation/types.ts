/**
 * @file types.ts
 * @description Types for retrospective validation: historical cases, metrics, reports.
 */

import type { ClinicalScenario } from '@/lib/cds-platform/types';

/** Data source for historical cases (synthetic or future: external DB) */
export type DataSource = 'synthetic' | 'external';

/** One historical imaging case with expert label and optional outcome */
export interface HistoricalCase {
  caseId: string;
  scenario: ClinicalScenario;
  actualOrder: {
    modality: string;
    bodySite: string;
    indication: string;
  };
  expertLabel: {
    appropriatenessScore: number; // 1-9 from expert panel
    category: 'appropriate' | 'uncertain' | 'inappropriate';
    raterCount: number;
    interRaterAgreement: number; // Fleiss' kappa
  };
  outcome?: {
    orderChanged: boolean;
    alternativeOrdered?: string;
    clinicalOutcome?: string;
  };
}

/** Result of running ARKA prediction on one case */
export interface PredictionResult {
  caseId: string;
  score: number;
  category: string;
  confidence: number;
  modelVersion: string;
  /** Binary: appropriate (score >= 7) vs not */
  predictedAppropriate: boolean;
}

/** Configuration for a validation run */
export interface ValidationConfig {
  nSamples?: number;
  modelVersion?: string;
  includeSubgroups?: boolean;
  dataSource?: DataSource;
}

/** Metrics for a subgroup (e.g. by modality) */
export interface SubgroupMetrics {
  n: number;
  rmse: number;
  mae: number;
  accuracy3Class: number;
  aucRoc: number;
  sensitivity: number;
  specificity: number;
  precision: number;
  recall: number;
  f1: number;
}

/** Full validation metrics */
export interface ValidationMetrics {
  rmse: number;
  mae: number;
  r_squared: number;
  spearman_rho: number;
  accuracy_3class: number;
  confusion_matrix_3class: number[][];
  precision_per_class: Record<string, number>;
  recall_per_class: Record<string, number>;
  f1_per_class: Record<string, number>;
  auc_roc: number;
  auc_pr: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  calibration_slope: number;
  calibration_intercept: number;
  brier_score: number;
  metrics_by_modality: Record<string, SubgroupMetrics>;
  metrics_by_indication: Record<string, SubgroupMetrics>;
  metrics_by_age_group: Record<string, SubgroupMetrics>;
  /** Pediatric (&lt;18), adult (18–64), older adult (65+) for fairness reporting. */
  metrics_by_age_fairness: Record<string, SubgroupMetrics>;
  metrics_by_sex: Record<string, SubgroupMetrics>;
  metrics_by_confidence: Record<string, SubgroupMetrics>;
  false_negative_rate_safety: number;
  safety_alert_sensitivity: number;
  n_total: number;
  n_per_class: Record<string, number>;
  statistical_power: number;
}

/** One subgroup section in the report */
export interface SubgroupReport {
  name: string;
  key: string;
  metrics: SubgroupMetrics;
  n: number;
}

/** Full validation report */
export interface ValidationReport {
  summary: {
    overallPerformance: 'excellent' | 'good' | 'acceptable' | 'needs_improvement';
    aucRoc: number;
    accuracy3Class: number;
    keyFindings: string[];
    limitations: string[];
    recommendations: string[];
  };
  detailedMetrics: ValidationMetrics;
  calibrationPlotData: { predicted: number[]; actual: number[] };
  rocCurveData: { fpr: number[]; tpr: number[]; thresholds: number[] };
  confusionMatrixData: { matrix: number[][]; labels: string[] };
  subgroupAnalysis: SubgroupReport[];
  generatedAt: string;
  modelVersion: string;
  datasetVersion: string;
}
