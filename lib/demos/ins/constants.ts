/**
 * ARKA-INS demo – workflow steps and config
 */

export const DEMO_STEPS_10 = [
  { id: 1, name: "Patient & Payer Selection", isNew: false },
  { id: 2, name: "Order Entry", isNew: false },
  { id: 3, name: "Pre-Submission Analysis", isNew: false },
  { id: 4, name: "Appeal Risk Prediction", isNew: true },
  { id: 5, name: "Documentation Assistant", isNew: false },
  { id: 6, name: "RBM Criteria Mapping", isNew: false },
  { id: 7, name: "Gold Card Check", isNew: true },
  { id: 8, name: "CMS Compliance Verification", isNew: true },
  { id: 9, name: "Human-in-the-Loop Review", isNew: false },
  { id: 10, name: "Submit / Appeal Generator", isNew: false },
] as const;

export const ANIMATION_DURATION = { FAST: 150, NORMAL: 300, SLOW: 500 } as const;
