/**
 * @file metrics-calculator.ts
 * @description Statistical metrics for retrospective validation: RMSE, MAE, R²,
 *   AUC-ROC, confusion matrix, precision/recall/F1, calibration, Brier, Spearman, power.
 */

import type { PredictionResult } from './types';
import type { HistoricalCase } from './types';
import type { ValidationMetrics, SubgroupMetrics } from './types';

const APPROPRIATE_THRESHOLD = 7;
const CLASS_LABELS = ['inappropriate', 'uncertain', 'appropriate'];

function scoreToCategory(score: number): string {
  if (score >= 7) return 'appropriate';
  if (score >= 4) return 'uncertain';
  return 'inappropriate';
}

/** RMSE */
export function rmse(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length === 0) return 0;
  const sumSq = predicted.reduce((acc, p, i) => acc + (p - (actual[i] ?? 0)) ** 2, 0);
  return Math.sqrt(sumSq / predicted.length);
}

/** MAE */
export function mae(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length === 0) return 0;
  const sum = predicted.reduce((acc, p, i) => acc + Math.abs(p - (actual[i] ?? 0)), 0);
  return sum / predicted.length;
}

/** R² (coefficient of determination) */
export function rSquared(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length < 2) return 0;
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  const ssTot = actual.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  if (ssTot === 0) return 0;
  const ssRes = predicted.reduce((acc, p, i) => acc + ((actual[i] ?? 0) - p) ** 2, 0);
  return 1 - ssRes / ssTot;
}

/** Spearman rank correlation */
export function spearmanRank(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const rank = (arr: number[]) => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array<number>(n);
    let r = 1;
    for (let i = 0; i < n; i++) {
      let j = i;
      while (j + 1 < n && sorted[j + 1]!.v === sorted[j]!.v) j++;
      const midRank = (r + r + (j - i)) / 2;
      for (let k = i; k <= j; k++) ranks[sorted[k]!.i] = midRank;
      r += j - i + 1;
      i = j;
    }
    return ranks;
  };
  const rx = rank(x);
  const ry = rank(y);
  const meanRx = rx.reduce((a, b) => a + b, 0) / n;
  const meanRy = ry.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = (rx[i] ?? 0) - meanRx;
    const dy = (ry[i] ?? 0) - meanRy;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

/** Build confusion matrix [true class][predicted class], 3 classes: inappropriate, uncertain, appropriate */
function confusionMatrix3Class(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): number[][] {
  const matrix: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const classIdx = (c: string) => {
    const i = CLASS_LABELS.indexOf(c);
    return i >= 0 ? i : 1;
  };
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  for (const p of predictions) {
    const c = caseMap.get(p.caseId);
    if (!c) continue;
    const trueIdx = classIdx(c.expertLabel.category);
    const predCat = scoreToCategory(p.score);
    const predIdx = classIdx(predCat);
    matrix[trueIdx]![predIdx] = (matrix[trueIdx]![predIdx] ?? 0) + 1;
  }
  return matrix;
}

/** Accuracy for 3-class */
function accuracy3Class(matrix: number[][]): number {
  let correct = 0;
  let total = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const v = matrix[i]?.[j] ?? 0;
      total += v;
      if (i === j) correct += v;
    }
  }
  return total === 0 ? 0 : correct / total;
}

/** Per-class precision, recall, F1 from confusion matrix */
function perClassMetrics(matrix: number[][]): {
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1: Record<string, number>;
} {
  const precision: Record<string, number> = {};
  const recall: Record<string, number> = {};
  const f1: Record<string, number> = {};
  for (let k = 0; k < 3; k++) {
    const label = CLASS_LABELS[k]!;
    let rowSum = 0;
    let colSum = 0;
    for (let j = 0; j < 3; j++) rowSum += matrix[k]?.[j] ?? 0;
    for (let i = 0; i < 3; i++) colSum += matrix[i]?.[k] ?? 0;
    const tp = matrix[k]?.[k] ?? 0;
    precision[label] = colSum === 0 ? 0 : tp / colSum;
    recall[label] = rowSum === 0 ? 0 : tp / rowSum;
    const p = precision[label]!;
    const r = recall[label]!;
    f1[label] = p + r === 0 ? 0 : (2 * p * r) / (p + r);
  }
  return { precision, recall, f1 };
}

/** AUC-ROC by trapezoidal integration (binary: appropriate vs not, threshold 7) */
export function aucRoc(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): number {
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  const pairs: { score: number; actual: number }[] = predictions
    .map((p) => {
      const c = caseMap.get(p.caseId);
      if (!c) return null;
      const actual = c.expertLabel.appropriatenessScore >= APPROPRIATE_THRESHOLD ? 1 : 0;
      return { score: p.score, actual };
    })
    .filter((x): x is { score: number; actual: number } => x !== null);
  if (pairs.length === 0) return 0;
  pairs.sort((a, b) => b.score - a.score);
  const thresholds = [...new Set(pairs.map((p) => p.score))].sort((a, b) => b - a);
  const nPos = pairs.filter((p) => p.actual === 1).length;
  const nNeg = pairs.length - nPos;
  if (nPos === 0 || nNeg === 0) return 0.5;
  const tpr: number[] = [0];
  const fpr: number[] = [0];
  let tp = 0;
  let fp = 0;
  for (const t of thresholds) {
    for (const p of pairs) {
      if (p.score >= t) {
        if (p.actual === 1) tp++;
        else fp++;
      }
    }
    tpr.push(tp / nPos);
    fpr.push(fp / nNeg);
  }
  tpr.push(1);
  fpr.push(1);
  let area = 0;
  for (let i = 1; i < fpr.length; i++) {
    area += ((fpr[i]! - (fpr[i - 1] ?? 0)) * ((tpr[i]! + (tpr[i - 1] ?? 0)) / 2));
  }
  return 1 - area;
}

/** AUC-PR (precision-recall) trapezoidal */
export function aucPr(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): number {
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  const pairs: { score: number; actual: number }[] = predictions
    .map((p) => {
      const c = caseMap.get(p.caseId);
      if (!c) return null;
      const actual = c.expertLabel.appropriatenessScore >= APPROPRIATE_THRESHOLD ? 1 : 0;
      return { score: p.score, actual };
    })
    .filter((x): x is { score: number; actual: number } => x !== null);
  if (pairs.length === 0) return 0;
  pairs.sort((a, b) => b.score - a.score);
  const nPos = pairs.filter((p) => p.actual === 1).length;
  if (nPos === 0) return 0;
  let tp = 0;
  let fp = 0;
  let area = 0;
  let prevPrec = 1;
  let prevRec = 0;
  for (const p of pairs) {
    if (p.actual === 1) tp++;
    else fp++;
    const prec = tp / (tp + fp);
    const rec = tp / nPos;
    area += (rec - prevRec) * ((prec + prevPrec) / 2);
    prevPrec = prec;
    prevRec = rec;
  }
  return area;
}

/** Sensitivity (TPR), Specificity (TNR), PPV, NPV for binary at threshold 7 */
function binaryMetrics(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): { sensitivity: number; specificity: number; ppv: number; npv: number } {
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;
  for (const p of predictions) {
    const c = caseMap.get(p.caseId);
    if (!c) continue;
    const actualPos = c.expertLabel.appropriatenessScore >= APPROPRIATE_THRESHOLD;
    const predPos = p.predictedAppropriate;
    if (actualPos && predPos) tp++;
    else if (!actualPos && !predPos) tn++;
    else if (!actualPos && predPos) fp++;
    else fn++;
  }
  const sensitivity = tp + fn === 0 ? 0 : tp / (tp + fn);
  const specificity = tn + fp === 0 ? 0 : tn / (tn + fp);
  const ppv = tp + fp === 0 ? 0 : tp / (tp + fp);
  const npv = tn + fn === 0 ? 0 : tn / (tn + fn);
  return { sensitivity, specificity, ppv, npv };
}

/** Binned calibration: 10 bins, return slope and intercept of predicted vs actual */
function calibrationSlopeIntercept(
  predicted: number[],
  actual: number[]
): { slope: number; intercept: number; binnedPred: number[]; binnedActual: number[] } {
  if (predicted.length !== actual.length || predicted.length === 0) {
    return { slope: 0, intercept: 0, binnedPred: [], binnedActual: [] };
  }
  const nBins = 10;
  const bins: { p: number[]; a: number[] }[] = Array.from({ length: nBins }, () => ({ p: [], a: [] }));
  const sorted = predicted
    .map((p, i) => ({ p, a: actual[i] ?? 0 }))
    .sort((x, y) => x.p - y.p);
  const binSize = Math.ceil(sorted.length / nBins) || 1;
  for (let i = 0; i < sorted.length; i++) {
    const binIdx = Math.min(Math.floor(i / binSize), nBins - 1);
    bins[binIdx]!.p.push(sorted[i]!.p);
    bins[binIdx]!.a.push(sorted[i]!.a);
  }
  const binnedPred: number[] = [];
  const binnedActual: number[] = [];
  for (const b of bins) {
    if (b.p.length > 0) {
      binnedPred.push(b.p.reduce((s, x) => s + x, 0) / b.p.length);
      binnedActual.push(b.a.reduce((s, x) => s + x, 0) / b.a.length);
    }
  }
  const n = binnedPred.length;
  if (n < 2) return { slope: 1, intercept: 0, binnedPred, binnedActual };
  const meanP = binnedPred.reduce((a, b) => a + b, 0) / n;
  const meanA = binnedActual.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dp = (binnedPred[i] ?? 0) - meanP;
    const da = (binnedActual[i] ?? 0) - meanA;
    num += dp * da;
    den += dp * dp;
  }
  const slope = den === 0 ? 1 : num / den;
  const intercept = meanA - slope * meanP;
  return { slope, intercept, binnedPred, binnedActual };
}

/** Brier score: mean squared error of predicted probability vs actual binary */
function brierScore(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): number {
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  let sum = 0;
  let count = 0;
  for (const p of predictions) {
    const c = caseMap.get(p.caseId);
    if (!c) continue;
    const actual = c.expertLabel.appropriatenessScore >= APPROPRIATE_THRESHOLD ? 1 : 0;
    const prob = Math.max(0, Math.min(1, (p.score - 1) / 8));
    sum += (prob - actual) ** 2;
    count++;
  }
  return count === 0 ? 0 : sum / count;
}

/** Statistical power (simplified: based on n and effect size assumption for AUC) */
function statisticalPowerSimple(n: number, auc: number): number {
  if (n < 30) return Math.min(0.99, 0.3 + (n / 100) * (auc - 0.5) * 2);
  const effect = Math.abs(auc - 0.5);
  return Math.min(0.99, Math.max(0.1, 0.5 + effect * Math.log1p(n / 50)));
}

/** N per class (3-class labels) */
function nPerClass(cases: HistoricalCase[]): Record<string, number> {
  const out: Record<string, number> = { inappropriate: 0, uncertain: 0, appropriate: 0 };
  for (const c of cases) {
    const k = c.expertLabel.category;
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Subgroup metrics helper */
function subgroupMetricsFromPairs(
  predScores: number[],
  predBinary: boolean[],
  actualScores: number[],
  actualCategories: string[]
): SubgroupMetrics {
  const n = predScores.length;
  if (n === 0) {
    return {
      n: 0,
      rmse: 0,
      mae: 0,
      accuracy3Class: 0,
      aucRoc: 0,
      sensitivity: 0,
      specificity: 0,
      precision: 0,
      recall: 0,
      f1: 0,
    };
  }
  const predCats = predScores.map((s) => scoreToCategory(s));
  const matrix: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const classIdx = (c: string) => Math.max(0, CLASS_LABELS.indexOf(c));
  for (let i = 0; i < n; i++) {
    const ti = classIdx(actualCategories[i]!);
    const pi = classIdx(predCats[i]!);
    matrix[ti]![pi] = (matrix[ti]![pi] ?? 0) + 1;
  }
  let tp = 0,
    fp = 0,
    fn = 0,
    tn = 0;
  const actualBin = actualScores.map((s) => s >= APPROPRIATE_THRESHOLD ? 1 : 0);
  for (let i = 0; i < n; i++) {
    if (actualBin[i] === 1 && predBinary[i]) tp++;
    else if (actualBin[i] === 0 && predBinary[i]) fp++;
    else if (actualBin[i] === 1 && !predBinary[i]) fn++;
    else tn++;
  }
  return {
    n,
    rmse: rmse(predScores, actualScores),
    mae: mae(predScores, actualScores),
    accuracy3Class: accuracy3Class(matrix),
    aucRoc: 0.5, // placeholder for subgroup; could compute if needed
    sensitivity: tp + fn === 0 ? 0 : tp / (tp + fn),
    specificity: tn + fp === 0 ? 0 : tn / (tn + fp),
    precision: tp + fp === 0 ? 0 : tp / (tp + fp),
    recall: tp + fn === 0 ? 0 : tp / (tp + fn),
    f1: tp + fp + fn === 0 ? 0 : (2 * tp) / (2 * tp + fp + fn),
  };
}

/**
 * Compute full validation metrics from predictions and historical cases.
 */
export function computeMetrics(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): ValidationMetrics {
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  const predScores = predictions.map((p) => p.score);
  const actualScoresFull = predictions.map((p) => caseMap.get(p.caseId)?.expertLabel.appropriatenessScore ?? 5);

  const matrix = confusionMatrix3Class(predictions, cases);
  const { precision, recall, f1 } = perClassMetrics(matrix);
  const bin = binaryMetrics(predictions, cases);
  const cal = calibrationSlopeIntercept(predScores, actualScoresFull);
  const roc = aucRoc(predictions, cases);
  const pr = aucPr(predictions, cases);

  const metricsByModality: Record<string, SubgroupMetrics> = {};
  const metricsByIndication: Record<string, SubgroupMetrics> = {};
  const metricsByAgeGroup: Record<string, SubgroupMetrics> = {};
  const metricsByConfidence: Record<string, SubgroupMetrics> = {};

  for (const mod of ['X-ray', 'CT', 'MRI', 'Ultrasound', 'Other']) {
    const idx = predictions
      .map((p, i) => {
        const c = cases.find((x) => x.caseId === p.caseId);
        const m = c?.actualOrder?.modality ?? '';
        return (m === mod || (mod === 'Other' && !['X-ray', 'CT', 'MRI', 'Ultrasound'].includes(m))) ? i : -1;
      })
      .filter((i) => i >= 0);
    if (idx.length > 0) {
      const subPred = idx.map((i) => predictions[i]!);
      const subCases = idx.map((i) => cases.find((c) => c.caseId === predictions[i]!.caseId)!).filter(Boolean);
      metricsByModality[mod] = subgroupMetricsFromPairs(
        subPred.map((p) => p.score),
        subPred.map((p) => p.predictedAppropriate),
        subCases.map((c) => c.expertLabel.appropriatenessScore),
        subCases.map((c) => c.expertLabel.category)
      );
      metricsByModality[mod]!.aucRoc = aucRoc(subPred, subCases);
    }
  }

  const indications = ['Low back pain', 'Headache', 'Abdominal pain', 'Chest pain', 'Other'];
  for (const ind of indications) {
    const subPred = predictions.filter((p) => {
      const c = caseMap.get(p.caseId);
      const indVal = c?.actualOrder?.indication ?? c?.scenario?.chiefComplaint ?? '';
      return ind === 'Other' ? !indications.slice(0, -1).some((i) => indVal.includes(i)) : indVal.includes(ind);
    });
    const subCases = subPred.map((p) => caseMap.get(p.caseId)!).filter(Boolean);
    if (subCases.length > 0) {
      metricsByIndication[ind] = subgroupMetricsFromPairs(
        subPred.map((p) => p.score),
        subPred.map((p) => p.predictedAppropriate),
        subCases.map((c) => c.expertLabel.appropriatenessScore),
        subCases.map((c) => c.expertLabel.category)
      );
      metricsByIndication[ind]!.aucRoc = aucRoc(subPred, subCases);
    }
  }

  const ageGroups = ['<40', '40-60', '>60'];
  for (const ag of ageGroups) {
    const subPred = predictions.filter((p) => {
      const c = caseMap.get(p.caseId);
      const age = c?.scenario?.age ?? 50;
      if (ag === '<40') return age < 40;
      if (ag === '40-60') return age >= 40 && age <= 60;
      return age > 60;
    });
    const subCases = subPred.map((p) => caseMap.get(p.caseId)!).filter(Boolean);
    if (subCases.length > 0) {
      metricsByAgeGroup[ag] = subgroupMetricsFromPairs(
        subPred.map((p) => p.score),
        subPred.map((p) => p.predictedAppropriate),
        subCases.map((c) => c.expertLabel.appropriatenessScore),
        subCases.map((c) => c.expertLabel.category)
      );
      metricsByAgeGroup[ag]!.aucRoc = aucRoc(subPred, subCases);
    }
  }

  const confGroups = ['low', 'medium', 'high'];
  for (const cg of confGroups) {
    const subPred = predictions.filter((p) => {
      if (cg === 'low') return p.confidence < 0.5;
      if (cg === 'medium') return p.confidence >= 0.5 && p.confidence < 0.8;
      return p.confidence >= 0.8;
    });
    const subCases = subPred.map((p) => caseMap.get(p.caseId)!).filter(Boolean);
    if (subCases.length > 0) {
      metricsByConfidence[cg] = subgroupMetricsFromPairs(
        subPred.map((p) => p.score),
        subPred.map((p) => p.predictedAppropriate),
        subCases.map((c) => c.expertLabel.appropriatenessScore),
        subCases.map((c) => c.expertLabel.category)
      );
      metricsByConfidence[cg]!.aucRoc = aucRoc(subPred, subCases);
    }
  }

  const n = predictions.length;
  return {
    rmse: rmse(predScores, actualScoresFull),
    mae: mae(predScores, actualScoresFull),
    r_squared: rSquared(predScores, actualScoresFull),
    spearman_rho: spearmanRank(predScores, actualScoresFull),
    accuracy_3class: accuracy3Class(matrix),
    confusion_matrix_3class: matrix,
    precision_per_class: precision,
    recall_per_class: recall,
    f1_per_class: f1,
    auc_roc: roc,
    auc_pr: pr,
    sensitivity: bin.sensitivity,
    specificity: bin.specificity,
    ppv: bin.ppv,
    npv: bin.npv,
    calibration_slope: cal.slope,
    calibration_intercept: cal.intercept,
    brier_score: brierScore(predictions, cases),
    metrics_by_modality: metricsByModality,
    metrics_by_indication: metricsByIndication,
    metrics_by_age_group: metricsByAgeGroup,
    metrics_by_confidence: metricsByConfidence,
    false_negative_rate_safety: 1 - bin.sensitivity,
    safety_alert_sensitivity: bin.sensitivity,
    n_total: n,
    n_per_class: nPerClass(cases),
    statistical_power: statisticalPowerSimple(n, roc),
  };
}

/** Build ROC curve data (fpr, tpr, thresholds) for plotting */
export function rocCurveData(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): { fpr: number[]; tpr: number[]; thresholds: number[] } {
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  const pairs: { score: number; actual: number }[] = predictions
    .map((p) => {
      const c = caseMap.get(p.caseId);
      if (!c) return null;
      const actual = c.expertLabel.appropriatenessScore >= APPROPRIATE_THRESHOLD ? 1 : 0;
      return { score: p.score, actual };
    })
    .filter((x): x is { score: number; actual: number } => x !== null);
  if (pairs.length === 0) return { fpr: [0, 1], tpr: [0, 1], thresholds: [1, 9] };
  const nPos = pairs.filter((p) => p.actual === 1).length;
  const nNeg = pairs.length - nPos;
  if (nPos === 0 || nNeg === 0) return { fpr: [0, 1], tpr: [0, 1], thresholds: [9, 1] };
  pairs.sort((a, b) => b.score - a.score);
  const thresholds = [...new Set(pairs.map((p) => p.score))].sort((a, b) => b - a);
  const fpr: number[] = [0];
  const tpr: number[] = [0];
  let tp = 0;
  let fp = 0;
  for (const t of thresholds) {
    for (const p of pairs) {
      if (p.score >= t) {
        if (p.actual === 1) tp++;
        else fp++;
      }
    }
    tpr.push(tp / nPos);
    fpr.push(fp / nNeg);
  }
  tpr.push(1);
  fpr.push(1);
  return { fpr, tpr, thresholds: [9, ...thresholds, 1] };
}

/** Calibration plot data (binned predicted vs actual) */
export function calibrationPlotData(
  predictions: PredictionResult[],
  cases: HistoricalCase[]
): { predicted: number[]; actual: number[] } {
  const caseMap = new Map(cases.map((c) => [c.caseId, c]));
  const predScores = predictions.map((p) => p.score);
  const actualScores = predictions.map((p) => caseMap.get(p.caseId)?.expertLabel.appropriatenessScore ?? 5);
  const { binnedPred, binnedActual } = calibrationSlopeIntercept(predScores, actualScores);
  return { predicted: binnedPred, actual: binnedActual };
}
