/**
 * @file rules.ts
 * @description Clinical alerting rules: thresholds and conditions that map score + context to alerts.
 */

import type { Alert } from './types';

/** Score is 1–9 (CDS appropriateness scale). */
const WARNING_MAX = 6;
const CRITICAL_MAX = 3;

/**
 * Evaluates clinical rules against score and optional scenario to produce alerts.
 * Used by tiered-engine to build the list of alerts.
 * @param score - Appropriateness score (1–9)
 * @returns Array of Alert (info, warning, critical)
 */
export function evaluateRules(score: number): Alert[] {
  const alerts: Alert[] = [];
  if (score <= CRITICAL_MAX) {
    alerts.push({
      tier: 'critical',
      code: 'LOW_APPROPRIATENESS',
      summary: 'This imaging order may not be appropriate for the clinical scenario.',
      detail:
        'Evidence suggests lower appropriateness (score 1–3). Consider alternative imaging or non-imaging workup.',
      suggestionLabel: 'Review alternatives',
      // TODO(fda-criterion-2): LOW_APPROPRIATENESS — seed ACR/Choosing Wisely citation in citations/index.ts
    });
  } else if (score <= WARNING_MAX) {
    alerts.push({
      tier: 'warning',
      code: 'MAY_BE_APPROPRIATE',
      summary: 'This order may be appropriate; consider alternatives.',
      detail:
        'Moderate appropriateness (score 4–6). Review clinical indication and alternative options.',
      suggestionLabel: 'See alternatives',
      // TODO(fda-criterion-2): MAY_BE_APPROPRIATE — seed ACR appropriateness citation in citations/index.ts
    });
  } else {
    alerts.push({
      tier: 'info',
      code: 'APPROPRIATE',
      summary: 'Imaging order appears appropriate.',
      detail: 'High appropriateness score (7–9). Proceed if clinically indicated.',
      // TODO(fda-criterion-2): APPROPRIATE — seed ACR appropriateness citation in citations/index.ts
    });
  }
  return alerts;
}

/**
 * Returns the default threshold for "warning" (score below this triggers warning).
 * Score scale 1–9; warning when score <= 6.
 */
export function getWarningThreshold(): number {
  return WARNING_MAX;
}

/**
 * Returns the default threshold for "critical" (score below this triggers critical).
 * Score scale 1–9; critical when score <= 3.
 */
export function getCriticalThreshold(): number {
  return CRITICAL_MAX;
}
