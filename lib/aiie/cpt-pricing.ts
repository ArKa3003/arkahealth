/**
 * Imaging CPT display strings and heuristic allowed amounts for OOP modeling.
 * Amounts are planning estimates only; contracted rates vary by market and plan.
 */

const CPT_DESCRIPTIONS: Record<string, string> = {
  "70551": "MRI brain without contrast",
  "70552": "MRI brain with contrast",
  "70553": "MRI brain without contrast followed by with contrast",
  "72148": "MRI lumbar spine without contrast",
  "73721": "MRI lower extremity joint without contrast",
  "74150": "CT abdomen without contrast",
  "74176": "CT abdomen and pelvis without contrast",
  "74177": "CT abdomen and pelvis with contrast",
  "71250": "CT thorax without contrast",
  "71260": "CT thorax with contrast",
  "71270": "CT thorax without contrast followed by with contrast",
  "72125": "X-ray cervical spine 2–3 views",
  "73030": "X-ray shoulder complete",
  "76604": "Ultrasound chest (non-cardiac)",
};

/**
 * Returns a short procedure description for a CPT code when known.
 *
 * @param cptCode - Procedure code.
 */
export function describeImagingCpt(cptCode: string): string {
  const key = cptCode.replace(/\D/g, "").slice(0, 5);
  if (CPT_DESCRIPTIONS[key]) {
    return CPT_DESCRIPTIONS[key];
  }
  return "Diagnostic imaging service";
}

/**
 * Heuristic Medicare-style allowed amount for benefit math when a payer-specific rate is unknown.
 *
 * @param cptCode - Procedure code.
 */
export function estimatedInNetworkAllowedForCpt(cptCode: string): number {
  const key = cptCode.replace(/\D/g, "").slice(0, 5);
  const direct = CPT_ALLOWED_OVERRIDES[key];
  if (direct != null) {
    return direct;
  }
  const n = parseInt(key, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return 1200;
  }
  if (n >= 70000 && n < 71000) {
    return 950;
  }
  if (n >= 71000 && n < 72000) {
    return 1400;
  }
  if (n >= 72000 && n < 73000) {
    return 1100;
  }
  if (n >= 73000 && n < 74000) {
    return 850;
  }
  if (n >= 74000 && n < 75000) {
    return 1650;
  }
  if (n >= 76000 && n < 77000) {
    return 450;
  }
  return 1200;
}

const CPT_ALLOWED_OVERRIDES: Record<string, number> = {
  "70553": 2400,
  "70551": 1900,
  "72148": 1600,
  "73721": 1400,
  "74176": 1750,
  "74177": 2100,
};
