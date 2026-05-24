/**
 * @file sus-survey.ts
 * @description System Usability Scale (SUS) and CDS-specific post-test questions.
 */

export interface SurveyQuestion {
  id: string;
  text: string;
}

/** Standard 10-item SUS questionnaire. */
export const SUS_QUESTIONS: SurveyQuestion[] = [
  { id: 'sus-1', text: 'I think that I would like to use this CDS system frequently.' },
  { id: 'sus-2', text: 'I found the CDS system unnecessarily complex.' },
  { id: 'sus-3', text: 'I thought the CDS system was easy to use.' },
  { id: 'sus-4', text: 'I think that I would need technical support to use this CDS system.' },
  { id: 'sus-5', text: 'I found the various functions in the CDS system were well integrated.' },
  { id: 'sus-6', text: 'I thought there was too much inconsistency in this CDS system.' },
  { id: 'sus-7', text: 'I imagine that most people would learn to use this CDS system very quickly.' },
  { id: 'sus-8', text: 'I found the CDS system very cumbersome to use.' },
  { id: 'sus-9', text: 'I felt very confident using the CDS system.' },
  { id: 'sus-10', text: 'I needed to learn a lot of things before I could get going with this CDS system.' },
];

/** CDS-specific supplemental questions (5-point Likert). */
export const CUSTOM_CDS_QUESTIONS: SurveyQuestion[] = [
  { id: 'cds-1', text: 'The appropriateness score was understandable at a glance.' },
  { id: 'cds-2', text: 'I trusted the clinical rationale provided.' },
  { id: 'cds-3', text: 'Override reasons were easy to document.' },
  { id: 'cds-4', text: 'Alternatives were clinically relevant.' },
  { id: 'cds-5', text: 'The CDS interrupted my workflow appropriately.' },
];

export const LIKERT_LABELS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
] as const;

/**
 * Computes SUS score (0–100) from ten 1–5 Likert responses.
 */
export function computeSusScore(responses: number[]): number {
  if (responses.length !== 10) return 0;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const v = responses[i] ?? 3;
    sum += i % 2 === 0 ? v - 1 : 5 - v;
  }
  return sum * 2.5;
}

/**
 * Interprets a SUS score using Bangor et al. adjective ratings.
 */
export function interpretSusScore(score: number): { grade: string; adjective: string } {
  if (score >= 80.3) return { grade: 'A', adjective: 'Excellent' };
  if (score >= 68) return { grade: 'B', adjective: 'Good' };
  if (score >= 51) return { grade: 'C', adjective: 'OK' };
  if (score >= 36.9) return { grade: 'D', adjective: 'Poor' };
  return { grade: 'F', adjective: 'Awful' };
}
