/**
 * @file retrospective-validator.ts
 * @description Retrospective validation pipeline: load historical data, run ARKA predictions,
 *   compute metrics, and generate validation report.
 */

import { XGBoostClient, DEFAULT_ML_SERVICE_URL } from '@/lib/cds-platform/ml/xgboost-client';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import { generateSyntheticHistoricalData } from './synthetic-data-generator';
import { computeMetrics, rocCurveData, calibrationPlotData } from './metrics-calculator';
import type {
  DataSource,
  HistoricalCase,
  PredictionResult,
  ValidationConfig,
  ValidationMetrics,
  ValidationReport,
  SubgroupReport,
} from './types';

const DEFAULT_MODEL_VERSION = '1.0.0-rulebased';
const DATASET_VERSION = 'synthetic-v1';

/**
 * Retrospective validator: runs the full validation pipeline against historical cases.
 */
export class RetrospectiveValidator {
  private readonly client: XGBoostClient;

  constructor(mlBaseUrl?: string) {
    this.client = new XGBoostClient({
      baseUrl: mlBaseUrl ?? DEFAULT_ML_SERVICE_URL,
      timeout: 15000,
      retryCount: 2,
    });
  }

  /**
   * Run the full validation pipeline.
   */
  async runValidation(config: ValidationConfig): Promise<ValidationReport> {
    const nSamples = config.nSamples ?? 1000;
    const dataSource = config.dataSource ?? 'synthetic';
    const includeSubgroups = config.includeSubgroups !== false;

    const cases = await this.loadHistoricalData(dataSource, nSamples);
    const predictions = await this.runPredictions(cases);
    const metrics = computeMetrics(predictions, cases);
    const report = buildReportWithPlotData(
      metrics,
      predictions,
      cases,
      { ...config, nSamples, includeSubgroups }
    );
    return report;
  }

  /**
   * Step 1: Load historical imaging data.
   * For now, generates synthetic data matching real-world distributions.
   */
  async loadHistoricalData(source: DataSource, n: number): Promise<HistoricalCase[]> {
    if (source === 'synthetic') {
      return generateSyntheticHistoricalData(n);
    }
    return generateSyntheticHistoricalData(n);
  }

  /**
   * Step 2: Run ARKA predictions on each historical case.
   */
  async runPredictions(cases: HistoricalCase[]): Promise<PredictionResult[]> {
    const scenarios: ClinicalScenario[] = cases.map((c) => c.scenario);
    let predictions: MLPrediction[];
    try {
      predictions = await this.client.predictBatch(scenarios);
    } catch {
      const { scoreScenario } = await import('@/lib/cds-platform/scoring-fallback');
      predictions = scenarios.map((s) => scoreScenario(s));
    }
    const modelVersion = predictions[0]?.modelVersion ?? DEFAULT_MODEL_VERSION;
    return predictions.map((p, i) => ({
      caseId: cases[i]!.caseId,
      score: p.score,
      category: p.category,
      confidence: p.confidence,
      modelVersion,
      predictedAppropriate: p.score >= 7,
    }));
  }

  /**
   * Step 3: Compare predictions against expert labels (done inside computeMetrics).
   * Exposed for testing or custom pipelines.
   */
  computeMetrics(predictions: PredictionResult[], cases: HistoricalCase[]): ValidationMetrics {
    return computeMetrics(predictions, cases);
  }

  /**
   * Step 4: Generate the validation report.
   */
  generateReport(
    metrics: ValidationMetrics,
    config: ValidationConfig & { nSamples?: number; includeSubgroups?: boolean }
  ): ValidationReport {
    const modelVersion = config.modelVersion ?? DEFAULT_MODEL_VERSION;
    const keyFindings: string[] = [];
    const limitations: string[] = [];
    const recommendations: string[] = [];

    if (metrics.auc_roc >= 0.85) keyFindings.push('AUC-ROC meets target (>0.85).');
    else keyFindings.push(`AUC-ROC (${metrics.auc_roc.toFixed(3)}) below target 0.85.`);
    keyFindings.push(`3-class accuracy: ${(metrics.accuracy_3class * 100).toFixed(1)}%.`);
    keyFindings.push(`Calibration slope: ${metrics.calibration_slope.toFixed(3)} (target ~1.0).`);
    keyFindings.push(`Brier score: ${metrics.brier_score.toFixed(4)} (lower is better).`);

    limitations.push('Validation uses synthetic data; real-world performance may differ.');
    limitations.push('Expert labels are from ARKA AIIE Evidence Base, not external criteria.');
    if ((config.nSamples ?? 0) < 500) limitations.push('Small sample size may limit statistical power.');

    if (metrics.auc_roc < 0.85) recommendations.push('Consider model retraining or feature refinement to improve AUC-ROC.');
    if (metrics.calibration_slope < 0.9 || metrics.calibration_slope > 1.1) recommendations.push('Review calibration (e.g. Platt scaling) to align predicted scores with expert rates.');
    if (metrics.false_negative_rate_safety > 0.1) recommendations.push('Improve sensitivity for safety-critical inappropriate orders.');

    let overallPerformance: ValidationReport['summary']['overallPerformance'] = 'acceptable';
    if (metrics.auc_roc >= 0.9 && metrics.accuracy_3class >= 0.75) overallPerformance = 'excellent';
    else if (metrics.auc_roc >= 0.85 && metrics.accuracy_3class >= 0.7) overallPerformance = 'good';
    else if (metrics.auc_roc < 0.75 || metrics.accuracy_3class < 0.5) overallPerformance = 'needs_improvement';

    const subgroupAnalysis: SubgroupReport[] = [];
    if (config.includeSubgroups !== false) {
      for (const [key, m] of Object.entries(metrics.metrics_by_modality)) {
        if (m && m.n > 0) subgroupAnalysis.push({ name: `Modality: ${key}`, key: `modality-${key}`, metrics: m, n: m.n });
      }
      for (const [key, m] of Object.entries(metrics.metrics_by_indication)) {
        if (m && m.n > 0) subgroupAnalysis.push({ name: `Indication: ${key}`, key: `indication-${key}`, metrics: m, n: m.n });
      }
      for (const [key, m] of Object.entries(metrics.metrics_by_age_group)) {
        if (m && m.n > 0) subgroupAnalysis.push({ name: `Age: ${key}`, key: `age-${key}`, metrics: m, n: m.n });
      }
      for (const [key, m] of Object.entries(metrics.metrics_by_age_fairness)) {
        if (m && m.n > 0) {
          subgroupAnalysis.push({ name: `Age band: ${key}`, key: `fairness-age-${key}`, metrics: m, n: m.n });
        }
      }
      for (const [key, m] of Object.entries(metrics.metrics_by_sex)) {
        if (m && m.n > 0) subgroupAnalysis.push({ name: `Sex: ${key}`, key: `fairness-sex-${key}`, metrics: m, n: m.n });
      }
      const regulatoryModalityLabels: Array<{ keys: string[]; label: string }> = [
        { keys: ['CT', 'CT with contrast'], label: 'CT' },
        { keys: ['MRI', 'MRI with contrast'], label: 'MRI' },
        { keys: ['Ultrasound'], label: 'US' },
        { keys: ['X-ray'], label: 'XR' },
      ];
      for (const { keys, label } of regulatoryModalityLabels) {
        let combined: SubgroupReport['metrics'] | undefined;
        let totalN = 0;
        for (const modKey of keys) {
          const m = metrics.metrics_by_modality[modKey];
          if (m && m.n > 0) {
            totalN += m.n;
            combined = combined ?
              {
                ...combined,
                n: combined.n + m.n,
                aucRoc: (combined.aucRoc * combined.n + m.aucRoc * m.n) / (combined.n + m.n),
              }
            : m;
          }
        }
        if (combined && totalN > 0) {
          subgroupAnalysis.push({
            name: `Modality: ${label}`,
            key: `fairness-modality-${label}`,
            metrics: { ...combined, n: totalN },
            n: totalN,
          });
        }
      }
    }

    const confusionLabels = ['inappropriate', 'uncertain', 'appropriate'];

    return {
      summary: {
        overallPerformance,
        aucRoc: metrics.auc_roc,
        accuracy3Class: metrics.accuracy_3class,
        keyFindings,
        limitations,
        recommendations,
      },
      detailedMetrics: metrics,
      calibrationPlotData: { predicted: [], actual: [] },
      rocCurveData: { fpr: [0, 1], tpr: [0, 1], thresholds: [9, 1] },
      confusionMatrixData: {
        matrix: metrics.confusion_matrix_3class,
        labels: confusionLabels,
      },
      subgroupAnalysis,
      generatedAt: new Date().toISOString(),
      modelVersion,
      datasetVersion: DATASET_VERSION,
    };
  }
}

/**
 * Run validation and attach plot data (calibration, ROC) from the same predictions/cases.
 * Call this when you have already run the pipeline and want report with curves.
 */
export function buildReportWithPlotData(
  metrics: ValidationMetrics,
  predictions: PredictionResult[],
  cases: HistoricalCase[],
  config: ValidationConfig & { nSamples?: number; includeSubgroups?: boolean }
): ValidationReport {
  const validator = new RetrospectiveValidator();
  const report = validator.generateReport(metrics, config);
  report.calibrationPlotData = calibrationPlotData(predictions, cases);
  report.rocCurveData = rocCurveData(predictions, cases);
  return report;
}
