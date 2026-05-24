/**
 * Standard override reasons for CDS alert dismissal (FDA Criterion 3).
 * Neutral option is listed first to avoid coercion.
 */

/** Clinician-selectable reason when overriding a CDS recommendation. */
export interface OverrideReason {
  id: string;
  label: string;
  rationale: string;
  citationId?: string;
}

/**
 * Ordered override reasons — neutral / chart-gap option first (Criterion 3).
 */
export const STANDARD_OVERRIDE_REASONS: OverrideReason[] = [
  {
    id: 'clinical-judgment-unrecorded',
    label: 'Clinical judgment based on findings not captured in chart',
    rationale:
      'Use when your assessment relies on bedside findings, collateral history, or clinical nuance that is not yet documented in the EHR (for example, evolving neuro exam, atypical presentation, or information learned outside the record). This preserves clinician autonomy without implying the CDS output was wrong.',
  },
  {
    id: 'patient-preference',
    label: 'Patient preference after informed discussion',
    rationale:
      'Use after shared decision-making when the patient accepts tradeoffs (timing, radiation, contrast, cost, or access) and still wants the study or a different option than the CDS suggestion. Documents respect for autonomy and informed consent rather than guideline deviation alone.',
  },
  {
    id: 'specialist-recommendation',
    label: 'Specialist recommendation outside the modelled scenario',
    rationale:
      'Use when a consultant has directed a specific modality, protocol, or interval that the local appropriateness model does not fully capture (subspecialty pathway, trial protocol, or post-procedural surveillance plan). Indicates external expert intent rather than dismissal of safety alerts.',
  },
  {
    id: 'symptom-escalation',
    label: 'Symptom escalation since last documentation',
    rationale:
      'Use when the patient\'s condition has worsened or new red-flag symptoms appeared after the last note or problem list update, so prior conservative-management assumptions no longer apply. Supports timely imaging when the chart timeline lags clinical reality.',
  },
  {
    id: 'other',
    label: 'Other (free text — recorded for QI, not blocking)',
    rationale:
      'Use for uncommon but valid circumstances not covered above. Free-text detail is stored for quality improvement and audit sampling; it does not block order entry. Avoid using this option when a more specific reason applies.',
  },
];
