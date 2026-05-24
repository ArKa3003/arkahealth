/**
 * @file scenarios.ts
 * @description Predefined usability test scenarios for CDS sidebar evaluation.
 */

import type { UsabilityTestScenario } from '@/lib/cds-platform/usability/testing-framework';

const baseScenario = {
  patientId: 'usability-demo-patient',
  age: 45,
  sex: 'Female' as const,
  redFlags: [],
};

/** Scenarios used by UsabilityTestRunner (Phase 11). */
export const USABILITY_TEST_SCENARIOS: UsabilityTestScenario[] = [
  {
    id: 'low-back-pain',
    name: 'Low back pain — no red flags',
    taskDescription:
      'Review the CDS recommendation for a 45-year-old with 2 weeks of low back pain. Decide whether to proceed with the ordered lumbar MRI.',
    maxTimeSeconds: 60,
    expectedAction: 'proceed',
    scenario: {
      ...baseScenario,
      chiefComplaint: 'Low back pain',
      clinicalHistory: 'Mechanical low back pain for 2 weeks, no trauma, no neurologic deficits',
      proposedImaging: {
        modality: 'MRI',
        bodyPart: 'Lumbar spine',
        urgency: 'Routine',
      },
      priorImaging: [{ modality: 'X-ray', bodyPart: 'Lumbar spine', daysAgo: 14 }],
    },
  },
  {
    id: 'headache-red-flag',
    name: 'Headache with red flags',
    taskDescription:
      'A stat head CT is ordered for sudden severe headache. Review alerts and choose the appropriate action.',
    maxTimeSeconds: 45,
    expectedAction: 'proceed',
    scenario: {
      ...baseScenario,
      age: 52,
      chiefComplaint: 'Thunderclap headache',
      clinicalHistory: 'Sudden onset worst headache of life, 2 hours ago',
      redFlags: [{ flag: 'Thunderclap headache', present: true }],
      proposedImaging: {
        modality: 'CT',
        bodyPart: 'Head',
        urgency: 'Stat',
      },
    },
  },
  {
    id: 'repeat-ct',
    name: 'Repeat CT within 90 days',
    taskDescription:
      'Prior CT abdomen 30 days ago. Evaluate the appropriateness alert and decide next steps.',
    maxTimeSeconds: 60,
    expectedAction: 'override',
    scenario: {
      ...baseScenario,
      age: 68,
      chiefComplaint: 'Abdominal pain',
      clinicalHistory: 'Recurrent RLQ pain, prior CT showed diverticulitis',
      proposedImaging: {
        modality: 'CT',
        bodyPart: 'Abdomen',
        urgency: 'Urgent',
      },
      priorImaging: [{ modality: 'CT', bodyPart: 'Abdomen', daysAgo: 30 }],
    },
  },
];
